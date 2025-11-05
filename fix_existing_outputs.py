#!/usr/bin/env python
"""
Script to retroactively create waste records and recommendations for existing outputs.
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
from backend.apps.prediction.rl_environment import AluminumProductionEnvironment
from datetime import date

User = get_user_model()

def fix_existing_outputs():
    """Create waste records and recommendations for existing outputs."""
    
    print("\n" + "="*80)
    print("FIXING EXISTING PRODUCTION OUTPUTS")
    print("="*80 + "\n")
    
    # Get all outputs without waste records
    outputs_to_fix = ProductionOutput.objects.filter(waste_record__isnull=True)
    
    print(f"Found {outputs_to_fix.count()} outputs without waste records\n")
    
    if not outputs_to_fix.exists():
        print("✅ All outputs already have waste records!")
        return
    
    rl_env = AluminumProductionEnvironment()
    fixed_count = 0
    
    for output in outputs_to_fix:
        try:
            production_input = output.input_data
            
            print(f"Processing Output {output.id}...")
            print(f"  - Input: {production_input.id} by {production_input.submitted_by.username}")
            print(f"  - Status: {output.status}, Approved: {output.is_approved}")
            
            # Calculate or use existing values
            if output.waste_estimate is None:
                # Recalculate using RL environment
                rl_result = rl_env.step(production_input)
                waste_amount = rl_result['waste_amount']
                energy_efficiency = rl_result['energy_efficiency']
                
                # Update output with RL data
                output.waste_estimate = waste_amount
                output.energy_efficiency = energy_efficiency
                output.reward = rl_result['reward']['total_reward']
                output.rl_state = rl_result['state']
                output.rl_action = rl_result['action']
                output.rl_reward_breakdown = rl_result['reward']
                output.save()
                
                print(f"  - Recalculated: waste={waste_amount:.2f} kg, efficiency={energy_efficiency:.2f}%")
            else:
                waste_amount = output.waste_estimate
                energy_efficiency = output.energy_efficiency or 50.0
                print(f"  - Using existing: waste={waste_amount:.2f} kg, efficiency={energy_efficiency:.2f}%")
            
            # Create WasteRecord
            waste_record = WasteManagement.objects.create(
                production_input=production_input,
                waste_type='Aluminum Dross',
                waste_amount=waste_amount,
                unit='KG',
                date_recorded=date.today(),
                reuse_possible=energy_efficiency > 50,
                recorded_by=production_input.submitted_by,
                production_line=production_input.production_line,
                temperature=production_input.temperature,
                pressure=production_input.pressure,
                energy_used=production_input.power_consumption
            )
            print(f"  ✅ Created WasteRecord {waste_record.id}")
            
            # Generate recommendation
            action = rl_env.suggest_action(
                rl_env.create_state(production_input),
                energy_efficiency,
                waste_amount
            )
            
            recommendation_text = rl_env.generate_recommendation_text(
                waste_amount=waste_amount,
                energy_efficiency=energy_efficiency,
                action=action
            )
            
            # Calculate estimated savings (cap at reasonable value to prevent overflow)
            if energy_efficiency >= 80:
                estimated_savings = min(waste_amount * 2.5, 9999999999.99)
            elif energy_efficiency >= 60:
                estimated_savings = min(waste_amount * 2.0, 9999999999.99)
            elif energy_efficiency >= 40:
                estimated_savings = min(waste_amount * 1.5, 9999999999.99)
            else:
                estimated_savings = min(waste_amount * 1.0, 9999999999.99)
            
            print(f"  - Estimated savings: ${estimated_savings:.2f}")
            
            # Convert to Decimal for database
            from decimal import Decimal
            estimated_savings = Decimal(str(round(estimated_savings, 2)))
            
            waste_recommendation = WasteRecommendation.objects.create(
                waste_record=waste_record,
                recommendation_text=recommendation_text,
                estimated_savings=estimated_savings,
                ai_generated=True
            )
            print(f"  ✅ Created WasteRecommendation {waste_recommendation.id}")
            
            # Link to output
            output.waste_record = waste_record
            output.recommendation = waste_recommendation
            output.save()
            print(f"  ✅ Linked to ProductionOutput {output.id}\n")
            
            fixed_count += 1
            
        except Exception as e:
            print(f"  ❌ Error processing output {output.id}: {str(e)}\n")
            continue
    
    print("="*80)
    print(f"✅ Fixed {fixed_count} out of {outputs_to_fix.count()} outputs")
    print("="*80 + "\n")

if __name__ == '__main__':
    fix_existing_outputs()
