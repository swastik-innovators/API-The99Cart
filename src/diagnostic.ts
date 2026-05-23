import { supabaseAdmin } from './config/supabase';

async function run() {
  console.log('--- DIAGNOSTIC RUN ---');
  
  // 1. Fetch all sellers
  const { data: sellers, error: sellerErr } = await supabaseAdmin
    .from('sellers')
    .select('*');
  
  console.log('Sellers Count:', sellers?.length, sellerErr || '');
  if (sellers) {
    console.log('Sellers Details:', sellers.map(s => ({ id: s.id, store_name: s.store_name, store_slug: s.store_slug })));
  }

  // 2. Fetch all profiles
  const { data: profiles, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('*');

  console.log('Profiles Count:', profiles?.length, profileErr || '');
  if (profiles) {
    console.log('Profiles Details:', profiles.map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role
    })));
  }

  // 3. Fetch all products
  const { data: products, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('*');

  console.log('Products Count:', products?.length, prodErr || '');
  if (products) {
    console.log('Products Details:', products.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      seller_id: p.seller_id,
      store_id: p.store_id,
      status: p.status
    })));
  }
}

run().catch(console.error);
