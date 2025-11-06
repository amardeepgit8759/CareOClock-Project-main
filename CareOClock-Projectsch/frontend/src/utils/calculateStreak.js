// frontend/src/utils/calculateStreak.js
export const calculateStreak = (intakeHistory) => {
    if (!intakeHistory || intakeHistory.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Group intake records by date
    const dailyStatus = {};

    intakeHistory.forEach(intake => {
        const dateStr = new Date(intake.date).toISOString().split('T')[0];
        if (!dailyStatus[dateStr]) {
            dailyStatus[dateStr] = { total: 0, taken: 0 };
        }
        dailyStatus[dateStr].total += 1;
        if (intake.status === 'taken') {
            dailyStatus[dateStr].taken += 1;
        }
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedDates = Object.keys(dailyStatus).sort().reverse();

    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const dayData = dailyStatus[date];

        // Perfect adherence for the day
        if (dayData.taken === dayData.total && dayData.total > 0) {
            tempStreak += 1;
            if (i === 0 || currentStreak === tempStreak - 1) {
                currentStreak = tempStreak;
            }
        } else {
            tempStreak = 0;
        }

        longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
};
