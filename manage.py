#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Centralized configuration constants (moved out of .env)
# NOTE: these are sensible defaults for local development. Update them here
# before running the project in a different environment.
# The user explicitly requested that configuration constants live in manage.py.
# Keep this file free of Django initialization side-effects so settings can
# safely import these values.

# SECURITY: replace SECRET_KEY for production
SECRET_KEY = 'k1%6hftg&**-72%@*c!4152890qznms+k0h$dae8h=7bieg1ht'

# Toggle debug mode
DEBUG = True

# Hosts allowed by Django
DJANGO_ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# CORS allowed origins (frontend dev server)
CORS_ORIGIN_WHITELIST = ['http://localhost:3000']

# Simple JWT token lifetimes (in minutes)
JWT_ACCESS_TOKEN_LIFETIME = 5
JWT_REFRESH_TOKEN_LIFETIME = 1440

# Database configuration (MySQL)
# Provided by user — central config in manage.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'AluOptimize',
        'USER': 'root',
        'PASSWORD': '',
        # Use TCP loopback to avoid socket path issues (XAMPP/MAMP setups)
        'HOST': '127.0.0.1',
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
