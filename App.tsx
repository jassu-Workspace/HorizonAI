import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, Suggestion, RoadmapData, ChatMessage, LearningStyle, AcademicLevel, Stream, Project, RealWorldScenario, ProjectDetails, SetupStep, TimelineEvent, CareerDetails, MockInterview, QuizQuestion, Flashcard, ConceptConnection, JobTrendData, Debate, CareerRecommendation, Toughness, OfflineCenter, Career, AcademicSuggestion } from './types';
import * as GeminiService from './services/geminiService';
import { supabase, getCurrentProfile } from './services/supabaseService';
import BackgroundAnimation from './components/BackgroundAnimation';
import IntroOverlay from './components/IntroOverlay';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Suggestions from './components/Suggestions';
import ConfigureRoadmap from './components/ConfigureRoadmap';
import Roadmap from './components/Roadmap';
import AiCoachFab from './components/AiCoachFab';
import AiCoachModal from './components/AiCoachModal';
import Modal from './components/Modal';
import QuizModal from './components/QuizModal';
import FlashcardModal from './components/FlashcardModal';
import ProjectModal from './components/ProjectModal';
import ProjectDetailsModal from './components/ProjectDetailsModal';
import DeepDiveModal from './components/DeepDiveModal';
import DebateModal from './components/DebateModal';
import CareerDetailsModal from './components/CareerDetailsModal';
import MockInterviewModal from './components/MockInterviewModal';
import SkillLevelQuizModal from './components/SkillLevelQuizModal';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { Loader } from './components/Loader';

const translations = {
    'English': {
        headerTitle: 'Horizon AI',
        headerSubtitle: 'Chart your course to new skills. Your personal AI learning navigator.',
        formTitle: 'Start New Roadmap'
    },
    'हिन्दी': {
        headerTitle: 'क्षितिज AI',
        headerSubtitle: 'नए कौशलों के लिए अपना रास्ता बनाएं। आपका व्यक्तिगत AI लर्निंग नेविगेटर।',
        formTitle: 'नया रोडमैप शुरू करें'
    },
    'தமிழ்': {
        headerTitle: 'ஹொரைசன் AI',
        headerSubtitle: 'புதிய திறன்களுக்கான உங்கள் வழியை வரையுங்கள். உங்கள் தனிப்பட்ட AI கற்றல் நேவிகேட்டர்.',
        formTitle: 'புதிய சாலைவரைபடத்தைத் தொடங்கவும்'
    },
    'Español': {
        headerTitle: 'Horizon AI',
        headerSubtitle: 'Traza tu rumbo hacia nuevas habilidades. Tu navegador de aprendizaje personal con IA.',
        formTitle: 'Iniciar Nueva Hoja de Ruta'
    },
    'Français': {
        headerTitle: 'Horizon AI',
        headerSubtitle: 'Tracez votre parcours vers de nouvelles compétences. Votre navigateur d\'apprentissage personnel IA.',
        formTitle: 'Nouvelle Feuille de Route'
    }
};

