import React from 'react';

interface IntroOverlayProps {
    isVisible: boolean;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ isVisible }) => {
    return (
        <div id="intro-overlay" className={`fixed top-0 left-0 w-full h-full bg-slate-50 z-50 flex flex-col justify-center items-center transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="text-center">
                <h1 className="text-4xl text-slate-900 font-bold tracking-wider intro-anim-h1 opacity-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Horizon AI
                </h1>
                <p className="mt-2 text-lg text-slate-600 font-medium tracking-wide intro-anim-p opacity-0">
                    Your personal AI learning navigator.
                </p>
            </div>
        </div>
    );
};

export default IntroOverlay;