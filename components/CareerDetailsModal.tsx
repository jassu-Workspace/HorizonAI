import React from 'react';
import { CareerDetails } from '../types';

interface CareerDetailsModalProps {
    details: CareerDetails;
    onMockInterview: () => void;
}

const DetailSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-bold text-lg text-blue-600 mb-2">{title}</h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    </div>
);

const CareerDetailsModal: React.FC<CareerDetailsModalProps> = ({ details, onMockInterview }) => {
    return (
        <div className="text-slate-700 space-y-6">
            <DetailSection title="Key Responsibilities" items={details.key_responsibilities} />
            <DetailSection title="Common Roles" items={details.key_roles} />
            
            <div>
                 <h4 className="font-bold text-lg text-blue-600 mb-2">Salary Expectations (India)</h4>
                 <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500">Fresher</div>
                        <div className="font-semibold text-slate-800">{details.salary_expectations.fresher}</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500">3+ Years</div>
                        <div className="font-semibold text-slate-800">{details.salary_expectations.intermediate}</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500">5+ Years</div>
                        <div className="font-semibold text-slate-800">{details.salary_expectations.expert}</div>
                    </div>
                 </div>
            </div>

            <div>
                <h4 className="font-bold text-lg text-blue-600 mb-2">Top Recruiting Companies</h4>
                <div className="flex flex-wrap gap-2">
                    {details.top_recruiting_companies.map(company => (
                        <span key={company} className="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{company}</span>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-200 pt-6 text-center">
                <button onClick={onMockInterview} className="dynamic-button">
                    Start Mock Interview
                </button>
            </div>
        </div>
    );
};

export default CareerDetailsModal;