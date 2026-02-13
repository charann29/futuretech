import sys
import os

# Add parent dir to path so we can allow imports from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.generators.resume_generator import ResumeGenerator
from src.schemas.resume_schema import Resume, PersonalInfo, EducationItem, ExperienceItem, SkillCategory

def test_generator():
    resume = Resume(
        personal_info=PersonalInfo(
            name="Test User",
            email="test@example.com",
            phone="123-456-7890"
        ),
        education=[
            EducationItem(
                institution="Test University",
                degree="B.S. Testing",
                start_date="2020",
                end_date="2024"
            )
        ],
        experience=[
            ExperienceItem(
                company="Test Co",
                role="Tester",
                start_date="2024",
                end_date="Present",
                details=["Tested things.", "Found bugs."]
            )
        ],
        skills=[
            SkillCategory(category="Core", skills=["Testing", "Automation"])
        ]
    )
    
    gen = ResumeGenerator("output")
    tex = gen.generate_tex(resume, "test_resume")
    print(f"Generated: {tex}")
    pdf = gen.generate_pdf(tex)
    print(f"PDF: {pdf}")

if __name__ == "__main__":
    test_generator()
