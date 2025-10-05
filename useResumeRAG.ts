import { useState, useEffect, useCallback } from 'react';
import {
  LogEntry,
  Job,
  ResumeAnalysis,
  FilterOptions,
  SmartProfile,
} from '../types';
import * as gemini from '../services/gemini';
import { MOCK_JOBS } from '../mockData';
import { useAuth } from './useAuth';
import { api } from '../services/api';

interface RagState {
  resumeText: string;
  logEntries: LogEntry[];
  isProcessing: boolean;
  queryError: string | null;
  jobs: Job[];
  allJobs: Job[];
  filters: FilterOptions;
  analysis: ResumeAnalysis | null;
  savedJobIds: Set<string>;
  smartProfile: SmartProfile | null;
  isGeneratingProfile: boolean;
  profileError: string | null;
}

const initialFilters: FilterOptions = {
    location: 'all',
    employmentType: 'all',
    datePosted: 'all',
    experience: 'all',
    minSalary: '',
    maxSalary: '',
    showSavedOnly: false,
};

const initialState: RagState = {
  resumeText: '',
  logEntries: [],
  isProcessing: false,
  queryError: null,
  jobs: [],
  allJobs: [],
  filters: initialFilters,
  analysis: null,
  savedJobIds: new Set(),
  smartProfile: null,
  isGeneratingProfile: false,
  profileError: null,
};

