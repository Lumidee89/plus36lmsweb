import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function CohortList({ cohorts = [] }) {
    const { auth } = usePage().props;
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState('');
    async function join(cohort) {
        setBusy(cohort.id);
        setMessage('');
        try {
            const { data } = await axios.post(`/cohorts/${cohort.id}/join`);
            if (data.authorization_url) {
                window.location.assign(data.authorization_url);
                return;
            }
            setMessage(data.message);
            router.reload({ only: ['cohorts', 'enrolledCourses', 'stats'] });
        } catch (error) {
            setMessage(error.response?.data?.message ?? 'Unable to enroll. Please try again.');
            router.reload({ only: ['cohorts'] });
        } finally {
            setBusy(null);
        }
    }
    return <section id="cohorts" className="space-y-5">
        <div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Learn together</p><h2 className="mt-2 text-3xl font-black">Join a cohort</h2><p className="mt-2 text-sm text-slate-500">Choose your course, schedule and group. Enrollment includes course access.</p></div>
        {message && <p role="status" className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">{message}</p>}
        {!cohorts.length && <p className="text-sm text-slate-500">New cohorts will appear here when enrollment opens.</p>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cohorts.map(cohort => <article key={cohort.id} className="flex flex-col rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-teal-700">{cohort.course_title}</p><h3 className="mt-2 text-xl font-black">{cohort.name}</h3>
            <p className="mt-3 text-sm text-slate-500">{cohort.starts_on}{cohort.ends_on ? ` — ${cohort.ends_on}` : ''}</p>
            <p className="mt-3 text-2xl font-black">{Number(cohort.price) === 0 ? 'Free' : `₦${Number(cohort.price).toLocaleString()}`}</p>
            <p className="mb-5 mt-2 text-sm text-slate-500">{cohort.enrolled_count} enrolled{cohort.capacity ? ` / ${cohort.capacity} students` : ''} · {cohort.remaining_seats === null ? 'Open enrollment' : `${cohort.remaining_seats} seats available`}</p>
            {cohort.has_pending_checkout && !cohort.is_enrolled && <p className="mb-3 text-xs text-teal-700">Your seat is held for 30 minutes from checkout. Resume to finish payment.</p>}
            {!auth?.user && !cohort.is_full && !cohort.is_closed ? <Link href="/login" className="mt-auto rounded-xl bg-teal-800 p-3 text-center font-bold text-white">Sign in to enroll</Link> :
            <button onClick={() => join(cohort)} disabled={busy !== null || cohort.is_enrolled || cohort.is_closed || (cohort.is_full && !cohort.has_pending_checkout) || auth?.user?.role !== 'student'} className="mt-auto rounded-xl bg-teal-800 p-3 font-bold text-white disabled:bg-slate-100 disabled:text-slate-500">
                {cohort.is_enrolled ? 'Enrolled' : cohort.is_closed ? 'Closed' : cohort.has_pending_checkout ? 'Resume payment' : cohort.is_full ? 'Full' : busy === cohort.id ? 'Please wait…' : 'Enroll in cohort'}
            </button>}
        </article>)}</div>
    </section>;
}
