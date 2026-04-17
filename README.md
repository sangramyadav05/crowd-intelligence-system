# Crowd Intelligence System

AI-powered crowd management platform for real-time monitoring, prediction, and control of crowd density at events and venues.

## Features

- **Real-time Crowd Monitoring**: Track crowd density across multiple zones
- **AI-Powered Predictions**: Machine learning predicts crowd surges 15-30 minutes ahead
- **Smart Alerts**: Automated notifications for overcrowding and anomalies
- **Public View**: Share live crowd status with attendees via unique event codes
- **Admin Dashboard**: System-wide monitoring and management
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time updates)
- JWT Authentication
- AI Simulation Service

### Frontend
- React + Vite
- Tailwind CSS
- Framer Motion (animations)
- Zustand (state management)
- Recharts (data visualization)

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd crowd-intelligence-system
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
# Server
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Client
cd ../client
cp .env.example .env.local
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Run the application:
```bash
# From root directory
npm run dev
```

This starts both the server (port 5000) and client (port 5173).

### Default Login Credentials

**Admin:**
- Email: admin@crowdintelligence.com
- Password: admin123

**User:**
- Register a new account at `/register`

## Project Structure

```
crowd-intelligence-system/
├── server/
│   ├── config/        # Database config
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth & error handlers
│   ├── services/       # AI simulation
│   └── index.js        # Entry point
├── client/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Zustand stores
│   │   └── lib/        # API client
│   └── index.html
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/profile` - Get user profile

### Events
- `GET /api/events` - Get user's events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `GET /api/events/:id/dashboard` - Get event dashboard with AI data
- `POST /api/events/:id/zones` - Add zone

### Crowd Data
- `POST /api/crowd/update/:eventId` - Update crowd count
- `POST /api/crowd/simulate/:eventId` - Run simulation
- `POST /api/crowd/reset/:eventId` - Reset counts

### AI
- `GET /api/ai/predict/:eventId` - Get predictions
- `GET /api/ai/anomalies/:eventId` - Detect anomalies
- `GET /api/ai/recommendations/:eventId` - Get recommendations

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/events` - All events
- `GET /api/admin/users` - All users
- `GET /api/admin/alerts` - System alerts

### Public
- `POST /api/public/lookup` - Look up event by code
- `GET /api/public/event/:id/status` - Get public event status

## AI Features

The AI service provides:
- **Crowd Prediction**: Predicts crowd count 15-30 minutes ahead using trend analysis
- **Anomaly Detection**: Identifies unusual crowd patterns and rapid surges
- **Smart Recommendations**: Suggests crowd flow optimization strategies
- **Risk Assessment**: Evaluates risk levels based on capacity and trends

## Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

2. Deploy the `server` directory

### Frontend (Vercel/Netlify)
1. Build the client:
```bash
cd client
npm run build
```

2. Deploy the `dist` folder

3. Set environment variable:
   - `VITE_API_URL` = your backend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
