import { useForm } from '@inertiajs/react';

export default function CreateCourseForm({ faculties }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        faculty_id: '',
        price: '',
        duration: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('courses.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#1a1d21]">Launch New Course</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                    Expand the Plus36 curriculum
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Course Title</label>
                        <input 
                            type="text" 
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="e.g. Advanced Laravel Architecture" 
                            className={`w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3] ${errors.title ? 'ring-2 ring-red-500' : ''}`} 
                        />
                        {errors.title && <p className="text-red-500 text-[10px] mt-1 ml-4 font-bold">{errors.title}</p>}
                    </div>

                    {/* Faculty Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Faculty</label>
                        <select 
                            value={data.faculty_id}
                            onChange={e => setData('faculty_id', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]"
                        >
                            <option value="">Select Faculty</option>
                            {faculties.map(faculty => (
                                <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Tuition Fee (₦)</label>
                        <input 
                            type="number" 
                            value={data.price}
                            onChange={e => setData('price', e.target.value)}
                            placeholder="299" 
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]" 
                        />
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Duration (Weeks)</label>
                        <input 
                            type="text" 
                            value={data.duration}
                            onChange={e => setData('duration', e.target.value)}
                            placeholder="e.g. 12 Weeks" 
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]" 
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Course Overview</label>
                    <textarea 
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        rows="4"
                        placeholder="Describe the learning path..."
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00d2d3]"
                    ></textarea>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="bg-[#1a1d21] text-white px-12 py-4 rounded-2xl font-black hover:bg-[#00d2d3] hover:text-[#1a1d21] transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                    >
                        {processing ? 'Publishing...' : 'Publish Course'}
                    </button>
                </div>
            </form>
        </div>
    );
}