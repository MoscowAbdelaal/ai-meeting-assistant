# 📋 AI Meeting Assistant

AI-powered tool that extracts summaries, decisions, and action items from meeting transcripts.

## 🚀 Live Demo

- **Frontend**: https://ai-meeting-assistant-frontend-h2po.onrender.com
- **Backend API**: https://ai-meeting-assistant-h0if.onrender.com

## ✨ Features

- ✅ **Authentication** - Sign up, login, protected routes (Supabase)
- ✅ **AI Processing** - Extract summaries, decisions, action items (Gemini 3.1 Flash Lite)
- ✅ **PDF Reports** - Professional meeting reports with Puppeteer
- ✅ **Email Reminders** - Daily cron job for overdue action items
- ✅ **Caching** - In-memory cache for AI results (24-hour TTL)
- ✅ **Rate Limiting** - 5/min for auth, 10/hour for AI
- ✅ **Testing** - Jest + Supertest test suite
- ✅ **Docker** - Containerized deployment
- ✅ **Metrics** - 10x time savings calculation

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| Database | SQLite |
| Authentication | Supabase |
| AI | Google Gemini 3.1 Flash Lite |
| PDF Generation | Puppeteer |
| Background Jobs | Node-cron |
| Caching | In-memory TTL |
| Rate Limiting | Express-rate-limit |
| Testing | Jest + Supertest |
| Deployment | Render.com |
| Container | Docker |

## 📦 Quick Start

```bash
# Clone repository
git clone https://github.com/MoscowAbdelaal/ai-meeting-assistant.git
cd ai-meeting-assistant

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
🐳 Docker

bash
docker-compose up --build
🧪 Testing

bash
cd backend
npm test
📊 10x Metrics

The system calculates time saved automatically:

Manual: 30 minutes per meeting
AI: 3 minutes per meeting
Time saved: 27 minutes per meeting (10x)
📝 Environment Variables

env
PORT=3001
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SITE_URL=http://localhost:3000
🔗 API Endpoints

Method	Endpoint	Description
POST	/api/auth/signup	Register user
POST	/api/auth/signin	Login user
GET	/api/auth/me	Get current user
POST	/api/meetings	Create meeting
GET	/api/meetings	List meetings
GET	/api/meetings/:id	Get meeting
POST	/api/meetings/:id/process	Process with AI
GET	/api/meetings/:id/pdf	Download PDF
GET	/api/cache/stats	Cache statistics
GET	/api/metrics/time-saved	10x metrics
📄 License

MIT

👨‍💻 Author

Marwan Abdelaal — FlyRank Internship, Backend Track
