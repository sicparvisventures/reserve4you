'use client';

import Image from 'next/image';

/**
 * Video Hero Section
 * 
 * Full-width hero section with video background and centered raylogo
 * Place your video file in /public folder (e.g., /public/hero-video.mp4)
 */

export function VideoHeroSection() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/raylogo.png" // Fallback image while video loads
        >
          {/* Add your video file to /public folder and update the source below */}
          <source src="/hero-video.mp4" type="video/mp4" />
          <source src="/hero-video.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
        
        {/* Dark overlay for better logo visibility */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Logo perfectly centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        {/* Raylogo with elegant shadow - larger size */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 animate-in fade-in-0 zoom-in-95 duration-700">
          <Image
            src="/raylogo.png"
            alt="Reserve4You"
            width={256}
            height={256}
            className="w-full h-full object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}

