# Marketers Dashboard

A comprehensive dashboard for reviewing and managing marketing job applicants built with Next.js 15, React 18, TypeScript, and Supabase.

## Features

- **Real-time Dashboard**: View all 377+ marketing applicants with live stats
- **Advanced Filtering**: Filter by status, job type, and score ranges (95+, 90+, etc.)
- **Comprehensive Analysis**: Complete AI analysis with strengths, weaknesses, red flags, and next steps
- **Form Submission Viewer**: Original application form data with organized display
- **Resume Viewer**: Document content extraction and display
- **Score-based Sorting**: Sort by scores, dates, names with ascending/descending options
- **Responsive Design**: Works perfectly on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Deployment**: Railway with Docker

## Railway Deployment

### Quick Deploy

1. **Connect Repository**: 
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository: `v4lheru/marketers-dashboard`

2. **Environment Variables**:
   Add these environment variables in Railway dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://erdojdjahxsaejqwoavy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZG9qZGphaHhzYWVqcXdvYXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDEzNTAsImV4cCI6MjA3MzExNzM1MH0._ybz71OrZJkePV_qMai3oqTWvixP_YfYlWUYddXxlzg
   ```

3. **Deploy**: Railway will automatically detect the Dockerfile and deploy

### Manual Deployment Steps

1. Fork this repository
2. Connect to Railway
3. Set environment variables
4. Deploy automatically

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/v4lheru/marketers-dashboard.git
   cd marketers-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://erdojdjahxsaejqwoavy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZG9qZGphaHhzYWVqcXdvYXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDEzNTAsImV4cCI6MjA3MzExNzM1MH0._ybz71OrZJkePV_qMai3oqTWvixP_YfYlWUYddXxlzg
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open**: http://localhost:3000

## Database Schema

### Tables
- **applications** (377 rows): Primary applicant data
- **candidate_analyses** (360 rows): AI analysis results with scores
- **candidate_documents** (359 rows): Resume and document storage

### Key Features
- One-to-One: applications ↔ candidate_analyses
- One-to-Many: applications → candidate_documents
- Real-time updates via Supabase

## Project Structure

```
/
├── Dockerfile                 # Railway deployment
├── railway.json              # Railway configuration
├── next.config.js            # Next.js config with standalone output
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── globals.css       # Tailwind + custom styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard
│   ├── components/
│   │   └── CandidateDetailModal.tsx  # Enhanced modal
│   ├── lib/
│   │   ├── supabase.ts       # Database client
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── database.ts       # TypeScript interfaces
```

## Security

- ✅ Environment variables secured
- ✅ No API keys in code
- ✅ Proper .gitignore configuration
- ✅ Supabase RLS policies (if enabled)

## Deployment Files

- **Dockerfile**: Multi-stage build for optimal production image
- **railway.json**: Railway-specific configuration
- **next.config.js**: Standalone output for Docker deployment

## Support

For deployment issues or questions, check:
- Railway documentation
- Next.js deployment guides
- Supabase connection troubleshooting

---

Built with ❤️ using Next.js 15, Supabase, and Railway
