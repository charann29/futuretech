import json
from src.utils.llm_client import LLMClient
from src.schemas.resume_schema import Resume

class EnhancerAgent:
    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.system_prompt = """You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization.

Your task: Rewrite resume bullet points to align with a job description while maintaining ABSOLUTE authenticity.

CRITICAL ATS & INTEGRITY RULES:
1. Use EXACT keywords from the job description (not synonyms), BUT ONLY if they already exist in the user's provided skill list.
2. Incorporate technical terms and tools mentioned in the JD ONLY after verifying they are in the ALLOWED SKILLS list.
3. MANDATORY QUANTIFICATION: Include metrics (%, numbers, $, or volume) where they add value, but keep them balanced and realistic. Do not force numbers into every single bullet if it feels unnatural.
4. ABSOLUTE UNIQUENESS: Every bullet point generated must be UNIQUE. Do not repeat phrases, sentence structures, or content anywhere in the resume.
5. NO HALLUCINATIONS: Do not invent skills, tools, or experiences. If a skill in the JD is not in the ALLOWED SKILLS, do not add it.
6. VOCABULARY DIVERSITY: Generate fresh, professional phrasing. Avoid repetitive filler phrases like "showcasing ability to" or "demonstrating proficiency".
7. ACTION ORIENTED: Start each bullet with a strong, diverse action verb.

ALLOWED SKILLS LIST (STRICT):
{skills_list}

Focus on making the resume ATS-friendly while keeping it 100% truthful and professionally filled.
"""

    def enhance(self, resume: Resume, jd_text: str) -> Resume:
        # Extract all current skills to prevent hallucinations
        all_skills = set()
        for cat in resume.skills:
            all_skills.update(cat.skills)
        for proj in resume.projects:
            all_skills.update(proj.technologies)
        
        skills_string = ", ".join(sorted(list(all_skills)))
        current_system_prompt = self.system_prompt.format(skills_list=skills_string)

        user_prompt = f"""
        JOB DESCRIPTION:
        {jd_text}
        
        CURRENT RESUME (JSON):
        {resume.model_dump_json(indent=2)}
        
        TASK:
        Rewrite the resume to align with the JD using ONLY skills from the ALLOWED SKILLS LIST.
        
        CRITICAL: Include ALL sections from the original resume:
        - personal_info
        - summary
        - experience (with enhanced bullet points)
        - education
        - projects (with enhanced descriptions)
        - skills (categorized)
        - certifications (MUST be preserved exactly as provided)
        - languages (MUST be preserved exactly as provided)
        - custom_sections (MUST be preserved exactly as provided)
        
        Ensure every bullet is unique and varied. Add subtle metrics where appropriate.
        Return ONLY a valid JSON object matching the Resume schema.
        """

        try:
            # Use a slightly higher temperature for variety as requested by user
            response = self.llm.generate(current_system_prompt, user_prompt, temperature=0.4)
            
            # Clean up response - remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1])  # Remove first and last lines
                if response.startswith("json"):
                    response = response[4:].strip()
            
            # Try to parse the JSON
            try:
                enhanced_data = json.loads(response)
                enhanced_resume = Resume(**enhanced_data)
                
                # Pruning Hallucinated Skills (CRITICAL)
                original_skills_lower = {s.lower() for s in all_skills}
                
                # Check Skills section
                if enhanced_resume.skills:
                    for cat in enhanced_resume.skills:
                        cat.skills = [s for s in cat.skills if s.lower() in original_skills_lower]
                
                # Check Project technologies
                if enhanced_resume.projects:
                    for proj in enhanced_resume.projects:
                        proj.technologies = [t for t in proj.technologies if t.lower() in original_skills_lower]
                
                # CRITICAL: Preserve sections that LLM might drop
                # If enhanced resume has empty certifications but original had data, restore original
                if resume.certifications and not enhanced_resume.certifications:
                    print("⚠️  Warning: LLM dropped certifications. Restoring original certifications.")
                    enhanced_resume.certifications = resume.certifications
                
                # Same for languages
                if resume.languages and not enhanced_resume.languages:
                    print("⚠️  Warning: LLM dropped languages. Restoring original languages.")
                    enhanced_resume.languages = resume.languages
                
                # Same for custom sections
                if resume.custom_sections and not enhanced_resume.custom_sections:
                    print("⚠️  Warning: LLM dropped custom sections. Restoring original custom sections.")
                    enhanced_resume.custom_sections = resume.custom_sections
                
                # Check summary (this is harder, but we can at least remove blatant keywords)
                # For now, we trust the LLM on text, but strictly filter the structural data lists.
                
                return enhanced_resume
            except json.JSONDecodeError as e:
                print(f"Enhancement Parsing Error: {e}")
                print("Returning original resume to prevent data loss.")
                return resume
                
        except Exception as e:
            print(f"Enhancement Error: {e}")
            print("Returning original resume.")
            return resume
