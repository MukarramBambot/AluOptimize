#!/usr/bin/env python
"""
Test script for admin dashboard statistics endpoint
"""
import os
import sys
import django
import json

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
django.setup()

from django.contrib.auth import get_user_model
from backend.apps.prediction.models import ProductionInput, ProductionOutput
from backend.apps.waste.models import WasteManagement
from rest_framework.test import APIRequestFactory
from backend.apps.core.admin_views import AdminDashboardViewSet

User = get_user_model()

def test_dashboard_endpoint():
    """Test dashboard statistics endpoint"""
    print("\n" + "="*80)
    print("TESTING ADMIN DASHBOARD STATISTICS ENDPOINT")
    print("="*80 + "\n")
    
    try:
        # Get an admin user
        admin_user = User.objects.filter(is_staff=True).first()
        
        if not admin_user:
            print("❌ No admin user found in database")
            return False
        
        print(f"✅ Found admin user: {admin_user.username}")
        
        # Create a request with forced authentication
        factory = APIRequestFactory()
        request = factory.get('/api/admin-panel/dashboard/')
        
        # Force authentication
        from rest_framework.test import force_authenticate
        force_authenticate(request, user=admin_user)
        
        # Call the viewset
        view = AdminDashboardViewSet.as_view({'get': 'list'})
        response = view(request)
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error: {response.data}")
            return False
        
        # Check response data
        data = response.data
        
        print("\n✅ Dashboard Statistics Retrieved Successfully!")
        print("\n" + "-"*80)
        print("USER STATISTICS:")
        print(f"  Total Users: {data.get('users', {}).get('total', 0)}")
        print(f"  Active Users: {data.get('users', {}).get('active', 0)}")
        print(f"  Pending Users: {data.get('users', {}).get('pending', 0)}")
        
        print("\nPREDICTION STATISTICS:")
        print(f"  Total Predictions: {data.get('predictions', {}).get('total', 0)}")
        print(f"  Total Inputs: {data.get('predictions', {}).get('total_inputs', 0)}")
        print(f"  Approved: {data.get('predictions', {}).get('approved', 0)}")
        print(f"  This Week: {data.get('predictions', {}).get('this_week', 0)}")
        print(f"  Avg Efficiency: {data.get('predictions', {}).get('avg_efficiency', 0)}%")
        
        print("\nWASTE STATISTICS:")
        print(f"  Total Records: {data.get('waste', {}).get('total_records', 0)}")
        print(f"  Total Amount: {data.get('waste', {}).get('total_amount', 0)} kg")
        print(f"  Reusable: {data.get('waste', {}).get('reusable', 0)}")
        
        print("\nRECENT ACTIVITY:")
        print(f"  Recent Users: {len(data.get('recent_activity', {}).get('users', []))}")
        print(f"  Recent Predictions: {len(data.get('recent_activity', {}).get('predictions', []))}")
        
        print("-"*80)
        
        # Verify JSON serialization
        print("\n🔍 Testing JSON Serialization...")
        try:
            json_str = json.dumps(data)
            print("✅ All data is JSON serializable")
        except Exception as e:
            print(f"❌ JSON serialization error: {str(e)}")
            return False
        
        # Check for None values
        print("\n🔍 Checking for None values...")
        has_none = False
        
        def check_none(obj, path=""):
            nonlocal has_none
            if obj is None:
                print(f"⚠️  Found None at: {path}")
                has_none = True
            elif isinstance(obj, dict):
                for key, value in obj.items():
                    check_none(value, f"{path}.{key}" if path else key)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    check_none(item, f"{path}[{i}]")
        
        check_none(data)
        
        if not has_none:
            print("✅ No None values found")
        
        # Verify all required fields exist
        print("\n🔍 Verifying required fields...")
        required_fields = {
            'users': ['total', 'pending', 'active'],
            'predictions': ['total', 'total_inputs', 'approved', 'this_week', 'avg_efficiency'],
            'waste': ['total_records', 'total_amount', 'reusable'],
            'recent_activity': ['users', 'predictions']
        }
        
        all_present = True
        for section, fields in required_fields.items():
            if section not in data:
                print(f"❌ Missing section: {section}")
                all_present = False
            else:
                for field in fields:
                    if field not in data[section]:
                        print(f"❌ Missing field: {section}.{field}")
                        all_present = False
        
        if all_present:
            print("✅ All required fields present")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_data_types():
    """Test that all data types are correct"""
    print("\n" + "="*80)
    print("TESTING DATA TYPES")
    print("="*80 + "\n")
    
    try:
        admin_user = User.objects.filter(is_staff=True).first()
        
        factory = APIRequestFactory()
        request = factory.get('/api/admin-panel/dashboard/')
        
        from rest_framework.test import force_authenticate
        force_authenticate(request, user=admin_user)
        
        view = AdminDashboardViewSet.as_view({'get': 'list'})
        response = view(request)
        
        data = response.data
        
        # Check data types
        print("Checking data types...")
        
        # User stats should be integers
        assert isinstance(data['users']['total'], int), "users.total should be int"
        assert isinstance(data['users']['pending'], int), "users.pending should be int"
        assert isinstance(data['users']['active'], int), "users.active should be int"
        print("✅ User statistics are integers")
        
        # Prediction stats
        assert isinstance(data['predictions']['total'], int), "predictions.total should be int"
        assert isinstance(data['predictions']['this_week'], int), "predictions.this_week should be int"
        assert isinstance(data['predictions']['avg_efficiency'], (int, float)), "predictions.avg_efficiency should be numeric"
        print("✅ Prediction statistics have correct types")
        
        # Waste stats
        assert isinstance(data['waste']['total_records'], int), "waste.total_records should be int"
        assert isinstance(data['waste']['total_amount'], (int, float)), "waste.total_amount should be numeric"
        assert isinstance(data['waste']['reusable'], int), "waste.reusable should be int"
        print("✅ Waste statistics have correct types")
        
        # Recent activity should be lists
        assert isinstance(data['recent_activity']['users'], list), "recent_activity.users should be list"
        assert isinstance(data['recent_activity']['predictions'], list), "recent_activity.predictions should be list"
        print("✅ Recent activity are lists")
        
        return True
        
    except AssertionError as e:
        print(f"❌ Type error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ADMIN DASHBOARD ENDPOINT TEST SUITE")
    print("="*80)
    
    results = {
        'endpoint': test_dashboard_endpoint(),
        'data_types': test_data_types(),
    }
    
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Dashboard endpoint is working correctly.")
        print("\nThe frontend should now load without errors.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
