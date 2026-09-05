import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';

const input = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:border-[#00d2d3] focus:ring-[#00d2d3]';
const Button = ({ children, disabled }) => <button disabled={disabled} className="rounded-xl bg-[#1a1d21] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#00d2d3] hover:text-black disabled:opacity-40">{children}</button>;
const ManageActions = ({ onEdit, onDelete }) => <span className="ml-auto inline-flex gap-1"><button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); onEdit(); }} className="rounded-md bg-[#e7fbfb] px-2 py-1 text-[8px] font-black uppercase text-[#087f81]">Edit</button><button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); onDelete(); }} className="rounded-md bg-red-50 px-2 py-1 text-[8px] font-black uppercase text-red-500">Delete</button></span>;
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const selectionRef = useRef(null);
    const [active, setActive] = useState({});

    // Only write external changes into the DOM. Replacing innerHTML on every
    // keystroke destroys the browser selection and sends the caret to the start.
    useEffect(() => {
        const editor = editorRef.current;
        if (editor && editor.innerHTML !== (value || '')) editor.innerHTML = value || '';
    }, [value]);

    const rememberSelection = () => {
        const selection = window.getSelection();
        if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
            selectionRef.current = selection.getRangeAt(0).cloneRange();
        }
        setActive({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
        });
    };
    const restoreSelection = () => {
        const selection = window.getSelection();
        if (!selectionRef.current || !selection) return;
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
    };
    const command = (name, argument = null) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand(name, false, argument);
        onChange(editorRef.current?.innerHTML || '');
        rememberSelection();
    };
    const tools = [
        ['bold', 'B', 'Bold'], ['italic', 'I', 'Italic'], ['underline', 'U', 'Underline'],
        ['formatBlock', 'H3', 'Heading'], ['insertUnorderedList', '• List', 'Bulleted list'],
        ['insertOrderedList', '1. List', 'Numbered list'],
    ];
    return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-[#00d2d3] focus-within:ring-2 focus-within:ring-[#00d2d3]/10">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2.5">{tools.map(([name,label,title]) => <button key={name} type="button" title={title} aria-label={title} aria-pressed={Boolean(active[name])} onMouseDown={e => { e.preventDefault(); command(name, name === 'formatBlock' ? 'h3' : null); }} className={`min-w-9 rounded-lg border px-3 py-2 text-[11px] font-black transition ${active[name] ? 'border-[#0D5B56] bg-[#0D5B56] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-[#00d2d3] hover:bg-[#e7fbfb]'}`}>{label}</button>)}</div>
        <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e => { rememberSelection(); onChange(e.currentTarget.innerHTML); }} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onFocus={rememberSelection} className="min-h-48 p-4 text-sm leading-7 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-black [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-1 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7" data-placeholder="Write and format the lesson article…" />
    </div>;
};

