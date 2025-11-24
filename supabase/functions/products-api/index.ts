import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/products-api/', '');

    if (path.startsWith('products/search')) {
      const name = url.searchParams.get('name') || '';
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${name}%`)
        .order('name');

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.startsWith('products/export')) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      const csvHeaders = 'name,unit,category,brand,stock,status,image\n';
      const csvRows = data.map((p: any) => 
        `"${p.name}","${p.unit}","${p.category}","${p.brand}",${p.stock},"${p.status}","${p.image || ''}"`
      ).join('\n');

      return new Response(csvHeaders + csvRows, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products.csv"',
        },
      });
    }

    if (path.startsWith('products/import') && req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      let added = 0;
      let skipped = 0;
      const duplicates: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/([^,"]+|"[^"]*")+/g) || [];
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '').trim() || '';
        });

        if (!row.name) {
          skipped++;
          continue;
        }

        const { data: existing } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', row.name)
          .maybeSingle();

        if (existing) {
          duplicates.push({ name: row.name, existingId: existing.id });
          skipped++;
          continue;
        }

        const { error } = await supabase.from('products').insert({
          name: row.name,
          unit: row.unit || 'pcs',
          category: row.category || 'Uncategorized',
          brand: row.brand || 'Unknown',
          stock: parseInt(row.stock) || 0,
          status: parseInt(row.stock) > 0 ? 'In Stock' : 'Out of Stock',
          image: row.image || null,
        });

        if (error) {
          skipped++;
        } else {
          added++;
        }
      }

      return new Response(JSON.stringify({ added, skipped, duplicates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.match(/^products\/[a-f0-9-]+\/history$/)) {
      const productId = path.split('/')[1];
      const { data, error } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.match(/^products\/[a-f0-9-]+$/) && req.method === 'PUT') {
      const productId = path.split('/')[1];
      const body = await req.json();

      if (body.name) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .ilike('name', body.name)
          .neq('id', productId)
          .maybeSingle();

        if (existing) {
          return new Response(JSON.stringify({ error: 'Product name already exists' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (body.stock !== undefined && (isNaN(body.stock) || body.stock < 0)) {
        return new Response(JSON.stringify({ error: 'Stock must be a number >= 0' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('products')
        .update(body)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.match(/^products\/[a-f0-9-]+$/) && req.method === 'DELETE') {
      const productId = path.split('/')[1];
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'products' && req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase
        .from('products')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path === 'products') {
      const category = url.searchParams.get('category');
      let query = supabase.from('products').select('*').order('name');
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});