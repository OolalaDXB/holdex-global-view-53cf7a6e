import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Mail, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'magic-link' | 'forgot-password' | 'reset-password';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const isPasswordReset = searchParams.get('reset') === 'true';
  
  const [authMode, setAuthMode] = useState<AuthMode>(isPasswordReset ? 'reset-password' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signIn, signUp, signInWithMagicLink, resetPassword, updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user && authMode !== 'reset-password') {
      navigate('/');
    }
  }, [user, loading, navigate, authMode]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    if (authMode !== 'reset-password') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    }
    
    if (authMode === 'login' || authMode === 'signup') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (authMode === 'reset-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (authMode === 'reset-password') {
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Failed to update password",
            description: error.message,
          });
        } else {
          toast({
            title: "Password updated",
            description: "Your password has been successfully updated.",
          });
          navigate('/');
        }
      } else if (authMode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            variant: "destructive",
            title: "Failed to send reset email",
            description: error.message,
          });
        } else {
          setResetEmailSent(true);
          toast({
            title: "Check your email",
            description: "We've sent you a password reset link.",
          });
        }
      } else if (authMode === 'magic-link') {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          toast({
            variant: "destructive",
            title: "Failed to send magic link",
            description: error.message,
          });
        } else {
          setMagicLinkSent(true);
          toast({
            title: "Check your email",
            description: "We've sent you a magic link to sign in.",
          });
        }
      } else if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "An account with this email already exists. Please sign in instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Account created",
            description: "Welcome to Verso. You are now signed in.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
    setMagicLinkSent(false);
    setResetEmailSent(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl font-medium tracking-wide" style={{ color: '#F5F5F5' }}>
            Verso
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            See what you own
          </p>
        </div>

        {/* Password Reset Success */}
        {resetEmailSent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-medium text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We've sent a password reset link to <span className="text-foreground">{email}</span>. 
              Click the link to reset your password.
            </p>
            <Button
              variant="ghost"
              onClick={() => switchMode('login')}
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        ) : magicLinkSent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-medium text-foreground">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We've sent a magic link to <span className="text-foreground">{email}</span>. 
              Click the link to sign in.
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
              }}
              className="mt-4"
            >
              Use a different email
            </Button>
          </div>
        ) : authMode === 'reset-password' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium text-foreground">Set new password</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your new password below.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </>
        ) : authMode === 'forgot-password' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium text-foreground">Reset password</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className="bg-secondary border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className="bg-secondary border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {authMode !== 'magic-link' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className="bg-secondary border-border"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (authMode === 'magic-link' ? 'Sending...' : authMode === 'login' ? 'Signing in...' : 'Creating account...') 
                  : (authMode === 'magic-link' ? 'Send Magic Link' : authMode === 'login' ? 'Sign In' : 'Create Account')
                }
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Alternative auth methods */}
            {authMode === 'magic-link' ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => switchMode('login')}
              >
                Sign in with password
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => switchMode('magic-link')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Continue with Magic Link
              </Button>
            )}

            {/* Toggle */}
            <div className="mt-8 text-center">
              {authMode === 'magic-link' ? (
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't have an account? Create one
                </button>
              ) : authMode === 'login' ? (
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't have an account? Create one
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>

            {/* Demo Link */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Voir la démo
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
