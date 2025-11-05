from django.contrib import admin
from .models import WasteManagement, WasteRecommendation


@admin.register(WasteManagement)
class WasteManagementAdmin(admin.ModelAdmin):
    list_display = ('id', 'waste_type', 'waste_amount', 'unit', 'date_recorded', 'reuse_possible')
    search_fields = ('waste_type',)


@admin.register(WasteRecommendation)
class WasteRecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'waste_record', 'estimated_savings', 'created_at')
    search_fields = ('waste_record__waste_type',)
from django.contrib import admin

# Register your models here.
