import React from 'react';
import { Link, Head, usePage, useForm, router } from '@inertiajs/react';
import StudentIDCard from './Dashboard/Components/StudentIDCard';
import CreateCourseForm from './Dashboard/Components/CreateCourseForm';
import CourseContentManager from './Dashboard/Components/CourseContentManager';

// Reusable Stats Card Component
const StatsCard = ({ label, value, icon, color = "#00d2d3" }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
        <div className="p-4 rounded-2xl transition-colors group-hover:bg-[#1a1d21]/5" style={{ backgroundColor: `${color}15`, color: color }}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-[#1a1d21] tracking-tight">{value}</h3>
        </div>
    </div>
);

export default function Dashboard({ auth, stats, user_data, faculties, courses, enrolledCourses, lessons, tutor_students, tutor_course_breakdown, my_withdrawals, available_balance, all_students, all_tutors, all_withdrawals, certificates }) {
    const { url, props } = usePage();
    const flash = props.flash || {};
    const urlParams = new URLSearchParams(url.split('?')[1] || "");
    const currentTab = urlParams.get('tab');

    const userRole = auth.user.role;
    const [showCreateForm, setShowCreateForm] = React.useState(false);

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
        <div className="min-h-screen bg-[#f8f9fd] font-sans">
            <Head title="Dashboard | Plus36 Academy" />

            {/* TOP NAVIGATION HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <img 
                            src="/logo.png" 
                            alt="Plus36 Academy" 
                            className="h-16 w-auto object-contain hover:opacity-80 transition-opacity" 
                        />
                    </Link>
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 px-4 py-2 rounded-full w-64 text-xs font-bold text-gray-500">
                            Search courses...
                        </div>
                        <button className="relative p-2 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </div>
            </header>
            
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 p-6">
                
                {/* SIDEBAR NAVIGATION */}
                <aside className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
                        <nav className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Overview</p>
                                <div className="space-y-1 text-sm">
                                    <Link href="/dashboard" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${!currentTab ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}>
                                        <Icons.Dashboard />
                                        <span>Dashboard</span>
                                    </Link>

                                    {userRole === 'admin' && (
                                        <>
                                            <Link href="?tab=courses" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'courses' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Courses /><span>Courses</span></Link>
                                            <Link href="?tab=students" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'students' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Users /><span>Students</span></Link>
                                            <Link href="?tab=faculty" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'faculty' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Faculty /><span>Faculty</span></Link>
                                            <Link href="?tab=revenue" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'revenue' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Revenue /><span>Revenue</span></Link>
                                            <Link href="?tab=withdrawals" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'withdrawals' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Withdrawals /><span>Withdrawals</span></Link>
                                            <Link href="?tab=settings" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'settings' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Settings /><span>Settings</span></Link>
                                        </>
                                    )}

                                    {userRole === 'tutor' && (
                                        <>
                                            <Link href="?tab=my-courses" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'my-courses' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Courses /><span>My Courses</span></Link>
                                            <Link href="?tab=earnings" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'earnings' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Revenue /><span>Earnings</span></Link>
                                            <Link href="?tab=my-students" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'my-students' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Users /><span>My Students</span></Link>
                                            <Link href="?tab=exams" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'exams' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Certs /><span>Exams</span></Link>
                                            <Link href="?tab=withdrawals" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'withdrawals' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Withdrawals /><span>Withdrawals</span></Link>
                                            <Link href="?tab=settings" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'settings' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Settings /><span>Settings</span></Link>
                                        </>
                                    )}

                                    {userRole === 'student' && (
                                        <>
                                            <Link href="?tab=available-courses" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'available-courses' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Courses /><span>Available Courses</span></Link>
                                                <Link href="?tab=my-courses" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'my-courses' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Courses /><span>My Learning</span></Link>
                                            <Link href="?tab=certs" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'certs' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Certs /><span>Certs/Transcript</span></Link>
                                            <Link href="?tab=settings" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'settings' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Settings /><span>Settings</span></Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <Link href="/logout" method="post" as="button" className="flex items-center space-x-3 p-3 text-gray-400 hover:text-red-500 transition w-full font-bold">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                    <span>Logout</span>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 space-y-6">
                    {flash.message && (
                        <div className="bg-[#00d2d3] text-[#1a1d21] p-4 rounded-2xl font-black flex items-center justify-between shadow-lg">
                            <div className="flex items-center space-x-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                <span>{flash.message}</span>
                            </div>
                        </div>
                    )}

                    {!currentTab ? (
                        <>
                            {/* HERO SECTION */}
                            <div className="relative bg-gradient-to-r from-[#1a1d21] to-[#2d3238] rounded-[2.5rem] p-10 text-white shadow-xl overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Welcome back, {auth.user.name.split(' ')[0]}!</h1>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Plus36 Academy {userRole} Portal</p>
                                </div>
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                                    <Icons.Dashboard />
                                </div>
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
                                    <StatsCard label="Enrolled Courses" value={stats.total_courses || 0} icon={<Icons.Courses />} color="#00d2d3" />
                                )}
                            </div>
                        </>
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
                                                    <button className="text-[#00d2d3] hover:underline">View Details</button>
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
                <aside className="w-full lg:w-80 space-y-6">
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
    );
}