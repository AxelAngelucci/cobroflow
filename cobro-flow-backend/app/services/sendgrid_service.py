import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> str | None:
    """Send an email via SendGrid. Returns message ID or None on failure."""
    settings = get_settings()
    if not settings.SENDGRID_API_KEY or not settings.SENDGRID_FROM_EMAIL:
        logger.warning("SendGrid not configured – skipping email send")
        return None
    try:
        message = Mail(
            from_email=From(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = client.send(message)
        # SendGrid returns the message ID in the X-Message-Id header
        message_id = response.headers.get("X-Message-Id", f"sg-{response.status_code}")
        logger.info("Sent email to %s — status %s id %s", to, response.status_code, message_id)
        return message_id
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return None
