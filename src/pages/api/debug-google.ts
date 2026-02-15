import type { APIRoute } from 'astro';

export const prerender = false;

// Debug endpoint to test Google Places API connectivity
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { env } = locals.runtime;
    
    const apiKey = env.GOOGLE_PLACES_API_KEY;
    const placeId = env.PLACE_ID || 'ChIJicTHUo0xeUgRQTRgWtd797A';
    
    const diagnostics: any = {
      environment: {
        apiKeyPresent: !!apiKey && apiKey !== 'your_google_places_api_key_here',
        apiKeyLength: apiKey ? apiKey.length : 0,
        placeId: placeId,
        placeIdValid: placeId && placeId.startsWith('ChIJ'),
      },
      apiTest: {
        attempted: true,
        endpoint: `https://places.googleapis.com/v1/places/${placeId}`,
      }
    };
    
    if (!apiKey || apiKey === 'your_google_places_api_key_here') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured',
          diagnostics
        }, null, 2),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Test 1: Simple reviews field mask (current approach)
    const testUrl1 = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews`;
    const response1 = await fetch(testUrl1, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews'
      }
    });
    
    const result1: any = {
      status: response1.status,
      statusText: response1.statusText,
      ok: response1.ok
    };
    
    let data1 = null;
    let error1 = null;
    
    if (response1.ok) {
      try {
        data1 = await response1.json();
        result1.reviewCount = data1.reviews?.length || 0;
        result1.hasReviews = !!data1.reviews;
        result1.reviewsStructure = data1.reviews ? Object.keys(data1.reviews) : null;
        if (data1.reviews && data1.reviews.length > 0) {
          result1.firstReviewSample = {
            hasRating: 'rating' in data1.reviews[0],
            hasText: !!data1.reviews[0].text,
            hasAuthor: !!data1.reviews[0].authorAttribution,
            hasPublishTime: 'publishTime' in data1.reviews[0],
            rawKeys: Object.keys(data1.reviews[0])
          };
        }
      } catch (e) {
        error1 = (e as Error).message;
      }
    } else {
      error1 = await response1.text();
    }
    
    diagnostics.apiTest.test1 = {
      ...result1,
      error: error1,
      rawData: data1
    };
    
    // Test 2: Specific field mask approach
    const testUrl2 = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews.rating,reviews.text.text,reviews.authorAttribution.displayName,reviews.publishTime`;
    const response2 = await fetch(testUrl2, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews.rating,reviews.text.text,reviews.authorAttribution.displayName,reviews.publishTime'
      }
    });
    
    const result2: any = {
      status: response2.status,
      statusText: response2.statusText,
      ok: response2.ok
    };
    
    let data2 = null;
    let error2 = null;
    
    if (response2.ok) {
      try {
        data2 = await response2.json();
        result2.reviewCount = data2.reviews?.length || 0;
        result2.hasReviews = !!data2.reviews;
        if (data2.reviews && data2.reviews.length > 0) {
          result2.firstReviewSample = {
            rating: data2.reviews[0].rating,
            hasText: !!data2.reviews[0].text,
            hasTextText: !!data2.reviews[0].text?.text,
            author: data2.reviews[0].authorAttribution?.displayName,
            publishTime: data2.reviews[0].publishTime
          };
        }
      } catch (e) {
        error2 = (e as Error).message;
      }
    } else {
      error2 = await response2.text();
    }
    
    diagnostics.apiTest.test2 = {
      ...result2,
      error: error2,
      rawData: data2
    };
    
    // Also check KV storage
    let kvData = null;
    try {
      const kvRaw = await env.REVIEWS?.get('reviews_data');
      if (kvRaw) {
        kvData = JSON.parse(kvRaw);
      }
    } catch (e) {
      diagnostics.kvError = (e as Error).message;
    }
    
    diagnostics.kvStorage = {
      hasData: !!kvData,
      googleReviewsCount: kvData?.googleReviews?.length || 0,
      facebookReviewsCount: kvData?.facebookReviews?.length || 0,
      lastUpdated: kvData?.lastUpdated
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Google Places API diagnostic complete',
        diagnostics
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        stack: (error as Error).stack
      }, null, 2),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
