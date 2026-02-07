import os
import json
import datetime
import google.auth
from google.auth.transport import requests
from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError
from google.auth import identity_pool
from supabase import create_client, Client

# Configuration from environment variables
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "user-resumes-storage-01")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "project-353fe44f-aa79-48fc-91d")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_gcs_credentials():
    """
    Load GCS credentials using Application Default Credentials (ADC).
    Supports:
    - Workload Identity Federation (Railway) via GOOGLE_APPLICATION_CREDENTIALS_JSON
    - Local ADC via 'gcloud auth application-default login'
    """
    # Check for Workload Identity Federation credentials (Railway)
    creds_json_str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if creds_json_str:
        try:
            # Parse the JSON string
            creds_info = json.loads(creds_json_str)
            
            # Create credentials from the external account config
            credentials = identity_pool.Credentials.from_info(creds_info)
            
            # Set the quota project
            if PROJECT_ID:
                credentials = credentials.with_quota_project(PROJECT_ID)
            
            print("✅ Using Workload Identity Federation credentials")
            return credentials
        except Exception as e:
            print(f"⚠️  Error loading Workload Identity credentials: {e}")
            print("Falling back to ADC...")
    
    # Fall back to standard ADC (local development)
    credentials, _ = google.auth.default()
    print("✅ Using Application Default Credentials (ADC)")
    return credentials

def get_supabase_client() -> Client:
    """Returns a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not set.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_resume_to_gcs(user_id: str, resume_id: str, pdf_content: bytes) -> str:
    """
    Uploads the PDF to GCS using Keyless Authentication (ADC).
    """
    try:
        # Initialize client with credentials from environment or ADC
        credentials = get_gcs_credentials()
        client = storage.Client(project=PROJECT_ID, credentials=credentials)
        bucket = client.bucket(BUCKET_NAME)
        
        destination_blob_name = f"resumes/{user_id}/{resume_id}.pdf"
        blob = bucket.blob(destination_blob_name)

        # Upload the PDF content
        blob.upload_from_string(pdf_content, content_type='application/pdf')

        # Sync to Supabase
        sync_resume_gcs_path(user_id, resume_id, destination_blob_name)

        return destination_blob_name
    except GoogleAPIError as e:
        print(f"GCS Error during upload: {e}")
        raise e
    except Exception as e:
        print(f"Unexpected Error during upload: {e}")
        raise e

def sync_resume_gcs_path(user_id: str, resume_id: str, gcs_path: str):
    """
    Updates the gcs_path column in the Supabase resumes table.
    """
    try:
        supabase = get_supabase_client()
        supabase.table("resumes") \
            .update({"gcs_path": gcs_path}) \
            .eq("id", resume_id) \
            .eq("user_id", user_id) \
            .execute()
        print(f"Successfully synced GCS path to Supabase for resume {resume_id}")
    except Exception as e:
        print(f"Supabase Sync Error: {e}")
        raise e

def get_signed_url(user_id: str, resume_id: str) -> str:
    """
    Generates a V4 Signed URL using Service Account Impersonation.
    Works with ADC (gcloud auth application-default login) without requiring a JSON key file.
    """
    try:
        # Get credentials from environment or ADC
        credentials = get_gcs_credentials()
        
        # Get service account email from environment
        service_account_email = os.getenv("GCS_SERVICE_ACCOUNT_EMAIL")
        if not service_account_email:
            raise ValueError("GCS_SERVICE_ACCOUNT_EMAIL environment variable is required for signed URLs")
        
        # Initialize storage client
        client = storage.Client(project=PROJECT_ID, credentials=credentials)
        bucket = client.bucket(BUCKET_NAME)
        blob_path = f"resumes/{user_id}/{resume_id}.pdf"
        blob = bucket.blob(blob_path)

        # Generate Signed URL using IAM signBlob API (Service Account Impersonation)
        # This works with ADC without needing a JSON key file
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET",
            service_account_email=service_account_email,
            response_disposition=f"attachment; filename=resume_{resume_id}.pdf"
        )

        return url
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        if "IAM Service Account Credentials API" in str(e):
            print("TIP: Enable the 'IAM Service Account Credentials API' in your Google Cloud Console.")
            print("Visit: https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com")
        raise e
