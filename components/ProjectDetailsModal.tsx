import React from 'react';
import { ProjectDetails } from '../types';

interface ProjectDetailsModalProps {
    details: ProjectDetails;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ details }) => {
    return (
        <div className="space-y-8">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2 text-lg">
                    <ion-icon name="information-circle"></ion-icon>
                    Overview
                </h3>
                <p className="text-slate-700 leading-relaxed">{details.project_overview}</p>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <ion-icon name="list-circle" className="text-amber-500"></ion-icon>
                    Core Features
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {details.core_features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-300 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
                                <ion-icon name="star" className="text-lg"></ion-icon>
                            </div>
                            <span className="text-slate-700 font-medium group-hover:text-slate-900">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                 <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <ion-icon name="construct" className="text-slate-500"></ion-icon>
                    Tech Stack
                 </h3>
                 <div className="flex flex-wrap gap-3">
                    {details.tech_stack_suggestions.map((tech, index) => (
                        <span key={index} className="px-4 py-2 bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-2 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
                            <ion-icon name="code-slash-outline" className="text-slate-400"></ion-icon>
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsModal;