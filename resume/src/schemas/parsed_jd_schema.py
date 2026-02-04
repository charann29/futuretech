from pydantic import BaseModel
from typing import List, Optional

class ParsedJobDescription(BaseModel):
    """
    Structured representation of a parsed job description.
    Contains only essential, ATS-relevant information with exact keywords.
    """
    primary_technical_skills: List[str] = []
    secondary_technical_skills: List[str] = []
    soft_skills: List[str] = []
    experience_requirements: List[str] = []
    educational_requirements: List[str] = []
    key_responsibilities: List[str] = []
    
    def to_compact_string(self) -> str:
        """Convert parsed JD to a compact string format for agent consumption."""
        parts = []
        
        if self.primary_technical_skills:
            parts.append(f"Primary Technical Skills: {', '.join(self.primary_technical_skills)}")
        
        if self.secondary_technical_skills:
            parts.append(f"Secondary Technical Skills: {', '.join(self.secondary_technical_skills)}")
        
        if self.soft_skills:
            parts.append(f"Soft Skills: {', '.join(self.soft_skills)}")
        
        if self.experience_requirements:
            parts.append(f"Experience: {'; '.join(self.experience_requirements)}")
        
        if self.educational_requirements:
            parts.append(f"Education: {'; '.join(self.educational_requirements)}")
        
        if self.key_responsibilities:
            parts.append(f"Key Responsibilities:\n" + "\n".join(f"- {r}" for r in self.key_responsibilities))
        
        return "\n\n".join(parts)
