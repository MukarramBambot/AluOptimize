# Waste Auto-Generation System - Testing Guide

## 🚀 Quick Start

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

### Test 1: Admin Runs Prediction → Auto-Generate Waste

**Steps:**
1. Login as admin at `http://localhost:3000/admin-login`
2. Navigate to Admin Dashboard → Prediction Control tab
3. Find a user input with "Pending" status
4. Click the Play button (▶️) to run prediction

**Expected Results:**
✅ Success message: "Prediction generated successfully! Output: X.XX kg"
✅ Status changes to "Processing"
✅ Waste record auto-created in database
✅ Recommendation auto-created in database
✅ All linked to ProductionOutput

**Verify in Database:**
```sql
-- Check ProductionOutput has waste fields
SELECT id, waste_estimate, waste_record_id, recommendation_id 
FROM prediction_productionoutput 
ORDER BY id DESC LIMIT 1;

-- Check WasteManagement record created
SELECT * FROM waste_wastemanagement 
ORDER BY id DESC LIMIT 1;

-- Check WasteRecommendation created
SELECT * FROM waste_wasterecommendation 
ORDER BY id DESC LIMIT 1;
```

**Expected Waste Calculation:**
- If predicted_output = 85 kg
- Then waste_estimate = 85 * 0.15 = 12.75 kg

---

### Test 2: User Views Auto-Generated Waste

**Steps:**
1. Logout from admin
2. Login as regular user (e.g., arunk)
3. Navigate to `/waste`

**Expected Results:**
✅ Info alert: "Waste data is automatically generated from your production predictions"
✅ No manual entry form visible
✅ Table shows auto-generated waste records
✅ Columns: ID, Waste Type, Amount, Unit, Date, Reusable, Production Line
✅ Tip alert at bottom about Recommendations page

**If No Data:**
- Empty state with recycling icon
- Message: "Waste data will be automatically generated when your production predictions are processed"

---

### Test 3: User Views Auto-Generated Recommendations

**Steps:**
1. As regular user, navigate to `/recommendations`
2. View the page

**Expected Results (Before Approval):**
❌ No recommendations visible
✅ Empty state message: "Recommendations will appear here once your production predictions are approved"

**Steps to Approve:**
1. Login as admin
2. Go to Prediction Control tab
3. Click ✅ Approve on the prediction

**Expected Results (After Approval):**
✅ Info alert: "These recommendations are automatically generated from your approved production predictions"
✅ Summary table with:
  - Production Line
  - Waste Amount
  - Energy Efficiency (color-coded chip)
  - Reusable (Yes/No chip)
  - Est. Savings
  - Date
✅ Detailed recommendation cards below table
✅ Full AI recommendation text in gray box
✅ Metrics: Waste Generated, Energy Efficiency, Predicted Output

---

### Test 4: Admin Views Waste & Recommendations Tab

**Steps:**
1. Login as admin
2. Navigate to Admin Dashboard
3. Click "Waste & Recommendations" tab (5th tab with recycling icon)

**Expected Results:**
✅ Statistics cards showing:
  - Total Recommendations
  - Total Waste (kg)
  - Potential Savings ($)
  - Reusable Waste (count)
✅ Comprehensive table with all waste records
✅ Columns: ID, User, Production Line, Waste Amount, Waste Type, Reusable, Est. Savings, Date, Status
✅ Detailed recommendation cards below
✅ Refresh button works

---

### Test 5: Efficiency-Based Recommendation Logic

**Test High Efficiency (≥80%):**

**Input:**
- Feed Rate: 200 kg/h
- Power Consumption: 250 kWh
- Temperature: 960°C
- Bath Ratio: 1.5

**Expected:**
- Energy Efficiency: 80%
- Waste Estimate: 25.5 kg (170 * 0.15)
- Reusable: Yes
- Recommendation: "Excellent efficiency (80.0%)..."
- Savings: 25.5 * 2.5 = $63.75

