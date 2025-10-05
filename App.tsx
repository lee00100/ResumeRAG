import React, { useMemo, useState } from 'react';
import { useResumeRAG } from './hooks/useResumeRAG';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import SmartProfile from './components/SmartProfile';
import ExtractionLog from './components/ExtractionLog';
import { Icons } from './components/Icons';
import { Job, Skill, FilterOptions } from './types';
import ProfileModal from './components/ProfileModal';

// JobCard component defined within App.tsx to avoid creating new files.
interface JobCardProps {
  job: Job;
  matchedSkills: string[];
  userSkills: Skill[];
  isSaved: boolean;
  onSaveToggle: (jobId: string) => void;
}
const JobCard: React.FC<JobCardProps> = ({ job, matchedSkills, userSkills, isSaved, onSaveToggle }) => {
  const getScoreInfo = (score: number) => {
    if (score > 85) return { label: 'Great Match', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' };
    if (score > 60) return { label: 'Good Match', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700' };
    if (score > 40) return { label: 'Fair Match', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' };
    return { label: 'Possible Match', className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600' };
  };
  
  const formatSalary = (min: number, max: number) => {
    const format = (num: number) => `${Math.round(num / 1000)}k`;
    return `$${format(min)} - $${format(max)}`;
  };

  const highlightSkillsInText = (text: string, skills: Skill[]) => {
    if (!skills || skills.length === 0) {
      return text;
    }

    const skillContextMap = new Map<string, string>();
    skills.forEach(skill => {
        skillContextMap.set(skill.name.toLowerCase(), skill.context);
    });

    const skillNames = skills.map(s => s.name);
    const escapedSkills = skillNames.map(skill => skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedSkills.length === 0) return text;
    
    const pattern = `\\b(${escapedSkills.join('|')})\\b`;
    const regex = new RegExp(pattern, 'gi');

    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const lowerPart = part.toLowerCase();
      if (skillContextMap.has(lowerPart)) {
        const context = skillContextMap.get(lowerPart) || '';
        const truncatedContext = context.length > 180 ? `${context.substring(0, 180)}...` : context;
        return (
          <span key={index} className="relative group">
            <mark className="bg-primary-light/70 text-primary-dark font-semibold rounded px-1 cursor-help dark:bg-primary-dark/50 dark:text-primary-light">
              {part}
            </mark>
            <span 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-sm p-3 text-xs text-white bg-secondary-dark rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
              role="tooltip"
            >
              <span className="font-bold block text-gray-300">From your resume:</span>
              <blockquote className="mt-1 italic border-l-2 border-gray-500 pl-2">"{truncatedContext}"</blockquote>
              <svg className="absolute text-secondary-dark h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                  <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
              </svg>
            </span>
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  
  const scoreInfo = getScoreInfo(job.relevanceScore);

  return (
    <div className={`relative bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border hover:shadow-lg hover:border-primary-light dark:hover:border-primary-dark transition-all duration-300 flex flex-col ${job.isNew ? 'border-primary dark:border-primary' : 'border-gray-200 dark:border-gray-700'}`}>
        <button 
            onClick={() => onSaveToggle(job.id)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
        >
            <Icons.Bookmark className={`h-6 w-6 transition-colors ${isSaved ? 'text-primary fill-primary-light/50 dark:fill-primary-dark/50' : 'text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-light'}`} />
        </button>
       {job.isNew && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full shadow-lg">
                NEW
            </span>
        </div>
      )}
      <div className="flex-grow">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-3 sm:gap-y-1 mb-3">
            <h3 className="text-lg font-bold text-secondary-dark dark:text-gray-100">{job.title}</h3>
            <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${scoreInfo.className}`}>
              <Icons.Sparkles className="h-4 w-4" />
              <span>{scoreInfo.label} &middot; {Math.round(job.relevanceScore)}%</span>
            </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-secondary dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Icons.Company className="h-4 w-4" />
            {job.company}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.Location className="h-4 w-4" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.Dollar className="h-4 w-4" />
            {formatSalary(job.minSalary, job.maxSalary)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.Briefcase className="h-4 w-4" />
            {job.employmentType}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.Calendar className="h-4 w-4" />
            {job.postedDate}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 my-4 text-sm leading-relaxed">
            {highlightSkillsInText(job.description, userSkills)}
        </p>
        
        {matchedSkills.length > 0 && (
          <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Matches Your Skills:</h4>
              <div className="flex flex-wrap gap-2">
                  {matchedSkills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 text-xs font-semibold text-primary-dark bg-primary-light dark:bg-primary-dark/50 dark:text-primary-light rounded-full">{skill}</span>
                  ))}
              </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-right">
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
            View Job
        </a>
      </div>
    </div>
  );
};

interface JobFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onResetFilters: () => void;
  availableLocations: string[];
  availableTypes: string[];
}

const JobFilters: React.FC<JobFiltersProps> = ({ filters, onFilterChange, onResetFilters, availableLocations, availableTypes }) => {
  const commonSelectClasses = "w-full p-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm";
  const commonInputClasses = "w-full p-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm";
  const commonButtonClasses = "w-full px-4 py-2 text-sm font-semibold rounded-lg transition-colors border";

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
          <select id="location-filter" name="location" value={filters.location} onChange={e => onFilterChange({ location: e.target.value })} className={commonSelectClasses}>
            <option value="all">All Locations</option>
            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
          <select id="type-filter" name="employmentType" value={filters.employmentType} onChange={e => onFilterChange({ employmentType: e.target.value })} className={commonSelectClasses}>
            <option value="all">All Types</option>
            {availableTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Posted</label>
          <select id="date-filter" name="datePosted" value={filters.datePosted} onChange={e => onFilterChange({ datePosted: e.target.value })} className={commonSelectClasses}>
            <option value="all">Any Time</option>
            <option value="past-week">Past Week</option>
            <option value="past-month">Past Month</option>
          </select>
        </div>
        <div>
          <label htmlFor="experience-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience</label>
          <select id="experience-filter" name="experience" value={filters.experience} onChange={e => onFilterChange({ experience: e.target.value })} className={commonSelectClasses}>
            <option value="all">Any Experience</option>
            <option value="0-2">Entry-Level (0-2 years)</option>
            <option value="3-5">Mid-Level (3-5 years)</option>
            <option value="5+">Senior-Level (5+ years)</option>
          </select>
        </div>
        <div>
           <label htmlFor="min-salary-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary ($k)</label>
           <input
            id="min-salary-filter"
            name="minSalary"
            type="number"
            placeholder="e.g., 80"
            value={filters.minSalary}
            onChange={e => onFilterChange({ minSalary: e.target.valueAsNumber || '' })}
            className={commonInputClasses}
          />
        </div>
        <div>
           <label htmlFor="max-salary-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary ($k)</label>
           <input
            id="max-salary-filter"
            name="maxSalary"
            type="number"
            placeholder="e.g., 150"
            value={filters.maxSalary}
            onChange={e => onFilterChange({ maxSalary: e.target.valueAsNumber || '' })}
            className={commonInputClasses}
          />
        </div>
        <div>
          <button onClick={onResetFilters} className={`${commonButtonClasses} bg-white dark:bg-gray-700 text-secondary-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600`}>Reset</button>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const { state, processResume, updateFilters, resetFilters, resetSession, toggleSaveJob, generateSmartProfile } = useResumeRAG();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const {
    logEntries,
    isProcessing,
    queryError,
    jobs,
    allJobs,
    filters,
    analysis,
    savedJobIds,
    smartProfile,
    isGeneratingProfile,
    profileError,
    resumeText,
  } = state;

  const getMatchedSkills = (jobSkills: string[]): string[] => {
      if (!analysis) return [];
      const userSkills = new Set(analysis.skills.map(s => s.name.toLowerCase()));
      return jobSkills.filter(skill => userSkills.has(skill.toLowerCase()));
  }

  const availableLocations = useMemo(() => [...new Set(allJobs.map(j => j.location))], [allJobs]);
  const availableTypes = useMemo(() => [...new Set(allJobs.map(j => j.employmentType as string))], [allJobs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <Header onProfileClick={() => setIsProfileModalOpen(true)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            <UploadZone
              onProcessResume={processResume}
              isProcessing={isProcessing}
              hasAnalysis={!!analysis}
            />
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold text-secondary-dark dark:text-gray-100">Job Matches</h2>
                    {jobs.length > 0 && <span className="font-medium text-gray-500 dark:text-gray-400">{jobs.length} of {allJobs.length} shown</span>}
                  </div>
                   <div className="flex items-center gap-2">
                    <button 
                        onClick={() => updateFilters({ showSavedOnly: !filters.showSavedOnly })}
                        className={`p-2 rounded-full transition-colors ${filters.showSavedOnly ? 'bg-primary-light text-primary-dark dark:bg-primary-dark/50 dark:text-primary-light' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                        aria-label={filters.showSavedOnly ? 'Show all jobs' : 'Show saved jobs'}
                     >
                        <Icons.Bookmark className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={resetSession}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border bg-white dark:bg-gray-700 text-secondary-dark dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icons.ArrowPath className="h-4 w-4" />
                        <span>New Search</span>
                    </button>
                </div>
              </div>

               {queryError && (
                 <div className="my-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
                   <p className="font-bold">An Error Occurred</p>
                   <p>{queryError}</p>
                 </div>
               )}

              {(analysis || isProcessing) && (
                <>
                  <JobFilters 
                    filters={filters} 
                    onFilterChange={updateFilters} 
                    onResetFilters={resetFilters}
                    availableLocations={availableLocations}
                    availableTypes={availableTypes}
                  />
                  <div className="space-y-6">
                    {isProcessing && jobs.length === 0 && (
                      <div className="text-center py-10">
                        <Icons.Spinner className="h-10 w-10 text-primary mx-auto animate-spin mb-4" />
                        <p className="text-lg font-semibold text-secondary-dark dark:text-gray-200">Finding the best matches for you...</p>
                        <p className="text-secondary dark:text-gray-400">This may take a moment.</p>
                      </div>
                    )}
                    
                    {jobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        matchedSkills={getMatchedSkills(job.required_skills)}
                        userSkills={analysis?.skills || []}
                        isSaved={savedJobIds.has(job.id)}
                        onSaveToggle={toggleSaveJob}
                      />
                    ))}
                    
                    {!isProcessing && jobs.length === 0 && resumeText && (
                        <div className="text-center py-10">
                            <Icons.Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="font-semibold text-secondary-dark dark:text-gray-200">No jobs match your current filters.</p>
                            <p className="text-secondary dark:text-gray-400">Try adjusting or resetting the filters above.</p>
                        </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Right Column */}
          <aside className="lg:col-span-2 space-y-8">
            <SmartProfile 
              analysis={analysis}
              smartProfile={smartProfile}
              isGenerating={isGeneratingProfile}
              error={profileError}
              onGenerate={generateSmartProfile}
            />
            <ExtractionLog logEntries={logEntries} />
          </aside>
        </div>
      </main>
    </div>
  );
}