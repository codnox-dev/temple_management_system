import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const FuturisticTempleLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast.success('Login successful! Redirecting...');
        navigate('/admin');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError('Invalid username or password. Please try again.');
      toast.error('Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-900 text-white p-4" style={{
      backgroundImage: `url('https://www.transparenttextures.com/patterns/az-subtle.png'), linear-gradient(to right bottom, #1a202c, #2d3748, #4a5568)`,
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-2xl shadow-purple-500/10 z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Sanctum Access
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter the digital sanctum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-purple-300">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-white placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500 text-white placeholder-gray-500"
              />
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-purple-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </div>
              ) : 'Enter the Sanctum'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuturisticTempleLogin;
