import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-white shadow-sm overflow-hidden">
      {/* Full Screen Hero Image with smoother gradient overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hero-image-container">
          <Image
            src="/assets/images/hero.jpg"
            alt="Restaurant hero image"
            fill
            className="object-cover object-center brightness-[0.4] transition-all duration-700"
            priority
            sizes="100vw"
            quality={90}
          />
          {/* Smooth gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>
      </div>

      {/* Content Overlay with improved spacing */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {/* Logo and Text Section */}
        <div className="pt-16 px-4">
          {/* Logo container with smoother animations */}
          <div className="w-60 h-60 mx-auto relative mb-4 animate-fade-in [animation-duration:1.2s] group">
            {/* Smooth glowing effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-yellow-400/20 blur-2xl animate-pulse [animation-duration:3s]" />
            <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm" />
            <Image
              src="/assets/images/currypoorilogo.png"
              alt="CurryPoori Logo"
              fill
              className="object-contain p-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-all duration-500 ease-out"
              priority
              sizes="(max-width: 768px) 15rem, 15rem"
              quality={100}
            />
          </div>
          
          {/* Text content with smoother fade-in */}
          <div className="space-y-3 text-center animate-fade-in [animation-duration:1s] [animation-delay:0.3s]">
            <p className="text-2xl md:text-3xl font-medium text-yellow-400 [text-shadow:_0_2px_8px_rgb(0_0_0_/_50%)] tracking-wide">
              Authentic Indian Delights
            </p>
            <p className="text-lg md:text-xl text-gray-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)] tracking-wide font-light">
              Experience the perfect blend of tradition & taste
            </p>
          </div>
        </div>

        {/* Bottom Section with action button and footer */}
        <div className="w-full">
          {/* Footer with improved blur and spacing */}
          <footer className="text-center py-2 text-white/95 animate-fade-in [animation-delay:0.7s] backdrop-blur-md bg-black/10">
            <div className="space-y-1">
              <p className="font-medium tracking-wide text-sm">Open daily: 11:00 AM - 10:00 PM</p>
              <div className="flex items-center justify-center gap-6">
                <Link 
                  href="/track" 
                  className="hover:text-yellow-400 transition-all duration-300 flex items-center text-sm group px-3 py-1.5 rounded-full hover:bg-white/5"
                >
                  <svg 
                    className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Track Order
                </Link>
              </div>
            </div>
          </footer>

          {/* Action Button - moved below footer */}
          <div className="w-full max-w-xs mx-auto px-4 py-4">
            <Link
              href="/menu"
              className="block bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 px-8 rounded-full text-center font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_25px_rgba(255,170,0,0.35)] hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 ease-out animate-fade-in [animation-delay:0.5s] transform hover:scale-[1.02] hover:-translate-y-0.5"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
