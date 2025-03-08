import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a minimal middleware that does nothing but satisfy Next.js requirements
export function middleware(request: NextRequest) {
  // Just pass through all requests
  return NextResponse.next();
}

// Empty matcher to avoid running on any routes
export const config = {
  matcher: [],
}; 