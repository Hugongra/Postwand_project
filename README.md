# POSTWAND2 - Social Media Manager SaaS

POSTWAND2 is a comprehensive full-stack Social Media Management platform designed to streamline content creation, scheduling, and multi-platform publishing. Leveraging AI, it helps brands automate their social media presence across Facebook, Instagram, LinkedIn, and more.

## 🎥 Demo

- **Demo video**: [POSTWAND DEMO.mp4](POSTWAND%20DEMO.mp4)

## 🚀 Features

- **Multi-Platform Scheduling**: Schedule posts for Facebook, Instagram, LinkedIn, and more from a single dashboard.
- **AI Content Generation**: 
  - **Text**: Generate engaging post captions using OpenAI.
  - **Images**: Create custom visual content with AI image generation.
- **Brand Information Extraction**: Automatically extract brand assets (logos, colors, etc.) from websites to maintain brand consistency.
- **Account Management**: Connect and manage multiple social media accounts seamlessly.
- **Background Task Processing**: Reliable post delivery using Celery and Redis.
- **Internationalization**: Full multi-language support (i18next).

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, i18next
- **Backend**: Python Flask, Celery, Redis
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Services**: OpenAI API
- **Deployment**: Configured for modern cloud environments

## 🏗️ Architecture

- **Backend (`/backend`)**: Flask API handling business logic, social media integrations, and AI services.
- **Frontend (`/frontend`)**: Responsive React application built with Vite and Tailwind.
- **Worker (`celery_worker.py`)**: Handles asynchronous posting to social media platforms.
- **Scheduler (`celery_scheduler.py`)**: Manages timed tasks and scheduled posts.

## 🚦 Getting Started

### Prerequisites

- Python 3.10+
- Node.js & npm
- Redis (for Celery)
- Supabase account

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd postwand2
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create a .env file and add your credentials
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

1. **Start the Backend**:
   ```bash
   cd backend
   python app.py
   ```

2. **Start Celery Worker & Beat**:
   ```bash
   # In separate terminals
   python celery_worker.py
   python celery_scheduler.py
   ```

3. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## 🔐 Environment Variables

Ensure the following variables are configured in your `backend/.env` file:
- `SUPABASE_URL`, `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_URL`
- Platform-specific API keys (Facebook, LinkedIn, etc.)

## 📄 License

This project is proprietary. All rights reserved.
