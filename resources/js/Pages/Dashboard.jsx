import { Link, Head, usePage, useForm } from '@inertiajs/react';
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

export default function Dashboard({ auth, stats, user_data, faculties, courses, lessons }) {
    const { url, props } = usePage();
    const flash = props.flash || {};
    const urlParams = new URLSearchParams(url.split('?')[1] || ""); 
    const currentTab = urlParams.get('tab');
    
    const userRole = auth.user.role;

    const { data, setData, post, patch, processing, reset, errors } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        password: '',
    });

    const updateProfile = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('password', '');
            },
        });
    };

    const submitFaculty = (e) => {
        e.preventDefault();
        post(route('faculties.store'), {
            onSuccess: () => reset(),
        });
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
                                            <Link href="?tab=withdrawals" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'withdrawals' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Withdrawals /><span>Withdrawals</span></Link>
                                            <Link href="?tab=settings" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'settings' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Settings /><span>Settings</span></Link>
                                        </>
                                    )}

                                    {userRole === 'student' && (
                                        <>
                                            <Link href="?tab=my-courses" className={`flex items-center space-x-3 p-3 rounded-2xl transition ${currentTab === 'my-courses' ? 'bg-teal-50 text-[#00d2d3] font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Icons.Courses /><span>My Courses</span></Link>
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
                    ) : currentTab === 'faculty' ? (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h2 className="text-2xl font-black text-[#1a1d21] mb-6">Faculty Management</h2>
                            <form onSubmit={submitFaculty} className="flex gap-4">
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Faculty Name" className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold" />
                                <button type="submit" disabled={processing} className="bg-[#1a1d21] text-white px-8 rounded-2xl font-black hover:bg-[#00d2d3] transition-all">Add</button>
                            </form>
                        </div>
                    ) : currentTab === 'my-courses' ? (
                        <div className="space-y-10">
                            <CreateCourseForm faculties={faculties || []} />
                            <CourseContentManager courses={courses || []} lessons={lessons || []} />
                        </div>
                    ) : currentTab === 'settings' ? (
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="mb-10">
                                <h2 className="text-3xl font-black text-[#1a1d21] tracking-tight">Account Settings</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage your profile and security</p>
                            </div>

                            <form onSubmit={updateProfile} className="space-y-8 max-w-2xl">
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