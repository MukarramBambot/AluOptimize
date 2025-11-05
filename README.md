# AluOptimize

A full-stack web application for optimizing aluminum production using machine learning.

## Project Structure

```
├── backend/          # Django + DRF backend
├── frontend/         # React + Webpack frontend
├── manage.py         # Django management script
└── README.md        # This file
```

## Backend Setup

1. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Create `.env` file from example:
```bash
cp backend/env.example .env
# Edit .env with your database credentials and secret key
```

4. Set up the MySQL database:
```bash
mysql -u root -p
```

```sql
CREATE DATABASE AluOptimize CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alu_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON AluOptimize.* TO 'alu_user'@'localhost';
FLUSH PRIVILEGES;
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The backend will be available at http://localhost:8000

## Frontend Setup

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:3000

## API Documentation

### Authentication Endpoints

- POST `/api/auth/register/` - Register a new user
- POST `/api/token/` - Obtain JWT token pair
- POST `/api/token/refresh/` - Refresh JWT token
- GET `/api/auth/me/` - Get current user info

### Running Tests

Backend tests:
```bash
python manage.py test
```

Frontend tests:
```bash
cd frontend
npm test
```

## Environment Variables

### Backend (.env)

- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `DATABASE_NAME` - MySQL database name
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_HOST` - Database host
- `DATABASE_PORT` - Database port
- `DJANGO_ALLOWED_HOSTS` - Allowed hosts list
- `JWT_ACCESS_TOKEN_LIFETIME` - JWT access token lifetime in minutes
- `JWT_REFRESH_TOKEN_LIFETIME` - JWT refresh token lifetime in minutes

### Frontend (.env)

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_JWT_COOKIE_NAME` - JWT cookie name
- `REACT_APP_JWT_REFRESH_COOKIE_NAME` - JWT refresh token cookie name
