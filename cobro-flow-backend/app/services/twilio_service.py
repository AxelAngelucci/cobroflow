from twilio.rest import Client
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)


def _get_client():
    settings = get_settings()
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return None, settings
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN), settings


def send_whatsapp_message(to: str, body: str) -> str | None:
    """Send a WhatsApp message using Twilio. Returns message SID or None on failure."""
    client, settings = _get_client()
    if not client:
        logger.warning("Twilio not configured – skipping WhatsApp send")
        return None
    try:
        message = client.messages.create(
            body=body,
            from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
            to=f"whatsapp:{to}",
        )
        logger.info("Sent WhatsApp message SID: %s to %s", message.sid, to)
        return message.sid
    except Exception as e:
        logger.error("Failed to send WhatsApp message to %s: %s", to, e)
        return None


def send_sms_message(to: str, body: str) -> str | None:
    """Send an SMS message using Twilio. Returns message SID or None on failure."""
    client, settings = _get_client()
    if not client:
        logger.warning("Twilio not configured – skipping SMS send")
        return None
    try:
        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            to=to,
        )
        logger.info("Sent SMS message SID: %s to %s", message.sid, to)
        return message.sid
    except Exception as e:
        logger.error("Failed to send SMS message to %s: %s", to, e)
        return None