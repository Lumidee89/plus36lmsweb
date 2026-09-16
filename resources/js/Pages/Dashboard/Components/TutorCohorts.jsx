export default function TutorCohorts({ cohorts = [] }) {
    return <section className="space-y-4"><h3 className="text-xl font-black">Cohort students</h3>
        {!cohorts.length && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">No cohorts assigned to you yet.</p>}
        {cohorts.map(cohort => <article key={cohort.id} className="rounded-2xl border border-slate-100 bg-white p-6">
            <h4 className="font-black">{cohort.name}</h4><p className="mt-1 text-sm text-teal-700">{cohort.course_title}</p><p className="my-3 text-xs text-slate-500">{cohort.starts_on} · {cohort.enrolled_count}{cohort.capacity ? `/${cohort.capacity}` : ''} students · {cohort.status}</p>
            {!cohort.students.length ? <p className="text-sm text-slate-400">No students enrolled yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-400"><th className="py-3">Student</th><th>Email</th><th>Enrolled</th></tr></thead><tbody>{cohort.students.map(student => <tr key={student.id} className="border-b border-slate-50"><td className="py-3 font-bold">{student.name}</td><td>{student.email}</td><td>{student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div>}
        </article>)}
    </section>;
}
