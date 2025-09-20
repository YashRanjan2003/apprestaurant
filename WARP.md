# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a modern restaurant platform built with Next.js 15 and TypeScript, featuring a customer-facing ordering system with cart management, checkout flow, order tracking, and an admin dashboard. The application uses Supabase for backend services including database (PostgreSQL) and authentication.

## Development Commands

### Setup and Installation
```bash
# Install dependencies
npm install

# Set up environment variables - create a .env.local file with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Common Development Tasks
```bash
# Run development server (default port: 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Database Setup
To initialize the Supabase database:
1. Log in to Supabase dashboard at https://app.supabase.com/
2. Go to SQL Editor tab
3. Execute the SQL script in `supabase/init.sql`
4. For feedback tables, run `feedback_tables.sql`
5. For storage policies, run `storage_policies.sql`

## Architecture Overview

### State Management Architecture
The application uses React Context API for state management with two primary contexts:
- **CartContext** (`src/lib/context/CartContext.tsx`): Manages shopping cart state, item quantities, and price calculations. Persists cart data to localStorage for session recovery
- **AuthContext** (`src/lib/context/AuthContext.tsx`): Handles user authentication state through Supabase Auth

### Supabase Integration Pattern
All Supabase interactions follow a centralized pattern:
- Client initialization in `src/lib/supabase/client.ts`
- Type definitions in `src/lib/supabase/database.types.ts`
- Domain-specific modules: `menu.ts`, `orders.ts`, `feedback.ts`, `settings.ts`
- Row Level Security (RLS) policies configured for all tables

### Routing Structure
The app uses Next.js App Router with the following key routes:
- **Customer Routes**: Menu browsing (`/menu`), Cart (`/cart`), Checkout (`/checkout`), Order tracking (`/track`)
- **Admin Routes**: Dashboard (`/admin`), Order management, User management
- **Public Layout**: Wrapper at `(public)/layout.tsx` for customer-facing pages

### Order Flow Architecture
1. **Menu Browsing**: Items fetched from Supabase, categorized display with search/filter
2. **Cart Management**: Local state with persistence, real-time price calculations including GST (5%), platform fee (₹15), and conditional delivery charges
3. **Guest Checkout**: Collects customer info directly without requiring account creation - stores order with 6-digit OTP for tracking
4. **Order Tracking**: OTP-based lookup system for order status monitoring

### Component Organization
- **Smart Components**: Handle business logic and state management
- **Presentation Components**: Focus on UI rendering
- **Context Providers**: Wrap the application at root level in `app/layout.tsx`

### Image Storage Strategy
- Images stored in Supabase Storage bucket `menu-images`
- Next.js configured with remote patterns for Supabase domain
- Storage policies enable public read access while restricting writes

## Key Technical Decisions

### Guest Checkout Implementation
The system bypasses user account requirements during checkout to reduce friction. Customer information (name, phone, optional email) is collected directly on the checkout form and stored with the order for tracking purposes.

### Price Calculation Logic
All price calculations happen in `CartContext.tsx`:
- GST: 5% of item total
- Platform Fee: Fixed ₹15
- Delivery Charge: ₹40 (free above ₹500)
- Currently configured for pickup-only (delivery charge = 0)

### OTP System
Orders use a 6-digit OTP for tracking instead of user accounts, enabling guest users to track their orders securely without authentication overhead.

## Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

Optional settings in `.env.local`:
- `NEXT_PUBLIC_DISABLE_ESLINT_PLUGIN=true`: Disable ESLint plugin if needed
- `TYPESCRIPT_STRICT_MODE=false`: Disable strict TypeScript checking

## Database Schema

Core tables in Supabase:
- `users`: Customer information (optional, for authenticated users)
- `menu_categories`: Category organization for menu items  
- `menu_items`: Restaurant menu with pricing, nutritional info, and availability
- `orders`: Order details including type, payment, totals, and OTP
- `order_items`: Individual items within each order
- `settings`: Platform configuration (fees, restaurant info)
- `order_feedback` & `item_feedback`: Customer feedback system