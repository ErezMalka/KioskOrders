import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// יצירת Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // צריך להוסיף ב-Vercel
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role } = body;

    // בדיקת הרשאות - רק SUPER_ADMIN
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // יצירת משתמש חדש
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // אישור אוטומטי של האימייל
      user_metadata: {
        name: name
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // יצירת פרופיל למשתמש
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        name: name,
        phone: phone,
        role: role,
        org_id: '11111111-1111-1111-1111-111111111111', // ברירת מחדל
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // אם נכשל ביצירת הפרופיל, מחק את המשתמש
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        name: name,
        role: role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
