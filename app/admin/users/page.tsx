'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    name: string;
    phone: string;
    role: string;
    org_id: string;
  };
}

interface NewUser {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [currentUserId, setCurrentUserId] = useState('');
  
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'SALES_AGENT'
  });

  const roles = [
    { value: 'SUPER_ADMIN', label: 'סופר אדמין', color: '#e74c3c' },
    { value: 'ADMIN', label: 'מנהל', color: '#f39c12' },
    { value: 'SALES_AGENT', label: 'סוכן מכירות', color: '#3498db' },
    { value: 'VIEWER', label: 'צופה', color: '#95a5a6' }
  ];

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // בדוק הרשאות
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        setMessage('אין לך הרשאות לצפות בדף זה');
        setMessageType('error');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('Error checking permissions:', error);
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      // טען את כל המשתמשים עם הפרופילים שלהם
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // מיפוי הנתונים
      const usersWithProfiles = profiles?.map(profile => ({
        id: profile.id,
        email: '', // נטען בנפרד אם צריך
        created_at: profile.created_at,
        profile: {
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
          org_id: profile.org_id
        }
      })) || [];

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('שגיאה בטעינת משתמשים');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // יצירת משתמש ישירות דרך Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // יצירת פרופיל למשתמש
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          org_id: '11111111-1111-1111-1111-111111111111',
