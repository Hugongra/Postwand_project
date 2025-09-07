# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Social Media Manager SaaS application that allows users to schedule posts, generate AI content, manage multiple social media accounts, and extract brand information from websites. The application uses a Python Flask backend with a React/Vite frontend.

## Architecture

### Backend (Python Flask)
- **Main Application**: `backend/app.py` - Central Flask application with all API endpoints
- **Database Layer**: Supabase integration via `backend/database/__init__.py`
- **Authentication**: `backend/user_auth.py` - Handles user registration, login, and session management
- **Background Processing**: Celery with Redis for asynchronous tasks
  - `backend/scheduler/scheduler.py` - Main scheduling logic and platform posting
  - `backend/celery_worker.py` - Celery worker configuration
  - `backend/celery_scheduler.py` - Celery beat scheduler for scheduled posts

### Key Backend Modules
- **Social Media Integration**: 
  - `backend/scheduler/` - Platform-specific posting modules (Facebook, Instagram, LinkedIn, etc.)
- **AI Services**:
  - `backend/text_generation.py` - AI-powered post generation
  - `backend/image_generation.py` - AI image creation
  - `backend/edit_image.py` - Image editing capabilities
- **Brand Extraction**: `backend/brand_extraction/` - Website brand asset extraction
- **Messaging**: `backend/message_service.py` - Social media message management

### Frontend (React + Vite)
- **Main App**: `frontend/src/App.jsx`
- **Components**: `frontend/src/components/` - Organized by feature (auth, scheduler, insights, etc.)
- **Styling**: Tailwind CSS with custom components in `frontend/src/components/ui/`
- **Internationalization**: i18next for multi-language support

## Development Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run Flask development server
python app.py

# Run Celery worker (separate terminal)
python celery_worker.py

# Run Celery beat scheduler (separate terminal)
python celery_scheduler.py
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Environment Configuration

### Backend (.env in backend/)
Required environment variables:
- `SUPABASE_URL` and `SUPABASE_KEY` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Admin database access
- `UPSTASH_REDIS_*` - Redis configuration for Celery
- `OPENAI_API_KEY` - AI services
- Platform API keys (Facebook, Instagram, LinkedIn, etc.)
- `STRIPE_*` - Payment processing

### Frontend
- Uses proxy configuration in `vite.config.js` to route API calls to backend
- SSL certificates required for local HTTPS development (`threads-dev.local`)

## Database

The application uses Supabase (PostgreSQL) with the following key tables:
- `users` - User accounts and authentication
- `scheduled_posts` - Post scheduling and publishing
- `facebook_auth`, `instagram_accounts`, etc. - Social media account connections
- `brand_profiles` - Extracted brand information
- `saved_images` - User's generated/saved images

## Key Features Implementation

### Post Scheduling
- Immediate posting via background tasks (`run_in_background_task`)
- Future scheduling stored in database, processed by Celery beat
- Platform-specific posting logic in `scheduler/` modules
- Support for multiple post types (regular, story, reel) per platform

### AI Content Generation
- OpenAI integration for text generation and image creation
- Brand-aware content generation using extracted brand profiles
- Image editing capabilities with multiple AI providers

### Social Media Integration
- OAuth flows for platform authentication
- Token management and refresh handling
- Multi-account support per platform
- Platform-specific posting requirements and media handling

### Rate Limiting & Caching
- Redis-based rate limiting for API endpoints
- Caching layer for frequently accessed data
- User-specific rate limits for AI operations

## Development Notes

### SSL Development Setup
The application requires HTTPS for local development due to social media OAuth requirements. SSL certificates are configured in `vite.config.js` and `app.py`.

### Background Processing
All social media posting happens asynchronously via Celery tasks. The main application stores tasks in `background_task_post` table and workers process them independently.

### Authentication Flow
- Supabase Auth for user management
- Flask sessions for request handling
- JWT tokens for API authentication
- Support for Google OAuth and traditional email/password

### Error Handling
- Comprehensive error handling in all API endpoints
- User-friendly error messages with internationalization
- Detailed logging for debugging background tasks

### Testing Social Media Integration
Use platform-specific test accounts and sandbox environments. Each platform has different requirements for media formats, content length, and posting frequency.