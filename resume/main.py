import os
import json
from config import GROQ_API_KEY
from src.utils.llm_client import LLMClient
from src.agents.intake_agent import IntakeAgent
from src.agents.enhancer_agent import EnhancerAgent
from src.generators.resume_generator import ResumeGenerator
from src.schemas.resume_schema import Resume, PersonalInfo, EducationItem, ExperienceItem, SkillCategory, ProjectItem

def get_dummy_resume():
    return Resume(
        personal_info=PersonalInfo(
            name="John Doe",
            email="john@example.com",
            location="San Francisco, CA",
            linkedin="linkedin.com/in/johndoe",
            github="github.com/johndoe"
        ),
        education=[
            EducationItem(
                institution="University of Technology",
                degree="B.S. Computer Science",
                start_date="2018",
                end_date="2022",
                gpa="3.8"
            )
        ],
        experience=[
            ExperienceItem(
                company="Tech Corp",
                role="Software Engineer",
                start_date="2022",
                end_date="Present",
                location="SF",
                details=[
                    "Developed scalable APIs using Python and FastAPI.",
                    "Optimized database queries reducing latency by 30%."
                ]
            )
        ],
        skills=[
            SkillCategory(category="Languages", skills=["Python", "Go", "JavaScript"]),
            SkillCategory(category="Frameworks", skills=["React", "FastAPI"])
        ],
        projects=[
            ProjectItem(
                name="Resume Builder",
                technologies=["Python", "AI"],
                details=["Built an automated resume generator using LLMs."]
            )
        ]
    )

def main():
    # 1. Setup (API key now comes from config.py)
    llm = LLMClient(model_name="llama-3.3-70b-versatile")
    intake_agent = IntakeAgent(llm, system_prompt="You are an Intake Agent.")
    profile_path = "data/profile.json"

    # 2. Intake Phase (JSON-First)
    print("--- 1. INTAKE ---")
    if os.path.exists(profile_path):
        print(f"Loading data from {profile_path}...")
        try:
            resume = intake_agent.load_profile(profile_path)
            print("Data loaded successfully.")
        except Exception as e:
            print(f"Error parsing {profile_path}: {e}")
            return
    else:
        print(f"Profile not found at {profile_path}.")
        setup_now = input("Would you like to run the interactive questionnaire to create one? (y/n): ").strip().lower()
        if setup_now == 'y':
            resume = intake_agent.collect_resume_data()
            intake_agent.save_profile(resume, profile_path)
        else:
            print("Please create data/profile.json manually. Refer to the schema in src/schemas/resume_schema.py.")
            return

    # 2. Expansion Phase (Fill sparse content)
    print("\n--- 2. EXPANSION ---")
    from src.agents.expander_agent import ExpanderAgent
    
    # Check if resume needs expansion
    needs_expansion = False
    for exp in resume.experience:
        if not exp.details or len(exp.details) < 2:
            needs_expansion = True
            break
    
    if not needs_expansion:
        for proj in resume.projects:
            if proj.name and (not proj.details or len(proj.details) < 2):
                needs_expansion = True
                break
    
    if needs_expansion:
        print("Sparse content detected. Auto-expanding with AI...")
        expander = ExpanderAgent(llm)
        resume = expander.expand(resume)
        print("Content expansion complete!")
    else:
        print("Resume has sufficient detail. Skipping expansion.")

    # 2.5. Skills Gap Analysis
    if resume.job_description:
        print("\n--- 2.5. JD PARSING & SKILLS ANALYSIS ---")
        from src.agents.jd_parser_agent import JDParserAgent
        from src.agents.skills_analyzer import SkillsAnalyzer
        
        # Parse JD to reduce token consumption
        print("Parsing Job Description...")
        jd_parser = JDParserAgent(llm)
        parsed_jd_text = jd_parser.parse_to_string(resume.job_description)
        
        analyzer = SkillsAnalyzer(llm)
        analysis = analyzer.analyze(resume, parsed_jd_text)
        analyzer.display_analysis(analysis)
        analyzer.export_to_file(analysis)  # Export to file
        
        if analysis["missing_skills"]:
            print("Tip: Consider adding missing skills to your resume if you have experience with them.")
            print("The enhancement phase will help incorporate JD keywords into your existing content.\n")
    
    # 2.6. Skills Categorization
    print("\n--- 2.6. SKILLS CATEGORIZATION ---")
    from src.agents.skills_categorizer import SkillsCategorizer
    
    categorizer = SkillsCategorizer(llm)
    resume = categorizer.categorize(resume)
    print("Skills categorized successfully!")

    # 3. Enhancement Phase
    print("\n--- 3. ENHANCEMENT ---")
    
    # Prioritize JD from JSON if it exists
    jd = resume.job_description
    if not jd:
        jd = input("\nEnter content of Job Description (or press Enter to skip enhancement): ").strip()
    else:
        print(f"Using Job Description from profile.json: {jd[:100]}...")

    if jd:
        print("Parsing and tailoring resume to JD...")
        from src.agents.jd_parser_agent import JDParserAgent
        
        # Parse JD to reduce token consumption
        jd_parser = JDParserAgent(llm)
        parsed_jd_text = jd_parser.parse_to_string(jd)
        
        enhancer = EnhancerAgent(llm)
        resume = enhancer.enhance(resume, parsed_jd_text)
        print("Resume enhanced!")
    else:
        print("Skipping enhancement.")

    # 4. Generation Phase
    print("\n--- 4. GENERATION ---")
    generator = ResumeGenerator()
    tex_path = generator.generate_tex(resume, filename="my_resume")
    print(f"Generated TeX: {tex_path}")
    
    pdf_path = generator.generate_pdf(tex_path)
    if pdf_path:
        print(f"Generated PDF: {pdf_path}")
    else:
        print("PDF generation failed (likely missing pdflatex).")


if __name__ == "__main__":
    main()
