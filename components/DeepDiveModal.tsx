import React from 'react';

interface DeepDiveModalProps {
    data: {
        what_is_it: string;
        why_useful: string;
        why_learn:string;
    };
}

const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ data }) => {
    return (
        <div className="text-slate-700 space-y-4">
            <div><strong className="text-slate-900">What is it?</strong><br />{data.what_is_it}</div>
            <div><strong className="text-slate-900">Why is it useful?</strong><br />{data.why_useful}</div>
            <div><strong className="text-slate-900">Why learn it?</strong><br />{data.why_learn}</div>
        </div>
    );
};

export default DeepDiveModal;