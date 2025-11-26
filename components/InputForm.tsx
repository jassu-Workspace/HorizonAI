import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface InputFormProps {
    existingProfile: UserProfile;
    onSubmit: (profile: UserProfile) => void;
    title: string;
}

const skillExamples = ["baking sourdough", "graphic design", "playing guitar", "data analysis with Python", "calligraphy"];
const interestExamples = ["true crime podcasts", "sci-fi movies", "mountain hiking", "competitive gaming", "classic literature"];

const InputForm: React.FC<InputFormProps> = ({ existingProfile, onSubmit, title }) => {
    const [skills, setSkills] = useState('');
    const [interests, setInterests] = useState('');
    
    const [skillExample, setSkillExample] = useState(skillExamples[0]);
    const [interestExample, setInterestExample] = useState(interestExamples[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSkillExample(prev => skillExamples[(skillExamples.indexOf(prev) + 1) % skillExamples.length]);
            setInterestExample(prev => interestExamples[(interestExamples.indexOf(prev) + 1) % interestExamples.length]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Merge existing profile data (Academic info) with new Roadmap specific inputs
        const profile: UserProfile = { 
            ...existingProfile,
            skills, 
            interests
        };
        
        onSubmit(profile);
    };
    
    return (
         <div className="glass-card p-6 md:p-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
            <p className="text-center text-slate-500 mb-8">What do you want to master next?</p>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6">
                    <div>
                        <label htmlFor="skills-input" className="block text-sm font-medium text-slate-700 mb-2">Target Skill to Learn <span className="text-slate-500">(for this roadmap)</span></label>
                        <input id="skills-input" type="text" required value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g., Python, public speaking" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder-slate-400"/>
                        <div className="mt-1 text-xs text-slate-500 h-4">e.g., <span className="transition-opacity duration-500 ease-in-out">{skillExample}</span></div>
                    </div>
                    <div>
                        <div className="flex justify-between items-baseline">
                             <label htmlFor="interests-input" className="block text-sm font-medium text-slate-700 mb-2">My General Interests</label>
                             <a href="#" className="text-xs text-blue-600 hover:underline flex items-center gap-1 opacity-75">
                                <ion-icon name="sparkles-outline"></ion-icon> Take a quiz
                             </a>
                        </div>
                        <input id="interests-input" type="text" required value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g., video games, ancient history" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder-slate-400"/>
                         <div className="mt-1 text-xs text-slate-500 h-4">e.g., <span className="transition-opacity duration-500 ease-in-out">{interestExample}</span></div>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <button type="submit" className="dynamic-button">
                        Discover Path
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InputForm;