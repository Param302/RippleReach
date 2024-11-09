import json
import requests
from datetime import datetime
from config import Config

class EmailDeliveryError(Exception):
    """Custom exception for email delivery failures"""
    pass

class EmailSender:
    _current_index = 0
    
    @classmethod
    def validate_sender_config(cls, config: dict) -> bool:
        """Validates sender configuration"""
        required_fields = ['email', 'api_key', 'display_name']
        return all(field in config and config[field] for field in required_fields)

    @classmethod
    def get_next_sender_config(cls) -> dict:
        """Returns the next sender config in round-robin fashion with validation"""
        if not Config.SENDER_CONFIGS:
            raise ValueError("No sender configurations available")
            
        config = Config.SENDER_CONFIGS[cls._current_index]
        
        # Validate config
        if not cls.validate_sender_config(config):
            raise ValueError(f"Invalid sender configuration: {json.dumps(config, default=str)}")
        
        # Increment for next time
        cls._current_index = (cls._current_index + 1) % len(Config.SENDER_CONFIGS)
        return config


def validate_email_content(to_email: str, subject: str, html_content: str) -> None:
    """Validates email content before sending"""
    if not to_email or '@' not in to_email:
        raise ValueError(f"Invalid recipient email: {to_email}")
        
    if not subject or len(subject.strip()) < 2:
        raise ValueError(f"Invalid subject line: {subject}")
        
    if not html_content or len(html_content.strip()) < 10:
        raise ValueError(f"Invalid email content length: {len(html_content) if html_content else 0} chars")

def send_round_robin_email(to_email: str, subject: str, html_content: str, attachments: list[dict] = None) -> dict:
    """Send email using round-robin sender configuration with enhanced validation"""
    start_time = datetime.now()
    request_id = f"email_{start_time.strftime('%Y%m%d_%H%M%S')}"
    
    validate_email_content(to_email, subject, html_content)
    sender_config = EmailSender.get_next_sender_config()
    
    clean_subject = subject.strip().strip('"\'').strip()
    from_email = f"{sender_config['display_name']} <{sender_config['email']}>"
    
    email_data = {
        "from": from_email,
        "to": to_email,
        "subject": clean_subject,
        "html": html_content,
        "attachments": attachments or []
    }
    
    # Make API request with timeout
    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {sender_config['api_key']}",
            "Content-Type": "application/json"
        },
        json=email_data,
        timeout=10  # 10 seconds timeout
    )
    
    try:
        response_data = response.json()
    except json.JSONDecodeError:
        response_data = {"raw_response": response.text}
    
    if not response.ok:
        error_msg = f"Email sending failed: Status {response.status_code} - {response.text}"
        raise EmailDeliveryError(error_msg)

    if 'id' not in response_data:
        raise EmailDeliveryError("Missing email ID in successful response")
        
    end_time = datetime.now()
    
    success_response = {
        "status": "success",
        "request_id": request_id,
        "email_id": response_data.get('id'),
        "details": {
            "from": from_email,
            "to": to_email,
            "subject": clean_subject,
            "sent_at": end_time.isoformat(),
        }
    }
    
    return success_response
