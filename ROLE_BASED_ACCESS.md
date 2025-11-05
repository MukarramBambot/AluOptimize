# Role-Based Access Control (RBAC) Documentation

## Overview

AluOptimize now includes a scalable role-based access control system that allows for fine-grained permission management. The system is currently in **placeholder mode**, meaning all authenticated users have access to all features, but the infrastructure is ready for full enforcement when needed.

## User Roles

The following roles are defined in the system:

### 1. **Admin**
- Full system access
- Can manage users, production data, waste, and all other features
- Has all permissions

### 2. **Researcher**
- Focus on data analysis and insights
- Can view dashboards, predictions, and recommendations
- Can export data for analysis
- Cannot manage production or waste directly

### 3. **Factory Manager**
- Operational management role
- Can manage production inputs and waste
- Can view all analytics and recommendations
- Cannot manage users or system settings

### 4. **Operator**
- Day-to-day production role
- Can manage production inputs
- Can view dashboards and predictions
- Limited access to waste management and recommendations

### 5. **Analyst**
- Data-focused role
- Can view all analytics, predictions, and recommendations
- Can export data
- Cannot manage production or waste

## Permissions

The following permissions are defined:

| Permission | Description |
|------------|-------------|
| `VIEW_DASHBOARD` | Access to main dashboard |
| `MANAGE_PRODUCTION` | Create/edit production inputs |
| `VIEW_PREDICTIONS` | View prediction results |
| `MANAGE_WASTE` | Create/edit waste records |
| `VIEW_RECOMMENDATIONS` | View AI recommendations |
| `MANAGE_USERS` | Admin user management |
| `EXPORT_DATA` | Export data for analysis |

## Role-Permission Matrix

| Role | Permissions |
|------|-------------|
| **Admin** | All permissions |
| **Researcher** | VIEW_DASHBOARD, VIEW_PREDICTIONS, VIEW_RECOMMENDATIONS, EXPORT_DATA |
| **Factory Manager** | VIEW_DASHBOARD, MANAGE_PRODUCTION, VIEW_PREDICTIONS, MANAGE_WASTE, VIEW_RECOMMENDATIONS |
| **Operator** | VIEW_DASHBOARD, MANAGE_PRODUCTION, VIEW_PREDICTIONS |
| **Analyst** | VIEW_DASHBOARD, VIEW_PREDICTIONS, VIEW_RECOMMENDATIONS, EXPORT_DATA |

## Implementation Guide

### Frontend Structure

#### 1. AuthContext (`/frontend/src/context/AuthContext.js`)

The AuthContext provides:
- `user` - Current user object with role and permissions
- `hasPermission(permission)` - Check if user has a specific permission
- `hasRole(role)` - Check if user has a specific role
- `USER_ROLES` - Role constants
- `PERMISSIONS` - Permission constants
- `ROLE_PERMISSIONS` - Role-to-permission mapping

#### 2. Protected Routes (`/frontend/src/router/index.js`)

Routes can be protected with optional permission checks:

```javascript
<ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
  <AdminPanel />
</ProtectedRoute>
```

#### 3. Role Helpers (`/frontend/src/utils/roleHelpers.js`)

Utility functions for role checking:
- `userHasRole(user, role)`
- `userHasAnyRole(user, roles)`
- `userHasPermission(user, permission)`
- `getUserRoleDisplayName(user)`

### Usage Examples

#### Example 1: Conditional Rendering Based on Permission

```javascript
import { useContext } from 'react';
import { AuthContext, PERMISSIONS } from '../context/AuthContext';

function MyComponent() {
  const { user, hasPermission } = useContext(AuthContext);
  
  return (
    <div>
      {hasPermission(PERMISSIONS.MANAGE_USERS) && (
        <Button>Manage Users</Button>
      )}
    </div>
  );
}
```

#### Example 2: Conditional Rendering Based on Role

