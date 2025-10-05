import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, Job, SmartProfile, Skill } from '../types';

const API_KEY = "AIzaSyA9AC80BHeszhpVW5tcJlctwo3BjcsSgJ4";

// A world-class engineer would add a check like this for better developer experience.
if (!API_KEY) {
  // We can't proceed without an API key.
  // In a real production app, this might be handled by an auth flow or a server-side proxy.
  // For this local-first setup, we'll render a helpful error and stop execution.
  const errorContainer = document.getElementById('root');
  if (errorContainer) {
    // Style the container for the error message
    errorContainer.style.display = 'flex';
    errorContainer.style.alignItems = 'center';
    errorContainer.style.justifyContent = 'center';
    errorContainer.style.minHeight = '100vh';
    errorContainer.style.padding = '1rem';
    
    errorContainer.innerHTML = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 600px; padding: 2rem; text-align: center; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px;">
        <h1 style="color: #b91c1c; font-size: 1.5rem; font-weight: bold;">Configuration Error</h1>
        <p style="color: #374151; font-size: 1rem; margin-top: 1rem;">
          <strong>Gemini API Key is missing.</strong>
        </p>
        <p style="color: #4b5563; font-size: 0.9rem; margin-top: 0.5rem;">
          To run this application locally, you need to set your API key.
        </p>
        <code style="display: block; background-color: #f3f4f6; padding: 1rem; border-radius: 4px; margin-top: 1.5rem; text-align: left; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; border: 1px solid #e5e7eb;">
          // 1. Open the file: <strong>services/gemini.ts</strong><br><br>
          // 2. Find this line:<br>
          <span style="color: #6b7280;">const API_KEY = process.env.API_KEY;</span><br><br>
          // 3. Replace it with your key:<br>
          <span style="color: #1d4ed8;">const API_KEY = "YOUR_GEMINI_API_KEY";</span>
        </code>
        <p style="color: #6b7280; font-size: 0.8rem; margin-top: 1rem;">
          Note: Remember to not commit your API key to public version control like GitHub.
        </p>
      </div>
    `;
  }
  // Throw an error to stop further script execution.
  throw new Error("Gemini API Key is missing. Please configure it in services/gemini.ts for local development.");
}


const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to safely parse JSON from Gemini response
function parseJsonFromMarkdown(markdown: string): any {
  const match = markdown.match(/```(json)?\n?([\s\S]+?)\n?```/);
  const jsonString = match ? match[2] : markdown;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON:", jsonString);
    throw new Error("The model returned an invalid JSON response. Please try again.");
  }
}

/**
 * Analyzes resume text using Gemini to extract key information.
 * @param resumeText The user's resume content.
 * @returns A promise that resolves with the structured resume analysis.
 */
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A 2-3 sentence professional summary based on the resume.",
      },
      skills: {
        type: Type.ARRAY,
        description: "A list of key skills, technologies, and methodologies mentioned.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the skill." },
            context: { type: Type.STRING, description: "The sentence or phrase from the resume where this skill was mentioned." },
          },
          required: ["name", "context"],
        },
      },
      experience_years: {
        type: Type.NUMBER,
        description: "An estimation of the total years of professional experience, calculated from the dates provided."
      },
    },
    required: ["summary", "skills", "experience_years"],
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Analyze the following resume text and extract the required information.
    
    Resume Text:
    ---
    ${resumeText}
    ---
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const json = parseJsonFromMarkdown(response.text);
  return json as ResumeAnalysis;
};

/**
 * Matches a resume analysis against a list of jobs to score relevance.
 * @param analysis The user's resume analysis.
 * @param jobs The list of jobs to score.
 * @returns A promise that resolves with the list of jobs, updated with relevance scores.
 */
export const matchJobs = async (analysis: ResumeAnalysis, jobs: Job[]): Promise<Job[]> => {
    // To avoid overly large prompts, we'll only send essential job info
    const jobPayload = jobs.map(j => ({
        id: j.id,
        title: j.title,
        description: j.description.substring(0, 500), // Truncate for brevity
        required_skills: j.required_skills,
    }));

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "The unique identifier for the job." },
                relevanceScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating how well the resume matches this job." },
            },
            required: ["id", "relevanceScore"],
        }
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on this resume analysis:
        
        Summary: ${analysis.summary}
        Skills: ${analysis.skills.map(s => s.name).join(', ')}
        Experience: ${analysis.experience_years} years

        Score the relevance of the following jobs on a scale of 0 to 100. A score of 100 is a perfect match.
        
        Jobs:
        ---
        ${JSON.stringify(jobPayload, null, 2)}
        ---
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const scores: {id: string; relevanceScore: number}[] = parseJsonFromMarkdown(response.text);
    
    const scoreMap = new Map(scores.map(item => [item.id, item.relevanceScore]));

    return jobs.map(job => ({
        ...job,
        relevanceScore: scoreMap.get(job.id) || 0,
    }));
};

/**
 * Generates an AI-powered smart profile based on resume analysis.
 * @param analysis The resume analysis data.
 * @returns A promise that resolves with the generated SmartProfile.
 */
export const generateSmartProfile = async (analysis: ResumeAnalysis): Promise<SmartProfile> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            enhanced_summary: {
                type: Type.STRING,
                description: "Rewrite the resume summary to be more impactful and professional, tailored for job applications. Make it 3-4 sentences."
            },
            suggested_skills: {
                type: Type.ARRAY,
                description: "Suggest 3 complementary skills the person could learn to enhance their profile, with a brief reason for each.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {type: Type.STRING, description: "The suggested skill."},
                        reason: {type: Type.STRING, description: "A one-sentence reason why this skill would be valuable."},
                    },
                    required: ["name", "reason"],
                }
            },
            interview_talking_points: {
                type: Type.ARRAY,
                description: "Provide 3 key talking points for an interview, framed as 'Tell me about a time when...' stories, based on the resume's content.",
                items: { type: Type.STRING },
            }
        },
        required: ["enhanced_summary", "suggested_skills", "interview_talking_points"],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following resume analysis, generate a "Smart Profile" to help with a job search.

        Summary: ${analysis.summary}
        Skills: ${analysis.skills.map(s => s.name).join(', ')}
        Experience: ${analysis.experience_years} years
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    const profile: SmartProfile = parseJsonFromMarkdown(response.text);
    return profile;
};