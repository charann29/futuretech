from pydantic import BaseModel
from typing import List, Optional

class PersonalInfo(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

class EducationItem(BaseModel):
    institution: str
    degree: str
    start_date: str
    end_date: str
    location: Optional[str] = None
    gpa: Optional[str] = None
    details: List[str] = []

class ExperienceItem(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: str  # "Present" for current
    location: Optional[str] = None
    details: List[str] = []

class ProjectItem(BaseModel):
    name: str
    technologies: List[str] = []
    link: Optional[str] = None
    details: List[str] = []

class SkillCategory(BaseModel):
    category: str
    skills: List[str]

class CertificationItem(BaseModel):
    name: str
    issuer: str
    date: str
    link: Optional[str] = None
    details: List[str] = []

class CustomItem(BaseModel):
    name: str # e.g. "Employee of the Month"
    organizer: Optional[str] = None # e.g. "Google", "IEEE"
    date: Optional[str] = None
    link: Optional[str] = None
    details: List[str] = []

class CustomSection(BaseModel):
    title: str # e.g. "Awards & Achievements"
    items: List[CustomItem] = []

class Resume(BaseModel):
    personal_info: PersonalInfo
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    skills: List[SkillCategory] = []
    certifications: List[CertificationItem] = []
    languages: List[str] = []
    custom_sections: List[CustomSection] = []
    job_description: Optional[str] = None
    summary: Optional[str] = None
