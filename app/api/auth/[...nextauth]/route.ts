import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

// Create the handler using the authOptions
const handler = NextAuth(authOptions);

// Export the handler with the required methods
export { handler as GET, handler as POST };

// Workaround for handling preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 200 });
} 