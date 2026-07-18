import os
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

# Zoho SMTP Credentials
SMTP_HOST = "smtp.zoho.com"
SMTP_PORT = 465

EMAIL_USER = os.getenv("ZOHO_EMAIL")
EMAIL_PASSWORD = os.getenv("ZOHO_APP_PASSWORD")

if not EMAIL_USER or not EMAIL_PASSWORD:
    raise ValueError("❌ ZOHO_EMAIL or ZOHO_APP_PASSWORD not found in .env file")


def send_email(to_addr: str, subject: str, html_body: str):
    """
    Send HTML Email using Zoho Mail SMTP.
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = EMAIL_USER
    msg["To"] = to_addr
    msg["Subject"] = subject

    plain_text = """
This email contains HTML content.
Please open it in an HTML-compatible email client.
"""

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASSWORD)
            smtp.sendmail(
                EMAIL_USER,
                to_addr,
                msg.as_string()
            )

        print(f"✅ Email sent to {to_addr}")

    except smtplib.SMTPRecipientsRefused:
        print(f"❌ Failed sending email to {to_addr}: Address Not Found")
        raise Exception("Address Not Found")
    except smtplib.SMTPResponseException as e:
        error_msg = f"SMTP Error {e.smtp_code}: {e.smtp_error.decode('utf-8', errors='ignore')}"
        print(f"❌ Failed sending email to {to_addr}: {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        print(f"❌ Failed sending email to {to_addr}: {str(e)}")
        raise Exception(f"Connection/Authentication Error: {str(e)}")