type AnimationType = 'net' | 'globe';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.INTRO);
    const [userProfile, setUserProfile] = useState<UserProfile>({
        skills: '',
        interests: '',
        learningStyle: 'Balanced',
        academicLevel: 'Graduation',
        stream: 'Engineering',
        focusArea: 'General'
    });
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedSkill, setSelectedSkill] = useState<string>('');
    const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [language, setLanguage] = useState<keyof typeof translations>('English');
    const [animationType, setAnimationType] = useState<AnimationType>('net');
    const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);


    // Modal States
    const [isCoachModalVisible, setCoachModalVisible] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isDebateModalVisible, setDebateModalVisible] = useState<boolean>(false);
    const [debateHistory, setDebateHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
    const [debateTopic, setDebateTopic] = useState('');
    const [isQuizModalVisible, setQuizModalVisible] = useState<boolean>(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [isFlashcardModalVisible, setFlashcardModalVisible] = useState<boolean>(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isProjectModalVisible, setProjectModalVisible] = useState<boolean>(false);
    const [isProjectDetailsModalVisible, setProjectDetailsModalVisible] = useState<boolean>(false);
    const [projectSuggestions, setProjectSuggestions] = useState<Project[]>([]);
    const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
    const [isDeepDiveModalVisible, setDeepDiveModalVisible] = useState<boolean>(false);
    const [deepDiveData, setDeepDiveData] = useState<{ what_is_it: string; why_useful: string; why_learn: string; } | null>(null);
    const [isCareerDetailsModalVisible, setCareerDetailsModalVisible] = useState<boolean>(false);
    const [careerDetails, setCareerDetails] = useState<CareerDetails | null>(null);
    const [isMockInterviewModalVisible, setMockInterviewModalVisible] = useState<boolean>(false);
    const [mockInterview, setMockInterview] = useState<MockInterview | null>(null);
    const [isSkillLevelQuizVisible, setSkillLevelQuizVisible] = useState<boolean>(false);
    const [skillLevelQuizQuestions, setSkillLevelQuizQuestions] = useState<QuizQuestion[]>([]);
    const [determinedSkillLevel, setDeterminedSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>();
    const [modalContent, setModalContent] = useState<{ type: string; data: any } | null>(null);


    useEffect(() => {
        // Intro Animation Timer
        const timer = setTimeout(() => {
            checkSession();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const checkSession = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
    
            if (session) {
                const profile = await getCurrentProfile();
                if (profile && profile.academicLevel) {
                    setUserProfile(profile);
                    setAppState(AppState.INPUT);
                } else {
                    setAppState(AppState.ONBOARDING);
                }
            } else {
                setAppState(AppState.AUTH);
            }
        } catch (error: any) {
            console.error("Error during session check:", error);
            setErrorMessage("Could not connect to your session. Please check your internet connection and try again.");
            setAppState(AppState.ERROR);
        }
    };

    const handleAuthSuccess = async () => {
        await checkSession();
    };

    const handleGuestAccess = () => {
        // Guests also need to setup their academic context
        setAppState(AppState.ONBOARDING);
    };

    const handleOnboardingComplete = (profileData: Partial<UserProfile>) => {
        setUserProfile(prev => ({...prev, ...profileData}));
        
        // After onboarding, always go to Input (Home) to start immediately
        setAppState(AppState.INPUT);
    };

    const handleAnimationToggle = () => {
        setAnimationType(prev => prev === 'net' ? 'globe' : 'net');
    };
    
    const handleShowDashboard = () => {
        setAppState(AppState.DASHBOARD);
    };

    const handleProfileSubmit = async (profile: UserProfile) => {
        setAppState(AppState.LOADING);
        setUserProfile(profile);
        setErrorMessage('');
        try {
            const effectiveSkill = profile.skills || profile.interests;
            if (!effectiveSkill) {
                setErrorMessage("Please enter at least one skill or interest.");
                setAppState(AppState.INPUT);
                return;
            }
            const suggestions = await GeminiService.getSkillSuggestions(profile);
            setSuggestions(suggestions);
            setAppState(AppState.SUGGESTIONS);
        } catch (error: any) {
            setErrorMessage(error.message);
            setAppState(AppState.ERROR);
        }
    };

    const handleRefresh = () => handleProfileSubmit(userProfile);

    const handleSelectSkill = (skill: string) => {
        setSelectedSkill(skill);
        setAppState(AppState.CONFIG_ROADMAP);
    };

    const handleGenerateRoadmap = async (weeks: string, level: string) => {
        setAppState(AppState.LOADING);
        setErrorMessage('');
        try {
            const data = await GeminiService.getRoadmap(selectedSkill, weeks, level, userProfile);
            setRoadmapData(data);
            // We don't auto-save to DB here, we let user click "Save" button. 
            setAppState(AppState.ROADMAP);
        } catch (error: any) {
            setErrorMessage(error.message);
            setAppState(AppState.ERROR);
        }
    };
    
    const handleStartOver = () => {
        // Going back 'home' means going to Input
        setAppState(AppState.INPUT);
        setRoadmapData(null);
        setSelectedSkill('');
        setSuggestions([]);
    };

    const handleSelectSavedRoadmap = async (savedMap: RoadmapData) => {
        setRoadmapData(savedMap);
        setSelectedSkill(savedMap.skill);
        setAppState(AppState.ROADMAP);
    };
    
    const handleResumeSession = () => {}; 

    const handleFeatureClick = async (type: string, data: any) => {
        setModalContent({ type: 'loading', data: null }); // Show loader in a generic modal
        
        try {
            let result: any;
            switch(type) {
                case 'eli5':
                    result = await GeminiService.getELI5(data.skill, data.theme);
                    break;
                case 'scenario':
                    result = await GeminiService.getRealWorldScenarios(data.skill, data.theme);
                    break;
                case 'quiz':
                    result = await GeminiService.getQuiz(data.skill, data.theme);
                    setQuizQuestions(result);
                    setModalContent({ type, data: { ...data, result } });
                    return;
                case 'flashcards':
                    result = await GeminiService.getFlashcards(data.skill, data.theme);
                    setFlashcards(result);
                    setFlashcardModalVisible(true);
                    setModalContent(null);
                    return;
                 case 'visualize':
                    result = await GeminiService.generateImage(`A simple, clear, educational diagram explaining the concept of "${data.theme}" in the field of ${data.skill}. Style: digital art, vibrant colors, clear labels.`);
                    break;
                case 'connections':
                    result = await GeminiService.getConceptConnections(data.skill, data.theme);
                    break;
                case 'debate':
                    result = await GeminiService.getDebateTopic(data.skill, data.theme);
                    setDebateTopic(result.topic);
                    setDebateHistory([{ role: 'antagonist', parts: [{ text: result.opening_statement }] }]);
                    setDebateModalVisible(true);
                    setModalContent(null);
                    return;
                case 'deep-dive':
                    result = await GeminiService.getDeepDive(data.skill);
                    setDeepDiveData(result);
                    setDeepDiveModalVisible(true);
                    setModalContent(null);
                    return;
                 case 'setup-guide':
                    result = await GeminiService.getSetupGuide(data.skill);
                    break;
                case 'career-details':
                     result = await GeminiService.getCareerDetails(data.careerTitle, data.skill);
                     setCareerDetails(result);
                     setCareerDetailsModalVisible(true);
                     setModalContent(null);
                     return;
                case 'career-recommender':
                    result = await GeminiService.getCareerRecommendation(userProfile);
                    break;
                case 'timeline':
                    result = await GeminiService.getTimelineEvents(userProfile, data.skill);
                    break;
                case 'stuck':
                    const problem = prompt(`Describe what you're stuck on regarding "${data.theme}":`);
                    if(problem) {
                        result = await GeminiService.getHelpForStuck(data.skill, data.theme, problem);
                    } else {
                        setModalContent(null);
                        return;
                    }
                    break;
                case 'projects':
                     result = await GeminiService.getProjectSuggestions(data.skill, userProfile.interests);
                     setProjectSuggestions(result);
                     setProjectModalVisible(true);
                     setModalContent(null);
                     return;
                case 'project-details':
                     result = await GeminiService.getProjectDetails(data.skill, data.projectTitle);
                     setProjectDetails(result);
                     setProjectDetailsModalVisible(true);
                     setModalContent(null);
                     return;
                case 'toughness':
                    result = await GeminiService.getToughness(data.skill);
                    break;
                case 'offline-centers':
                    result = await GeminiService.getOfflineCenters(data.skill);
                    break;
                case 'career-paths':
                    result = await GeminiService.getCareerPaths(data.skill);
                    break;
                case 'next-degree-suggestion':
                    result = await GeminiService.getAcademicSuggestions(userProfile);
                    break;
                default:
                    throw new Error("Unknown feature type");
            }
            setModalContent({ type, data: { ...data, result } });
        } catch(e: any) {
            setModalContent({ type: 'error', data: e.message });
        }
    };
    
    const handleCoachSend = async (message: string) => {
        const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }];
        setChatHistory(newHistory);
        const response = await GeminiService.getAiCoachResponse(selectedSkill, message);
        setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    };

    const handleDebateSend = async (message: string) => {
        const newHistory = [...debateHistory, { role: 'user', parts: [{ text: message }] }];
        setDebateHistory(newHistory);
        const response = await GeminiService.getDebateRebuttal(newHistory);
        setDebateHistory(prev => [...prev, { role: 'antagonist', parts: [{ text: response }] }]);
    };
    
    const handleTakeSkillQuiz = async () => {
        setSkillLevelQuizVisible(true);
        setSkillLevelQuizQuestions([]); // Clear old questions
        const questions = await GeminiService.getSkillLevelQuiz(selectedSkill);
        setSkillLevelQuizQuestions(questions);
    };
    
    const handleCompleteSkillQuiz = (level: 'Beginner' | 'Intermediate' | 'Expert') => {
        setDeterminedSkillLevel(level);
        setSkillLevelQuizVisible(false);
    };

    const renderContent = () => {
        switch (appState) {
            case AppState.AUTH:
                return <Auth onAuthSuccess={handleAuthSuccess} onGuestAccess={handleGuestAccess} />;
            case AppState.ONBOARDING:
                return <Onboarding onComplete={handleOnboardingComplete} />;
            case AppState.DASHBOARD:
                return <Dashboard onSelectRoadmap={handleSelectSavedRoadmap} onNewRoadmap={() => setAppState(AppState.INPUT)} />;
            case AppState.INPUT:
                return <InputForm existingProfile={userProfile} onSubmit={handleProfileSubmit} title={translations[language].formTitle} />;
            case AppState.SUGGESTIONS:
                return <Suggestions suggestions={suggestions} onSelect={handleSelectSkill} onRefresh={handleRefresh} />;
            case AppState.CONFIG_ROADMAP:
                return <ConfigureRoadmap skillName={selectedSkill} onGenerate={handleGenerateRoadmap} onBack={() => setAppState(AppState.SUGGESTIONS)} onTakeQuiz={handleTakeSkillQuiz} determinedSkillLevel={determinedSkillLevel}/>;
            case AppState.ROADMAP:
                if (!roadmapData) return <Loader message="Preparing your roadmap..." />;
                return <Roadmap data={roadmapData} userProfile={userProfile} onStartOver={handleStartOver} onFeatureClick={handleFeatureClick} setRoadmapData={setRoadmapData} />;
            case AppState.LOADING:
                return <Loader message="Working our magic..." />;
            case AppState.ERROR:
                return <div className="text-center"><p className="text-red-500 font-semibold bg-red-100 p-4 rounded-lg">{errorMessage}</p><button onClick={handleStartOver} className="dynamic-button mt-4">Try Again</button></div>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <BackgroundAnimation animationType={animationType} />
            <IntroOverlay isVisible={appState === AppState.INTRO} />
            
            <div className={`flex-grow flex flex-col transition-opacity duration-500 ${appState === AppState.INTRO ? 'opacity-0' : 'opacity-100'}`}>
                {appState !== AppState.AUTH && appState !== AppState.ONBOARDING && (
                    <Header 
                        language={language} 
                        onLanguageChange={(lang) => setLanguage(lang as keyof typeof translations)} 
                        title={translations[language].headerTitle}
                        subtitle={translations[language].headerSubtitle}
                        onToggleAnimation={handleAnimationToggle}
                        currentAnimation={animationType}
                        onResumeSession={handleResumeSession}
                        hasSavedSession={hasSavedSession}
                        onShowDashboard={handleShowDashboard}
                        showDashboardButton={!!userProfile.id} // Only show if user has an ID (logged in)
                    />
                )}
                <main className="flex-grow container mx-auto px-4 pb-8">
                    {renderContent()}
                </main>
            </div>


            {roadmapData && <AiCoachFab onOpen={() => setCoachModalVisible(true)} />}

            {isCoachModalVisible && <AiCoachModal history={chatHistory} onSend={handleCoachSend} onClose={() => setCoachModalVisible(false)} title={`AI Coach for ${selectedSkill}`} />}
            {isDebateModalVisible && <DebateModal history={debateHistory} onSend={handleDebateSend} onClose={() => setDebateModalVisible(false)} title={debateTopic} />}
            {isFlashcardModalVisible && <Modal title="Flashcards" onClose={() => setFlashcardModalVisible(false)}><FlashcardModal flashcards={flashcards} /></Modal>}
            {isProjectModalVisible && <Modal title="Project Ideas" onClose={() => setProjectModalVisible(false)}><ProjectModal projects={projectSuggestions} onSelectProject={(title) => handleFeatureClick('project-details', { skill: selectedSkill, projectTitle: title })} /></Modal>}
            {isProjectDetailsModalVisible && projectDetails && <Modal title="Project Blueprint" onClose={() => setProjectDetailsModalVisible(false)}><ProjectDetailsModal details={projectDetails} /></Modal>}
            {isDeepDiveModalVisible && deepDiveData && <Modal title={`Deep Dive: ${selectedSkill}`} onClose={() => setDeepDiveModalVisible(false)}><DeepDiveModal data={deepDiveData} /></Modal>}
            {isCareerDetailsModalVisible && careerDetails && <Modal title={`Career Details: ${careerDetails.key_roles[0]}`} onClose={() => setCareerDetailsModalVisible(false)}><CareerDetailsModal details={careerDetails} onMockInterview={() => { setCareerDetailsModalVisible(false); handleFeatureClick('mock-interview', { careerTitle: careerDetails.key_roles[0] })}} /></Modal>}
            {isMockInterviewModalVisible && mockInterview && <Modal title="Mock Interview" onClose={() => setMockInterviewModalVisible(false)}><MockInterviewModal interview={mockInterview} /></Modal>}
            {isSkillLevelQuizVisible && <SkillLevelQuizModal questions={skillLevelQuizQuestions} onComplete={handleCompleteSkillQuiz} onClose={() => setSkillLevelQuizVisible(false)} title={`Skill Assessment: ${selectedSkill}`} skillName={selectedSkill}/>}

            {modalContent && (
                <Modal title={modalContent.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} onClose={() => setModalContent(null)}>
                    {modalContent.type === 'loading' && <Loader message="Fetching AI insight..." />}
                    {modalContent.type === 'error' && <p className="text-red-500">{modalContent.data}</p>}
                    {modalContent.type === 'eli5' && <p>{modalContent.data.result}</p>}
                    {modalContent.type === 'stuck' && <p>{modalContent.data.result}</p>}
                    {modalContent.type === 'visualize' && <img src={`data:image/jpeg;base64,${modalContent.data.result}`} alt="Generated visualization" className="rounded-lg shadow-md" />}
                    {modalContent.type === 'scenario' && (
                        <div>
                            {(modalContent.data.result as RealWorldScenario[]).map(s => (
                                <div key={s.scenario_title} className="mb-4">
                                    <h4 className="font-bold">{s.scenario_title}</h4>
                                    <p>{s.problem_statement}</p>
                                    <ul className="list-disc list-inside mt-2">{s.key_tasks.map(t => <li key={t}>{t}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                    )}
                     {modalContent.type === 'quiz' && (
                        <QuizModal 
                            questions={modalContent.data.result} 
                            roadmapId={roadmapData?.id} 
                            skill={selectedSkill} 
                            theme={modalContent.data.theme}
                            weekIndex={modalContent.data.weekIndex}
                            startedAt={modalContent.data.startedAt}
                        />
                    )}
                    {modalContent.type === 'connections' && (
                        <div>
                            {(modalContent.data.result as ConceptConnection[]).map(c => <p key={c.field} className="mb-2"><strong>{c.field}:</strong> {c.explanation}</p>)}
                        </div>
                    )}
                    {modalContent.type === 'setup-guide' && (
                        <div>
                            {(modalContent.data.result as SetupStep[]).map(s => (
                                <div key={s.title} className="mb-4">
                                    <h4 className="font-bold">{s.title}</h4>
                                    <p>{s.description}</p>
                                    <a href={`https://google.com/search?q=${encodeURIComponent(s.searchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">Search for help</a>
                                </div>
                            ))}
                        </div>
                    )}
                    {modalContent.type === 'career-recommender' && (
                        <div>
                            <h4 className="font-bold text-lg text-blue-600">{(modalContent.data.result as CareerRecommendation).career_title}</h4>
                            <p className="my-2">{(modalContent.data.result as CareerRecommendation).reason}</p>
                            <h5 className="font-semibold mt-4">Next Steps:</h5>
                            <ul className="list-disc list-inside">
                                {(modalContent.data.result as CareerRecommendation).next_steps.map(s => <li key={s}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {modalContent.type === 'timeline' && (
                        <div>
                             {(modalContent.data.result as TimelineEvent[]).map(e => (
                                <div key={e.eventName} className="mb-3">
                                    <p className="font-bold">{e.eventName} <span className="text-xs font-normal bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{e.eventType}</span></p>
                                    <p className="text-sm text-slate-600">{e.estimatedDate}: {e.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {modalContent.type === 'toughness' && (
                        <div className="text-center">
                            <div className="text-6xl font-bold text-blue-600">{(modalContent.data.result as Toughness).toughness}/100</div>
                            <p className="mt-2 text-slate-600">{(modalContent.data.result as Toughness).justification}</p>
                        </div>
                    )}
                    {modalContent.type === 'offline-centers' && (
                        <div>
                            {(modalContent.data.result as OfflineCenter[]).map(c => (
                                <div key={c.name} className="mb-4 p-3 bg-slate-50 rounded-lg border">
                                    <h4 className="font-bold">{c.name}</h4>
                                    <p className="text-sm">{c.description}</p>
                                    <a href={`https://google.com/search?q=${encodeURIComponent(c.searchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs">Search for places</a>
                                </div>
                            ))}
                        </div>
                    )}
                    {modalContent.type === 'career-paths' && (
                        <div>
                            {(modalContent.data.result as Career[]).map(c => (
                                 <div key={c.title} className="mb-4 p-3 bg-slate-50 rounded-lg border">
                                    <h4 className="font-bold">{c.title}</h4>
                                    <p className="text-sm">{c.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {modalContent.type === 'next-degree-suggestion' && (
                         <div>
                            {(modalContent.data.result as AcademicSuggestion[]).map(s => (
                                 <div key={s.name} className="mb-4 p-3 bg-slate-50 rounded-lg border">
                                    <h4 className="font-bold">{s.name}</h4>
                                    <p className="text-sm">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default App;