# 📋 TaskFlow

TaskFlow is a smart and intuitive project management web application designed to help individuals and teams organize their work efficiently. Built with Next.js and powered by AI, TaskFlow enables users to manage projects, prioritize tasks intelligently, and collaborate seamlessly.

## ✨ Features

### 🔐 Authentication & Authorization
- **Google OAuth Integration**: Secure login and registration using Google accounts
- **JWT-based Authentication**: Secure session management with HTTP-only cookies
- **User Profile Management**: View and manage user information

### 📊 Project Management
- **Create & Manage Projects**: Organize work into separate projects
- **Project Invitations**: Invite team members to collaborate on projects
- **Role-based Access**: Different permission levels for project members
- **Project Dashboard**: Overview of all your projects in one place

### ✅ Task Management
- **Kanban Board**: Visual task organization with drag-and-drop functionality
  - Backlog
  - To Do
  - In Progress
  - Done
- **Task Prioritization**: Set priority levels (Low, Medium, High, Urgent)
- **Due Dates**: Set and track task deadlines
- **Task Comments**: Collaborate with team members through task comments
- **Task Streaming**: Real-time updates using server-sent events

### 🤖 AI-Powered Features
- **Gemini AI Integration**: Intelligent task prioritization
- **Automatic Task Suggestions**: AI-powered recommendations for task order
- **Smart Task Management**: AI helps optimize your workflow

### 📅 Google Calendar Integration
- **Sync with Calendar**: Automatically create calendar events for tasks with due dates
- **Real-time Updates**: Changes to tasks reflect in Google Calendar
- **Event Management**: Update or delete calendar events when tasks change

### 📈 Analytics & Insights
- **Dashboard Statistics**: Track task completion rates
- **Yearly Overview**: View performance trends over time
- **Monthly Reports**: Current month task statistics
- **Visual Charts**: Interactive data visualization

### 🔔 Notifications
- **Email Notifications**: Stay informed about project invitations and updates
- **Real-time Alerts**: Instant notifications for important events

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag and drop functionality
- **Lucide React** - Icon library
- **SweetAlert2** - Beautiful alerts and modals

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoloquent** - Elegant MongoDB ODM
- **JWT** - Authentication tokens
- **Nodemailer** - Email sending
- **Zod** - Schema validation

### AI & Integration
- **Google Generative AI (Gemini)** - AI-powered features
- **Google OAuth 2.0** - Authentication
- **Google Calendar API** - Calendar integration
- **googleapis** - Google API client

## 📁 Project Structure

```
taskflow-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── projects/             # Project management
│   │   ├── tasks/                # Task management
│   │   ├── comments/             # Comment system
│   │   ├── invitations/          # Project invitations
│   │   ├── dashboard/            # Analytics endpoints
│   │   └── ai/                   # AI features
│   ├── components/               # Reusable React components
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── project/                  # Project pages
│   ├── task/                     # Task detail pages
│   └── invitations/              # Invitation pages
├── server/                       # Backend models
│   ├── User.ts                   # User model
│   ├── Project.ts                # Project model
│   ├── Task.ts                   # Task model
│   ├── Comment.ts                # Comment model
│   ├── Member.ts                 # Project member model
│   └── schemas/                  # Zod validation schemas
├── helpers/                      # Utility functions
│   ├── auth.ts                   # Authentication helpers
│   ├── jwt.ts                    # JWT utilities
│   ├── mailer.ts                 # Email utilities
│   └── googleCalendar.ts         # Google Calendar integration
└── scripts/                      # Utility scripts
    └── seed.ts                   # Database seeding
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- MongoDB instance (local or cloud)
- Google Cloud Project with OAuth 2.0 credentials
- Google Calendar API enabled

### Environment Variables

Create a `.env` file in the `taskflow-app` directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=taskflow

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TaskFlow-FP/TaskFlow.git
cd TaskFlow/taskflow-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 📖 API Documentation

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/invitations` - Invite member to project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/calendar` - Sync task with Google Calendar
- `GET /api/tasks/stream` - Server-sent events for real-time updates

### AI Features
- `POST /api/ai/prioritize` - AI-powered task prioritization

### Other
- `GET /api/users/me` - Get current user
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/invitations/pending` - Get pending invitations

## 🎯 Key Features Explained

### Drag & Drop Task Board
TaskFlow uses `@dnd-kit` for smooth drag-and-drop interactions. Tasks can be moved between columns (Backlog, To Do, In Progress, Done) with automatic status updates.

### AI Prioritization
Powered by Google's Gemini AI, TaskFlow analyzes your tasks and suggests optimal prioritization based on due dates, dependencies, and importance.

### Real-time Updates
Server-Sent Events (SSE) provide real-time task updates across all connected clients, ensuring everyone stays in sync.

### Google Calendar Sync
Tasks with due dates automatically create Google Calendar events. Updates to tasks reflect in your calendar, keeping everything synchronized.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

Developed by the TaskFlow Team

## 🐛 Bug Reports

If you find a bug, please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

## 💡 Feature Requests

Have an idea? Open an issue with the `enhancement` label!

---

**Made with ❤️ by TaskFlow Team**

