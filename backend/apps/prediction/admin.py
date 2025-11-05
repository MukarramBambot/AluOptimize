from django.contrib import admin
from .models import ProductionInput, ProductionOutput, PredictionLog


@admin.register(ProductionInput)
class ProductionInputAdmin(admin.ModelAdmin):
    list_display = ('id', 'production_line', 'submitted_by', 'created_at')
    search_fields = ('production_line',)


@admin.register(ProductionOutput)
class ProductionOutputAdmin(admin.ModelAdmin):
    list_display = ('id', 'input_data', 'predicted_output', 'actual_output', 'created_at')
    search_fields = ('input_data__production_line',)


@admin.register(PredictionLog)
class PredictionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'production_output', 'model_version', 'confidence_score', 'created_at')
    search_fields = ('model_version',)
