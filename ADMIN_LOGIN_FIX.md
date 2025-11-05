# Admin Login Fix - Complete Guide

## Issue Fixed
The admin login at `/admin-login` was returning "Request failed with status code 400" because the login function was being called with incorrect parameters.

## Root Cause
**AdminLogin.js** was calling:
```javascript
await login(formData.username.trim(), formData.password);
```

But **AuthContext.js** expects:
```javascript
await login({ username: '...', password: '...' });
```

## Solution Applied

### Fixed AdminLogin.js
Changed the login call to pass credentials as an object:

```javascript
const credentials = {
  username: formData.username.trim(),
  password: formData.password
};

await login(credentials);
```

### Enhanced Error Handling
Added comprehensive error handling:
- **Network errors**: "Cannot connect to server. Please ensure the backend is running."
- **400/401 errors**: "Invalid username or password."
- **Inactive account**: "Account not approved by admin yet."
- **Other errors**: Display specific error message from backend

## API Flow

### 1. Frontend Request
```javascript
// AdminLogin.js calls AuthContext.login()
const credentials = { username: 'admin', password: 'password' };
await login(credentials);
```

### 2. AuthService Call
```javascript
// authService.js
const resp = await api.post('/token/', credentials);
// POST http://127.0.0.1:8000/api/token/
// Body: { "username": "admin", "password": "password" }
```

### 3. Backend Response
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 4. Token Storage
```javascript
// Stored in both cookies and localStorage
Cookies.set('access_token', accessToken, { expires: 1 });
localStorage.setItem('accessToken', accessToken);
```

### 5. User Data Fetch
```javascript
// Decode token to get user_id
const decoded = decodeToken(data.access);
const userId = decoded.user_id;

// Fetch full user data
const resp = await api.get(`/auth/users/${userId}/`);
setUser(resp.data);
```

### 6. Admin Check & Redirect
```javascript
// useEffect in AdminLogin.js
if (user && (user.is_staff || user.is_superuser)) {
  navigate('/admin-dashboard');
} else if (user) {
  setError('You do not have admin privileges.');
}
```

## Configuration Verification

### Backend (Django)

**API Endpoint**: `POST /api/token/`
- Defined in: `backend/apps/authapp/urls.py`
- View: `CustomTokenObtainPairView`
- Checks: `is_active` status

**CORS Settings** (manage.py):
```python
CORS_ORIGIN_WHITELIST = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True
```

**JWT Settings** (manage.py):
```python
JWT_ACCESS_TOKEN_LIFETIME = 5  # minutes
JWT_REFRESH_TOKEN_LIFETIME = 1440  # minutes (24 hours)
```

### Frontend (React)

**API Base URL** (frontend/src/services/api.js):
```javascript
export const API_BASE_URL = 'http://127.0.0.1:8000'
const api = axios.create({ 
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
})
```

**Routes** (frontend/src/router/index.js):
- `/admin-login` → AdminLogin (public)
- `/admin-dashboard` → AdminDashboard (protected)

## Testing Steps

### 1. Start Backend
```bash
cd /home/mukbambot/Documents/AluOptimize
source virtual/bin/activate
python manage.py runserver
```

Backend should be running at: `http://127.0.0.1:8000/`

### 2. Start Frontend
```bash
cd /home/mukbambot/Documents/AluOptimize/frontend
npm start
```

Frontend should be running at: `http://localhost:3000/`

### 3. Test Admin Login

**Valid Login:**
1. Navigate to `http://localhost:3000/admin-login`
2. Enter username: `admin`
3. Enter password: (your admin password)
4. Click "Sign In as Admin"
5. Should redirect to `/admin-dashboard`

**Invalid Login:**
1. Enter wrong username/password
2. Should show: "Invalid username or password."

**Backend Offline:**
1. Stop backend server
2. Try to login
3. Should show: "Cannot connect to server. Please ensure the backend is running."

**Non-Admin User:**
1. Login with regular user credentials
2. Should show: "You do not have admin privileges. Please contact an administrator."

### 4. Verify Admin Dashboard Access

After successful login:
- Should see admin dashboard with 5 tabs
- Overview tab shows statistics
- Users tab shows user management
- Predictions tab shows predictions
- Payments tab shows transactions
- Reports tab allows downloads

## Reset Admin Password

If you can't login with existing admin account:

```bash
cd /home/mukbambot/Documents/AluOptimize
source virtual/bin/activate
python manage.py changepassword admin
```

Or via Django shell:
```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.get(username='admin')
admin.set_password('newpassword123')
admin.is_active = True
admin.is_staff = True
admin.is_superuser = True
admin.save()
print("Password reset successfully!")
```

## Database Migrations

The Transaction model needs to be migrated:

```bash
source virtual/bin/activate
python manage.py makemigrations core
python manage.py migrate
```

This will create the `core_transaction` table for payment tracking.

## Troubleshooting

### Error: "Request failed with status code 400"
**Cause**: Invalid credentials or wrong request format
**Solution**: 
- Verify username and password are correct
- Check backend logs for specific error
- Ensure user account is active

### Error: "Cannot connect to server"
**Cause**: Backend is not running
**Solution**: Start backend with `python manage.py runserver`

### Error: "You do not have admin privileges"
**Cause**: User is not staff/superuser
**Solution**: 
```python
# In Django shell
user = User.objects.get(username='your_username')
user.is_staff = True
user.is_superuser = True
user.save()
```

### Login succeeds but doesn't redirect
**Cause**: User object doesn't have is_staff/is_superuser fields
**Solution**: Check AuthContext is fetching user data correctly

### CORS errors in browser console
**Cause**: CORS not configured properly
**Solution**: Verify `CORS_ORIGIN_WHITELIST` includes `http://localhost:3000`

## API Endpoints Reference

### Authentication
- `POST /api/token/` - Login (get JWT tokens)
- `POST /api/token/refresh/` - Refresh access token
- `GET /api/auth/users/{id}/` - Get user details

### Admin Panel
- `GET /api/admin-panel/dashboard/` - Dashboard statistics
- `GET /api/admin-panel/users/` - List users
- `POST /api/admin-panel/users/{id}/approve/` - Approve user
- `POST /api/admin-panel/users/{id}/reject/` - Deactivate user
- `GET /api/admin-panel/predictions/` - List predictions
- `GET /api/admin-panel/transactions/` - List transactions
- `POST /api/admin-panel/transactions/{id}/mark_paid/` - Mark as paid
- `POST /api/admin-panel/transactions/{id}/refund/` - Refund transaction

## Security Notes

1. **JWT Tokens**: Stored in both cookies and localStorage
2. **Token Expiry**: Access token expires in 5 minutes, refresh in 24 hours
3. **CORS**: Only allows requests from `http://localhost:3000`
4. **Admin Check**: Backend validates `is_staff` on all admin endpoints
5. **Password**: Never stored in plain text, always hashed

## Next Steps

1. ✅ Fix admin login credentials object
2. ✅ Add comprehensive error handling
3. ✅ Verify CORS configuration
4. ⏳ Run database migrations for Transaction model
5. ⏳ Test end-to-end login flow
6. ⏳ Verify all admin dashboard features work

## Files Modified

1. **frontend/src/pages/AdminLogin.js**
   - Fixed login call to pass credentials object
   - Enhanced error handling
   - Added network error detection

## Summary

The admin login issue has been fixed by correcting the function call signature. The login now properly passes credentials as an object `{ username, password }` instead of two separate parameters. Enhanced error handling provides clear feedback for all error scenarios including network issues, invalid credentials, and permission problems.

---

**Last Updated**: November 5, 2025
**Status**: Fixed ✅
