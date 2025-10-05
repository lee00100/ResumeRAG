import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Icons } from './Icons';

export const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@mail.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginView && !name)) {
        setError('All fields are required.');
        return;
    }
    setError(null);
    setIsLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    // Reset fields, but keep admin credentials for easy login demo
    if (isLoginView) {
        setEmail('admin@mail.com');
        setPassword('admin123');
    } else {
        setEmail('');
        setPassword('');
    }
    setName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
                <div className="bg-primary text-white p-3 rounded-xl">
                    <Icons.Logo className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-secondary-dark dark:text-gray-100">
                    ResumeRAG
                </h1>
            </div>
            <h2 className="text-xl font-bold text-secondary-dark dark:text-gray-200">{isLoginView ? 'Welcome Back' : 'Create an Account'}</h2>
            <p className="text-secondary dark:text-gray-400 mt-1">{isLoginView ? 'Sign in to continue' : 'Get started with your job search'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="admin@mail.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
                autoComplete={isLoginView ? "current-password" : "new-password"}
                required
              />
            </div>
            {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Icons.Spinner className="h-5 w-5 animate-spin" />}
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={toggleView} className="font-medium text-primary hover:text-primary-dark focus:outline-none focus:underline">
              {isLoginView ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};