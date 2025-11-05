from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

User = get_user_model()


class CustomUserAdmin(BaseUserAdmin):
    """
    Custom User admin with approval functionality.
    """
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_active_badge', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    actions = ['approve_users', 'deactivate_users']
    
    def is_active_badge(self, obj):
        """Display active status as colored badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 3px 10px; border-radius: 3px;">✓ Active</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 3px 10px; border-radius: 3px;">✗ Pending</span>'
            )
    is_active_badge.short_description = 'Status'
    
    def approve_users(self, request, queryset):
        """Bulk action to approve users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) successfully approved.')
    approve_users.short_description = 'Approve selected users'
    
    def deactivate_users(self, request, queryset):
        """Bulk action to deactivate users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} user(s) successfully deactivated.')
    deactivate_users.short_description = 'Deactivate selected users'


# Unregister default User admin and register custom one
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, CustomUserAdmin)
