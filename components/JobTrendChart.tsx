import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { JobTrendData } from '../types';

interface JobTrendChartProps {
    trendData: JobTrendData;
    skillName: string;
}

const JobTrendChart: React.FC<JobTrendChartProps> = ({ trendData, skillName }) => {
    let multiplier: number;
    switch (trendData.trend) {
        case "high growth": multiplier = 1.20; break;
        case "moderate growth": multiplier = 1.10; break;
        case "stable": multiplier = 1.01; break;
        case "declining": multiplier = 0.95; break;
        default: multiplier = 1.05;
    }

    const currentYear = new Date().getFullYear();
    const dataPoints = Array.from({ length: 7 }, (_, i) => {
        const year = currentYear - 4 + i * 2;
        const jobs = trendData.base_jobs * Math.pow(multiplier, i);
        return {
            year: String(year),
            "Job Openings": Math.round(jobs + Math.random() * (jobs * 0.1) - (jobs * 0.05)) // Add some noise
        };
    });

    return (
        <div className="h-64 md:h-80 w-full mt-4">
            <ResponsiveContainer>
                <AreaChart data={dataPoints}>
                    <defs>
                        <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                    <XAxis dataKey="year" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.1)' }} />
                    <Legend wrapperStyle={{ color: '#0f172a' }} />
                    <Area type="monotone" dataKey="Job Openings" stroke="#2563eb" fillOpacity={1} fill="url(#colorJobs)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default JobTrendChart;