# Testing Guide - Frontend Cleanup & Admin Enhancement

## 🚀 Quick Start

### Prerequisites
- Backend running at `http://127.0.0.1:8000`
- Frontend running at `http://localhost:3000`
- Database with user `arunk` and prediction inputs

### Start Servers

**Terminal 1 - Backend:**
```bash
cd /home/mukbambot/Documents/AluOptimize
source virtual/bin/activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd /home/mukbambot/Documents/AluOptimize/frontend
npm start
```

## 🧪 Test Scenarios

### Test 1: User Navigation Bar

**Steps:**
1. Open `http://localhost:3000/login`
2. Login as regular user (non-admin)
3. After login, check navigation bar

**Expected Result:**
```
AluOptimize | Dashboard | Inputs | Predictions | Waste | Recommendations | Logout
```

**Verify:**
- ✅ No admin links visible
- ✅ Standard blue navbar color
- ✅ All user links work
- ✅ No admin banner at top

---

### Test 2: Admin Navigation Bar

**Steps:**
1. Open `http://localhost:3000/admin-login`
2. Login as admin (username: `admin`)
3. After login, you're at `/admin-dashboard`

**Expected Result:**
```
🧠 Logged in as Administrator (blue banner at top)
⚙️ AluOptimize Admin | Admin Dashboard | Prediction Control | User Management | Switch to User View | Logout
```

