import React from 'react';
import { Project } from '../types';

interface ProjectModalProps {
    projects: Project[];
    onSelectProject: (title: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ projects, onSelectProject }) => {
    return (
        <div>
            <p className="text-center text-slate-500 mb-6">Click on a project to see a detailed brief.</p>
            <div className="space-y-4">
                {projects.map(project => (
                    <button 
                        key={project.title} 
                        onClick={() => onSelectProject(project.title)}
                        className="w-full text-left p-4 rounded-lg bg-slate-50 border border-slate-200 border-l-4 border-amber-500 hover:bg-amber-50 transition-colors"
                    >
                        <h4 className="font-bold text-amber-700">{project.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProjectModal;