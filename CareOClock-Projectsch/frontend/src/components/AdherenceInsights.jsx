import React from 'react';

const AdherenceInsights = ({ adherenceData }) => {
    // Function to generate dynamic insights array from adherence data
    const generateInsights = (adherenceData) => {
        if (!adherenceData) return [];

        const { overall, streak, daily } = adherenceData;
        const adherenceRate = overall?.adherenceRate || 0;
        const currentStreak = streak?.currentStreak || 0;
        const longestStreak = streak?.longestStreak || 0;

        let messages = [];

        // Basic adherence level insight
        if (adherenceRate >= 90 && currentStreak >= 7) {
            messages.push({
                title: "Excellent Adherence!",
                description: "You're maintaining excellent medication compliance.",
                color: "green",
                emoji: "🎉",
            });
        } else if (adherenceRate >= 70) {
            messages.push({
                title: "Good Progress",
                description: "You're doing well, but there's room for improvement.",
                color: "yellow",
                emoji: "⚠️",
            });
        } else {
            messages.push({
                title: "Needs Attention",
                description: "Consider speaking with your doctor about your medication routine.",
                color: "red",
                emoji: "📞",
            });
        }

        // Insights based on streaks
        if (longestStreak > 10) {
            messages.push({
                title: "Strong Streaks",
                description: `Your longest adherence streak is ${longestStreak} days. Keep it going!`,
                color: "blue",
                emoji: "💪",
            });
        }

        // Recent 7-day trend analysis
        if (daily && daily.length >= 7) {
            const last7Days = daily.slice(-7);
            const avgLast7Days =
                last7Days.reduce((sum, d) => sum + (d.adherenceRate || 0), 0) / 7;

            if (avgLast7Days > adherenceRate) {
                messages.push({
                    title: "Declining Adherence",
                    description: "Your recent adherence has slightly declined. Try to improve your routine.",
                    color: "orange",
                    emoji: "🔻",
                });
            } else if (avgLast7Days < adherenceRate) {
                messages.push({
                    title: "Improving Adherence",
                    description: "Your recent adherence is improving. Keep up the great work!",
                    color: "green",
                    emoji: "👍",
                });
            }
        }

        return messages;
    };

    const insights = generateInsights(adherenceData);

    if (!adherenceData) {
        return (
            <div className="card-elderly p-4 text-center text-gray-500">
                No adherence data to display insights.
            </div>
        );
    }

    return (
        <div className="card-elderly p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Adherence Insights</h3>
            <div className="space-y-4">
                {insights.map(({ title, description, color, emoji }, idx) => (
                    <InsightBox key={idx} title={title} description={description} color={color} emoji={emoji} />
                ))}
                <TipsBox />
            </div>
        </div>
    );
};

const InsightBox = ({ title, description, color, emoji }) => (
    <div className={`bg-${color}-50 border border-${color}-200 p-4 rounded-lg`}>
        <div className="flex items-center">
            <span className="text-2xl mr-3">{emoji}</span>
            <div>
                <h4 className={`text-base font-medium text-${color}-800`}>{title}</h4>
                <p className={`text-sm text-${color}-700`}>{description}</p>
            </div>
        </div>
    </div>
);

const TipsBox = () => (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="text-base font-medium text-blue-800 mb-2">Tips for Better Adherence:</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Set daily reminders on your phone</li>
            <li>Use a pill organizer</li>
            <li>Take medicines at the same time daily</li>
            <li>Keep a medication diary</li>
        </ul>
    </div>
);

export default AdherenceInsights;
