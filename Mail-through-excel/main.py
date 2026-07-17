import random

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import time

from email_utils.email import send_email
from tooling.tools import extract_emails_from_excel

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


def generate_email_body(name: str, company: str, website: str = None) -> str:
    """
    JR Agency — Automation & Website Development Solutions
    Personalized email template for each client.
    """
    first_name = name.split()[0].capitalize() if name else "there"
    company_name = company or "your company"
    website_url = website or "your site"

    return f"""
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Try this on your own site — takes 30 seconds</title>
<style>
  body, table, td {{ -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }}
  table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
  body {{ margin: 0; padding: 0; width: 100% !important; height: 100% !important; }}
  @media only screen and (max-width: 600px) {{
    .email-container {{ width: 100% !important; }}
    .mobile-padding {{ padding-left: 22px !important; padding-right: 22px !important; }}
    .btn-cell {{ display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; }}
    .hero-title {{ font-size: 22px !important; }}
  }}
</style>
</head>
<body style="margin:0; padding:0; background-color:#eceae6;">

  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Three 10-second checks on {website_url} — you might not like the answers.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eceae6;">
    <tr>
      <td align="center" style="padding: 32px 14px;">

        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #dcd9d3;">

          <!-- Signal bar -->
          <tr>
            <td style="height:4px; background-color:#e8a33d; line-height:4px; font-size:1px;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="mobile-padding" style="padding: 26px 40px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: Menlo, Consolas, 'Courier New', monospace; font-size:13px; font-weight:700; color:#14171c; letter-spacing:0.5px;">
                    JR&nbsp;AI&nbsp;AGENCY
                  </td>
                  <td align="right" style="font-family: Menlo, Consolas, 'Courier New', monospace; font-size:11px; color:#9a9488; letter-spacing:0.3px;">
                    two founders · no sales team
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="mobile-padding" style="padding: 4px 40px 0 40px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin:0 0 10px 0; font-family: Menlo, Consolas, 'Courier New', monospace; font-size:11px; font-weight:700; color:#e8a33d; letter-spacing:1.2px; text-transform:uppercase;">
                A 30-second check before the pitch
              </p>
              <p class="hero-title" style="margin:0; font-size:25px; line-height:1.32; font-weight:800; color:#14171c; letter-spacing:-0.3px;">
                Don't take my word for it — open {website_url} on your phone right now.
              </p>
              <p style="margin:14px 0 0 0; font-size:15px; line-height:1.65; color:#5b6472;">
                Not on wifi, on data, the way most visitors actually find you. Three things to try, thirty seconds each:
              </p>
            </td>
          </tr>

          <!-- Checklist: signature element -->
          <tr>
            <td class="mobile-padding" style="padding: 22px 40px 4px 40px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0; border-top:1px solid #eceae6;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="22" valign="top" style="padding-right:12px;">
                          <div style="width:16px; height:16px; border:2px solid #14171c;"></div>
                        </td>
                        <td valign="top">
                          <p style="margin:0; font-size:14.5px; line-height:1.55; color:#3d3a35;"><strong style="color:#14171c;">Time the load.</strong> Count the seconds until it's actually usable, not just a blank screen or a spinner.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-top:1px solid #eceae6;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="22" valign="top" style="padding-right:12px;">
                          <div style="width:16px; height:16px; border:2px solid #14171c;"></div>
                        </td>
                        <td valign="top">
                          <p style="margin:0; font-size:14.5px; line-height:1.55; color:#3d3a35;"><strong style="color:#14171c;">Tap "Contact" or "Book."</strong> See if it actually goes anywhere, or just sits there.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-top:1px solid #eceae6; border-bottom:1px solid #eceae6;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="22" valign="top" style="padding-right:12px;">
                          <div style="width:16px; height:16px; border:2px solid #14171c;"></div>
                        </td>
                        <td valign="top">
                          <p style="margin:0; font-size:14.5px; line-height:1.55; color:#3d3a35;"><strong style="color:#14171c;">Send a test message.</strong> Does anything confirm it went through, or are you just hoping?</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0 0; font-size:13px; color:#8a8378;">
                If any of those made you pause — that's the exact moment a visitor becomes a lost customer instead of a lead.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding: 22px 40px 4px 40px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#3d3a35;">
                Hi {first_name},
              </p>
              <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#3d3a35;">
                I'm Rehan from JR AI Agency. We help small businesses fix one core problem:
              </p>
              <p style="margin:0 0 4px 0; font-size:15px; line-height:1.7; color:#3d3a35;">
                Reply and tell me which of the three you actually noticed — I'll send back exactly what I'd fix first and roughly what it'd take, no pitch attached.
              </p>
            </td>
          </tr>
          

          <!-- CTA -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 40px 6px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="btn-cell" style="padding-right:10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#14171c" style="border-radius:2px;">
                          <a href="mailto:hello@jragency.tech?subject=Re%3A%20{company_name}%20-%20the%20site%20check&body=Hi%20Rehan%2C%0A%0AHere%27s%20what%20I%20noticed%20on%20our%20site%3A%0A%0A-%20"
                             style="display:inline-block; padding:13px 24px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:2px;">
                            Reply with what I noticed
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="btn-cell">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#ffffff" style="border-radius:2px; border:1px solid #14171c;">
                          <a href="https://wa.me/923019201234?text=Hi%20Rehan%2C%20I%27m%20from%20{company_name}%20-%20here%27s%20what%20I%20noticed%20on%20our%20site."
                             style="display:inline-block; padding:13px 24px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#14171c; text-decoration:none; border-radius:2px;">
                            Or WhatsApp me
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td class="mobile-padding" style="padding: 22px 40px 8px 40px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin:0; font-size:14px; line-height:1.7; color:#6b665e;">
                Either way, hope things are going well over there.<br><br>
                — <span style="color:#14171c; font-weight:700;">Hafiz Rehan</span><br>
                Co-Founder, JR AI Agency<br>
                <a href="https://hafizmrehanportfolio.vercel.app/" style="color:#14171c; text-decoration:underline;">Portfolio</a> &nbsp;·&nbsp;
                <a href="https://linkedin.com/in/rehanai" style="color:#14171c; text-decoration:underline;">LinkedIn</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="mobile-padding" style="padding: 18px 40px 0 40px;">
              <div style="height:1px; background-color:#eceae6;"></div>
            </td>
          </tr>

          <!-- P.S. services -->
          <tr>
            <td class="mobile-padding" style="padding: 20px 40px 6px 40px; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
              <p style="margin:0 0 14px 0; font-size:13px; line-height:1.6; color:#6b665e;">
                <strong style="color:#14171c;">P.S.</strong> — what a rebuild usually includes:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding:0 10px 12px 0; border-left:2px solid #e8a33d;">
                    <p style="margin:0 0 2px 0; padding-left:10px; font-size:13px; font-weight:700; color:#14171c;">Fast, modern rebuild</p>
                    <p style="margin:0; padding-left:10px; font-size:12px; color:#8a8378; line-height:1.5;">Loads quickly, works on the first tap, mobile-first</p>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 12px 10px; border-left:2px solid #e8a33d;">
                    <p style="margin:0 0 2px 0; padding-left:10px; font-size:13px; font-weight:700; color:#14171c;">Forms that actually work</p>
                    <p style="margin:0; padding-left:10px; font-size:12px; color:#8a8378; line-height:1.5;">Every submission confirmed and routed somewhere real</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding:0 10px 0 0; border-left:2px solid #e8a33d;">
                    <p style="margin:0 0 2px 0; padding-left:10px; font-size:13px; font-weight:700; color:#14171c;">Instant reply automation</p>
                    <p style="margin:0; padding-left:10px; font-size:12px; color:#8a8378; line-height:1.5;">WhatsApp or chat that answers before a human can</p>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 0 10px; border-left:2px solid #e8a33d;">
                    <p style="margin:0 0 2px 0; padding-left:10px; font-size:13px; font-weight:700; color:#14171c;">Booking &amp; lead capture</p>
                    <p style="margin:0; padding-left:10px; font-size:12px; color:#8a8378; line-height:1.5;">Built in, not bolted on as an afterthought</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 40px; background-color:#f7f6f4; border-top:1px solid #eceae6;">
              <p style="margin:0; font-family: Menlo, Consolas, 'Courier New', monospace; font-size:11px; line-height:1.7; color:#9a9488;">
                JR AI AGENCY · hello@jragency.tech<br>
                Not the right time? Reply "no thanks" — I won't follow up again.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
"""



