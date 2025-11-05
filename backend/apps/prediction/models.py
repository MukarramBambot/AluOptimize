from django.db import models
from django.conf import settings
from backend.apps.core.models import TimestampedModel

class ProductionInput(TimestampedModel):
    """
    Stores raw input data for aluminum production process.
    """
    PRODUCTION_LINE_CHOICES = [
        ('LINE_A', 'Production Line A'),
        ('LINE_B', 'Production Line B'),
        ('LINE_C', 'Production Line C'),
    ]

    production_line = models.CharField(max_length=10, choices=PRODUCTION_LINE_CHOICES)
    temperature = models.FloatField(help_text="Temperature in Celsius")
    pressure = models.FloatField(help_text="Pressure in Pascal")
    feed_rate = models.FloatField(help_text="Raw material feed rate in kg/h")
    power_consumption = models.FloatField(help_text="Power consumption in kWh")
    anode_effect = models.FloatField(help_text="Anode effect frequency")
    bath_ratio = models.FloatField(help_text="Bath ratio")
    alumina_concentration = models.FloatField(help_text="Alumina concentration in %")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL,
        null=True,
        related_name='production_inputs'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Production Input'
        verbose_name_plural = 'Production Inputs'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['production_line']),
        ]

    def __str__(self):
        return f"{self.production_line} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class ProductionOutput(TimestampedModel):
    """
    Stores predicted vs actual aluminum production output.
    """
    input_data = models.OneToOneField(
        ProductionInput,
        on_delete=models.CASCADE,
        related_name='output'
    )
    predicted_output = models.FloatField(help_text="Predicted aluminum output in kg")
    actual_output = models.FloatField(null=True, blank=True, help_text="Actual aluminum output in kg")
    output_quality = models.FloatField(help_text="Output quality score (0-100)")
    energy_efficiency = models.FloatField(help_text="Energy efficiency score (0-100)")
    deviation_percentage = models.FloatField(
        null=True,
        blank=True,
        help_text="Deviation between predicted and actual output in %"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Production Output'
        verbose_name_plural = 'Production Outputs'
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Output for {self.input_data}"

    def save(self, *args, **kwargs):
        if self.predicted_output and self.actual_output:
            self.deviation_percentage = (
                (self.actual_output - self.predicted_output) / self.predicted_output * 100
            )
        super().save(*args, **kwargs)

class PredictionLog(TimestampedModel):
    """
    Stores detailed prediction logs including confidence and quantiles.
    """
    production_output = models.ForeignKey(
        ProductionOutput,
        on_delete=models.CASCADE,
        related_name='prediction_logs'
    )
    confidence_score = models.FloatField(help_text="Model's confidence score (0-1)")
    q10_prediction = models.FloatField(help_text="10th percentile prediction")
    q50_prediction = models.FloatField(help_text="50th percentile prediction (median)")
    q90_prediction = models.FloatField(help_text="90th percentile prediction")
    model_version = models.CharField(max_length=50, help_text="Version of the ML model used")
    input_features = models.JSONField(help_text="Input features used for prediction")
    execution_time_ms = models.IntegerField(help_text="Prediction execution time in milliseconds")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Prediction Log'
        verbose_name_plural = 'Prediction Logs'
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['model_version']),
        ]

    def __str__(self):
        return f"Prediction {self.id} - {self.model_version}"