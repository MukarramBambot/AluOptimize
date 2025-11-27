"""
Admin Panel URL Configuration
"""
from django.urls import path
from .admin_views import (
    AdminDashboardView,
    AdminUsersView,
    AdminUserApproveView,
    AdminUserRejectView,
    AdminUserBulkApproveView,
    AdminUserCreateView,
    AdminInputReportsView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/', AdminUsersView.as_view(), name='admin-users'),
    path('users/<int:user_id>/approve/', AdminUserApproveView.as_view(), name='admin-user-approve'),
    path('users/<int:user_id>/reject/', AdminUserRejectView.as_view(), name='admin-user-reject'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin-user-create'),
    path('users/bulk_approve/', AdminUserBulkApproveView.as_view(), name='admin-user-bulk-approve'),
    path('input-reports/users/', AdminInputReportsView.as_view(), {'action': 'users'}, name='admin-reports-users'),
    path('input-reports/<int:user_id>/inputs/', AdminInputReportsView.as_view(), {'action': 'inputs'}, name='admin-reports-inputs'),
    path('input-reports/generate/', AdminInputReportsView.as_view(), {'action': 'generate'}, name='admin-reports-generate'),
]
