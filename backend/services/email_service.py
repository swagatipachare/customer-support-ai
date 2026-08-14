import os
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")


def send_ticket_email(to_email, ticket_id, user_message, ai_answer):
    if not SENDGRID_API_KEY or not to_email:
        print("Email skipped: missing API key or recipient email")
        return False

    subject = f"TechMart Support Ticket {ticket_id} Created"
    content = f"""
    <h3>Your support ticket has been created</h3>
    <p><strong>Ticket ID:</strong> {ticket_id}</p>
    <p><strong>Your message:</strong> {user_message}</p>
    <p><strong>AI's initial response:</strong> {ai_answer}</p>
    <p>A human agent will review this shortly. You can reference ticket ID <strong>{ticket_id}</strong> for any follow-up.</p>
    <p>— TechMart Support</p>
    """

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        html_content=content
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False