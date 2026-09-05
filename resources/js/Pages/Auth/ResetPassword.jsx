import { Head, Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcfd] p-6">
            <Head title="Reset Password | Plus36 Academy" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#1a1d21 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 w-full max-w-md rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl">
                <Link href="/" className="mb-8 inline-flex">
                    <img src="/log.png" alt="Plus36 Academy" className="h-14 w-auto object-contain" />
                </Link>
                <h1 className="text-3xl font-black tracking-tighter text-[#1a1d21]">Choose a new password.</h1>
                <p className="mt-3 text-sm font-medium text-gray-500">Use at least eight characters for your new password.</p>

                <form onSubmit={submit} className="mt-8 space-y-5">
                    {[
                        { id: 'email', label: 'Email Address', type: 'email', autoComplete: 'email' },
                        { id: 'password', label: 'New Password', type: 'password', autoComplete: 'new-password' },
                        { id: 'password_confirmation', label: 'Confirm New Password', type: 'password', autoComplete: 'new-password' },
                    ].map((field) => (
                        <div key={field.id}>
                            <label htmlFor={field.id} className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{field.label}</label>
                            <input id={field.id} name={field.id} type={field.type} value={data[field.id] || ''}
                                autoComplete={field.autoComplete} required autoFocus={field.id === 'password'}
                                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs font-bold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#00d2d3]"
                                onChange={(e) => setData(field.id, e.target.value)} />
                            {errors[field.id] && <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-500">{errors[field.id]}</p>}
                        </div>
                    ))}

                    <button type="submit" disabled={processing}
                        className="w-full rounded-2xl bg-[#1a1d21] py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-gray-100 transition-all duration-500 hover:bg-[#00d2d3] hover:text-black disabled:cursor-not-allowed disabled:opacity-60">
                        {processing ? 'Updating Password…' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