**Test Low Efficiency (<40%):**

**Input:**
- Feed Rate: 100 kg/h
- Power Consumption: 500 kWh
- Temperature: 950°C
- Bath Ratio: 1.2

**Expected:**
- Energy Efficiency: 20%
- Waste Estimate: 12.75 kg (85 * 0.15)
- Reusable: No
- Recommendation: "Low efficiency (20.0%). High waste generation..."
- Savings: 12.75 * 1.0 = $12.75

---

### Test 6: User Isolation (Only See Approved)

**Setup:**
1. Create two users: user1 and user2
2. User1 submits input A
3. User2 submits input B
4. Admin runs predictions for both
5. Admin approves only input A

**Test as User1:**
1. Login as user1
2. Navigate to `/recommendations`

**Expected:**
✅ See recommendation for input A
❌ Don't see recommendation for input B

**Test as User2:**
1. Login as user2
2. Navigate to `/recommendations`

**Expected:**
❌ Don't see recommendation for input A
❌ Don't see recommendation for input B (not approved yet)

**After Admin Approves Input B:**
✅ User2 now sees recommendation for input B
❌ User2 still doesn't see input A (belongs to user1)

---

### Test 7: No Manual Waste Entry

**Steps:**
1. Login as regular user
2. Navigate to `/waste`
3. Look for any forms or input fields

**Expected:**
❌ No "Add Waste" button
❌ No waste entry form
❌ No "Generate Recommendation" button
✅ Only read-only table display
✅ Info alert explaining auto-generation

---

### Test 8: API Endpoint Testing

**Test User Recommendations Endpoint:**

```bash
# Get access token
TOKEN=$(curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"arunk","password":"your_password"}' \
  | jq -r '.access')

# Fetch user recommendations
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/waste/user-recommendations/ \
  | jq
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "production_line": "LINE_A",
    "waste_amount": 12.75,
    "waste_type": "Aluminum Dross",
    "unit": "KG",
    "energy_efficiency": 20.0,
    "predicted_output": 85.0,
    "reuse_possible": false,
    "recommendation_text": "Low efficiency...",
    "estimated_savings": "12.75",
    "date_recorded": "2025-11-06",
    "created_at": "2025-11-06T10:30:00Z"
  }
]
```

**Test Filtering:**
- Only returns user's own recommendations
- Only returns approved predictions
- Returns empty array if no approved predictions

---

### Test 9: Complete User Journey

**Step 1: User Submits Input**
1. Login as user (arunk)
2. Navigate to `/inputs`
3. Fill form:
   - Production Line: LINE_A
   - Temperature: 950
   - Pressure: 101325
   - Feed Rate: 100
   - Power Consumption: 500
   - Anode Effect: 2.5
   - Bath Ratio: 1.2
   - Alumina Concentration: 3.5
4. Submit

**Expected:**
✅ Success message
✅ Input saved with status "Pending"

**Step 2: Check Initial State**
1. Navigate to `/predictions`
   - ❌ No predictions visible (not approved yet)
2. Navigate to `/waste`
   - ❌ No waste records visible
3. Navigate to `/recommendations`
   - ❌ No recommendations visible

**Step 3: Admin Processes**
1. Logout, login as admin
2. Go to Prediction Control tab
3. Find arunk's input
4. Click ▶️ Run Prediction

**Expected:**
✅ Prediction created
✅ Waste record created (12.75 kg)
✅ Recommendation created
✅ Status: "Processing"

**Step 4: Admin Approves**
1. Click ✅ Approve

**Expected:**
✅ Status: "Approved"
✅ is_approved: True
✅ approved_at: Current timestamp

**Step 5: User Views Results**
1. Logout, login as user (arunk)
2. Navigate to `/predictions`
   - ✅ See approved prediction
   - ✅ Predicted Output: 85 kg
   - ✅ Energy Efficiency: 20%
