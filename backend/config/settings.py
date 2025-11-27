"""
Django settings for AluOptimize project.

This settings module imports configuration constants from manage.py.
All sensitive configuration values and environment-specific settings
are defined directly in manage.py for easier maintenance.
"""

from pathlib import Path
import os
import logging.config

# Import configuration constants from manage.py per user request.
try:
    import manage as project_manage
except Exception:
    project_manage = None

# Import debug utilities for safe debug toolbar handling
from .debug_utils import get_debug_apps, get_debug_middleware, get_debug_config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# When settings.py is inside `backend/config/`, set BASE_DIR to backend/ so
# paths (static, media, db file) continue to resolve to the backend package.

# Configure logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'backend': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = getattr(project_manage, 'SECRET_KEY', 'replace-me-with-a-secure-secret-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = getattr(project_manage, 'DEBUG', False)

ALLOWED_HOSTS = getattr(project_manage, 'DJANGO_ALLOWED_HOSTS', [])

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Local apps (moved under backend.apps)
    'backend.apps.authapp.apps.AuthappConfig',
    'backend.apps.core.apps.CoreConfig',
    'backend.apps.prediction.apps.PredictionConfig',
    'backend.apps.waste.apps.WasteConfig',
]

# Add debug apps only if available and DEBUG is True
if DEBUG:
    INSTALLED_APPS.extend(get_debug_apps())

# Core middleware that should always be enabled
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Add debug middleware only if DEBUG is True
if DEBUG:
    MIDDLEWARE = get_debug_middleware() + MIDDLEWARE

    # Apply debug toolbar settings
    extra_debug_settings = get_debug_config()
    globals().update(extra_debug_settings)

ROOT_URLCONF = 'backend.config.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'backend.config.wsgi.application'

# Database configuration with driver fallback support
from .db_driver import get_database_config

DATABASES = {
    'default': get_database_config()
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
	{
		'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
	},
	{
		'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
	},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
# The project originally included a custom user model. If you have a
# custom user model (authapp.User) re-enable the line below. For now
# fall back to Django's built-in user model so system checks can run.
AUTH_USER_MODEL = 'auth.User'

# REST Framework settings
REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': (
		'rest_framework_simplejwt.authentication.JWTAuthentication',
	),
	'DEFAULT_PERMISSION_CLASSES': (
		'rest_framework.permissions.IsAuthenticated',
	),
	'PAGE_SIZE': 10,
	'DEFAULT_RENDERER_CLASSES': (
		'rest_framework.renderers.JSONRenderer',
		'rest_framework.renderers.BrowsableAPIRenderer',
	),
	'DEFAULT_PARSER_CLASSES': (
		'rest_framework.parsers.JSONParser',
		'rest_framework.parsers.FormParser',
		'rest_framework.parsers.MultiPartParser'
	),
}

# JWT settings (use lifetimes from manage.py if present)
from datetime import timedelta
_jwt_access_mins = getattr(project_manage, 'JWT_ACCESS_TOKEN_LIFETIME', 5)
_jwt_refresh_mins = getattr(project_manage, 'JWT_REFRESH_TOKEN_LIFETIME', 1440)
SIMPLE_JWT = {
	'ACCESS_TOKEN_LIFETIME': timedelta(minutes=_jwt_access_mins),
	'REFRESH_TOKEN_LIFETIME': timedelta(minutes=_jwt_refresh_mins),
	'ROTATE_REFRESH_TOKENS': True,
	'BLACKLIST_AFTER_ROTATION': True,
	'AUTH_HEADER_TYPES': ('Bearer',),
	'USER_ID_FIELD': 'id',
	'USER_ID_CLAIM': 'user_id',
}

# CORS settings
CORS_ORIGIN_WHITELIST = getattr(project_manage, 'CORS_ORIGIN_WHITELIST', [])
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins for development to fix login issues

# CSRF settings
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000']

# Debug Toolbar settings
INTERNAL_IPS = [
	'127.0.0.1',
]

DEBUG_TOOLBAR_CONFIG = {
	'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
}
