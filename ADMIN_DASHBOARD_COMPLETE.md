# Complete Admin Dashboard System Documentation

## Overview
The AluOptimize Admin Dashboard is a comprehensive management system with dedicated admin login, payment tracking, and report generation capabilities. It provides a complete administrative interface separate from the regular user dashboard.

## Access Points

### 1. Admin Login
**URL:** `http://localhost:3000/admin-login`

**Features:**
- Dedicated JWT-based admin authentication
- Validates staff/superuser privileges
- Redirects to admin dashboard on success
- Separate from regular user login

### 2. Admin Dashboard
**URL:** `http://localhost:3000/admin-dashboard`

**Sections:**
1. **Overview** - System statistics and metrics
2. **Users** - User management and approvals
3. **Predictions** - Prediction review and management
4. **Payments** - Transaction and payment tracking
5. **Reports** - PDF/CSV report generation

### 3. Legacy Admin Panel
**URL:** `http://localhost:3000/admin-panel`
- Original admin interface (still functional)
- Integrated with main navigation

### 4. Django Admin
**URL:** `http://127.0.0.1:8000/admin/`
- Backend database administration
- Model-level access

## New Features

### Transaction Management

**Transaction Model Fields:**
- `user` - Associated user
- `prediction_output` - Linked prediction (optional)
- `transaction_type` - prediction, report, subscription, other
- `amount` - Transaction amount (decimal)
- `currency` - Currency code (default: USD)
- `payment_status` - pending, paid, failed, refunded
- `payment_method` - Payment method used
- `transaction_id` - Unique identifier
- `notes` - Additional comments
- `processed_by` - Admin who processed
- `processed_at` - Processing timestamp

**API Endpoints:**
- `GET /api/admin-panel/transactions/` - List all transactions
- `GET /api/admin-panel/transactions/?status=pending` - Filter by status
- `GET /api/admin-panel/transactions/?user_id=5` - Filter by user
- `POST /api/admin-panel/transactions/` - Create transaction
- `POST /api/admin-panel/transactions/{id}/mark_paid/` - Mark as paid
- `POST /api/admin-panel/transactions/{id}/refund/` - Refund transaction
- `GET /api/admin-panel/transactions/statistics/` - Get statistics

### Report Generation

**Report Types:**
1. **Users Report**
   - All registered users
   - Account status and privileges
   - Registration dates
   - Export: CSV, TXT

2. **Predictions Report**
   - All production predictions
   - Input parameters
   - Output metrics
   - User information
   - Export: CSV, TXT

3. **Transactions Report**
   - All financial transactions
   - Payment status
   - Revenue summary
   - User details
   - Export: CSV, TXT

**Download Formats:**
- **CSV** - Comma-separated values for Excel/spreadsheets
- **TXT** - Formatted text report (PDF alternative)

## Backend Implementation

### Models

**Transaction Model** (`backend/apps/core/models.py`):
```python
class Transaction(TimestampedModel):
    user = ForeignKey(User)
    prediction_output = ForeignKey(ProductionOutput, null=True)
    transaction_type = CharField(choices=TRANSACTION_TYPE_CHOICES)
    amount = DecimalField(max_digits=10, decimal_places=2)
    currency = CharField(max_length=3, default='USD')
    payment_status = CharField(choices=PAYMENT_STATUS_CHOICES)
    payment_method = CharField(max_length=50)
    transaction_id = CharField(max_length=100, unique=True)
    notes = TextField(blank=True)
    processed_by = ForeignKey(User, null=True)
    processed_at = DateTimeField(null=True)
```

### Serializers

**TransactionSerializer** (`backend/apps/core/serializers.py`):
- Full transaction details
- Related user information
- Prediction linkage

**TransactionCreateSerializer**:
- Auto-generates transaction_id
- Validates required fields

### ViewSets

**AdminTransactionViewSet** (`backend/apps/core/admin_views.py`):
- `list()` - List with filtering
- `mark_paid()` - Mark transaction as paid
- `refund()` - Process refund
- `statistics()` - Get transaction stats

### URL Configuration

**Admin URLs** (`backend/apps/core/admin_urls.py`):
```python
router.register(r'transactions', AdminTransactionViewSet)
```

**Main URLs** (`backend/config/urls.py`):
```python
path('admin-panel/', include('backend.apps.core.admin_urls'))
```

## Frontend Implementation

### Pages

**AdminLogin.js** (`frontend/src/pages/AdminLogin.js`):
- Dedicated admin login form
- Staff privilege validation
- JWT authentication
- Redirects to admin dashboard

**AdminDashboard.js** (`frontend/src/pages/AdminDashboard.js`):
- Main admin container
- Tab-based navigation
- Access control verification
- Logout functionality

### Components

**AdminOverview.js** (`frontend/src/components/admin/AdminOverview.js`):
- System statistics cards
- User metrics
- Prediction counts
- Revenue tracking
- Transaction summaries

**AdminPayments.js** (`frontend/src/components/admin/AdminPayments.js`):
- Transaction table
- Status filtering
- Mark as paid action
- Refund functionality
- Payment method tracking

**AdminReports.js** (`frontend/src/components/admin/AdminReports.js`):
- Report type selection
- Date range filtering
- CSV download
- TXT/PDF download
- Report descriptions

**AdminUsers.js** (Enhanced):
- User approval/deactivation
- Bulk operations
- Status filtering

**AdminPredictions.js** (Enhanced):
- Prediction review
- Report generation
- Payment linking

### Routing

**Routes** (`frontend/src/router/index.js`):
```javascript
<Route path="/admin-login" element={<AdminLogin />} />
<Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
<Route path="/admin-panel" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
```

