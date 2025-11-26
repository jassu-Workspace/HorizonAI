import React, { useState, useEffect, useRef } from 'react';
import { RoadmapData, UserProfile, Toughness, JobTrendData, AcademicSuggestion, OfflineCenter, Career, SetupStep, RealWorldScenario, Platform, TimelineEvent } from '../types';
import * as GeminiService from '../services/geminiService';
import { saveRoadmap, setRoadmapAsActive, updateRoadmap, updateUserPoints } from '../services/supabaseService';
import { Loader } from './Loader';
import JobTrendChart from './JobTrendChart';
import AcademicTimelineModal from './AcademicTimelineModal';

interface RoadmapProps {
    data: RoadmapData;
    userProfile: UserProfile;
    onStartOver: () => void;
    onFeatureClick: (type: string, data: any) => void;
    setRoadmapData: React.Dispatch<React.SetStateAction<RoadmapData | null>>;
}

// --- Sub-components for cleaner code ---

const AIToolCard: React.FC<{ 
    icon: string; 
    label: string; 
    color: string; 
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
}> = ({ icon, label, color, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 
        ${disabled 
            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed grayscale' 
            : `bg-white border-slate-200 hover:border-${color}-400 hover:shadow-md hover:-translate-y-1 group`
        }`}
    >
        <div className={`text-2xl mb-2 transition-colors ${disabled ? 'text-slate-400' : `text-${color}-500 group-hover:text-${color}-600`}`}>
            <ion-icon name={icon}></ion-icon>
        </div>
        <span className={`text-xs font-semibold text-center ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
    </button>
);

const ResourceLink: React.FC<{ resource: { title: string, searchQuery: string } }> = ({ resource }) => (
    <a 
        href={`https://www.google.com/search?q=${encodeURIComponent(resource.searchQuery)}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 group"
    >
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <ion-icon name="search" className="text-sm"></ion-icon>
        </div>
        <span className="font-medium text-slate-700 text-sm flex-grow">{resource.title}</span>
        <ion-icon name="open-outline" className="text-slate-400 text-lg group-hover:text-blue-500"></ion-icon>
    </a>
);

const RoadmapWeek: React.FC<{ 
    weekData: RoadmapData['roadmap'][0], 
    skillName: string, 
    onFeatureClick: RoadmapProps['onFeatureClick'], 
    index: number, 
    onStartWeek: (index: number) => void,
    onCompleteWeek: (index: number) => void,
    roadmapStatus: 'active' | 'saved' | 'completed' | undefined,
    isLast: boolean
}> = ({ weekData, skillName, onFeatureClick, index, onStartWeek, onCompleteWeek, roadmapStatus, isLast }) => {
    
    return (
        <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-300 bg-slate-100 z-10`}>
                    <span className="font-bold text-slate-600">{weekData.week}</span>
                </div>
                {!isLast && <div className={`w-0.5 h-full bg-slate-200 mt-[-2px]`}></div>}
            </div>

            <div className="flex-grow pb-10">
                <div className="glass-card p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Week {weekData.week}</p>
                            <h3 className="font-bold text-slate-900 text-lg">{weekData.theme}</h3>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 animate-fadeIn">
                        <h4 className="font-semibold text-slate-800 mb-2">Weekly Goals:</h4>
                        <ul className="space-y-1 list-disc list-inside text-slate-600 text-sm">
                            {weekData.goals.map(goal => <li key={goal}>{goal}</li>)}
                        </ul>

                        <h4 className="font-semibold text-slate-800 mt-4 mb-2">AI Learning Tools:</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <AIToolCard icon="document-text-outline" label="ELI5" color="green" onClick={(e) => { e.stopPropagation(); onFeatureClick('eli5', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="bulb-outline" label="Quiz" color="amber" onClick={(e) => { e.stopPropagation(); onFeatureClick('quiz', { skill: skillName, theme: weekData.theme, weekIndex: index, startedAt: weekData.startedAt }) }}/>
                            <AIToolCard icon="albums-outline" label="Flashcards" color="indigo" onClick={(e) => { e.stopPropagation(); onFeatureClick('flashcards', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="construct-outline" label="Scenario" color="rose" onClick={(e) => { e.stopPropagation(); onFeatureClick('scenario', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="image-outline" label="Visualize" color="teal" onClick={(e) => { e.stopPropagation(); onFeatureClick('visualize', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="git-network-outline" label="Connections" color="cyan" onClick={(e) => { e.stopPropagation(); onFeatureClick('connections', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="chatbubbles-outline" label="Debate" color="purple" onClick={(e) => { e.stopPropagation(); onFeatureClick('debate', { skill: skillName, theme: weekData.theme }) }}/>
                            <AIToolCard icon="help-buoy-outline" label="I'm Stuck" color="orange" onClick={(e) => { e.stopPropagation(); onFeatureClick('stuck', { skill: skillName, theme: weekData.theme }) }}/>
                        </div>
                        
                        <h4 className="font-semibold text-slate-800 mt-4 mb-2">Key Resources:</h4>
                        <div className="space-y-2">
                            {weekData.resources.map(res => <ResourceLink key={res.searchQuery} resource={res} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlatformCard: React.FC<{platform: Platform, color: 'green' | 'purple' | 'orange'}> = ({ platform, color }) => {
    const colorClasses = {
        green: 'border-green-500 bg-green-50/50 hover:bg-green-50',
        purple: 'border-purple-500 bg-purple-50/50 hover:bg-purple-50',
        orange: 'border-orange-500 bg-orange-50/50 hover:bg-orange-50',
    };

    return (
        <a 
            href={`https://google.com/search?q=${encodeURIComponent(platform.searchQuery)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`block p-4 rounded-lg border border-l-4 transition-all ${colorClasses[color]}`}
        >
            <h4 className="font-bold text-slate-800">{platform.name}</h4>
            <p className="text-sm text-slate-600 mt-1">{platform.description}</p>
        </a>
    );
};

const TimelineEventCard: React.FC<{ event: TimelineEvent }> = ({ event }) => (
    <div 
        className="block p-3 rounded-lg bg-white border border-slate-200"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{event.eventName}</p>
                <p className="text-xs text-slate-500">{event.description}</p>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
                <p className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">{event.estimatedDate}</p>
            </div>
        </div>
    </div>
);


const Roadmap: React.FC<RoadmapProps> = ({ data, userProfile, onStartOver, onFeatureClick, setRoadmapData }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
    const [isTimelineModalVisible, setIsTimelineModalVisible] = useState(false);

    // States for prefetched insight data
    const [toughness, setToughness] = useState<Toughness | null>(null);
    const [jobTrend, setJobTrend] = useState<JobTrendData | null>(null);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[] | null>(null);

    useEffect(() => {
        if (data && data.skill) {
            const fetchAllInsights = async () => {
                // Fire all requests in parallel for speed
                const results = await Promise.allSettled([
                    GeminiService.getToughness(data.skill),
                    GeminiService.getJobTrendData(data.skill),
                    GeminiService.getTimelineEvents(userProfile, data.skill),
                ]);

                if (results[0].status === 'fulfilled') setToughness(results[0].value);
                if (results[1].status === 'fulfilled') setJobTrend(results[1].value);
                if (results[2].status === 'fulfilled') setTimelineEvents(results[2].value);
            };

            fetchAllInsights();
        }
    }, [data, userProfile]);

    const handleSaveRoadmap = async () => {
        setIsSaving(true);
        try {
            await saveRoadmap(data.skill, data);
            alert("Roadmap saved successfully! You can find it in your dashboard.");
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const playAudioOverview = async () => {
        if (activeAudio) {
            activeAudio.pause();
            setActiveAudio(null);
            return;
        }
        try {
            const base64Audio = await GeminiService.getAudioOverview(data.skill, data.roadmap);
            const audio = new Audio(`data:audio/webm;base64,${base64Audio}`);
            audio.play();
            setActiveAudio(audio);
            audio.onended = () => setActiveAudio(null);
        } catch (e) {
            console.error("Failed to play audio overview", e);
        }
    };

    const handleStartWeek = (index: number) => {
        const updatedWeeks = data.roadmap.map((week, i) => {
            const firstLockedIndex = data.roadmap.findIndex(w => !w.startedAt);
            if (i === index && index === firstLockedIndex) {
                return { ...week, startedAt: new Date().toISOString() };
            }
            return week;
        });
        const updatedRoadmap = { ...data, roadmap: updatedWeeks };
        setRoadmapData(updatedRoadmap);

        if (data.id) {
            updateRoadmap(updatedRoadmap);
        }
    };

    const handleCompleteWeek = async (weekIndex: number) => {
        const isCurrentlyActive = data.status === 'active';
    
        const updatedWeeks = data.roadmap.map((week, index) => {
            if (index === weekIndex && !week.completed) {
                const points = isCurrentlyActive ? 25 : 0;
                return { ...week, completed: true, completedAt: new Date().toISOString(), earnedPoints: points };
            }
            return week;
        });
    
        const completedCount = updatedWeeks.filter(w => w.completed).length;
        const newProgress = (completedCount / updatedWeeks.length) * 100;
        const isRoadmapComplete = newProgress === 100;
    
        const updatedRoadmap: RoadmapData = {
            ...data,
            roadmap: updatedWeeks,
            progress: newProgress,
            status: isRoadmapComplete ? 'completed' : data.status
        };
    
        setRoadmapData(updatedRoadmap);
    
        if (data.id) {
            await updateRoadmap(updatedRoadmap);
            if (isCurrentlyActive) {
                await updateUserPoints(25);
            }
        } else if (!isCurrentlyActive) {
             alert("Progress for this session has been updated. Save the roadmap to track completion permanently.");
        }
    };

    return (
        <div className="animate-fadeIn max-w-7xl mx-auto">
             {isTimelineModalVisible && timelineEvents && <AcademicTimelineModal events={timelineEvents} onClose={() => setIsTimelineModalVisible(false)} />}
            
            <div className="text-center mb-6">
                <h2 className="text-4xl font-extrabold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Your Path to Mastering {data.skill}</h2>
                <p className="text-slate-600 mt-2">A personalized {data.roadmap.length}-week journey created just for you.</p>
            </div>

            <div className="glass-card p-5 mb-8">
                {toughness ? (
                    <div className="animate-fadeIn text-center">
                        <h3 className="font-bold text-lg mb-2">Toughness Level</h3>
                        <div className="text-5xl font-bold text-blue-600 mb-2">{toughness.toughness}/100</div>
                        <p className="text-slate-600 mt-2 text-sm max-w-2xl mx-auto">{toughness.justification}</p>
                    </div>
                ) : <Loader message="Analyzing toughness..." />}
            </div>

            <div className="glass-card p-5 mb-8 text-center">
                <h3 className="font-bold text-lg mb-4">Next Degree Suggestion</h3>
                <button onClick={() => onFeatureClick('next-degree-suggestion', { skill: data.skill })} className="dynamic-button !py-2 !px-5">
                    Suggest Next Degree Program
                </button>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
                {/* Left Column: Timeline */}
                <div className="lg:col-span-2">
                    {data.roadmap.map((week, index) => (
                        <RoadmapWeek 
                            key={week.week} 
                            weekData={week} 
                            skillName={data.skill} 
                            onFeatureClick={onFeatureClick} 
                            index={index}
                            onStartWeek={handleStartWeek}
                            onCompleteWeek={handleCompleteWeek}
                            roadmapStatus={data.status}
                            isLast={index === data.roadmap.length - 1}
                        />
                    ))}
                </div>

                {/* Right Column: Insights & Resources */}
                <div className="space-y-6">
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3">Global Insights</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <AIToolCard icon="analytics-outline" label="Toughness" color="red" onClick={(e) => { e.stopPropagation(); onFeatureClick('toughness', { skill: data.skill }) }} />
                            <AIToolCard icon="location-outline" label="Offline Centers" color="green" onClick={(e) => { e.stopPropagation(); onFeatureClick('offline-centers', { skill: data.skill }) }} />
                            <AIToolCard icon="briefcase-outline" label="Career Paths" color="indigo" onClick={(e) => { e.stopPropagation(); onFeatureClick('career-paths', { skill: data.skill }) }} />
                            <AIToolCard icon="rocket-outline" label="Projects" color="purple" onClick={(e) => { e.stopPropagation(); onFeatureClick('projects', { skill: data.skill }) }}/>
                            <AIToolCard icon="book-outline" label="Deep Dive" color="sky" onClick={(e) => { e.stopPropagation(); onFeatureClick('deep-dive', { skill: data.skill }) }} />
                            <AIToolCard icon="build-outline" label="Setup Guide" color="gray" onClick={(e) => { e.stopPropagation(); onFeatureClick('setup-guide', { skill: data.skill }) }} />
                            <AIToolCard icon="star-outline" label="Recommend Career" color="amber" onClick={(e) => { e.stopPropagation(); onFeatureClick('career-recommender', { skill: data.skill }) }} />
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3">Job Market Pulse</h3>
                        {jobTrend ? <JobTrendChart trendData={jobTrend} skillName={data.skill} /> : <Loader message="Analyzing job trends..." />}
                    </div>

                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3">Academic Timeline</h3>
                        {timelineEvents ? (
                            <div className="space-y-3">
                                {timelineEvents.slice(0, 2).map(event => <TimelineEventCard key={event.eventName} event={event} />)}
                                {timelineEvents.length > 2 && (
                                    <div className="text-center mt-4">
                                        <button 
                                            onClick={() => setIsTimelineModalVisible(true)} 
                                            className="dynamic-button bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md !py-1 !px-4 text-sm"
                                        >
                                            More Info
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : <Loader message="Generating timeline..." />}
                    </div>
                    
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3 text-green-700">Learning Platforms (Free)</h3>
                        <div className="space-y-3">
                            {data.freePlatforms.map(p => <PlatformCard key={p.name} platform={p} color="green" />)}
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3 text-purple-700">Learning Platforms (Paid)</h3>
                        <div className="space-y-3">
                            {data.paidPlatforms.map(p => <PlatformCard key={p.name} platform={p} color="purple" />)}
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h3 className="font-bold text-lg mb-3 text-orange-700">Recommended Books</h3>
                        <div className="space-y-3">
                            {data.books.map(p => <PlatformCard key={p.name} platform={p} color="orange" />)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center border-t border-slate-200 pt-8">
                {!data.id && (
                    <button onClick={handleSaveRoadmap} disabled={isSaving} className="dynamic-button !py-3 !px-8 text-base">
                        {isSaving ? 'Saving...' : 'Save This Path'}
                    </button>
                )}
                <button onClick={onStartOver} className="dynamic-button bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md !py-3 !px-8 text-base ml-4">
                    Start a New Path
                </button>
            </div>
        </div>
    );
};

export default Roadmap;