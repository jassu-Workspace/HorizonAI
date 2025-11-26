import { GoogleGenAI, Type, GenerateContentResponse, Modality, GenerateImagesResponse } from "@google/genai";
import { UserProfile, Suggestion, RoadmapData, QuizQuestion, Flashcard, Project, Toughness, JobTrendData, AcademicSuggestion, TimelineEvent, OfflineCenter, Career, StudyPlanItem, SetupStep, RealWorldScenario, ConceptConnection, Debate, CareerRecommendation, RoadmapWeek, ProjectDetails, CareerDetails, MockInterview, FocusArea } from '../types';

// API Key is sourced from environment variables for security. This is the primary key used by the application.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A utility function to wrap asynchronous API calls with a retry mechanism.
 * Implements exponential backoff to avoid overwhelming the server on repeated failures.
 * @param apiCall The function that returns a promise to be executed.
 * @param retries The maximum number of retries.
 * @param delay The initial delay between retries in milliseconds.
 * @returns The result of the successful API call.
 * @throws An error if the API call fails after all retries.
 */
const withRetry = async <T,>(apiCall: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            // Check for specific rate-limiting or quota-exhausted errors
            const errorMessage = error?.message || '';
            if (errorMessage.includes('429') || /quota|limit|exhausted/i.test(errorMessage)) {
                console.error("API rate limit or quota exceeded. Stopping retries.", error);
                throw new Error("We're experiencing high demand right now. Please try again in a few moments.");
            }

            if (i === retries - 1) {
                console.error("API request failed after multiple retries.", error);
                throw new Error(`The API request failed: ${errorMessage}. The service may be temporarily unavailable.`);
            }
            console.warn(`API call failed. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
        }
    }
    // This part should be unreachable due to the throw in the loop, but is required for TS compilation
    throw new Error("The API request failed after multiple retries. The service may be temporarily unavailable.");
};


const parseJsonResponse = <T,>(response: GenerateContentResponse): T => {
    try {
        const text = response.text.trim();
        const jsonText = text.replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(jsonText) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("Invalid JSON response from API.");
    }
};

const generateAcademicContext = (profile: UserProfile): string => {
    let context = `The user is currently studying at the '${profile.academicLevel}' level in the '${profile.stream}' stream.`;
    const history = [];
    if (profile.diplomaPerformance) {
        history.push(`a Diploma with performance: ${profile.diplomaPerformance}`);
    } else if (profile.class12Performance) {
        history.push(`Class 12 (${profile.class12Stream || 'N/A'}) with performance: ${profile.class12Performance}`);
    }
    if (profile.class10Performance) {
        history.push(`Class 10 with performance: ${profile.class10Performance}`);
    }

    if (history.length > 0) {
        context += `\nTheir academic history includes: ${history.join(', ')}.`;
    }
    if (profile.previousPerformance) {
        context += `\nTheir recent performance is: ${profile.previousPerformance}.`;
    }
    if (profile.interestedSubjects) {
        context += `\nTheir strongest subjects are: ${profile.interestedSubjects}.`;
    }
    return context;
};

export const getSkillSuggestions = async (profile: UserProfile): Promise<Suggestion[]> => {
    const { skills, interests } = profile;
    const academicContext = generateAcademicContext(profile);
    const prompt = `You are an expert learning navigator. Based on a user with the following profile: ${academicContext}.
    The user has specified existing skills in '${skills}' and strong interests in '${interests}'.
    Suggest 6 unique and interesting new skills. Each suggestion must directly synthesize the user's academic background, skills, and interests. 
    For each suggestion, provide a 'name' (the skill) and a short, compelling 'description' (1-2 sentences) explaining why it's a perfect fit. 
    Provide the data as a JSON object with a 'suggestions' array.`;
    
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                            },
                            required: ["name", "description"]
                        }
                    }
                },
                required: ["suggestions"]
            }
        }
    }));

    const data = parseJsonResponse<{ suggestions: Suggestion[] }>(response);
    return data.suggestions;
};

export const getRoadmap = async (skillName: string, weeks: string, level: string, profile: UserProfile): Promise<RoadmapData> => {
    const { learningStyle, focusArea } = profile;
    const academicContext = generateAcademicContext(profile);

    let focusInstruction = '';
    if (focusArea === 'NCVET/NSQF Aligned') {
        focusInstruction = `The roadmap must be aligned with the Indian NCVET/NSQF (National Council for Vocational Education and Training / National Skills Qualification Framework). Where applicable, mention NSQF levels.`;
    }
    
    // 1. Generate the core weekly plan
    const roadmapPrompt = `Create a comprehensive learning guide for the skill "${skillName}" for a user with this background: ${academicContext}.
    The user's determined skill level for this topic is '${level}'.
    Duration: ${weeks} weeks.
    ${focusInstruction}
    Tailor goals and resources for a '${learningStyle}' learning style.
    Provide the following in a JSON object:
    1. 'skill': The name of the skill ("${skillName}").
    2. 'roadmap': A ${weeks}-week plan array. Each item: 'week' (number), 'theme' (string), 'goals' (array of 3 strings), 'resources' (array of 2 objects with 'title' and 'searchQuery').`;

    // 2. Generate the curated resources list
    const resourcesPrompt = `For a learner of "${skillName}" (Level: ${level}), suggest high-quality learning resources.
    Provide JSON with:
    1. 'freePlatforms': 2 items (name, description, searchQuery).
    2. 'paidPlatforms': 2 items.
    3. 'books': 2 items.`;
    
    const platformSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, searchQuery: { type: Type.STRING } }, required: ["name", "description", "searchQuery"] } };
    
    const [roadmapResponse, resourcesResponse] = await Promise.all([
        withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: roadmapPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        skill: { type: Type.STRING },
                        roadmap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { week: { type: Type.NUMBER }, theme: { type: Type.STRING }, goals: { type: Type.ARRAY, items: { type: Type.STRING } }, resources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, searchQuery: { type: Type.STRING } }, required: ["title", "searchQuery"] } } }, required: ["week", "theme", "goals", "resources"] } }
                    },
                    required: ["skill", "roadmap"]
                }
            }
        })),
        withRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: resourcesPrompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        freePlatforms: platformSchema,
                        paidPlatforms: platformSchema,
                        books: platformSchema
                    },
                    required: ["freePlatforms", "paidPlatforms", "books"]
                }
            }
        }))
    ]);

    const roadmapData = parseJsonResponse<{ skill: string; roadmap: RoadmapWeek[] }>(roadmapResponse);
    const resourcesData = parseJsonResponse<{ freePlatforms: any[]; paidPlatforms: any[]; books: any[] }>(resourcesResponse);

    return { ...roadmapData, ...resourcesData };
};

export const getSkillLevelQuiz = async (skillName: string): Promise<QuizQuestion[]> => {
    const prompt = `Create a quiz with exactly 6 multiple-choice questions to determine if a user's knowledge of '${skillName}' is beginner, intermediate, or expert. JSON output.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { quiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } }, required: ["question", "options", "correctAnswer"] } } }, required: ["quiz"] } }
    }));
    return parseJsonResponse<{ quiz: QuizQuestion[] }>(response).quiz;
};

