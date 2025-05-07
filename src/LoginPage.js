import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { authService } from './api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Call the login API
      const credentials = { username, password };
      await authService.login(credentials);
      navigate('/schedule');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Schedule Manager</h1>
          <p className="text-gray-600">Sign in to manage your schedule</p>
        </div>
        
        <div className={`bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm transition-all duration-300 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px] pointer-events-none'}`}>
          {error}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="MyUsername"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center space-x-2"
          >
            {isLoading && (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md text-center text-sm text-gray-600">
          <p>Use demo credentials:</p>
          <p>Username: MyUsername</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
}