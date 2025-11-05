# 🚀 Quick Start Guide - PDF Reports

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd /home/mukbambot/Documents/AluOptimize
source virtual/bin/activate
pip install -r requirements.txt
```

### 2. Configure Email
Add to `backend/config/settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-16-char-app-password'
```

### 3. Get Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Generate password for "Mail"
3. Copy 16-character password
4. Use as `EMAIL_HOST_PASSWORD`

### 4. Test PDF Generation
```bash
python test_pdf_generation.py
```

Expected output:
```
✅ Users Report: PASSED
✅ Predictions Report: PASSED
✅ Waste Report: PASSED
🎉 All tests passed!
```

### 5. Start Server
```bash
python manage.py runserver
```

### 6. Test in Browser
1. Login as admin: http://localhost:8000/admin-login
2. Go to Admin Dashboard → Reports tab
3. Select "Users Report"
4. Check "Email to user"
5. Select a user
6. Click "Generate & Email PDF"

Expected result:
```
✅ Report PDF generated and emailed to user@example.com!
```

---

## Quick Commands

### Test PDF Generation
```bash
python test_pdf_generation.py
```

### Check Django Configuration
```bash
python manage.py check
```

### View Generated PDFs
```bash
ls -lh /tmp/aluoptimize_*_report_test.pdf
```

### Open PDF
```bash
xdg-open /tmp/aluoptimize_users_report_test.pdf
```

---

## API Quick Reference

### Generate Users Report
```bash
curl -X POST http://localhost:8000/api/admin-panel/reports/generate_users_report/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_to_user": true,
    "user_id": 2,
    "download": false
  }'
```

### Download PDF
```bash
curl -X POST http://localhost:8000/api/admin-panel/reports/generate_users_report/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_to_user": false,
    "download": true
  }' \
  --output report.pdf
```

---

## Troubleshooting

### Email not sending?
```bash
# Check settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.EMAIL_HOST_USER)
>>> print(settings.EMAIL_HOST)
```

### PDF not generating?
```bash
# Check reportlab installed
pip list | grep reportlab

# Run test
python test_pdf_generation.py
```

### Frontend not loading?
```bash
# Clear browser cache
# Check browser console for errors
# Verify server is running
```

---

## File Locations

**Backend:**
- PDF Generator: `backend/apps/core/pdf_generator.py`
- Email Utils: `backend/apps/core/email_utils.py`
- Report Views: `backend/apps/core/report_views.py`

**Frontend:**
- Reports UI: `frontend/src/components/admin/AdminReports.js`
- Dashboard: `frontend/src/pages/AdminDashboard.js`

**Tests:**
- PDF Test: `test_pdf_generation.py`
- Generated PDFs: `/tmp/aluoptimize_*_report_test.pdf`

**Documentation:**
- Full Guide: `PDF_REPORTS_IMPLEMENTATION.md`
- Email Setup: `EMAIL_SETUP_GUIDE.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`

---

## Need Help?

1. **Email Issues:** See `EMAIL_SETUP_GUIDE.md`
2. **PDF Issues:** Run `python test_pdf_generation.py`
3. **API Issues:** Check Django logs
4. **Frontend Issues:** Check browser console

---

**Ready to go!** 🎉
