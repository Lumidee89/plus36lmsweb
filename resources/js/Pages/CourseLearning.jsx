import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

function getVideoEmbed(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return { iframe: true, src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return { iframe: true, src: `https://player.vimeo.com/video/${vm[1]}` };
    return { iframe: false, src: url };
}

function TopicIcon({ type }) {
    if (type === 'video') return (
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
    );
    if (type === 'pdf') return (
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
    );
    return (
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
        </svg>
    );
}

export default function CourseLearning({ course, completedLessonIds: initial }) {
    const [done, setDone] = React.useState(() => new Set(initial || []));
    const [activeLessonId, setActiveLessonId] = React.useState(null);
    const [activeTopicId, setActiveTopicId] = React.useState(null);
    const [marking, setMarking] = React.useState(false);

    const lessons = course.lessons || [];
    const totalLessons = lessons.length;
    const doneCount = done.size;
    const pct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0;

    const allTopics = React.useMemo(
        () => lessons.flatMap(l => (l.topics || []).map(t => ({ ...t, lesson: l }))),
        [lessons]
    );

    React.useEffect(() => {
        if (lessons.length) {
            const first = lessons[0];
            setActiveLessonId(first.id);
            setActiveTopicId(first.topics?.[0]?.id ?? null);
        }
    }, []);

    React.useEffect(() => {
        const id = setInterval(() => {
            router.post(route('progress.ping'), { minutes: 5 }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    const activeLesson = lessons.find(l => l.id === activeLessonId);
    const activeTopic = activeLesson?.topics?.find(t => t.id === activeTopicId);
    const currentIdx = allTopics.findIndex(t => t.id === activeTopicId);
    const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
    const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

    const navigate = (topicEntry) => {
        setActiveLessonId(topicEntry.lesson.id);
        setActiveTopicId(topicEntry.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const markComplete = () => {
        if (!activeLesson || done.has(activeLesson.id) || marking) return;
        setMarking(true);
        router.post(route('lessons.complete', activeLesson.id), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDone(prev => new Set([...prev, activeLesson.id]));
                setMarking(false);
            },
            onError: () => setMarking(false),
        });
    };

    const renderContent = (topic) => {
        if (!topic) return null;

        if (topic.type === 'video') {
            const embed = topic.video_url ? getVideoEmbed(topic.video_url) : null;
            if (embed) {
                return embed.iframe ? (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src={embed.src}
                            title={topic.title}
                            className="absolute inset-0 w-full h-full rounded-2xl"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <video controls className="w-full rounded-2xl bg-black" src={embed.src} />
                );
            }
            if (topic.content) {
                return (
                    <video controls className="w-full rounded-2xl bg-black">
                        <source src={`/storage/${topic.content}`} />
                        Your browser does not support HTML5 video.
                    </video>
                );
            }
            return <p className="text-gray-400 font-bold text-sm py-8 text-center">No video URL attached to this topic.</p>;
        }

        if (topic.type === 'text') {
            return (
                <div className="text-gray-700 text-[15px] leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: topic.content || '<p>No content available.</p>' }}
                />
            );
        }

        if (topic.type === 'pdf') {
            const pdfSrc = topic.content ? `/storage/${topic.content}` : null;
            return pdfSrc ? (
                <iframe
                    src={pdfSrc}
                    title={topic.title}
                    className="w-full border-0 rounded-2xl"
                    style={{ height: '70vh' }}
                />
            ) : (
                <p className="text-gray-400 font-bold text-sm py-8 text-center">No PDF file attached to this topic.</p>
            );
        }

        return <p className="text-gray-400 font-bold text-sm py-8 text-center">Content not available.</p>;
    };

    return (
        <div className="min-h-screen bg-[#f8f9fd] font-sans flex flex-col">
            <Head title={`${course.title} | Plus36 Academy`} />

            {/* Top bar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                <Link
                    href="/dashboard?tab=my-courses"
                    className="p-2 rounded-xl text-gray-400 hover:text-[#1a1d21] hover:bg-gray-50 transition shrink-0"
                    title="Back to My Learning"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-black text-[#1a1d21] truncate">{course.title}</h1>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {course.user?.name || 'Instructor'}
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <div className="w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00d2d3] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-[#00d2d3] uppercase tracking-widest whitespace-nowrap">
                        {pct}% Complete
                    </span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

                {/* Sidebar */}
                <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto hidden lg:flex flex-col">
                    {/* Progress summary */}
                    <div className="p-5 border-b border-gray-50 shrink-0">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Course Content</span>
                            <span className="text-[9px] font-black text-[#00d2d3]">{doneCount}/{totalLessons} done</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#00d2d3] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Exam CTA when all done */}
                    {pct === 100 && course.exam && (
                        <div className="px-4 pb-4 shrink-0">
                            <Link
                                href={route('courses.exam', course.id)}
                                className="flex items-center justify-center gap-2 w-full bg-[#00d2d3] text-black px-4 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#1a1d21] hover:text-white transition"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Take Final Exam
                            </Link>
                        </div>
                    )}

                    {/* Lesson list */}
                    <nav className="p-3 space-y-1 flex-1">
                        {lessons.length === 0 ? (
                            <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                No lessons yet
                            </p>
                        ) : lessons.map((lesson, idx) => {
                            const isDone = done.has(lesson.id);
                            const isOpen = lesson.id === activeLessonId;

                            return (
                                <div key={lesson.id}>
                                    <button
                                        onClick={() => {
                                            setActiveLessonId(lesson.id);
                                            if (lesson.topics?.length) setActiveTopicId(lesson.topics[0].id);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${isOpen ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 text-[10px] font-black transition-all ${
                                            isDone    ? 'bg-[#00d2d3] border-[#00d2d3] text-black' :
                                            isOpen    ? 'border-[#00d2d3] text-[#00d2d3]' :
                                                        'border-gray-200 text-gray-400'
                                        }`}>
                                            {isDone ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : idx + 1}
                                        </div>
                                        <span className={`text-xs font-black flex-1 leading-tight ${
                                            isOpen ? 'text-[#1a1d21]' : isDone ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                            {lesson.title}
                                        </span>
                                        <span className="text-[9px] text-gray-300 font-bold shrink-0">
                                            {lesson.topics?.length || 0}
                                        </span>
                                    </button>

                                    {isOpen && lesson.topics?.length > 0 && (
                                        <div className="ml-10 mr-1 mb-2 space-y-0.5">
                                            {lesson.topics.map(topic => (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => setActiveTopicId(topic.id)}
                                                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition ${
                                                        topic.id === activeTopicId
                                                            ? 'bg-[#1a1d21] text-white'
                                                            : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <TopicIcon type={topic.type} />
                                                    <span className="truncate">{topic.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto">
                    {activeTopic ? (
                        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">

                            {/* Breadcrumb + title */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00d2d3] mb-1">
                                    {activeLesson?.title}
                                </p>
                                <h2 className="text-2xl font-black text-[#1a1d21] leading-tight">
                                    {activeTopic.title}
                                </h2>
                            </div>

                            {/* Content */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 md:p-8">
                                    {renderContent(activeTopic)}
                                </div>
                            </div>

                            {/* Mark complete row */}
                            <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black text-[#1a1d21]">Done with this lesson?</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                        Mark it complete to update your progress
                                    </p>
                                </div>
                                {done.has(activeLesson?.id) ? (
                                    <span className="bg-green-50 text-green-700 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shrink-0 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Completed
                                    </span>
                                ) : (
                                    <button
                                        onClick={markComplete}
                                        disabled={marking}
                                        className="bg-[#1a1d21] text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shrink-0 hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-50"
                                    >
                                        {marking ? 'Saving...' : 'Mark Complete'}
                                    </button>
                                )}
                            </div>

                            {/* Prev / Next navigation */}
                            <div className="flex justify-between gap-4 pb-10">
                                {prevTopic ? (
                                    <button
                                        onClick={() => navigate(prevTopic)}
                                        className="flex items-center gap-2 bg-white border border-gray-100 text-gray-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-gray-50 transition max-w-[45%]"
                                    >
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span className="truncate">{prevTopic.title}</span>
                                    </button>
                                ) : <div />}

                                {nextTopic ? (
                                    <button
                                        onClick={() => navigate(nextTopic)}
                                        className="flex items-center gap-2 bg-[#1a1d21] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#00d2d3] hover:text-black transition ml-auto max-w-[45%]"
                                    >
                                        <span className="truncate">{nextTopic.title}</span>
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    pct === 100 && (
                                        course.exam ? (
                                            <Link
                                                href={route('courses.exam', course.id)}
                                                className="flex items-center gap-2 bg-[#00d2d3] text-black px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ml-auto hover:bg-[#1a1d21] hover:text-white transition"
                                            >
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                Take Final Exam
                                            </Link>
                                        ) : (
                                            <div className="bg-[#00d2d3] text-black px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ml-auto">
                                                Course Complete!
                                            </div>
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        /* No topic selected */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-10">
                                <div className="w-20 h-20 bg-teal-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-[#00d2d3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-[#1a1d21] mb-2">Ready to learn?</h3>
                                <p className="text-sm text-gray-400 font-bold">
                                    {lessons.length
                                        ? 'Select a lesson from the sidebar to get started.'
                                        : 'No lessons have been added to this course yet.'}
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
