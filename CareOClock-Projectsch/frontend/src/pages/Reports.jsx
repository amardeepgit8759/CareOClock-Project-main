import React, { useState, useEffect } from 'react';
import { intakeApi } from '../api/intakeApi';
import { healthApi } from '../api/healthApi';
import ChartComponent from '../components/ChartComponent';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const [adherenceData, setAdherenceData] = useState(null);
    const [healthTrends, setHealthTrends] = useState([]);
    const [timeRange, setTimeRange] = useState(30);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    // Wait for user data to load before fetching reports
    useEffect(() => {
        if (user) {
            fetchReportData(user.id);
        }
    }, [user]);

    const fetchReportData = async (patientId) => {
        try {
            setLoading(true);
            const [adherenceRes, healthRes] = await Promise.all([
                intakeApi.getAdherenceStats(patientId, timeRange),
                healthApi.getHealthTrends(patientId, timeRange),
            ]);

            setAdherenceData(adherenceRes.data);

            const rawTrends = Array.isArray(healthRes.data.trends) ? healthRes.data.trends : [];
            const normalizedTrends = rawTrends
                .filter(
                    (r) =>
                        r.date &&
                        r.bloodPressure?.systolic !== undefined &&
                        r.bloodPressure?.diastolic !== undefined &&
                        r.bloodSugar?.value !== undefined
                )
                .map((record) => ({
                    ...record,
                    date: new Date(record.date).toLocaleDateString(),
                    bloodPressure: {
                        systolic: Number(record.bloodPressure.systolic),
                        diastolic: Number(record.bloodPressure.diastolic),
                    },
                    bloodSugar: {
                        value: Number(record.bloodSugar.value),
                    },
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setHealthTrends(normalizedTrends);

            const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();
            const endDate = new Date().toISOString();
            const dailyResponse = await intakeApi.getDailyAdherenceStats(patientId, startDate, endDate);

            setAdherenceData((prev) => ({
                ...prev,
                daily: dailyResponse.data.daily || [],
            }));
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const adherenceChartData = (Array.isArray(adherenceData?.daily) ? adherenceData.daily : [])
        .filter((day) => day.date && day.adherenceRate !== undefined && day.adherenceRate !== null)
        .map((day) => ({
            date: new Date(day.date).toLocaleDateString(),
            adherenceRate: Math.round(day.adherenceRate),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const bpTrendData = healthTrends
        .filter(
            (record) =>
                record.bloodPressure.systolic !== null &&
                !isNaN(record.bloodPressure.systolic) &&
                record.bloodPressure.diastolic !== null &&
                !isNaN(record.bloodPressure.diastolic)
        )
        .map((record) => ({
            date: record.date,
            systolic: record.bloodPressure.systolic,
            diastolic: record.bloodPressure.diastolic,
        }));

    const sugarTrendData = healthTrends
        .filter((record) => record.bloodSugar.value !== null && !isNaN(record.bloodSugar.value))
        .map((record) => ({
            date: record.date,
            value: record.bloodSugar.value,
        }));

    const sugarColors = sugarTrendData.map((record) => {
        if (record.value < 100) return '#10B981'; // green
        if (record.value < 140) return '#F59E0B'; // yellow
        return '#EF4444'; // red
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Health Reports</h1>
                    <p className="mt-2 text-lg text-gray-600">View your medication adherence and health trends</p>
                </div>

                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="input-elderly w-48"
                    aria-label="Select time range"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 3 months</option>
                </select>
            </header>

            {loading ? (
                <SkeletonLoader lines={6} height="h-32" />
            ) : (
                <>
                    {adherenceData ? (
                        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card title="Overall Adherence" value={`${Math.round(adherenceData.overall.adherenceRate || 0)}%`} colorClass="blue" />
                            <Card title="Current Streak" value={adherenceData.streak?.currentStreak || 0} colorClass="green" />
                            <Card title="Best Streak" value={adherenceData.streak?.longestStreak || 0} colorClass="purple" />
                            <Card title="Total Doses" value={adherenceData.overall.totalIntakes || 0} colorClass="yellow" />
                        </section>
                    ) : (
                        <p className="text-center text-gray-500">No adherence data available for selected period.</p>
                    )}

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <ChartComponent
                            type="line"
                            data={adherenceChartData}
                            title="Daily Medication Adherence"
                            xAxisKey="date"
                            yAxisKey="adherenceRate"
                            color="#3B82F6"
                            showLegend={true}
                            height={300}
                            tooltipFormatter={(val) => `${val}%`}
                        />
                        <ChartComponent
                            type="area"
                            data={bpTrendData}
                            title="Blood Pressure Trends"
                            xAxisKey="date"
                            yAxisKey={['systolic', 'diastolic']}
                            colors={['#EF4444', '#3B82F6']}
                            height={300}
                            showLegend={true}
                        />
                        <ChartComponent
                            type="bar"
                            data={sugarTrendData}
                            title="Blood Sugar Levels"
                            xAxisKey="date"
                            yAxisKey="value"
                            colors={sugarColors}
                            height={300}
                            showGrid={true}
                            showTooltip={true}
                            showLegend={true}
                        />
                    </section>

                    <AdherenceInsights adherenceData={adherenceData} />

                    <div className="flex justify-center mt-8">
                        <button onClick={() => window.print()} className="btn-primary no-print" aria-label="Print report">
                            Print Report
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const Card = ({ title, value, colorClass }) => (
    <div className={`card-elderly bg-gradient-to-br from-${colorClass}-50 to-${colorClass}-100 border-l-4 border-${colorClass}-500`}>
        <div className="text-center">
            <div className={`text-3xl font-bold text-${colorClass}-700 mb-2`}>{value}</div>
            <div className={`text-base text-${colorClass}-600`}>{title}</div>
        </div>
    </div>
);

const AdherenceInsights = ({ adherenceData }) => {
    const generateInsights = (adherenceData) => {
        if (!adherenceData) return [];

        const { overall, streak, daily } = adherenceData;
        const adherenceRate = overall?.adherenceRate || 0;
        const currentStreak = streak?.currentStreak || 0;
        const longestStreak = streak?.longestStreak || 0;

        let messages = [];

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

        if (longestStreak > 10) {
            messages.push({
                title: "Strong Streaks",
                description: `Your longest adherence streak is ${longestStreak} days. Keep it going!`,
                color: "blue",
                emoji: "💪",
            });
        }

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

export default Reports;
