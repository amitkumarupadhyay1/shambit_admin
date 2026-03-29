# ShamBit Admin Dashboard

[![CI/CD Pipeline](https://github.com/amitkumarupadhyay1/shambit_admin/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/amitkumarupadhyay1/shambit_admin/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)

Modern admin dashboard for managing the ShamBit platform built with Next.js 15, React 19, and TypeScript.

## 🚀 Features

- **Cloudinary Monitoring**: Real-time usage tracking for storage, bandwidth, and transformations
- **Partner Management**: Review and approve partner applications (coming soon)
- **Property Management**: Oversee property submissions (coming soon)
- **Booking Management**: Monitor and manage bookings (coming soon)
- **Analytics Dashboard**: Platform-wide statistics and insights (coming soon)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Custom JWT-based auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

## ⚠️ Important Notes

### Admin Verification
The backend API currently doesn't expose `is_staff` or `is_superuser` fields in the user response. The admin dashboard assumes that any user who can successfully authenticate is an admin. For production use, you should:

1. Update the backend `UserSerializer` to include `is_staff` and `is_superuser` fields
2. Implement proper role-based access control on the backend
3. Add middleware to verify admin status for all admin endpoints

This is a frontend-only limitation and should be addressed on the backend for proper security.

## 🔧 Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
```

## 🚀 Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🏗️ Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Type checking:
```bash
npm run type-check
```

## 📁 Project Structure

```
shambit-admin/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Dashboard routes (protected)
│   │   ├── dashboard/       # Main dashboard
│   │   ├── cloudinary/      # Cloudinary monitoring
│   │   ├── partners/        # Partner management
│   │   ├── properties/      # Property management
│   │   └── layout.tsx       # Dashboard layout
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects to login)
├── components/              # React components
│   ├── ui/                  # UI components (Button, Card, etc.)
│   ├── common/              # Common components
│   └── cloudinary/          # Cloudinary-specific components
├── lib/                     # Utilities
│   ├── api.ts              # Axios instance & interceptors
│   └── utils.ts            # Helper functions
├── services/               # API services
│   ├── auth.ts            # Authentication service
│   └── cloudinary.ts      # Cloudinary service
├── types/                  # TypeScript types
│   ├── auth.ts
│   └── cloudinary.ts
└── public/                 # Static assets
```

## 🔐 Authentication

The admin dashboard uses JWT-based authentication:

1. Login with admin credentials at `/login`
2. Token is stored in localStorage
3. Token is automatically added to API requests
4. Unauthorized requests redirect to login

**Admin Requirements:**
- User must have `is_staff` or `is_superuser` flag set to `true`
- Regular users cannot access the admin dashboard

## 🎨 UI Components

Built with custom components following modern design principles:
- Responsive design (mobile-first)
- Accessible (ARIA labels, keyboard navigation)
- Consistent styling with Tailwind CSS
- Smooth animations and transitions

## 📊 Cloudinary Monitoring

The Cloudinary monitoring page provides:
- Real-time usage statistics
- Storage, bandwidth, and transformation tracking
- Visual progress bars with color-coded status
- Alerts for high usage (75%+ warning, 90%+ critical)
- Usage tips and recommendations

## 🔄 API Integration

All API calls go through the centralized `api.ts` service:
- Automatic token injection
- Error handling
- Request/response interceptors
- Automatic logout on 401 errors

## 🚧 Coming Soon

- Partner approval workflow
- Property review system
- Booking management
- User management
- Advanced analytics
- Email notifications
- Audit logs
- 2FA authentication

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL | `http://localhost:8000` |
| `NEXTAUTH_URL` | Admin app URL | `http://localhost:3001` |
| `NEXTAUTH_SECRET` | Secret for session encryption | - |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions, contact the development team.
