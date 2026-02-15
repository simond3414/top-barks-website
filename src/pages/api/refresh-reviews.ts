import type { APIRoute } from 'astro';

export const prerender = false;

// Scheduled job handler for daily Google reviews refresh
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { env } = locals.runtime;
    
    // Check if this is a cron trigger or manual request
    // For manual refresh, use POST to /api/reviews with action: 'refresh_google'
    
    // Fetch Google reviews
    const googleReviews = await fetchGoogleReviews(env);
    
    // Get existing data to preserve Facebook reviews
    const cached = await env.REVIEWS?.get('reviews_data');
    const data = cached ? JSON.parse(cached) : {
      lastUpdated: new Date().toISOString(),
      googleReviews: [],
      facebookReviews: []
    };
    
    // Update only Google reviews, preserve Facebook
    data.googleReviews = googleReviews;
    data.lastUpdated = new Date().toISOString();
    
    // Save to KV
    await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled refresh: Updated ${googleReviews.length} Google reviews`,
        count: googleReviews.length,
        lastUpdated: data.lastUpdated
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Scheduled refresh error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Scheduled refresh failed'
      }),
      { status: 500 }
    );
  }
};

// Also allow POST for manual triggering
export const POST: APIRoute = async ({ locals, request }) => {
  // Check admin authentication for manual trigger
  const cookie = request.headers.get('cookie');
  if (!cookie || !cookie.includes('admin_session=authenticated')) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized' }),
      { status: 401 }
    );
  }
  
  // Delegate to main reviews API
  return GET({ locals, request, params: {}, url: new URL(request.url) } as any);
};

// Fetch Google Reviews via Places API (New)
async function fetchGoogleReviews(env: any) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.PLACE_ID || 'ChIJicTHUo0xeUgRQTRgWtd797A';
  
  if (!apiKey || apiKey === 'your_google_places_api_key_here') {
    console.error('Google Places API key not configured');
    return [];
  }
  
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews'
      }
    });
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    
    if (!data.reviews || !Array.isArray(data.reviews)) {
      return [];
    }
    
    return data.reviews.map((review: any, index: number) => ({
      id: `google_${index}_${Date.now()}`,
      source: 'google' as const,
      author: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating || 5,
      text: review.text?.text || review.originalText?.text || '',
      date: review.publishTime || new Date().toISOString(),
      url: `https://g.page/r/${placeId}/review`
    })).slice(0, 20);
    
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return [];
  }
}
