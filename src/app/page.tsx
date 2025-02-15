import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Full Screen Hero Image */}
      <div className="absolute inset-0 hero-image-container">
        <Image
          src="/assets/images/hero.jpg"
          alt="Restaurant hero image"
          fill
          className="object-cover brightness-75 transition-all duration-1000"
          priority
          sizes="100vw"
          quality={100}
        />
        {/* Vignette Overlay */}
        <div className="absolute inset-0 vignette-overlay" />
      </div>

      {/* Content Overlay */}
      <div className="relative flex flex-col min-h-screen">
        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center animate-fade-in [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]">
            Welcome to Restaurant
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 text-center animate-fade-in delay-200 [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]">
            Order food or make a reservation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs mx-auto px-4 mb-20">
          <div className="space-y-4">
            <Link
              href="/menu"
              className="block bg-white text-black py-4 px-6 rounded-full text-center font-semibold shadow-lg hover:bg-gray-100 transition-colors animate-fade-in delay-300"
            >
              Order Now
            </Link>
            
            <Link
              href="/reservation"
              className="block bg-black/20 backdrop-blur-sm text-white border-2 border-white py-4 px-6 rounded-full text-center font-semibold hover:bg-black/30 transition-colors animate-fade-in delay-400"
            >
              Make a Reservation
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-white/80 animate-fade-in delay-500">
          <div className="space-y-2">
            <p>Open daily: 11:00 AM - 10:00 PM</p>
            <div className="flex items-center justify-center">
              <Link href="/track" className="hover:text-white transition-colors flex items-center text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Track Order
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
