"""
ExpanderAgent: Intelligently expands sparse resume content using LLM.

This agent detects sections with minimal information and generates
professional descriptions and bullet points to create a complete resume.
"""

from src.schemas.resume_schema import Resume, ExperienceItem, ProjectItem
from src.utils.llm_client import LLMClient
from typing import List
import re


class ExpanderAgent:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def expand(self, resume: Resume) -> Resume:
        """
        Expands sparse resume sections with AI-generated content.
        """
        # Extract allowed skills to prevent hallucinations
        all_skills = set()
        for cat in resume.skills:
            all_skills.update(cat.skills) if hasattr(cat, 'skills') else None
        for proj in resume.projects:
            all_skills.update(proj.technologies)
        
        self.allowed_skills = sorted(list(all_skills))
        self.allowed_skills_str = ", ".join(self.allowed_skills)

        print("Analyzing resume for sparse content...")
        
        if resume.experience:
            for exp in resume.experience:
                target = self._calculate_target_bullets(exp.start_date, exp.end_date)
                current_count = len(exp.details)
                
                if current_count < target:
                    needed = target - current_count
                    print(f"   -> Expanding {exp.company} ({current_count}/{target} bullets)")
                    new_bullets = self._generate_experience_bullets(exp, needed)
                    # Deduplicate and limit
                    exp.details.extend(new_bullets[:needed])

        if resume.projects:
            num_projects = len(resume.projects)
            # User Preference: If 2 or more projects, be concise (2-3 bullets max)
            default_target = 3 if num_projects >= 2 else 4

            for proj in resume.projects:
                current_count = len(proj.details)
                # If specific details already exist, trust user; else expand to target
                if current_count < default_target:
                    needed = default_target - current_count
                    print(f"   -> Expanding Project: {proj.name} ({current_count}/{default_target} bullets)")
                    new_bullets = self._generate_project_bullets(
                        proj, 
                        needed, 
                        concise_mode=(num_projects >= 2)
                    )
                    proj.details.extend(new_bullets[:needed])

        if resume.custom_sections:
            for section in resume.custom_sections:
                for item in section.items:
                    current_count = len(item.details)
                    target = 3 # Default for custom items
                    if current_count < target:
                        needed = target - current_count
                        print(f"   -> Expanding Custom Section [{section.title}]: {item.name}")
                        new_bullets = self._generate_custom_bullets(section.title, item, needed)
                        item.details.extend(new_bullets[:needed])
        
        return resume

    def _calculate_target_bullets(self, start: str, end: str) -> int:
        """Heuristic: Estimate job duration to decide bullet count."""
        if not start or not end: return 4
        
        # If 'Present' or 'Current', assume highly relevant/long-term -> 5 bullets
        if any(word in end.lower() for word in ["present", "current", "now"]):
            return 5
        
        try:
            # Look for 4-digit years or 2-digit years specifically at the end of word boundaries
            # or after a slash/dash.
            start_year_match = re.search(r'(?:20|19)?\d{2}$', start.strip())
            end_year_match = re.search(r'(?:20|19)?\d{2}$', end.strip())
            
            if start_year_match and end_year_match:
                y1_str = start_year_match.group()
                y2_str = end_year_match.group()
                
                # Convert to full years
                y1 = int(y1_str) + (2000 if len(y1_str) == 2 and int(y1_str) < 70 else 0)
                y2 = int(y2_str) + (2000 if len(y2_str) == 2 and int(y2_str) < 70 else 0)
                
                duration = abs(y2 - y1)
                # If duration >= 1 year, provide at least 4-5 bullets
                if duration >= 1:
                    return 5
                else:
                    return 3 # Internship or short gig
        except Exception:
            pass
            
        return 4 # Default for ambiguous cases



    # Removed redundant _expand_experience and _expand_project methods

    def _generate_experience_bullets(self, exp: ExperienceItem, count: int) -> List[str]:
        """
        Generate professional bullet points for an experience item.
        """
        if count <= 0: return []
        
        system_prompt = f"""You are a professional resume writer. Generate exactly {count} compelling, achievement-oriented bullet points.

Rules:
- Start each bullet with a strong action verb (Led, Developed, Implemented, Designed, etc.)
- BALANCED METRICS: Include natural metrics (%, numbers, $, time saved) where they add value.
- ABSOLUTE UNIQUENESS: Ensure these bullets do not repeat or sound like other bullets.
- BANNED BUZZWORDS: Never use words like: "problem-solving", "dynamic", "team player", "passionate".
- NO HALLUCINATIONS: ONLY use skills and technologies from the ALLOWED SKILLS list. Do NOT invent other tools.
- Keep bullets concise (1-2 lines max).

ALLOWED SKILLS:
{self.allowed_skills_str}
"""

        user_prompt = f"""Generate {count} professional bullet points for this work experience:

Role: {exp.role}
Company: {exp.company}
Duration: {exp.start_date} to {exp.end_date}
Location: {exp.location}

Return ONLY the bullet points, one per line, without numbers or bullet symbols."""

        response = self.llm.generate(system_prompt, user_prompt, temperature=0.7)
        bullets = [line.strip() for line in response.strip().split('\n') if line.strip()]
        return bullets[:count]

    def _generate_project_bullets(self, proj: ProjectItem, count: int, concise_mode: bool = False) -> List[str]:
        """
        Generate professional bullet points for a project.
        """
        if count <= 0: return []
        
        style_instruction = "- Focus strictly on the most important technical implementation details." if concise_mode else "- Focus on features, functionality, and impact."
        length_instruction = "- EXTREMELY CONCISE: One line only. No fluff." if concise_mode else "- Keep bullets concise (1-2 lines max)."
        
        system_prompt = f"""You are a professional resume writer. Generate exactly {count} compelling, technical bullet points.

Rules:
- Start each bullet with a strong action verb (Built, Developed, Implemented, Designed, etc.)
- BALANCED METRICS: Include subtle metrics where relevant.
- ABSOLUTE UNIQUENESS: Ensure these bullets do not repeat anywhere.
- BANNED BUZZWORDS: Avoid "problem-solving", "dynamic", "team player", "passionate".
- NO HALLUCINATIONS: ONLY use skills and technologies from the ALLOWED SKILLS list.
{style_instruction}
{length_instruction}

ALLOWED SKILLS:
{self.allowed_skills_str}
"""

        tech_list = ", ".join(proj.technologies) if proj.technologies else "modern technologies"
        
        user_prompt = f"""Generate {count} professional bullet points for this project:

Project Name: {proj.name}
Technologies: {tech_list}

Return ONLY the bullet points, one per line, without numbers or bullet symbols."""

        response = self.llm.generate(system_prompt, user_prompt, temperature=0.7)
        bullets = [line.strip() for line in response.strip().split('\n') if line.strip()]
        return bullets[:count]

    def _generate_custom_bullets(self, section_title: str, item, count: int) -> List[str]:
        """
        Generate bullet points for a custom section item.
        """
        if count <= 0: return []
        
        system_prompt = f"""You are a professional resume writer. Generate exactly {count} professional bullet points for a section titled "{section_title}".
        
Rules:
- Start each bullet with a strong action verb.
- Context: This is for a "{section_title}" part of the resume.
- Keep bullets concise and professional.
- NO HALLUCINATIONS: ONLY use skills and technologies from the ALLOWED SKILLS list.

ALLOWED SKILLS:
{self.allowed_skills_str}
"""
        user_prompt = f"""Generate {count} professional bullet points for:
Item Name: {item.name}
{"Organizer: " + item.organizer if item.organizer else ""}
{"Date: " + item.date if item.date else ""}
Section: {section_title}

Return ONLY the bullet points, one per line, without numbers or bullet symbols."""

        response = self.llm.generate(system_prompt, user_prompt, temperature=0.7)
        bullets = [line.strip() for line in response.strip().split('\n') if line.strip()]
        return bullets[:count]
