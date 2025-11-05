from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """Bridge to DRF's default exception handler. Add custom handling here."""
    response = drf_exception_handler(exc, context)
    return response
