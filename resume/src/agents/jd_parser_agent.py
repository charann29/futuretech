import json
from src.utils.llm_client import LLMClient
from src.schemas.parsed_jd_schema import ParsedJobDescription

class JDParserAgent:
    """
    Job Description Parser Agent
    
    Cleans and structures raw job descriptions by:
    1. De-noising: Removing company history, mission statements, disclaimers
    2. Extracting: Identifying essential requirements using exact keywords
    3. Categorizing: Organizing into structured format for ATS compatibility
    
    This reduces token consumption by 60-80% while maintaining all essential information.
    """
    
    def __init__(self, llm: LLMClient):
        self.llm = llm
        self.system_prompt = """You are an expert ATS (Applicant Tracking System) analyst specializing in job description parsing.

Your task: Extract ONLY the essential, ATS-relevant information from job descriptions.

CRITICAL RULES:
1. DE-NOISE: Remove ALL of the following:
   - Company history, founding stories, "About Us" sections
   - Mission statements, vision statements, company values
   - Equal Opportunity Employer disclaimers
   - Benefits, perks, office culture descriptions
   - Application instructions, "How to Apply" sections
   - Any marketing or promotional content

2. EXTRACT EXACT KEYWORDS: Use the EXACT words from the job description
   - Do NOT paraphrase or summarize
   - Do NOT use synonyms
   - Preserve technical terms, acronyms, and version numbers (e.g., "Java 11", "AWS Lambda")

3. CATEGORIZE PRECISELY:
   - Primary Technical Skills: Core technologies/languages required (e.g., Java, Python, React)
   - Secondary Technical Skills: Tools, platforms, databases (e.g., Git, Docker, MySQL, AWS)
   - Soft Skills: Non-technical abilities (e.g., Leadership, Communication, Problem Solving)
   - Experience Requirements: Years of experience, specific experience types
   - Educational Requirements: Degrees, certifications, educational background
   - Key Responsibilities: Top 5-7 action-oriented tasks (start with verbs)

4. MAINTAIN ATS COMPATIBILITY:
   - Keep exact keyword matches for ATS scanning
   - Preserve technical terminology as written
   - Include version numbers and specific tool names

Return ONLY a valid JSON object matching this schema:
{
    "primary_technical_skills": ["skill1", "skill2"],
    "secondary_technical_skills": ["tool1", "tool2"],
    "soft_skills": ["skill1", "skill2"],
    "experience_requirements": ["requirement1", "requirement2"],
    "educational_requirements": ["requirement1", "requirement2"],
    "key_responsibilities": ["responsibility1", "responsibility2"]
}"""

    def parse(self, raw_jd: str) -> ParsedJobDescription:
        """
        Parse a raw job description into structured format.
        
        Args:
            raw_jd: Raw job description text (may contain junk)
            
        Returns:
            ParsedJobDescription with clean, structured data
        """
        if not raw_jd or not raw_jd.strip():
            return ParsedJobDescription()
        
        user_prompt = f"""Parse this job description and extract essential information:

{raw_jd}

Remove all company history, mission statements, and disclaimers.
Extract EXACT keywords and categorize them.
Return ONLY the JSON object."""

        try:
            response = self.llm.generate(
                self.system_prompt, 
                user_prompt, 
                temperature=0.1  # Low temperature for consistent extraction
            )
            
            # Clean up response - remove markdown code blocks if present
            response = response.strip()
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1])  # Remove first and last lines
                if response.startswith("json"):
                    response = response[4:].strip()
            
            # Parse JSON
            parsed_data = json.loads(response)
            parsed_jd = ParsedJobDescription(**parsed_data)
            
            # Log token savings
            original_tokens = len(raw_jd.split())
            parsed_tokens = len(parsed_jd.to_compact_string().split())
            reduction_pct = ((original_tokens - parsed_tokens) / original_tokens * 100) if original_tokens > 0 else 0
            
            print(f"\n📊 JD Parsing Stats:")
            print(f"   Original: ~{original_tokens} tokens")
            print(f"   Parsed: ~{parsed_tokens} tokens")
            print(f"   Reduction: {reduction_pct:.1f}%\n")
            
            return parsed_jd
            
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse JD response as JSON: {e}")
            print("Returning empty ParsedJobDescription")
            return ParsedJobDescription()
        except Exception as e:
            print(f"Error parsing job description: {e}")
            print("Returning empty ParsedJobDescription")
            return ParsedJobDescription()
    
    def parse_to_string(self, raw_jd: str) -> str:
        """
        Parse JD and return as a compact string format.
        Useful for agents that expect string input.
        """
        parsed_jd = self.parse(raw_jd)
        return parsed_jd.to_compact_string()
