import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Green API Configurations for different agents
const GREEN_API_ACCOUNTS = {
  // סוכן 1
  'agent1': {
    instance: process.env.GREEN_API_INSTANCE_1 || '',
    token: process.env.GREEN_API_TOKEN_1 || '',
    name: 'ארז',
    phone: '050-1111111'
  },
  // סוכן 2
  'agent2': {
    instance: process.env.GREEN_API_INSTANCE_2 || '',
    token: process.env.GREEN_API_TOKEN_2 || '',
    name: 'דיאנה',
    phone: '050-2222222'
  },
  // סוכן 3
  'agent3': {
    instance: process.env.GREEN_API_INSTANCE_3 || '',
    token: process.env.GREEN_API_TOKEN_3 || '',
    name: 'משה',
    phone: '050-3333333'
  },
  // ברירת מחדל - חשבון ראשי
  'default': {
    instance: process.env.GREEN_API_INSTANCE || '',
    token: process.env.GREEN_API_TOKEN || '',
    name: 'מערכת הזמנות',
    phone: '050-0000000'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, order, customer, agentId } = body;

    if (!order || !customer) {
      return NextResponse.json(
        { error: 'Missing order or customer data' },
        { status: 400 }
      );
    }

    // Get the agent's Green API credentials
    let agentConfig = GREEN_API_ACCOUNTS['default'];
    
    if (agentId) {
      // Try to get agent from database first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, phone, green_api_instance, green_api_token')
        .eq('id', agentId)
        .single();
      
      if (profile?.green_api_instance && profile?.green_api_token) {
        // Use agent's personal Green API account
        agentConfig = {
          instance: profile.green_api_instance,
          token: profile.green_api_token,
          name: profile.name,
          phone: profile.phone
        };
      } else if (GREEN_API_ACCOUNTS[agentId]) {
        // Use predefined agent config
        agentConfig = GREEN_API_ACCOUNTS[agentId];
      }
    }

    switch (method) {
      case 'whatsapp':
        return await sendWhatsApp(order, customer, agentConfig);
      case 'email':
        return await sendEmail(order, customer, agentConfig);
      case 'sms':
        return await sendSMS(order, customer, agentConfig);
      default:
        return NextResponse.json(
          { error: 'Invalid method' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error sending order:', error);
    return NextResponse.json(
      { error: 'Failed to send order' },
      { status: 500 }
    );
  }
}

async function sendWhatsApp(order: any, customer: any, agentConfig: any) {
  try {
    // Check if agent has Green API configured
    if (!agentConfig.instance || !agentConfig.token) {
      return NextResponse.json(
        { error: 'WhatsApp not configured for this agent' },
        { status: 400 }
      );
    }

    // Format phone number for WhatsApp (Israel +972)
    let phoneNumber = customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '972' + phoneNumber.substring(1);
    }

    // Format order message with agent info
    const message = formatOrderMessage(order, customer, agentConfig);

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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Green API error:', errorData);
      throw new Error('Failed to send WhatsApp message');
    }

    const result = await response.json();
    
    // Log the message in database
    await logMessageSent(order.id, customer.id, 'whatsapp', agentConfig.name);

    return NextResponse.json({ 
      success: true, 
      method: 'whatsapp',
      agent: agentConfig.name,
      messageId: result.idMessage 
    });
  } catch (error) {
    console.error('WhatsApp error:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

async function sendEmail(order: any, customer: any, agentConfig: any) {
  try {
    // Format email content with agent info
    const htmlContent = formatOrderEmail(order, customer, agentConfig);

    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Email would be sent to:', customer.email);
    console.log('From agent:', agentConfig.name);
    console.log('Email content:', htmlContent);

    // Log the message in database
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

async function sendSMS(order: any, customer: any, agentConfig: any) {
  // Placeholder for SMS integration
  return NextResponse.json({ 
    success: true, 
    method: 'sms', 
    agent: agentConfig.name,
    demo: true 
  });
}

function formatOrderMessage(order: any, customer: any, agentConfig: any) {
  let message = `🛍️ *אישור הזמנה #${order.id?.slice(0, 8)}*\n\n`;
  message += `שלום ${customer.name},\n`;
  message += `תודה על הזמנתך!\n\n`;
  
  message += `📦 *פרטי ההזמנה:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      message += `${index + 1}. ${item.product?.name || 'מוצר'}\n`;
      message += `   כמות: ${item.quantity}\n`;
      if (item.discount_percentage > 0) {
        message += `   הנחה: ${item.discount_percentage}%\n`;
      }
      message += `   מחיר: ₪${item.total_price}\n\n`;
    });
  }
  
  message += `💰 *סה"כ: ₪${order.total_amount}*\n\n`;
  message += `📍 סטטוס: ${translateStatus(order.status)}\n`;
  
  if (order.payment_plan) {
    message += `💳 תוכנית תשלום: ${order.payment_plan.name}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━\n`;
  message += `👤 *הסוכן שלך: ${agentConfig.name}*\n`;
  message += `📞 טלפון ישיר: ${agentConfig.phone}\n`;
  message += `\nלכל שאלה או בקשה, אני כאן בשבילך!\n`;
  message += `\nתודה שבחרת בנו! 🙏`;
  
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
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content { 
          padding: 30px; 
          background: #f9f9f9; 
        }
        .order-item { 
          background: white; 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 5px;
          border-right: 4px solid #667eea;
        }
        .total { 
          font-size: 24px; 
          font-weight: bold; 
          color: #27ae60;
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 5px;
          margin: 20px 0;
        }
        .agent-info {
          background: #e8f4f8;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ הזמנתך התקבלה בהצלחה!</h1>
          <p>הזמנה מספר: #${order.id?.slice(0, 8)}</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px;">שלום ${customer.name},</p>
          <p>תודה רבה על האמון! קיבלנו את הזמנתך ואנחנו מטפלים בה.</p>
          
          <h2>📦 פרטי ההזמנה:</h2>
          ${order.items?.map((item: any) => `
            <div class="order-item">
              <h3>${item.product?.name || 'מוצר'}</h3>
              <p>כמות: ${item.quantity} יחידות</p>
              ${item.discount_percentage > 0 ? `<p>הנחה: ${item.discount_percentage}%</p>` : ''}
              <p><strong>מחיר: ₪${item.total_price}</strong></p>
            </div>
          `).join('') || '<p>אין פריטים</p>'}
          
          <div class="total">
            💰 סה"כ לתשלום: ₪${order.total_amount}
          </div>
          
          <p><strong>📍 סטטוס הזמנה:</strong> ${translateStatus(order.status)}</p>
          
          ${order.payment_plan ? `
            <p><strong>💳 תוכנית תשלום:</strong> ${order.payment_plan.name}</p>
          ` : ''}
          
          <div class="agent-info">
            <h3>👤 הסוכן האישי שלך</h3>
            <p><strong>${agentConfig.name}</strong></p>
            <p>📞 טלפון ישיר: ${agentConfig.phone}</p>
            <p>אני כאן לכל שאלה או בקשה!</p>
          </div>
        </div>
        
        <div class="footer">
          <p>תודה שבחרת בנו! 🙏</p>
          <p style="color: #999; font-size: 12px;">
            הודעה זו נשלחה אוטומטית ממערכת ההזמנות
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
    // Log to order_events table
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
