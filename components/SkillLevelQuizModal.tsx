import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Loader } from './Loader';
import { saveQuizResult } from '../services/supabaseService';

interface SkillLevelQuizModalProps {
    questions: QuizQuestion[];
    onComplete: (level: 'Beginner' | 'Intermediate' | 'Expert') => void;
    onClose: () => void;
    title: string;
    skillName: string; // Needed for saving
}

const SkillLevelQuizModal: React.FC<SkillLevelQuizModalProps> = ({ questions, onComplete, onClose, title, skillName }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleSelectOption = (qIndex: number, option: string) => {
        if (submitted) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[qIndex] = option;
        setSelectedAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const score = getScore();
        
        // Save assessment result
        await saveQuizResult({
             skill: skillName,
             weekTheme: 'Skill Assessment',
             score,
             totalQuestions: questions.length,
             timestamp: new Date().toISOString()
         });
    };
    
    const getScore = () => {
        return selectedAnswers.reduce((score, answer, index) => {
            return answer === questions[index].correctAnswer ? score + 1 : score;
        }, 0);
    };
    
    const getLevelFromScore = (score: number, total: number): 'Beginner' | 'Intermediate' | 'Expert' => {
        const percentage = (score / total) * 100;
        if (percentage <= 33) return 'Beginner';
        if (percentage <= 67) return 'Intermediate';
        return 'Expert';
    };

    const handleFinish = () => {
        const score = getScore();
        const level = getLevelFromScore(score, questions.length);
        onComplete(level);
    };

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="modal-content glass-card p-6 md:p-8 w-[90%] max-w-2xl">
                    <Loader message="Generating assessment quiz..." />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
            <div className="modal-content glass-card p-6 md:p-8 w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>{title}</h2>
                
                <div>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="mb-6">
                            <p className="font-semibold text-slate-800 mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map(opt => {
                                    const isSelected = selectedAnswers[qIndex] === opt;
                                    let buttonClass = "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700";
                                    if (submitted) {
                                        if (opt === q.correctAnswer) {
                                            buttonClass = "bg-green-200 border-green-400 text-green-800 font-semibold";
                                        } else if (isSelected && opt !== q.correctAnswer) {
                                            buttonClass = "bg-red-200 border-red-400 text-red-800";
                                        }
                                    } else if (isSelected) {
                                        buttonClass = "bg-blue-500 border-blue-500 text-white font-semibold";
                                    }
                                    return (
                                    <button key={opt} onClick={() => handleSelectOption(qIndex, opt)} className={`block w-full text-left p-3 rounded-lg text-sm transition-colors ${buttonClass}`} disabled={submitted}>
                                        {opt}
                                    </button>
                                )})}
                            </div>
                        </div>
                    ))}
                    {!submitted && (
                        <div className="text-center mt-6">
                            <button onClick={handleSubmit} className="dynamic-button">Submit Answers</button>
                        </div>
                    )}
                    {submitted && (
                        <div className="text-center mt-6 p-4 bg-slate-100 rounded-lg">
                            <p className="font-bold text-xl text-slate-800">You scored {getScore()} out of {questions.length}!</p>
                            <p className="mt-2 text-slate-600">Based on your score, we suggest the <strong className="text-blue-600">{getLevelFromScore(getScore(), questions.length)}</strong> level for you.</p>
                            <button onClick={handleFinish} className="dynamic-button mt-4">Continue</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SkillLevelQuizModal;