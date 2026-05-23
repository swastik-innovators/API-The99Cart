import { supabaseAdmin } from "./config/supabase";

async function seedAdmin() {
  const adminEmail = "admin@the99cart.com";
  const adminPassword = "Admin@07";

  console.log(`\n🚀 Starting database seed for admin: ${adminEmail}...`);

  try {
    // 1. Check if user already exists in profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();

    if (profile) {
      console.log(`ℹ️ Admin user already exists. Cleaning up old record...`);
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
      if (deleteAuthError) {
        console.error(`⚠️ Failed to delete existing auth user:`, deleteAuthError.message);
      }
      
      // Also delete from profiles if cascade didn't catch it
      await supabaseAdmin.from("profiles").delete().eq("id", profile.id);
    }

    // 2. Create user via Supabase Auth Admin
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Master Admin",
        role: "admin"
      }
    });

    if (createAuthError) {
      throw new Error(`Failed to create auth user: ${createAuthError.message}`);
    }

    if (!authData.user) {
      throw new Error("No user returned from auth creation");
    }

    console.log(`✅ Auth user created successfully. ID: ${authData.user.id}`);

    // 3. Ensure profiles table row has the correct role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: adminEmail,
        full_name: "Master Admin",
        role: "admin",
        is_verified: true,
        onboarding_completed: true
      }, {
        onConflict: "id"
      });

    if (profileError) {
      throw new Error(`Failed to upsert profile: ${profileError.message}`);
    }

    console.log(`✅ Admin profile initialized with 'admin' role successfully!`);
    console.log(`\n🎉 SEEDING COMPLETED!`);
    console.log(`-----------------------------------------------`);
    console.log(`Login Email:    ${adminEmail}`);
    console.log(`Login Password: ${adminPassword}`);
    console.log(`-----------------------------------------------\n`);
    process.exit(0);

  } catch (err: any) {
    console.error(`\n❌ Seeding failed with error:`, err.message);
    process.exit(1);
  }
}

seedAdmin();
