'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: any;
  org_id: string;
}

interface InstallmentRange {
  min_months: number;
  max_months: number;
  interest_rate: number;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Payment Methods States
  const [creditCardEnabled, setCreditCardEnabled] = useState(true);
  const [creditCardFee, setCreditCardFee] = useState(2.5);
  const [maxInterestFree, setMaxInterestFree] = useState(3);
  const [installmentRanges, setInstallmentRanges] = useState<InstallmentRange[]>([
    { min_months: 2, max_months: 3, interest_rate: 0 },
    { min_months: 4, max_months: 6, interest_rate: 2.5 },
    { min_months: 7, max_months: 12, interest_rate: 4.5 },
    { min_months: 13, max_months: 24, interest_rate: 7 }
  ]);

  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [bankAccountDetails, setBankAccountDetails] = useState('');
  const [requireReference, setRequireReference] = useState('required');
  const [approvalDays, setApprovalDays] = useState(3);

  const [paymentSystemEnabled, setPaymentSystemEnabled] = useState(true);
  const [paymentApiKey, setPaymentApiKey] = useState('');
  const [paymentSecretKey, setPaymentSecretKey] = useState('');
  const [paymentEnvironment, setPaymentEnvironment] = useState('test');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [successUrl, setSuccessUrl] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');

  const [cashEnabled, setCashEnabled] = useState(false);
  const [cashDiscount, setCashDiscount] = useState(5);

