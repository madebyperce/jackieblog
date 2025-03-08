'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';

interface LoginForm {
  password: string;
}

export default function AdminLogin() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginForm>();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        password: data.password,
        redirect: false,
        callbackUrl: '/admin'
      });

      if (result?.error) {
        setError('password', {
          type: 'manual',
          message: 'Invalid password',
        });
      } else {
        window.location.href = '/admin';
      }
    } catch (error) {
      setError('password', {
        type: 'manual',
        message: 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <input
          type="password"
          {...register('password', { required: 'Password is required' })}
          placeholder="Admin password"
          className="w-full p-2 border rounded focus:border-blue-500 focus:ring focus:ring-blue-200"
          autoComplete="current-password"
          autoFocus
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
} 