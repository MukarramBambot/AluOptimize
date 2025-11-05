from django.db import models
from django.conf import settings

class TimestampedModel(models.Model):
    """
    An abstract base class model that provides timestamping.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class Transaction(TimestampedModel):
    """
    Model to track payments and transactions for predictions.
    """
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    TRANSACTION_TYPE_CHOICES = [
        ('prediction', 'Prediction Service'),
        ('report', 'Report Generation'),
        ('subscription', 'Subscription'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    prediction_output = models.ForeignKey(
        'prediction.ProductionOutput',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        default='prediction'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Transaction amount'
    )
    currency = models.CharField(
        max_length=3,
        default='USD'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        help_text='Payment method used'
    )
    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        help_text='Unique transaction identifier'
    )
    notes = models.TextField(
        blank=True,
        help_text='Additional notes or comments'
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_transactions',
        help_text='Admin who processed this transaction'
    )
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the transaction was processed'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'payment_status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.user.username} - {self.amount} {self.currency} ({self.payment_status})"
