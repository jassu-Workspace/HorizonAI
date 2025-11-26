import React from 'react';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
            <div className="modal-content glass-card p-6 md:p-8 w-[90%] max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {title && <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>{title}</h2>}
                {children}
                <div className="text-center mt-6">
                    <button onClick={onClose} className="dynamic-button bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-sm hover:shadow-md !py-2 !px-6">Close</button>
                </div>
            </div>
        </div>
    );
};

export default Modal;