import json
from src.schemas.intake_schema import IntakeOutput
from src.utils.llm_client import LLMClient

class IntakeAgent:
    def __init__(self, llm: LLMClient, system_prompt: str):
        self.llm = llm
        self.system_prompt = system_prompt

    def collect_resume_data(self) -> str:
        """
        Interactive loop to collect resume details from CLI.
        Returns the path to the saved profile.
        """
        from src.utils.intake_utils import get_input, get_list_input
        from src.schemas.resume_schema import Resume, PersonalInfo, EducationItem, ExperienceItem, SkillCategory, ProjectItem
        
        print("\n=== RESUME INTAKE QUESTIONNAIRE ===")
        
        # 1. Personal Info
        print("\n--- Personal Information ---")
        p_info = PersonalInfo(
            name=get_input("Full Name"),
            email=get_input("Email"),
            phone=get_input("Phone", required=False),
            location=get_input("Location (City, State)", required=False),
            linkedin=get_input("LinkedIn URL", required=False),
            github=get_input("GitHub URL", required=False),
            website=get_input("Portfolio/Website", required=False)
        )

        # 2. Education
        education = get_list_input("Education", {
            "institution": {"required": True},
            "degree": {"required": True},
            "start_date": {"required": True},
            "end_date": {"required": True},
            "gpa": {"required": False},
            "details": {"required": False, "as_list": True}
        })

        # 3. Experience
        experience = get_list_input("Experience", {
            "company": {"required": True},
            "role": {"required": True},
            "start_date": {"required": True},
            "end_date": {"required": True},
            "location": {"required": False},
            "details": {"required": True, "as_list": True}
        })

        # 4. Projects
        projects = get_list_input("Project", {
            "name": {"required": True},
            "technologies": {"required": True, "as_list": True},
            "details": {"required": True, "as_list": True},
            "link": {"required": False}
        })

        # 5. Skills
        skills = get_list_input("Skill Category", {
            "category": {"required": True},
            "skills": {"required": True, "as_list": True}
        })

        # 6. Certifications
        certifications = get_list_input("Certification", {
            "name": {"required": True},
            "issuer": {"required": True},
            "date": {"required": True},
            "link": {"required": False},
            "details": {"required": False, "as_list": True}
        })

        # 7. Languages
        languages = get_input("Languages Known (comma separated)", required=False)
        languages_list = [l.strip() for l in languages.split(",")] if languages else []

        jd = get_input("Target Job Description (to automate enhancement)", required=False)
        summary = get_input("Brief Professional Summary", required=False)

        resume = Resume(
            personal_info=p_info,
            education=education,
            experience=experience,
            projects=projects,
            skills=skills,
            certifications=certifications,
            languages=languages_list,
            job_description=jd,
            summary=summary
        )

        return resume

    def save_profile(self, resume, path="data/profile.json"):
        import os
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(resume.model_dump_json(indent=2))
        print(f"Profile saved to {path}")

    def load_profile(self, path="data/profile.json"):
        from src.schemas.resume_schema import Resume
        with open(path, "r") as f:
            data = json.load(f)
            return Resume(**data)

