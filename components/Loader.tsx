import React from 'react';

interface LoaderProps {
    message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
    const cubeStyle: React.CSSProperties = {
        width: '50px',
        height: '50px',
        transformStyle: 'preserve-3d',
        animation: 'cube-rotate 4s infinite linear',
    };

    const faceStyle: React.CSSProperties = {
        position: 'absolute',
        width: '50px',
        height: '50px',
        border: '2px solid var(--primary-color)',
        background: 'rgba(59, 130, 246, 0.2)',
        boxShadow: '0 0 15px var(--primary-glow)',
    };

    return (
        <div className="text-center p-8 flex flex-col justify-center items-center">
            <div style={{ perspective: '1200px' }}>
                <div style={cubeStyle}>
                    <div style={{ ...faceStyle, transform: 'translateZ(25px)' }}></div>
                    <div style={{ ...faceStyle, transform: 'rotateY(90deg) translateZ(25px)' }}></div>
                    <div style={{ ...faceStyle, transform: 'rotateY(180deg) translateZ(25px)' }}></div>
                    <div style={{ ...faceStyle, transform: 'rotateY(-90deg) translateZ(25px)' }}></div>
                    <div style={{ ...faceStyle, transform: 'rotateX(90deg) translateZ(25px)' }}></div>
                    <div style={{ ...faceStyle, transform: 'rotateX(-90deg) translateZ(25px)' }}></div>
                </div>
            </div>
            {message && <p className="mt-8 text-slate-700 font-medium">{message}</p>}
        </div>
    );
};