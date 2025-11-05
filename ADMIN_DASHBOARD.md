# Admin Dashboard Documentation

## Overview
The AluOptimize Admin Dashboard is a comprehensive management interface for administrators to manage users, review predictions, and generate reports. It provides a centralized control panel accessible only to staff users.

## Access Control

### Who Can Access
- **Superusers** (`is_superuser=True`)
- **Staff Users** (`is_staff=True`)

### Access Points
1. **Django Admin** (Backend): `http://127.0.0.1:8000/admin/`
   - Full Django admin interface
   - Database-level access
   - User management, model administration

2. **Admin Panel** (Frontend): `http://127.0.0.1:8000/admin-panel`
   - Custom React-based admin interface
   - User-friendly dashboard
   - Streamlined workflows

## Features

### 1. Dashboard Overview

**Statistics Cards:**
- Total Users
- Pending Approvals
- Active Users
- Total Predictions

**Recent Activity:**
- Latest user registrations
- Recent predictions submitted
- Real-time system overview

**API Endpoint:** `GET /api/admin-panel/dashboard/`

### 2. User Management

**Capabilities:**
- View all registered users
- Filter by status (All, Pending, Active)
- Approve individual users
- Deactivate users
- Bulk approve all pending users

**User Information Displayed:**
- Username
- Email
- Active status (badge)
- Staff status
- Registration date

**Actions:**
- ✓ **Approve** - Activate user account
- ✗ **Deactivate** - Suspend user access
- **Bulk Approve** - Approve all pending users at once

**API Endpoints:**
- `GET /api/admin-panel/users/` - List users
- `GET /api/admin-panel/users/?status=pending` - Filter pending
- `POST /api/admin-panel/users/{id}/approve/` - Approve user
- `POST /api/admin-panel/users/{id}/reject/` - Deactivate user
- `POST /api/admin-panel/users/bulk_approve/` - Bulk approve

### 3. Prediction Management

**Capabilities:**
- View all production predictions
- Review prediction details
- Mark predictions as paid
- Generate detailed reports

**Prediction Information:**
- Prediction ID
- Production line
- Submitting user
- Predicted output (kg)
- Energy efficiency (%)
- Quality score
- Submission timestamp

**Actions:**
- 💳 **Mark as Paid** - Track payment status
- 📄 **Generate Report** - Create downloadable report

**API Endpoints:**
- `GET /api/admin-panel/predictions/` - List predictions
- `POST /api/admin-panel/predictions/{id}/mark_paid/` - Mark paid
- `GET /api/admin-panel/predictions/{id}/generate_report/` - Get report data

### 4. Report Generation

**Report Contents:**
- Prediction ID and timestamp
- User information (username, email)
- Input parameters:
  - Production line
  - Temperature
  - Pressure
  - Feed rate
  - Power consumption
  - Anode effect
  - Bath ratio
  - Alumina concentration
- Prediction results:
  - Predicted output
  - Energy efficiency
  - Output quality
- Admin signature

**Download Format:**
- Currently: Text file (.txt)
- Future: PDF with formatting and charts

## User Workflows

### Approving New Users

1. Navigate to Admin Panel → User Management tab
2. View list of pending users (yellow "Pending" badge)
3. Options:
   - **Individual Approval**: Click ✓ icon next to user
   - **Bulk Approval**: Click "Approve All Pending" button
4. User receives active status and can log in
5. Success message confirms approval

### Reviewing Predictions

1. Navigate to Admin Panel → Predictions tab
2. View all submitted predictions
3. Review prediction details:
   - Input parameters
   - Calculated results
   - Submitting user
4. Take actions:
   - Mark as paid for billing tracking
   - Generate report for documentation

### Generating Reports

1. In Predictions tab, click 📄 icon for desired prediction
2. Review report data in dialog
3. Click "Download Report" button
4. Report saved as text file
5. Future: PDF with professional formatting

## Technical Implementation

### Backend (Django)

**Admin Views** (`backend/apps/core/admin_views.py`):
- `AdminDashboardViewSet` - Statistics and overview
- `AdminUserManagementViewSet` - User CRUD operations
- `AdminPredictionManagementViewSet` - Prediction management

**Permissions:**
- Custom `IsAdminUser` permission class
- Checks `is_staff` and `is_authenticated`
- Denies access to non-staff users

