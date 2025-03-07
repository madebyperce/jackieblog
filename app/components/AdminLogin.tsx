'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LoginForm {
  password: string;
}

export default function AdminLogin() {
  const { data: session, status } = useSession();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginForm>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('password', {
          type: 'manual',
          message: 'Invalid password',
        });
      } else {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('password', {
        type: 'manual',
        message: 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user) {
    return (
      <div className="flex justify-between items-center bg-green-100 p-4 rounded-lg">
        <span className="text-green-800">Logged in as admin</span>
        <button
          onClick={async () => {
            const data = await signOut({ redirect: false });
            router.push('/');
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          type="password"
          {...register('password', { required: 'Password is required' })}
          placeholder="Enter admin password"
          className="w-full p-2 border rounded"
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login as Admin'}
      </button>
    </form>
  );
} 