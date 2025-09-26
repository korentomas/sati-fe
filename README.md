# SATI Frontend - Satellite Imagery Gateway

A modern GIS platform for satellite imagery search, processing, and visualization.

## Features

- **Authentication**: Secure user authentication with Supabase
- **Retro Aesthetic**: 90s/00s inspired UI design
- **Dashboard**: User dashboard with system status
- **Map Integration** (Coming Soon): Interactive maps with Leaflet & Geoman
- **Satellite Search** (Coming Soon): Search and visualize satellite imagery
- **Processing** (Coming Soon): NDVI, NDWI calculations and image processing

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom retro theme
- **Type Safety**: TypeScript
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Development Scripts

```bash
# Type checking
npm run type-check

# Format code
npm run format

# Check formatting
npm run format:check

# Run tests (coming soon)
npm test
```

## Project Structure

```
sati-fe/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Protected dashboard
│   └── globals.css        # Global styles with retro theme
├── lib/                   # Utility functions
│   └── supabase/         # Supabase client configuration
├── middleware.ts          # Auth middleware for protected routes
└── .github/              # CI/CD workflows
    └── workflows/
        ├── ci.yml        # Build and test
        └── deploy.yml    # Deployment pipeline
```

## Authentication Flow

1. Users register with email/password
2. Email verification sent via Supabase
3. Login redirects to dashboard
4. Protected routes enforced by middleware
5. Session management handled by Supabase

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## CI/CD

GitHub Actions workflows:

- **CI**: Runs on all pushes and PRs
  - Type checking
  - Build verification
  - Security audit
  - Code quality checks

- **Deploy**: Runs on push to main
  - Automatic deployment to Vercel

## Roadmap

### Phase 1: Authentication ✅
- User registration and login
- Protected routes
- Session management

### Phase 2: Map Integration (In Progress)
- Leaflet integration
- Geoman drawing tools
- AOI selection

### Phase 3: Satellite Search
- Backend API integration
- Search filters
- Scene visualization

### Phase 4: Processing
- NDVI/NDWI calculations
- Job queue management
- Result downloads

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and formatting
4. Submit a pull request

## License

Private - All rights reserved
