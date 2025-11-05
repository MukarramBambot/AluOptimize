#!/usr/bin/env python
"""
Test script for input-specific PDF report generation
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
from backend.apps.core.input_pdf_generator import InputReportPDFGenerator

User = get_user_model()

def test_input_report_generation():
    """Test input-specific report PDF generation"""
    print("\n" + "="*80)
    print("TESTING INPUT-SPECIFIC REPORT PDF GENERATION")
    print("="*80 + "\n")
    
    try:
        # Get a non-admin user
        user = User.objects.filter(is_staff=False, is_superuser=False).first()
        
        if not user:
            print("❌ No non-admin users found in database")
            return False
        
        print(f"✅ Found user: {user.username} ({user.email})")
        
        # Get an input for this user
        production_input = ProductionInput.objects.filter(submitted_by=user).first()
        
        if not production_input:
            print(f"❌ No inputs found for user {user.username}")
            return False
        
        print(f"✅ Found input: ID {production_input.id}, Line {production_input.production_line}")
        
        # Prepare user data
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
        
        # Prepare input data
        input_data = {
            'id': production_input.id,
            'production_line': production_input.production_line,
            'feed_rate': production_input.feed_rate,
            'temperature': production_input.temperature,
            'pressure': production_input.pressure,
            'power_consumption': production_input.power_consumption,
            'bath_ratio': production_input.bath_ratio,
            'alumina_concentration': production_input.alumina_concentration,
            'anode_effect': production_input.anode_effect,
            'created_at': production_input.created_at,
        }
        
        # Get output data (if exists)
        output_data = None
        try:
            output = ProductionOutput.objects.get(input_data=production_input)
            output_data = {
                'id': output.id,
                'predicted_output': output.predicted_output,
                'energy_efficiency': output.energy_efficiency,
                'output_quality': output.output_quality,
                'waste_estimate': output.waste_estimate,
                'status': output.status,
                'is_approved': output.is_approved,
                'reward': output.reward,
            }
            print(f"✅ Found output: Efficiency {output.energy_efficiency:.2f}%")
        except ProductionOutput.DoesNotExist:
            print("⚠️  No output found for this input")
        
        # Get waste data (if exists) - get the most recent one
        waste_data = None
        waste_obj = None
        try:
            waste = WasteManagement.objects.filter(production_input=production_input).order_by('-date_recorded').first()
            if waste:
                waste_obj = waste
                waste_data = {
                    'id': waste.id,
                    'waste_type': waste.waste_type,
                    'waste_amount': waste.waste_amount,
                    'unit': waste.unit,
                    'production_line': waste.production_line,
                    'reuse_possible': waste.reuse_possible,
                    'date_recorded': waste.date_recorded,
                }
                print(f"✅ Found waste: {waste.waste_amount} {waste.unit}")
            else:
                print("⚠️  No waste data found for this input")
        except Exception as e:
            print(f"⚠️  Error fetching waste data: {str(e)}")
        
        # Get recommendation data (if exists)
        recommendation_data = None
        if waste_obj:
            try:
                recommendation = WasteRecommendation.objects.filter(waste_record=waste_obj).first()
                if recommendation:
                    recommendation_data = {
                        'id': recommendation.id,
                        'recommendation_text': recommendation.recommendation_text,
                        'estimated_savings': recommendation.estimated_savings,
                        'ai_generated': recommendation.ai_generated,
                    }
                    print(f"✅ Found recommendation: ${recommendation.estimated_savings:.2f} savings")
                else:
                    print("⚠️  No recommendation found for this waste")
            except Exception as e:
                print(f"⚠️  Error fetching recommendation: {str(e)}")
        
        # Generate PDF
        print("\n📄 Generating PDF report...")
        pdf_generator = InputReportPDFGenerator()
        pdf_buffer = pdf_generator.generate_input_report(
            user_data=user_data,
            input_data=input_data,
            output_data=output_data,
            waste_data=waste_data,
            recommendation_data=recommendation_data
        )
        
        # Save to file for inspection
        output_file = f'/tmp/aluoptimize_input_report_{production_input.id}_test.pdf'
        with open(output_file, 'wb') as f:
            pdf_buffer.seek(0)
            f.write(pdf_buffer.read())
        
        print(f"✅ PDF generated successfully!")
        print(f"✅ Saved to: {output_file}")
        print(f"   File size: {os.path.getsize(output_file)} bytes")
        
        print("\n📋 Report Contents:")
        print(f"   - User: {user.username}")
        print(f"   - Input ID: {production_input.id}")
        print(f"   - Has Output: {'Yes' if output_data else 'No'}")
        print(f"   - Has Waste: {'Yes' if waste_data else 'No'}")
        print(f"   - Has Recommendation: {'Yes' if recommendation_data else 'No'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Test API endpoint structure"""
    print("\n" + "="*80)
    print("TESTING API ENDPOINTS")
    print("="*80 + "\n")
    
    try:
        # Test user filtering
        non_admin_users = User.objects.filter(is_staff=False, is_superuser=False)
        admin_users = User.objects.filter(is_staff=True) | User.objects.filter(is_superuser=True)
        
        print(f"✅ Non-admin users: {non_admin_users.count()}")
        print(f"✅ Admin users (excluded): {admin_users.count()}")
        
        if non_admin_users.count() == 0:
            print("⚠️  Warning: No non-admin users found")
            return False
        
        # Test input filtering for first user
        user = non_admin_users.first()
        user_inputs = ProductionInput.objects.filter(submitted_by=user)
        
        print(f"\n✅ User: {user.username}")
        print(f"✅ Inputs for this user: {user_inputs.count()}")
        
        if user_inputs.count() > 0:
            for inp in user_inputs[:3]:  # Show first 3
                has_output = ProductionOutput.objects.filter(input_data=inp).exists()
                print(f"   - Input #{inp.id}: {inp.production_line} (Output: {'Yes' if has_output else 'No'})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("INPUT-SPECIFIC REPORT GENERATION TEST SUITE")
    print("="*80)
    
    results = {
        'api_endpoints': test_api_endpoints(),
        'pdf_generation': test_input_report_generation(),
    }
    
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Input-specific report generation is working correctly.")
        print("\nGenerated PDF saved to /tmp/")
        print("You can open it to verify the detailed layout and formatting.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
