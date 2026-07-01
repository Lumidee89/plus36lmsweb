import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function ExamPage({ course, exam, allLessonsCompleted, bestAttempt, certificate }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const [answers, setAnswers] = React.useState({});
    const [submitting, setSubmitting] = React.useState(false);

    const questions = exam?.questions || [];
    const passingScore = exam?.passing_score ?? 70;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Object.keys(answers).length === 0) return;
        setSubmitting(true);
        router.post(route('exams.submit', exam.id), { answers }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <div className="min-h-screen bg-[#f8f9fd] font-sans">
            <Head title={`Final Exam — ${course.title} | Plus36 Academy`} />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                <Link
                    href={`/courses/${course.id}`}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#1a1d21] hover:bg-gray-50 transition shrink-0"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00d2d3]">{course.title}</p>
                    <h1 className="text-sm font-black text-[#1a1d21] truncate">{exam?.title || 'Final Exam'}</h1>
                </div>
                <span className="hidden md:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Passing Score: {passingScore}%
                </span>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

                {/* Flash message */}
                {flash.message && (
                    <div className="bg-[#00d2d3] text-[#1a1d21] p-4 rounded-2xl font-black flex items-center gap-3 shadow-lg">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{flash.message}</span>
                    </div>
                )}

                {/* CERTIFICATE ISSUED STATE */}
                {certificate ? (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1a1d21] tracking-tight">Certificate Earned!</h2>
                            <p className="text-gray-400 font-bold text-sm mt-2">
                                You scored <span className="text-green-500 font-black">{certificate.exam_score}%</span> and successfully completed <span className="text-[#1a1d21]">{course.title}</span>.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={route('certificates.show', certificate.id)}
                                className="bg-[#1a1d21] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                            >
                                View Certificate
                            </Link>
                            <Link
                                href="/dashboard?tab=certs"
                                className="bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                My Certificates
                            </Link>
                            <Link
                                href={`/courses/${course.id}`}
                                className="bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Review Course
                            </Link>
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            Certificate #{certificate.certificate_number}
                        </p>
                    </div>

                /* FAILED ATTEMPT — show result + retry */
                ) : bestAttempt && !bestAttempt.passed ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[#1a1d21]">Not Quite There</h2>
                                <p className="text-gray-400 font-bold text-sm mt-1">
                                    Your best score: <span className="text-[#1a1d21] font-black">{bestAttempt.score}%</span> &nbsp;·&nbsp; Required: <span className="font-black">{passingScore}%</span>
                                </p>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Review the course material and try again below
                            </p>
                        </div>

                        {/* Retry exam form */}
                        <ExamForm
                            questions={questions}
                            answers={answers}
                            setAnswers={setAnswers}
                            optionLabels={optionLabels}
                            allAnswered={allAnswered}
                            submitting={submitting}
                            handleSubmit={handleSubmit}
                            passingScore={passingScore}
                            isRetry
                        />
                    </div>

                /* LESSONS NOT COMPLETE */
                ) : !allLessonsCompleted ? (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center space-y-6">
                        <div className="w-16 h-16 bg-yellow-50 rounded-[1.5rem] flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1a1d21]">Complete All Lessons First</h2>
                            <p className="text-gray-400 font-bold text-sm mt-2">
                                You must finish all course lessons before sitting the final exam.
                            </p>
                        </div>
                        <Link
                            href={`/courses/${course.id}`}
                            className="inline-block bg-[#1a1d21] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                        >
                            Continue Learning
                        </Link>
                    </div>

                /* EXAM FORM — first attempt */
                ) : (
                    <ExamForm
                        questions={questions}
                        answers={answers}
                        setAnswers={setAnswers}
                        optionLabels={optionLabels}
                        allAnswered={allAnswered}
                        submitting={submitting}
                        handleSubmit={handleSubmit}
                        passingScore={passingScore}
                    />
                )}
            </div>
        </div>
    );
}

function ExamForm({ questions, answers, setAnswers, optionLabels, allAnswered, submitting, handleSubmit, passingScore, isRetry }) {
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exam header card */}
            <div className="bg-[#1a1d21] rounded-[2rem] p-8 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00d2d3] mb-2">
                    {isRetry ? 'Retry Attempt' : 'Final Assessment'}
                </p>
                <h2 className="text-2xl font-black tracking-tight">Answer all questions carefully</h2>
                <p className="text-gray-400 text-xs font-bold mt-2">
                    {questions.length} question{questions.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Passing score: {passingScore}%
                </p>
            </div>

            {/* Questions */}
            {questions.map((question, qIdx) => (
                <div key={question.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-4">
                    <p className="text-sm font-black text-[#1a1d21] leading-snug">
                        <span className="text-[#00d2d3] mr-2">{qIdx + 1}.</span>
                        {question.question}
                    </p>
                    <div className="space-y-2">
                        {(question.options || []).map((option, oIdx) => {
                            const isSelected = answers[question.id] == option.id;
                            return (
                                <label
                                    key={option.id}
                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                                        isSelected
                                            ? 'border-[#00d2d3] bg-teal-50'
                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-[11px] border-2 transition-all ${
                                        isSelected
                                            ? 'bg-[#00d2d3] border-[#00d2d3] text-black'
                                            : 'border-gray-200 text-gray-400'
                                    }`}>
                                        {optionLabels[oIdx] || oIdx + 1}
                                    </div>
                                    <span className={`text-sm font-bold flex-1 ${isSelected ? 'text-[#1a1d21]' : 'text-gray-600'}`}>
                                        {option.option_text}
                                    </span>
                                    <input
                                        type="radio"
                                        name={`question_${question.id}`}
                                        value={option.id}
                                        checked={isSelected}
                                        onChange={() => setAnswers(prev => ({ ...prev, [question.id]: option.id }))}
                                        className="sr-only"
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Submit */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-black text-[#1a1d21]">
                        {allAnswered ? 'All questions answered!' : `${Object.keys(answers).length} of ${questions.length} answered`}
                    </p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                        You cannot change answers after submitting
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={submitting || !allAnswered}
                    className="bg-[#1a1d21] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-40 shrink-0"
                >
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
            </div>
        </form>
    );
}