  const [checkEnabled, setCheckEnabled] = useState(false);
  const [maxChecks, setMaxChecks] = useState(12);
  const [checkDays, setCheckDays] = useState(30);
  const [checkFee, setCheckFee] = useState(1.5);

  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(true);
  const [maxSplits, setMaxSplits] = useState(3);
  const [minSplitAmount, setMinSplitAmount] = useState(500);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.org_id) {
        setUserOrgId(profile.org_id);
        await loadPaymentSettings(profile.org_id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPaymentSettings = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('org_id', orgId);

      if (error) {
        console.error('Error loading payment settings:', error);
        return;
      }

      // Load settings from database
      data?.forEach(method => {
        switch(method.type) {
          case 'credit_card':
            setCreditCardEnabled(method.enabled);
            if (method.settings) {
              setCreditCardFee(method.settings.fee || 2.5);
              setMaxInterestFree(method.settings.max_interest_free || 3);
              setInstallmentRanges(method.settings.installment_ranges || installmentRanges);
            }
            break;
          case 'bank_transfer':
            setBankTransferEnabled(method.enabled);
            if (method.settings) {
              setBankAccountDetails(method.settings.account_details || '');
              setRequireReference(method.settings.require_reference || 'required');
              setApprovalDays(method.settings.approval_days || 3);
            }
            break;
          // Add other payment methods...
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!userOrgId) {
      alert('שגיאה: לא נמצא ארגון');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      // Prepare payment methods data
      const paymentMethods = [
        {
          org_id: userOrgId,
          type: 'credit_card',
          name: 'כרטיס אשראי',
          enabled: creditCardEnabled,
          settings: {
            fee: creditCardFee,
            max_interest_free: maxInterestFree,
            installment_ranges: installmentRanges
          }
        },
        {
          org_id: userOrgId,
          type: 'bank_transfer',
          name: 'העברה בנקאית',
          enabled: bankTransferEnabled,
          settings: {
            account_details: bankAccountDetails,
            require_reference: requireReference,
            approval_days: approvalDays
          }
        },
        {
          org_id: userOrgId,
          type: 'payment_system',
          name: 'PAYMENT System',
          enabled: paymentSystemEnabled,
          settings: {
            api_key: paymentApiKey,
            secret_key: paymentSecretKey,
            environment: paymentEnvironment,
            webhook_url: webhookUrl,
            success_url: successUrl,
            cancel_url: cancelUrl
          }
        },
        {
          org_id: userOrgId,
          type: 'cash',
          name: 'מזומן',
          enabled: cashEnabled,
          settings: {
            discount: cashDiscount
          }
        },
        {
          org_id: userOrgId,
          type: 'check',
          name: 'המחאה',
          enabled: checkEnabled,
          settings: {
            max_checks: maxChecks,
            check_days: checkDays,
            fee: checkFee
          }
        },
        {
          org_id: userOrgId,
          type: 'split_payment',
          name: 'תשלום מפוצל',
          enabled: splitPaymentEnabled,
          settings: {
            max_splits: maxSplits,
            min_split_amount: minSplitAmount
          }
        }
      ];

      // Delete existing settings and insert new ones
      await supabase
        .from('payment_methods')
        .delete()
        .eq('org_id', userOrgId);

      const { error } = await supabase
        .from('payment_methods')
        .insert(paymentMethods);

      if (error) {
        console.error('Error saving settings:', error);
        alert('שגיאה בשמירת ההגדרות');
        return;
      }

      setSuccessMessage('ההגדרות נשמרו בהצלחה!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error:', error);
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const addInstallmentRange = () => {
    setInstallmentRanges([...installmentRanges, { 
      min_months: 0, 
      max_months: 0, 
      interest_rate: 0 
    }]);
  };

  const removeInstallmentRange = (index: number) => {
    setInstallmentRanges(installmentRanges.filter((_, i) => i !== index));
  };

  const updateInstallmentRange = (index: number, field: string, value: number) => {
    const updated = [...installmentRanges];
    updated[index] = { ...updated[index], [field]: value };
    setInstallmentRanges(updated);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '32px', color: '#2d3748' }}>
        💳 הגדרות תשלומים
      </h1>

      {successMessage && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' }}>
        
        {/* Credit Card Settings */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: creditCardEnabled ? '2px solid #667eea' : '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#2d3748' }}>💳 כרטיס אשראי</h2>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={creditCardEnabled}
                onChange={(e) => setCreditCardEnabled(e.target.checked)}
                style={{ marginLeft: '10px' }}
              />
              <span>מופעל</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>עמלת כרטיס אשראי (%)</label>
            <input 
              type="number" 
              step="0.1" 
              value={creditCardFee}
              onChange={(e) => setCreditCardFee(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>תשלומים ללא ריבית (מקסימום)</label>
            <select 
              value={maxInterestFree}
              onChange={(e) => setMaxInterestFree(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <option value="1">תשלום אחד</option>
              <option value="3">עד 3 תשלומים</option>
              <option value="6">עד 6 תשלומים</option>
              <option value="12">עד 12 תשלומים</option>
            </select>
          </div>

          <div style={{ backgroundColor: '#f7fafc', borderRadius: '10px', padding: '15px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2d3748' }}>טבלת ריביות</h3>
            {installmentRanges.map((range, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px 80px 1fr 50px', 
                gap: '10px', 
                marginBottom: '10px',
                alignItems: 'center'
              }}>
                <input 
                  type="number" 
                  value={range.min_months}
                  onChange={(e) => updateInstallmentRange(index, 'min_months', parseInt(e.target.value))}
                  placeholder="מ-"
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                />
                <input 
                  type="number" 
                  value={range.max_months}
                  onChange={(e) => updateInstallmentRange(index, 'max_months', parseInt(e.target.value))}
                  placeholder="עד"
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                />
                <input 
                  type="number" 
                  step="0.1"
                  value={range.interest_rate}
                  onChange={(e) => updateInstallmentRange(index, 'interest_rate', parseFloat(e.target.value))}
                  placeholder="ריבית %"
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                />
                <button 
                  onClick={() => removeInstallmentRange(index)}
                  style={{ 
                    padding: '8px', 
                    backgroundColor: '#f56565', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  מחק
                </button>
              </div>
            ))}
            <button 
              onClick={addInstallmentRange}
              style={{ 
                marginTop: '10px',
                padding: '10px 20px', 
                backgroundColor: '#48bb78', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + הוסף טווח
            </button>
          </div>
        </div>

        {/* Bank Transfer Settings */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: bankTransferEnabled ? '2px solid #667eea' : '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#2d3748' }}>🏦 העברה בנקאית</h2>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={bankTransferEnabled}
                onChange={(e) => setBankTransferEnabled(e.target.checked)}
                style={{ marginLeft: '10px' }}
              />
              <span>מופעל</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>פרטי חשבון בנק</label>
            <input 
              type="text" 
              value={bankAccountDetails}
              onChange={(e) => setBankAccountDetails(e.target.value)}
              placeholder="בנק: לאומי, סניף: 900, חשבון: 12345678"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>דרוש אישור אסמכתא</label>
            <select 
              value={requireReference}
              onChange={(e) => setRequireReference(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <option value="required">חובה</option>
              <option value="optional">אופציונלי</option>
              <option value="not_required">לא נדרש</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>זמן המתנה לאישור (ימים)</label>
            <input 
              type="number" 
              value={approvalDays}
              onChange={(e) => setApprovalDays(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>

        {/* PAYMENT System Settings */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: paymentSystemEnabled ? '2px solid #667eea' : '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#2d3748' }}>🔒 PAYMENT System</h2>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={paymentSystemEnabled}
                onChange={(e) => setPaymentSystemEnabled(e.target.checked)}
                style={{ marginLeft: '10px' }}
              />
              <span>מופעל</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>API Key</label>
            <input 
              type="password" 
              value={paymentApiKey}
              onChange={(e) => setPaymentApiKey(e.target.value)}
              placeholder="הכנס API Key"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>Secret Key</label>
            <input 
              type="password" 
              value={paymentSecretKey}
              onChange={(e) => setPaymentSecretKey(e.target.value)}
              placeholder="הכנס Secret Key"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>סביבת עבודה</label>
            <select 
              value={paymentEnvironment}
              onChange={(e) => setPaymentEnvironment(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <option value="test">סביבת בדיקות (Sandbox)</option>
              <option value="production">סביבת ייצור (Production)</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>WebHook URL</label>
            <input 
              type="url" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://yoursite.com/webhook"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>

        {/* Split Payment Settings */}
        <div style={{ 
          backgroundColor: '#f0f4ff', 
          borderRadius: '15px', 
          padding: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: splitPaymentEnabled ? '2px solid #f5576c' : '2px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#2d3748' }}>✨ תשלום מפוצל</h2>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={splitPaymentEnabled}
                onChange={(e) => setSplitPaymentEnabled(e.target.checked)}
                style={{ marginLeft: '10px' }}
              />
              <span>מופעל</span>
            </label>
          </div>

          <p style={{ color: '#718096', marginBottom: '20px' }}>
            אפשר ללקוחות לפצל את התשלום בין מספר אמצעי תשלום שונים
          </p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>מקסימום פיצולים</label>
            <select 
              value={maxSplits}
              onChange={(e) => setMaxSplits(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
            >
              <option value="2">2 אמצעי תשלום</option>
              <option value="3">3 אמצעי תשלום</option>
              <option value="4">4 אמצעי תשלום</option>
              <option value="999">ללא הגבלה</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#4a5568' }}>סכום מינימום לפיצול (₪)</label>
            <input 
              type="number" 
              value={minSplitAmount}
              onChange={(e) => setMinSplitAmount(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
            />
          </div>

          <div style={{ 
            backgroundColor: 'rgba(102, 126, 234, 0.1)', 
            borderRadius: '8px', 
            padding: '15px',
            marginTop: '15px'
          }}>
            <p style={{ color: '#4a5568', fontSize: '14px' }}>
              💡 כשהאפשרות פעילה, בעמוד התשלום יופיע כפתור "פיצול תשלום" שיאפשר ללקוח לבחור כמה לשלם בכל אמצעי תשלום
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button 
          onClick={handleSaveSettings}
          disabled={loading}
          style={{ 
            padding: '15px 50px', 
            backgroundColor: loading ? '#cbd5e0' : '#667eea',
            color: 'white', 
            border: 'none', 
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'שומר...' : '💾 שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}
