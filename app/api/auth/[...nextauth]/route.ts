import NextAuth from 'next-auth';
import { authConfig } from '@/app/lib/auth';

export const { GET, POST } = NextAuth(authConfig); 