import os
import datetime
from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError

# Get bucket name from environment variable
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

def get_gcs_client():
    """Returns a GCS client using GOOGLE_APPLICATION_CREDENTIALS environment variable."""
    return storage.Client()

def upload_resume_to_gcs(user_id: str, resume_id: str, file_content: bytes):
    """
    Uploads the generated PDF to GCS with the path: resumes/{user_id}/{resume_id}.pdf
    Returns the dynamic GCS path.
    """
    if not BUCKET_NAME:
        raise ValueError("GCS_BUCKET_NAME environment variable is not set.")

    try:
        client = get_gcs_client()
        bucket = client.bucket(BUCKET_NAME)
        
        # Define the path
        destination_blob_name = f"resumes/{user_id}/{resume_id}.pdf"
        blob = bucket.blob(destination_blob_name)

        # Upload the file
        blob.upload_from_string(file_content, content_type='application/pdf')

        return destination_blob_name
    except GoogleAPIError as e:
        print(f"Error uploading to GCS: {e}")
        raise e
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise e

def get_resume_download_url(user_id: str, resume_id: str):
    """
    Generates a v4 signed URL for downloading the resume.
    The URL expires in 15 minutes.
    """
    if not BUCKET_NAME:
        raise ValueError("GCS_BUCKET_NAME environment variable is not set.")

    try:
        client = get_gcs_client()
        bucket = client.bucket(BUCKET_NAME)
        blob_name = f"resumes/{user_id}/{resume_id}.pdf"
        blob = bucket.blob(blob_name)

        # Generate a signed URL (v4)
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET",
        )

        return url
    except GoogleAPIError as e:
        print(f"Error generating signed URL: {e}")
        raise e
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise e
