# Restaurant Platform

A modern food ordering platform for restaurants with real-time order tracking and mobile-first design.

## Features

- **Menu Browsing**: View menu items by categories, with search and filtering options
- **Cart System**: Add items to cart with real-time price calculations
- **Checkout Process**: Order type selection, delivery options, and payment methods
- **Order Tracking**: Track order status with OTP verification
- **Authentication**: Sign up and log in with phone number verification
- **Admin Dashboard** (Coming Soon): Manage menu items, orders, and settings

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Image Storage**: Supabase Storage

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd restaurant-platform
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project:
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Navigate to SQL Editor and run the SQL script in `supabase/init.sql`

4. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Folder Structure

```
src/
├── app/
│   ├── admin/         # Admin dashboard pages
│   ├── auth/          # Authentication pages
│   ├── cart/          # Cart page
│   ├── checkout/      # Checkout process
│   ├── menu/          # Menu browsing
│   ├── track/         # Order tracking
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/
│   ├── forms/         # Form components
│   ├── layout/        # Layout components
│   └── ui/            # UI components
├── lib/
│   ├── context/       # React context providers
│   ├── hooks/         # Custom hooks
│   ├── supabase/      # Supabase client and utilities
│   └── utils/         # Helper functions
└── public/
    └── assets/        # Static assets
```

## Deployment

### Vercel Deployment

1. Push your code to a Git repository
2. Create a new project on Vercel
3. Add your environment variables
4. Deploy

## License

MIT
