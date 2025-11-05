# AluOptimize Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- pip and npm

## Backend Setup

### 1. Create Virtual Environment

```bash
cd /home/mukbambot/Documents/AluOptimize
python3 -m venv virtual
source virtual/bin/activate  # On Windows: virtual\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Database

Create MySQL database:

```sql
CREATE DATABASE AluOptimize CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update database credentials in `manage.py` (lines 31-41):

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'AluOptimize',
        'USER': 'root',  # Your MySQL username
        'PASSWORD': '',  # Your MySQL password
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Start Backend Server

```bash
python manage.py runserver
```

Backend will be available at: http://localhost:8000

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

The `.env` file is already created with default values:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_JWT_COOKIE_NAME=access_token
REACT_APP_JWT_REFRESH_COOKIE_NAME=refresh_token
```

### 3. Start Frontend Server

```bash
npm start
```

Frontend will be available at: http://localhost:3000

## Testing the Application

### 1. Register a New User

- Navigate to http://localhost:3000/register
- Create an account with username, email, and password

### 2. Login

- Navigate to http://localhost:3000/login
- Login with your credentials

### 3. Test Features

#### Production Input Form
- Go to "Inputs" page
- Fill in all production parameters
- Submit the form

#### Predictions
- Go to "Predictions" page
- View prediction charts and data

#### Waste Management
- Go to "Waste" page
- View waste records
- Generate recommendations for waste records

#### Recommendations
- Go to "Recommendations" page
- View AI-generated waste optimization recommendations

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/auth/users/` - Register new user
- `GET /api/auth/users/{id}/` - Get user details

### Production
- `GET /api/prediction/inputs/` - List production inputs
- `POST /api/prediction/inputs/` - Create production input
- `GET /api/prediction/outputs/` - List production outputs
- `GET /api/prediction/logs/` - List prediction logs

### Waste Management
- `GET /api/waste/management/` - List waste records
- `POST /api/waste/management/` - Create waste record
- `POST /api/waste/management/{id}/generate_recommendations/` - Generate recommendations
- `GET /api/waste/recommendations/` - List recommendations

## Troubleshooting

### Backend Issues

**Django not found:**
```bash
# Make sure virtual environment is activated
source virtual/bin/activate
pip install -r requirements.txt
```

**MySQL connection error:**
- Verify MySQL is running
- Check database credentials in `manage.py`
- Ensure database exists

**Migration errors:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend Issues

**Module not found:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Change port in webpack.config.js (line 46)
# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

### Implement ML Model
- Add actual machine learning model for predictions
- Replace dummy prediction logic in `backend/apps/prediction/views.py`

### Add Custom User Model
- Create custom User model with role field (ADMIN, ENGINEER, ANALYST)
- Update permissions to use role-based access control

### Enhance UI
- Add more charts and visualizations
- Implement real-time updates
- Add export functionality for reports

### Add Tests
- Write unit tests for backend views and models
- Add frontend component tests
- Implement integration tests

## Support

For issues or questions, refer to:
- Django Documentation: https://docs.djangoproject.com/
- React Documentation: https://react.dev/
- Material-UI Documentation: https://mui.com/
