// frontend/src/utils/formatDate.js
export const formatDate = (date, format = 'short') => {
    const d = new Date(date);

    if (format === 'short') {
        return d.toLocaleDateString();
    }

    if (format === 'long') {
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (format === 'time') {
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    if (format === 'datetime') {
        return d.toLocaleString();
    }

    return d.toLocaleDateString();
};

export const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);

    return today.toDateString() === checkDate.toDateString();
};

export const isOverdue = (date, time) => {
    const now = new Date();
    const checkDateTime = new Date(`${date}T${time}:00`);

    return checkDateTime < now;
};
