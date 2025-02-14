'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ReservationForm {
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  specialRequests: string;
}

export default function ReservationPage() {
  const [formData, setFormData] = useState<ReservationForm>({
    date: '',
    time: '',
    guests: 2,
    name: '',
    phone: '',
    specialRequests: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, you would make an API call here
    console.log('Reservation submitted:', formData);
    
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-gray-800">
              <span className="sr-only">Back to Home</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold ml-4">Reservation Confirmed</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-8">Your reservation has been confirmed.</p>
          <Link
            href="/"
            className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-gray-800">
            <span className="sr-only">Back to Home</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold ml-4">Make a Reservation</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <select
              id="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">Select a time</option>
              <option value="17:00">5:00 PM</option>
              <option value="17:30">5:30 PM</option>
              <option value="18:00">6:00 PM</option>
              <option value="18:30">6:30 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="19:30">7:30 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="20:30">8:30 PM</option>
              <option value="21:00">9:00 PM</option>
            </select>
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests
            </label>
            <select
              id="guests"
              required
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
              rows={3}
              placeholder="Any special requests or notes"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
          </button>
        </form>
      </main>
    </div>
  );
} 