# Backend Utilities

This directory contains utility scripts for the AluOptimize backend.

## Scripts

### fix_existing_outputs.py

Retroactively creates waste records and recommendations for existing production outputs.

**Purpose:**
- Creates WasteManagement records for outputs that don't have them
- Generates AI recommendations using the RL environment
- Links waste records and recommendations to production outputs

**Usage:**
```bash
# From project root
python backend/utils/fix_existing_outputs.py
```

**What it does:**
1. Finds all ProductionOutput records without waste_record
2. Calculates or uses existing waste estimates
3. Creates WasteManagement records
4. Generates AI recommendations using RL environment
5. Links everything together

**Requirements:**
- Django environment must be set up
- Database must be accessible
- Production inputs and outputs should exist

## Adding New Utilities

When adding new utility scripts:
1. Place them in this directory
2. Add proper Django setup at the top
3. Document them in this README
4. Make them executable: `chmod +x script_name.py`
