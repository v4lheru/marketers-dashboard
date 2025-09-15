# Marketers Dashboard - Codebase Context

## Project Overview
A comprehensive dashboard for Olga to review and manage marketing job applicants. Built with Next.js 15, React 19, TypeScript, and Supabase backend.

## Database Schema (Supabase)
**Project ID**: `erdojdjahxsaejqwoavy`
**Database**: PostgreSQL with 3 main tables containing 377+ applications

### Tables Structure

#### 1. `applications` (377 rows)
Primary table storing applicant submissions:
- `id` (uuid, PK) - Unique application identifier
- `first_name`, `last_name`, `email` - Basic contact info
- `looking_for` - Job type: 'freelance' | 'fulltime'
- `status` - Processing status: 'pending' | 'processing' | 'analyzed' | 'failed'
- `linkedin_url` - LinkedIn profile URL
- `form_data` (jsonb) - Raw form submission data
- `scraped_content`, `scraped_linkedin` (jsonb) - Scraped profile data
- `created_at`, `updated_at` - Timestamps
- `processing_started_at`, `processing_completed_at` - Processing timeline

#### 2. `candidate_analyses` (360 rows)
AI analysis results linked to applications:
- `id` (uuid, PK)
- `application_id` (uuid, FK → applications.id)
- `overall_score` (0-100) - Overall candidate rating
- `category_scores` (jsonb) - Detailed scoring breakdown
- `strengths`, `weaknesses` (text[]) - Assessment arrays
- `recommendations`, `fit_assessment` (text) - AI recommendations
- `red_flags`, `next_steps` (text[]) - Action items
- `linkedin_data`, `portfolio_data`, `documents_data` (jsonb) - Analyzed data
- `analysis_version`, `model_used` - AI model tracking
- `data_quality_assessment` (jsonb) - Data completeness metrics

#### 3. `candidate_documents` (359 rows)
Document storage and processing:
- `id` (uuid, PK)
- `application_id` (uuid, FK → applications.id)
- `file_url`, `original_filename` - File references
- `file_type`, `file_size_bytes` - File metadata
- `extracted_content` (text) - Parsed document content
- `processing_status` - Document processing state
- `metadata` (jsonb) - Additional file information

### Data Relationships
- One-to-One: `applications` ↔ `candidate_analyses`
- One-to-Many: `applications` → `candidate_documents`

### Sample Data Insights
- High-quality candidates with scores 84-87
- Mix of freelance/fulltime seekers
- Comprehensive AI analysis with fit assessments
- Document processing pipeline in place

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: Radix UI components with Tailwind CSS
- **Authentication**: Supabase Auth (for Olga's access)

## Security Requirements
- NO API keys in code (use .env only)
- .env MUST be in .gitignore
- Highest security standards for credentials

## Dashboard Requirements
- Comprehensive applicant overview
- Individual applicant detail views
- Filtering and search functionality
- Real-time updates via Supabase
- Resume/document viewing
- Score-based sorting and filtering

## Project Structure (To Be Created)
```
/
├── .env.local (Supabase credentials)
├── .gitignore (includes .env.local)
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── app/ (App Router)
│   ├── components/ (Reusable UI components)
│   ├── lib/ (Utilities, Supabase client)
│   └── types/ (TypeScript definitions)
```

## Development Status
- ✅ Database analysis complete
- ✅ Project setup complete
- ✅ Dashboard implementation complete
- ✅ Enhanced candidate detail modal with comprehensive analysis
- ✅ Resume viewing functionality
- ✅ Real-time filtering and search
- ✅ Responsive design with Tailwind CSS

## Features Implemented
### Dashboard Overview
- **Stats Cards**: Total candidates, analyzed count, average score, pending applications
- **Advanced Filtering**: By status, job type, score range, with real-time search
- **Sorting Options**: By date, score, name (ascending/descending)
- **Responsive Table**: Comprehensive candidate listing with key metrics

### Enhanced Candidate Detail Modal
- **Three-Tab Interface**: Overview, Analysis, Resume
- **Complete Analysis Display**: 
  - Overall score with color-coded indicators
  - Fit assessment with detailed recommendations
  - Strengths, weaknesses, red flags, next steps
  - Category breakdown scores
- **Resume Viewer**: 
  - Document selection for multiple files
  - Extracted content display with formatting
  - Processing status indicators
- **Professional UI**: Clean, organized layout with proper spacing and typography

### Technical Implementation
- **Real-time Data**: Direct Supabase integration with live updates
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Performance**: Optimized queries with proper data relationships
- **Security**: Environment variables properly secured in .gitignore
- **Responsive**: Mobile-friendly design with Tailwind CSS

## Project Structure (Final)
```
/
├── .env.local (Supabase credentials - secured)
├── .gitignore (includes .env.local)
├── package.json (Next.js 15, React 18, TypeScript)
├── next.config.js
├── tailwind.config.js (Custom design system)
├── tsconfig.json (Optimized for Next.js 15)
├── postcss.config.js
├── src/
│   ├── app/ (App Router)
│   │   ├── globals.css (Tailwind + custom CSS variables)
│   │   ├── layout.tsx (Root layout with header)
│   │   └── page.tsx (Main dashboard with stats, filters, table)
│   ├── components/
│   │   └── CandidateDetailModal.tsx (Enhanced modal with tabs)
│   ├── lib/
│   │   ├── supabase.ts (Database client configuration)
│   │   └── utils.ts (Utility functions for formatting, colors)
│   └── types/
│       └── database.ts (TypeScript interfaces for all tables)
```