**URL Configuration:**
- Admin API mounted at `/api/admin-panel/`
- RESTful endpoints using Django REST Framework
- ViewSet-based architecture

### Frontend (React)

**Components:**
- `AdminPanel.js` - Main container with tabs
- `AdminDashboard.js` - Statistics overview
- `AdminUsers.js` - User management table
- `AdminPredictions.js` - Prediction management table

**Routing:**
- Route: `/admin-panel`
- Protected by authentication check
- Staff-only access verification

**UI Framework:**
- Material-UI (MUI) components
- Responsive design
- Color-coded status indicators

## Security Features

1. **Authentication Required**
   - Must be logged in to access
   - JWT token validation

2. **Staff Authorization**
   - `is_staff=True` required
   - Automatic redirect if unauthorized

3. **API Permission Checks**
   - Backend validates staff status
   - Returns 403 Forbidden for non-staff

4. **Audit Logging**
   - All admin actions logged
   - Includes username and timestamp
   - Traceable approval history

## API Response Examples

### Dashboard Statistics
```json
{
  "users": {
    "total": 25,
    "pending": 5,
    "active": 20
  },
  "predictions": {
    "total": 150,
    "this_week": 12
  },
  "recent_activity": {
    "users": [...],
    "predictions": [...]
  }
}
```

### User List
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "is_active": false,
    "is_staff": false,
    "date_joined": "2025-11-05T10:30:00Z"
  }
]
```

### Report Data
```json
{
  "prediction_id": 42,
  "user": {
    "username": "operator1",
    "email": "operator@example.com"
  },
  "input_parameters": {...},
  "predictions": {
    "predicted_output": 1575.00,
    "energy_efficiency": 12.60,
    "output_quality": 118.50
  },
  "timestamp": "2025-11-05T14:20:00Z",
  "admin_signature": "Approved by: admin_user"
}
```

## Future Enhancements

### Planned Features

1. **Email Notifications**
   - Auto-send approval emails to users
   - Notify admins of new registrations
   - Weekly summary reports

2. **Advanced Reporting**
   - PDF generation with charts
   - Custom report templates
   - Batch report downloads

3. **Payment Integration**
   - Link to payment gateway
   - Invoice generation
   - Payment history tracking

4. **Role-Based Permissions**
   - Multiple admin levels
   - Department-specific access
   - Granular permission control

5. **Analytics Dashboard**
   - User growth trends
   - Prediction accuracy metrics
   - System usage statistics

6. **Approval Workflows**
   - Multi-level approval chains
   - Approval comments/notes
   - Rejection reasons

7. **Data Export**
   - CSV export for all tables
   - Bulk data operations
   - Scheduled exports

## Troubleshooting

### Cannot Access Admin Panel

**Symptom:** "Access denied" error when visiting `/admin-panel`

**Solutions:**
1. Verify user has `is_staff=True` in database
2. Check JWT token is valid
3. Ensure backend is running
4. Clear browser cache and re-login

### Bulk Approve Not Working

**Symptom:** "No pending users to approve" message

**Solutions:**
1. Verify there are users with `is_active=False`
2. Refresh the user list
3. Check filter is set to "Pending" or "All"

### Report Download Fails

**Symptom:** Report dialog opens but download doesn't start

**Solutions:**
1. Check browser popup blocker
2. Verify prediction data is complete
3. Try different browser
4. Check console for JavaScript errors

## Best Practices

1. **Regular Reviews**
   - Check pending users daily
   - Review predictions weekly
   - Monitor system statistics

2. **User Verification**
   - Verify email addresses before approval
   - Check for duplicate accounts
   - Validate user information

3. **Documentation**
   - Keep approval notes
   - Document rejection reasons
   - Maintain admin activity log

4. **Security**
   - Use strong admin passwords
   - Enable 2FA when available
   - Log out after admin sessions
   - Never share admin credentials

5. **Data Management**
   - Regular database backups
   - Archive old predictions
   - Clean up inactive users

## Support

For technical issues or questions:
- Check backend logs: `backend/logs/`
- Review browser console for frontend errors
- Contact system administrator
- Refer to Django admin documentation

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
**API Base URL**: `http://127.0.0.1:8000`
