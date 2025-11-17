# Clerk Authentication Setup

This project uses [Clerk](https://clerk.com/) for authentication to protect the `/admin` routes and API endpoints.

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [https://clerk.com/](https://clerk.com/) and sign up for a free account
2. Create a new application in the Clerk Dashboard
3. Choose your preferred authentication methods (Email, Google, etc.)

### 2. Get Your Clerk Keys

1. In your Clerk Dashboard, navigate to **API Keys**
2. Copy your **Publishable Key** and **Secret Key**
3. Add them to your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Clerk keys:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual Clerk keys from the dashboard.

### 4. Optional: Customize Sign-in URLs

You can customize the sign-in/sign-up behavior by setting these optional environment variables in `.env.local`:

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
```

### 5. Start Development

```bash
pnpm dev
```

Visit `http://localhost:3000/admin` - you'll be prompted to sign in before accessing the admin panel.

## What's Protected

- **All `/admin` routes** - Requires authentication
- **All `/api/admin` routes** - API endpoints for admin operations
- Public routes (`/`, `/albums`, etc.) remain accessible to everyone

## Implementation Details

### Middleware (`src/middleware.ts`)

Uses `clerkMiddleware()` to protect routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})
```

### Root Layout (`src/app/layout.tsx`)

Wrapped with `<ClerkProvider>`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Admin Layout (`src/app/admin/layout.tsx`)

Shows sign-in UI for unauthenticated users and user button for authenticated users:

```typescript
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function AdminLayout({ children }) {
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        {children}
      </SignedIn>
    </>
  )
}
```

## User Management

All user management (sign-in, sign-up, password reset, profile updates) is handled by Clerk's pre-built components and hosted pages. No additional setup required!

## Production Deployment

When deploying to production (Vercel, etc.):

1. Add your Clerk environment variables to your hosting platform's environment settings
2. Make sure to use **production keys** from your Clerk Dashboard (not test keys)
3. Configure your production domain in Clerk Dashboard under **Domains**

## Additional Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Clerk Components](https://clerk.com/docs/components/overview)
