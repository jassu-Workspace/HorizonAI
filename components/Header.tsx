import React, { useState } from 'react';
import { signOut } from '../services/supabaseService';

interface HeaderProps {
    language: string;
    onLanguageChange: (lang: string) => void;
    title: string;
    subtitle: string;
    onToggleAnimation: () => void;
    currentAnimation: 'net' | 'globe';
    onResumeSession: () => void;
    hasSavedSession: boolean;
    onShowDashboard: () => void;
    showDashboardButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, title, subtitle, onToggleAnimation, currentAnimation, onResumeSession, hasSavedSession, onShowDashboard, showDashboardButton }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const languages = ['English', 'हिन्दी', 'தமிழ்', 'Español', 'Français'];

    const handleSignOut = async () => {
        await signOut();
        window.location.reload(); // Reload to reset state to Auth screen
    };

    return (
        <header className="text-center p-6 mb-8 relative">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {title}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
                {subtitle}
            </p>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                 <button 
                    onClick={onToggleAnimation}
                    className="flex items-center justify-center w-10 h-10 text-lg font-medium text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 transition-colors"
                    title={`Switch to ${currentAnimation === 'net' ? 'Globe' : 'Net'} background`}
                >
                    <ion-icon name={currentAnimation === 'net' ? 'globe-outline' : 'grid-outline'}></ion-icon>
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white/50 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 transition-colors h-10"
                    >
                        <ion-icon name="language-outline"></ion-icon>
                        <span>{language}</span>
                        <ion-icon name="chevron-down-outline" className={`text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></ion-icon>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-20 py-1 border border-slate-200" onMouseLeave={() => setDropdownOpen(false)}>
                            {languages.map(lang => (
                                <a 
                                    href="#" 
                                    key={lang} 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onLanguageChange(lang);
                                        setDropdownOpen(false);
                                    }} 
                                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    {lang}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute top-4 left-4 flex gap-2">
                 {showDashboardButton && (
                     <button onClick={onShowDashboard} className="text-slate-700 hover:text-blue-600 transition-colors text-sm flex items-center gap-1 border border-slate-200 rounded-full px-3 py-1 bg-white/80 font-medium shadow-sm">
                         <ion-icon name="grid-outline"></ion-icon> My Dashboard
                     </button>
                 )}
                 <button onClick={handleSignOut} className="text-slate-500 hover:text-red-600 transition-colors text-sm flex items-center gap-1 border border-slate-200 rounded-full px-3 py-1 bg-white/50">
                     <ion-icon name="log-out-outline"></ion-icon> Sign Out
                 </button>
            </div>
        </header>
    );
};

export default Header;