```javascript
import { useContext } from 'react';
import { AuthContext, USER_ROLES } from '../context/AuthContext';

function MyComponent() {
  const { user, hasRole } = useContext(AuthContext);
  
  return (
    <div>
      {hasRole(USER_ROLES.ADMIN) && (
        <AdminPanel />
      )}
      {hasRole(USER_ROLES.FACTORY_MANAGER) && (
        <FactoryManagerDashboard />
      )}
    </div>
  );
}
```

#### Example 3: Using Role Helpers

```javascript
import { userHasPermission, getUserRoleDisplayName } from '../utils/roleHelpers';
import { PERMISSIONS } from '../context/AuthContext';
import { AuthContext } from '../context/AuthContext';

function UserProfile() {
  const { user } = useContext(AuthContext);
  
  return (
    <div>
      <h2>Welcome, {user.username}</h2>
      <p>Role: {getUserRoleDisplayName(user)}</p>
      
      {userHasPermission(user, PERMISSIONS.EXPORT_DATA) && (
        <Button>Export Data</Button>
      )}
    </div>
  );
}
```

#### Example 4: Protected Route with Permission

```javascript
// In router/index.js
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

## Backend Integration (Future)

To fully implement role-based access control, the backend needs to:

### 1. Add Role Field to User Model

```python
# backend/apps/authapp/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('researcher', 'Researcher'),
        ('factory_manager', 'Factory Manager'),
        ('operator', 'Operator'),
        ('analyst', 'Analyst'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='operator',
        help_text='User role for access control'
    )
```

### 2. Update User Serializer

```python
# backend/apps/authapp/serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'is_staff', 'is_superuser', 'date_joined']
        read_only_fields = ['date_joined']
```

### 3. Create Permission Classes

```python
# backend/apps/core/permissions.py
from rest_framework import permissions

class HasPermission(permissions.BasePermission):
    """
    Custom permission to check user role and permissions
    """
    required_permission = None
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        # Check role-based permissions
        # Implementation depends on your permission logic
        return True  # Placeholder
```

### 4. Apply Permissions to Views

```python
# backend/apps/waste/views.py
from backend.apps.core.permissions import HasPermission

class WasteManagementViewSet(viewsets.ModelViewSet):
    queryset = WasteManagement.objects.all()
    serializer_class = WasteManagementSerializer
    permission_classes = [HasPermission]
    # ... rest of the view
```

## Current Status

**Status: Placeholder Mode (Not Enforced)**

- ✅ Role structure defined in frontend
- ✅ Permission system implemented in AuthContext
- ✅ Helper functions created
- ✅ Protected routes support permission checks
- ⚠️ All authenticated users currently have full access
- ⚠️ Backend does not yet have role field
- ⚠️ Permission checks log warnings but don't block access

## Migration Path

To fully enable role-based access control:

1. **Backend Changes:**
   - Add role field to User model
   - Run migrations
   - Update user serializer
   - Implement permission classes
   - Apply permissions to views

2. **Frontend Changes:**
   - Remove placeholder mode from `hasPermission` function
   - Update `ProtectedRoute` to redirect on permission denial
   - Add "Access Denied" page
   - Test all role scenarios

3. **Testing:**
   - Create test users with different roles
   - Verify permission enforcement
   - Test edge cases (role changes, permission updates)

4. **Documentation:**
   - Update user documentation
   - Create admin guide for role assignment
   - Document permission troubleshooting

## Security Notes

- Always validate permissions on the backend
- Frontend permission checks are for UX only
- Never rely solely on frontend validation
- Implement proper API authentication and authorization
- Log permission denials for security monitoring
- Regularly audit role assignments

## Future Enhancements

- [ ] Dynamic permission assignment
- [ ] Custom roles creation
- [ ] Permission groups
- [ ] Time-based access control
- [ ] IP-based restrictions
- [ ] Two-factor authentication for admin roles
- [ ] Audit logging for sensitive operations
- [ ] Role hierarchy (role inheritance)