3. Navigate to `/waste`
   - ✅ See waste record
   - ✅ Waste Amount: 12.75 kg
   - ✅ Waste Type: Aluminum Dross
   - ✅ Reusable: No
4. Navigate to `/recommendations`
   - ✅ See AI recommendation
   - ✅ Full recommendation text
   - ✅ Estimated Savings: $12.75
   - ✅ Summary table with metrics

---

### Test 10: Admin Statistics Accuracy

**Setup:**
1. Create 3 predictions with different efficiencies:
   - Prediction 1: 85% efficiency → Excellent
   - Prediction 2: 65% efficiency → Good
   - Prediction 3: 30% efficiency → Low
2. Approve all 3

**Test:**
1. Login as admin
2. Go to Waste & Recommendations tab
3. Check statistics cards

**Expected Calculations:**

**Total Recommendations:** 3

**Total Waste:**
- Prediction 1: 170 * 0.15 = 25.5 kg
- Prediction 2: 127.5 * 0.15 = 19.125 kg
- Prediction 3: 85 * 0.15 = 12.75 kg
- **Total: 57.375 kg**

**Potential Savings:**
- Prediction 1: 25.5 * 2.5 = $63.75
- Prediction 2: 19.125 * 2.0 = $38.25
- Prediction 3: 12.75 * 1.0 = $12.75
- **Total: $114.75**

**Reusable Waste:**
- Prediction 1: Yes (85% > 50%)
- Prediction 2: Yes (65% > 50%)
- Prediction 3: No (30% < 50%)
- **Count: 2**

---

## 🔍 Visual Verification

