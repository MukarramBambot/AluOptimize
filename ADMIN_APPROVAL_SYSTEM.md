# Admin Approval System Documentation

## Overview
The AluOptimize platform implements an admin approval system for all new user registrations. This ensures that only authorized stakeholders can access the system after administrative review.

## How It Works

### 1. User Registration Flow

**Frontend (Register Page)**
- Users fill out the registration form with username, email, and password
- An informational alert notifies users that admin approval is required
- Upon successful registration, users see a confirmation message
- Users are redirected to the login page after 4 seconds

**Backend**
- New users are automatically created with `is_active=False`
- User credentials are stored securely with hashed passwords
- Users cannot log in until approved by an administrator

### 2. Admin Approval Process

**Django Admin Interface** (`/admin/auth/user/`)

Administrators can manage user approvals through the Django admin panel:

**Features:**
- **Status Badge**: Visual indicator showing Active (green) or Pending (red) status
- **Bulk Actions**: 
  - "Approve selected users" - Activates multiple users at once
  - "Deactivate selected users" - Deactivates multiple users
- **Filtering**: Filter by active status, staff status, and join date
- **Search**: Search by username, email, first name, or last name

**Approval Steps:**
1. Log in to Django Admin at `http://127.0.0.1:8000/admin/`
2. Navigate to "Users" under "Authentication and Authorization"
3. Select pending users (marked with red "✗ Pending" badge)
4. Choose "Approve selected users" from the Actions dropdown
5. Click "Go" to approve

### 3. Login Flow with Approval Check

**Frontend (Login Page)**
- Users enter their credentials
- If account is inactive, a specific error message is displayed:
  - "Account not approved by admin yet. Please wait for admin approval before logging in."
- Active users can log in normally and access the dashboard

**Backend**
- Custom JWT token serializer checks `is_active` status before issuing tokens
- Inactive users receive a 400 error with detailed message
- Login attempts by inactive users are logged for security monitoring

## Technical Implementation

### Backend Components

**1. User Serializer** (`backend/apps/authapp/serializers.py`)
```python
def create(self, validated_data):
    password = validated_data.pop('password')
    validated_data['is_active'] = False  # Force inactive on registration
    user = User.objects.create(**validated_data)
    user.set_password(password)
    user.save()
    return user
```

**2. Custom Token View** (`backend/apps/authapp/views.py`)
```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError(
                {'detail': 'Account not approved by admin yet.'},
                code='account_inactive'
            )
        return data
```

**3. Custom User Admin** (`backend/apps/authapp/admin.py`)
- Enhanced user list display with status badges
- Bulk approval/deactivation actions
- Improved filtering and search capabilities

### Frontend Components

**1. Register Page** (`frontend/src/pages/Register.js`)
- Info alert about admin approval requirement
- Enhanced success message explaining approval process
- 4-second delay before redirect to login

**2. Login Page** (`frontend/src/pages/Login.js`)
- Specific error handling for inactive accounts
- Clear messaging to users about approval status
- Prevents confusion with other login errors

## Security Features

1. **Inactive by Default**: All new registrations start as inactive
2. **Token Prevention**: Inactive users cannot obtain JWT tokens
3. **Audit Logging**: Login attempts by inactive users are logged
4. **Admin Control**: Only administrators can approve accounts
5. **Bulk Operations**: Efficient management of multiple pending users

## User Experience

### For New Users
1. Register with username, email, and password
2. See confirmation that account is pending approval
3. Attempt to log in shows clear "pending approval" message
4. Once approved, can log in normally

### For Administrators
1. Access Django Admin panel
2. View all pending users with visual indicators
3. Review user details
4. Approve users individually or in bulk
5. Deactivate users if needed

## API Endpoints

### Registration
- **Endpoint**: `POST /api/auth/users/`
- **Behavior**: Creates inactive user
- **Response**: User data with `is_active: false`

### Login
- **Endpoint**: `POST /api/token/`
- **Behavior**: Checks active status before issuing tokens
- **Error Response** (inactive user):
  ```json
  {
    "detail": "Account not approved by admin yet. Please wait for admin approval."
  }
  ```

## Future Enhancements

### Planned Features

1. **Email Notifications**
   - Send email to users when account is approved
   - Notify admins of new registration requests
   - Reminder emails for pending approvals

2. **Role-Based Permissions**
   - Admin: Full system access
   - Supervisor: Approve inputs, view reports
   - Operator: Submit data only
   - Analyst: View-only access

3. **Approval Logs**
   - Track who approved which user
   - Record approval timestamps
   - Maintain audit trail

4. **Self-Service Portal**
   - Users can check approval status
   - Request approval reminder
   - Contact admin directly

5. **Automated Workflows**
   - Auto-approve users from specific email domains
   - Multi-level approval process
   - Time-based auto-deactivation

## Configuration

### Admin Account Setup

To create a superuser for approving accounts:

```bash
python manage.py createsuperuser
```

Follow the prompts to set username, email, and password.

### Settings

No additional configuration required. The system uses:
- Django's built-in `is_active` field
- Custom JWT token serializer
- Enhanced Django admin interface

## Troubleshooting

### User Can't Log In After Registration
- **Cause**: Account not yet approved
- **Solution**: Admin must approve via Django Admin

### Admin Can't See Pending Users
- **Cause**: Not logged in as superuser
- **Solution**: Use superuser account or grant staff permissions

### Approved User Still Can't Log In
- **Cause**: Token cache or browser issue
- **Solution**: Clear browser cache, try incognito mode

## Best Practices

1. **Regular Review**: Check pending users daily
2. **Verification**: Verify user identity before approval
3. **Communication**: Inform users about approval timeline
4. **Documentation**: Keep records of approval decisions
5. **Security**: Never share admin credentials

## Support

For issues or questions about the approval system:
- Check Django Admin logs
- Review backend logs for authentication errors
- Verify user `is_active` status in database
- Contact system administrator

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
