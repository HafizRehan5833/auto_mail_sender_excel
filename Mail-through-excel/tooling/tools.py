from io import BytesIO
import pandas as pd
import os

def extract_emails_from_excel(file_bytes: bytes = None, filename: str = None, file_path: str = None):
    """
    Extract Name, Email, and Company columns from an Excel or CSV file.
    Required columns: Name, Email
    Optional column: Company
    Returns {"contacts": [...]} or {"error": "..."}
    """
    try:
        # Load into DataFrame
        if file_bytes is not None:
            bio = BytesIO(file_bytes)
            fname = (filename or "").lower()
            bio.seek(0)

            if fname.endswith(".csv"):
                df = pd.read_csv(bio)
            else:
                df = pd.read_excel(bio, engine="openpyxl")

        elif file_path is not None:
            ext = os.path.splitext(file_path)[1].lower()
            if ext == ".csv":
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, engine="openpyxl")
        else:
            return {"error": "No file provided to extractor."}

        # Normalize columns to lowercase
        df.columns = [str(col).strip().lower() for col in df.columns]

        # Check required columns
        if not {"name", "email"}.issubset(df.columns):
            return {"error": "Excel must contain columns: Name and Email"}

        # Determine if 'company' column exists
        has_company = "company" in df.columns

        # Drop empty email rows
        df = df.dropna(subset=["email"])

        # Build contact list
        contacts = []
        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()
            email = str(row.get("email", "")).strip()
            company = str(row.get("company", "")).strip() if has_company else None

            # Skip invalid entries
            if not email:
                continue

            contacts.append({
                "name": name,
                "email": email,
                "company": company
            })

        if not contacts:
            return {"error": "No valid email entries found in Excel."}

        return {"contacts": contacts}

    except Exception as e:
        return {"error": f"Failed to process Excel: {str(e)}"}
