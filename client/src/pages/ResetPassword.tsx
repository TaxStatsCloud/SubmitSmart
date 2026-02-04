import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Lock, Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      setIsVerifying(false);
      setError('No reset token provided');
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`/api/verify-reset-token?token=${tokenToVerify}`);
      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        setEmail(data.email);
      } else {
        setError(data.message || 'Invalid or expired reset link');
      }
    } catch (err) {
      setError('Failed to verify reset link');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: 'Password Reset',
          description: 'Your password has been reset successfully.',
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to reset password',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
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
            <CardTitle>
              {isSuccess ? 'Password Reset Complete' : error ? 'Reset Link Invalid' : 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? 'You can now sign in with your new password'
                : error
                ? 'This password reset link is no longer valid'
                : `Enter a new password for ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSuccess ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your password has been reset successfully. Redirecting you to the login page...
                  </AlertDescription>
                </Alert>
                <Button asChild className="w-full">
                  <Link href="/login">Go to Sign In</Link>
                </Button>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/forgot-password">Request New Reset Link</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}

            {!isSuccess && !error && (
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Your password must be at least 6 characters long.
        </p>
      </div>
    </div>
  );
}
