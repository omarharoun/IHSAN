# IHSAN Combined Dashboard

A unified web application combining **MindFlow Dashboard** (AI-powered learning platform) and **IHSAN Dashboard** (personal productivity hub) into a single application with tab-based navigation.

## 🚀 Features

### MindFlow Dashboard
- 🤖 **AI Lesson Generation**: Create personalized lessons using OpenAI GPT-3.5
- 📚 **Lesson Management**: Save, organize, and view generated lessons
- 💬 **AI Chat Assistant**: Real-time chat with AI for learning support
- 📊 **Learning Analytics**: Track progress and learning statistics
- 🎯 **Lesson Series**: Create structured learning paths

### IHSAN Dashboard
- 🏠 **Personal Dashboard**: Customizable widgets and layout
- 📱 **Feed System**: Curated content and learning resources
- 🎓 **Learning Hub**: Access to courses and educational content
- 💼 **Work Management**: Project and task tracking
- 🛠️ **Tools & Utilities**: Development and productivity tools
- 📈 **Analytics**: Personal productivity insights

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **State Management**: React Hooks + Context

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI GPT-3.5 Turbo
- **Security**: JWT, CORS, Rate Limiting

## 📁 Project Structure

```
IHSAN/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── Auth/                 # Authentication components
│   │   ├── Dashboard/            # MindFlow dashboard components
│   │   └── IHSANDashboard/       # IHSAN dashboard components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and API client
│   └── types/                    # TypeScript type definitions
├── server/                       # Backend API server
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Custom middleware
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   └── utils/                # Utility functions
│   └── database/                 # Database schema
├── supabase/                     # Supabase migrations
└── docs/                         # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API account

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/omarharoun/IHSAN.git
cd IHSAN

# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure:

```env
# ===========================================
# FRONTEND CONFIGURATION
# ===========================================

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for direct frontend AI calls)
VITE_OPENAI_API_KEY=your_openai_api_key

# Backend API Configuration
VITE_API_URL=http://localhost:3001/api

# ===========================================
# BACKEND CONFIGURATION
# ===========================================

# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration (Backend)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (Backend)
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

The application uses the existing MindFlow Dashboard schema. Run the additional IHSAN tables in your Supabase SQL Editor:

```sql
-- Copy and run the contents of server/database/schema.sql
```

### 4. Start the Application

#### Quick Start (Recommended)

```bash
# Use the startup script (handles everything automatically)
./start.sh
```

#### Manual Start

```bash
# Start both frontend and backend simultaneously
npm run dev
```

#### Individual Services (Optional)

```bash
# Frontend only
npm run dev:frontend-only

# Backend only
npm run dev:backend-only
```

#### Production Mode

```bash
# Build both frontend and backend
npm run build

# Start the backend server
npm start
```

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /logout` - User logout

### MindFlow (`/api/mindflow`)
- `GET /lessons` - Get user's lessons
- `POST /lessons` - Create new lesson
- `GET /lessons/:id` - Get specific lesson
- `PUT /lessons/:id` - Update lesson
- `DELETE /lessons/:id` - Delete lesson
- `POST /lessons/series` - Create lesson series
- `GET /chat` - Get chat messages
- `POST /chat` - Create chat message
- `GET /stats` - Get user statistics

### IHSAN (`/api/ihsan`)
- `GET /dashboard` - Get dashboard data
- `PUT /dashboard` - Update dashboard data
- `GET /content` - Get personalized content
- `GET /feed` - Get feed data
- `GET /learn` - Get learning resources
- `GET /work` - Get work dashboard data
- `GET /tools` - Get tools and utilities
- `GET /analytics` - Get user analytics

### AI Services (`/api/ai`)
- `POST /chat` - Chat with AI
- `POST /generate-lesson` - Generate lesson content
- `POST /generate-series` - Generate lesson series
- `POST /generate-ihsan-content` - Generate IHSAN content
- `POST /analyze-progress` - Analyze user progress

## 🎯 Usage Guide

### Switching Between Dashboards
- Use the top navigation tabs to switch between **MindFlow** and **IHSAN**
- Each dashboard maintains its own state and functionality

### MindFlow Features
1. **Create Lessons**: Click "Create New Lesson" to generate AI-powered content
2. **Chat Assistant**: Use the chat feature for learning support
3. **View Progress**: Check your learning statistics and achievements

### IHSAN Features
1. **Customize Dashboard**: Arrange widgets and set preferences
2. **Browse Feed**: Discover new content and learning resources
3. **Manage Work**: Track projects and tasks
4. **Use Tools**: Access development and productivity utilities

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build:frontend`
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

### Backend (Railway/Heroku/DigitalOcean)
1. Set environment variables
2. Deploy the `server` directory
3. Update `VITE_API_URL` in frontend environment

### Database
- Use Supabase for both development and production
- Run migrations in production Supabase instance

## 🔒 Security Features

- **Authentication**: JWT-based with Supabase Auth
- **Authorization**: Row Level Security (RLS) in Supabase
- **Rate Limiting**: API request limiting
- **CORS**: Configured for specific origins
- **Input Validation**: Express-validator for all inputs
- **Error Handling**: Comprehensive error management

## 📊 Monitoring & Analytics

- **User Analytics**: Track learning progress and engagement
- **Performance**: Monitor API response times
- **Errors**: Log and track application errors
- **Usage**: Monitor feature usage and adoption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check the docs/ directory
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ by the IHSAN Team**