export const getAiCoachResponse = async (skillName: string, userInput: string): Promise<string> => {
    const prompt = `You are 'Horizon', a friendly and encouraging AI learning coach. The user is learning '${skillName}'. The user's message is: ${userInput}`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};

export const getQuiz = async (skillName: string, weekTheme: string): Promise<QuizQuestion[]> => {
    const prompt = `Create a simple 3-question multiple-choice quiz for '${weekTheme}' in '${skillName}'. JSON output.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { quiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } }, required: ["question", "options", "correctAnswer"] } } }, required: ["quiz"] } }
    }));
    return parseJsonResponse<{ quiz: QuizQuestion[] }>(response).quiz;
};

export const getProjectSuggestions = async (skillName: string, interests: string): Promise<Project[]> => {
    const prompt = `Generate 3 beginner project ideas for '${skillName}' related to '${interests}'. JSON output with title and description.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { projects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } } }, required: ["projects"] } }
    }));
    return parseJsonResponse<{ projects: Project[] }>(response).projects;
};

export const getProjectDetails = async (skillName: string, projectTitle: string): Promise<ProjectDetails> => {
    const prompt = `Detailed brief for project "${projectTitle}" using "${skillName}". JSON output with project_overview, core_features, tech_stack_suggestions.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    project_overview: { type: Type.STRING },
                    core_features: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tech_stack_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["project_overview", "core_features", "tech_stack_suggestions"]
            }
        }
    }));
    return parseJsonResponse<ProjectDetails>(response);
};

export const getFlashcards = async (skillName: string, weekTheme: string): Promise<Flashcard[]> => {
    const prompt = `Create 6 flashcards for '${weekTheme}' in '${skillName}'. JSON output with term and definition.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { flashcards: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["term", "definition"] } } }, required: ["flashcards"] } }
    }));
    return parseJsonResponse<{ flashcards: Flashcard[] }>(response).flashcards;
};

