import datetime
import gspread
from src.utils.google_auth import get_google_credentials
from src.config import settings

# Configuration
SHEET_NAME = settings.GOOGLE_SHEET_NAME
LEADS_TAB_NAME = "leads"
IMPERSONATED_SA = "resume-storage-backend@project-353fe44f-aa79-48fc-91d.iam.gserviceaccount.com"

def get_sheets_client():
    """Returns a gspread client using impersonated credentials."""
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    credentials = get_google_credentials(scopes=scopes, impersonate_service_account=IMPERSONATED_SA)
    return gspread.authorize(credentials)

def sync_lead_to_sheets(lead_data: dict):
    """
    Appends a lead record to the Google Sheet.
    lead_data schema: {full_name, whatsapp_number, highest_qualification, native_state, created_at}
    """
    try:
        client = get_sheets_client()
        spreadsheet = client.open(SHEET_NAME)
        
        try:
            worksheet = spreadsheet.worksheet(LEADS_TAB_NAME)
        except gspread.exceptions.WorksheetNotFound:
            # Create worksheet if it doesn't exist
            worksheet = spreadsheet.add_worksheet(title=LEADS_TAB_NAME, rows="100", cols="6")
            # Add headers
            worksheet.append_row(["Timestamp", "Full Name", "WhatsApp Number", "Highest Qualification", "Native State", "Supabase Created At"])

        # Prepare row data
        row = [
            datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            lead_data.get("full_name"),
            lead_data.get("whatsapp_number"),
            lead_data.get("highest_qualification"),
            lead_data.get("native_state"),
            lead_data.get("created_at")
        ]
        
        worksheet.append_row(row)
        print(f"✅ Lead synced to Google Sheet: {lead_data.get('full_name')}")
        
        # Check for archival
        check_and_archive_leads(worksheet, spreadsheet)
        
    except Exception as e:
        print(f"❌ Google Sheets Sync Error: {e}")
        # We don't raise here as per requirement: "If the Sheet sync fails, the user should still see a success message"

def check_and_archive_leads(worksheet, spreadsheet):
    """
    Archives old leads if row count exceeds 3000.
    Moves entries older than 30 days to Archive_[Month_Year].
    """
    try:
        records = worksheet.get_all_records()
        if len(records) < 3000:
            return

        print(f"📦 Lead count {len(records)} exceeds 3000. Checking for old records...")
        
        today = datetime.datetime.now()
        archivable_rows = []
        keep_rows = []
        
        # We keep the header (row 1)
        headers = worksheet.row_values(1)
        
        for i, record in enumerate(records):
            timestamp_str = record.get("Timestamp")
            try:
                timestamp = datetime.datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                # If older than 30 days
                if (today - timestamp).days > 30:
                    archivable_rows.append(record)
                else:
                    keep_rows.append(record)
            except:
                keep_rows.append(record)

        if not archivable_rows:
            return

        # Create archive tab name
        archive_tab_name = f"Archive_{today.strftime('%b_%Y')}"
        
        try:
            archive_worksheet = spreadsheet.worksheet(archive_tab_name)
        except gspread.exceptions.WorksheetNotFound:
            archive_worksheet = spreadsheet.add_worksheet(title=archive_tab_name, rows="100", cols=len(headers))
            archive_worksheet.append_row(headers)

        # Move data to archive
        archive_data = [list(r.values()) for r in archivable_rows]
        archive_worksheet.append_rows(archive_data)
        
        # Update main leads tab with only fresh records
        worksheet.clear()
        worksheet.append_row(headers)
        if keep_rows:
            worksheet.append_rows([list(r.values()) for r in keep_rows])
            
        print(f"✅ Archived {len(archivable_rows)} records to {archive_tab_name}")

    except Exception as e:
        print(f"⚠️ Archival Error: {e}")
