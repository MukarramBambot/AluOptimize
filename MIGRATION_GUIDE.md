# Migration Guide - Admin Prediction Control System

## 🚀 Quick Start

Follow these steps to apply the new admin-controlled prediction workflow:

### Step 1: Activate Virtual Environment

```bash
cd /home/mukbambot/Documents/AluOptimize
source virtual/bin/activate
```

### Step 2: Create Missing Backend Files

Some backend files may be missing. Check if these exist:

```bash
# Check for missing files
ls backend/apps/prediction/urls.py
ls backend/apps/waste/urls.py
ls backend/apps/core/urls.py
ls backend/config/db_driver.py
ls backend/config/debug_utils.py
ls backend/apps/core/health.py
ls backend/apps/core/pagination.py
ls backend/apps/core/exceptions.py
```

If any are missing, create them:

#### `backend/apps/prediction/urls.py`
```python
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProductionInputViewSet, ProductionOutputViewSet, PredictionLogViewSet

router = DefaultRouter()
router.register(r'production-inputs', ProductionInputViewSet, basename='production-input')
router.register(r'production-outputs', ProductionOutputViewSet, basename='production-output')
router.register(r'prediction-logs', PredictionLogViewSet, basename='prediction-log')

urlpatterns = router.urls
```

#### `backend/apps/waste/urls.py`
```python
from django.urls import path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
urlpatterns = router.urls
```

#### `backend/apps/core/urls.py`
```python
from django.urls import path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
urlpatterns = router.urls
```

#### `backend/config/db_driver.py`
```python
import manage as project_manage

def get_database_config():
    """Get database configuration from manage.py"""
    return getattr(project_manage, 'DATABASES', {}).get('default', {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'db.sqlite3',
    })
```

#### `backend/config/debug_utils.py`
```python
def get_debug_apps():
    """Return debug apps if available"""
    try:
        import debug_toolbar
        return ['debug_toolbar']
    except ImportError:
        return []

def get_debug_middleware():
    """Return debug middleware if available"""
    try:
        import debug_toolbar
        return ['debug_toolbar.middleware.DebugToolbarMiddleware']
    except ImportError:
        return []

def get_debug_config():
    """Return debug configuration"""
    return {
        'INTERNAL_IPS': ['127.0.0.1'],
        'DEBUG_TOOLBAR_CONFIG': {
            'SHOW_TOOLBAR_CALLBACK': lambda request: True,
        }
    }

def get_debug_patterns(urlpatterns):
    """Add debug toolbar patterns if available"""
    try:
        import debug_toolbar
        from django.urls import include, path
        return [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns, True
    except ImportError:
        return urlpatterns, False
```

#### `backend/apps/core/health.py`
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class WelcomeView(APIView):
    permission_classes = []
    
    def get(self, request):
        return Response({
            'message': 'Welcome to AluOptimize API',
            'version': '1.0.0',
            'status': 'running'
        })

class HealthCheckView(APIView):
    permission_classes = []
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'database': 'connected'
        })
```

#### `backend/apps/core/pagination.py`
```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
```

#### `backend/apps/core/exceptions.py`
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data['status_code'] = response.status_code
    
    return response
```

### Step 3: Create Missing App Files

Create `__init__.py` files if missing:

```bash
touch backend/apps/__init__.py
touch backend/apps/authapp/__init__.py
touch backend/apps/core/__init__.py
touch backend/apps/prediction/__init__.py
touch backend/apps/waste/__init__.py
touch backend/config/__init__.py
```

Create app config files:

#### `backend/apps/authapp/apps.py`
```python
from django.apps import AppConfig

class AuthappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.authapp'
    verbose_name = 'Authentication'
```

#### `backend/apps/core/apps.py`
```python
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.core'
    verbose_name = 'Core'
```

#### `backend/apps/waste/apps.py`
```python
from django.apps import AppConfig

class WasteConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.waste'
    verbose_name = 'Waste Management'
```

### Step 4: Create manage.py if Missing

```bash
cd /home/mukbambot/Documents/AluOptimize
```

Create `manage.py`:

