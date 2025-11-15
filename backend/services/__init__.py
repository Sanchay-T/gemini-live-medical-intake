"""
Mock business services for medical intake application

Includes:
- EMR (Electronic Medical Records) service
- Insurance verification service
- Notification service (email/SMS)
"""

from .emr_service import emr_service, EMRService
from .insurance_service import insurance_service, InsuranceService
from .notification_service import notification_service, NotificationService

__all__ = [
    'emr_service',
    'EMRService',
    'insurance_service',
    'InsuranceService',
    'notification_service',
    'NotificationService',
]
