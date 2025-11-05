#!/usr/bin/env python
"""
Test script to verify the complete waste management and recommendations flow.
Run this after starting the Django server.
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
django.setup()

from django.contrib.auth import get_user_model
from backend.apps.prediction.models import ProductionInput, ProductionOutput
from backend.apps.waste.models import WasteManagement, WasteRecommendation

User = get_user_model()

def test_waste_flow():
    """Test the complete waste management flow."""
    
    print("\n" + "="*80)
    print("WASTE MANAGEMENT & RECOMMENDATIONS FLOW TEST")
    print("="*80 + "\n")
    
    # 1. Check users
    print("1. Checking Users...")
    users = User.objects.filter(is_staff=False)
    if not users.exists():
        print("   ❌ No regular users found!")
        return
    
    test_user = users.first()
    print(f"   ✅ Found test user: {test_user.username} (ID: {test_user.id})")
    
    # 2. Check production inputs
    print("\n2. Checking Production Inputs...")
    inputs = ProductionInput.objects.filter(submitted_by=test_user)
    print(f"   Found {inputs.count()} production inputs for {test_user.username}")
    
    if not inputs.exists():
        print("   ❌ No production inputs found!")
        return
    
    for inp in inputs:
        print(f"   - Input {inp.id}: {inp.production_line} (submitted: {inp.created_at})")
    
    # 3. Check production outputs
    print("\n3. Checking Production Outputs...")
    outputs = ProductionOutput.objects.filter(input_data__submitted_by=test_user)
    print(f"   Found {outputs.count()} production outputs")
    
    for output in outputs:
        print(f"\n   Output {output.id}:")
        print(f"      - Status: {output.status}")
        print(f"      - Approved: {output.is_approved}")
        print(f"      - Efficiency: {output.energy_efficiency:.2f}%" if output.energy_efficiency else "      - Efficiency: None")
        print(f"      - Waste: {output.waste_estimate:.2f} kg" if output.waste_estimate else "      - Waste: None")
        print(f"      - Reward: {output.reward:.2f}" if output.reward else "      - Reward: None")
        print(f"      - Has waste_record: {output.waste_record is not None}")
        print(f"      - Has recommendation: {output.recommendation is not None}")
        
        if output.waste_record:
            print(f"      - WasteRecord ID: {output.waste_record.id}")
            print(f"      - Recorded by: {output.waste_record.recorded_by.username if output.waste_record.recorded_by else 'None'}")
        
        if output.recommendation:
            print(f"      - Recommendation ID: {output.recommendation.id}")
    
    # 4. Check waste records
    print("\n4. Checking Waste Records...")
    waste_records = WasteManagement.objects.filter(recorded_by=test_user)
    print(f"   Found {waste_records.count()} waste records for {test_user.username}")
    
    for waste in waste_records:
        print(f"\n   WasteRecord {waste.id}:")
        print(f"      - Type: {waste.waste_type}")
        print(f"      - Amount: {waste.waste_amount} {waste.unit}")
        print(f"      - Production Line: {waste.production_line}")
        print(f"      - Recorded by: {waste.recorded_by.username if waste.recorded_by else 'None'}")
        print(f"      - Date: {waste.date_recorded}")
        print(f"      - Reusable: {waste.reuse_possible}")
    
    # 5. Check recommendations
    print("\n5. Checking Waste Recommendations...")
    all_recommendations = WasteRecommendation.objects.all()
    print(f"   Total recommendations in DB: {all_recommendations.count()}")
    
    for rec in all_recommendations:
        print(f"\n   Recommendation {rec.id}:")
        print(f"      - WasteRecord: {rec.waste_record.id}")
        print(f"      - Recorded by: {rec.waste_record.recorded_by.username if rec.waste_record.recorded_by else 'None'}")
        print(f"      - AI Generated: {rec.ai_generated}")
        print(f"      - Savings: ${rec.estimated_savings}")
        print(f"      - Text preview: {rec.recommendation_text[:100]}...")
        
        # Check reverse relationship
        linked_outputs = rec.production_outputs.all()
        print(f"      - Linked to {linked_outputs.count()} ProductionOutput(s)")
        for output in linked_outputs:
            print(f"        * Output {output.id}: Status={output.status}, Approved={output.is_approved}")
    
    # 6. Check user-facing recommendations (approved only)
    print("\n6. Checking User-Facing Recommendations (Approved Only)...")
    user_recommendations = WasteRecommendation.objects.filter(
        waste_record__production_input__submitted_by=test_user,
        production_outputs__is_approved=True,
        production_outputs__status='Approved'
    ).distinct()
    
    print(f"   Found {user_recommendations.count()} approved recommendations for {test_user.username}")
    
    for rec in user_recommendations:
        print(f"\n   ✅ Approved Recommendation {rec.id}:")
        print(f"      - Waste: {rec.waste_record.waste_amount} kg")
        print(f"      - Savings: ${rec.estimated_savings}")
        
        output = rec.production_outputs.first()
        if output:
            print(f"      - Efficiency: {output.energy_efficiency:.2f}%")
            print(f"      - Reward: {output.reward}")
    
    # 7. Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"✅ User: {test_user.username}")
    print(f"✅ Production Inputs: {inputs.count()}")
    print(f"✅ Production Outputs: {outputs.count()}")
    print(f"✅ Waste Records: {waste_records.count()}")
    print(f"✅ Total Recommendations: {all_recommendations.count()}")
    print(f"✅ Approved Recommendations: {user_recommendations.count()}")
    
    # Check for issues
    print("\n" + "="*80)
    print("ISSUE DETECTION")
    print("="*80)
    
    issues = []
    
    # Check if outputs have waste records
    outputs_without_waste = outputs.filter(waste_record__isnull=True)
    if outputs_without_waste.exists():
        issues.append(f"⚠️  {outputs_without_waste.count()} outputs missing waste_record")
    
    # Check if outputs have recommendations
    outputs_without_rec = outputs.filter(recommendation__isnull=True)
    if outputs_without_rec.exists():
        issues.append(f"⚠️  {outputs_without_rec.count()} outputs missing recommendation")
    
    # Check if waste records have correct user
    waste_wrong_user = WasteManagement.objects.exclude(recorded_by=test_user).filter(
        production_input__submitted_by=test_user
    )
    if waste_wrong_user.exists():
        issues.append(f"⚠️  {waste_wrong_user.count()} waste records have wrong recorded_by user")
    
    # Check if recommendations are linked to outputs
    recs_not_linked = WasteRecommendation.objects.filter(
        waste_record__production_input__submitted_by=test_user
    ).exclude(
        production_outputs__isnull=False
    )
    if recs_not_linked.exists():
        issues.append(f"⚠️  {recs_not_linked.count()} recommendations not linked to ProductionOutput")
    
    if issues:
        for issue in issues:
            print(issue)
    else:
        print("✅ No issues detected!")
    
    print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    test_waste_flow()
