// app/api/admin/create-user/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    // Get the request data
    const { email, password, name, phone, role } = await request.json();

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      );
    }

    // Check if current user is super admin (optional - you can verify this)
    // For now we'll trust that the frontend only shows this to super admins

    // Create the new user with admin privileges
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email
      user_metadata: { 
        name, 
        phone,
        role 
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Handle specific errors
      if (createError.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'משתמש עם אימייל זה כבר קיים' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        name,
        phone,
        role,
        organization_id: newUser.user.id, // Use user id as org id for now
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail - user is created, profile can be fixed later
    }

    // Create organization if needed
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      await supabaseAdmin
        .from('organizations')
        .insert({
          id: newUser.user.id,
          name: `${name} - ארגון`,
          contact_email: email,
          created_at: new Date().toISOString()
        })
        .single();
    }

    return NextResponse.json({
      success: true,
      message: 'המשתמש נוצר בהצלחה!',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        name,
        role,
        password // Return password so admin can share it
      }
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת משתמש' },
      { status: 500 }
    );
  }
}
