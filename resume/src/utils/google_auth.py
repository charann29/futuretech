import os
import json
import google.auth
from google.auth import identity_pool
from google.auth.impersonated_credentials import Credentials as ImpersonatedCredentials
from google.auth.transport.requests import Request
from src.config import settings

def get_google_credentials(scopes=None, impersonate_service_account=None):
    """
    Unified utility to get Google Cloud credentials.
    Supports:
    - Workload Identity Federation (Railway) via GOOGLE_APPLICATION_CREDENTIALS_JSON
    - Local ADC via 'gcloud auth application-default login'
    - Service Account Impersonation
    """
    project_id = settings.GOOGLE_CLOUD_PROJECT
    
    # 1. Try Workload Identity Federation (Railway)
    creds_json_str = settings.GOOGLE_APPLICATION_CREDENTIALS_JSON
    credentials = None
    
    if creds_json_str:
        try:
            creds_info = json.loads(creds_json_str)
            
            # Reconstruct credential_source if missing (Railway specific fix)
            if "credential_source" not in creds_info:
                oidc_token = settings.RAILWAY_OIDC_TOKEN
                if oidc_token:
                    import tempfile
                    token_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.token')
                    token_file.write(oidc_token)
                    token_file.close()
                    creds_info["credential_source"] = {
                        "file": token_file.name,
                        "format": {"type": "text"}
                    }
            
            # Handle 'environment_variable' or 'file' in credential_source
            cred_source = creds_info.get("credential_source", {})
            if "environment_variable" in cred_source:
                env_var_name = cred_source["environment_variable"]
                token_value = os.getenv(env_var_name)
                if token_value:
                    import tempfile
                    token_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.token')
                    token_file.write(token_value)
                    token_file.close()
                    creds_info["credential_source"]["file"] = token_file.name
                    del creds_info["credential_source"]["environment_variable"]
            
            credentials = identity_pool.Credentials.from_info(creds_info)
            if project_id:
                credentials = credentials.with_quota_project(project_id)
            print("✅ Loaded Workload Identity credentials")
            
        except Exception as e:
            print(f"⚠️ Error loading Workload Identity credentials: {e}")

    # 2. Fallback to standard ADC (local or already configured environments)
    if not credentials:
        credentials, _ = google.auth.default(scopes=scopes)
        print("✅ Using Application Default Credentials (ADC)")

    # 3. Handle Impersonation if requested
    if impersonate_service_account:
        print(f"👤 Impersonating service account: {impersonate_service_account}")
        
        # We need a Request object for the refresh
        auth_request = Request()
        
        credentials = ImpersonatedCredentials(
            source_credentials=credentials,
            target_principal=impersonate_service_account,
            target_scopes=scopes or ["https://www.googleapis.com/auth/cloud-platform"],
            lifetime=3600
        )
        # credentials.refresh(auth_request) # Optional here, will refresh on use
        
    return credentials
