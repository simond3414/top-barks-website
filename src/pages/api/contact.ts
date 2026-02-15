import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    // TODO: Configure SMTP settings in .env file
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    // Example using nodemailer:
    
    // import nodemailer from 'nodemailer';
    // const transporter = nodemailer.createTransport({
    //   host: import.meta.env.SMTP_HOST,
    //   port: import.meta.env.SMTP_PORT,
    //   secure: true,
    //   auth: {
    //     user: import.meta.env.SMTP_USER,
    //     pass: import.meta.env.SMTP_PASS,
    //   },
    // });
    //
    // await transporter.sendMail({
    //   from: import.meta.env.SMTP_USER,
    //   to: 'mark@topbarks.co.uk',
    //   subject: `New Contact Form Submission from ${name}`,
    //   text: `
    //     Name: ${name}
    //     Email: ${email}
    //     Phone: ${phone || 'Not provided'}
    //     Service: ${service || 'Not specified'}
    //     Message: ${message}
    //   `,
    // });

    // For now, just log the data (in production, this would send an email)
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      service,
      message,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon!' 
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
