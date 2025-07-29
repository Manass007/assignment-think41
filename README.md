# Chat Application

A full-stack chat application built with Django (backend) and React (frontend) using Docker for containerization. The application features real-time messaging, user authentication, and AI-powered responses via Groq API.

## 🏗️ Architecture

- **Backend**: Django REST Framework with PostgreSQL
- **Frontend**: React with Vite, Tailwind CSS, and Zustand for state management
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **AI Integration**: Groq API for intelligent responses

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)
- [Groq API Account](https://groq.com/) (for AI functionality)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd assignment-think41
```

### 2. Set Up Groq API Key

1. Visit [Groq Console](https://console.groq.com/) and create an account
2. Generate an API key from your dashboard
3. Navigate to `Backend/conversations/llm.py`
4. Replace the placeholder with your actual Groq API key:

```python
# In Backend/conversations/llm.py
GROQ_API_KEY = "your_actual_groq_api_key_here"
```

### 3. Build and Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Initialize the Database

In a new terminal window:

```bash
# Run database migrations
docker-compose exec backend python manage.py migrate

# Create a superuser for Django admin (Method 1)
docker-compose exec backend python manage.py createsuperuser

# Alternative method if above doesn't work (Method 2)
docker exec -it chat-backend python manage.py createsuperuser
```

Follow the prompts to create your admin account with:
- **Username**: Choose a username (e.g., `admin`)
- **Email**: Enter your email address
- **Password**: Create a secure password

> **⚠️ Important**: After creating the superuser, you must **login first** using these credentials to access the complete AI functionalities. The application requires authentication to enable all chat features and AI-powered responses.

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **Database**: localhost:5432 (accessible via PostgreSQL client)

> **🔐 Authentication Required**: To access the complete AI chat functionalities, you must first **login** to the application using the superuser credentials you created in step 4. Without authentication, some features may be limited or unavailable.

## 🛠️ Development Setup

### Project Structure

```
assignment-think41/
├── Backend/
│   ├── chat_backend/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── conversations/
│   │   ├── migrations/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── llm.py           # ⚠️ Add your Groq API key here
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── utils.py
│   │   └── views.py
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ConversationSidebar.jsx
│   │   │   ├── Message.jsx
│   │   │   ├── MessageList.jsx
│   │   │   └── UserInput.jsx
│   │   ├── hooks/
│   │   │   └── useChat.js
│   │   ├── pages/
│   │   │   └── TestPage.jsx
│   │   ├── services/
│   │   │   └── apiService.js
│   │   ├── store/
│   │   │   └── chatStore.js
│   │   └── assets/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── docker-compose.yml
```

### Backend Configuration

The Django backend includes:

- **REST API** with Django REST Framework
- **JWT Authentication** for secure user sessions
- **CORS Configuration** for frontend communication
- **PostgreSQL Integration** for data persistence
- **AI Integration** via Groq API for intelligent responses

### Frontend Configuration

The React frontend features:

- **Modern React 19** with functional components and hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Lucide React** for icons

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables:

**Backend (Django)**:
- `DEBUG=1` - Enable debug mode
- `DATABASE_URL` - PostgreSQL connection string (auto-configured in Docker)

**Frontend (React)**:
- `VITE_API_URL=http://localhost:8000` - Backend API URL

### Database Configuration

The application supports both Docker and local development databases:

**Docker (Production-like)**:
- Database: `chatapp`
- User: `chatuser`
- Password: `chatpassword`
- Host: `database` (Docker service)
- Port: `5432`

**Local Development**:
- Database: `ecommerce`
- User: `postgres`
- Password: `admin`
- Host: `localhost`
- Port: `5432`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token

### Chat
- `GET /api/conversations/` - Get user conversations
- `POST /api/conversations/` - Create new conversation
- `GET /api/conversations/{id}/` - Get specific conversation
- `POST /api/conversations/{id}/messages/` - Send message
- `GET /api/conversations/{id}/messages/` - Get conversation messages

## 🐛 Troubleshooting

### Common Issues

**1. Frontend container fails to start with Rollup error**
```bash
# Solution: Rebuild with no cache
docker-compose down
docker-compose build --no-cache frontend
docker-compose up
```

**2. Backend missing Python dependencies**
```bash
# Solution: Add missing packages to requirements.txt and rebuild
docker-compose build --no-cache backend
```

**3. Database connection errors**
```bash
# Solution: Ensure database is running and check credentials
docker-compose logs database
docker-compose restart backend
```

**4. CORS errors in browser**
- Ensure frontend URL is added to `CORS_ALLOWED_ORIGINS` in `settings.py`
- Check that the frontend is running on the expected port

**5. Groq API errors**
- Verify your API key is correctly set in `Backend/conversations/llm.py`
- Check your Groq account has sufficient credits
- Ensure API key has necessary permissions

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Restart specific service
docker-compose restart backend

# Execute commands in running container
docker-compose exec backend python manage.py shell
docker-compose exec frontend npm install

# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v
```

### Database Management

```bash
# Access PostgreSQL directly
docker-compose exec database psql -U chatuser -d chatapp

# Run Django migrations
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
# Alternative method
docker exec -it chat-backend python manage.py createsuperuser

# Collect static files (if needed)
docker-compose exec backend python manage.py collectstatic
```

## 🔒 Security Notes

For production deployment:

1. **Change default credentials** in `docker-compose.yml`
2. **Set DEBUG=False** in Django settings
3. **Use environment variables** for sensitive data
4. **Configure proper ALLOWED_HOSTS** in Django settings
5. **Use HTTPS** for all communications
6. **Secure your Groq API key** (use environment variables)

## 🚀 Production Deployment

For production deployment, consider:

1. **Use production-grade WSGI server** (like Gunicorn)
2. **Set up reverse proxy** (Nginx)
3. **Configure SSL certificates**
4. **Use managed database service**
5. **Set up proper logging and monitoring**
6. **Configure backup strategies**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

[Add your license information here]

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the Docker logs for error messages
3. Ensure all prerequisites are properly installed
4. Verify your Groq API key is valid and has sufficient credits

---

**Happy coding! 🎉**