export const getELI5 = async (skillName: string, weekTheme: string): Promise<string> => {
    const prompt = `Explain '${weekTheme}' from '${skillName}' like I'm 5. Use an analogy.`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};

export const getDeepDive = async (skillName: string): Promise<{ what_is_it: string; why_useful: string; why_learn: string; }> => {
    const prompt = `Deep dive into "${skillName}". JSON output keys: what_is_it, why_useful, why_learn.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { what_is_it: { type: Type.STRING }, why_useful: { type: Type.STRING }, why_learn: { type: Type.STRING } }, required: ["what_is_it", "why_useful", "why_learn"] } }
    }));
    return parseJsonResponse<{ what_is_it: string; why_useful: string; why_learn: string; }>(response);
};

export const getToughness = async (skillName: string): Promise<Toughness> => {
    const prompt = `Toughness of learning "${skillName}" (1-100). JSON output: toughness (number), justification (string).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { toughness: { type: Type.NUMBER }, justification: { type: Type.STRING } }, required: ["toughness", "justification"] } }
    }));
    return parseJsonResponse<Toughness>(response);
};

export const getJobTrendData = async (skillName: string): Promise<JobTrendData> => {
    const prompt = `Job market trend for "${skillName}". JSON output: trend ("high growth", "moderate growth", "stable", "declining") and base_jobs (number).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, base_jobs: { type: Type.NUMBER } }, required: ["trend", "base_jobs"] } }
    }));
    return parseJsonResponse<JobTrendData>(response);
};

export const getAcademicSuggestions = async (profile: UserProfile): Promise<AcademicSuggestion[]> => {
    const { academicLevel, stream, interests, skills } = profile;
    let prompt: string;
    if (academicLevel === 'Class 10') {
        prompt = `Academic advice for Class 10 student (Interests: ${interests}). Suggest 3 paths. JSON: suggestions array (name, description, searchQuery).`;
    } else { 
        prompt = `Degree advice for Class 12 ${stream} student (Interests: ${interests}). Suggest 4 degrees (not just B.Tech). JSON: suggestions array (name, description, searchQuery).`;
    }
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, searchQuery: { type: Type.STRING } }, required: ["name", "description", "searchQuery"] } } }, required: ["suggestions"] } }
    }));
    return parseJsonResponse<{ suggestions: AcademicSuggestion[] }>(response).suggestions;
};

export const getTimelineEvents = async (profile: UserProfile, skill: string): Promise<TimelineEvent[]> => {
    const { academicLevel, stream } = profile;
    const prompt = `Timeline of 4 academic/career events for ${academicLevel} ${stream} student learning ${skill} in India (Date: Sept 2025). JSON: timelineEvents array (eventName, eventType, estimatedDate, description).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { timelineEvents: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { eventName: { type: Type.STRING }, eventType: { type: Type.STRING }, estimatedDate: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["eventName", "eventType", "estimatedDate", "description"] } } }, required: ["timelineEvents"] } }
    }));
    return parseJsonResponse<{ timelineEvents: TimelineEvent[] }>(response).timelineEvents;
};

export const getOfflineCenters = async (skillName: string): Promise<OfflineCenter[]> => {
    const prompt = `Suggest 3 offline place types to learn '${skillName}'. JSON: centers array (name, description, searchQuery).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { centers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, searchQuery: { type: Type.STRING } }, required: ["name", "description", "searchQuery"] } } }, required: ["centers"] } }
    }));
    return parseJsonResponse<{ centers: OfflineCenter[] }>(response).centers;
};

export const getCareerPaths = async (skillName: string): Promise<Career[]> => {
    const prompt = `Suggest 3 career paths for "${skillName}". JSON: careers array (title, description).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { careers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } } }, required: ["careers"] } }
    }));
    return parseJsonResponse<{ careers: Career[] }>(response).careers;
};

export const getCareerDetails = async (careerTitle: string, skillName: string): Promise<CareerDetails> => {
    const prompt = `Career details for "${careerTitle}" (Skill: ${skillName}) in India. JSON keys: key_responsibilities, key_roles, salary_expectations (fresher, intermediate, expert), top_recruiting_companies.`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    key_responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    key_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    salary_expectations: {
                        type: Type.OBJECT,
                        properties: {
                            fresher: { type: Type.STRING },
                            intermediate: { type: Type.STRING },
                            expert: { type: Type.STRING }
                        },
                        required: ["fresher", "intermediate", "expert"]
                    },
                    top_recruiting_companies: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["key_responsibilities", "key_roles", "salary_expectations", "top_recruiting_companies"]
            }
        }
    }));
    return parseJsonResponse<CareerDetails>(response);
};