export default function CourseContentManager({ courses }) {
    const [courseId, setCourseId] = useState(String(courses[0]?.id || ''));
    const [step, setStep] = useState(1);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const course = courses.find(item => String(item.id) === courseId);
    const weeks = course?.weeks || [];
    const modules = useMemo(() => weeks.flatMap(item => item.modules || []), [weeks]);
    const lessons = useMemo(() => modules.flatMap(item => item.lessons || []), [modules]);
    const week = useForm({ title: '', description: '' });
    const module = useForm({ course_week_id: '', title: '', description: '' });
    const lesson = useForm({ course_id: courseId, course_module_id: '', lesson_title: '', estimated_minutes: 10, is_preview: false });
    const material = useForm({ lesson_id: '', title: '', type: 'text', content: '', video_url: '', file: null });
    const assignment = useForm({ lesson_id: '', type: 'objective', title: '', instructions: '', maximum_score: 100, passing_score: 70, rubric: ['', '', ''], due_at: '' });
    const question = useForm({ question: '', options: ['', '', '', ''], correct_index: 0 });
    const assessmentLesson = lessons.find(item => String(item.id) === String(assignment.data.lesson_id));
    const savedAssessment = assessmentLesson?.assignment || null;
    const addAssessmentQuestion = event => { event.preventDefault(); if (!savedAssessment) return; const path=editingQuestionId?`/assignment-questions/${editingQuestionId}`:`/assignments/${savedAssessment.id}/questions`; const options={preserveScroll:true,onSuccess:()=>{question.reset();setEditingQuestionId(null)}}; editingQuestionId?question.patch(path,options):question.post(path,options); };
    const removeAssessmentQuestion = id => router.delete(`/assignment-questions/${id}`, { preserveScroll:true });
    const editAssessmentQuestion = item => { const options=(item.options||[]).map(option=>option.option_text); while(options.length<4)options.push(''); question.setData({question:item.question,options,correct_index:Math.max(0,(item.options||[]).findIndex(option=>option.is_correct))});setEditingQuestionId(item.id); };
    const confirmDelete = (path, label) => { if (window.confirm(`Delete this ${label}? This cannot be undone.`)) router.delete(path, { preserveScroll:true }); };
    const promptUpdate = (path, item, includeDescription = true) => { const title=window.prompt('Title',item.title);if(title===null||!title.trim())return;const data={title:title.trim()};if(includeDescription){const description=window.prompt('Description',item.description||'');if(description===null)return;data.description=description;}router.patch(path,data,{preserveScroll:true}); };
    const editLesson = item => { const title=window.prompt('Lesson title',item.title);if(title===null||!title.trim())return;const estimated_minutes=window.prompt('Estimated minutes',item.estimated_minutes||10);if(estimated_minutes===null)return;router.patch(`/lessons/${item.id}`,{title:title.trim(),estimated_minutes,is_preview:Boolean(item.is_preview)},{preserveScroll:true}); };
    const editTopic = (topic, lessonId) => { setEditingTopicId(topic.id); material.setData({lesson_id:String(lessonId),title:topic.title,type:topic.type,content:topic.type==='text'?(topic.content||''):'',video_url:topic.video_url||'',file:null});setStep(3);window.scrollTo({top:0,behavior:'smooth'}); };
    const editAssessment = (saved, lessonId) => { assignment.setData({lesson_id:String(lessonId),type:saved.type||'project',title:saved.title,instructions:saved.instructions,maximum_score:saved.maximum_score,passing_score:saved.passing_score,rubric:saved.rubric?.length?saved.rubric:['','',''],due_at:saved.due_at?.slice(0,16)||''});setStep(4);window.scrollTo({top:0,behavior:'smooth'}); };
    const saveMaterial = event => { event.preventDefault(); if(!editingTopicId){post(material,'/topics',['title','content','video_url','file'])(event);return;} router.post(`/topics/${editingTopicId}`,{...material.data,_method:'patch'},{preserveScroll:true,forceFormData:true,onSuccess:()=>{material.reset('title','content','video_url','file');setEditingTopicId(null)}}); };

    const post = (form, url, fields, next) => event => {
        event.preventDefault();
        form.post(url, { preserveScroll: true, forceFormData: form === material, onSuccess: () => { form.reset(...fields); if (next) setStep(next); } });
    };
    const chooseCourse = id => {
        setCourseId(id); lesson.setData('course_id', id); module.setData('course_week_id', ''); lesson.setData('course_module_id', ''); material.setData('lesson_id', '');
    };
    if (!courses.length) return null;

    return <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <header className="flex flex-col gap-5 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#087f81]">Guided course builder</p><h2 className="mt-2 text-2xl font-black">Build your curriculum</h2><p className="mt-1 text-sm text-slate-400">Follow each step. Changes are saved as you work.</p></div>
            <select value={courseId} onChange={e => chooseCourse(e.target.value)} className={`${input} lg:w-80`}>{courses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        </header>
        <div className="grid lg:grid-cols-[210px_minmax(0,1fr)_360px]">
            <nav className="flex gap-2 overflow-x-auto border-b bg-[#f8f9f9] p-5 lg:block lg:space-y-2 lg:border-b-0 lg:border-r">
                {[['Week','Set a learning milestone'],['Module & lesson','Organize the teaching'],['Material','Add video, text or PDF'],['Assessment','Assignment and rubric']].map(([title, help], index) => <button type="button" key={title} onClick={() => setStep(index + 1)} className={`min-w-44 rounded-xl p-4 text-left lg:min-w-0 ${step === index + 1 ? 'bg-[#1a1d21] text-white shadow-lg' : 'bg-white'}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${step === index + 1 ? 'bg-[#00d2d3] text-black' : 'bg-slate-100'}`}>{index + 1}</span><p className="mt-3 text-xs font-black">{title}</p><p className={`mt-1 text-[10px] ${step === index + 1 ? 'text-white/50' : 'text-slate-400'}`}>{help}</p></button>)}
            </nav>
            <main className="p-6 lg:p-8">
                {step === 1 && <form onSubmit={post(week, `/courses/${courseId}/weeks`, ['title', 'description'], 2)} className="space-y-4"><h3 className="text-xl font-black">Add a course week</h3><p className="text-sm text-slate-400">Create one clear milestone at a time.</p><input required value={week.data.title} onChange={e => week.setData('title', e.target.value)} className={input} placeholder="Week 1 — Foundations" /><textarea rows="4" value={week.data.description} onChange={e => week.setData('description', e.target.value)} className={input} placeholder="What will students achieve this week?" /><Button disabled={week.processing}>Save week & continue</Button></form>}
                {step === 2 && <div className="space-y-7">
                    <form onSubmit={post(module, `/course-weeks/${module.data.course_week_id}/modules`, ['title'])} className="space-y-3"><h3 className="text-xl font-black">Add a module</h3><select required value={module.data.course_week_id} onChange={e => module.setData('course_week_id', e.target.value)} className={input}><option value="">Choose a week</option>{weeks.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input required value={module.data.title} onChange={e => module.setData('title', e.target.value)} className={input} placeholder="Module title" /><Button disabled={module.processing || !module.data.course_week_id}>Add module</Button></form>
                    <div className="h-px bg-slate-100" />
                    <form onSubmit={post(lesson, '/lessons', ['lesson_title'], 3)} className="space-y-3"><h3 className="text-xl font-black">Add a lesson</h3><select required value={lesson.data.course_module_id} onChange={e => lesson.setData('course_module_id', e.target.value)} className={input}><option value="">Choose a module</option>{modules.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input required value={lesson.data.lesson_title} onChange={e => lesson.setData('lesson_title', e.target.value)} className={input} placeholder="Lesson title" /><div className="grid grid-cols-2 gap-3"><input type="number" min="1" value={lesson.data.estimated_minutes} onChange={e => lesson.setData('estimated_minutes', e.target.value)} className={input} aria-label="Estimated minutes" /><label className="flex items-center gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={lesson.data.is_preview} onChange={e => lesson.setData('is_preview', e.target.checked)} className="rounded text-[#00d2d3]" />Free preview</label></div><Button disabled={lesson.processing || !lesson.data.course_module_id}>Save lesson & continue</Button></form>
                </div>}
                {step === 3 && <form onSubmit={saveMaterial} className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-xl font-black">{editingTopicId?'Edit lesson material':'Add lesson material'}</h3>{editingTopicId&&<button type="button" onClick={()=>{setEditingTopicId(null);material.reset('title','content','video_url','file')}} className="text-[9px] font-black uppercase text-red-500">Cancel edit</button>}</div><select required value={material.data.lesson_id} onChange={e => material.setData('lesson_id', e.target.value)} className={input}><option value="">Choose a lesson</option>{lessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><div className="grid grid-cols-3 gap-2">{[['text','Article'],['video','Video'],['pdf','PDF']].map(([type,label]) => <button disabled={Boolean(editingTopicId)} type="button" key={type} onClick={() => material.setData('type', type)} className={`rounded-xl border p-3 text-xs font-black disabled:opacity-60 ${material.data.type === type ? 'border-[#00d2d3] bg-[#e7fbfb] text-[#087f81]' : 'border-slate-200'}`}>{label}</button>)}</div><input required value={material.data.title} onChange={e => material.setData('title', e.target.value)} className={input} placeholder="Material title" />{material.data.type === 'text' && <RichTextEditor value={material.data.content} onChange={value => material.setData('content', value)} />}{material.data.type === 'video' && <><input type="url" value={material.data.video_url} onChange={e => material.setData('video_url', e.target.value)} className={input} placeholder="YouTube, Vimeo, Mux or Bunny URL" /><input type="file" accept="video/*" onChange={e => material.setData('file', e.target.files[0])} className={input} /></>}{material.data.type === 'pdf' && <input required={!editingTopicId} type="file" accept="application/pdf" onChange={e => material.setData('file', e.target.files[0])} className={input} />}<Button disabled={material.processing || !material.data.lesson_id}>{editingTopicId?'Save material changes':'Add material'}</Button></form>}
                {step === 4 && <div className="space-y-8">
                    <form onSubmit={post(assignment, `/lessons/${assignment.data.lesson_id}/assignment`, ['title', 'instructions', 'due_at'])} className="space-y-4">
                        <div><h3 className="text-xl font-black">Lesson assessment</h3><p className="mt-1 text-sm text-slate-400">Choose automatic objective scoring or a tutor-reviewed project.</p></div>
                        <select required value={assignment.data.lesson_id} onChange={e => { assignment.setData('lesson_id',e.target.value); const existing=lessons.find(item=>String(item.id)===e.target.value)?.assignment; if(existing) assignment.setData({...assignment.data,...existing,lesson_id:e.target.value,rubric:existing.rubric||['','','']}); }} className={input}><option value="">Choose a lesson</option>{lessons.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                        <div className="grid grid-cols-2 gap-3">{[['objective','Objective quiz','Automatically scored'],['project','Project submission','Tutor reviews GitHub/notes']].map(([type,label,help])=><button key={type} type="button" onClick={()=>assignment.setData('type',type)} className={`rounded-xl border p-4 text-left ${assignment.data.type===type?'border-[#00d2d3] bg-[#e7fbfb]':'border-slate-200 bg-white'}`}><p className="text-xs font-black">{label}</p><p className="mt-1 text-[10px] text-slate-400">{help}</p></button>)}</div>
                        <input required value={assignment.data.title} onChange={e=>assignment.setData('title',e.target.value)} className={input} placeholder="Assessment title" />
                        <textarea required rows="4" value={assignment.data.instructions} onChange={e=>assignment.setData('instructions',e.target.value)} className={input} placeholder={assignment.data.type==='objective'?'Instructions shown before the quiz':'Required deliverables and submission instructions'} />
                        <div className="grid grid-cols-3 gap-3"><label className="text-[9px] font-black uppercase text-slate-400">Maximum score<input type="number" min="1" value={assignment.data.maximum_score} onChange={e=>assignment.setData('maximum_score',e.target.value)} className={`${input} mt-2`} /></label><label className="text-[9px] font-black uppercase text-slate-400">Cutoff mark<input type="number" min="1" max={assignment.data.maximum_score} value={assignment.data.passing_score} onChange={e=>assignment.setData('passing_score',e.target.value)} className={`${input} mt-2`} /></label><label className="text-[9px] font-black uppercase text-slate-400">Due date<input type="datetime-local" value={assignment.data.due_at||''} onChange={e=>assignment.setData('due_at',e.target.value)} className={`${input} mt-2`} /></label></div>
                        {assignment.data.type==='project'&&<><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rubric criteria</p>{assignment.data.rubric.map((criterion,index)=><input key={index} value={criterion} onChange={e=>{const rubric=[...assignment.data.rubric];rubric[index]=e.target.value;assignment.setData('rubric',rubric)}} className={input} placeholder={`Criterion ${index+1}`} />)}</>}
                        <Button disabled={assignment.processing||!assignment.data.lesson_id}>Save assessment setup</Button>
                    </form>
                    {savedAssessment?.type==='objective'&&<section className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div><h4 className="text-sm font-black">Objective questions</h4><p className="mt-1 text-[11px] text-slate-400">Select the radio button beside the correct answer.</p></div><div className="mt-4 space-y-3">{savedAssessment.questions?.map((item,index)=><div key={item.id} className="rounded-xl bg-white p-4"><div className="flex justify-between gap-3"><p className="text-xs font-black">{index+1}. {item.question}</p><span className="flex gap-2"><button type="button" onClick={()=>editAssessmentQuestion(item)} className="text-[9px] font-black uppercase text-[#087f81]">Edit</button><button type="button" onClick={()=>removeAssessmentQuestion(item.id)} className="text-[9px] font-black uppercase text-red-500">Remove</button></span></div><div className="mt-2 grid gap-1">{item.options?.map(option=><p key={option.id} className={`text-[10px] ${option.is_correct?'font-black text-emerald-600':'text-slate-500'}`}>{option.is_correct?'✓':'○'} {option.option_text}</p>)}</div></div>)}</div><form onSubmit={addAssessmentQuestion} className="mt-5 space-y-3"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase text-slate-500">{editingQuestionId?'Edit question':'Add question'}</p>{editingQuestionId&&<button type="button" onClick={()=>{question.reset();setEditingQuestionId(null)}} className="text-[9px] font-black uppercase text-red-500">Cancel</button>}</div><input required value={question.data.question} onChange={e=>question.setData('question',e.target.value)} className={input} placeholder="Enter objective question" />{question.data.options.map((option,index)=><label key={index} className="flex items-center gap-3"><input type="radio" name="correct-answer" checked={Number(question.data.correct_index)===index} onChange={()=>question.setData('correct_index',index)} className="text-[#087f81] focus:ring-[#00d2d3]"/><input required value={option} onChange={e=>{const options=[...question.data.options];options[index]=e.target.value;question.setData('options',options)}} className={input} placeholder={`Answer option ${index+1}`} /></label>)}<Button disabled={question.processing}>{editingQuestionId?'Save question changes':'Add question'}</Button></form></section>}
                </div>}
            </main>
            <aside className="border-t bg-[#fbfcfc] p-5 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest">Saved course content</h3><span className="rounded-full bg-[#e7fbfb] px-3 py-1 text-[9px] font-black text-[#087f81]">{course?.status || 'draft'}</span></div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">Review everything already saved for this course.</p>
                <div className="mt-5 space-y-5">{weeks.length ? weeks.map((item, wi) => <section key={item.id}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#087f81]">Week {wi + 1}</p>
                    <div className="mt-1 flex items-center gap-2"><p className="text-sm font-black text-slate-900">{item.title}</p><ManageActions onEdit={()=>promptUpdate(`/course-weeks/${item.id}`,item)} onDelete={()=>confirmDelete(`/course-weeks/${item.id}`,'week and everything inside it')} /></div>
                    {item.description && <p className="mt-1 text-[10px] leading-4 text-slate-400">{item.description}</p>}
                    <div className="mt-2 space-y-2">{item.modules?.map(mod => <details key={mod.id} className="group rounded-xl border border-slate-200 bg-white p-3" open>
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-slate-800"><span>{mod.title}</span><ManageActions onEdit={()=>promptUpdate(`/course-modules/${mod.id}`,mod)} onDelete={()=>confirmDelete(`/course-modules/${mod.id}`,'module and its lessons')} /><span className="text-slate-300 group-open:rotate-180">⌄</span></summary>
                        {mod.description && <p className="mt-1 text-[10px] text-slate-400">{mod.description}</p>}
                        <div className="mt-3 space-y-3">{mod.lessons?.length ? mod.lessons.map((savedLesson, li) => <div key={savedLesson.id} className="border-l-2 border-[#00d2d3] pl-3">
                            <div className="flex items-center gap-2"><p className="text-[10px] font-black text-slate-700">{li + 1}. {savedLesson.title}</p><ManageActions onEdit={()=>editLesson(savedLesson)} onDelete={()=>confirmDelete(`/lessons/${savedLesson.id}`,'lesson and all of its content')} /></div>
                            <div className="mt-2 space-y-1">{savedLesson.topics?.length ? savedLesson.topics.map(topic => <details key={topic.id} className="rounded-lg bg-slate-50 px-2 py-1.5"><summary className="flex cursor-pointer list-none items-center"><span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-black uppercase text-[#087f81]">{topic.type}</span><span className="ml-2 text-[10px] font-bold text-slate-600">{topic.title}</span><ManageActions onEdit={()=>editTopic(topic,savedLesson.id)} onDelete={()=>confirmDelete(`/topics/${topic.id}`,'material')} /></summary>{topic.type === 'text' && <div className="mt-2 max-h-48 overflow-auto border-t pt-2 text-[10px] leading-5 text-slate-500 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{__html:topic.content || '<em>No article content</em>'}} />}{topic.type === 'video' && <p className="mt-2 break-all border-t pt-2 text-[9px] text-slate-400">{topic.video_url || topic.content || 'No video attached'}</p>}{topic.type === 'pdf' && <p className="mt-2 break-all border-t pt-2 text-[9px] text-slate-400">{topic.content || 'No PDF attached'}</p>}</details>) : <p className="text-[9px] italic text-slate-300">No materials saved</p>}</div>
                            {savedLesson.assignment && <details className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2"><summary className="cursor-pointer list-none"><div className="flex items-center"><div><p className="text-[8px] font-black uppercase tracking-wider text-amber-700">Assessment</p><p className="mt-1 text-[10px] font-bold text-slate-700">{savedLesson.assignment.title}</p></div><ManageActions onEdit={()=>editAssessment(savedLesson.assignment,savedLesson.id)} onDelete={()=>confirmDelete(`/assignments/${savedLesson.assignment.id}`,'assessment and its student submissions')} /></div><p className="mt-1 text-[9px] text-slate-500">Pass {savedLesson.assignment.passing_score}/{savedLesson.assignment.maximum_score} · {(savedLesson.assignment.rubric || []).length} rubric criteria</p></summary><p className="mt-2 border-t border-amber-200 pt-2 text-[10px] leading-5 text-slate-600">{savedLesson.assignment.instructions}</p>{!!savedLesson.assignment.rubric?.length && <ul className="mt-2 list-disc space-y-1 pl-4 text-[9px] text-slate-500">{savedLesson.assignment.rubric.filter(Boolean).map((criterion,index)=><li key={index}>{criterion}</li>)}</ul>}</details>}
                        </div>) : <p className="text-[9px] italic text-slate-300">No lessons saved</p>}</div>
                    </details>)}</div>
                </section>) : <p className="rounded-xl border border-dashed p-6 text-center text-xs font-bold text-slate-300">Your saved modules, lessons, materials and assessments will appear here.</p>}</div>
            </aside>
        </div>
    </section>;
}
