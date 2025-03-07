import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please define NEXTAUTH_SECRET environment variable');
}

if (!process.env.ADMIN_PASSWORD) {
  throw new Error('Please define ADMIN_PASSWORD environment variable');
}

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Password',
      credentials: {
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter password'
        },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        if (credentials.password === process.env.ADMIN_PASSWORD) {
          return { 
            id: '1', 
            name: 'Admin',
            email: 'admin@example.com' 
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};

export default authOptions; 