@app.get("/")
async def root():
    return {
        "message": "📧 Welcome to JR Agency's Email Sender API — offering website development and automation solutions. Upload your Excel file at /upload-excel/."
    }

@app.get("/api/health")
async def health_check():
    return {"status": "online", "version": "2.3.0"}

@app.post("/upload-excel/")
async def upload_excel(file: UploadFile = File(...)):
    try:
        # Read uploaded file
        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        # Extract contacts
        result = extract_emails_from_excel(
            file_bytes=contents,
            filename=file.filename
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        contacts = result.get("contacts", [])

        if not contacts:
            raise HTTPException(status_code=400, detail="No valid contacts found")

        sent_emails = []
        failed_emails = []

        print(f"\n📤 Starting to send {len(contacts)} emails...\n")

        # Loop through all contacts
        for i, contact in enumerate(contacts, start=1):

            email = contact.get("email")
            name = contact.get("name", "Friend")
            company = contact.get("company", "your company")
            website = contact.get("website")

            if not email:
                failed_emails.append({
                    "email": None,
                    "error": "Missing email"
                })
                continue

            subject = f"{company} | Save 40+ Hours Monthly & Attract Clients Automatically 🚀"

            body = generate_email_body(name, company, website)

            try:
                print(f"📧 [{i}/{len(contacts)}] Sending to {email}")

                send_email(
                    email,
                    subject,
                    body
                )

                print(f"✅ Successfully sent to {email}")

                sent_emails.append(email)

                # Wait before sending next email
                time.sleep(random.randint(2, 5))

            except Exception as e:
                print(f"❌ Failed to send to {email}: {e}")

                failed_emails.append({
                    "email": email,
                    "error": str(e)
                })

        print(
            f"\n✅ Completed!\n"
            f"Sent: {len(sent_emails)}\n"
            f"Failed: {len(failed_emails)}"
        )

        return {
            "status": "completed",
            "total_contacts": len(contacts),
            "emails_sent": sent_emails,
            "failed": failed_emails,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )