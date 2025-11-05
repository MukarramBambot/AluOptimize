"""
URL configuration for admin API endpoints.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminDashboardViewSet,
    AdminUserManagementViewSet,
    AdminPredictionManagementViewSet,
    AdminTransactionViewSet,
)

router = DefaultRouter()
router.register(r'dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'users', AdminUserManagementViewSet, basename='admin-users')
router.register(r'predictions', AdminPredictionManagementViewSet, basename='admin-predictions')
router.register(r'transactions', AdminTransactionViewSet, basename='admin-transactions')

urlpatterns = router.urls
