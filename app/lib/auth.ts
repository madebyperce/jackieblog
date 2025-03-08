import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Define auth options
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Auth attempt:', { email: credentials?.email });
        
        if (!credentials?.email) {
          console.log('Email missing in credentials');
          return null;
        }
        
        if (!credentials?.password) {
          console.log('Password missing in credentials');
          return null;
        }

        // Get admin password from environment variable
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

        // Check if password matches
        if (credentials.password === adminPassword) {
          console.log('Authentication successful');
          return {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin',
            role: 'admin'
          };
        }

        console.log('Authentication failed: incorrect password');
        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback:', { hasUser: !!user, tokenBefore: token });
      if (user) {
        token.role = user.role;
      }
      console.log('JWT callback result:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { hasSession: !!session, hasToken: !!token });
      if (session.user) {
        // Add type assertion to fix TypeScript error
        (session.user as any).role = token.role as string;
      }
      console.log('Session callback result:', session);
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'a-temporary-secret-for-development',
}; 