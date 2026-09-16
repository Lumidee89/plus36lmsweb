import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const empty = { course_id: '', name: '', starts_on: '', ends_on: '', capacity: '', price: '', status: 'active' };
const field = 'mt-1 w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500';
export default function CohortManagement({ cohorts = [], courses }) {
    const [editing, setEditing] = useState(null);
    const [data, setData] = useState(empty);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const set = (key, value) => setData(previous => ({ ...previous, [key]: value }));
    const reset = () => { setEditing(null); setData(empty); setError(''); };
    function edit(item) {
        setEditing(item.id);
        setData(Object.fromEntries(Object.keys(empty).map(key => [key, item[key] ?? ''])));
        setError(''); setMessage('');
    }
    async function save(event) {
        event.preventDefault(); setBusy(true); setError(''); setMessage('');
        try {
            if (editing) await axios.patch(`/platform/cohorts/${editing}`, data);
            else await axios.post('/platform/cohorts', data);
            reset(); setMessage(editing ? 'Cohort updated.' : 'Cohort created.');
            router.reload({ only: ['platform', 'cohorts'] });
        } catch (error) { setError(Object.values(error.response?.data?.errors ?? {}).flat().join(' ') || error.response?.data?.message || 'Unable to save. Please try again.'); }
        finally { setBusy(false); }
    }
    async function remove(item) {
        if (!window.confirm(`Delete “${item.name}”? It will be removed from cohort listings and closed to enrollment. Existing students keep course access; payment history is retained.`)) return;
        setBusy(true); setError(''); setMessage('');
        try {
            const response = await axios.delete(`/platform/cohorts/${item.id}`);
            if (editing === item.id) reset();
            setMessage(response.data.message);
            router.reload({ only: ['platform', 'cohorts'] });
        } catch (error) { setError(error.response?.data?.message || 'Unable to delete. Please try again.'); }
        finally { setBusy(false); }
    }
    return <div>
        <h4 className="mb-3 font-bold">{editing ? 'Edit cohort' : 'Create cohort'}</h4>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
        <form onSubmit={save}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">Course<select required className={field} value={data.course_id} onChange={event => { const value = event.target.value; setData(previous => ({ ...previous, course_id: value, price: editing ? previous.price : courses.find(course => String(course.id) === value)?.price ?? '' })); }}><option value="">Select course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
            <label className="text-xs font-bold">Cohort name<input required maxLength={255} className={field} value={data.name} onChange={event => set('name', event.target.value)} /></label>
            <label className="text-xs font-bold">Enrollment fee (₦)<input required type="number" min="0" step="0.01" className={field} value={data.price} onChange={event => set('price', event.target.value)} /></label>
            <label className="text-xs font-bold">Maximum students<input required type="number" min="1" max="100000" step="1" className={field} value={data.capacity} onChange={event => set('capacity', event.target.value)} /></label>
            <label className="text-xs font-bold">Starts on<input required type="date" className={field} value={data.starts_on} onChange={event => set('starts_on', event.target.value)} /></label>
            <label className="text-xs font-bold">Ends on (optional)<input type="date" min={data.starts_on} className={field} value={data.ends_on} onChange={event => set('ends_on', event.target.value)} /></label>
            {editing && <label className="text-xs font-bold">Status<select className={field} value={data.status} onChange={event => set('status', event.target.value)}><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select></label>}
            <div className="flex items-end gap-2 sm:col-span-2"><button className="rounded-xl bg-[#1a1d21] px-5 py-3 text-xs font-black text-white disabled:opacity-50">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create cohort'}</button>{editing && <button type="button" onClick={reset} className="rounded-xl border px-5 py-3 text-xs font-bold">Cancel</button>}</div>
        </fieldset></form>
        {editing && <p className="mt-3 text-xs text-slate-500">New fees apply to new checkouts. Existing reservations keep their quoted fee. Capacity must cover enrolled students and reserved seats.</p>}
        <div className="mt-5 space-y-3">{cohorts.map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.course_title} · ₦{Number(item.price).toLocaleString()} · {item.enrolled_count ?? 0}/{item.capacity ?? 'Unlimited'} enrolled · {item.status === 'active' && item.is_full ? 'Full' : item.status}</p><div className="mt-3 flex gap-4"><button disabled={busy} onClick={() => edit(item)} className="text-xs font-bold text-teal-700">Edit</button><button disabled={busy} onClick={() => remove(item)} className="text-xs font-bold text-red-600">Delete</button></div></div>)}</div>
    </div>;
}
