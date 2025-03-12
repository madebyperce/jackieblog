import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This endpoint is deprecated and will be removed in a future version
// Please use /api/photos endpoint instead
export async function POST(request: Request) {
  console.warn('DEPRECATED: /api/photos/upload endpoint is deprecated. Please use /api/photos endpoint instead.');
  
  // Create a new request to the main photos endpoint
  const newRequest = new Request('/api/photos', {
    method: 'POST',
    headers: request.headers,
    body: request.body
  });
  
  // Forward the request to the main photos endpoint
  return fetch(newRequest);
} 