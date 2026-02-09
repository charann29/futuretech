import os
import json
import datetime
import google.auth
from google.auth.transport import requests
from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError
from google.auth import identity_pool
from supabase import create_client, Client

from src.utils.google_auth import get_google_credentials
from src.config import settings

# Configuration
BUCKET_NAME = settings.GCS_BUCKET_NAME
PROJECT_ID = settings.GOOGLE_CLOUD_PROJECT
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY

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
        # Try to get service account email from settings
        service_account_email = settings.GCS_SERVICE_ACCOUNT_EMAIL
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
