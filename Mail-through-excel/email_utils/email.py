# email.py
import os
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()
try:
    GMAIL_USER = os.getenv("GMAIL_USER", "punjabians5228@gmail.com")
    GMAIL_PASS = os.getenv("GMAIL_APP_PASSWORD", "dmpd kylm hwve fnxp")
    print("Gmail:", GMAIL_USER)
except Exception as e:
    print(f"❌ Error loading environment variables: {e}")


def send_email(to_addr: str, subject: str, html_body: str):
    """
    Send an HTML email (with plain text fallback).
    """
    msg = MIMEMultipart("alternative")
    msg["From"] = GMAIL_USER
    msg["To"] = to_addr
    msg["Subject"] = subject

    # Plain-text fallback for email clients that don't support HTML
    plain_text = "This message contains HTML content. Please view it in an HTML-compatible client."

    # Attach plain text and HTML
    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(GMAIL_USER, GMAIL_PASS)
            smtp.sendmail(GMAIL_USER, to_addr, msg.as_string())
        print(f"✅ Sent to {to_addr}")
    except Exception as e:
        print(f"❌ Failed to send to {to_addr}: {e}")
