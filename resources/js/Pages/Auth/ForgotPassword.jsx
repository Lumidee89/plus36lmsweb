import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post('/forgot-password');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcfd] p-6">
            <Head title="Forgot Password | Plus36 Academy" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#1a1d21 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 w-full max-w-md rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl">
                <Link href="/" className="mb-8 inline-flex">
                    <img src="/log.png" alt="Plus36 Academy" className="h-14 w-auto object-contain" />
                </Link>

                <h1 className="text-3xl font-black tracking-tighter text-[#1a1d21]">Reset your password.</h1>
                <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500">
                    Enter the email address linked to your account and we’ll send you a secure reset link.
                </p>

                {status && (
                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-700">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Email Address</label>
                        <input id="email" type="email" name="email" value={data.email} autoFocus autoComplete="email" required
                            placeholder="name@example.com"
                            className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs font-bold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#00d2d3]"
                            onChange={(e) => setData('email', e.target.value)} />
                        {errors.email && <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-500">{errors.email}</p>}
                    </div>

                    <button type="submit" disabled={processing}
                        className="w-full rounded-2xl bg-[#1a1d21] py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-gray-100 transition-all duration-500 hover:bg-[#00d2d3] hover:text-black disabled:cursor-not-allowed disabled:opacity-60">
                        {processing ? 'Sending Link…' : 'Email Reset Link'}
                    </button>

                    <div className="text-center">
                        <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-[#00d2d3]">
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
