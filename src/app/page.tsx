import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Full Screen Hero Image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/hero.jpg"
          alt="Restaurant hero image"
          fill
          className="object-cover brightness-50"
          priority
        />
        {/* Vignette Overlay */}
        <div className="absolute inset-0 vignette-overlay" />
      </div>

      {/* Content Overlay */}
      <div className="relative flex flex-col min-h-screen">
        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center animate-fade-in">Welcome to Restaurant</h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-12 text-center animate-fade-in delay-200">Order food or make a reservation</p>
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
          <p>Open daily: 11:00 AM - 10:00 PM</p>
        </footer>
      </div>
    </main>
  );
}
