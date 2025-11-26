import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../types';

interface AiCoachModalProps {
    history: ChatMessage[];
    onSend: (message: string) => void;
    onClose: () => void;
    title: string;
}

const AiCoachModal: React.FC<AiCoachModalProps> = ({ history, onSend, onClose, title }) => {
    const [input, setInput] = useState('');

    useEffect(() => {
        document.getElementById('ai-coach-messages-end')?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="modal-content glass-card p-0 flex flex-col h-[80vh] max-h-[600px] w-[90%] max-w-2xl">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif" }}>{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ion-icon name="close-circle-outline" className="text-2xl"></ion-icon>
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    {history.map((msg, index) => (
                        <div key={index} className={`chat-message mb-4 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`chat-bubble max-w-[80%] py-3 px-4 rounded-3xl break-words ${msg.role === 'user' ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`} style={{ whiteSpace: 'pre-line' }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div id="ai-coach-messages-end" />
                </div>
                <div className="p-4 border-t border-slate-200">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-grow px-4 py-2 bg-slate-100 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 placeholder-slate-400"
                            autoComplete="off"
                        />
                        <button type="submit" className="dynamic-button !p-3 !rounded-full flex items-center justify-center">
                            <ion-icon name="send-outline" className="text-xl"></ion-icon>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiCoachModal;