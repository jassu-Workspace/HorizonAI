import React, { useState, useEffect } from 'react';
import { UserProfile, LearningStyle, AcademicLevel, Stream, FocusArea } from '../types';
import { saveProfileFromOnboarding } from '../services/supabaseService';

interface OnboardingProps {
    onComplete: (profileData: Partial<UserProfile>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    // Step 1
    const [fullName, setFullName] = useState('');
    // Step 2
    const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('Graduation');
    const [stream, setStream] = useState<Stream>('Engineering');
    // Step 3
    const [focusArea, setFocusArea] = useState<FocusArea>('General');
    const [learningStyle, setLearningStyle] = useState<LearningStyle>('Balanced');
    // Step 4
    const [previousPerformance, setPreviousPerformance] = useState('');
    const [interestedSubjects, setInterestedSubjects] = useState('');
    // New state for detailed history
    const [previousEducationType, setPreviousEducationType] = useState<'Class 12' | 'Diploma'>('Class 12');
    const [class12Stream, setClass12Stream] = useState<string>('Science');
    const [class12Performance, setClass12Performance] = useState('');
    const [diplomaPerformance, setDiplomaPerformance] = useState('');
    const [class10Performance, setClass10Performance] = useState('');

    const [streamOptions, setStreamOptions] = useState<Stream[]>(['Engineering', 'Science', 'Commerce', 'Arts', 'Medical']);

    useEffect(() => {
        if (academicLevel === 'Class 12' || academicLevel === 'Class 10') {
            setStreamOptions(['Science', 'Commerce', 'Biology', 'Arts', 'General']);
            setStream('Science');
        } else if (academicLevel === 'Diploma / Polytechnic') {
             setStreamOptions(['Diploma Engineering', 'Commerce', 'Arts']);
             setStream('Diploma Engineering');
        } else { // Graduation
            setStreamOptions(['Engineering', 'Science', 'Commerce', 'Arts', 'Medical']);
            setStream('Engineering');
        }
    }, [academicLevel]);
    
    const stepTitles = ["Your Name", "Academics", "Learning Focus", "Academic History"];

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(s => s - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const profileData: UserProfile = {
            fullName,
            academicLevel,
            stream,
            learningStyle,
            focusArea,
            previousPerformance,
            interestedSubjects,
            class10Performance,
            class12Stream: previousEducationType === 'Class 12' ? class12Stream : undefined,
            class12Performance: previousEducationType === 'Class 12' ? class12Performance : undefined,
            diplomaPerformance: previousEducationType === 'Diploma' ? diplomaPerformance : undefined,
            skills: '',
            interests: ''
        };

        try {
            await saveProfileFromOnboarding(profileData);
        } catch (err) {
            console.error("Failed to save profile", err);
        }
        
        onComplete(profileData);
    };

    const PillGroup: React.FC<{label: string, options: string[], selected: string, onSelect: (value: any) => void, className?: string}> = ({label, options, selected, onSelect, className}) => (
        <div className={className}>
            <label className="block text-sm font-medium text-slate-700 mb-3 text-center">{label}</label>
            <div className="flex flex-wrap justify-center gap-2">
                {options.map(opt => (
                     <button type="button" key={opt} onClick={() => onSelect(opt)} className={`pill-button ${selected === opt ? 'selected' : ''}`}>{opt}</button>
                ))}
            </div>
        </div>
    );
    
    const ProgressBar = () => (
        <div className="flex items-center justify-center mb-8">
            {stepTitles.map((title, index) => {
                const stepIndex = index + 1;
                const isActive = step === stepIndex;
                const isCompleted = step > stepIndex;

                return (
                    <React.Fragment key={stepIndex}>
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isActive ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-100 border-slate-300 text-slate-400'
                            }`}>
                                <ion-icon name={isCompleted ? "checkmark-done" : (isActive ? "pencil" : "lock-closed")}></ion-icon>
                            </div>
                            <p className={`text-xs mt-2 font-semibold transition-colors ${isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{title}</p>
                        </div>
                        {stepIndex < totalSteps && (
                            <div className={`flex-auto h-1 mx-2 transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    const renderAcademicHistoryInputs = () => {
        const showClass10 = academicLevel !== 'Class 10';
        const showClass12OrDiploma = academicLevel === 'Graduation' || academicLevel === 'Diploma / Polytechnic';

        return (
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                        Recent Score / Performance
                        <span className="block font-normal text-xs text-slate-500">
                            {academicLevel === 'Graduation' ? '(Current Semester CGPA / %)' : `(${academicLevel} Board %)`}
                        </span>
                    </label>
                    <input type="text" required value={previousPerformance} onChange={(e) => setPreviousPerformance(e.target.value)} placeholder="e.g. 8.5 or 85%" className="w-full text-center px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                        Strongest Subjects
                            <span className="block font-normal text-xs text-slate-500">(Separate with commas)</span>
                    </label>
                    <input type="text" required value={interestedSubjects} onChange={(e) => setInterestedSubjects(e.target.value)} placeholder={academicLevel === 'Graduation' ? "e.g. Data Structures, OS" : "e.g. Math, Physics"} className="w-full text-center px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
                </div>

                {showClass12OrDiploma && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-3 text-center">Previous Qualification</label>
                         <div className="flex justify-center gap-4 mb-4">
                            <button type="button" onClick={() => setPreviousEducationType('Class 12')} className={`pill-button !px-6 ${previousEducationType === 'Class 12' ? 'selected' : ''}`}>Class 12</button>
                            <button type="button" onClick={() => setPreviousEducationType('Diploma')} className={`pill-button !px-6 ${previousEducationType === 'Diploma' ? 'selected' : ''}`}>Diploma</button>
                        </div>
                        {previousEducationType === 'Class 12' ? (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Class 12 Stream</label>
                                    <select value={class12Stream} onChange={e => setClass12Stream(e.target.value)} className="w-full p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        {['Science', 'Commerce', 'Arts', 'Biology'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Class 12 Performance</label>
                                    <input type="text" value={class12Performance} onChange={e => setClass12Performance(e.target.value)} placeholder="e.g. 90%" className="w-full p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fadeIn">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Diploma Performance</label>
                                <input type="text" value={diplomaPerformance} onChange={e => setDiplomaPerformance(e.target.value)} placeholder="e.g. 8.8 CGPA or 88%" className="w-full p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>
                        )}
                    </div>
                )}

                {showClass10 && (
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                         <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Class 10 Performance</label>
                         <input type="text" value={class10Performance} onChange={e => setClass10Performance(e.target.value)} placeholder="e.g. 95%" className="w-full text-center p-2 border rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                     </div>
                )}
            </div>
        );
    }


    return (
        <div className="glass-card p-6 md:p-10 max-w-3xl mx-auto mt-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Setup Your Profile</h2>
            <p className="text-center text-slate-600 mb-8">Let's personalize your learning experience.</p>
            
            <ProgressBar />
            
            <form onSubmit={handleSubmit} className="mt-8">
                <div className="min-h-[350px]">
                    {step === 1 && (
                        <div className="animate-fadeIn">
                            <h3 className="font-semibold text-center text-xl text-slate-800 mb-6">First, what should we call you?</h3>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                            <input type="text" autoFocus required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 bg-slate-100/80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-slate-900"/>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="animate-fadeIn space-y-8">
                            <PillGroup label="What is your current academic level?" options={['Class 10', 'Class 12', 'Diploma / Polytechnic', 'Graduation']} selected={academicLevel} onSelect={setAcademicLevel} />
                            <PillGroup label="And your primary stream or field?" options={streamOptions} selected={stream} onSelect={setStream} />
                        </div>
                    )}
                    {step === 3 && (
                        <div className="animate-fadeIn space-y-8">
                             <PillGroup 
                                label="What's your main goal right now?"
                                options={['General', 'NCVET/NSQF Aligned', 'Govt. Job Exams', 'Higher Education Abroad', 'Startup / Entrepreneurship', 'Freelancing & Gigs']} 
                                selected={focusArea} 
                                onSelect={setFocusArea}
                            />
                             <PillGroup 
                                label="How do you prefer to learn?"
                                options={['Balanced', 'Visual (Videos, Diagrams)', 'Practical (Hands-on)', 'Theoretical (Reading)']} 
                                selected={learningStyle} 
                                onSelect={setLearningStyle}
                            />
                        </div>
                    )}
                     {step === 4 && (
                        <div className="animate-fadeIn">
                            <h3 className="font-semibold text-center text-xl text-slate-800 mb-6">Tell us about your academic history...</h3>
                            {renderAcademicHistoryInputs()}
                        </div>
                    )}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
                    <button 
                        type="button" 
                        onClick={handleBack} 
                        className={`dynamic-button bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        Back
                    </button>
                     {step < totalSteps ? (
                        <button 
                            type="button" 
                            onClick={handleNext} 
                            className="dynamic-button"
                        >
                            Next
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            className="dynamic-button"
                        >
                            Complete Profile & Start
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Onboarding;