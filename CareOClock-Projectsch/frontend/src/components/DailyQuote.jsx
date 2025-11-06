// frontend/src/components/DailyQuote.jsx
import React, { useState, useEffect } from 'react';

const DailyQuote = () => {
    const [quote, setQuote] = useState(null);

    useEffect(() => {
        const calculateQuote = () => {
            const today = new Date();
            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const quoteIndex = dayOfYear % quotes.length;
            setQuote(quotes[quoteIndex]);
        };

        calculateQuote();

        // Calculate milliseconds until next midnight
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = nextMidnight - now;

        const timerId = setTimeout(() => {
            calculateQuote();
            // Optionally set an interval here to keep updating daily if user keeps app open long term
        }, msUntilMidnight);

        return () => clearTimeout(timerId);
    }, []);


    const quotes = [
        {
            text: "The secret of getting ahead is getting started.",
            author: "Mark Twain"
        },
        {
            text: "Health is a state of complete harmony of the body, mind, and spirit.",
            author: "B.K.S. Iyengar"
        },
        {
            text: "Take care of your body. It's the only place you have to live.",
            author: "Jim Rohn"
        },
        {
            text: "The groundwork for all happiness is good health.",
            author: "Leigh Hunt"
        },
        {
            text: "Your body is your temple. Take care of it and it will take care of you.",
            author: "Anonymous"
        },
        {
            text: "Health is not valued till sickness comes.",
            author: "Thomas Fuller"
        },
        {
            text: "A healthy outside starts from the inside.",
            author: "Robert Urich"
        }
    ];

    useEffect(() => {
        // Get quote based on current date to ensure same quote for the day
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const quoteIndex = dayOfYear % quotes.length;
        setQuote(quotes[quoteIndex]);
    }, []);

    if (!quote) {
        return (
            <div className="card-elderly animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
        );
    }

    return (
        <div className="card-elderly bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-blue-500">
            <div className="flex items-start">
                <div className="text-blue-500 mr-4 mt-1">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-elderly-lg font-semibold text-gray-800 mb-3">
                        Daily Inspiration
                    </h3>
                    <blockquote className="text-elderly-base text-gray-700 italic mb-3 leading-relaxed">
                        "{quote.text}"
                    </blockquote>
                    <cite className="text-elderly-base font-medium text-blue-600">
                        — {quote.author}
                    </cite>
                </div>
            </div>
        </div>
    );
};

export default DailyQuote;
