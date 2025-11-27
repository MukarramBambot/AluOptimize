# Backend Tests

This directory contains integration test scripts for the AluOptimize backend.

## Test Files

### Integration Tests (Standalone Scripts)

These are standalone integration test scripts that can be run directly with Python:

- **test_waste_flow.py** - Tests the complete waste management and recommendations flow
- **test_pdf_generation.py** - Tests PDF report generation for users, predictions, and waste
- **test_input_reports.py** - Tests input-specific PDF report generation
- **test_dashboard.py** - Tests admin dashboard statistics endpoint

### Running Integration Tests

These scripts are designed to run against a live Django environment:

```bash
# From project root
cd /media/mukbambot/projects/Vcodez\ Intern/AluOptimize

# Run individual tests
python backend/tests/test_waste_flow.py
python backend/tests/test_pdf_generation.py
python backend/tests/test_input_reports.py
python backend/tests/test_dashboard.py
```

### Requirements

- Django server should be running
- Database should be populated with test data
- User accounts (admin and regular users) should exist

## Notes

These are integration tests that verify the complete flow of the application, not unit tests. They test:
- Database queries and relationships
- PDF generation functionality
- API endpoint responses
- Data serialization

For unit tests using Django's TestCase, create separate files following the pattern `test_<app_name>.py`.
