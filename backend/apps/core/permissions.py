from rest_framework import permissions

class IsEngineerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow engineers and admins.
    For now, allows all authenticated users since custom User model is not implemented.
    TODO: Implement custom User model with role field.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Allow superusers
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check for role attribute if custom user model exists
        if hasattr(request.user, 'role'):
            return request.user.role in ['ADMIN', 'ENGINEER']
        
        # Default: allow all authenticated users
        return True

class IsAnalystOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow analysts and admins.
    For now, allows all authenticated users since custom User model is not implemented.
    TODO: Implement custom User model with role field.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Allow superusers
        if request.user.is_superuser or request.user.is_staff:
            return True
            
        # Check for role attribute if custom user model exists
        if hasattr(request.user, 'role'):
            return request.user.role in ['ADMIN', 'ANALYST']
        
        # Default: allow all authenticated users
        return True