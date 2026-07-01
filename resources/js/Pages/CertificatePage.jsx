import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function CertificatePage({ certificate }) {
    const course   = certificate.course;
    const student  = certificate.user;
    const tutor    = course?.user;
    const issuedAt = new Date(certificate.issued_at);

    const formatDate = (date) =>
        date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#f8f9fd] font-sans flex flex-col">
            <Head title={`Certificate — ${course?.title || 'Course'} | Plus36 Academy`} />

            {/* Print-hidden toolbar */}
            <div className="flex items-center justify-between px-8 py-4 no-print">
                <Link
                    href="/dashboard?tab=certs"
                    className="flex items-center gap-2 text-gray-500 hover:text-[#1a1d21] font-black text-[10px] uppercase tracking-widest transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    My Certificates
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-[#1a1d21] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2d3] hover:text-black transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save PDF
                </button>
            </div>

            {/* Certificate */}
            <div className="flex-1 flex items-center justify-center p-8 print-full">
                <div
                    className="certificate-card w-full max-w-4xl bg-white relative overflow-hidden"
                    style={{
                        border: '12px solid #1a1d21',
                        borderRadius: '2rem',
                        padding: '4rem',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
                        minHeight: '580px',
                    }}
                >
                    {/* Corner decorations */}
                    <div style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, border: '3px solid #00d2d3', borderRadius: '50%', opacity: 0.3 }} />
                    <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, border: '3px solid #00d2d3', borderRadius: '50%', opacity: 0.3 }} />
                    <div style={{ position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, border: '3px solid #00d2d3', borderRadius: '50%', opacity: 0.3 }} />
                    <div style={{ position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, border: '3px solid #00d2d3', borderRadius: '50%', opacity: 0.3 }} />

                    {/* Background watermark */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '18rem',
                        fontWeight: 900,
                        color: '#f0f0f0',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        lineHeight: 1,
                    }}>
                        P36
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

                        {/* Logo + Institution */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#1a1d21',
                                color: '#00d2d3',
                                padding: '8px 20px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                fontWeight: 900,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                            }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Plus36 Learning Academy
                            </div>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: '2.8rem',
                            fontWeight: 900,
                            color: '#1a1d21',
                            letterSpacing: '-0.03em',
                            margin: '1.5rem 0 0.5rem',
                            lineHeight: 1.1,
                        }}>
                            Certificate of Completion
                        </h1>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '1.5rem 0' }}>
                            <div style={{ height: 2, width: 60, background: '#00d2d3', borderRadius: 2 }} />
                            <div style={{ width: 8, height: 8, background: '#00d2d3', borderRadius: '50%' }} />
                            <div style={{ height: 2, width: 60, background: '#00d2d3', borderRadius: 2 }} />
                        </div>

                        {/* Body text */}
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            This certifies that
                        </p>

                        <h2 style={{
                            fontSize: '2.2rem',
                            fontWeight: 900,
                            color: '#1a1d21',
                            letterSpacing: '-0.02em',
                            margin: '0.25rem 0 1rem',
                            borderBottom: '3px solid #00d2d3',
                            display: 'inline-block',
                            paddingBottom: '0.25rem',
                        }}>
                            {student?.name || 'Student'}
                        </h2>

                        <p style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 700, margin: '0.5rem 0' }}>
                            has successfully completed the course
                        </p>

                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            color: '#1a1d21',
                            margin: '0.5rem 0 0.75rem',
                            letterSpacing: '-0.01em',
                        }}>
                            {course?.title || 'Course'}
                        </h3>

                        <p style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 700 }}>
                            with a final exam score of{' '}
                            <span style={{ color: '#00d2d3', fontWeight: 900 }}>{certificate.exam_score}%</span>
                        </p>

                        {/* Footer row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginTop: '3rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid #f3f4f6',
                        }}>
                            {/* Instructor */}
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ width: 100, height: 2, background: '#1a1d21', marginBottom: '6px' }} />
                                <p style={{ fontSize: '11px', fontWeight: 900, color: '#1a1d21', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {tutor?.name || 'Instructor'}
                                </p>
                                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Course Instructor
                                </p>
                            </div>

                            {/* Seal */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: '#1a1d21',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 6px',
                                    color: '#00d2d3',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                }}>
                                    P36
                                </div>
                                <p style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Official Seal</p>
                            </div>

                            {/* Date + Cert # */}
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ width: 100, height: 2, background: '#1a1d21', marginBottom: '6px', marginLeft: 'auto' }} />
                                <p style={{ fontSize: '11px', fontWeight: 900, color: '#1a1d21', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {formatDate(issuedAt)}
                                </p>
                                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Date Issued
                                </p>
                            </div>
                        </div>

                        {/* Cert number */}
                        <p style={{ marginTop: '1.5rem', fontSize: '10px', color: '#d1d5db', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            Certificate #{certificate.certificate_number}
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .print-full { padding: 0 !important; }
                    .certificate-card {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}