export const useResumeRAG = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RagState>(initialState);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      logEntries: [
        ...prev.logEntries,
        { ...entry, timestamp: new Date().toLocaleTimeString() },
      ],
    }));
  }, []);
  
  const resetSession = useCallback(() => {
    // Keep saved jobs, reset everything else
    const { savedJobIds } = state;
    setState({ ...initialState, savedJobIds });
  }, [state]);

  const applyFilters = useCallback((jobsToFilter: Job[], currentFilters: FilterOptions, savedJobIds: Set<string>) => {
    const getDateInDays = (postedDate: string): number => {
      const lowerDate = postedDate.toLowerCase();
      if (lowerDate === 'just now' || lowerDate.includes('today')) return 0;
      
      const num = parseInt(lowerDate);
      if (isNaN(num)) return Infinity;

      if (lowerDate.includes('day')) return num;
      if (lowerDate.includes('week')) return num * 7;
      if (lowerDate.includes('month')) return num * 30;
      return Infinity;
    }

    let results = jobsToFilter;

    if (currentFilters.showSavedOnly) {
      results = results.filter(job => savedJobIds.has(job.id));
    }

    return results.filter(job => {
        const locationMatch = currentFilters.location === 'all' || job.location === currentFilters.location;
        const typeMatch = currentFilters.employmentType === 'all' || job.employmentType === currentFilters.employmentType;
        
        let dateMatch = true;
        if (currentFilters.datePosted !== 'all') {
            const daysAgo = getDateInDays(job.postedDate);
            if (currentFilters.datePosted === 'past-week') {
                dateMatch = daysAgo <= 7;
            } else if (currentFilters.datePosted === 'past-month') {
                dateMatch = daysAgo <= 30;
            }
        }

        let experienceMatch = true;
        if (currentFilters.experience !== 'all') {
            const minExp = job.minExperience;
            switch(currentFilters.experience) {
                case '0-2':
                    experienceMatch = minExp >= 0 && minExp <= 2;
                    break;
                case '3-5':
                    experienceMatch = minExp >= 3 && minExp <= 5;
                    break;
                case '5+':
                    experienceMatch = minExp >= 5;
                    break;
                default:
                    experienceMatch = true;
            }
        }
        
        const minSalaryFilter = parseInt(currentFilters.minSalary as string, 10);
        const maxSalaryFilter = parseInt(currentFilters.maxSalary as string, 10);

        let salaryMatch = true;
        if (!isNaN(minSalaryFilter)) {
            salaryMatch = salaryMatch && job.maxSalary >= minSalaryFilter * 1000;
        }
        if (!isNaN(maxSalaryFilter)) {
            salaryMatch = salaryMatch && job.minSalary <= maxSalaryFilter * 1000;
        }


        return locationMatch && typeMatch && dateMatch && experienceMatch && salaryMatch;
    });
  }, []);

  // Effect for loading persisted data (saved jobs) via the API
  useEffect(() => {
    if (user) {
        api.getSavedJobs(user.email).then(savedIds => {
            setState(prev => ({ ...prev, savedJobIds: new Set(savedIds) }));
        }).catch(error => {
            console.error("Failed to load saved jobs:", error);
        });
    } else {
        // Clear saved jobs on logout
        setState(prev => ({ ...prev, savedJobIds: new Set() }));
    }
  }, [user]);

  const processResume = useCallback(async (text: string) => {
    resetSession();
    setState(prev => ({
        ...initialState,
        savedJobIds: prev.savedJobIds,
        resumeText: text,
        isProcessing: true,
    }));

    try {
      addLogEntry({ label: 'Analysis', value: `Analyzing your resume...`, status: 'info' });
      const analysisResult = await gemini.analyzeResume(text);
      setState(prev => ({ ...prev, analysis: analysisResult }));
      addLogEntry({ label: 'Analysis', value: `Successfully extracted skills and summary.`, status: 'success' });
      
      addLogEntry({ label: 'Job Matching', value: `Searching for relevant jobs...`, status: 'info' });
      const matchedJobs = await gemini.matchJobs(analysisResult, MOCK_JOBS);
      
      const sortedJobs = matchedJobs.sort((a,b) => b.relevanceScore - a.relevanceScore);
      
      setState(prev => {
        const filteredJobs = applyFilters(sortedJobs, prev.filters, prev.savedJobIds);
        return { ...prev, allJobs: sortedJobs, jobs: filteredJobs };
      });
      addLogEntry({label: "SUMMARY", value: `Found ${matchedJobs.length} matching jobs.`, status: 'summary'});

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setState(prev => ({ ...prev, queryError: errorMessage, resumeText: '', isProcessing: false }));
      addLogEntry({ label: 'ERROR', value: errorMessage, status: 'error' });
    } finally {
        setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [addLogEntry, resetSession, applyFilters]);
  
  const toggleSaveJob = useCallback((jobId: string) => {
    if (!user) return;

    setState(prev => {
      const newSavedJobIds = new Set(prev.savedJobIds);
      if (newSavedJobIds.has(jobId)) {
        newSavedJobIds.delete(jobId);
      } else {
        newSavedJobIds.add(jobId);
      }

      // Persist the change via API
      api.updateSavedJobs(user.email, Array.from(newSavedJobIds)).catch(e => {
        console.error("Failed to save job change", e);
        // Here you could add logic to revert the UI change on failure
      });

      // Update UI state
      const updatedJobs = prev.filters.showSavedOnly ? applyFilters(prev.allJobs, prev.filters, newSavedJobIds) : prev.jobs;
      return { ...prev, savedJobIds: newSavedJobIds, jobs: updatedJobs };
    });
  }, [user, applyFilters]);
  
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters, ...newFilters };
      const filteredJobs = applyFilters(prev.allJobs, updatedFilters, prev.savedJobIds);
      return {
        ...prev,
        filters: updatedFilters,
        jobs: filteredJobs,
      };
    });
  }, [applyFilters]);

  const resetFilters = useCallback(() => {
    setState(prev => {
        const jobsToShow = applyFilters(prev.allJobs, initialFilters, prev.savedJobIds);
        return {
            ...prev,
            filters: initialFilters,
            jobs: jobsToShow,
        };
    });
  }, [applyFilters]);

  const generateSmartProfile = useCallback(async () => {
    if (!state.analysis) return;

    setState(prev => ({...prev, isGeneratingProfile: true, profileError: null }));
    addLogEntry({label: "Smart Profile", value: "Generating AI career advice...", status: 'info'});
    try {
        const profile = await gemini.generateSmartProfile(state.analysis);
        setState(prev => ({...prev, smartProfile: profile}));
        addLogEntry({label: "Smart Profile", value: "Successfully generated insights.", status: 'success'});
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setState(prev => ({...prev, profileError: errorMessage}));
        addLogEntry({label: "ERROR", value: errorMessage, status: 'error'});
    } finally {
        setState(prev => ({...prev, isGeneratingProfile: false}));
    }
  }, [state.analysis, addLogEntry]);

  return {
    state,
    processResume,
    updateFilters,
    resetFilters,
    resetSession,
    toggleSaveJob,
    generateSmartProfile,
  };
};