## User Workflows

### Admin Login Flow

1. Navigate to `/admin-login`
2. Enter admin credentials
3. System validates staff/superuser status
4. On success, redirect to `/admin-dashboard`
5. On failure, show error message

### Payment Management Flow

1. Admin views transactions in Payments tab
2. Filter by status (pending, paid, failed, refunded)
3. For pending transactions:
   - Click checkmark icon to mark as paid
   - System updates status and records admin
4. For paid transactions:
   - Click refund icon to process refund
   - Confirm refund action
   - System updates status and adds note

### Report Generation Flow

1. Admin navigates to Reports tab
2. Select report type (Users, Predictions, Transactions)
3. Choose date range (optional)
4. Click "Download CSV" or "Download Report (TXT)"
5. System fetches data from API
6. Generates file and triggers download
7. Success message confirms download

### User Approval Flow

1. Admin views Users tab
2. See pending users with yellow badge
3. Options:
   - Individual approval: Click checkmark icon
   - Bulk approval: Click "Approve All Pending"
4. System updates user status
5. User can now login

## Database Schema

### Transaction Table

```sql
CREATE TABLE core_transaction (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prediction_output_id INTEGER NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    notes TEXT,
    processed_by_id INTEGER NULL,
    processed_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_user(id),
    FOREIGN KEY (prediction_output_id) REFERENCES prediction_productionoutput(id),
    FOREIGN KEY (processed_by_id) REFERENCES auth_user(id)
);

CREATE INDEX idx_transaction_user_status ON core_transaction(user_id, payment_status);
CREATE INDEX idx_transaction_id ON core_transaction(transaction_id);
CREATE INDEX idx_transaction_created ON core_transaction(created_at);
```

## API Reference

### Transaction Endpoints

**List Transactions**
```http
GET /api/admin-panel/transactions/
GET /api/admin-panel/transactions/?status=pending
GET /api/admin-panel/transactions/?user_id=5
```

**Create Transaction**
```http
POST /api/admin-panel/transactions/
Content-Type: application/json

{
  "user": 1,
  "prediction_output": 42,
  "transaction_type": "prediction",
  "amount": "50.00",
  "currency": "USD",
  "payment_method": "credit_card"
}
```

**Mark as Paid**
```http
POST /api/admin-panel/transactions/1/mark_paid/
```

**Refund Transaction**
```http
POST /api/admin-panel/transactions/1/refund/
```

**Get Statistics**
```http
GET /api/admin-panel/transactions/statistics/

Response:
{
  "total_transactions": 150,
  "total_revenue": 7500.00,
  "pending_count": 10,
  "paid_count": 135,
  "failed_count": 5,
  "by_type": [
    {"transaction_type": "prediction", "count": 120, "total": 6000.00},
    {"transaction_type": "report", "count": 30, "total": 1500.00}
  ]
}
```

## Security Features

1. **Authentication Required**
   - JWT token validation
   - Staff/superuser check

2. **Permission Checks**
   - `IsAdminUser` permission class
   - Backend validates all requests

3. **Audit Logging**
   - All admin actions logged
   - Processed_by tracking
   - Timestamp recording

4. **Transaction Security**
   - Unique transaction IDs
   - Status validation (can't refund unpaid)
   - Admin approval required

## Setup Instructions

### Backend Setup

1. **Create migrations:**
   ```bash
   python manage.py makemigrations core
   python manage.py migrate
   ```

2. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

3. **Start server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Access admin login:**
   ```
   http://localhost:3000/admin-login
   ```

## Testing

### Test Admin Login

1. Create superuser account
2. Navigate to `/admin-login`
3. Login with superuser credentials
4. Verify redirect to `/admin-dashboard`
5. Check all tabs load correctly

### Test Payment Management

1. Create test transactions via Django admin
2. Navigate to Payments tab
3. Filter by status
4. Mark transaction as paid
5. Verify status update
6. Test refund functionality

### Test Report Generation

1. Navigate to Reports tab
2. Select "Users Report"
3. Click "Download CSV"
4. Verify file downloads
5. Open CSV in Excel/spreadsheet
6. Repeat for other report types

## Troubleshooting

### Cannot Access Admin Dashboard

**Symptom:** "Access denied" error

**Solutions:**
1. Verify user has `is_staff=True`
2. Check JWT token is valid
3. Ensure backend is running
4. Clear browser cache and re-login

### Transactions Not Loading

**Symptom:** Empty transaction table

**Solutions:**
1. Check database has transactions
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Ensure migrations are applied

### Report Download Fails

**Symptom:** Download doesn't start

**Solutions:**
1. Check browser popup blocker
2. Verify API returns data
3. Check console for JavaScript errors
4. Try different browser

## Future Enhancements

1. **PDF Generation**
   - Use jsPDF or pdfmake
   - Add charts and graphics
   - Professional formatting

2. **Payment Gateway Integration**
   - Stripe/PayPal integration
   - Automated payment processing
   - Webhook handling

3. **Advanced Filtering**
   - Date range selection
   - Multiple filter criteria
   - Saved filter presets

4. **Email Notifications**
   - Payment confirmations
   - Refund notifications
   - Admin alerts

5. **Analytics Dashboard**
   - Revenue charts
   - User growth graphs
   - Prediction trends

6. **Export Scheduling**
   - Automated report generation
   - Email delivery
   - Scheduled exports

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Review browser console
- Verify database migrations
- Contact system administrator

---

**Last Updated**: November 5, 2025
**Version**: 2.0.0
**API Base URL**: `http://127.0.0.1:8000`
