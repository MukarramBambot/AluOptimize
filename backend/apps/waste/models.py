from django.db import models
from django.conf import settings
from backend.apps.core.models import TimestampedModel
from backend.apps.prediction.models import ProductionInput

class WasteManagement(TimestampedModel):
	"""
	Tracks waste generated and whether it can be reused.
	"""
	WASTE_UNIT_CHOICES = [
		('KG', 'Kilograms'),
		('TON', 'Tons'),
		('L', 'Liters'),
	]

	production_input = models.ForeignKey(
		ProductionInput,
		on_delete=models.CASCADE,
		related_name='waste_records',
		null=True,
		blank=True
	)
	waste_type = models.CharField(max_length=100)
	waste_amount = models.FloatField()
	unit = models.CharField(max_length=10, choices=WASTE_UNIT_CHOICES, default='KG')
	date_recorded = models.DateField()
	reuse_possible = models.BooleanField(default=False)
	recorded_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='waste_records'
	)
	
	# Additional production context fields
	production_line = models.CharField(max_length=50, null=True, blank=True)
	temperature = models.FloatField(null=True, blank=True, help_text="Temperature in Celsius")
	pressure = models.FloatField(null=True, blank=True, help_text="Pressure in Pa")
	energy_used = models.FloatField(null=True, blank=True, help_text="Energy consumption in kWh")

	class Meta:
		ordering = ['-created_at']
		verbose_name = 'Waste Record'
		verbose_name_plural = 'Waste Records'
		indexes = [
			models.Index(fields=['-date_recorded']),
			models.Index(fields=['waste_type']),
		]

	def __str__(self):
		return f"{self.waste_type} - {self.waste_amount} {self.unit} on {self.date_recorded}"

class WasteRecommendation(TimestampedModel):
	"""
	Stores optimization suggestions and reuse strategies for a waste record.
	"""
	waste_record = models.ForeignKey(
		WasteManagement,
		on_delete=models.CASCADE,
		related_name='recommendations'
	)
	recommendation_text = models.TextField()
	estimated_savings = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
	ai_generated = models.BooleanField(default=True, help_text="Whether this recommendation was AI-generated")

	class Meta:
		ordering = ['-created_at']
		verbose_name = 'Waste Recommendation'
		verbose_name_plural = 'Waste Recommendations'

	def __str__(self):
		return f"Recommendation for {self.waste_record} - {self.estimated_savings or 'N/A'}"
