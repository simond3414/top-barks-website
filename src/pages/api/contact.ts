import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Disable prerendering for API routes that need to handle POST requests dynamically
export const prerender = false;

// Simple rate limiting (in-memory, resets on server restart)
// In production, use Redis or a database
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3; // Max 3 submissions per IP per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // First submission or window expired
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIp(request: Request): string {
  // Get IP from headers (works with Cloudflare and most proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback (not accurate in production)
  return 'unknown';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Access environment variables from Cloudflare runtime
    const { env } = locals.runtime;
    
    const ip = getClientIp(request);
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Too many submissions. Please try again in an hour.' 
        }), 
        { status: 429 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    const { name, email, phone, service, message } = data;
    
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Please fill in all required fields' 
        }), 
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Please enter a valid email address' 
        }), 
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const testMode = env.RESEND_TEST_MODE === 'true';
    
    // Log submission regardless of test mode
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      service,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      ip,
      timestamp,
      testMode,
    });

    if (testMode) {
      // Test mode: just log, don't send email
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test mode: Email logged but not sent. Set RESEND_TEST_MODE=false to enable actual sending.' 
        }), 
        { status: 200 }
      );
    }

    // Check for Resend API key
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey === 'your_resend_api_key_here') {
      console.error('Resend API key not configured. Available env vars:', Object.keys(env));
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured. Please contact the site administrator.' 
        }), 
        { status: 500 }
      );
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);
    
    const fromEmail = env.RESEND_FROM_EMAIL;
    const toEmail = env.CONTACT_EMAIL;
    
    if (!fromEmail || !toEmail) {
      console.error('Email configuration error: RESEND_FROM_EMAIL or CONTACT_EMAIL not set');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Server configuration error: email settings not configured' 
        }), 
        { status: 500 }
      );
    }
    
    // Format service name for display
    const serviceDisplay = service 
      ? service.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'Not specified';

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `New Contact Form: ${name} - ${serviceDisplay}`,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Service: ${serviceDisplay}
Submitted: ${new Date(timestamp).toLocaleString('en-GB')}
IP: ${ip}

Message:
${message}

---
This email was sent from the Top Barks Dog Training website contact form.
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3d6b3d 0%, #4a7c4a 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 20px; }
    .field-label { font-weight: bold; color: #3d6b3d; display: block; margin-bottom: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 16px; color: #333; }
    .message-box { background: white; padding: 20px; border-left: 4px solid #3d6b3d; border-radius: 4px; margin-top: 10px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .service-tag { display: inline-block; background: #e8f5e9; color: #3d6b3d; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐕 New Contact Form Submission</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Top Barks Dog Training</p>
  </div>
  
  <div class="content">
    <div class="field">
      <span class="field-label">Name</span>
      <span class="field-value">${name}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Email</span>
      <span class="field-value"><a href="mailto:${email}">${email}</a></span>
    </div>
    
    <div class="field">
      <span class="field-label">Phone</span>
      <span class="field-value">${phone || '<em style="color: #999;">Not provided</em>'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Service Interested In</span>
      <span class="service-tag">${serviceDisplay}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Message</span>
      <div class="message-box">
        ${message.replace(/\n/g, '<br>')}
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
      <p style="margin-top: 15px; color: #999;">
        This email was sent from the Top Barks Dog Training website contact form.<br>
        Reply directly to this email to respond to ${name}.
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to send email. Please try again later.' 
        }), 
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you! Your message has been sent successfully. Mark will get back to you within 24 hours.' 
      }), 
      { status: 200 }
      );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'There was an error sending your message. Please try again later.' 
      }), 
      { status: 500 }
    );
  }
};
