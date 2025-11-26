import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { saveQuizResult } from '../services/supabaseService';

interface QuizModalProps {
    questions: QuizQuestion[];
    roadmapId?: string; // Pass for tracking
    skill?: string;
    theme?: string;
    weekIndex?: number;
    startedAt?: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ questions, roadmapId, skill, theme, weekIndex, startedAt }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [timeMessage, setTimeMessage] = useState("");

    const handleSelectOption = (qIndex: number, option: string) => {
        if (submitted) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[qIndex] = option;
        setSelectedAnswers(newAnswers);
    };

    const calculatePoints = (baseScore: number, totalQuestions: number) => {
        if (!startedAt || baseScore === 0) return 0;
        
        // Max base points per week is 100 if all answers correct
        const scoreRatio = baseScore / totalQuestions;
        let points = 100 * scoreRatio;

        const startDate = new Date(startedAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Logic:
        // < 7 days: Rushed. 50% points.
        // 7 - 9 days: Optimal. 100% points.
        // > 9 days: Late penalty.
        
        if (diffDays < 7) {
            points = points * 0.5;
            setTimeMessage(`Quiz taken early (Day ${diffDays + 1}). Points halved.`);
        } else if (diffDays >= 7 && diffDays <= 9) {
            // Full points
            setTimeMessage("Perfect Timing! Max XP awarded.");
        } else {
            const daysLate = diffDays - 9;
            const penalty = daysLate * 10;
            points = Math.max(10, points - penalty); // Minimum 10 points if correct
            setTimeMessage(`Late by ${daysLate} days. Penalty applied.`);
        }
        
        return Math.round(points);
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const score = getScore();
        
        let earned = 0;
        if (startedAt && roadmapId) {
            earned = calculatePoints(score, questions.length);
            setPointsEarned(earned);
        }
        
        // Save to DB
        if (skill) {
             await saveQuizResult({
                 skill,
                 weekTheme: theme,
                 score,
                 totalQuestions: questions.length,
                 timestamp: new Date().toISOString(),
                 roadmapId,
                 pointsEarned: earned
             });
        }
        
        // Note: We can't easily update the Roadmap UI state from here (like checking the checkbox)
        // without passing a callback. For now, the points are saved to the profile.
    };

    const getScore = () => {
        return selectedAnswers.reduce((score, answer, index) => {
            return answer === questions[index].correctAnswer ? score + 1 : score;
        }, 0);
    };

    return (
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
                    
                    {pointsEarned > 0 && (
                        <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-xl animate-bounce">
                            <p className="text-amber-800 font-bold text-2xl">+{pointsEarned} XP Earned!</p>
                            <p className="text-amber-700 text-sm">{timeMessage}</p>
                        </div>
                    )}
                    
                    <p className="text-xs text-green-600 mt-2">Result saved to your history.</p>
                </div>
            )}
        </div>
    );
};

export default QuizModal;