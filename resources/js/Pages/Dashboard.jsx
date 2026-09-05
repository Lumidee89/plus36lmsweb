import React from 'react';
import { Link, Head, usePage, useForm, router } from '@inertiajs/react';
import StudentIDCard from './Dashboard/Components/StudentIDCard';
import CreateCourseForm from './Dashboard/Components/CreateCourseForm';
import CourseContentManager from './Dashboard/Components/CourseContentManager';
import PlatformManagement from './Dashboard/Components/PlatformManagement';

// Reusable Stats Card Component
const StatsCard = ({ label, value, icon, color = "#00d2d3" }) => (
    <div className="group min-h-36 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg first:bg-[#087f81] first:text-white">
        <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 group-first:text-white/70">{label}</p>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 transition-colors group-first:border-white/30" style={{ color }}>
                {icon}
            </div>
        </div>
        <h3 className="mt-5 text-3xl font-black tracking-tighter text-[#1a1d21] group-first:text-white">{value}</h3>
        <p className="mt-2 text-[9px] font-bold text-slate-400 group-first:text-white/60">Updated from live academy data</p>
    </div>
);

const AnalyticsChart = ({ role, stats, courses = [], enrolledCourses = [] }) => {
    const source = role === 'student'
        ? enrolledCourses.map(course => Number(course.progress_pct || 0))
        : courses.map(course => Number(course.enrollments_count || course.lessons?.length || 0));
    const fallback = role === 'admin'
        ? [stats.total_students, stats.total_tutors, stats.total_courses, stats.total_earnings / 1000]
        : [stats.total_courses, stats.total_students, stats.total_earnings / 1000, stats.total_withdrawals / 1000];
    const values = [...source, ...fallback].filter(value => Number.isFinite(Number(value))).slice(0, 7);
    while (values.length < 7) values.push(0);
    const max = Math.max(...values, 1);

    return <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between"><div><h3 className="text-sm font-black">Learning analytics</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Live activity overview</p></div><span className="rounded-full bg-[#e7fbfb] px-3 py-1 text-[9px] font-black text-[#087f81]">This period</span></div>
        <div className="mt-8 flex h-48 items-end justify-between gap-3 border-b border-slate-100 px-2">
            {values.map((value, index) => <div key={index} className="flex h-full flex-1 items-end"><div title={String(value)} className={`w-full rounded-t-full transition-all ${index === 3 ? 'bg-[#1a1d21]' : index === 2 ? 'bg-[#00d2d3]' : 'bg-[#087f81]'}`} style={{ height: `${Math.max(14, (Number(value) / max) * 100)}%`, opacity: index > 3 ? .55 : 1 }} /></div>)}
        </div>
        <div className="mt-3 flex justify-between px-2 text-[9px] font-black uppercase text-slate-300">{['M','T','W','T','F','S','S'].map((day, index) => <span key={index}>{day}</span>)}</div>
    </div>;
};

export default function Dashboard({ auth, stats, user_data, faculties, courses, enrolledCourses, lessons, tutor_students, tutor_course_breakdown, my_withdrawals, available_balance, all_students, all_tutors, all_withdrawals, certificates, platform, assessment_submissions = [], objective_attempts = [] }) {
    const { url, props } = usePage();
    const flash = props.flash || {};
    const urlParams = new URLSearchParams(url.split('?')[1] || "");
    const currentTab = urlParams.get('tab');

    const userRole = auth.user.role;
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [reviewDrafts, setReviewDrafts] = React.useState({});

    // Tutor exam management state
    const [examCourseId, setExamCourseId] = React.useState('');
    const [questionForm, setQuestionForm] = React.useState({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    const [submittingExam, setSubmittingExam] = React.useState(false);
    const [submittingQuestion, setSubmittingQuestion] = React.useState(false);

    const tutorCourses = courses.filter(c => c.user_id === auth.user.id);

    const avatarInput = React.useRef(null);
    const [avatarPreview, setAvatarPreview] = React.useState(null);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'patch',
        name: auth.user.name,
        email: auth.user.email,
        password: '',
        avatar: null,
    });

    const facultyForm = useForm({ name: '' });

    const withdrawalForm = useForm({
        amount: '',
        account_name: '',
        account_number: '',
        bank_name: '',
    });

    const updateProfile = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('password', '');
                setData('avatar', null);
                setAvatarPreview(null);
                if (avatarInput.current) avatarInput.current.value = '';
            },
        });
    };

    const submitWithdrawal = (e) => {
        e.preventDefault();
        withdrawalForm.post(route('withdrawals.store'), {
            onSuccess: () => withdrawalForm.reset(),
        });
    };

    const submitFaculty = (e) => {
        e.preventDefault();
        facultyForm.post(route('faculties.store'), {
            onSuccess: () => facultyForm.reset(),
        });
    };

    const selectedExamCourse = tutorCourses.find(c => c.id == examCourseId);
    const selectedCourseExam = selectedExamCourse?.exam || null;

    const createExam = (e) => {
        e.preventDefault();
        if (!examCourseId) return;
        setSubmittingExam(true);
        router.post(route('exams.store'), { course_id: examCourseId, title: 'Final Exam' }, {
            preserveScroll: true,
            onFinish: () => setSubmittingExam(false),
        });
    };

    const addQuestion = (e) => {
        e.preventDefault();
        if (!selectedCourseExam) return;
        setSubmittingQuestion(true);
        router.post(route('exam.questions.store'), {
            exam_id: selectedCourseExam.id,
            question: questionForm.question,
            options: questionForm.options,
            correct_index: questionForm.correctIndex,
        }, {
            preserveScroll: true,
            onSuccess: () => setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 }),
            onFinish: () => setSubmittingQuestion(false),
        });
    };

    const deleteQuestion = (questionId) => {
        router.delete(route('exam.questions.destroy', questionId), { preserveScroll: true });
    };

    const Icons = {
        Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
        Courses: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
        Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        Faculty: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
        Revenue: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Certs: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
        Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        Withdrawals: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    };

    const navigation = {
        admin: [
            ['courses', 'Courses', Icons.Courses],
            ['students', 'Students', Icons.Users],
            ['faculty', 'Faculty', Icons.Faculty],
            ['revenue', 'Revenue', Icons.Revenue],
            ['withdrawals', 'Withdrawals', Icons.Withdrawals],
            ['platform', 'Platform', Icons.Settings],
        ],
        tutor: [
            ['my-courses', 'My Courses', Icons.Courses],
            ['assessment-reviews', 'Assessment Scoring', Icons.Certs],
            ['earnings', 'Earnings', Icons.Revenue],
            ['my-students', 'My Students', Icons.Users],
            ['exams', 'Exams', Icons.Certs],
            ['withdrawals', 'Withdrawals', Icons.Withdrawals],
        ],
        student: [
            ['available-courses', 'Explore Courses', Icons.Courses],
            ['my-courses', 'My Learning', Icons.Courses],
            ['certs', 'Certificates', Icons.Certs],
        ],
    };

    const navLinkClass = (active) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
        active
            ? 'bg-[#e7fbfb] font-black text-[#087f81] shadow-sm'
            : 'font-bold text-slate-400 hover:bg-slate-50 hover:text-[#1a1d21]'
    }`;

    const RecentActivities = ({ activities }) => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6 px-1">Recent Activities</h3>
            <div className="space-y-6">
                {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex gap-4 group">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-[#00d2d3] mt-2 group-last:after:hidden after:content-[''] after:absolute after:top-4 after:left-[3px] after:w-[2px] after:h-8 after:bg-gray-50" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#1a1d21] leading-tight">{activity.description}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-wider">
                                    {new Date(activity.created_at).toLocaleDateString()} • {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-[10px] font-bold text-gray-300 uppercase italic">No recent activity found</p>
                )}
            </div>
        </div>
    );

    const handlePaystackPayment = (course) => {
        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: auth.user.email,
            amount: (course.price || 5000) * 100,
            currency: 'NGN',
            ref: 'P36_' + Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
                course_id: course.id,
                user_id: auth.user.id,
                custom_fields: [
                    {
                        display_name: "Course Title",
                        variable_name: "course_title",
                        value: course.title
                    }
                ]
            },
            callback: function(response) {

                (async () => {

                    try {

                        const res = await fetch('/courses/enroll', {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document
                                    .querySelector('meta[name="csrf-token"]')
                                    .getAttribute('content'),
                            },

                            body: JSON.stringify({
                                course_id: course.id,
                                amount: course.price || 5000,
                                reference: response.reference,
                            }),
                        });

                        const data = await res.json();

                        console.log(data);

                        if (res.ok) {

                            window.location.href = '/dashboard?tab=my-courses';

                        } else {

                            alert(data.message || 'Enrollment failed');
                        }

                    } catch (error) {

                        console.error(error);

                        alert('Something went wrong.');
                    }

                })();
            },
            onClose: function() {
                alert('Transaction cancelled.');
            }
        });
        handler.openIframe();
    };

    return (
        <div className="min-h-screen bg-[#eef0f2] p-0 font-sans text-[#1a1d21] sm:p-4 xl:p-7">
            <Head title="Dashboard | Plus36 Academy" />
            <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1700px] overflow-hidden bg-[#f8f9f9] shadow-2xl shadow-slate-300/60 sm:rounded-[2rem] lg:grid-cols-[240px_minmax(0,1fr)]">
                {/* SIDEBAR NAVIGATION */}
                <aside className="border-b border-slate-100 bg-white p-5 lg:flex lg:min-h-full lg:flex-col lg:border-b-0 lg:border-r lg:p-6">
                    <Link href="/" className="inline-flex items-center">
                        <img src="/logo.png" alt="Plus36 Academy" className="h-14 w-auto object-contain" />
                    </Link>
                    <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible">
                        <p className="mb-3 hidden px-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-300 lg:block">Workspace</p>
                        <Link href="/dashboard" className={`${navLinkClass(!currentTab)} shrink-0`}>
                            <Icons.Dashboard /><span>Dashboard</span>
                        </Link>
                        {(navigation[userRole] || []).map(([tab, label, Icon]) => (
                            <Link key={tab} href={`?tab=${tab}`} className={`${navLinkClass(currentTab === tab)} shrink-0`}>
                                <Icon /><span>{label}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-auto hidden border-t border-slate-100 pt-5 lg:block">
                        <Link href="?tab=settings" className={navLinkClass(currentTab === 'settings')}>
                            <Icons.Settings /><span>Settings</span>
                        </Link>
                        <Link href="/logout" method="post" as="button" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                    <span>Logout</span>
                        </Link>
                    </div>
                </aside>

                <div className="min-w-0">
                    <header className="flex flex-col gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                        <label className="flex w-full max-w-md items-center gap-3 rounded-xl bg-[#f7f8f8] px-4 py-3 text-slate-400">
                            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                            <input type="search" placeholder="Search your workspace" className="w-full border-0 bg-transparent p-0 text-xs font-bold text-[#1a1d21] placeholder:text-slate-300 focus:ring-0" />
                        </label>
                        <div className="flex items-center gap-3">
                            <button type="button" aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-100 bg-white text-slate-500 transition hover:border-[#00d2d3]">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h11Zm0 0v1a3 3 0 1 1-6 0v-1" /></svg>
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#00d2d3]" />
                            </button>
                            <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#e7fbfb]">
                                {auth.user.avatar_url ? <img src={auth.user.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center font-black text-[#087f81]">{auth.user.name.charAt(0)}</span>}
                            </div>
                            <div className="hidden sm:block">
                                <p className="max-w-40 truncate text-xs font-black">{auth.user.name}</p>
                                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">{userRole}</p>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-6 p-5 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                {/* MAIN CONTENT AREA */}
                <main className="min-w-0 space-y-6">
                    {flash.message && (
                        <div className="bg-[#00d2d3] text-[#1a1d21] p-4 rounded-2xl font-black flex items-center justify-between shadow-lg">
                            <div className="flex items-center space-x-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                <span>{flash.message}</span>
                            </div>
                        </div>
                    )}
                    {flash.error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-black flex items-center space-x-3 shadow-lg">
                            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {!currentTab ? (
                        <>
                            {/* HERO SECTION */}
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#087f81]">Plus36 Academy · {userRole} portal</p>
                                    <h1 className="mt-2 text-4xl font-black tracking-tighter text-[#1a1d21]">Dashboard</h1>
                                    <p className="mt-2 text-sm font-medium text-slate-400">Welcome back, {auth.user.name.split(' ')[0]}. Here’s what’s happening today.</p>
                                </div>
                                <Link href={userRole === 'student' ? '?tab=available-courses' : userRole === 'tutor' ? '?tab=my-courses' : '?tab=courses'} className="inline-flex items-center justify-center rounded-full bg-[#1a1d21] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#00d2d3] hover:text-black">
                                    View {userRole === 'student' ? 'Courses' : 'Workspace'}
                                </Link>
                            </div>

                            {/* DYNAMIC ANALYTICS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {userRole === 'admin' && (
                                    <>
                                        <StatsCard label="Total Tutors" value={stats.total_tutors || 0} icon={<Icons.Faculty />} color="#00d2d3" />
                                        <StatsCard label="Total Students" value={stats.total_students || 0} icon={<Icons.Users />} color="#74b9ff" />
                                        <StatsCard label="Total Earnings" value={`₦${stats.total_earnings || 0}`} icon={<Icons.Revenue />} color="#55efc4" />
                                        <StatsCard label="Total Withdrawn" value={`₦${stats.total_withdrawals || 0}`} icon={<Icons.Withdrawals />} color="#ff7675" />
                                    </>
                                )}
                                {userRole === 'tutor' && (
                                    <>
                                        <StatsCard label="My Courses" value={stats.total_courses || 0} icon={<Icons.Courses />} color="#00d2d3" />
                                        <StatsCard label="My Students" value={stats.total_students || 0} icon={<Icons.Users />} color="#a29bfe" />
                                        <StatsCard label="My Earnings" value={`₦${stats.total_earnings || 0}`} icon={<Icons.Revenue />} color="#55efc4" />
                                        <StatsCard label="Total Withdrawn" value={`₦${stats.total_withdrawals || 0}`} icon={<Icons.Withdrawals />} color="#fab1a0" />
                                    </>
                                )}
                                {userRole === 'student' && (
                                    <>
                                        <StatsCard label="Enrolled Courses" value={stats.total_courses || 0} icon={<Icons.Courses />} color="#00d2d3" />
                                        <StatsCard label="Completed Courses" value={stats.completed_courses || 0} icon={<Icons.Certs />} color="#087f81" />
                                        <StatsCard label="Certificates" value={stats.total_certificates || 0} icon={<Icons.Certs />} color="#00d2d3" />
                                        <StatsCard label="Courses Available" value={stats.available_courses || 0} icon={<Icons.Courses />} color="#087f81" />
                                    </>
                                )}
                            </div>
                            <AnalyticsChart role={userRole} stats={stats} courses={userRole === 'tutor' ? tutor_course_breakdown : courses} enrolledCourses={enrolledCourses} />
                        </>
                    ) : currentTab === 'platform' && userRole === 'admin' ? (
                        <PlatformManagement platform={platform || {}} courses={courses} />
                    ) : currentTab === 'courses' && userRole === 'admin' ? (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-[#1a1d21]">All Academy Courses</h2>
                                <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {courses.length} Total
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                            <th className="pb-4 px-4">Course Name</th>
                                            <th className="pb-4">Tutor</th>
                                            <th className="pb-4">Lessons</th>
                                            <th className="pb-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-bold text-gray-600">
                                        {courses.map((course) => (
                                            <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 text-[#1a1d21]">{course.title || course.name || "No Title Found"}</td>
                                                <td className="py-4">{course.user?.name || 'Unknown'}</td>
                                                <td className="py-4">{course.lessons?.length || 0} Lessons</td>
                                                <td className="py-4 text-right">
                                                    {course.status === 'published' ? (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Published</span>
                                                    ) : (
                                                        <Link href={`/courses/${course.id}/publish`} method="patch" as="button" className="rounded-full bg-[#1a1d21] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[#00d2d3] hover:text-black">Publish</Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ): currentTab === 'available-courses' && userRole === 'student' ? (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black text-[#1a1d21]">Available Courses</h2>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100">
                                {courses.length} Courses Found
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                                    <div className="h-48 bg-gray-100 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-6 left-6 text-white">
                                            <span className="bg-[#00d2d3] text-black text-[9px] font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">
                                                {course.faculty?.name || 'Academy'}
                                            </span>
                                            <h3 className="text-xl font-black">{course.title}</h3>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-[#00d2d3]">
                                                    {course.user?.name ? course.user.name.charAt(0) : 'T'}
                                                </div>
                                                <span className="text-xs font-bold text-gray-500">{course.user?.name || 'Tutor'}</span>
                                            </div>
                                            <span className="text-lg font-black text-[#1a1d21]">₦{parseFloat(course.price || 5000).toLocaleString()}</span>
                                        </div>
                                        
                                        {enrolledCourses?.some(enrolled => enrolled.id === course.id) ? (
                                            <button disabled className="w-full bg-green-100 text-green-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                                                Already Enrolled
                                            </button>
                                        ) : (
                                            <button onClick={() => handlePaystackPayment(course)} className="w-full bg-[#1a1d21] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all shadow-lg shadow-gray-100">
                                                Enroll & Pay Now
                                            </button>

                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    ) : currentTab === 'students' && userRole === 'admin' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1a1d21]">All Students</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Everyone registered as a student</p>
                                </div>
                                <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {all_students?.length || 0} Students
                                </span>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                {all_students?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Student</th>
                                                    <th className="pb-4">Enrolled Courses</th>
                                                    <th className="pb-4 text-right">Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {all_students.map(student => (
                                                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-sm font-black text-[#00d2d3] shrink-0">
                                                                    {student.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[#1a1d21]">{student.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold">{student.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="bg-teal-50 text-[#00d2d3] text-[10px] font-black px-3 py-1 rounded-full">
                                                                {student.enrolled_courses_count} Course{student.enrolled_courses_count !== 1 ? 's' : ''}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-[10px] text-gray-400 uppercase tracking-wider">
                                                            {new Date(student.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <h3 className="text-xl font-black text-gray-400 mb-2">No Students Yet</h3>
                                        <p className="text-gray-300 text-sm">Students who register will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'faculty' && userRole === 'admin' ? (
                        <div className="space-y-6">
                            {/* Add Faculty */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h2 className="text-2xl font-black text-[#1a1d21] mb-2">Faculty Management</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-6">Add a new faculty / department</p>
                                <form onSubmit={submitFaculty} className="flex gap-4">
                                    <input type="text" value={facultyForm.data.name} onChange={e => facultyForm.setData('name', e.target.value)} placeholder="e.g. Faculty of Technology" className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]" />
                                    <button type="submit" disabled={facultyForm.processing} className="bg-[#1a1d21] text-white px-8 rounded-2xl font-black hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-50">Add</button>
                                </form>
                            </div>

                            {/* All Tutors */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest">All Tutors</h3>
                                    <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                        {all_tutors?.length || 0} Tutors
                                    </span>
                                </div>
                                {all_tutors?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Tutor</th>
                                                    <th className="pb-4">Courses Published</th>
                                                    <th className="pb-4 text-right">Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {all_tutors.map(tutor => (
                                                    <tr key={tutor.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-[#1a1d21] flex items-center justify-center text-sm font-black text-white shrink-0">
                                                                    {tutor.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[#1a1d21]">{tutor.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold">{tutor.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full">
                                                                {tutor.courses_count} Course{tutor.courses_count !== 1 ? 's' : ''}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-[10px] text-gray-400 uppercase tracking-wider">
                                                            {new Date(tutor.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase">No tutors registered yet</p>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'my-courses' && userRole === 'student' ? (
                        <div className="space-y-8">

                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black text-[#1a1d21]">
                                    My Learning
                                </h2>

                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100">
                                    {enrolledCourses?.length || 0} Enrolled
                                </p>
                            </div>

                            {!enrolledCourses || enrolledCourses.length === 0 ? (
                                <div className="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                                    <h3 className="text-xl font-black text-gray-400 mb-2">
                                        No Courses Yet
                                    </h3>

                                    <p className="text-gray-300 text-sm">
                                        You haven't enrolled in any course yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {enrolledCourses?.map((course) => (
                                        <div 
                                            key={course.id}
                                            className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden"
                                        >
                                            <div className="p-8">
                                                <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full">
                                                    Enrolled
                                                </span>

                                                <h3 className="text-2xl font-black text-[#1a1d21] mt-4">
                                                    {course.title}
                                                </h3>

                                                <p className="text-sm text-gray-400 mt-2">
                                                    {course.description}
                                                </p>

                                                <div className="mt-4 mb-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
                                                        <span className="text-[9px] font-black text-[#00d2d3]">{course.progress_pct || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${course.is_completed ? 'bg-green-400' : 'bg-[#00d2d3]'}`}
                                                            style={{ width: `${course.progress_pct || 0}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {course.lessons?.length || 0} Lessons
                                                    </span>

                                                    {course.cert_issued ? (
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/dashboard?tab=certs`}
                                                                className="bg-green-50 text-green-700 px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2 hover:bg-green-100 transition-all"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Certified
                                                            </Link>
                                                            <Link
                                                                href={`/courses/${course.id}`}
                                                                className="bg-gray-100 text-gray-600 px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-gray-200 transition-all"
                                                            >
                                                                Review
                                                            </Link>
                                                        </div>
                                                    ) : course.is_completed && course.has_exam ? (
                                                        <Link
                                                            href={`/courses/${course.id}/exam`}
                                                            className="bg-[#00d2d3] text-black px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-[#1a1d21] hover:text-white transition-all"
                                                        >
                                                            Take Exam
                                                        </Link>
                                                    ) : course.is_completed ? (
                                                        <span className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/courses/${course.id}`}
                                                            className="bg-[#1a1d21] text-white px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                                                        >
                                                            Continue Learning
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : currentTab === 'settings' ? (
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="mb-10">
                                <h2 className="text-3xl font-black text-[#1a1d21] tracking-tight">Account Settings</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage your profile and security</p>
                            </div>

                            <form onSubmit={updateProfile} className="space-y-8 max-w-2xl">
                                {/* Avatar upload */}
                                <div className="flex items-center gap-6">
                                    <div
                                        className="relative group cursor-pointer"
                                        onClick={() => avatarInput.current?.click()}
                                    >
                                        <img
                                            src={avatarPreview ?? auth.user.avatar_url}
                                            alt={auth.user.name}
                                            className="w-24 h-24 rounded-[2rem] object-cover border-4 border-gray-100 shadow-sm"
                                        />
                                        <div className="absolute inset-0 rounded-[2rem] bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#1a1d21]">Profile Photo</p>
                                        <button
                                            type="button"
                                            onClick={() => avatarInput.current?.click()}
                                            className="text-[10px] font-black text-[#00d2d3] uppercase tracking-widest hover:underline mt-1 block"
                                        >
                                            Change Photo
                                        </button>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1">JPG, PNG or WebP · max 2MB</p>
                                        {avatarPreview && <p className="text-[9px] text-[#00d2d3] font-bold mt-1">New photo selected — click Update Profile to save</p>}
                                        {errors.avatar && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.avatar}</p>}
                                    </div>
                                    <input
                                        ref={avatarInput}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setData('avatar', file);
                                            setAvatarPreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={data.name} 
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-[#1a1d21] focus:ring-2 focus:ring-[#00d2d3]/20" 
                                        />
                                        {errors.name && <div className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.name}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={data.email} 
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-[#1a1d21] focus:ring-2 focus:ring-[#00d2d3]/20" 
                                        />
                                        {errors.email && <div className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.email}</div>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">New Password</label>
                                    <input 
                                        type="password" 
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Leave blank to keep current" 
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-[#1a1d21] focus:ring-2 focus:ring-[#00d2d3]/20" 
                                    />
                                    {errors.password && <div className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.password}</div>}
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-[#1a1d21] text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all shadow-lg shadow-gray-100 disabled:opacity-50"
                                    >
                                        {processing ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>

                            {/* Security / Role specific info */}
                            <div className="mt-12 pt-12 border-t border-gray-50">
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem]">
                                    <div>
                                        <h4 className="text-sm font-black text-[#1a1d21]">Account Type</h4>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{userRole}</p>
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-gray-400 border border-gray-100">
                                        ID: {auth.user.id}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : currentTab === 'revenue' && userRole === 'admin' ? (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h2 className="text-2xl font-black text-[#1a1d21] mb-2">Academy Revenue</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-8">Total gross income from course sales</p>
                                
                                <div className="bg-teal-50 p-10 rounded-[2rem] border border-teal-100/50">
                                    <p className="text-[10px] font-black uppercase text-[#00d2d3] tracking-[0.2em] mb-2">Total Accumulated Revenue</p>
                                    <h1 className="text-5xl font-black text-[#1a1d21]">₦{stats.total_earnings?.toLocaleString()}</h1>
                                </div>
                            </div>
                        </div>
                    ) : currentTab === 'my-courses' && userRole === 'tutor' ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1a1d21]">My Courses</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage your published courses</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateForm(v => !v)}
                                    className="bg-[#1a1d21] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                                >
                                    {showCreateForm ? '✕ Cancel' : '+ New Course'}
                                </button>
                            </div>

                            {showCreateForm && (
                                <CreateCourseForm faculties={faculties} />
                            )}

                            {tutorCourses.length === 0 ? (
                                <div className="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                                    <h3 className="text-xl font-black text-gray-400 mb-2">No Courses Yet</h3>
                                    <p className="text-gray-300 text-sm">Click "+ New Course" above to publish your first course.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {tutorCourses.map(course => (
                                            <div key={course.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
                                                <div className="p-8">
                                                    <span className="bg-teal-50 text-[#00d2d3] text-[9px] font-black uppercase px-3 py-1 rounded-full">
                                                        {course.faculty?.name || 'General'}
                                                    </span>
                                                    <h3 className="text-xl font-black text-[#1a1d21] mt-4 mb-1">{course.title}</h3>
                                                    <p className="text-sm text-gray-400 line-clamp-2">{course.description}</p>
                                                    <div className="mt-6 flex justify-between items-center">
                                                        <div className="flex gap-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                            <span>{course.lessons?.length || 0} Modules</span>
                                                            <span>₦{parseFloat(course.price || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <CourseContentManager courses={tutorCourses} lessons={lessons.filter(l => tutorCourses.some(c => c.id === l.course_id))} />
                                </>
                            )}
                        </div>
                    ) : currentTab === 'assessment-reviews' && userRole === 'tutor' ? (
                        <div className="space-y-8"><div><h2 className="text-3xl font-black text-[#1a1d21]">Assessment scoring</h2><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Objective results and project reviews</p></div>
                            <section><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">Objective quiz results</h3><p className="text-xs text-gray-400">Automatically scored attempts from your students</p></div><span className="rounded-full bg-[#e7fbfb] px-3 py-1 text-[10px] font-black text-[#087f81]">{objective_attempts.length} attempts</span></div>{objective_attempts.length?<div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400"><tr><th className="px-5 py-4">Student</th><th className="px-5 py-4">Assessment</th><th className="px-5 py-4">Questions</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Result</th><th className="px-5 py-4">Date</th></tr></thead><tbody>{objective_attempts.map(attempt=><tr key={attempt.id} className="border-t border-gray-50 text-xs"><td className="px-5 py-4"><p className="font-black text-[#1a1d21]">{attempt.user?.name}</p><p className="mt-1 text-[10px] text-gray-400">{attempt.user?.email}</p></td><td className="px-5 py-4"><p className="font-bold">{attempt.assignment?.title}</p><p className="mt-1 text-[10px] text-gray-400">{attempt.assignment?.lesson?.course?.title} · {attempt.assignment?.lesson?.title}</p></td><td className="px-5 py-4 font-bold">{attempt.correct_answers}/{attempt.total_questions}</td><td className="px-5 py-4"><p className="text-lg font-black text-[#087f81]">{attempt.score}/{attempt.assignment?.maximum_score}</p><p className="text-[9px] text-gray-400">Cutoff {attempt.assignment?.passing_score}</p></td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${attempt.passed?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600'}`}>{attempt.passed?'Passed':'Failed'}</span></td><td className="px-5 py-4 text-[10px] font-bold text-gray-400">{new Date(attempt.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>:<div className="rounded-[2rem] border border-dashed bg-white p-10 text-center text-sm font-bold text-gray-300">No objective attempts yet.</div>}</section>
                            <div><h3 className="text-lg font-black">Project submissions</h3><p className="mb-4 text-xs text-gray-400">Review submitted links, notes, and provide a score</p></div>
                            {assessment_submissions.length ? <div className="grid gap-5">{assessment_submissions.map(submission=>{const draft=reviewDrafts[submission.id]||{score:submission.score??'',mentor_feedback:submission.mentor_feedback??''};return <div key={submission.id} className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-widest text-[#087f81]">{submission.assignment?.lesson?.course?.title}</p><h3 className="mt-1 text-lg font-black">{submission.assignment?.title}</h3><p className="mt-1 text-xs font-bold text-gray-400">{submission.user?.name} · {submission.assignment?.lesson?.title}</p></div><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${submission.status==='approved'?'bg-emerald-100 text-emerald-700':submission.status==='changes_requested'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'}`}>{submission.status}</span></div><div className="mt-5 grid gap-2 text-xs">{submission.github_url&&<a className="font-bold text-[#087f81] underline" href={submission.github_url} target="_blank" rel="noreferrer">Open GitHub submission</a>}{submission.live_url&&<a className="font-bold text-[#087f81] underline" href={submission.live_url} target="_blank" rel="noreferrer">Open live project</a>}{submission.notes&&<p className="rounded-xl bg-gray-50 p-4 leading-6 text-gray-600">{submission.notes}</p>}</div><div className="mt-5 grid gap-3 md:grid-cols-[160px_1fr_auto]"><label className="text-[9px] font-black uppercase text-gray-400">Score / {submission.assignment?.maximum_score}<input type="number" min="0" max={submission.assignment?.maximum_score} value={draft.score} onChange={e=>setReviewDrafts(prev=>({...prev,[submission.id]:{...draft,score:e.target.value}}))} className="mt-2 w-full rounded-xl border-gray-200"/></label><label className="text-[9px] font-black uppercase text-gray-400">Tutor feedback<textarea rows="2" value={draft.mentor_feedback} onChange={e=>setReviewDrafts(prev=>({...prev,[submission.id]:{...draft,mentor_feedback:e.target.value}}))} className="mt-2 w-full rounded-xl border-gray-200"/></label><button type="button" onClick={()=>router.patch(`/assignment-submissions/${submission.id}`,draft,{preserveScroll:true})} className="self-end rounded-xl bg-[#1a1d21] px-5 py-3 text-[10px] font-black uppercase text-white hover:bg-[#00d2d3] hover:text-black">Save score</button></div><p className="mt-3 text-[10px] text-gray-400">Cutoff: {submission.assignment?.passing_score}. Scores at or above the cutoff automatically unlock the next lesson.</p></div>})}</div>:<div className="rounded-[2rem] border border-dashed bg-white p-16 text-center text-sm font-bold text-gray-300">No project assessments submitted yet.</div>}
                        </div>
                    ) : currentTab === 'earnings' && userRole === 'tutor' ? (
                        <div className="space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Earned</p>
                                    <h3 className="text-4xl font-black text-[#1a1d21]">₦{Number(stats.total_earnings || 0).toLocaleString()}</h3>
                                    <p className="text-[10px] text-gray-300 font-bold mt-2 uppercase">{stats.total_students || 0} paying students</p>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Available Balance</p>
                                    <h3 className="text-4xl font-black text-[#00d2d3]">₦{Number((stats.total_earnings || 0) - (stats.total_withdrawals || 0)).toLocaleString()}</h3>
                                    <Link href="?tab=withdrawals" className="mt-4 inline-block bg-[#1a1d21] text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all">
                                        Request Withdrawal
                                    </Link>
                                </div>
                            </div>

                            {/* Per-course breakdown */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest mb-6">Earnings by Course</h3>
                                {tutor_course_breakdown?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Course</th>
                                                    <th className="pb-4">Price</th>
                                                    <th className="pb-4">Students</th>
                                                    <th className="pb-4 text-right">Total Earned</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {tutor_course_breakdown.map(course => (
                                                    <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4 text-[#1a1d21]">{course.title}</td>
                                                        <td className="py-4">₦{Number(course.price || 0).toLocaleString()}</td>
                                                        <td className="py-4">{course.enrollments_count}</td>
                                                        <td className="py-4 text-right text-[#00d2d3]">₦{Number(course.enrollments_sum_amount_paid || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-black text-gray-300 uppercase">No earnings data yet</p>
                                )}
                            </div>

                            {/* Recent payment transactions */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest mb-6">Recent Transactions</h3>
                                {tutor_students?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Student</th>
                                                    <th className="pb-4">Course</th>
                                                    <th className="pb-4">Amount</th>
                                                    <th className="pb-4 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {tutor_students.map(enrollment => (
                                                    <tr key={enrollment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <p className="text-[#1a1d21]">{enrollment.user?.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{enrollment.user?.email}</p>
                                                        </td>
                                                        <td className="py-4 text-gray-500">{enrollment.course?.title}</td>
                                                        <td className="py-4 text-[#00d2d3]">₦{Number(enrollment.amount_paid || 0).toLocaleString()}</td>
                                                        <td className="py-4 text-right text-[10px] text-gray-400 uppercase">
                                                            {new Date(enrollment.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-black text-gray-300 uppercase">No transactions yet</p>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'my-students' && userRole === 'tutor' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1a1d21]">My Students</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Students enrolled in your courses</p>
                                </div>
                                <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {tutor_students?.length || 0} Enrollments
                                </span>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                {tutor_students?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Student</th>
                                                    <th className="pb-4">Course Enrolled</th>
                                                    <th className="pb-4">Amount Paid</th>
                                                    <th className="pb-4 text-right">Enrolled On</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {tutor_students.map(enrollment => (
                                                    <tr key={enrollment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-sm font-black text-[#00d2d3] shrink-0">
                                                                    {enrollment.user?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[#1a1d21]">{enrollment.user?.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold">{enrollment.user?.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-gray-500">{enrollment.course?.title}</td>
                                                        <td className="py-4">
                                                            <span className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full">
                                                                ₦{Number(enrollment.amount_paid || 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-[10px] text-gray-400 uppercase tracking-wider">
                                                            {new Date(enrollment.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <h3 className="text-xl font-black text-gray-400 mb-2">No Students Yet</h3>
                                        <p className="text-gray-300 text-sm">Students who enroll in your courses will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'withdrawals' && userRole === 'tutor' ? (
                        <div className="space-y-6">
                            {/* Balance summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Earned</p>
                                    <h3 className="text-4xl font-black text-[#1a1d21]">₦{Number(stats.total_earnings || 0).toLocaleString()}</h3>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Available to Withdraw</p>
                                    <h3 className="text-4xl font-black text-[#00d2d3]">₦{Number(available_balance || 0).toLocaleString()}</h3>
                                </div>
                            </div>

                            {/* Withdrawal request form */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-[#1a1d21] mb-1">Request a Withdrawal</h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-6">
                                    Maximum: ₦{Number(available_balance || 0).toLocaleString()}
                                </p>

                                <form onSubmit={submitWithdrawal} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={withdrawalForm.data.account_name}
                                                onChange={e => withdrawalForm.setData('account_name', e.target.value)}
                                                placeholder="e.g. John Doe"
                                                className={`w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] ${withdrawalForm.errors.account_name ? 'ring-2 ring-red-400' : ''}`}
                                            />
                                            {withdrawalForm.errors.account_name && <p className="text-red-500 text-[10px] font-bold ml-1">{withdrawalForm.errors.account_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={withdrawalForm.data.account_number}
                                                onChange={e => withdrawalForm.setData('account_number', e.target.value)}
                                                placeholder="e.g. 0123456789"
                                                maxLength={20}
                                                className={`w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] ${withdrawalForm.errors.account_number ? 'ring-2 ring-red-400' : ''}`}
                                            />
                                            {withdrawalForm.errors.account_number && <p className="text-red-500 text-[10px] font-bold ml-1">{withdrawalForm.errors.account_number}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={withdrawalForm.data.bank_name}
                                                onChange={e => withdrawalForm.setData('bank_name', e.target.value)}
                                                placeholder="e.g. GTBank"
                                                className={`w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] ${withdrawalForm.errors.bank_name ? 'ring-2 ring-red-400' : ''}`}
                                            />
                                            {withdrawalForm.errors.bank_name && <p className="text-red-500 text-[10px] font-bold ml-1">{withdrawalForm.errors.bank_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Amount (₦)</label>
                                            <input
                                                type="number"
                                                value={withdrawalForm.data.amount}
                                                onChange={e => withdrawalForm.setData('amount', e.target.value)}
                                                placeholder="Enter amount"
                                                min={1}
                                                max={available_balance}
                                                className={`w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] ${withdrawalForm.errors.amount ? 'ring-2 ring-red-400' : ''}`}
                                            />
                                            {withdrawalForm.errors.amount && <p className="text-red-500 text-[10px] font-bold ml-1">{withdrawalForm.errors.amount}</p>}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={withdrawalForm.processing || Number(available_balance || 0) <= 0}
                                            className="bg-[#1a1d21] text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-40"
                                        >
                                            {withdrawalForm.processing ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Withdrawal history */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest mb-6">My Withdrawal History</h3>
                                {my_withdrawals?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Bank Details</th>
                                                    <th className="pb-4">Amount</th>
                                                    <th className="pb-4">Status</th>
                                                    <th className="pb-4 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {my_withdrawals.map(w => (
                                                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <p className="text-[#1a1d21]">{w.account_name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{w.bank_name} · {w.account_number}</p>
                                                        </td>
                                                        <td className="py-4 font-black text-[#1a1d21]">₦{Number(w.amount).toLocaleString()}</td>
                                                        <td className="py-4">
                                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                                                w.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                                w.status === 'rejected'  ? 'bg-red-50 text-red-500' :
                                                                'bg-yellow-50 text-yellow-600'
                                                            }`}>
                                                                {w.status === 'completed' ? 'Approved' : w.status === 'rejected' ? 'Declined' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-[10px] text-gray-400 uppercase">
                                                            {new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase">No withdrawal requests yet</p>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'withdrawals' && userRole === 'admin' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1a1d21]">Withdrawal Requests</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Review and process tutor withdrawal requests</p>
                                </div>
                                <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {all_withdrawals?.filter(w => w.status === 'pending').length || 0} Pending
                                </span>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                {all_withdrawals?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                    <th className="pb-4 px-4">Tutor</th>
                                                    <th className="pb-4">Bank Details</th>
                                                    <th className="pb-4">Amount</th>
                                                    <th className="pb-4">Status</th>
                                                    <th className="pb-4">Date</th>
                                                    <th className="pb-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-bold text-gray-600">
                                                {all_withdrawals.map(w => (
                                                    <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <p className="text-[#1a1d21]">{w.user?.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{w.user?.email}</p>
                                                        </td>
                                                        <td className="py-4">
                                                            <p className="text-[#1a1d21]">{w.account_name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{w.bank_name} · {w.account_number}</p>
                                                        </td>
                                                        <td className="py-4 font-black text-[#1a1d21]">₦{Number(w.amount).toLocaleString()}</td>
                                                        <td className="py-4">
                                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                                                w.status === 'completed' ? 'bg-green-50 text-green-700' :
                                                                w.status === 'rejected'  ? 'bg-red-50 text-red-500' :
                                                                'bg-yellow-50 text-yellow-600'
                                                            }`}>
                                                                {w.status === 'completed' ? 'Approved' : w.status === 'rejected' ? 'Declined' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-[10px] text-gray-400 uppercase">
                                                            {new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            {w.status === 'pending' ? (
                                                                <div className="flex gap-2 justify-end">
                                                                    <Link
                                                                        href={route('withdrawals.approve', w.id)}
                                                                        method="post"
                                                                        as="button"
                                                                        className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-green-600 hover:text-white transition-all"
                                                                    >
                                                                        Approve
                                                                    </Link>
                                                                    <Link
                                                                        href={route('withdrawals.decline', w.id)}
                                                                        method="post"
                                                                        as="button"
                                                                        className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                                                                    >
                                                                        Decline
                                                                    </Link>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-300 font-black uppercase">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <h3 className="text-xl font-black text-gray-400 mb-2">No Requests Yet</h3>
                                        <p className="text-gray-300 text-sm">Tutor withdrawal requests will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : currentTab === 'certs' && userRole === 'student' ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-[#1a1d21]">My Certificates</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Certificates earned from completed courses</p>
                                </div>
                                <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {certificates?.length || 0} Earned
                                </span>
                            </div>

                            {!certificates || certificates.length === 0 ? (
                                <div className="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-400 mb-2">No Certificates Yet</h3>
                                    <p className="text-gray-300 text-sm">Complete a course and pass the final exam to earn your certificate.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {certificates.map(cert => (
                                        <div key={cert.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
                                            {/* Certificate card header */}
                                            <div className="bg-[#1a1d21] p-6 relative overflow-hidden">
                                                <div className="absolute right-4 top-4 opacity-10 text-white text-6xl font-black select-none">P36</div>
                                                <div className="relative z-10">
                                                    <span className="bg-[#00d2d3] text-black text-[9px] font-black uppercase px-3 py-1 rounded-full">Certificate of Completion</span>
                                                    <h3 className="text-white font-black text-lg mt-3 leading-tight">{cert.course?.title || 'Course'}</h3>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Exam Score</p>
                                                        <p className="text-2xl font-black text-[#00d2d3]">{cert.exam_score}%</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Issued</p>
                                                        <p className="text-sm font-black text-[#1a1d21]">
                                                            {new Date(cert.issued_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{cert.certificate_number}</p>
                                                <Link
                                                    href={route('certificates.show', cert.id)}
                                                    className="w-full flex items-center justify-center gap-2 bg-[#1a1d21] text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Certificate
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    ) : currentTab === 'exams' && userRole === 'tutor' ? (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-black text-[#1a1d21]">Course Exams</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Set final exams for your courses — students must score 70% to earn a certificate</p>
                            </div>

                            {/* Course selector */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Course to Manage Exam</label>
                                <select
                                    value={examCourseId}
                                    onChange={e => setExamCourseId(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-[#1a1d21] focus:ring-2 focus:ring-[#00d2d3]"
                                >
                                    <option value="">— Choose a course —</option>
                                    {tutorCourses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} {c.exam ? `(${c.exam.questions?.length || 0} questions)` : '(No exam yet)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {examCourseId && !selectedCourseExam && (
                                <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-gray-200 text-center space-y-4">
                                    <p className="text-gray-400 font-bold text-sm">No exam set for <span className="font-black text-[#1a1d21]">{selectedExamCourse?.title}</span> yet.</p>
                                    <button
                                        onClick={createExam}
                                        disabled={submittingExam}
                                        className="bg-[#1a1d21] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-50"
                                    >
                                        {submittingExam ? 'Creating...' : 'Create Exam'}
                                    </button>
                                </div>
                            )}

                            {examCourseId && selectedCourseExam && (
                                <div className="space-y-6">
                                    {/* Existing questions */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest">
                                                {selectedCourseExam.title}
                                            </h3>
                                            <span className="bg-teal-50 text-[#00d2d3] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                                {selectedCourseExam.questions?.length || 0} Questions
                                            </span>
                                        </div>

                                        {!selectedCourseExam.questions || selectedCourseExam.questions.length === 0 ? (
                                            <p className="text-center py-8 text-[10px] font-black text-gray-300 uppercase tracking-widest">No questions added yet — use the form below</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedCourseExam.questions.map((q, idx) => (
                                                    <div key={q.id} className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <p className="text-sm font-black text-[#1a1d21] flex-1">
                                                                <span className="text-[#00d2d3] mr-1">{idx + 1}.</span> {q.question}
                                                            </p>
                                                            <button
                                                                onClick={() => deleteQuestion(q.id)}
                                                                className="text-red-400 hover:text-red-600 transition shrink-0 p-1"
                                                                title="Delete question"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(q.options || []).map((opt, oIdx) => (
                                                                <div key={opt.id} className={`text-[11px] font-bold px-3 py-2 rounded-xl ${opt.is_correct ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500'}`}>
                                                                    <span className="font-black mr-1">{['A','B','C','D'][oIdx]}.</span> {opt.option_text}
                                                                    {opt.is_correct && <span className="ml-1 text-[9px] font-black uppercase tracking-wider">(correct)</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add question form */}
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-black text-[#1a1d21] uppercase tracking-widest mb-6">Add New Question</h3>
                                        <form onSubmit={addQuestion} className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question</label>
                                                <textarea
                                                    value={questionForm.question}
                                                    onChange={e => setQuestionForm(f => ({ ...f, question: e.target.value }))}
                                                    placeholder="Enter the question text..."
                                                    rows={2}
                                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] resize-none"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {questionForm.options.map((opt, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                            Option {['A','B','C','D'][idx]}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => {
                                                                const opts = [...questionForm.options];
                                                                opts[idx] = e.target.value;
                                                                setQuestionForm(f => ({ ...f, options: opts }));
                                                            }}
                                                            placeholder={`Option ${['A','B','C','D'][idx]}`}
                                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]"
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Correct Answer</label>
                                                <div className="flex gap-3">
                                                    {['A','B','C','D'].map((label, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setQuestionForm(f => ({ ...f, correctIndex: idx }))}
                                                            className={`w-12 h-12 rounded-2xl font-black text-sm border-2 transition-all ${
                                                                questionForm.correctIndex === idx
                                                                    ? 'bg-[#00d2d3] border-[#00d2d3] text-black'
                                                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={submittingQuestion}
                                                    className="bg-[#1a1d21] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all disabled:opacity-50"
                                                >
                                                    {submittingQuestion ? 'Adding...' : '+ Add Question'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200 uppercase text-[10px] font-black tracking-widest text-gray-300">
                            Section coming soon
                        </div>
                    )}
                </main>

                {/* RIGHT PANEL */}
                <aside className="space-y-6">
                    {userRole === 'student' ? (
                        <StudentIDCard user={auth.user} track={user_data?.enrolled_track} />
                    ) : (
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 text-center">
                            <div className="w-24 h-24 rounded-full bg-gray-50 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-[#1a1d21] border-4 border-white shadow-sm">
                                {auth.user.name.charAt(0)}
                            </div>
                            <h4 className="font-black text-[#1a1d21] uppercase tracking-tighter">{auth.user.name}</h4>
                            <span className="text-[9px] font-black uppercase text-gray-400 bg-gray-50 px-3 py-1 rounded-full mt-2 inline-block tracking-widest">{userRole} Account</span>
                        </div>
                    )}
                    <RecentActivities activities={props.recent_activities} />
                </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
