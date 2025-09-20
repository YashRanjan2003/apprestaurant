'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isRestaurantOpen, getRestaurantInfo } from '@/lib/supabase/settings';

export default function Home() {
  const router = useRouter();
  const [restaurantInfo, setRestaurantInfo] = useState({
    openingHours: 'Opens: 11:00 AM - 10:00 PM'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const [open, info] = await Promise.all([
          isRestaurantOpen(),
          getRestaurantInfo()
        ]);
        
        if (!open) {
          router.push('/closed');
          return;
        }
        
        setRestaurantInfo({
          openingHours: `Opens: ${info.openingHours}`
        });
      } catch (error) {
        console.error('Error checking restaurant status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-full max-w-md mx-auto bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-gray-700 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-12 h-12 border-3 border-transparent border-t-orange-500 rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-orange-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-gray-900 overflow-hidden">
      {/* Dark textured background inspired by menu */}
      <div className="absolute inset-0">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
        
        {/* Minimal geometric accents */}
        <div className="absolute top-16 right-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-24 left-8 w-20 h-20 bg-orange-400/5 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-4 w-16 h-16 bg-orange-600/5 rounded-full blur-lg" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6">
        {/* Header Section */}
        <div className="pt-16">
          {/* Status Badge */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-700/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-orange-400 tracking-wide uppercase">Open Now</span>
            </div>
          </div>

          {/* Logo Section - Dark Theme with Animation */}
          <div className="text-center mb-12">
            {/* Logo Container */}
            <div className="relative w-56 h-56 mx-auto mb-8 group">
              <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 group-hover:bg-gray-800/70 group-hover:border-orange-500/20 transition-all duration-300" />
              <div className="relative w-full h-full p-10">
                {/* White Logo Shadow (positioned slightly offset) */}
                <div className="absolute inset-0 p-10 translate-x-px translate-y-px">
                  <Image
                    src="/assets/images/GENZ CAFE LOGO.png"
                    alt="GenZ Cafe Logo Shadow"
                    fill
                    className="object-contain brightness-0 invert opacity-50 group-hover:scale-105 transition-all duration-300"
                    priority
                    sizes="14rem"
                    quality={100}
                  />
                </div>
                
                {/* Main Logo */}
                <div className="absolute inset-0 p-10">
                  <Image
                    src="/assets/images/GENZ CAFE LOGO.png"
                    alt="GenZ Cafe Logo"
                    fill
                    className="object-contain group-hover:scale-105 transition-all duration-300 drop-shadow-lg"
                    priority
                    sizes="14rem"
                    quality={100}
                  />
                </div>
              </div>
            </div>
            
            {/* Clean Typography */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white leading-tight">
                Cafe for the
                <span className="block text-4xl bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  New Generation
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-8">
          {/* Hours Display */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-700/50">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-300">{restaurantInfo.openingHours}</span>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-center">
            <Link 
              href="/track" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800/40 backdrop-blur-sm rounded-full border border-gray-700/50 text-sm text-gray-300 hover:text-orange-400 hover:border-orange-500/30 transition-all duration-300 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track Your Order
            </Link>
          </div>
          
          {/* Main CTA - Orange accent */}
          <div className="w-full">
            <Link
              href="/menu"
              className="group block w-full py-4 px-6 text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                Order Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
          
          {/* Bottom branding - Dark theme */}
          <div className="text-center space-y-3 pb-2">
            <div className="flex items-center justify-center opacity-50">
              <span className="text-xs text-gray-400 mr-2 font-light">powered by</span>
              <Image
                src="/assets/images/srmhotel.png"
                alt="SRM Hotel Logo"
                width={60}
                height={18}
                className="object-contain opacity-70 brightness-75"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
