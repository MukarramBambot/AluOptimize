"""
Debug configuration utilities for AluOptimize.
Handles debug toolbar setup with graceful fallback.
"""

import logging
import importlib.util
from typing import List, Tuple

logger = logging.getLogger(__name__)

def is_debug_toolbar_available() -> bool:
    """Check if Django Debug Toolbar is installed and importable."""
    return importlib.util.find_spec('debug_toolbar') is not None

def get_debug_middleware() -> List[str]:
    """
    Get debug middleware classes with fallback handling.
    Returns appropriate middleware list based on debug toolbar availability.
    """
    if not is_debug_toolbar_available():
        logger.warning(
            "Django Debug Toolbar is not installed. Debug middleware will be disabled. "
            "Install with: pip install django-debug-toolbar"
        )
        return []
    
    return ['debug_toolbar.middleware.DebugToolbarMiddleware']

def get_debug_apps() -> List[str]:
    """
    Get debug related apps with fallback handling.
    Returns appropriate app list based on debug toolbar availability.
    """
    if not is_debug_toolbar_available():
        return []
    
    return ['debug_toolbar']

def get_debug_config() -> dict:
    """
    Get debug toolbar configuration with safe defaults.
    """
    if not is_debug_toolbar_available():
        return {}

    return {
        'DEBUG_TOOLBAR_CONFIG': {
            'SHOW_TOOLBAR_CALLBACK': lambda request: True,
            'ENABLE_STACKTRACES': True,
        },
        'INTERNAL_IPS': ['127.0.0.1'],
    }

def get_debug_patterns(urlpatterns: List) -> Tuple[List, bool]:
    """
    Add debug toolbar URL patterns if available.
    Returns tuple of (updated_patterns, patterns_modified).
    """
    if not is_debug_toolbar_available():
        return urlpatterns, False

    try:
        from django.urls import include, path
        debug_patterns = [path('__debug__/', include('debug_toolbar.urls'))]
        return debug_patterns + urlpatterns, True
    except Exception as e:
        logger.warning(f"Failed to add debug toolbar URLs: {str(e)}")
        return urlpatterns, False