### Recommendations Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Waste Optimization Recommendations                       │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ These recommendations are automatically generated from   │
│    your approved production predictions.                    │
├─────────────────────────────────────────────────────────────┤
│ Summary Table:                                              │
│ ┌────────┬──────────┬────────────┬──────────┬─────────┐   │
│ │ Line   │ Waste    │ Efficiency │ Reusable │ Savings │   │
│ ├────────┼──────────┼────────────┼──────────┼─────────┤   │
│ │ LINE_A │ 12.75 KG │ 20.0% 🔴   │ No       │ $12.75  │   │
│ └────────┴──────────┴────────────┴──────────┴─────────┘   │
├─────────────────────────────────────────────────────────────┤
│ AI Recommendations:                                         │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ LINE_A                           Savings: $12.75      │  │
│ │ Aluminum Dross • 11/06/2025                           │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Low efficiency (20.0%). High waste generation:        │  │
│ │ 12.75 kg. Immediate process review required...        │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ Waste: 12.75 KG | Efficiency: 20.0% | Output: 85 kg  │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Waste Management Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ♻️ Waste Management                                         │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Waste data is automatically generated from your          │
│    production predictions. No manual entry required.        │
├─────────────────────────────────────────────────────────────┤
│ ┌────┬──────────────┬────────┬──────┬──────────┬─────────┐ │
│ │ ID │ Waste Type   │ Amount │ Unit │ Date     │ Reusable│ │
│ ├────┼──────────────┼────────┼──────┼──────────┼─────────┤ │
│ │ 1  │ Aluminum     │ 12.75  │ KG   │ 11/06/25 │ No      │ │
│ │    │ Dross        │        │      │          │         │ │
│ └────┴──────────────┴────────┴──────┴──────────┴─────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ✅ 💡 Tip: Check the "Recommendations" page for AI-generated│
│    optimization suggestions based on this waste data.       │
└─────────────────────────────────────────────────────────────┘
```

### Admin Waste & Recommendations Tab

```
┌─────────────────────────────────────────────────────────────┐
│ ♻️ Waste & Recommendations                        🔄 Refresh│
├─────────────────────────────────────────────────────────────┤
│ Statistics:                                                 │
│ ┌──────────┬──────────┬──────────┬──────────┐             │
│ │ Total: 3 │ Waste:   │ Savings: │ Reusable:│             │
│ │          │ 57.38 kg │ $114.75  │ 2        │             │
│ └──────────┴──────────┴──────────┴──────────┘             │
├─────────────────────────────────────────────────────────────┤
│ All Waste Records:                                          │
│ ┌────┬──────┬──────┬────────┬──────────┬─────────┬────────┐│
│ │ ID │ User │ Line │ Waste  │ Reusable │ Savings │ Status ││
│ ├────┼──────┼──────┼────────┼──────────┼─────────┼────────┤│
│ │ 1  │arunk │LINE_A│12.75 KG│ No       │ $12.75  │Approved││
│ │ 2  │arunk │LINE_B│25.50 KG│ Yes      │ $63.75  │Approved││
│ └────┴──────┴──────┴────────┴──────────┴─────────┴────────┘│
└─────────────────────────────────────────────────────────────┘
```

## ✅ Success Criteria

All tests pass if:

- [x] Admin can run prediction
- [x] Waste record auto-created
- [x] Recommendation auto-created
- [x] All linked to ProductionOutput
- [x] User sees waste data (read-only)
- [x] User sees recommendations (approved only)
- [x] No manual waste entry forms
- [x] Admin tab shows all waste records
- [x] Statistics calculate correctly
- [x] Efficiency-based recommendations work
- [x] User isolation works (only own data)
- [x] API endpoints filter correctly

## 🐛 Common Issues

### Issue 1: "No recommendations available"

**Cause:** Predictions not approved yet

**Solution:**
1. Login as admin
2. Go to Prediction Control
3. Approve the predictions
4. Refresh user's Recommendations page

---

### Issue 2: Waste record not created

**Cause:** Error in auto-generation logic

**Check:**
1. Backend terminal for errors
2. Database for ProductionOutput record
3. Verify waste_estimate field populated

**Debug:**
```python
# In Django shell
from backend.apps.prediction.models import ProductionOutput
po = ProductionOutput.objects.latest('id')
print(f"Waste Estimate: {po.waste_estimate}")
print(f"Waste Record: {po.waste_record}")
print(f"Recommendation: {po.recommendation}")
```

---

### Issue 3: Statistics showing wrong values

**Cause:** Calculation error or missing data

**Verify:**
```sql
-- Check all recommendations
SELECT 
    wr.id,
    wm.waste_amount,
    wr.estimated_savings,
    wm.reuse_possible
FROM waste_wasterecommendation wr
JOIN waste_wastemanagement wm ON wr.waste_record_id = wm.id;

-- Manual calculation
SELECT 
    COUNT(*) as total,
    SUM(wm.waste_amount) as total_waste,
    SUM(wr.estimated_savings) as total_savings,
    SUM(CASE WHEN wm.reuse_possible THEN 1 ELSE 0 END) as reusable
FROM waste_wasterecommendation wr
JOIN waste_wastemanagement wm ON wr.waste_record_id = wm.id;
```

---

## 🎯 Final Verification Checklist

Run through this complete checklist:

### Backend
- [ ] Migrations applied successfully
- [ ] ProductionOutput has new fields
- [ ] Auto-generation logic works
- [ ] Waste records created
- [ ] Recommendations created
- [ ] API endpoints return correct data

### Frontend
- [ ] Recommendations page shows auto-generated data
- [ ] Waste page is read-only
- [ ] Admin tab displays correctly
- [ ] Statistics cards accurate
- [ ] No manual entry forms visible
- [ ] Empty states display properly

### Integration
- [ ] Complete user journey works
- [ ] Admin approval workflow works
- [ ] User isolation enforced
- [ ] Only approved predictions visible
- [ ] Efficiency-based logic correct
- [ ] All calculations accurate

If all checkboxes are checked, the Waste Auto-Generation System is working correctly! ✅

---

**Last Updated:** November 6, 2025  
**Status:** Ready for Testing  
**Migrations:** ✅ Applied
