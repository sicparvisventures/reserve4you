'use client';

import {
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Immersive intro hero that overlays the homepage with a short video.
 * - Appears on load (desktop + mobile) and auto-fades away.
 * - Optional tap/klik om te skippen.
 * - Adds subtle parallax on cursor/pointer movement for a premium feel.
 */

const EXIT_DELAY_MS = 5200;
const EXIT_ANIMATION_MS = 650;

export function VideoHeroSection() {
  const [isMounted, setIsMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasInteractedRef = useRef(false); // Use ref to track interaction state in event handlers

  // Ensure video plays automatically and continues playing
  useEffect(() => {
    if (videoRef.current && isMounted) {
      const video = videoRef.current;
      
      // Set video attributes FIRST before trying to play
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      
      // Function to attempt playing the video
      const attemptPlay = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          video.muted = true;
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Video is playing');
                hasInteractedRef.current = true;
                setHasUserInteracted(true);
              })
              .catch((error) => {
                console.log('⚠️ Autoplay prevented, will start on user interaction');
                // Video will start on first user interaction
              });
          }
        }
      };

      // Try to play when video can play
      const handleCanPlay = () => {
        console.log('🎬 Video can play - attempting to start...');
        attemptPlay();
      };

      const handleLoadedData = () => {
        console.log('📦 Video data loaded');
        attemptPlay();
      };

      const handleLoadedMetadata = () => {
        console.log('📋 Video metadata loaded');
        if (video.readyState >= 2) {
          attemptPlay();
        }
      };

      // Function to start video on user interaction (fallback if autoplay blocked)
      const startVideoOnInteraction = () => {
        if (video.paused && video.readyState >= 2) {
          video.muted = true;
          video.play()
            .then(() => {
              console.log('✅ Video started after user interaction');
              hasInteractedRef.current = true;
              setHasUserInteracted(true);
            })
            .catch((error) => {
              console.warn('⚠️ Failed to start video:', error);
            });
        }
      };

      // Monitor video state and ensure it keeps playing
      const handlePause = () => {
        if (!video.ended && isMounted) {
          // Auto-resume if paused unintentionally
          setTimeout(() => {
            if (video.paused && !video.ended && isMounted) {
              video.play().catch(() => {});
            }
          }, 100);
        }
      };

      const handleEnded = () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      };

      // Add event listeners
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      
      // Load the video explicitly
      video.load();
      
      // Try to play after a short delay
      const playTimeout = setTimeout(() => {
        attemptPlay();
      }, 200);

      // Add page-level interaction listeners as fallback
      const handlePageInteraction = () => {
        if (!hasInteractedRef.current) {
          startVideoOnInteraction();
        }
      };

      document.addEventListener('mousemove', handlePageInteraction, { once: true, capture: true });
      document.addEventListener('touchstart', handlePageInteraction, { once: true, capture: true });
      document.addEventListener('click', handlePageInteraction, { once: true, capture: true });
      document.addEventListener('pointermove', handlePageInteraction, { once: true, capture: true });

      return () => {
        clearTimeout(playTimeout);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        document.removeEventListener('mousemove', handlePageInteraction, { capture: true } as any);
        document.removeEventListener('touchstart', handlePageInteraction, { capture: true } as any);
        document.removeEventListener('click', handlePageInteraction, { capture: true } as any);
        document.removeEventListener('pointermove', handlePageInteraction, { capture: true } as any);
      };
    }
  }, [isMounted]);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setIsExiting(true), EXIT_DELAY_MS);
    return () => window.clearTimeout(exitTimer);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      document.body.style.overflow = '';
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isExiting) return;
    const removeTimer = window.setTimeout(() => setIsMounted(false), EXIT_ANIMATION_MS);
    return () => window.clearTimeout(removeTimer);
  }, [isExiting]);

  const triggerExit = useCallback(() => {
    // Start video if not already playing (fallback for autoplay block)
    if (videoRef.current && !hasInteractedRef.current && videoRef.current.paused) {
      const video = videoRef.current;
      hasInteractedRef.current = true;
      setHasUserInteracted(true);
      video.muted = true;
      video.play().catch(() => {});
    }
    setIsExiting(true);
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    // Start video on first pointer move if not already playing (fallback for autoplay block)
    if (videoRef.current && !hasInteractedRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current;
      if (video.paused) {
        hasInteractedRef.current = true;
        setHasUserInteracted(true);
        video.muted = true;
        video.play()
          .then(() => {
            console.log('✅ Video started on pointer move');
          })
          .catch(() => {});
      }
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setParallax({
      x: x * 32,
      y: y * 22,
    });
  }, []);

  const parallaxStyle = useMemo(
    () => ({
      transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(${isExiting ? 1.05 : 1})`,
    }),
    [parallax, isExiting]
  );

  if (!isMounted && !isExiting) {
    return null;
  }

  return (
    <AnimatePresence>
      {isMounted && (
        <motion.div
          key="portal-hero"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
          onPointerMove={handlePointerMove}
          onPointerDown={(e) => {
            // Start video if not already playing (fallback)
            if (videoRef.current && !hasInteractedRef.current && videoRef.current.paused) {
              const video = videoRef.current;
              hasInteractedRef.current = true;
              setHasUserInteracted(true);
              video.muted = true;
              video.play().catch(() => {});
            }
            triggerExit();
          }}
          onClick={(e) => {
            // Start video if not already playing (fallback)
            if (videoRef.current && !hasInteractedRef.current && videoRef.current.paused) {
              const video = videoRef.current;
              hasInteractedRef.current = true;
              setHasUserInteracted(true);
              video.muted = true;
              video.play().catch(() => {});
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Video background */}
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              poster="/raylogo.png"
              onError={(e) => {
                console.error('Video error:', e);
                const video = e.currentTarget;
                console.error('Video error details:', {
                  error: video.error,
                  networkState: video.networkState,
                  readyState: video.readyState,
                  src: video.currentSrc || video.src
                });
              }}
              onLoadStart={() => {
                console.log('Video load started');
              }}
              onLoadedData={() => {
                console.log('Video data loaded');
              }}
              onCanPlay={() => {
                console.log('Video can play');
              }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded');
              }}
              onPlay={() => {
                console.log('✅ Video started playing');
              }}
              onPlaying={() => {
                console.log('▶️ Video is playing');
              }}
            >
              <source src="/hero-video.mp4" type="video/mp4" />
              <source src="/hero-video.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-black/90" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
            <motion.div
              className="relative aspect-square w-32 sm:w-44 md:w-56 mb-12 sm:mb-16 drop-shadow-[0_35px_45px_rgba(0,0,0,0.55)]"
              style={parallaxStyle}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: isExiting ? 0.9 : 1, scale: isExiting ? 1.05 : 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Image
                src="/raylogo.png"
                alt="Reserve4You"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 70vw, 320px"
              />
            </motion.div>

            <motion.button
              onClick={(e) => {
                // Start video if not already playing (fallback)
                if (videoRef.current && !hasInteractedRef.current && videoRef.current.paused) {
                  const video = videoRef.current;
                  hasInteractedRef.current = true;
                  setHasUserInteracted(true);
                  video.muted = true;
                  video.play().catch(() => {});
                }
                triggerExit();
              }}
              className="rounded-full border border-white/40 bg-white/10 px-8 py-2.5 text-sm sm:text-base font-semibold tracking-[0.2em] uppercase hover:bg-white/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 10 : 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              Let's Reserve 4 You
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

