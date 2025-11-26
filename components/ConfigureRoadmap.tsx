import React, { useState, useEffect } from 'react';

interface ConfigureRoadmapProps {
    skillName: string;
    onGenerate: (weeks: string, level: string) => void;
    onBack: () => void;
    onTakeQuiz: () => void;
    determinedSkillLevel?: 'Beginner' | 'Intermediate' | 'Expert';
}

const ConfigureRoadmap: React.FC<ConfigureRoadmapProps> = ({ skillName, onGenerate, onBack, onTakeQuiz, determinedSkillLevel }) => {
    const [weeks, setWeeks] = useState(7);
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');

    useEffect(() => {
        if (determinedSkillLevel) {
            setLevel(determinedSkillLevel);
        }
    }, [determinedSkillLevel]);

    const handleGenerate = () => {
        onGenerate(String(weeks), level);
    };

    return (
        <div className="glass-card p-6 md:p-10 mt-8 relative">
            <button onClick={onBack} className="absolute top-4 left-4 text-slate-800 bg-black/5 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/10 transition-colors">
                <ion-icon name="arrow-back-outline" className="text-2xl"></ion-icon>
            </button>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configure Roadmap</h2>
            <p className="text-center text-slate-600 mb-8">
                Customizing path for: <strong className="text-blue-600">{skillName}</strong>
            </p>

            <div className="space-y-10">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3 text-center">Learning Duration</label>
                    <div className="flex flex-wrap justify-center gap-2">
                        {Array.from({ length: 9 }, (_, i) => i + 4).map(w => (
                            <button key={w} onClick={() => setWeeks(w)} className={`pill-button !px-4 !py-2 ${weeks === w ? 'selected' : ''}`}>{w} weeks</button>
                        ))}
                    </div>
                    {weeks >= 8 && (
                        <p className="text-center text-xs text-amber-600 mt-3 animate-pulse">
                            Note: Longer roadmaps ({weeks} weeks) are more detailed and may take more time to generate.
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex justify-center items-center gap-4 mb-3">
                        <label className="block text-sm font-medium text-slate-700">Skill Level</label>
                        <button onClick={onTakeQuiz} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <ion-icon name="help-circle-outline"></ion-icon> Unsure? Take a skill quiz
                        </button>
                    </div>
                    <div className="flex justify-center gap-3">
                        {(['Beginner', 'Intermediate', 'Expert'] as const).map(l => (
                            <button key={l} onClick={() => setLevel(l)} className={`pill-button !px-6 !py-2 ${level === l ? 'selected' : ''}`}>{l}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button onClick={handleGenerate} className="dynamic-button">
                    Generate My Roadmap
                </button>
            </div>
        </div>
    );
};

export default ConfigureRoadmap;