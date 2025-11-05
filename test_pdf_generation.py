#!/usr/bin/env python
"""
Test script for PDF report generation
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
django.setup()

from django.contrib.auth import get_user_model
from backend.apps.prediction.models import ProductionOutput
from backend.apps.waste.models import WasteManagement, WasteRecommendation
from backend.apps.core.pdf_generator import AluOptimizePDFReport

User = get_user_model()

def test_users_report():
    """Test users report PDF generation"""
    print("\n" + "="*80)
    print("TESTING USERS REPORT PDF GENERATION")
    print("="*80 + "\n")
    
    try:
        # Fetch users data
        users = User.objects.all().values(
            'id', 'username', 'email', 'is_active', 'is_staff', 'date_joined'
        )
        users_list = list(users)
        
        print(f"✅ Found {len(users_list)} users")
        
        # Generate PDF
        pdf_gen = AluOptimizePDFReport()
        pdf_buffer = pdf_gen.generate_users_report(users_list)
        
        # Save to file for inspection
        output_file = '/tmp/aluoptimize_users_report_test.pdf'
        with open(output_file, 'wb') as f:
            pdf_buffer.seek(0)
            f.write(pdf_buffer.read())
        
        print(f"✅ PDF generated successfully!")
        print(f"✅ Saved to: {output_file}")
        print(f"   File size: {os.path.getsize(output_file)} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_predictions_report():
    """Test predictions report PDF generation"""
    print("\n" + "="*80)
    print("TESTING PREDICTIONS REPORT PDF GENERATION")
    print("="*80 + "\n")
    
    try:
        # Fetch predictions data
        predictions = ProductionOutput.objects.select_related(
            'input_data', 'input_data__submitted_by'
        ).all().values(
            'id', 'predicted_output', 'energy_efficiency', 'output_quality',
            'is_approved', 'status', 'created_at',
            'input_data__production_line', 'input_data__submitted_by__username'
        )
        
        # Transform data
        predictions_list = []
        for pred in predictions:
            predictions_list.append({
                'id': pred['id'],
                'predicted_output': pred['predicted_output'],
                'energy_efficiency': pred['energy_efficiency'],
                'output_quality': pred['output_quality'],
                'is_approved': pred['is_approved'],
                'status': pred['status'],
                'created_at': pred['created_at'].isoformat() if pred['created_at'] else None,
                'input_data': {
                    'production_line': pred['input_data__production_line'],
                    'submitted_by': {
                        'username': pred['input_data__submitted_by__username']
                    }
                }
            })
        
        print(f"✅ Found {len(predictions_list)} predictions")
        
        # Generate PDF
        pdf_gen = AluOptimizePDFReport()
        pdf_buffer = pdf_gen.generate_predictions_report(predictions_list)
        
        # Save to file
        output_file = '/tmp/aluoptimize_predictions_report_test.pdf'
        with open(output_file, 'wb') as f:
            pdf_buffer.seek(0)
            f.write(pdf_buffer.read())
        
        print(f"✅ PDF generated successfully!")
        print(f"✅ Saved to: {output_file}")
        print(f"   File size: {os.path.getsize(output_file)} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_waste_report():
    """Test waste management report PDF generation"""
    print("\n" + "="*80)
    print("TESTING WASTE MANAGEMENT REPORT PDF GENERATION")
    print("="*80 + "\n")
    
    try:
        # Fetch waste data
        waste_records = WasteManagement.objects.all().values(
            'id', 'waste_type', 'waste_amount', 'unit', 'production_line',
            'reuse_possible', 'date_recorded'
        )
        waste_list = list(waste_records)
        
        # Fetch recommendations
        recommendations = WasteRecommendation.objects.all().values(
            'id', 'recommendation_text', 'estimated_savings', 'ai_generated'
        )
        recommendations_list = list(recommendations)
        
        print(f"✅ Found {len(waste_list)} waste records")
        print(f"✅ Found {len(recommendations_list)} recommendations")
        
        # Generate PDF
        pdf_gen = AluOptimizePDFReport()
        pdf_buffer = pdf_gen.generate_waste_report(waste_list, recommendations_list)
        
        # Save to file
        output_file = '/tmp/aluoptimize_waste_report_test.pdf'
        with open(output_file, 'wb') as f:
            pdf_buffer.seek(0)
            f.write(pdf_buffer.read())
        
        print(f"✅ PDF generated successfully!")
        print(f"✅ Saved to: {output_file}")
        print(f"   File size: {os.path.getsize(output_file)} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("PDF REPORT GENERATION TEST SUITE")
    print("="*80)
    
    results = {
        'users': test_users_report(),
        'predictions': test_predictions_report(),
        'waste': test_waste_report()
    }
    
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    
    for report_type, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{report_type.title()} Report: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! PDF generation is working correctly.")
        print("\nGenerated PDFs saved to /tmp/:")
        print("  - aluoptimize_users_report_test.pdf")
        print("  - aluoptimize_predictions_report_test.pdf")
        print("  - aluoptimize_waste_report_test.pdf")
        print("\nYou can open these files to verify the branding and formatting.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
