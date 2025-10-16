import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, FileText, Calculator, TestTube2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (user && !loading) {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  const handleSignIn = () => {
    window.location.href = '/api/login';
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevLoading(true);

    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: devEmail,
          password: devPassword,
        }),
        credentials: 'include', // Important for session cookies
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Development login successful',
        });
        // Reload to trigger auth state update
        window.location.href = '/dashboard';
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Login failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive',
      });
    } finally {
      setDevLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary text-white p-3 rounded-lg">
              <FileText className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">PromptSubmissions</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered UK Corporate Compliance Platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your compliance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignIn}
              className="w-full"
              size="lg"
              data-testid="button-signin"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </Button>

            {isDevelopment && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or test with</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TestTube2 className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Development Login</span>
                  </div>
                  <form onSubmit={handleDevLogin} className="space-y-3">
                    <div>
                      <Label htmlFor="dev-email">Email</Label>
                      <Input
                        id="dev-email"
                        type="email"
                        placeholder="test@example.com"
                        value={devEmail}
                        onChange={(e) => setDevEmail(e.target.value)}
                        required
                        data-testid="input-dev-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dev-password">Password</Label>
                      <Input
                        id="dev-password"
                        type="password"
                        placeholder="Any password"
                        value={devPassword}
                        onChange={(e) => setDevPassword(e.target.value)}
                        required
                        data-testid="input-dev-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="outline"
                      disabled={devLoading}
                      data-testid="button-dev-login"
                    >
                      {devLoading ? 'Logging in...' : 'Dev Login'}
                    </Button>
                  </form>
                  <p className="text-xs text-yellow-700 mt-2">
                    For testing only • Accepts any password
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <Badge variant="outline" className="text-green-700">Secure</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Bank-level security for your financial data
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <Badge variant="outline" className="text-blue-700">AI-Powered</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automated compliance processing
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}