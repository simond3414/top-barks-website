import type { APIRoute } from 'astro';

export const prerender = false;

// Scheduled job handler for daily Google reviews refresh
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { env } = locals.runtime;
    
    // Get existing data first to preserve existing reviews
    const cached = await env.REVIEWS?.get('reviews_data');
    const data = cached ? JSON.parse(cached) : {
      lastUpdated: new Date().toISOString(),
      googleReviews: [],
      facebookReviews: []
    };
    
    // Fetch Google reviews, merging with existing ones
    const googleReviews = await fetchGoogleReviews(env, data.googleReviews || []);
    
    // Update Google reviews (accumulated), preserve Facebook
    data.googleReviews = googleReviews;
    data.lastUpdated = new Date().toISOString();
    
    // Save to KV
    await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled refresh: Accumulated ${googleReviews.length} unique Google reviews`,
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

// Helper function to merge and deduplicate reviews
function mergeAndDeduplicate(existing: any[], fresh: any[]): any[] {
  const allReviews = [...existing, ...fresh];
  const seen = new Map<string, any>();
  
  allReviews.forEach(review => {
    // Create unique key: author + first 100 chars of text + date (YYYY-MM-DD)
    const key = `${review.author}-${review.text.substring(0, 100)}-${review.date.substring(0, 10)}`;
    if (!seen.has(key)) {
      seen.set(key, review);
    }
  });
  
  // Sort by date (newest first)
  return Array.from(seen.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Fetch Google Reviews via Places API (New)
async function fetchGoogleReviews(env: any, existingReviews: any[] = []) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.PLACE_ID || 'ChIJicTHUo0xeUgRQTRgWtd797A';
  
  if (!apiKey || apiKey === 'your_google_places_api_key_here') {
    console.error('Google Places API key not configured');
    return existingReviews;
  }
  
  try {
    // Places API (New) endpoint - use specific field subfields
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews.rating,reviews.text.text,reviews.originalText.text,reviews.authorAttribution.displayName,reviews.authorAttribution.uri,reviews.publishTime`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews.rating,reviews.text.text,reviews.originalText.text,reviews.authorAttribution.displayName,reviews.authorAttribution.uri,reviews.publishTime'
      }
    });
    
    if (!response.ok) {
      return existingReviews;
    }
    
    const data = await response.json();
    
    if (!data.reviews || !Array.isArray(data.reviews)) {
      return existingReviews;
    }
    
    const freshReviews = data.reviews.map((review: any, index: number) => ({
      id: `google_${index}_${Date.now()}`,
      source: 'google' as const,
      author: review.authorAttribution?.displayName || 'Anonymous',
      rating: review.rating || 5,
      text: review.text?.text || review.originalText?.text || '',
      date: review.publishTime || new Date().toISOString(),
      url: `https://www.google.com/maps/place/?q=place_id:${placeId}`
    }));
    
    // Merge with existing and deduplicate
    return mergeAndDeduplicate(existingReviews, freshReviews);
    
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return existingReviews;
  }
}
