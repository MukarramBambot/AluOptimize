from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to admin users (superusers).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

class IsStaff(permissions.BasePermission):
    """
    Allows access only to staff users (including admins).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))

class IsUser(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
