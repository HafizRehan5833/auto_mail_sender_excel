from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from email_utils.email import send_email
from tooling.tools import extract_emails_from_excel  # returns email, name, company

app = FastAPI(
    title="Excel Email Sender API",
    description="API for sending personalized automation and web development offer emails from Excel files",
    version="2.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
WHATSAPP_NUMBER = "923019201234"


def generate_email_body(name: str, company: str) -> str:
    """
    JR Agency — Automation & Website Development Solutions
    Personalized email template for each client.
    """
    first_name = name.split()[0].capitalize() if name else "there"
    company_name = company or "your company"

    whatsapp_link = (
        f"https://wa.me/{WHATSAPP_NUMBER}?text=Hi%20JR%20Agency%2C%20"
        f"I%27m%20from%20{company_name.replace(' ', '%20')}%20and%20would%20like%20to%20discuss%20automation%20or%20website%20solutions."
    )

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{company_name} | Save 40+ Hours Monthly & Attract Clients Automatically 🚀</title>
  <style>
    body {{
      font-family: 'Poppins', Arial, sans-serif;
      background: #f8f9fb;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 700px;
      margin: 40px auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.07);
      overflow: hidden;
    }}
    .header {{
      background: linear-gradient(135deg, #111827, #ef4444);
      color: white;
      padding: 45px 30px;
      text-align: center;
    }}
    .header h1 {{
      font-size: 26px;
      margin: 0;
    }}
    .header p {{
      margin-top: 8px;
      font-size: 15px;
      opacity: 0.9;
    }}
    .body {{
      padding: 35px;
      line-height: 1.7;
    }}
    .body p {{
      margin-bottom: 18px;
      font-size: 15px;
      color: #334155;
    }}
    .highlight {{
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 20px 0;
    }}
    .cta {{
      text-align: center;
      margin-top: 30px;
    }}
    .cta a {{
      display: inline-block;
      margin: 8px;
      padding: 14px 26px;
      border-radius: 40px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }}
    .btn-primary {{
      background: linear-gradient(90deg, #111827, #ef4444);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }}
    .btn-primary:hover {{
      opacity: 0.85;
    }}
    .btn-outline {{
      border: 2px solid #ef4444;
      color: #ef4444;
      background: white;
    }}
    .btn-outline:hover {{
      background: #ef4444;
      color: white;
    }}
    .footer {{
      background: #111827;
      color: #d1d5db;
      text-align: center;
      padding: 20px;
      font-size: 13px;
    }}
    .footer a {{
      color: #ef4444;
      text-decoration: none;
    }}
    .footer a:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{company_name} — Transforming Ideas into Intelligent Solutions</h1>
      <p>Helping {company_name} automate, accelerate, and attract more clients online.</p>
    </div>

    <div class="body">
      <p>Hi {first_name},</p>
      <p>Every business faces time-consuming tasks that hold back growth and focus.</p>

      <div class="highlight">
        <strong>Imagine if those tasks could run automatically — while you focus on what really matters.</strong>
      </div>

      <p>At <strong>JR Agency</strong>, we craft intelligent <strong>automation systems</strong> and high-performing <strong>websites</strong> designed to help {company_name} scale efficiently and attract more clients.</p>

      <p><strong>Here’s what our clients have achieved:</strong></p>
      <ul>
        <li>⚡ Reduced manual workload by 9+ hours/day using automation tools.</li>
        <li>🌐 Built conversion-driven websites that attract clients 24/7.</li>
        <li>📈 Scaled operations without expanding their teams.</li>
      </ul>

      <div class="highlight">
        <strong>{company_name} could save <span style="color:#ef4444;">40+ hours each month</span> and attract more clients automatically 🚀</strong>
      </div>

      <div class="cta">
        <a href="{whatsapp_link}" class="btn-primary" target="_blank">💬 Discuss Your Project</a>
        <a href="https://www.jragency.tech" class="btn-outline" target="_blank">🌍 Visit Our Website</a>
      </div>
    </div>

    <div class="footer">
      <p>JR Agency — Where automation meets creativity. Building systems that grow your business while you focus on your vision.</p>
      <a href="https://www.jragency.tech" target="_blank">www.jragency.tech</a>
    </div>
  </div>
</body>
</html>
"""


@app.get("/")
async def root():
    return {
        "message": "📧 Welcome to JR Agency’s Email Sender API — offering website development and automation solutions. Upload your Excel file at /upload-excel/."
    }


@app.post("/upload-excel/")
async def upload_excel(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        result = extract_emails_from_excel(file_bytes=contents, filename=file.filename)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        contacts = result.get("contacts", [])
        if not contacts:
            raise HTTPException(status_code=400, detail="No valid contacts found")

        sent_emails, failed_emails = [], []

        print(f"\n📤 Starting to send {len(contacts)} emails...\n")

        for i, contact in enumerate(contacts, start=1):
            email = contact.get("email")
            name = contact.get("name", "Friend")
            company = contact.get("company", "your company")

            if not email:
                failed_emails.append({"email": None, "error": "Missing email"})
                continue

            subject = f"{company} | Save 40+ Hours Monthly & Attract Clients Automatically 🚀"
            body = generate_email_body(name, company)

            try:
                print(f"📧 [{i}/{len(contacts)}] Sending to: {email} ({company})...")
                send_email(email, subject, body)
                print(f"✅ Sent successfully to {email}\n")
                sent_emails.append(email)
            except Exception as e:
                print(f"❌ Failed to send to {email}: {str(e)}\n")
                failed_emails.append({"email": email, "error": str(e)})

        print(f"\n✅ All done! Total sent: {len(sent_emails)}, Failed: {len(failed_emails)}\n")

        return {
            "status": "completed",
            "total_contacts": len(contacts),
            "emails_sent": len(sent_emails),
            "failed_count": len(failed_emails),
            "failed_details": failed_emails
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
