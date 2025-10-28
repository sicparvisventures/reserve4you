'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
// Using semantic Tailwind classes and @apply helpers
import { useAuth } from '@/lib/auth/auth-provider';
import { config } from '@/lib/config';
import dynamic from 'next/dynamic';

const Particles = dynamic(() => import('@/components/particles/Particles'), { ssr: false });

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setError('');
    setSuccess('');

    try {
      const result = mode === 'signin' 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (result.success) {
        if (mode === 'signup' && 'requiresConfirmation' in result && result.requiresConfirmation) {
          setSuccess('Account created! Please check your email to confirm your account before signing in.');
        } else {
          // Redirect will be handled by the auth provider
          if (redirect) {
            window.location.href = `/${redirect}`;
          } else {
            window.location.href = '/app';
          }
        }
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setPending(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle(redirect || 'app');
      
      if (!result.success) {
        setError(result.error || 'Failed to sign in with Google');
        setGoogleLoading(false);
      }
      // On success, OAuth will redirect, so no need to reset loading state
    } catch (error) {
      setError('An unexpected error occurred');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg-subtle relative overflow-hidden">
      {/* Subtle background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-primary/15 to-primary/10 blur-3xl animate-float delay-200"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left side - Branding with Particles */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#FF5A5F] via-[#FF7A7F] to-[#FF6B70]">
          {/* Particles Background */}
          <div className="absolute inset-0">
            <Particles 
              particleColors={['#FFFFFF', '#FFF5F5', '#FFE8E8', '#FFD4D4']}
              particleCount={200}
              particleSpread={15}
              speed={0.12}
              particleBaseSize={100}
              moveParticlesOnHover={true}
              particleHoverFactor={0.8}
              alphaParticles={true}
              disableRotation={false}
              sizeRandomness={1.5}
              cameraDistance={16}
            />
          </div>
          
          {/* Subtle Light Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#FF4A4F]/20"></div>
        
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white animate-slide-up">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/25 backdrop-blur-md rounded-2xl mb-6 animate-scale-in shadow-2xl p-3">
                <Image
                  src="/raylogo.png"
                  alt="Reserve4You"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-4xl font-bold mb-4 animate-fade-in delay-100 leading-tight">
                <span className="text-white drop-shadow-lg">Welkom bij</span>
                <br />
                <span className="text-[#111111] drop-shadow-lg">Reserve</span>
                <span className="inline-flex items-center rounded-lg bg-white/20 backdrop-blur-sm px-2 py-1 ml-1 border border-white/30">
                  <span className="text-white drop-shadow-lg">4You</span>
                </span>
              </h1>
              <p className="text-lg text-white leading-relaxed animate-fade-in delay-200 max-w-md drop-shadow-md">
                Het intelligente boekingssysteem voor professionele bedrijven in heel België.
              </p>
            </div>
            
            <div className="space-y-4 animate-fade-in delay-300 max-w-md">
              <div className="flex items-center group">
                <div className="flex-shrink-0 w-7 h-7 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/40 transition-all duration-300">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-white text-sm font-medium drop-shadow">Real-time beschikbaarheid & tafeltoewijzing</span>
              </div>
              <div className="flex items-center group">
                <div className="flex-shrink-0 w-7 h-7 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/40 transition-all duration-300">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-white text-sm font-medium drop-shadow">Multi-locatie beheer met teamrollen</span>
              </div>
              <div className="flex items-center group">
                <div className="flex-shrink-0 w-7 h-7 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/40 transition-all duration-300">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-white text-sm font-medium drop-shadow">Geïntegreerde betalingen & aanbetalingen</span>
              </div>
            </div>

            {/* Trust Indicators - Compact */}
            <div className="mt-10 pt-6 border-t border-white/30 animate-fade-in delay-500">
              <div className="flex items-center space-x-6">
                <div className="text-white">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">500+</span>
                  <p className="text-xs drop-shadow">Bedrijven</p>
                </div>
                <div className="text-white">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">50K+</span>
                  <p className="text-xs drop-shadow">Boekingen</p>
                </div>
                <div className="text-white">
                  <span className="text-2xl font-bold text-white drop-shadow-lg">4.9</span>
                  <p className="text-xs drop-shadow">Waardering</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16 bg-gradient-to-br from-[#F7F7F9] to-white">
          <div className="w-full max-w-md mx-auto animate-slide-up delay-100">
            {/* Back to home link */}
            <div className="mb-6">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-[#FF5A5F] transition-colors group"
                style={{ transitionDuration: 'var(--duration-fast)' }}
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" style={{ transitionDuration: 'var(--duration-fast)' }} />
                Terug naar home
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6 animate-fade-in delay-200">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#FF5A5F] to-[#FF7A7F] rounded-xl shadow-lg mb-4 p-2">
                  <Image
                    src="/raylogo.png"
                    alt="Reserve4You"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[#111111] mb-2">
                {mode === 'signin' ? 'Welkom terug' : 'Start vandaag'}
              </h1>
              <p className="text-[#555555] text-sm">
                {mode === 'signin' 
                  ? 'Log in op je account' 
                  : 'Creëer je account'
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in delay-300">
              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-[#111111] font-semibold text-sm mb-1.5 block">
                  E-mailadres
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11 rounded-xl border-[#E7E7EC] focus:border-[#FF5A5F] focus:ring-[#FF5A5F] bg-white shadow-sm hover:shadow-md transition-all duration-200"
                  placeholder="jouw@email.nl"
                />
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-[#111111] font-semibold text-sm mb-1.5 block">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11 rounded-xl border-[#E7E7EC] focus:border-[#FF5A5F] focus:ring-[#FF5A5F] pr-12 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0A0] hover:text-[#555555] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-[#555555] mt-1.5">
                    Min. {config.auth.passwordMinLength} karakters met hoofdletter, cijfer en speciaal teken
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-[#E11D48]/5 border border-[#E11D48]/20 rounded-xl animate-scale-in">
                  <p className="text-[#E11D48] text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-[#18C964]/5 border border-[#18C964]/20 rounded-xl animate-scale-in">
                  <p className="text-[#18C964] text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={pending}
                className="w-full h-11 bg-gradient-to-r from-[#FF5A5F] to-[#FF7A7F] hover:from-[#FF4A4F] hover:to-[#FF6A6F] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    {mode === 'signin' ? 'Inloggen...' : 'Account aanmaken...'}
                  </>
                ) : (
                  mode === 'signin' ? 'Inloggen' : 'Account aanmaken'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 animate-fade-in delay-400">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E7E7EC]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-[#F7F7F9] to-white text-[#555555] font-medium">
                    Of ga verder met
                  </span>
                </div>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || pending}
              className="w-full h-11 mb-4 border-2 border-[#E7E7EC] rounded-xl bg-white hover:bg-[#FAFAFC] text-[#111111] font-semibold transition-all duration-200 hover:border-[#FF5A5F]/30 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in delay-500"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Verbinden met Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Doorgaan met Google
                </>
              )}
            </Button>

            {/* Switch mode */}
            <div className="text-center mt-4 animate-fade-in delay-600">
              <p className="text-sm text-[#555555]">
                {mode === 'signin' ? "Nog geen account?" : 'Heb je al een account?'}
                {' '}
                <Link 
                  href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                  className="font-semibold text-[#FF5A5F] hover:text-[#FF7A7F] transition-colors duration-200"
                >
                  {mode === 'signin' ? 'Maak account aan' : 'Log in'}
                </Link>
              </p>
            </div>

            {/* Trust indicator */}
            <div className="text-center mt-6 animate-fade-in delay-700">
              <div className="inline-flex items-center space-x-2 text-[#A0A0A0]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs">
                  Beveiligd met SSL encryptie
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
