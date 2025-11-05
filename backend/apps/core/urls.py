from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = 'core'

# Initialize the router
router = DefaultRouter()

# Add your ViewSet routes here if needed
# router.register(r'some-path', SomeViewSet)

urlpatterns = []

# Add router URLs
urlpatterns += router.urls