import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

const ICONS = {
    star: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    flame: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2c0 0-5.5 4.5-5.5 10a5.5 5.5 0 0011 0C17.5 6.5 12 2 12 2zm0 15a3 3 0 01-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 01-3 3z" />
        </svg>
    ),
    fire: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2c0 0-5.5 4.5-5.5 10a5.5 5.5 0 0011 0C17.5 6.5 12 2 12 2zm0 15a3 3 0 01-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 01-3 3z" />
        </svg>
    ),
    trophy: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V18H9v2h6v-2h-2v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
        </svg>
    ),
    clock: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
        </svg>
    ),
    graduation: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 3L1 9l4 2.18V15c0 3 3.58 5 7 5s7-2 7-5v-3.82L22 9 12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15c0 1.42-2.25 3-5 3s-5-1.58-5-3v-2.73l5 2.73 5-2.73V15z" />
        </svg>
    ),
    check: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
    ),
    moon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
        </svg>
    ),
};

const COLOR_MAP = {
    yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-500',  ring: 'ring-yellow-200' },
    orange:  { bg: 'bg-orange-100',  text: 'text-orange-500',  ring: 'ring-orange-200' },
    red:     { bg: 'bg-red-100',     text: 'text-red-500',     ring: 'ring-red-200' },
    purple:  { bg: 'bg-purple-100',  text: 'text-purple-500',  ring: 'ring-purple-200' },
    blue:    { bg: 'bg-blue-100',    text: 'text-blue-500',    ring: 'ring-blue-200' },
    green:   { bg: 'bg-green-100',   text: 'text-green-500',   ring: 'ring-green-200' },
    teal:    { bg: 'bg-teal-100',    text: 'text-teal-500',    ring: 'ring-teal-200' },
    indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-500',  ring: 'ring-indigo-200' },
};

function WeeklyBar({ days }) {
    const max = Math.max(...days.map(d => d.minutes), 1);
    return (
        <div className="flex items-end gap-2 h-20">
            {days.map((day, i) => {
                const heightPct = (day.minutes / max) * 100;
                return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                        <div className="w-full flex items-end justify-center h-16">
                            <div
                                className="w-full rounded-t-md bg-teal-600 transition-all duration-500"
                                style={{ height: `${Math.max(heightPct, day.minutes > 0 ? 8 : 4)}%` }}
                                title={`${day.minutes} min`}
                            />
                        </div>
                        <span className="text-xs text-gray-400">{day.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function AchievementBadge({ achievement }) {
    const colors = COLOR_MAP[achievement.color] ?? COLOR_MAP.yellow;
    const icon = ICONS[achievement.icon] ?? ICONS.star;

    if (!achievement.earned) {
        return (
            <div className="flex flex-col items-center gap-1 p-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 ring-2 ring-gray-200 flex items-center justify-center text-gray-300">
                    {icon}
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight">{achievement.name}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1 p-3">
            <div className={`w-14 h-14 rounded-full ${colors.bg} ring-2 ${colors.ring} flex items-center justify-center ${colors.text}`}>
                {icon}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{achievement.name}</span>
            <span className="text-[10px] text-gray-400 text-center leading-tight">{achievement.description}</span>
        </div>
    );
}

export default function Progress({ streak, stats, thisWeek, achievements }) {
    const pingInterval = useRef(null);

    useEffect(() => {
        pingInterval.current = setInterval(() => {
            router.post(route('progress.ping'), { minutes: 5 }, { preserveScroll: true });
        }, 5 * 60 * 1000);

        return () => clearInterval(pingInterval.current);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Your progress</h1>

                {/* Streak card */}
                <div className="rounded-2xl bg-teal-800 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-teal-700 ring-2 ring-teal-500">
                            <span className="text-2xl font-bold leading-none">{streak.current}</span>
                            <span className="text-[10px] uppercase tracking-wide opacity-70">days</span>
                        </div>
                        <div>
                            <p className="font-semibold text-base">Current streak</p>
                            <p className="text-sm opacity-70">
                                Longest: {streak.longest} days · keep going to beat it
                            </p>
                        </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 opacity-60">
                        <path d="M12 2c0 0-5.5 4.5-5.5 10a5.5 5.5 0 0011 0C17.5 6.5 12 2 12 2z" />
                    </svg>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: stats.hours, label: 'hours' },
                        { value: stats.lessons, label: 'lessons' },
                        { value: stats.certificates, label: 'certs' },
                    ].map(({ value, label }) => (
                        <div key={label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-sm text-gray-400">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Weekly activity */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="font-semibold text-gray-800">This week</p>
                        <p className="text-sm text-gray-400">{thisWeek.total_hours}h learned</p>
                    </div>
                    <WeeklyBar days={thisWeek.days} />
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="font-semibold text-gray-800 mb-4">Achievements</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {achievements.map(a => (
                            <AchievementBadge key={a.key} achievement={a} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
