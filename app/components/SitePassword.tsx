'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface PasswordForm {
  password: string;
}

export default function SitePassword({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>();
  
  useEffect(() => {
    // Check if user has already entered password
    const hasAccess = localStorage.getItem('siteAccess');
    if (hasAccess === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const onSubmit = async (data: PasswordForm) => {
    // You can change this to any password you want
    if (data.password === 'jackie') {
      setIsAuthenticated(true);
      localStorage.setItem('siteAccess', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Jackie's Blog</h2>
          <p className="text-gray-600 mb-6 text-center">Please enter the password to view the site</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="Enter password"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Enter Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 