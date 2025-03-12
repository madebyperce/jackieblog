'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status, data: session } = useSession();
  
  // Log session status for debugging
  useEffect(() => {
    console.log('AdminLogin: Current session status:', status, session);
    
    // Check for URL parameters that might indicate a redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      const logoutParam = urlParams.get('logout');
      
      console.log('URL parameters:', { auth: authParam, logout: logoutParam });
    }
  }, [status, session]);

  // Function to handle logout
  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      await signOut({ redirect: false });
      console.log('Logged out via signOut API');
      
      // Clear any local storage or cookies that might be persisting
      if (typeof window !== 'undefined') {
        localStorage.clear();
        console.log('Cleared localStorage');
        
        // Clear cookies by setting them to expire
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('Attempted to clear cookies');
        
        // Force reload to ensure clean state
        window.location.href = '/admin?logout=' + Date.now();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted with password length:', password.length);
    setError('');
    setLoading(true);

    try {
      // Use a fixed admin email and the entered password
      console.log('Attempting to sign in with credentials:', {
        email: 'admin@example.com',
        passwordProvided: !!password
      });
      
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email: 'admin@example.com',
          password,
        });
        console.log('Sign in result:', JSON.stringify(result));
        
        if (result?.error) {
          console.error('Authentication error from NextAuth:', result.error);
          setError('Invalid password');
          setLoading(false);
        } else if (result?.ok) {
          console.log('Login successful, result.ok =', result.ok);
          
          // Force a full page reload to ensure the session is properly recognized
          console.log('Redirecting to admin page with timestamp');
          window.location.href = '/admin?auth=' + Date.now();
        } else {
          console.log('Unexpected result state:', result);
          setError('Unexpected authentication response');
          setLoading(false);
        }
      } catch (signInError) {
        console.error('Error during signIn call:', signInError);
        throw signInError;
      }
    } catch (error) {
      console.error('Login error (outer catch):', error);
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  // If already authenticated, show logout option
  if (status === 'authenticated' && session) {
    console.log('Rendering authenticated view with logout button');
    return (
      <div className="text-center">
        <p className="mb-4">You are already logged in as admin.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    );
  }

  console.log('Rendering login form, status:', status);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 text-red-500 text-sm rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Admin Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8bac98] focus:border-[#8bac98]"
          placeholder="Enter admin password"
          autoFocus
          required
        />
      </div>
      
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8bac98] hover:bg-[#7a9a87] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8bac98] disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </form>
  );
} 