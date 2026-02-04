"""
SkillsAnalyzer: Analyzes job descriptions and identifies skills gaps.

This agent extracts required skills from a JD and compares them against
the user's resume to identify missing skills and provide recommendations.
"""

from src.schemas.resume_schema import Resume
from src.utils.llm_client import LLMClient
from typing import List, Dict
import json
import re


class SkillsAnalyzer:
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    # def analyze(self, resume: Resume, job_description: str) -> Dict[str, List[str]]:
    #     if not job_description:
    #         return {"missing_skills": [], "matching_skills": []}

    #     print("🧠 Performing Deep Skill Gap Analysis...")

    #     # 1. Get Resume Skills (All of them flattened)
    #     resume_skills = []
    #     for cat in resume.skills: resume_skills.extend(cat.skills)
    #     for proj in resume.projects: resume_skills.extend(proj.technologies)
    #     resume_skills_str = ", ".join(set(resume_skills))

    #     # 2. ONE-SHOT LLM ANALYSIS (Much more accurate than manual string matching)
    #     # We ask the LLM to compare JD vs Resume and tell us the truth.
    #     system_prompt = "You are a strict Technical Recruiter. Compare a candidate's skills to a JD."
        
    #     user_prompt = f"""
    #     JOB DESCRIPTION:
    #     {job_description[:3000]}
        
    #     CANDIDATE SKILLS:
    #     {resume_skills_str}
        
    #     TASK:
    #     1. Identify "Matching Skills" (Skills the user HAS that are in the JD).
    #     2. Identify "Missing Skills" (Critical skills in JD that user lacks).
    #        - Do NOT list skills the user obviously knows (e.g. if they know React, don't list HTML/CSS as missing).
    #     3. Provide 3 specific recommendations.
        
    #     Return valid JSON:
    #     {{
    #         "matching_skills": ["List", "of", "skills"],
    #         "missing_skills": ["List", "of", "skills"],
    #         "recommendations": ["Rec 1", "Rec 2"]
    #     }}
    #     """

    #     response = self.llm.generate(system_prompt, user_prompt, temperature=0.2)
    #     return self._parse_json(response)


    def _parse_json(self, text):
        try:
            match = re.search(r'(\{.*\})', text, re.DOTALL)
            if match: return json.loads(match.group(0))
            return json.loads(text)
        except:
            return {"matching_skills": [], "missing_skills": [], "recommendations": []}

    def analyze(self, resume: Resume, job_description: str) -> Dict[str, List[str]]:
        """
        Analyzes the resume against the job description to identify skills gaps.
        
        Returns:
            Dictionary with 'missing_skills', 'matching_skills', and 'recommendations'
        """
        if not job_description:
            return {
                "missing_skills": [],
                "matching_skills": [],
                "recommendations": []
            }
        
        # Extract current skills from resume
        current_skills = self._extract_resume_skills(resume)
        
        # Extract required skills from JD
        required_skills = self._extract_jd_skills(job_description)
        
        # Normalize skills for comparison (lowercase, remove spaces/dots)
        def normalize(skill):
            return skill.lower().replace(" ", "").replace(".", "").replace("-", "")
        
        # Semantic skill relationships (if you have X, you also have Y)
        skill_relationships = {
            "sql": ["mysql", "postgresql", "nosql", "mongodb"],  # Having any SQL DB implies SQL knowledge
            "restapi": ["nodejs", "python", "java"],  # Backend languages imply REST API knowledge
            "restapis": ["nodejs", "python", "java"],
            "git": ["github", "gitlab"],  # Version control platforms imply Git
            "react": ["reactjs"],  # React variants
            "reactjs": ["react"],
            "nodejs": ["node"],  # Node.js variants
            "node": ["nodejs"],
        }
        
        current_normalized = {normalize(s): s for s in current_skills}
        
        # Compare and identify gaps
        missing_skills = []
        matching_skills = []
        
        for req_skill in required_skills:
            req_normalized = normalize(req_skill)
            
            # Direct match
            if req_normalized in current_normalized:
                matching_skills.append(req_skill)
            # Semantic match (check if user has a related skill)
            elif req_normalized in skill_relationships:
                # Check if user has any of the related skills
                has_related = any(rel in current_normalized for rel in skill_relationships[req_normalized])
                if has_related:
                    matching_skills.append(req_skill)
                else:
                    missing_skills.append(req_skill)
            else:
                missing_skills.append(req_skill)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(missing_skills, resume)
        
        return {
            "missing_skills": missing_skills,
            "matching_skills": matching_skills,
            "recommendations": recommendations
        }

    def _extract_resume_skills(self, resume: Resume) -> List[str]:
        """Extract all skills mentioned in the resume."""
        skills = []
        
        # From skills section
        for skill_cat in resume.skills:
            skills.extend(skill_cat.skills)
        
        # From technologies in projects
        for proj in resume.projects:
            skills.extend(proj.technologies)
        
        # Normalize to lowercase for comparison
        skills = [s.strip() for s in skills if s.strip()]
        
        return list(set(skills))  # Remove duplicates

    def _extract_jd_skills(self, job_description: str) -> List[str]:
        """Use LLM to extract required skills from job description."""
        
        # If JD is very short (like just a job title), expand it first
        if len(job_description.split()) < 10:
            system_prompt = """You are a technical recruiter. Given a job title, list the typical technical skills required.

Return ONLY a JSON array of skills. Example:
["Python", "Django", "PostgreSQL", "Docker", "AWS"]"""
            
            user_prompt = f"""Job Title: {job_description}

List typical technical skills required for this role.
Return ONLY the JSON array."""
        else:
            system_prompt = """You are a technical recruiter analyzing job descriptions.
Extract ALL technical skills, tools, frameworks, and technologies mentioned.

Return ONLY a JSON array of skills, nothing else. Example:
["Python", "Docker", "AWS", "React", "SQL"]"""

            user_prompt = f"""Extract all technical skills from this job description:

{job_description}

Return ONLY the JSON array of skills."""

        try:
            response = self.llm.generate(system_prompt, user_prompt, temperature=0.1)
            # Try to parse JSON from response
            response = response.strip()
            if response.startswith("```"):
                # Remove code blocks if present
                response = response.split("```")[1]
                if response.startswith("json"):
                    response = response[4:]
            skills = json.loads(response.strip())
            return skills if isinstance(skills, list) else []
        except Exception as e:
            print(f"Warning: Could not parse skills from JD: {e}")
            # Fallback: extract common backend skills if JD mentions "backend"
            if "backend" in job_description.lower() or "back-end" in job_description.lower():
                return ["Python", "Java", "Node.js", "SQL", "REST API", "Docker", "Git"]
            return []

    def _generate_recommendations(self, missing_skills: List[str], resume: Resume) -> List[str]:
        """Generate actionable recommendations for adding missing skills."""
        if not missing_skills:
            return ["Your resume covers all key skills from the job description!"]
        
        recommendations = []
        
        # Categorize by importance (first 5 are usually most important)
        critical_skills = missing_skills[:5]
        other_skills = missing_skills[5:]
        
        if critical_skills:
            recommendations.append(f"Critical missing skills: {', '.join(critical_skills)}")
            recommendations.append("Consider adding these to your Skills section if you have experience with them")
        
        if other_skills:
            recommendations.append(f"Additional skills to consider: {', '.join(other_skills)}")
        
        # Check if user has projects where they could mention these skills
        if resume.projects and missing_skills:
            recommendations.append("If you've used any of these in your projects, mention them in the project descriptions")
        
        return recommendations

    def display_analysis(self, analysis: Dict[str, List[str]]):
        """Display the skills gap analysis in a user-friendly format."""
        print("\n" + "="*60)
        print("SKILLS GAP ANALYSIS")
        print("="*60)
        
        if analysis["matching_skills"]:
            print(f"\n✓ Matching Skills ({len(analysis['matching_skills'])}):")
            for skill in analysis["matching_skills"][:10]:  # Show first 10
                print(f"  • {skill}")
            if len(analysis["matching_skills"]) > 10:
                print(f"  ... and {len(analysis['matching_skills']) - 10} more")
        
        if analysis["missing_skills"]:
            print(f"\n✗ Missing Skills ({len(analysis['missing_skills'])}):")
            for skill in analysis["missing_skills"]:
                print(f"  • {skill}")
        else:
            print("\n✓ No missing skills detected!")
        
        if analysis["recommendations"]:
            print("\n💡 Recommendations:")
            for i, rec in enumerate(analysis["recommendations"], 1):
                print(f"  {i}. {rec}")
        
        print("="*60 + "\n")

    def export_to_file(self, analysis: Dict[str, List[str]], filepath: str = "output/skills_analysis.txt"):
        """Export the skills gap analysis to a text file."""
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            f.write("="*60 + "\n")
            f.write("SKILLS GAP ANALYSIS\n")
            f.write("="*60 + "\n\n")
            
            if analysis["matching_skills"]:
                f.write(f"✓ Matching Skills ({len(analysis['matching_skills'])}):\n")
                for skill in analysis["matching_skills"]:
                    f.write(f"  • {skill}\n")
                f.write("\n")
            
            if analysis["missing_skills"]:
                f.write(f"✗ Missing Skills ({len(analysis['missing_skills'])}):\n")
                for skill in analysis["missing_skills"]:
                    f.write(f"  • {skill}\n")
                f.write("\n")
            else:
                f.write("✓ No missing skills detected!\n\n")
            
            if analysis["recommendations"]:
                f.write("💡 Recommendations:\n")
                for i, rec in enumerate(analysis["recommendations"], 1):
                    f.write(f"  {i}. {rec}\n")
                f.write("\n")
            
            f.write("="*60 + "\n")
        
        print(f"Skills analysis exported to: {filepath}")
