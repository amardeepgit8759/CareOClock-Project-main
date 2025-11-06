// frontend/src/components/SkeletonLoader.jsx
import React from 'react';

const SkeletonLoader = ({ lines = 3, height = 'h-4' }) => {
    return (
        <div className="animate-pulse">
            <div className="space-y-3">
                {Array.from({ length: lines }, (_, i) => (
                    <div key={i} className={`bg-gray-300 rounded ${height} w-full`}></div>
                ))}
            </div>
        </div>
    );
};

export const CardSkeleton = () => (
    <div className="card-elderly animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
        </div>
    </div>
);

export const ButtonSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-12 bg-gray-300 rounded-lg w-32"></div>
    </div>
);

export default SkeletonLoader;
