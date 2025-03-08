import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Define the auth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Credentials',
      credentials: {
        password: { label: 'Admin Password', type: 'password' }
      },
      async authorize(credentials) {
        // Performance measurement
        const startTime = Date.now();
        
        // Get admin password from environment variable
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminPassword) {
          console.error('❌ AUTH ERROR: ADMIN_PASSWORD environment variable is not set');
          return null;
        }
        
        // Check if the provided password matches the admin password
        if (credentials?.password === adminPassword) {
          console.log('✅ AUTH SUCCESS: Admin login successful');
          // Return a user object if authentication is successful
          return { id: '1', name: 'Admin' };
        }
        
        // Explicitly log failed attempts
        console.log('❌ AUTH FAILED: Incorrect password provided');
        
        const endTime = Date.now();
        console.log(`⏱️ Auth attempt took ${endTime - startTime}ms`);
        
        // Return null if authentication fails
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin', // Custom sign-in page
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      // Add user info to the token
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      // Add user info to the session
      session.user = token.user;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'a-temporary-secret-for-development',
  debug: false, // Disable debug mode to reduce logging
};

// Export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Workaround for handling preflight requests
export async function OPTIONS() {
  return new Response(null, { status: 200 });
} 