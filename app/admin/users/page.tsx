import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, order, customer, userId } = body;

    if (!order || !customer) {
      return NextResponse.json(
        { error: 'Missing order or customer data' },
        { status: 400 }
      );
    }

    // Get agent configuration from database
    const agentConfig = await getAgentConfig(userId);

    if (!agentConfig.instance || !agentConfig.token) {
      console.error('No Green API configured for user:', userId);
      return NextResponse.json(
        { error: `WhatsApp לא מוגדר עבור המשתמש. יש להגדיר בהגדרות המערכת.` },
        { status: 400 }
      );
    }

    switch (method) {
      case 'whatsapp':
        return await sendWhatsApp(order, customer, agentConfig);
      case 'email':
        return await sendEmail(order, customer, agentConfig);
      default:
        return NextResponse.json(
          { error: 'Invalid method' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in send-order API:', error);
    return NextResponse.json(
      { error: 'Failed to send order' },
      { status: 500 }
    );
  }
}

async function getAgentConfig(userId: string | null) {
  if (!userId) {
    // Return default config if no user
    return {
      instance: process.env.GREEN_API_DEFAULT_INSTANCE || '',
      token: process.env.GREEN_API_DEFAULT_TOKEN || '',
      name: 'מערכת הזמנות',
      phone: process.env.COMPANY_PHONE || '050-0000000'
    };
  }

  try {
    // Get user profile with Green API settings
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, phone, green_api_instance, green_api_token, whatsapp_number')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    }

    if (profile?.green_api_instance && profile?.green_api_token) {
      return {
        instance: profile.green_api_instance,
        token: profile.green_api_token,
        name: profile.name || 'סוכן',
        phone: profile.whatsapp_number || profile.phone || '050-0000000'
      };
    }

    // Fall back to environment variables if no DB config
    return {
      instance: process.env.GREEN_API_DEFAULT_INSTANCE || '',
      token: process.env.GREEN_API_DEFAULT_TOKEN || '',
      name: profile?.name || 'סוכן',
      phone: profile?.phone || '050-0000000'
    };
  } catch (error) {
    console.error('Error getting agent config:', error);
    return {
      instance: process.env.GREEN_API_DEFAULT_INSTANCE || '',
      token: process.env.GREEN_API_DEFAULT_TOKEN || '',
      name: 'מערכת הזמנות',
      phone: process.env.COMPANY_PHONE || '050-0000000'
    };
  }
}

async function sendWhatsApp(order: any, customer: any, agentConfig: any) {
  try {
    // Format phone number for WhatsApp (Israel +972)
    let phoneNumber = customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '972' + phoneNumber.substring(1);
    }

    // Format order message with agent info
    const message = formatOrderMessage(order, customer, agentConfig);

    console.log('Sending WhatsApp via Green API:', {
      instance: agentConfig.instance,
      agent: agentConfig.name,
      to: phoneNumber
    });

    // Send via Green API
    const response = await fetch(
      `https://api.green-api.com/waInstance${agentConfig.instance}/sendMessage/${agentConfig.token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: `${phoneNumber}@c.us`,
          message: message
        }),
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Green API error response:', responseData);
      throw new Error(responseData.message || 'Failed to send WhatsApp message');
    }

    console.log('WhatsApp sent successfully:', responseData);

    // Log the message in database
    await logMessageSent(order.id, customer.id, 'whatsapp', agentConfig.name);

    return NextResponse.json({ 
      success: true, 
      method: 'whatsapp',
      agent: agentConfig.name,
      messageId: responseData.idMessage 
    });
  } catch (error) {
    console.error('WhatsApp error:', error);
    return NextResponse.json(
      { error: `Failed to send WhatsApp: ${error}` },
      { status: 500 }
    );
  }
}

async function sendEmail(order: any, customer: any, agentConfig: any) {
  try {
    const htmlContent = formatOrderEmail(order, customer, agentConfig);

    // TODO: Add actual email service integration
    console.log('Email would be sent to:', customer.email);
    console.log('From agent:', agentConfig.name);

    await logMessageSent(order.id, customer.id, 'email', agentConfig.name);

    return NextResponse.json({ 
      success: true, 
      method: 'email', 
      agent: agentConfig.name,
      demo: true 
    });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

function formatOrderMessage(order: any, customer: any, agentConfig: any) {
  let message = `🛍️ *אישור הזמנה #${order.id?.slice(0, 8) || 'חדשה'}*\n\n`;
  message += `שלום ${customer.name},\n`;
  message += `תודה על הזמנתך!\n\n`;
  
  message += `📦 *פרטי ההזמנה:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      message += `\n${index + 1}. ${item.product_name || item.product?.name || 'מוצר'}\n`;
      message += `   כמות: ${item.quantity}\n`;
      if (item.discount_percentage > 0) {
        message += `   הנחה: ${item.discount_percentage}%\n`;
      }
      message += `   מחיר: ₪${item.total_price}\n`;
    });
  }
  
  message += `\n💰 *סה"כ להזמנה: ₪${order.total_amount}*\n`;
  message += `\n📍 סטטוס: ${translateStatus(order.status)}\n`;
  
  if (order.payment_plan?.name) {
    message += `💳 תוכנית תשלום: ${order.payment_plan.name}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━\n`;
  message += `\n👤 *הסוכן האישי שלך: ${agentConfig.name}*\n`;
  message += `📞 טלפון ישיר: ${agentConfig.phone}\n`;
  message += `\n💬 אני כאן לכל שאלה או בקשה!\n`;
  message += `\n✨ תודה שבחרת בנו!`;
  
  return message;
}

function formatOrderEmail(order: any, customer: any, agentConfig: any) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          direction: rtl; 
          line-height: 1.6;
          background: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .content { 
          padding: 30px; 
        }
        .order-item { 
          background: #f9f9f9; 
          padding: 15px; 
          margin: 15px 0; 
          border-radius: 8px;
          border-right: 4px solid #667eea;
        }
        .total { 
          font-size: 24px; 
          font-weight: bold; 
          color: #27ae60;
          text-align: center;
          padding: 20px;
          background: #f0f8f0;
          border-radius: 8px;
          margin: 20px 0;
        }
        .agent-box {
          background: linear-gradient(135deg, #e8f4f8 0%, #f0e8ff 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #d0d0ff;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background: #f9f9f9;
          color: #666; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ הזמנתך התקבלה בהצלחה!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            הזמנה מספר: #${order.id?.slice(0, 8) || 'חדשה'}
          </p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">שלום ${customer.name},</p>
          <p>תודה רבה על האמון! קיבלנו את הזמנתך ואנחנו כבר מטפלים בה.</p>
          
          <h2 style="color: #667eea;">📦 פרטי ההזמנה:</h2>
          
          ${order.items?.map((item: any, index: number) => `
            <div class="order-item">
              <h3>${index + 1}. ${item.product_name || item.product?.name || 'מוצר'}</h3>
              <p>כמות: <strong>${item.quantity}</strong></p>
              ${item.discount_percentage > 0 ? `<p>הנחה: ${item.discount_percentage}%</p>` : ''}
              <p>מחיר: <strong>₪${item.total_price}</strong></p>
            </div>
          `).join('') || '<p>אין פריטים</p>'}
          
          <div class="total">
            💰 סה"כ לתשלום: ₪${order.total_amount}
          </div>
          
          <p><strong>📍 סטטוס:</strong> ${translateStatus(order.status)}</p>
          
          ${order.payment_plan?.name ? `<p><strong>💳 תוכנית תשלום:</strong> ${order.payment_plan.name}</p>` : ''}
          
          <div class="agent-box">
            <h3>👤 הסוכן האישי שלך</h3>
            <p><strong>${agentConfig.name}</strong></p>
            <p>📞 טלפון ישיר: ${agentConfig.phone}</p>
            <p>אני כאן לכל שאלה או בקשה!</p>
          </div>
        </div>
        
        <div class="footer">
          <p>תודה שבחרת בנו! 🙏</p>
          <p style="font-size: 12px; color: #999;">
            ${process.env.COMPANY_NAME || 'Bite'} | הודעה זו נשלחה אוטומטית
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function translateStatus(status: string) {
  const statusMap: { [key: string]: string } = {
    'pending': 'ממתין לאישור',
    'approved': 'אושר',
    'in_production': 'בייצור',
    'delivered': 'נמסר',
    'cancelled': 'בוטל'
  };
  return statusMap[status] || status;
}

async function logMessageSent(orderId: string, customerId: string, method: string, agentName: string) {
  try {
    await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        event_type: `message_sent_${method}`,
        description: `הודעה נשלחה ללקוח ב-${method} על ידי ${agentName}`,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging message:', error);
  }
}
