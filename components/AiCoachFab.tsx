import React, { useState, useEffect } from 'react';

interface AiCoachFabProps {
    onOpen: () => void;
}

const AiCoachFab: React.FC<AiCoachFabProps> = ({ onOpen }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <button
            onClick={onOpen}
            id="ai-coach-fab"
            className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex justify-center items-center z-40 border-none cursor-pointer transition-all duration-500 ease-in-out
                ${isVisible ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' : 'translate-y-20 scale-50 opacity-0 pointer-events-none'}`}
            style={{
                background: 'linear-gradient(90deg, var(--primary-glow), var(--secondary-glow))',
                boxShadow: '0 0 25px rgba(0, 198, 255, 0.6)'
            }}
        >
            <span className="text-3xl transition-transform duration-300 ease-in-out group-hover:rotate-20 group-hover:scale-110">💬</span>
        </button>
    );
};

export default AiCoachFab;