**Verify:**
- ✅ Admin banner appears at top
- ✅ Dark indigo navbar (#1a237e)
- ✅ Title shows "⚙️ AluOptimize Admin" in bold
- ✅ Admin navigation links visible
- ✅ "Switch to User View" button present

---

### Test 3: View User Prediction Inputs

**Steps:**
1. Login as admin at `/admin-dashboard`
2. Click on "Prediction Control" tab (4th tab)
3. View the table

**Expected Result:**
Table showing all prediction inputs with columns:
- ID
- User (with username and email)
- Line
- Temp (°C)
- Pressure (Pa)
- Feed Rate
- Power (kWh)
- Status
- Submitted
- Actions

**Verify:**
- ✅ User `arunk` appears in User column
- ✅ Email appears below username in gray
- ✅ All parameters display correctly
- ✅ Status shows (Pending/Processing/Approved/Rejected)
- ✅ Action buttons appear (ℹ️ ▶️ ✅ ❌)

**Example Entry:**
```
ID: 1
User: arunk
      arunk@example.com
Line: LINE_A
Temp: 950
Pressure: 101325
Feed Rate: 100 kg/h
Power: 500
Status: Pending
Submitted: 11/06/2025
Actions: ℹ️ ▶️
```

---

### Test 4: Run Prediction

**Steps:**
1. In Prediction Control tab
2. Find an entry with "Pending" status
3. Click the Play button (▶️)

**Expected Result:**
- ✅ Success message appears: "Prediction generated successfully! Output: X.XX kg"
- ✅ Status changes to "Processing"
- ✅ Action buttons change to ✅ ❌ (Approve/Reject)
- ✅ Table refreshes automatically

---

### Test 5: Approve Prediction

**Steps:**
1. Find an entry with "Processing" status
2. Click the green checkmark (✅)

**Expected Result:**
- ✅ Success message: "Prediction approved successfully!"
- ✅ Status changes to "Approved"
- ✅ Approve/Reject buttons disappear
- ✅ Table refreshes

---

### Test 6: Reject Prediction

**Steps:**
1. Find an entry with "Processing" status
2. Click the red X (❌)

**Expected Result:**
- ✅ Success message: "Prediction rejected successfully!"
- ✅ Status changes to "Rejected"
- ✅ Approve/Reject buttons disappear
- ✅ Table refreshes

---

### Test 7: View Details

**Steps:**
1. Click the info button (ℹ️) on any entry

**Expected Result:**
- ✅ Dialog opens with "Prediction Details"
- ✅ Shows all input parameters:
  - Production Line
  - Temperature
  - Pressure
  - Feed Rate
  - Power Consumption
  - Anode Effect
  - Bath Ratio
  - Alumina Concentration
- ✅ If prediction exists, shows results:
  - Predicted Output
  - Energy Efficiency
  - Output Quality
  - Status
  - Processed By (admin username)

---

### Test 8: Filter by Status

**Steps:**
1. In Prediction Control tab
2. Click "Filter by Status" dropdown
3. Select "Pending"

**Expected Result:**
- ✅ Table shows only entries with "Pending" status
- ✅ Other statuses hidden

**Test other filters:**
- Processing
- Approved
- Rejected
- All (shows everything)

---

### Test 9: Switch to User View

**Steps:**
1. While in admin view (`/admin-dashboard`)
2. Click "Switch to User View" button in navbar

**Expected Result:**
- ✅ Redirects to `/dashboard`
- ✅ Admin banner disappears
- ✅ Navbar changes to standard blue
- ✅ User navigation appears
- ✅ Title changes to "AluOptimize"

---

### Test 10: Switch to Admin View

**Steps:**
1. Login as admin
2. Navigate to user dashboard (`/dashboard`)
3. Click "Switch to Admin View" button in navbar

**Expected Result:**
- ✅ Redirects to `/admin-dashboard`
- ✅ Admin banner appears
- ✅ Navbar changes to dark indigo
- ✅ Admin navigation appears
- ✅ Title changes to "⚙️ AluOptimize Admin"

---

### Test 11: Statistics Cards

**Steps:**
1. Navigate to Prediction Control tab
2. View statistics cards at top

**Expected Result:**
Four cards showing:
- ✅ Total Inputs (count)
- ✅ Pending (count in orange/warning color)
- ✅ Approved (count in green/success color)
- ✅ Rejected (count in red/error color)

---

### Test 12: User Can Only See Approved

**Steps:**
1. Logout from admin
2. Login as regular user (arunk)
3. Navigate to Predictions page

**Expected Result:**
- ✅ Only predictions with "Approved" status visible
- ✅ Pending predictions NOT visible
- ✅ Processing predictions NOT visible
- ✅ Rejected predictions NOT visible

---

## 🔍 Visual Verification

### Admin Banner
```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ 🧠 Logged in as Administrator                        │
└─────────────────────────────────────────────────────────┘
```
- Blue background
- Centered text
- Bold font
- Admin icon on left

### Admin Navbar Color
- **User View:** Standard blue (#1976d2)
- **Admin View:** Dark indigo (#1a237e)
- Should be visibly darker when in admin mode

### Table Layout
```
┌────┬──────────────┬────────┬──────┬──────────┬──────────┬────────┬──────────┬────────────┬─────────┐
│ ID │ User         │ Line   │ Temp │ Pressure │ Feed     │ Power  │ Status   │ Submitted  │ Actions │
│    │              │        │ (°C) │ (Pa)     │          │ (kWh)  │          │            │         │
├────┼──────────────┼────────┼──────┼──────────┼──────────┼────────┼──────────┼────────────┼─────────┤
│ 1  │ arunk        │ LINE_A │ 950  │ 101325   │ 100 kg/h │ 500    │ Pending  │ 11/06/2025 │ ℹ️ ▶️   │
│    │ arunk@ex.com │        │      │          │          │        │          │            │         │
└────┴──────────────┴────────┴──────┴──────────┴──────────┴────────┴──────────┴────────────┴─────────┘
```

## ⚠️ Common Issues

### Issue 1: "No predictions found"

**Cause:** No data in database

**Solution:**
1. Login as user (arunk)
2. Navigate to Inputs page
3. Submit a new production input
4. Go back to admin panel
5. Refresh Prediction Control tab

---

### Issue 2: Username shows as "N/A"

**Cause:** `submitted_by` field is null

**Solution:**
1. Check if user was logged in when submitting input
2. Verify `submitted_by` field is set in database
3. Re-submit input while logged in

---

### Issue 3: Admin banner not showing

**Cause:** Not on admin page or not logged in as admin

**Solution:**
1. Verify you're logged in as admin (is_staff=True or is_superuser=True)
2. Verify URL starts with `/admin` (e.g., `/admin-dashboard`)
3. Check browser console for errors

---

### Issue 4: Can't switch views

**Cause:** Button not visible or routing issue

**Solution:**
1. Verify you're logged in as admin
2. Check if button appears in navbar
3. Clear browser cache and reload
4. Check browser console for routing errors

---

### Issue 5: Actions not working

**Cause:** Backend not running or API errors

**Solution:**
1. Verify backend is running at `http://127.0.0.1:8000`
2. Check browser console for API errors
3. Check backend terminal for error logs
4. Verify admin has proper permissions

---

## 📊 Test Data

### Sample User Input (arunk)
```json
{
  "production_line": "LINE_A",
  "temperature": 950,
  "pressure": 101325,
  "feed_rate": 100,
  "power_consumption": 500,
  "anode_effect": 2.5,
  "bath_ratio": 1.2,
  "alumina_concentration": 3.5
}
```

### Expected Prediction Output
```json
{
  "predicted_output": 85.0,  // feed_rate * 0.85
  "energy_efficiency": 20.0,  // (feed_rate / power_consumption) * 100
  "output_quality": 119.0,    // min(100, (temp/10) + (bath_ratio*20))
  "status": "Processing"
}
```

## ✅ Success Criteria

All tests pass if:

- [x] User navbar shows correct links
- [x] Admin navbar shows correct links with dark color
- [x] Admin banner appears on admin pages
- [x] Prediction Control displays user inputs (arunk)
- [x] Username and email display correctly
- [x] All columns show correct data
- [x] Run Prediction button works
- [x] Approve button works
- [x] Reject button works
- [x] View Details shows all information
- [x] Status filtering works
- [x] Statistics cards display correct counts
- [x] Switch to User View works
- [x] Switch to Admin View works
- [x] Regular users only see approved predictions

## 🎯 Final Verification

Run through this checklist:

1. **Navigation**
   - [ ] User navbar correct
   - [ ] Admin navbar correct
   - [ ] Banner appears
   - [ ] Colors correct
   - [ ] Switching works

2. **Prediction Control**
   - [ ] Table displays data
   - [ ] Username shows (arunk)
   - [ ] Email shows
   - [ ] All columns present
   - [ ] Actions work

3. **Workflow**
   - [ ] Run prediction
   - [ ] Approve prediction
   - [ ] Reject prediction
   - [ ] View details
   - [ ] Filter by status

4. **User Isolation**
   - [ ] Users only see approved
   - [ ] Admins see all
   - [ ] Permissions enforced

If all checkboxes are checked, the implementation is successful! ✅

---

**Last Updated:** November 6, 2025  
**Status:** Ready for Testing
