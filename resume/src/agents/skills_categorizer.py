"""
SkillsCategorizer: Automatically categorizes skills based on job role and context.

This agent uses AI to intelligently organize skills into relevant categories
like Programming Languages, Web Development, Databases, Tools, etc.
"""

from src.schemas.resume_schema import Resume, SkillCategory
from src.utils.llm_client import LLMClient
from typing import List
import json
import re

class SkillsCategorizer:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def categorize(self, resume: Resume) -> Resume:
        """
        Intelligently organizes skills into relevant categories using LLM.
        """
        # Extract all unique skills from the resume
        all_skills = self._extract_all_skills(resume)
        
        if not all_skills:
            return resume
        
        # Determine the role context from JD or experience
        role_context = self._get_role_context(resume)
        print(f"🗂️  Categorizing {len(all_skills)} skills for: {role_context}...")
        
        # 1. Define the Schema strictly for the LLM
        system_prompt = """You are a precise Data Structuring Assistant specializing in Resume Skill Categorization.
        Organize technical skills into standard Resume Categories (e.g., Programming Languages, Frameworks, Tools, Cloud, Databases).
        
        RULES:
        - Do not lose any skills from the input list.
        - Do not duplicate skills.
        - Create 3-5 categories max.
        - Return ONLY valid JSON (list of objects).
        """
        
        user_prompt = f"""
        ROLE CONTEXT: {role_context}
        SKILLS LIST: {", ".join(all_skills)}
        
        Return JSON format:
        [
            {{"category": "Programming Languages", "skills": ["Python", "Java"]}},
            {{"category": "Frameworks & Libraries", "skills": ["React", "FastAPI"]}}
        ]
        """

        try:
            response = self.llm.generate(system_prompt, user_prompt, temperature=0.1)
            categories_data = self._extract_json(response)
            
            if categories_data:
                # Pruning Hallucinated Skills (CRITICAL)
                original_skills_lower = {s.lower() for s in all_skills}
                
                pruned_categories = []
                for cat_data in categories_data:
                    cat_skills = [s for s in cat_data.get("skills", []) if s.lower() in original_skills_lower]
                    if cat_skills:
                        pruned_categories.append(SkillCategory(category=cat_data.get("category", "Other"), skills=cat_skills))
                
                resume.skills = pruned_categories
            
        except Exception as e:
            print(f"⚠️ Categorization failed: {e}. Keeping original layout.")
            
        return resume

    def _extract_all_skills(self, resume: Resume) -> List[str]:
        """Extract all unique skills from resume sections."""
        skills = set()
        for skill_cat in resume.skills:
            skills.update(skill_cat.skills)
        for proj in resume.projects:
            skills.update(proj.technologies)
        return sorted(list(skills))

    def _get_role_context(self, resume: Resume) -> str:
        """Heuristic to determine role context."""
        if resume.job_description:
            return resume.job_description.split('.')[0][:100]
        elif resume.experience:
            return resume.experience[0].role
        return "Software Developer"

    def _extract_json(self, text: str):
        """Robustly extract JSON list from LLM response."""
        try:
            # Clean response from markdown blocks
            text = text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1])
                if text.startswith("json"):
                    text = text[4:].strip()
            
            match = re.search(r'(\[.*\])', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(text)
        except Exception as e:
            print(f"JSON Extraction Error: {e}")
            return None