```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Configuration constants
SECRET_KEY = 'django-insecure-your-secret-key-here-change-in-production'
DEBUG = True
DJANGO_ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
CORS_ORIGIN_WHITELIST = ['http://localhost:3000']
JWT_ACCESS_TOKEN_LIFETIME = 5
JWT_REFRESH_TOKEN_LIFETIME = 1440

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'AluOptimize',
        'USER': 'root',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
```

**Important:** Update the database password in `manage.py`!

### Step 5: Run Migrations

```bash
# Create migrations for the new approval fields
python manage.py makemigrations prediction

# Apply all migrations
python manage.py migrate
```

Expected output:
```
Migrations for 'prediction':
  backend/apps/prediction/migrations/0002_productionoutput_approval_fields.py
    - Add field is_approved to productionoutput
    - Add field approved_at to productionoutput
    - Add field processed_by to productionoutput
    - Add field status to productionoutput

Running migrations:
  Applying prediction.0002_productionoutput_approval_fields... OK
```

### Step 6: Start Backend Server

```bash
python manage.py runserver
```

Expected output:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
November 06, 2025 - 00:30:00
Django version 5.2, using settings 'backend.config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### Step 7: Start Frontend (New Terminal)

```bash
cd /home/mukbambot/Documents/AluOptimize/frontend
npm start
```

Expected output:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

### Step 8: Test the System

1. **Login as Admin:**
   - URL: `http://localhost:3000/admin-login`
   - Username: `admin`
   - Password: (your admin password)

2. **Navigate to Prediction Control:**
   - Click on "Prediction Control" tab (4th tab)
   - You should see the statistics cards and predictions table

3. **Test Workflow:**
   - Find a pending input
   - Click "Run Prediction" (▶️ button)
   - Click "Approve" (✅ button)
   - Prediction is now visible to users!

## 🔧 Troubleshooting

### Error: "No module named 'backend'"

**Solution:** Make sure you're in the correct directory:
```bash
cd /home/mukbambot/Documents/AluOptimize
python manage.py runserver
```

### Error: "Table doesn't exist"

**Solution:** Run migrations:
```bash
python manage.py migrate
```

### Error: "Access denied for user"

**Solution:** Update database credentials in `manage.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'AluOptimize',
        'USER': 'root',
        'PASSWORD': 'YOUR_ACTUAL_PASSWORD',  # Update this!
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

### Error: "CORS policy" in browser

**Solution:** Verify CORS settings in `manage.py`:
```python
CORS_ORIGIN_WHITELIST = ['http://localhost:3000']
```

### Error: "Cannot connect to server" in frontend

**Solution:** 
1. Check backend is running at `http://127.0.0.1:8000`
2. Check API base URL in `frontend/src/services/api.js`:
   ```javascript
   export const API_BASE_URL = 'http://127.0.0.1:8000'
   ```

### Error: "You do not have admin privileges"

**Solution:** Make sure your user has admin privileges:
```bash
python manage.py shell
```
```python
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.get(username='admin')
admin.is_staff = True
admin.is_superuser = True
admin.is_active = True
admin.save()
print("Admin privileges granted!")
```

## ✅ Verification Checklist

After migration, verify:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login as admin at `/admin-login`
- [ ] Can access Admin Dashboard
- [ ] Can see "Prediction Control" tab (4th tab)
- [ ] Statistics cards display correctly
- [ ] Predictions table shows data
- [ ] Can run prediction (▶️ button works)
- [ ] Can approve prediction (✅ button works)
- [ ] Can reject prediction (❌ button works)
- [ ] Regular users only see approved predictions
- [ ] Status filtering works
- [ ] Details dialog shows all information

## 📊 Database Schema Changes

New columns in `prediction_productionoutput` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `is_approved` | BOOLEAN | FALSE | Whether prediction is approved |
| `approved_at` | DATETIME | NULL | When prediction was approved |
| `processed_by_id` | INTEGER | NULL | Foreign key to admin user |
| `status` | VARCHAR(50) | 'Pending' | Current status |

## 🎉 Success!

If all steps completed successfully, you now have:

✅ Admin-controlled prediction workflow  
✅ Manual prediction execution  
✅ Approve/Reject functionality  
✅ User filtering (only approved visible)  
✅ Complete audit trail  
✅ Statistics dashboard  
✅ Status filtering  

**Next:** Start using the system and test the complete workflow!

---

**Need Help?** Check `PREDICTION_CONTROL_SYSTEM.md` for detailed documentation.