export const getMockInterview = async (careerTitle: string): Promise<MockInterview> => {
    const prompt = `Mini mock interview for "${careerTitle}". JSON: theory_questions (array of strings), mcq_questions (array of objects with question, options, correctAnswer).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    theory_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mcq_questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswer: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswer"]
                        }
                    }
                },
                required: ["theory_questions", "mcq_questions"]
            }
        }
    }));
    return parseJsonResponse<MockInterview>(response);
};


export const getStudyPlan = async (skillName: string, topic: string, duration: string): Promise<StudyPlanItem[]> => {
    const prompt = `Study plan for ${duration} min on '${topic}' in '${skillName}'. JSON: plan array (activity, duration_minutes).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { plan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { activity: { type: Type.STRING }, duration_minutes: { type: Type.NUMBER } }, required: ["activity", "duration_minutes"] } } }, required: ["plan"] } }
    }));
    return parseJsonResponse<{ plan: StudyPlanItem[] }>(response).plan;
};

export const getSetupGuide = async (skillName: string): Promise<SetupStep[]> => {
    const prompt = `3 setup steps for '${skillName}'. JSON: setupSteps array (title, description, searchQuery, resourceLink).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { setupSteps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, searchQuery: { type: Type.STRING }, resourceLink: { type: Type.STRING } }, required: ["title", "description", "searchQuery"] } } }, required: ["setupSteps"] } }
    }));
    return parseJsonResponse<{ setupSteps: SetupStep[] }>(response).setupSteps;
};

export const getRealWorldScenarios = async (skillName: string, weekTheme: string): Promise<RealWorldScenario[]> => {
    const prompt = `2 real-world scenarios for '${weekTheme}' in '${skillName}'. JSON: scenarios array (scenario_title, problem_statement, key_tasks).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { scenarios: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scenario_title: { type: Type.STRING }, problem_statement: { type: Type.STRING }, key_tasks: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["scenario_title", "problem_statement", "key_tasks"] } } }, required: ["scenarios"] } }
    }));
    return parseJsonResponse<{ scenarios: RealWorldScenario[] }>(response).scenarios;
};

export const getHelpForStuck = async (skillName: string, weekTheme: string, problemDescription: string): Promise<string> => {
    const prompt = `Explain '${weekTheme}' in '${skillName}' to a student stuck on: "${problemDescription}". Use analogy.`;
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }));
    return response.text;
};

export const generateImage = async (description: string): Promise<string> => {
    const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Educational illustration: ${description}. Digital art style.`,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    }));
    return response.generatedImages[0].image.imageBytes;
};

export const getConceptConnections = async (skillName: string, weekTheme: string): Promise<ConceptConnection[]> => {
    const prompt = `Connect '${weekTheme}' in '${skillName}' to 2 other fields. JSON: connections array (field, explanation).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { connections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { field: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["field", "explanation"] } } }, required: ["connections"] } }
    }));
    return parseJsonResponse<{ connections: ConceptConnection[] }>(response).connections;
};

export const getDebateTopic = async (skillName: string, weekTheme: string): Promise<Debate> => {
    const prompt = `Debate topic for '${weekTheme}' in '${skillName}'. JSON: topic, opening_statement (antagonist).`;
    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    opening_statement: { type: Type.STRING }
                },
                required: ["topic", "opening_statement"]
            }
        }
    }));
    return parseJsonResponse<Debate>(response);
};

export const getDebateRebuttal = async (history: { role: string; parts: { text: string }[] }[]): Promise<string> => {
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
        config: {
             systemInstruction: "You are a witty AI debate antagonist. Keep responses concise."
        }
    }));
    return response.text;
};

export const getCareerRecommendation = async (profile: UserProfile): Promise<CareerRecommendation> => {
    const { skills, interests, academicLevel, stream, focusArea } = profile;
    const prompt = `Recommend one career for ${academicLevel} ${stream} student (Skills: ${skills}, Interests: ${interests}). JSON: career_title, reason, next_steps.`;

    const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    career_title: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["career_title", "reason", "next_steps"]
            }
        }
    }));
    return parseJsonResponse<CareerRecommendation>(response);
};

export const getAudioOverview = async (skillName: string, roadmap: RoadmapWeek[]): Promise<string> => {
    const summary = `Overview for ${skillName}. Week 1: ${roadmap[0].theme}. Final week: ${roadmap[roadmap.length - 1].theme}. Good luck!`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: summary }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        }
    }));
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Could not generate audio overview.");
    }
    return base64Audio;
};