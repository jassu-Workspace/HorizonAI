import React, { useEffect, useState } from 'react';
import { RoadmapData, UserProfile, Stream, AcademicLevel, FocusArea, LearningStyle } from '../types';
import { getPastRoadmaps, getCurrentProfile, updateProfileWithLimit, setRoadmapAsActive } from '../services/supabaseService';
import { Loader } from './Loader';

interface DashboardProps {
    onSelectRoadmap: (data: RoadmapData) => void;
    onNewRoadmap: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectRoadmap, onNewRoadmap }) => {
    const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editMessage, setEditMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
    
    // Editable profile state
    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch slightly more to ensure we get the active one plus the 3 saved ones
            const [maps, userProfile] = await Promise.all([
                getPastRoadmaps(5), 
                getCurrentProfile()
            ]);
            setRoadmaps(maps);
            setProfile(userProfile);
            setFormData(userProfile || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const activeRoadmap = roadmaps.find(map => map.status === 'active');
    // Strict Limit: Only show top 3 saved roadmaps
    const savedRoadmaps = roadmaps.filter(map => map.status !== 'active').slice(0, 3);

    const handleEditToggle = () => {
        if (!isEditingProfile) {
            setFormData(profile || {});
            setEditMessage(null);
        }
        setIsEditingProfile(!isEditingProfile);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        const result = await updateProfileWithLimit({ ...profile, ...formData } as UserProfile);
        if (result.success) {
            setEditMessage({ type: 'success', text: "Profile updated successfully!" });
            setIsEditingProfile(false);
            fetchData(); 
        } else {
            setEditMessage({ type: 'error', text: result.message || "Failed to update" });
        }
    };

    const initiateActivation = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPendingActivationId(id);
        setShowConfirmModal(true);
    };

    const confirmActivation = async () => {
        if (pendingActivationId) {
            await setRoadmapAsActive(pendingActivationId);
            setShowConfirmModal(false);
            setPendingActivationId(null);
            fetchData();
        }
    };

    if (loading) return <Loader message="Loading your learning dashboard..." />;

    return (
        <div className="container mx-auto max-w-6xl px-4 relative">
            <div className="flex flex-col md:flex-row gap-8">
                {/* LEFT COLUMN: Profile Card */}
                <div className="w-full md:w-1/3">
                    <div className="glass-card p-6 sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <ion-icon name="person-circle-outline" className="text-2xl text-blue-600"></ion-icon>
                                My Profile
                            </h3>
                            <button onClick={handleEditToggle} className="text-sm text-blue-600 hover:underline">
                                {isEditingProfile ? 'Cancel' : 'Edit Details'}
                            </button>
                        </div>

                        {editMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm border ${editMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {editMessage.text}
                            </div>
                        )}

                        {isEditingProfile ? (
                            <form onSubmit={handleProfileSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                                    <input type="text" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
                                        <select value={formData.academicLevel} onChange={e => setFormData({...formData, academicLevel: e.target.value as AcademicLevel})} className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option>Class 10</option><option>Class 12</option><option>Diploma / Polytechnic</option><option>Graduation</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Stream</label>
                                        <select value={formData.stream} onChange={e => setFormData({...formData, stream: e.target.value as Stream})} className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            {['Engineering', 'Science', 'Commerce', 'Arts', 'Medical', 'Diploma Engineering', 'Biology', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Focus Area</label>
                                    <select value={formData.focusArea} onChange={e => setFormData({...formData, focusArea: e.target.value as FocusArea})} className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                         {['General', 'NCVET/NSQF Aligned', 'Govt. Job Exams', 'Higher Education Abroad', 'Startup / Entrepreneurship', 'Freelancing & Gigs'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Learning Style</label>
                                    <select value={formData.learningStyle} onChange={e => setFormData({...formData, learningStyle: e.target.value as LearningStyle})} className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                         {['Balanced', 'Visual (Videos, Diagrams)', 'Practical (Hands-on)', 'Theoretical (Reading)'].map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>

                                 <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Performance</label>
                                        <input type="text" value={formData.previousPerformance || ''} onChange={e => setFormData({...formData, previousPerformance: e.target.value})} placeholder="e.g. 85%" className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                     <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Subjects</label>
                                        <input type="text" value={formData.interestedSubjects || ''} onChange={e => setFormData({...formData, interestedSubjects: e.target.value})} placeholder="e.g. Math" className="w-full p-2 border rounded bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                <button type="submit" className="dynamic-button w-full !py-2 mt-2 text-sm">Save Changes</button>
                                <p className="text-xs text-slate-500 text-center mt-2">Note: You can only edit once per 24 hours.</p>
                            </form>
                        ) : (
                            <div className="space-y-4 text-sm text-slate-700">
                                <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 to-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm">
                                    <div>
                                        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Total XP</p>
                                        <p className="text-3xl font-extrabold text-amber-600 leading-none">{profile?.totalPoints || 0}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                                        <ion-icon name="trophy" className="text-2xl text-amber-600"></ion-icon>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Name</p>
                                    <p className="font-semibold text-base">{profile?.fullName || 'Scholar'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Academic Level</p>
                                        <p className="font-medium">{profile?.academicLevel}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Stream</p>
                                        <p className="font-medium">{profile?.stream}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Focus Area</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Array.isArray(profile?.focusArea) 
                                            ? profile?.focusArea.map((f: string) => <span key={f} className="bg-slate-100 px-2 py-0.5 rounded-full text-xs border border-slate-200">{f}</span>) 
                                            : <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs border border-slate-200">{profile?.focusArea}</span>
                                        }
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Learning Style</p>
                                    <p className="font-medium">{profile?.learningStyle}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Top Subjects</p>
                                        <p className="font-medium">{profile?.interestedSubjects || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Recent Score</p>
                                        <p className="font-medium">{profile?.previousPerformance || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Roadmaps */}
                <div className="w-full md:w-2/3 space-y-8">
                    {/* ACTIVE ROADMAP SECTION */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ion-icon name="flame" className="text-amber-500"></ion-icon>
                            Currently Learning
                        </h2>
                        {activeRoadmap ? (
                            <div className="glass-card p-6 border-l-4 border-amber-500 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <ion-icon name="ribbon" className="text-9xl text-amber-500"></ion-icon>
                                </div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h3 className="text-3xl font-bold text-slate-900">{activeRoadmap.skill}</h3>
                                        <p className="text-slate-600 font-medium mt-1">{activeRoadmap.roadmap.length} Weeks Journey</p>
                                    </div>
                                    <button onClick={() => onSelectRoadmap(activeRoadmap)} className="dynamic-button !py-2 !px-6 text-sm">
                                        Continue Journey
                                    </button>
                                </div>
                                
                                {/* Active Roadmap Progress Bar */}
                                <div className="mb-2 relative z-10 bg-white/50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between text-sm font-bold mb-2 text-slate-700">
                                        <span>Current Progress</span>
                                        <span>{Math.round(activeRoadmap.progress || 0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-4">
                                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-4 rounded-full shadow-md transition-all duration-1000 ease-out flex items-center justify-end pr-2" style={{ width: `${activeRoadmap.progress || 0}%` }}>
                                            { (activeRoadmap.progress || 0) > 10 && <span className="text-[10px] text-white font-bold">{Math.round(activeRoadmap.progress || 0)}%</span> }
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-3 flex justify-between items-center">
                                        <span>Started: {activeRoadmap.created_at ? new Date(activeRoadmap.created_at).toLocaleDateString() : 'Recently'}</span>
                                        <span className="font-semibold text-slate-700 bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                                            Next: {activeRoadmap.roadmap.find(w => !w.completed)?.theme || "All completed! 🎉"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-8 text-center border-dashed border-2 border-slate-300 flex flex-col items-center justify-center min-h-[200px]">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <ion-icon name="trail-sign-outline" className="text-3xl text-slate-400"></ion-icon>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Path Set</h3>
                                <p className="text-slate-500 mb-6 max-w-md">Select a saved roadmap below to "Set as Active" or start a new learning journey.</p>
                                <button onClick={onNewRoadmap} className="dynamic-button !py-2 !px-6">Start New Path</button>
                            </div>
                        )}
                    </div>

                    {/* SAVED ROADMAPS SECTION */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Saved Roadmaps <span className="text-xs font-normal text-slate-500 ml-1">(Limit 3)</span></h2>
                            <button onClick={onNewRoadmap} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <ion-icon name="add-outline"></ion-icon> Create New
                            </button>
                        </div>
                        
                        {savedRoadmaps.length === 0 ? (
                            <p className="text-slate-500 italic text-center py-8 bg-white/50 rounded-xl border border-dashed border-slate-200">No other saved roadmaps found.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {savedRoadmaps.map((map) => (
                                    <div 
                                        key={map.id} 
                                        className="glass-card p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative flex flex-col h-full"
                                        onClick={() => onSelectRoadmap(map)}
                                    >
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{map.skill}</h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Created: {map.created_at ? new Date(map.created_at).toLocaleDateString() : 'Recently'}
                                            </p>
                                            
                                            {/* Saved Roadmap Progress Bar */}
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-500 font-medium">{map.roadmap.length} Weeks</span>
                                                    <span className="text-green-600 font-bold">{Math.round(map.progress || 0)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${map.progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">Click to view</span>
                                            <button 
                                                onClick={(e) => map.id && initiateActivation(e, map.id)}
                                                className="text-xs font-bold text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-colors border border-transparent hover:border-amber-200"
                                            >
                                                Set as Active
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowConfirmModal(false)}>
                    <div className="glass-card p-6 max-w-sm w-full bg-white/95 border border-slate-200 shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <ion-icon name="alert-circle-outline" className="text-amber-500 text-2xl"></ion-icon>
                            Change Active Roadmap?
                        </h3>
                        <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                            This will set <span className="font-bold text-blue-600">{roadmaps.find(r => r.id === pendingActivationId)?.skill}</span> as your main focus. 
                            <br/><br/>
                            Your current active roadmap will be moved to your saved list. Progress is always saved.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmActivation}
                                className="px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 shadow-md transition-all transform hover:scale-105 text-sm"
                            >
                                Yes, Switch Focus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;