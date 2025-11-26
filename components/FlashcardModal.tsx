import React, { useState } from 'react';
import { Flashcard } from '../types';

interface FlashcardModalProps {
    flashcards: Flashcard[];
}

const FlashcardItem: React.FC<{ card: Flashcard }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div className="flashcard h-[150px] cursor-pointer" style={{ perspective: '1000px' }} onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`flashcard-inner relative w-full h-full transition-transform duration-500 ${isFlipped ? 'is-flipped' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                <div className="flashcard-front absolute w-full h-full flex justify-center items-center p-4 rounded-2xl border border-slate-200 text-center font-bold bg-white text-slate-800">
                    {card.term}
                </div>
                <div className="flashcard-back absolute w-full h-full flex justify-center items-center p-4 rounded-2xl border border-blue-300 text-center text-sm bg-blue-100 text-slate-800">
                    {card.definition}
                </div>
            </div>
        </div>
    );
};

const FlashcardModal: React.FC<FlashcardModalProps> = ({ flashcards }) => {
    return (
        <div>
            <p className="text-center text-slate-500 mb-6">Click a card to flip it over.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {flashcards.map(card => <FlashcardItem key={card.term} card={card} />)}
            </div>
        </div>
    );
};

export default FlashcardModal;