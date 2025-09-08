import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-expect-error - temporary workaround for react-hook-form import issue
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MessageCircle, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const signupSchema = z.object({
  username: z
    .string()
    .min(6, 'Username must be at least 6 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

type UsernameStatus = {
  status: 'idle' | 'checking' | 'available' | 'unavailable';
  message?: string | null;
};

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({ status: 'idle' });
  const { refetchUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const watchedUsername = form.watch("username");

  useEffect(() => {
    if (watchedUsername.length > 0 && watchedUsername.length < 6) {
      setUsernameStatus({ status: 'unavailable', message: "Username must be at least 6 characters" });
      return;
    }
    
    if (watchedUsername.length === 0) {
      setUsernameStatus({ status: 'idle' });
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus({ status: 'checking' });
      try {
        const response = await fetch(`http://localhost:3000/api/auth/check-username?username=${watchedUsername}`);
        const data = await response.json();
        if (data.available) {
          setUsernameStatus({ status: 'available', message: 'Username is available!' });
        } else {
          setUsernameStatus({ status: 'unavailable', message: data.message || 'Username is already taken.' });
        }
      } catch (err) {
        setUsernameStatus({ status: 'unavailable', message: 'Could not verify username.' });
      }
    };

    const debounceTimer = setTimeout(() => {
      checkUsername();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [watchedUsername]);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
     
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      // Refetch user data to update the global auth state.
      await refetchUser();
      
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Signup Form */}
        <Card className="bg-card border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-card-foreground">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your username"
                          className="bg-input border-border"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                      {usernameStatus.status === 'checking' && (
                        <p className="text-sm text-muted-foreground flex items-center pt-2">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking availability...
                        </p>
                      )}
                      {usernameStatus.status === 'available' && usernameStatus.message && (
                        <Alert variant="destructive" className="mt-2 border-green-600">
                          <CheckCircle className="h-4 w-4 stroke-green-600" />
                          <AlertDescription className="text-green-600">{usernameStatus.message}</AlertDescription>
                        </Alert>
                      )}
                      {usernameStatus.status === 'unavailable' && usernameStatus.message && (
                        <Alert variant="destructive" className="mt-2">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{usernameStatus.message}</AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="bg-input border-border"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-card-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="bg-input border-border pr-10"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </Form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
