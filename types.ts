// User type for authentication, now with name
export interface User {
  id: string;
  email: string;
  name?: string;
}

// Type for user-specific settings
export interface UserSettings {
  theme: 'light' | 'dark';
  jobAlerts: boolean;
}

export interface Skill {
  name: string;
  context: string;
}

export interface ResumeAnalysis {
  summary: string;
  skills: Skill[];
  experience_years: number;
}

export interface Job {
  id:string;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string[];
  url: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  postedDate: string;
  relevanceScore: number;
  minExperience: number;
  minSalary: number;
  maxSalary: number;
  isNew?: boolean;
}

export interface LogEntry {
  timestamp: string;
  label: string;
  value: string;
  status: 'info' | 'success' | 'warning' | 'error' | 'summary';
}

export interface FilterOptions {
  location: string;
  employmentType: string;
  datePosted: string;
  experience: string;
  minSalary: string | number;
  maxSalary: string | number;
  showSavedOnly: boolean;
}

// Types for the Smart Profile feature
export interface SuggestedSkill {
  name: string;
  reason: string;
}

export interface SmartProfile {
  enhanced_summary: string;
  suggested_skills: SuggestedSkill[];
  interview_talking_points: string[];
}