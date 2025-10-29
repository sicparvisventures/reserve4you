'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

const NEWSLETTER_STORAGE_KEY = 'r4y-newsletter-shown';

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if popup has been shown before
    const hasBeenShown = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    
    if (!hasBeenShown) {
      // Show popup after 2 seconds delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setIsSubmitting(true);

    // Simulate API call - replace with actual newsletter subscription logic
    try {
      // TODO: Integrate with your newsletter service (Mailchimp, SendGrid, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      
      // Close popup after showing success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              duration: 0.5,
              bounce: 0.3
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90%] max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-background rounded-2xl shadow-2xl border-2 border-primary/20 overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-background/80 backdrop-blur-sm hover:bg-muted transition-all hover:scale-110 border border-border"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              {/* Content */}
              <div className="p-8 md:p-10">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 gradient-bg rounded-2xl p-3 shadow-lg">
                    <div className="relative w-full h-full">
                      <Image
                        src="/raylogo.png"
                        alt="Reserve4You Logo"
                        fill
                        className="object-contain"
                        quality={100}
                      />
                    </div>
                  </div>
                </div>

                {!isSuccess ? (
                  <>
                    {/* Heading */}
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">
                      Blijf op de hoogte
                    </h2>
                    
                    <p className="text-center text-muted-foreground mb-6 text-sm md:text-base leading-relaxed">
                      Schrijf je in voor onze nieuwsbrief en ontvang exclusieve aanbiedingen, 
                      nieuwe locaties en handige tips voor het maken van reserveringen.
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="Jouw e-mailadres"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 px-4 text-base rounded-xl border-2 border-border focus:border-primary transition-colors"
                          disabled={isSubmitting}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 gradient-bg text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-base font-semibold"
                      >
                        {isSubmitting ? 'Even geduld...' : 'Inschrijven'}
                      </Button>
                    </form>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Je kunt je op elk moment uitschrijven. We respecteren je privacy.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Bedankt voor je inschrijving
                    </h3>
                    <p className="text-muted-foreground">
                      Je ontvangt binnenkort onze nieuwsbrief.
                    </p>
                  </div>
                )}
              </div>

              {/* Decorative gradient bar at bottom */}
              <div className="h-1.5 gradient-bg-warm" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

