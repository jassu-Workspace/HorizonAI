import React from 'react';
import { Suggestion } from '../types';

interface SuggestionsProps {
    suggestions: Suggestion[];
    onSelect: (skillName: string) => void;
    onRefresh: () => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSelect, onRefresh }) => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Your Next Adventure Awaits...</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.name}
                        onClick={() => onSelect(suggestion.name)}
                        className="suggestion-card glass-card p-6 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:-translate-y-2"
                    >
                        <h3 className="text-xl font-bold text-slate-900 pointer-events-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{suggestion.name}</h3>
                        <p className="text-slate-600 mt-2 pointer-events-none">{suggestion.description}</p>
                    </div>
                ))}
            </div>
             <div className="text-center mt-8">
                <button onClick={onRefresh} className="dynamic-button bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md">
                    <ion-icon name="refresh-outline" className="text-xl mr-2"></ion-icon>
                    Refresh Suggestions
                </button>
            </div>
        </div>
    );
};

export default Suggestions;