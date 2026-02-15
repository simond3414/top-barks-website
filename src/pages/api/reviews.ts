import type { APIRoute } from 'astro';

export const prerender = false;

interface Review {
  id: string;
  source: 'google' | 'facebook';
  author: string;
  rating: number;
  text: string;
  date: string;
  url?: string;
}

interface ReviewsData {
  lastUpdated: string;
  googleReviews: Review[];
  facebookReviews: Review[];
}

// Admin authentication - simple session-based
const ADMIN_PASSWORD = 'Mollymoo1';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function verifyAdminAuth(request: Request): boolean {
  const cookie = request.headers.get('cookie');
  if (!cookie) return false;
  
  const sessionMatch = cookie.match(/admin_session=([^;]+)/);
  if (!sessionMatch) return false;
  
  const session = sessionMatch[1];
  // Check if session is valid (in production, verify against KV storage)
  return session === 'authenticated';
}

// Helper function to merge and deduplicate reviews
function mergeAndDeduplicate(existing: Review[], fresh: Review[]): Review[] {
  const allReviews = [...existing, ...fresh];
  const seen = new Map<string, Review>();
  
  allReviews.forEach(review => {
    // Create unique key: author + first 100 chars of text + date (YYYY-MM-DD)
    const key = `${review.author}-${review.text.substring(0, 100)}-${review.date.substring(0, 10)}`;
    // If same key exists, keep the one with newer timestamp in the ID
    if (!seen.has(key)) {
      seen.set(key, review);
    }
  });
  
  // Sort by date (newest first)
  return Array.from(seen.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Fetch Google Reviews via Places API (New)
async function fetchGoogleReviews(env: any, existingReviews: Review[] = []): Promise<Review[]> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.PLACE_ID || 'ChIJicTHUo0xeUgRQTRgWtd797A';
  
  if (!apiKey || apiKey === 'your_google_places_api_key_here') {
    console.error('Google Places API key not configured');
    return existingReviews;
  }
  
  try {
    // Places API (New) endpoint
    // Use specific field subfields for proper data retrieval
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews.rating,reviews.text.text,reviews.originalText.text,reviews.authorAttribution.displayName,reviews.authorAttribution.uri,reviews.publishTime`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews.rating,reviews.text.text,reviews.originalText.text,reviews.authorAttribution.displayName,reviews.authorAttribution.uri,reviews.publishTime'
      }
    });
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
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

// GET reviews - returns cached reviews
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { env } = locals.runtime;
    
    // Get cached reviews from KV
    const cached = await env.REVIEWS?.get('reviews_data');
    
    if (!cached) {
      return new Response(
        JSON.stringify({ 
          reviews: [], 
          lastUpdated: null,
          message: 'No reviews cached yet' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data: ReviewsData = JSON.parse(cached);
    
    // Merge and sort reviews
    const allReviews = [...data.googleReviews, ...data.facebookReviews];
    allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return new Response(
      JSON.stringify({
        reviews: allReviews,
        lastUpdated: data.lastUpdated,
        googleCount: data.googleReviews.length,
        facebookCount: data.facebookReviews.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error loading reviews' 
      }),
      { status: 500 }
    );
  }
};

// POST - Admin only: Add Facebook review or refresh Google reviews
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const { env } = locals.runtime;
    const body = await request.json();
    const { action } = body;
    
    // Get existing data
    const cached = await env.REVIEWS?.get('reviews_data');
    const data: ReviewsData = cached ? JSON.parse(cached) : {
      lastUpdated: new Date().toISOString(),
      googleReviews: [],
      facebookReviews: []
    };
    
    if (action === 'refresh_google') {
      // Fetch fresh Google reviews, merging with existing ones
      const googleReviews = await fetchGoogleReviews(env, data.googleReviews);
      
      data.googleReviews = googleReviews;
      data.lastUpdated = new Date().toISOString();
      
      // Save to KV
      await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Accumulated ${googleReviews.length} unique Google reviews`,
          count: googleReviews.length,
          lastUpdated: data.lastUpdated
        }),
        { status: 200 }
      );
    }
    
    if (action === 'test_api') {
      // Test if Google Places API key is configured and working
      const apiKey = env.GOOGLE_PLACES_API_KEY;
      const placeId = env.PLACE_ID || 'ChIJicTHUo0xeUgRQTRgWtd797A';
      
      if (!apiKey || apiKey === 'your_google_places_api_key_here') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            apiConfigured: false,
            message: 'Google Places API key not configured'
          }),
          { status: 200 }
        );
      }
      
      try {
        // Make a test API call
        const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews`;
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'reviews'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return new Response(
            JSON.stringify({ 
              success: true, 
              apiConfigured: true,
              apiWorking: false,
              message: `API returned error ${response.status}: ${errorText}`
            }),
            { status: 200 }
          );
        }
        
        const apiData = await response.json();
        const reviewCount = apiData.reviews?.length || 0;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            apiConfigured: true,
            apiWorking: true,
            count: reviewCount,
            message: `API is working! Found ${reviewCount} reviews.`
          }),
          { status: 200 }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            apiConfigured: true,
            apiWorking: false,
            message: `API call failed: ${error.message}`
          }),
          { status: 200 }
        );
      }
    }
    
    if (action === 'add_facebook') {
      const { author, rating, text, date, url } = body;
      
      // Validate
      if (!author || !rating || !text || !date) {
        return new Response(
          JSON.stringify({ success: false, message: 'Missing required fields' }),
          { status: 400 }
        );
      }
      
      const newReview: Review = {
        id: `fb_${Date.now()}`,
        source: 'facebook',
        author,
        rating: parseInt(rating),
        text,
        date,
        url: url || 'https://facebook.com/topbarks'
      };
      
      data.facebookReviews.unshift(newReview);
      data.lastUpdated = new Date().toISOString();
      
      await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Facebook review added',
          review: newReview
        }),
        { status: 200 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { status: 400 }
    );
  } catch (error) {
    console.error('Reviews API error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
};

// PUT - Update Facebook review
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    if (!verifyAdminAuth(request)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const { env } = locals.runtime;
    const { id, author, rating, text, date, url } = await request.json();
    
    const cached = await env.REVIEWS?.get('reviews_data');
    if (!cached) {
      return new Response(
        JSON.stringify({ success: false, message: 'No reviews found' }),
        { status: 404 }
      );
    }
    
    const data: ReviewsData = JSON.parse(cached);
    const index = data.facebookReviews.findIndex(r => r.id === id);
    
    if (index === -1) {
      return new Response(
        JSON.stringify({ success: false, message: 'Review not found' }),
        { status: 404 }
      );
    }
    
    data.facebookReviews[index] = {
      ...data.facebookReviews[index],
      author: author || data.facebookReviews[index].author,
      rating: rating ? parseInt(rating) : data.facebookReviews[index].rating,
      text: text || data.facebookReviews[index].text,
      date: date || data.facebookReviews[index].date,
      url: url || data.facebookReviews[index].url
    };
    
    data.lastUpdated = new Date().toISOString();
    await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
    
    return new Response(
      JSON.stringify({ success: true, message: 'Review updated' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update review error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
};

// DELETE - Delete Facebook review
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    if (!verifyAdminAuth(request)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const { env } = locals.runtime;
    const { id } = await request.json();
    
    const cached = await env.REVIEWS?.get('reviews_data');
    if (!cached) {
      return new Response(
        JSON.stringify({ success: false, message: 'No reviews found' }),
        { status: 404 }
      );
    }
    
    const data: ReviewsData = JSON.parse(cached);
    data.facebookReviews = data.facebookReviews.filter(r => r.id !== id);
    data.lastUpdated = new Date().toISOString();
    
    await env.REVIEWS?.put('reviews_data', JSON.stringify(data));
    
    return new Response(
      JSON.stringify({ success: true, message: 'Review deleted' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete review error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
};
