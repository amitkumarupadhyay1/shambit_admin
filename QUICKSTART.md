# 🚀 Quick Start Guide - ShamBit Admin

## ✅ Setup Complete!

Your admin dashboard is ready to use. Here's how to get started:

## 📋 What's Been Created

✅ Next.js 15 app with App Router
✅ TypeScript configuration
✅ Tailwind CSS 4.x styling
✅ Authentication system
✅ Cloudinary monitoring page
✅ Dashboard layout with sidebar
✅ API integration with Django backend
✅ All dependencies installed
✅ Production build tested

## 🎯 First Steps

### 1. Start the Development Server

```bash
cd shambit-admin
npm run dev
```

The admin app will run on **http://localhost:3001**

### 2. Login

- Navigate to http://localhost:3001
- You'll be redirected to the login page
- Use your Django admin credentials:
  - Username: Your Django superuser username
  - Password: Your Django superuser password

**Important**: Only users with `is_staff` or `is_superuser` flag can access the admin dashboard.

### 3. View Cloudinary Monitoring

After login, click on "Cloudinary" in the sidebar to see:
- Storage usage
- Bandwidth usage
- Transformations usage
- Real-time alerts
- Usage tips

## 🔧 Configuration

### Environment Variables

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
```

**For Production**: Update these values with your production URLs.

### Backend Requirements

Make sure your Django backend is running on `http://localhost:8000` with:
- `/api/users/login/` endpoint for authentication
- `/api/media/cloudinary_usage/` endpoint for Cloudinary stats
- CORS configured to allow requests from `http://localhost:3001`

## 📱 Features Available Now

### ✅ Working Features:
1. **Authentication**
   - Login with Django credentials
   - Admin-only access control
   - Automatic token management
   - Secure logout

2. **Cloudinary Monitoring**
   - Real-time usage statistics
   - Storage tracking
   - Bandwidth monitoring
   - Transformation usage
   - Visual progress bars
   - Color-coded alerts (green/orange/red)
   - Usage tips and recommendations

3. **Dashboard**
   - Overview page
   - Responsive sidebar navigation
   - Mobile-friendly design
   - Modern UI with Tailwind CSS

### 🚧 Coming Soon:
- Partner management
- Property approval workflow
- Booking management
- User management
- Advanced analytics
- Email notifications

## 🎨 UI Components

The app includes pre-built components:
- `Button` - Primary, secondary, outline, ghost, danger variants
- `Card` - For content containers
- `LoadingSpinner` - For loading states
- `UsageCard` - For Cloudinary metrics

## 📊 Cloudinary Monitoring Details

The Cloudinary page shows:

**Storage**
- Used vs. Total (in GB/MB)
- Percentage used
- Remaining space
- Status indicator

**Bandwidth**
- Monthly usage
- Limit tracking
- Percentage used
- Alerts at 75% and 90%

**Transformations**
- Count of transformations
- Monthly limit
- Usage percentage

**Alerts**
- 🟢 Green: < 75% (Healthy)
- 🟠 Orange: 75-90% (Warning)
- 🔴 Red: > 90% (Critical)

## 🔐 Security Features

- JWT-based authentication
- Token stored in localStorage
- Automatic token injection in API calls
- Auto-logout on 401 errors
- Admin-only access control
- HTTPS ready for production

## 🛠️ Development Commands

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Run tests
npm test

# Lint code
npm run lint
```

## 📁 Project Structure

```
shambit-admin/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── cloudinary/       # ✅ Cloudinary monitoring
│   │   ├── partners/         # 🚧 Coming soon
│   │   ├── properties/       # 🚧 Coming soon
│   │   ├── bookings/         # 🚧 Coming soon
│   │   ├── settings/         # 🚧 Coming soon
│   │   └── layout.tsx        # Dashboard layout
│   ├── login/                # Login page
│   └── page.tsx              # Home (redirects to login)
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── common/               # Common components
│   └── cloudinary/           # Cloudinary-specific
├── lib/
│   ├── api.ts               # Axios instance
│   └── utils.ts             # Helper functions
├── services/
│   ├── auth.ts              # Auth service
│   └── cloudinary.ts        # Cloudinary service
└── types/                    # TypeScript types
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t shambit-admin .

# Run container
docker run -p 3001:3001 shambit-admin
```

### Manual

```bash
# Build
npm run build

# Start
npm start
```

## 🆘 Troubleshooting

### Login Issues

**Problem**: Can't login
**Solution**: 
- Ensure Django backend is running
- Check if user has `is_staff` or `is_superuser` flag
- Verify CORS is configured in Django
- Check browser console for errors

### Cloudinary Data Not Loading

**Problem**: Cloudinary page shows error
**Solution**:
- Verify backend endpoint `/api/media/cloudinary_usage/` exists
- Check if Cloudinary is configured in Django
- Ensure `USE_CLOUDINARY=True` in backend `.env`
- Check browser network tab for API errors

### Port Already in Use

**Problem**: Port 3001 is busy
**Solution**:
```bash
# Use different port
npm run dev -- -p 3002
```

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review the code comments
3. Check browser console for errors
4. Review Django backend logs

## 🎉 Next Steps

1. ✅ Login to the admin dashboard
2. ✅ Check Cloudinary usage
3. 🚧 Wait for partner management features
4. 🚧 Wait for property approval workflow
5. 🚧 Wait for booking management

---

**Congratulations! Your admin dashboard is ready to use!** 🎊
