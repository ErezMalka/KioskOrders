import { NextRequest, NextResponse } from 'next/server';

// Green API Configuration
const GREEN_API_INSTANCE = process.env.GREEN_API_INSTANCE || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

// Email Service Configuration (using SendGrid/Resend/etc)
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, order, customer } = body;

    if (!order || !customer) {
      return NextResponse.json(
        { error: 'Missing order or customer data' },
        { status: 400 }
      );
    }

    switch (method) {
      case 'whatsapp':
        return await sendWhatsApp(order, customer);
      case 'email':
        return await sendEmail(order, customer);
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

async function sendWhatsApp(order: any, customer: any) {
  try {
    // Format phone number for WhatsApp (Israel +972)
    let phoneNumber = customer.phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '972' + phoneNumber.substring(1);
    }

    // Format order message
    const message = formatOrderMessage(order, customer);

    // Send via Green API
    const response = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`,
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
      throw new Error('Failed to send WhatsApp message');
    }

    return NextResponse.json({ success: true, method: 'whatsapp' });
  } catch (error) {
    console.error('WhatsApp error:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

async function sendEmail(order: any, customer: any) {
  try {
    // Format email content
    const htmlContent = formatOrderEmail(order, customer);

    // For now, we'll use a placeholder
    // You can integrate with SendGrid, Resend, or any email service
    
    // Example with fetch to your email service
    // const response = await fetch('your-email-api-endpoint', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${EMAIL_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: customer.email,
    //     subject: `הזמנה #${order.id} - אישור`,
    //     html: htmlContent
    //   }),
    // });

    // For demo purposes
    console.log('Email would be sent to:', customer.email);
    console.log('Email content:', htmlContent);

    return NextResponse.json({ success: true, method: 'email', demo: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

function formatOrderMessage(order: any, customer: any) {
  let message = `🛍️ *אישור הזמנה #${order.id}*\n\n`;
  message += `שלום ${customer.name},\n\n`;
  message += `תודה על הזמנתך!\n\n`;
  message += `📦 *פרטי ההזמנה:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any, index: number) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   כמות: ${item.quantity}\n`;
      message += `   מחיר: ₪${item.total_price}\n\n`;
    });
  }
  
  message += `💰 *סה"כ: ₪${order.total_amount}*\n\n`;
  message += `📍 סטטוס: ${translateStatus(order.status)}\n`;
  
  if (order.payment_plan) {
    message += `💳 תוכנית תשלום: ${order.payment_plan.name}\n`;
  }
  
  message += `\n📞 לשאלות ובירורים:\n`;
  message += `☎️ 050-1234567\n`;
  message += `📧 info@company.com\n\n`;
  message += `תודה שבחרת בנו! 🙏`;
  
  return message;
}

function formatOrderEmail(order: any, customer: any) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .total { font-size: 20px; font-weight: bold; color: #27ae60; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>אישור הזמנה #${order.id}</h1>
        </div>
        <div class="content">
          <p>שלום ${customer.name},</p>
          <p>תודה על הזמנתך! להלן פרטי ההזמנה:</p>
          
          ${order.items?.map((item: any) => `
            <div class="order-item">
              <h3>${item.product.name}</h3>
              <p>כמות: ${item.quantity}</p>
              <p>מחיר: ₪${item.total_price}</p>
            </div>
          `).join('') || ''}
          
          <div class="total">
            סה"כ להזמנה: ₪${order.total_amount}
          </div>
          
          <p>סטטוס: ${translateStatus(order.status)}</p>
          
          ${order.payment_plan ? `<p>תוכנית תשלום: ${order.payment_plan.name}</p>` : ''}
        </div>
        <div class="footer">
          <p>לשאלות ובירורים:</p>
          <p>טלפון: 050-1234567 | אימייל: info@company.com</p>
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
