import React from 'react';
import { TimelineEvent } from '../types';

interface AcademicTimelineModalProps {
    events: TimelineEvent[];
    onClose: () => void;
}

const AcademicTimelineModal: React.FC<AcademicTimelineModalProps> = ({ events, onClose }) => {
    
    const groupedEvents = events.reduce((acc, event) => {
        const key = event.eventType || 'General';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(event);
        return acc;
    }, {} as Record<string, TimelineEvent[]>);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div 
                className="w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 md:p-8 flex flex-col text-white relative overflow-hidden border border-slate-700" 
                style={{
                    background: 'radial-gradient(ellipse at top, rgba(15, 23, 42, 0.95), rgba(10, 15, 30, 0.95))',
                    boxShadow: '0 0 40px rgba(0,0,0,0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold flex items-center justify-center gap-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        <ion-icon name="calendar-outline" className="text-blue-400"></ion-icon>
                        Your Academic Timeline
                    </h2>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-8">
                    {Object.entries(groupedEvents).map(([eventType, eventList]) => (
                        <div key={eventType}>
                            <h3 className="text-xl font-bold text-slate-300 mb-3 border-b-2 border-slate-700 pb-2">{eventType}</h3>
                            <div className="space-y-4">
                                {eventList.map(event => (
                                    <div key={event.eventName} className="p-4 rounded-xl" style={{background: 'rgba(255,255,255,0.05)'}}>
                                        <p className="font-bold text-lg text-slate-100">{event.eventName}</p>
                                        <p className="text-sm font-semibold text-blue-400 my-1">{event.estimatedDate}</p>
                                        <p className="text-slate-400 text-sm">{event.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <a 
                        href="https://www.google.com/search?q=India+academic+calendar+for+engineering+and+university+entrance+exams" 
                        target="_blank" rel="noopener noreferrer" 
                        className="dynamic-button w-full sm:w-auto !py-3 !px-8 text-base shadow-blue-500/50 hover:shadow-blue-400/60"
                    >
                        Find Official Dates & More Info
                    </a>
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto py-3 px-8 text-base rounded-full bg-slate-700 hover:bg-slate-600 transition-colors font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcademicTimelineModal;
