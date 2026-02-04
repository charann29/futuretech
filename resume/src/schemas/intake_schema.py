from pydantic import BaseModel
from typing import Optional, Dict

class IntakeOutput(BaseModel):
    task: str  
    # resume_creation | resume_optimization | resume_review

    target_role: Optional[str]
    experience_level: Optional[str]
    # intern | junior | mid | senior

    constraints: Dict[str, object]
    inputs_present: Dict[str, bool]
