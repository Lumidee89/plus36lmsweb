import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function CourseContentManager({ courses, lessons = [] }) {
    const [selectedCourse, setSelectedCourse] = useState('');
    const [previewItem, setPreviewItem] = useState(null);
    
    const lessonForm = useForm({
        course_id: '',
        lesson_title: '',
    });

    const topicForm = useForm({
        lesson_id: '',
        title: '',
        type: 'text',
        content: '',
        video_url: '',
        file: null,
    });

    const { errors } = topicForm;

    const handleCourseChange = (e) => {
        const id = e.target.value;
        setSelectedCourse(id);
        lessonForm.setData('course_id', id);
    };

    const submitLesson = (e) => {
        e.preventDefault();
        lessonForm.post(route('lessons.store'), {
            onSuccess: () => lessonForm.reset('lesson_title'),
        });
    };

    const submitTopic = (e) => {
        e.preventDefault();
        topicForm.post(route('topics.store'), {
            onSuccess: () => topicForm.reset(),
        });
    };

    const displayCourses = selectedCourse 
        ? courses.filter(c => c.id == selectedCourse)
        : courses;

    return (
        <div className="max-w-[1600px] mx-auto pb-20">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-[#1a1d21] mb-2 tracking-tight">Curriculum Architect</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Plus36 Academy Professional Workspace</p>
                </div>
                
                <div className="min-w-[300px]">
                    <label className="text-[10px] font-black uppercase text-[#00d2d3] tracking-widest ml-4 mb-2 block">Focus Mode</label>
                    <select 
                        value={selectedCourse}
                        onChange={handleCourseChange}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] transition-all"
                    >
                        <option value="">View All Curriculums...</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
                
                {/* LEFT COLUMN: Builders */}
                <div className="w-full xl:w-[60%] space-y-8">
                    
                    {/* 01: Module Creator */}
                    <form onSubmit={submitLesson} className={`p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all ${!selectedCourse && 'opacity-50 pointer-events-none'}`}>
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#1a1d21]" />
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-[#1a1d21] flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">01</span>
                                Launch New Module
                            </h3>
                            {!selectedCourse && <span className="text-[9px] font-black text-red-500 uppercase bg-red-50 px-3 py-1 rounded-full">Select a course first</span>}
                        </div>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                value={lessonForm.data.lesson_title}
                                onChange={e => lessonForm.setData('lesson_title', e.target.value)}
                                placeholder="e.g., Week 1: Introduction" 
                                className="flex-1 border-none bg-gray-50 rounded-2xl p-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#00d2d3]"
                            />
                            <button disabled={lessonForm.processing} className="px-8 bg-[#1a1d21] text-white rounded-2xl font-black text-xs hover:bg-[#00d2d3] hover:text-[#1a1d21] transition-all">
                                Add Module
                            </button>
                        </div>
                    </form>

                    {/* 02: Topic Creator */}
                    <form onSubmit={submitTopic} className={`p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all ${!selectedCourse && 'opacity-50 pointer-events-none'}`}>
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#00d2d3]" />
                        <h3 className="text-lg font-black text-[#1a1d21] mb-6 flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">02</span>
                            Add Content Topic
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <select 
                                value={topicForm.data.lesson_id}
                                onChange={e => topicForm.setData('lesson_id', e.target.value)}
                                className={`w-full border-none bg-gray-50 rounded-xl p-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#00d2d3] ${errors.lesson_id ? 'ring-2 ring-red-500' : ''}`}
                            >
                                <option value="">Target Module...</option>
                                {lessons.filter(l => l.course_id == selectedCourse).map(lesson => (
                                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                                ))}
                            </select>

                            <select 
                                value={topicForm.data.type}
                                onChange={e => topicForm.setData('type', e.target.value)}
                                className="w-full border-none bg-gray-50 rounded-xl p-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#00d2d3]"
                            >
                                <option value="text">Rich Text / Article</option>
                                <option value="video">Video Lesson</option>
                                <option value="pdf">PDF Resource</option>
                            </select>
                        </div>

                        <input 
                            type="text" 
                            placeholder="Topic Title (e.g., Setting up Environment)"
                            value={topicForm.data.title}
                            onChange={e => topicForm.setData('title', e.target.value)}
                            className="w-full border-none bg-gray-50 rounded-xl p-4 text-sm font-bold mb-4 shadow-inner focus:ring-2 focus:ring-[#00d2d3]"
                        />

                        {/* --- DYNAMIC INPUTS START --- */}
                        <div className="mb-6">
                            {topicForm.data.type === 'text' && (
                                <textarea 
                                    placeholder="Write your lesson content here..."
                                    value={topicForm.data.content}
                                    onChange={e => topicForm.setData('content', e.target.value)}
                                    className="w-full border-none bg-gray-50 rounded-xl p-4 text-sm font-bold shadow-inner h-40 focus:ring-2 focus:ring-[#00d2d3]"
                                />
                            )}

                            {topicForm.data.type === 'video' && (
                                <div className="space-y-4">
                                    <div className="relative p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center group hover:border-[#00d2d3] transition-colors">
                                        <input 
                                            type="file" accept="video/*"
                                            onChange={e => topicForm.setData('file', e.target.files[0])}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <p className="text-[10px] font-black text-gray-400 uppercase group-hover:text-[#1a1d21]">
                                            {topicForm.data.file ? `✓ ${topicForm.data.file.name}` : 'Click to Upload MP4 Video'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-gray-100 flex-1" />
                                        <span className="text-[9px] font-black text-gray-300 uppercase">OR</span>
                                        <div className="h-px bg-gray-100 flex-1" />
                                    </div>
                                    <input 
                                        type="url" placeholder="Paste YouTube/Vimeo Link" 
                                        value={topicForm.data.video_url}
                                        onChange={e => topicForm.setData('video_url', e.target.value)}
                                        className="w-full border-none bg-gray-50 rounded-xl p-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#00d2d3]"
                                    />
                                </div>
                            )}

                            {topicForm.data.type === 'pdf' && (
                                <div className="relative p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center group hover:border-[#00d2d3] transition-colors">
                                    <input 
                                        type="file" accept=".pdf"
                                        onChange={e => topicForm.setData('file', e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <p className="text-[10px] font-black text-gray-400 uppercase group-hover:text-[#1a1d21]">
                                        {topicForm.data.file ? `✓ ${topicForm.data.file.name}` : 'Select PDF Resource File'}
                                    </p>
                                </div>
                            )}
                        </div>
                        {/* --- DYNAMIC INPUTS END --- */}

                        <button 
                            disabled={topicForm.processing}
                            className="w-full bg-[#00d2d3] text-[#1a1d21] py-4 rounded-2xl font-black text-xs hover:shadow-[0_10px_20px_-10px_rgba(0,210,211,0.4)] transition-all"
                        >
                            {topicForm.processing ? 'Publishing...' : 'Publish Content'}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Curriculum Overview */}
                <div className="w-full xl:w-[40%] sticky top-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Dynamic Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                            <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest">
                                {previewItem ? 'Content Preview' : (selectedCourse ? 'Course Structure' : 'Global Curriculum')}
                            </h3>
                            {previewItem ? (
                                <button 
                                    onClick={() => setPreviewItem(null)}
                                    className="text-[9px] font-black text-[#00d2d3] uppercase bg-[#00d2d3]/10 px-3 py-1 rounded-full hover:bg-[#1a1d21] hover:text-white transition-all"
                                >
                                    ← Back to List
                                </button>
                            ) : (
                                <span className="bg-gray-100 text-gray-400 text-[9px] font-black px-3 py-1 rounded-full uppercase">
                                    {displayCourses.length} Courses
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                            {previewItem ? (
                                /* --- PREVIEW MODE --- */
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="mb-6">
                                        <span className="text-[10px] font-black text-[#00d2d3] uppercase tracking-widest block mb-2">
                                            {previewItem.type}
                                        </span>
                                        <h4 className="text-xl font-black text-[#1a1d21] leading-tight">{previewItem.title}</h4>
                                    </div>

                                    <div className="rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 min-h-[300px] flex flex-col">
                                        {previewItem.type === 'video' && (
                                            <div className="aspect-video bg-black flex items-center justify-center">
                                                {previewItem.video_url ? (
                                                    <iframe 
                                                        className="w-full h-full" 
                                                        src={previewItem.video_url} 
                                                        allowFullScreen 
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="text-4xl mb-4 block">🎥</span>
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Video File Uploaded</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {previewItem.type === 'text' && (
                                            <div className="p-6 text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                                                {previewItem.content || "No content provided for this topic."}
                                            </div>
                                        )}

                                        {previewItem.type === 'pdf' && (
                                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                                <span className="text-5xl mb-4">📄</span>
                                                <p className="text-xs font-black text-[#1a1d21] uppercase mb-4">PDF Document Linked</p>
                                                <button className="px-6 py-2 bg-[#1a1d21] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#00d2d3] hover:text-[#1a1d21] transition-all">
                                                    View Full Document
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* --- LIST MODE --- */
                                <div className="space-y-6">
                                    {displayCourses.length > 0 ? (
                                        displayCourses.map(course => (
                                            <div key={course.id} className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d2d3]" />
                                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">{course.title}</h4>
                                                </div>
                                                
                                                {course.lessons?.map((lesson, idx) => (
                                                    <div key={lesson.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                                        <p className="text-[10px] font-black text-[#00d2d3] uppercase mb-1">Module {idx + 1}</p>
                                                        <h5 className="font-black text-sm text-[#1a1d21] mb-3">{lesson.title}</h5>
                                                        
                                                        <div className="space-y-2">
                                                            {lesson.topics?.map(topic => (
                                                                <button 
                                                                    key={topic.id} 
                                                                    onClick={() => setPreviewItem(topic)}
                                                                    className="w-full flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-gray-50 hover:border-[#00d2d3] hover:shadow-md transition-all group text-left"
                                                                >
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <span className="text-xs shrink-0">{topic.type === 'video' ? '🎥' : topic.type === 'pdf' ? '📄' : '📝'}</span>
                                                                        <span className="text-[11px] font-bold text-gray-600 truncate">{topic.title}</span>
                                                                    </div>
                                                                    <span className="opacity-0 group-hover:opacity-100 text-[#00d2d3] text-[10px] font-black uppercase tracking-tighter transition-opacity shrink-0">
                                                                        Preview →
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-gray-300 font-black uppercase text-xs">No Data</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}