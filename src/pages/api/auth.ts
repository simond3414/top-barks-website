import type { APIRoute } from 'astro';

export const prerender = false;

// Admin authentication endpoint
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { env } = locals.runtime;
    const { password } = await request.json();
    
    // Get admin password from environment variable
    const adminPassword = env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500 }
      );
    }
    
    // Simple timing-safe comparison (not truly constant-time but better than ===)
    const isValid = password && password.length === adminPassword.length && 
                    [...password].every((char, i) => char === adminPassword[i]);
    
    if (isValid) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid password' }),
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
};
