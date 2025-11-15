"""
Custom validators for medical intake data

Provides validation functions for medical data fields
"""

import re
from typing import Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def validate_phone_number(phone: str) -> Tuple[bool, Optional[str]]:
    """
    Validate phone number format

    Args:
        phone: Phone number string

    Returns:
        Tuple of (is_valid, formatted_phone or error_message)
    """
    if not phone:
        return False, "Phone number is required"

    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone)

    # Check if it's all digits
    if not cleaned.isdigit():
        return False, "Phone number must contain only digits and separators"

    # Check length (US phone numbers)
    if len(cleaned) == 10:
        # Format as (XXX) XXX-XXXX
        formatted = f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"
        return True, formatted
    elif len(cleaned) == 11 and cleaned[0] == '1':
        # Format as +1 (XXX) XXX-XXXX
        formatted = f"+1 ({cleaned[1:4]}) {cleaned[4:7]}-{cleaned[7:]}"
        return True, formatted
    else:
        return False, "Phone number must be 10 digits (or 11 with country code)"


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email address format

    Args:
        email: Email address string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"

    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if not re.match(pattern, email):
        return False, "Invalid email format"

    return True, None


def validate_date_of_birth(dob: str) -> Tuple[bool, Optional[str]]:
    """
    Validate date of birth

    Args:
        dob: Date of birth string (YYYY-MM-DD)

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not dob:
        return False, "Date of birth is required"

    # Try to parse date
    try:
        # Support multiple formats
        for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"]:
            try:
                birth_date = datetime.strptime(dob, fmt)
                break
            except ValueError:
                continue
        else:
            return False, "Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY"

        # Check if date is in the future
        if birth_date > datetime.now():
            return False, "Date of birth cannot be in the future"

        # Check if date is reasonable (not more than 120 years ago)
        age_years = (datetime.now() - birth_date).days / 365.25
        if age_years > 120:
            return False, "Date of birth seems unrealistic"

        return True, None

    except Exception as e:
        logger.error(f"Error validating date of birth: {e}")
        return False, str(e)


def validate_medication_name(medication: str) -> Tuple[bool, Optional[str]]:
    """
    Validate medication name

    Args:
        medication: Medication name string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not medication:
        return False, "Medication name is required"

    # Check length
    if len(medication) < 2:
        return False, "Medication name too short"

    if len(medication) > 100:
        return False, "Medication name too long"

    # Check for valid characters (letters, numbers, spaces, hyphens)
    if not re.match(r'^[a-zA-Z0-9\s\-]+$', medication):
        return False, "Medication name contains invalid characters"

    return True, None


def validate_allergy_severity(severity: str) -> Tuple[bool, Optional[str]]:
    """
    Validate allergy severity

    Args:
        severity: Severity level string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not severity:
        return False, "Severity is required"

    valid_severities = ["mild", "moderate", "serious", "life-threatening"]

    severity_lower = severity.lower()

    if severity_lower not in valid_severities:
        return False, f"Severity must be one of: {', '.join(valid_severities)}"

    return True, None


def validate_symptom_severity(severity: str) -> Tuple[bool, Optional[str]]:
    """
    Validate symptom severity (1-10 scale)

    Args:
        severity: Severity level string

    Returns:
        Tuple of (is_valid, normalized_value or error_message)
    """
    if not severity:
        return False, "Severity is required"

    # Try to extract number from string
    numbers = re.findall(r'\d+', str(severity))

    if not numbers:
        return False, "Severity must include a number (1-10)"

    level = int(numbers[0])

    if level < 1 or level > 10:
        return False, "Severity must be between 1 and 10"

    return True, str(level)


def validate_insurance_member_id(member_id: str) -> Tuple[bool, Optional[str]]:
    """
    Validate insurance member ID

    Args:
        member_id: Member ID string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not member_id:
        return False, "Member ID is required"

    # Remove spaces and hyphens
    cleaned = re.sub(r'[\s\-]', '', member_id)

    # Check length (typically 6-20 characters)
    if len(cleaned) < 6 or len(cleaned) > 20:
        return False, "Member ID must be 6-20 characters"

    # Check for valid characters (letters and numbers)
    if not re.match(r'^[a-zA-Z0-9]+$', cleaned):
        return False, "Member ID must contain only letters and numbers"

    return True, None


def sanitize_text_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize text input for safety

    Args:
        text: Input text
        max_length: Maximum allowed length

    Returns:
        Sanitized text
    """
    if not text:
        return ""

    # Remove control characters
    sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

    # Trim whitespace
    sanitized = sanitized.strip()

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def validate_medical_record_completeness(intake_data: dict) -> Tuple[bool, list]:
    """
    Validate if medical intake record is complete

    Args:
        intake_data: Medical intake dictionary

    Returns:
        Tuple of (is_complete, list_of_missing_fields)
    """
    required_fields = [
        "patient_info",
        "present_illness",
        "allergies"  # Critical field
    ]

    missing_fields = []

    for field in required_fields:
        if field not in intake_data or not intake_data[field]:
            missing_fields.append(field)

    # Check patient info subfields
    if "patient_info" in intake_data and intake_data["patient_info"]:
        patient_info = intake_data["patient_info"]
        required_patient_fields = ["name", "date_of_birth"]

        for field in required_patient_fields:
            if field not in patient_info or not patient_info[field]:
                missing_fields.append(f"patient_info.{field}")

    # Check present illness
    if "present_illness" in intake_data and intake_data["present_illness"]:
        present_illness = intake_data["present_illness"]
        if not present_illness.get("chief_complaints"):
            missing_fields.append("present_illness.chief_complaints")

    is_complete = len(missing_fields) == 0

    return is_complete, missing_fields


def validate_critical_allergies(allergies: list) -> Tuple[bool, list]:
    """
    Validate critical allergy information

    Args:
        allergies: List of allergy dictionaries

    Returns:
        Tuple of (all_valid, list_of_validation_errors)
    """
    errors = []

    if not allergies:
        # No allergies is acceptable (patient may have none)
        return True, []

    for i, allergy in enumerate(allergies):
        # Check required fields
        if not allergy.get("allergen"):
            errors.append(f"Allergy {i+1}: Missing allergen name")

        if not allergy.get("reaction"):
            errors.append(f"Allergy {i+1}: Missing reaction")

        if not allergy.get("severity"):
            errors.append(f"Allergy {i+1}: Missing severity")
        else:
            is_valid, msg = validate_allergy_severity(allergy["severity"])
            if not is_valid:
                errors.append(f"Allergy {i+1}: {msg}")

    is_valid = len(errors) == 0

    return is_valid, errors
