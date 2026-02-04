import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import traceback

from config import GROQ_API_KEY
from src.utils.llm_client import LLMClient
from src.agents.jd_parser_agent import JDParserAgent
from src.agents.expander_agent import ExpanderAgent
from src.agents.skills_categorizer import SkillsCategorizer
from src.agents.enhancer_agent import EnhancerAgent
from src.agents.skills_analyzer import SkillsAnalyzer
from src.generators.resume_generator import ResumeGenerator
from src.schemas.resume_schema import Resume
from src.utils.gcs_utils import upload_resume_to_gcs, get_resume_download_url

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM Client (API key now comes from config.py)
llm = LLMClient(model_name="llama-3.3-70b-versatile")

@app.get("/")
async def root():
    return {"message": "Resume Builder API is running"}

class ProcessResponse(BaseModel):
    resume: Resume
    analysis: Optional[Dict[str, Any]] = None

class GenerateRequest(BaseModel):
    resume: Resume
    user_id: str
    resume_id: str

@app.post("/process", response_model=ProcessResponse)
async def process_resume_endpoint(resume: Resume):
    """
    Unified Pipeline: JD Parsing -> Expansion -> Analysis -> Categorization -> Enhancement.
    """
    try:
        # 0. Parse Job Description (if present) to reduce token consumption
        parsed_jd_text = None
        if resume.job_description:
            print("\n🔍 Parsing Job Description...")
            jd_parser = JDParserAgent(llm)
            parsed_jd_text = jd_parser.parse_to_string(resume.job_description)
            print(f"✅ JD Parsed successfully\n")
        
        # 1. Expansion Phase
        # Check if expansion is needed (simple heuristic: empty details)
        needs_expansion = False
        for exp in resume.experience:
            if not exp.details or len(exp.details) < 2:
                needs_expansion = True
                break
        if not needs_expansion:
            for proj in resume.projects:
                if not proj.details or len(proj.details) < 2:
                    needs_expansion = True
                    break
        
        if needs_expansion:
            expander = ExpanderAgent(llm)
            resume = expander.expand(resume)

        # 2. Skills Analysis (if JD present)
        analysis = None
        if parsed_jd_text:
            analyzer = SkillsAnalyzer(llm)
            # Pass parsed JD instead of raw JD
            analysis = analyzer.analyze(resume, parsed_jd_text)

        # 3. Skills Categorization
        categorizer = SkillsCategorizer(llm)
        resume = categorizer.categorize(resume)

        # 4. Enhancement Phase (if JD present)
        if parsed_jd_text:
            enhancer = EnhancerAgent(llm)
            # Pass parsed JD instead of raw JD
            resume = enhancer.enhance(resume, parsed_jd_text)

        return ProcessResponse(resume=resume, analysis=analysis)
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_resume_pdf(request: GenerateRequest):
    """
    Generates a TeX and PDF, uploads to GCS, and returns the path and signed URL.
    """
    try:
        resume = request.resume
        user_id = request.user_id
        resume_id = request.resume_id

        generator = ResumeGenerator()
        filename = f"resume_{resume_id}"
        tex_path = generator.generate_tex(resume, filename=filename)
        pdf_path = generator.generate_pdf(tex_path)
        
        if pdf_path and os.path.exists(pdf_path):
            # Read PDF content for upload
            with open(pdf_path, "rb") as f:
                file_content = f.read()
            
            # Upload to GCS
            gcs_path = upload_resume_to_gcs(user_id, resume_id, file_content)
            
            # Generate temporary download URL
            download_url = get_resume_download_url(user_id, resume_id)
            
            return {
                "message": "Resume generated and uploaded successfully",
                "gcs_path": gcs_path,
                "download_url": download_url,
                "filename": f"{filename}.pdf"
            }
        else:
            raise HTTPException(status_code=500, detail="PDF generation failed")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/resumes")
async def list_resumes():
    """
    Lists all saved resumes with metadata.
    """
    try:
        saved_dir = "data/saved_resumes"
        resumes = []
        if os.path.exists(saved_dir):
            for filename in os.listdir(saved_dir):
                if filename.endswith(".json"):
                    path = os.path.join(saved_dir, filename)
                    stats = os.stat(path)
                    with open(path, "r") as f:
                        data = json.load(f)
                        # Extract basic info for listing
                        personal_info = data.get("personal_info", {})
                        resumes.append({
                            "id": filename.replace(".json", ""),
                            "name": personal_info.get("name", "Untitled"),
                            "modified_at": stats.st_mtime,
                            "summary": data.get("summary", ""),
                            "is_default": filename == "default.json"
                        })
        return sorted(resumes, key=lambda x: x["modified_at"], reverse=True)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/resumes/{resume_id}")
async def get_resume(resume_id: str):
    """
    Loads a specific resume by ID.
    """
    try:
        path = f"data/saved_resumes/{resume_id}.json"
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Resume not found")
        with open(path, "r") as f:
            return json.load(f)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resumes")
async def save_resume(resume: Dict[str, Any]):
    """
    Saves a resume to disk.
    """
    try:
        resume_id = resume.get("id")
        if not resume_id:
            # Generate a simple ID based on name and timestamp if not provided
            name = resume.get("personal_info", {}).get("name", "untitled").replace(" ", "_").lower()
            import time
            resume_id = f"{name}_{int(time.time())}"
        
        path = f"data/saved_resumes/{resume_id}.json"
        with open(path, "w") as f:
            json.dump(resume, f, indent=4)
        
        return {"id": resume_id, "message": "Resume saved successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    """
    Deletes a specific resume.
    """
    try:
        path = f"data/saved_resumes/{resume_id}.json"
        if os.path.exists(path):
            os.remove(path)
            return {"message": "Resume deleted"}
        raise HTTPException(status_code=404, detail="Resume not found")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
