import React, { useRef, useState, useEffect } from 'react';

// Declare VANTA as a global variable to satisfy TypeScript
declare global {
    interface Window {
        VANTA: any;
    }
}

interface BackgroundAnimationProps {
    animationType: 'net' | 'globe';
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ animationType }) => {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);

    useEffect(() => {
        // CRITICAL FIX: Strict null checks for the ref and the window.VANTA object.
        // This prevents "Cannot read properties of null" errors if the component unmounts
        // or if the script hasn't loaded yet.
        if (!vantaRef.current || !window.VANTA) return;

        // Cleanup previous effect before creating a new one
        if (vantaEffect) {
            try {
                vantaEffect.destroy();
            } catch (e) {
                console.warn("Error destroying Vanta effect:", e);
            }
        }

        let effect: any;
        try {
            if (animationType === 'net' && window.VANTA.NET) {
                effect = window.VANTA.NET({
                    el: vantaRef.current,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x3b82f6,
                    backgroundColor: 0xf1f5f9,
                    points: 12.00,
                    maxDistance: 18.00,
                    spacing: 16.00
                });
            } else if (animationType === 'globe' && window.VANTA.GLOBE) {
                effect = window.VANTA.GLOBE({
                    el: vantaRef.current,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x3b82f6,
                    color2: 0x2563eb,
                    backgroundColor: 0xf1f5f9,
                    size: 1.2
                });
            }
            setVantaEffect(effect);
        } catch (e) {
            console.error("Failed to initialize Vanta animation", e);
        }

        return () => {
            if (effect) {
                try {
                    effect.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [animationType]); // Only re-run if animationType changes


    return (
        <div ref={vantaRef} id="background-animation" className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none">
        </div>
    );
};

export default BackgroundAnimation;