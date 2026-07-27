import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { 
  User, FileText, Briefcase, GraduationCap, Award, FolderGit2, 
  BookOpen, Globe, Heart, Trophy, Trash2, X, Plus, Sparkles, Bold, Italic, 
  List, ListOrdered, Link as LinkIcon, Download, Eye, EyeOff, LayoutGrid, Palette, Sliders, ArrowUp, ArrowDown, ChevronLeft
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Professional', 'Conversational', 'Elementary'];
const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'publications',
  'languages',
  'volunteer',
  'awards'
];

const API_BASE = 'http://localhost:5000';

// --- Tiptap Editor Component ---
const TiptapEditor = ({ value, onChange, placeholder }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        horizontalRule: false,
        hardBreak: false,
        gapcursor: false,
        history: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none text-white focus:outline-none min-h-[120px] p-3 rounded-md border border-white/20 bg-white/5',
      },
    },
    injectCSS: false,
    immediatelyRender: false,
  }, [value]);

  if (!mounted || !editor) {
    return (
      <div className="min-h-[120px] p-3 rounded-md border border-white/20 bg-white/5 text-white placeholder-gray-400">
        {placeholder || 'Loading editor...'}
      </div>
    );
  }

  return (
    <div className="tiptap-editor-wrapper" style={{ marginTop: '4px' }}>
      <div className="flex items-center gap-1 p-1 rounded-t-md border-t border-x border-white/20 bg-white/5 text-white">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'p-1.5 rounded bg-white/20' : 'p-1.5 rounded hover:bg-white/10'}
          type="button"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'p-1.5 rounded bg-white/20' : 'p-1.5 rounded hover:bg-white/10'}
          type="button"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'p-1.5 rounded bg-white/20' : 'p-1.5 rounded hover:bg-white/10'}
          type="button"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'p-1.5 rounded bg-white/20' : 'p-1.5 rounded hover:bg-white/10'}
          type="button"
        >
          <ListOrdered size={14} />
        </button>
        <button
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt('URL', previousUrl);
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          className={editor.isActive('link') ? 'p-1.5 rounded bg-white/20' : 'p-1.5 rounded hover:bg-white/10'}
          type="button"
        >
          <LinkIcon size={14} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

// --- Skill Tags Input Component ---
const SkillTagInput = ({ value, onChange }) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const tags = value
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const updateTags = (next) => onChange(next.join(', '));

  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) { setInput(''); return; }
    updateTags([...tags, clean]);
    setInput('');
  };

  const removeTag = (tag) => updateTags(tags.filter(t => t !== tag));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  };

  return (
    <div className="relative" style={{ marginTop: '4px' }}>
      <div
        className="min-h-[52px] flex flex-wrap gap-1.5 items-center p-2.5 rounded-lg border border-white/20 bg-white/5 cursor-text focus-within:border-indigo-500/60 transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag); }}
              className="hover:text-rose-400 transition-colors ml-0.5"
            >
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? 'Type a skill and press Enter or comma…' : 'Add more…'}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

// --- Form Group UI primitive ---
const Label = ({ children }) => (
  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 block">
    {children}
  </label>
);

const Input = (props) => (
  <input 
    {...props} 
    style={{ background: 'rgba(15,23,42,0.4)' }}
    className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors" 
  />
);

const Select = ({ children, ...props }) => (
  <select 
    {...props} 
    style={{ background: 'rgba(15,23,42,0.4)' }}
    className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
  >
    {children}
  </select>
);

// --- Sections Forms ---
const PersonalForm = ({ data, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label>Full Name</Label><Input value={data.name || ''} onChange={e => onChange('name', e.target.value)} /></div>
      <div><Label>Email</Label><Input type="email" value={data.email || ''} onChange={e => onChange('email', e.target.value)} /></div>
      <div><Label>Phone</Label><Input value={data.phone || ''} onChange={e => onChange('phone', e.target.value)} /></div>
      <div><Label>Location</Label><Input value={data.location || ''} onChange={e => onChange('location', e.target.value)} /></div>
      <div><Label>LinkedIn URL (optional)</Label><Input value={data.linkedin || ''} placeholder="linkedin.com/in/username" onChange={e => onChange('linkedin', e.target.value)} /></div>
      <div><Label>GitHub URL (optional)</Label><Input value={data.github || ''} placeholder="github.com/username" onChange={e => onChange('github', e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Website / Portfolio (optional)</Label><Input value={data.website || ''} placeholder="yoursite.com" onChange={e => onChange('website', e.target.value)} /></div>
    </div>
    <div>
      <Label>Legal Status</Label>
      <Select value={data.legalStatus || 'Prefer not to say'} onChange={e => onChange('legalStatus', e.target.value)}>
        <option>Prefer not to say</option>
        <option>U.S. Citizen</option>
        <option>Permanent Resident</option>
        <option>Work Visa (H-1B)</option>
        <option>OPT / CPT</option>
        <option>EU Citizen</option>
      </Select>
    </div>
  </div>
);

const SummaryForm = ({ value, onChange, onOpenRewrite }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Label>Professional Summary</Label>
      <button
        type="button"
        onClick={() => onOpenRewrite('summary', 'summary', value)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 hover:bg-indigo-500/20 transition-all font-semibold uppercase tracking-wider"
      >
        <Sparkles size={11} /> AI Rewrite
      </button>
    </div>
    <TiptapEditor
      value={value || ''}
      onChange={onChange}
      placeholder="A concise summary of your professional experience and goals..."
    />
  </div>
);

const DynamicSection = ({ sectionKey, data, onChange, onAdd, onRemove, fields, addPayload, onOpenRewrite }) => (
  <div className="space-y-4">
    {(data || []).map((item, index) => (
      <div key={item.id} className="p-4 border border-white/10 bg-white/[0.02] rounded-lg relative space-y-3">
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {onOpenRewrite && (
            <button
              type="button"
              onClick={() => onOpenRewrite(item.id, sectionKey, item.description || '')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 hover:bg-indigo-500/20 transition-all font-semibold uppercase tracking-wider"
            >
              <Sparkles size={11} /> AI Rewrite
            </button>
          )}
          <button 
            type="button"
            onClick={() => onRemove(sectionKey, item.id)}
            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => {
            const colSpanClass = field.colSpan === 2 ? 'md:col-span-2' : '';
            let inputProps = {
              value: item[field.key] || '',
              onChange: (e) => onChange(sectionKey, index, field.key, e.target.value),
              placeholder: `Enter ${field.label.toLowerCase()}...`
            };

            if (field.type === 'textarea') {
              return (
                <div key={field.key} className={colSpanClass}>
                  <Label>{field.label}</Label>
                  <TiptapEditor
                    value={item[field.key] || ''}
                    onChange={(val) => onChange(sectionKey, index, field.key, val)}
                    placeholder={inputProps.placeholder}
                  />
                </div>
              );
            } else if (field.type === 'skill_tags') {
              return (
                <div key={field.key} className={colSpanClass}>
                  <Label>{field.label}</Label>
                  <SkillTagInput
                    value={item[field.key] || ''}
                    onChange={(v) => onChange(sectionKey, index, field.key, v)}
                  />
                </div>
              );
            }

            return (
              <div key={field.key} className={colSpanClass}>
                <Label>{field.label}</Label>
                <Input {...inputProps} />
              </div>
            );
          })}
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onAdd(sectionKey, addPayload)}
      className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-white/40 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
    >
      <Plus size={16} /> Add Entry
    </button>
  </div>
);

const LanguagesForm = ({ data, onChange, onAdd, onRemove }) => (
  <div className="space-y-4">
    {(data || []).map((item, index) => (
      <div key={item.id} className="flex items-center gap-3 p-3 border border-white/10 bg-white/[0.02] rounded-lg relative">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Language</Label>
            <Input value={item.language || ''} placeholder="e.g. Spanish" onChange={e => onChange('languages', index, 'language', e.target.value)} />
          </div>
          <div>
            <Label>Proficiency</Label>
            <Select value={item.proficiency || 'Conversational'} onChange={e => onChange('languages', index, 'proficiency', e.target.value)}>
              {PROFICIENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
        </div>
        <button 
          type="button" 
          onClick={() => onRemove('languages', item.id)} 
          className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onAdd('languages', { language: '', proficiency: 'Conversational' })}
      className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-white/40 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
    >
      <Plus size={16} /> Add Language
    </button>
  </div>
);

const ReorderSectionPanel = ({ order, onReorder, hidden, onToggleHide }) => {
  const move = (idx, direction) => {
    const next = [...order];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onReorder(next);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-300 mb-2">Section Layout Order & Visibility</h3>
      {order.map((sec, idx) => {
        const isHidden = hidden.has(sec);
        return (
          <div key={sec} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{sec}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => onToggleHide(sec)}
                className={`p-1.5 rounded text-xs border ${isHidden ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-green-500/20 border-green-500/40 text-green-300'} hover:opacity-80 transition-opacity`}
              >
                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded bg-white/5 border border-white/10 text-white disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === order.length - 1} className="p-1.5 rounded bg-white/5 border border-white/10 text-white disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DesignOptionsPanel = ({ options, onChange, template, onTemplateChange }) => {
  const colors = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#34495e', '#1e293b'];
  const fonts = ['Calibri, sans-serif', 'Georgia, serif', 'Arial, sans-serif', 'Times New Roman, serif', 'Courier New, monospace'];
  const sizes = [10, 11, 12, 13];
  const spacing = [1.0, 1.15, 1.3, 1.5];

  return (
    <div className="space-y-6">
      <div>
        <Label>Resume Template</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {['latex_academic', 'classic', 'modern', 'minimal', 'executive'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onTemplateChange(t)}
              className={`py-3 rounded-lg border text-sm font-semibold capitalize transition-all ${template === t ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/[0.08]'}`}
            >
              {t === 'latex_academic' ? 'LaTeX Academic' : t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Accent Color</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onChange('accentColor', c)}
              style={{ backgroundColor: c }}
              className={`w-8 h-8 rounded-full border-2 ${options.accentColor === c ? 'border-whiteScale shadow-lg scale-110' : 'border-transparent hover:scale-105'} transition-all`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Font Family</Label>
          <select
            value={options.fontFamily}
            onChange={e => onChange('fontFamily', e.target.value)}
            style={{ background: 'rgba(15,23,42,0.4)' }}
            className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            {fonts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <Label>Font Size (pt)</Label>
          <select
            value={options.fontSize}
            onChange={e => onChange('fontSize', Number(e.target.value))}
            style={{ background: 'rgba(15,23,42,0.4)' }}
            className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            {sizes.map(s => <option key={s} value={s}>{s}pt</option>)}
          </select>
        </div>

        <div>
          <Label>Line Spacing</Label>
          <select
            value={options.lineSpacing}
            onChange={e => onChange('lineSpacing', Number(e.target.value))}
            style={{ background: 'rgba(15,23,42,0.4)' }}
            className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            {spacing.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

// --- ATS & LaTeX Optimizer Tab Sub-Component ---
const AtsOptimizerPanel = ({
  jobDescription,
  setJobDescription,
  runAtsScoring,
  scoring,
  atsScoreData,
  generateLatexResumeSubmit,
  generatingLatex,
  generatedLatexResume,
  showRawLatexPane,
  setShowRawLatexPane
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ATS Scorer Card */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" /> ATS Match Score Scorer
          </h3>
          <button 
            type="button"
            onClick={runAtsScoring} 
            className="btn btn-primary text-xs py-1.5 px-3" 
            disabled={scoring}
          >
            {scoring ? 'Scoring...' : 'Analyze Match'}
          </button>
        </div>

        <div className="form-group">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 block">Target Job Description</label>
          <textarea
            className="flex min-h-[140px] w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
            style={{ background: 'rgba(15,23,42,0.4)' }}
            placeholder="Paste the target job description details here..."
            value={jobDescription || ''}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {atsScoreData ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: `3px solid ${atsScoreData.score >= 80 ? 'var(--success)' : atsScoreData.score >= 60 ? 'var(--warning)' : 'var(--error)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '800',
                  color: atsScoreData.score >= 80 ? 'var(--success)' : atsScoreData.score >= 60 ? 'var(--warning)' : 'var(--error)'
                }}
              >
                {atsScoreData.score}%
              </div>
              <div>
                <div className="text-xs text-zinc-400">Match Grade</div>
                <div 
                  className="text-sm font-bold" 
                  style={{ color: atsScoreData.score >= 80 ? 'var(--success)' : atsScoreData.score >= 60 ? 'var(--warning)' : 'var(--error)' }}
                >
                  {atsScoreData.score >= 80 ? 'ATS Compatible' : atsScoreData.score >= 60 ? 'Needs Keyword Adjustments' : 'High Risk Rejection'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Missing Keywords</h4>
              {atsScoreData.missingKeywords && atsScoreData.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {atsScoreData.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-green-400">✔ Zero missing keywords!</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500 text-xs">
            Paste a Job Description and click "Analyze Match" to test score.
          </div>
        )}
      </div>

      {/* LaTeX Compiler Card */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" /> LaTeX Compile Studio
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Injects tailored achievements, keywords, and headers into a professional LaTeX resume template and compiles it.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={generateLatexResumeSubmit}
            className="flex-1 btn btn-primary text-xs py-2"
            disabled={generatingLatex}
          >
            {generatingLatex ? 'Tailoring LaTeX...' : 'Generate LaTeX Resume'}
          </button>
          {generatedLatexResume && (
            <button
              type="button"
              onClick={() => setShowRawLatexPane(!showRawLatexPane)}
              className="btn btn-secondary text-xs px-3"
            >
              {showRawLatexPane ? 'Hide Code' : 'View Code'}
            </button>
          )}
        </div>

        {generatedLatexResume && (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([generatedLatexResume], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `resume_tailored.tex`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="w-full btn btn-secondary text-xs py-2 flex items-center justify-center gap-2"
            >
              <Download size={14} /> Download LaTeX (.tex)
            </button>

            {showRawLatexPane && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">LaTeX Source Code</label>
                <textarea
                  readOnly
                  className="w-full min-h-[160px] rounded-md border border-white/10 p-3 text-xs text-indigo-200 font-mono focus:outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                  value={generatedLatexResume}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Bidirectional Translation Helpers ---
const translateToProfile = (resumeData) => {
  return {
    personal: {
      name: resumeData.personal?.name || '',
      email: resumeData.personal?.email || '',
      phone: resumeData.personal?.phone || '',
      location: resumeData.personal?.location || '',
      legalStatus: resumeData.personal?.legalStatus || 'Prefer not to say',
      linkedin: resumeData.personal?.linkedin || '',
      github: resumeData.personal?.github || '',
      website: resumeData.personal?.website || '',
    },
    summary: resumeData.summary || '',
    skills: (resumeData.skills || []).flatMap(s => 
      s.skills_list ? s.skills_list.split(',').map(tag => tag.trim()).filter(Boolean) : []
    ),
    work_history: (resumeData.experience || []).map(exp => ({
      position: exp.jobTitle || '',
      company: exp.company || '',
      dates: exp.dates || '',
      achievements: exp.description 
        ? exp.description.replace(/<[^>]*>/g, '\n').split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
        : []
    })),
    projects: (resumeData.projects || []).map(proj => ({
      name: proj.title || '',
      dates: proj.date || '',
      achievements: proj.description 
        ? proj.description.replace(/<[^>]*>/g, '\n').split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
        : []
    })),
    education: (resumeData.education || []).map(edu => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      dates: edu.graduationYear || '',
    }))
  };
};

const translateToResumeData = (profile) => {
  if (!profile) return null;
  return {
    personal: {
      name: profile.personal?.name || '',
      email: profile.personal?.email || '',
      phone: profile.personal?.phone || '',
      location: profile.personal?.location || '',
      legalStatus: profile.personal?.legalStatus || 'Prefer not to say',
      linkedin: profile.personal?.linkedin || '',
      github: profile.personal?.github || '',
      website: profile.personal?.website || '',
    },
    summary: profile.summary || '',
    experience: (profile.work_history || []).map((job, idx) => ({
      id: job.id || `exp-${idx}-${Date.now()}`,
      jobTitle: job.position || '',
      company: job.company || '',
      dates: job.dates || '',
      description: job.description || (job.achievements ? `<p>${job.achievements.join('</p><p>')}</p>` : '')
    })),
    education: (profile.education || []).map((edu, idx) => ({
      id: edu.id || `edu-${idx}-${Date.now()}`,
      degree: edu.degree || '',
      institution: edu.institution || '',
      graduationYear: edu.dates || '',
      gpa: '',
      achievements: ''
    })),
    skills: (profile.skills && profile.skills.length > 0) ? [
      {
        id: `skills-0-${Date.now()}`,
        category: 'Technical Skills',
        skills_list: (profile.skills || []).join(', ')
      }
    ] : [],
    projects: (profile.projects || []).map((proj, idx) => ({
      id: proj.id || `proj-${idx}-${Date.now()}`,
      title: proj.name || '',
      date: proj.dates || '',
      description: proj.description || (proj.achievements ? `<p>${proj.achievements.join('</p><p>')}</p>` : '')
    })),
    publications: [],
    certifications: [],
    languages: [],
    volunteer: [],
    awards: []
  };
};

// --- Main ResumeBuilder Component ---
export default function ResumeBuilder({ 
  profile, 
  onProfileUpdate,
  apiKey,
  jobDescription,
  setJobDescription,
  runAtsScoring,
  scoring,
  atsScoreData,
  generateLatexResumeSubmit,
  generatingLatex,
  generatedLatexResume,
  showRawLatexPane,
  setShowRawLatexPane,
  workspaceMode,
  onBackToLanding
}) {
  const [activeSection, setActiveSection] = useState('personal');
  const [resumeData, setResumeData] = useState(() => translateToResumeData(profile));
  
  // Custom design states
  const [template, setTemplate] = useState('latex_academic');
  const [styleOptions, setStyleOptions] = useState({
    fontFamily: 'Georgia, serif',
    fontSize: 11,
    accentColor: '#1e293b',
    lineSpacing: 1.15,
  });
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);
  const [hiddenSections, setHiddenSections] = useState(new Set());

  // Inline AI Rewrite modal/popover states
  const [rewriteState, setRewriteState] = useState({
    activeItemId: null, // summary, or item ID
    sectionType: '', // 'summary', 'experience', 'projects'
    originalText: '',
    customPrompt: '',
    loading: false
  });

  const handleOpenRewrite = (itemId, sectionType, currentText) => {
    setRewriteState({
      activeItemId: itemId,
      sectionType,
      originalText: currentText.replace(/<[^>]*>/g, ''), // Strip HTML tags for clean AI prompt
      customPrompt: '',
      loading: false
    });
  };

  const handleRewriteSubmit = async (autoTailor = true) => {
    if (!apiKey) {
      toast.error('Please configure your Gemini API Key in Settings first.');
      return;
    }
    setRewriteState(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${API_BASE}/api/rewrite-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          sectionType: rewriteState.sectionType,
          originalText: rewriteState.originalText,
          jobDescription: jobDescription || '',
          customInstruction: autoTailor ? '' : rewriteState.customPrompt
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to rewrite section');
      }

      const resJson = await response.json();
      const newText = resJson.rewrittenText;

      if (rewriteState.sectionType === 'summary') {
        handleSummaryChange(newText);
      } else if (rewriteState.sectionType === 'experience') {
        const idx = resumeData.experience.findIndex(e => e.id === rewriteState.activeItemId);
        if (idx !== -1) handleDynamicChange('experience', idx, 'description', newText);
      } else if (rewriteState.sectionType === 'projects') {
        const idx = resumeData.projects.findIndex(p => p.id === rewriteState.activeItemId);
        if (idx !== -1) handleDynamicChange('projects', idx, 'description', newText);
      }

      toast.success('AI rewrite applied successfully!');
      setRewriteState(prev => ({ ...prev, activeItemId: null, loading: false }));
    } catch (e) {
      toast.error(e.message || 'AI rewrite failed.');
      setRewriteState(prev => ({ ...prev, loading: false }));
    }
  };

  // PDF compilation downloader calling local backend playwright server
  const handleDownloadPdf = async () => {
    const resumeEl = document.getElementById('resume-preview-content');
    if (!resumeEl) {
      toast.error('Visual resume preview content not found.');
      return;
    }

    toast.info('Compiling print-ready PDF resume...');
    const fontLink = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Inter:wght@300;400;500;600;700;800&display=swap">';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          ${fontLink}
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              color: #111827;
              -webkit-print-color-adjust: exact;
            }
            #resume-preview-content {
              box-shadow: none !important;
              padding: 40px !important;
              min-height: auto !important;
            }
            a {
              color: #1e40af;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          ${resumeEl.outerHTML}
        </body>
      </html>
    `;

    try {
      const response = await fetch(`${API_BASE}/api/generate-resume-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: resumeData.personal?.name || 'Resume',
          htmlContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.personal?.name || 'resume').replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF Resume downloaded!');
    } catch (e) {
      toast.error(e.message || 'Error compiling PDF');
    }
  };

  // Safe sync from parent profile prop on external changes
  useEffect(() => {
    if (profile) {
      const converted = translateToResumeData(profile);
      const prevCompare = {
        personal: resumeData?.personal,
        summary: resumeData?.summary,
        experience: resumeData?.experience?.map(e => ({ jobTitle: e.jobTitle, company: e.company, dates: e.dates, description: e.description })),
        education: resumeData?.education?.map(e => ({ degree: e.degree, institution: e.institution, graduationYear: e.graduationYear })),
        skills: resumeData?.skills,
        projects: resumeData?.projects?.map(p => ({ title: p.title, date: p.date, description: p.description }))
      };
      const convertedCompare = {
        personal: converted?.personal,
        summary: converted?.summary,
        experience: converted?.experience?.map(e => ({ jobTitle: e.jobTitle, company: e.company, dates: e.dates, description: e.description })),
        education: converted?.education?.map(e => ({ degree: e.degree, institution: e.institution, graduationYear: e.graduationYear })),
        skills: converted?.skills,
        projects: converted?.projects?.map(p => ({ title: p.title, date: p.date, description: p.description }))
      };

      if (JSON.stringify(prevCompare) !== JSON.stringify(convertedCompare)) {
        setResumeData(converted);
      }
    }
  }, [profile]);

  // Sync to parent when resumeData changes
  const propagateChanges = (nextData) => {
    setResumeData(nextData);
    const translated = translateToProfile(nextData);
    onProfileUpdate(translated);
  };

  const handlePersonalChange = (key, val) => {
    const next = {
      ...resumeData,
      personal: { ...resumeData.personal, [key]: val }
    };
    propagateChanges(next);
  };

  const handleSummaryChange = (val) => {
    const next = { ...resumeData, summary: val };
    propagateChanges(next);
  };

  const handleDynamicChange = (sectionKey, index, fieldKey, val) => {
    const list = [...(resumeData[sectionKey] || [])];
    list[index] = { ...list[index], [fieldKey]: val };
    const next = { ...resumeData, [sectionKey]: list };
    propagateChanges(next);
  };

  const addDynamicEntry = (sectionKey, payload) => {
    const next = {
      ...resumeData,
      [sectionKey]: [
        ...(resumeData[sectionKey] || []),
        { id: `dyn-${Date.now()}`, ...payload }
      ]
    };
    propagateChanges(next);
    toast.success('Added new entry');
  };

  const removeDynamicEntry = (sectionKey, id) => {
    const next = {
      ...resumeData,
      [sectionKey]: (resumeData[sectionKey] || []).filter(item => item.id !== id)
    };
    propagateChanges(next);
    toast.error('Removed entry');
  };

  const toggleSectionHide = (secId) => {
    const next = new Set(hiddenSections);
    if (next.has(secId)) {
      next.delete(secId);
    } else {
      next.add(secId);
    }
    setHiddenSections(next);
  };

  // --- Visual Preview Rendering Engine ---
  const renderVisualPreview = () => {
    const { personal, summary, experience, education, skills, projects, certifications, publications, languages, volunteer, awards } = resumeData;
    const ac = styleOptions.accentColor;
    const fs = `${styleOptions.fontSize}pt`;
    const ff = styleOptions.fontFamily;
    const lh = styleOptions.lineSpacing;

    const baseStyle = {
      fontFamily: ff,
      lineHeight: lh,
      color: '#333333',
      backgroundColor: '#ffffff',
      padding: '40px',
      minHeight: '297mm', // A4 aspect ratios
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderRadius: '4px'
    };

    const hasExp = experience && experience.length > 0 && experience.some(e => e.jobTitle || e.company);
    const hasEdu = education && education.length > 0 && education.some(e => e.degree || e.institution);
    const hasSkills = skills && skills.length > 0 && skills.some(s => s.skills_list);
    const hasProj = projects && projects.length > 0 && projects.some(p => p.title);
    const hasCerts = certifications && certifications.length > 0 && certifications.some(c => c.name);
    const hasPubs = publications && publications.length > 0 && publications.some(p => p.title);
    const hasLangs = languages && languages.length > 0 && languages.some(l => l.language);
    const hasVol = volunteer && volunteer.length > 0 && volunteer.some(v => v.role || v.organization);
    const hasAwards = awards && awards.length > 0 && awards.some(a => a.title);

    // Section Heading Helper
    const SH = ({ label }) => (
      <div style={{ borderBottom: `2.5px solid ${ac}`, paddingBottom: '3px', marginTop: '16px', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '11pt', letterSpacing: '1px', fontWeight: 'bold', color: ac }}>{label}</h3>
      </div>
    );

    const sectionBlocks = {
      summary: (summary || '').trim() ? (
        <div key="summary">
          <SH label="Summary" />
          <div style={{ fontSize: fs, color: '#374151' }} dangerouslySetInnerHTML={{ __html: summary || '' }} />
        </div>
      ) : null,
      experience: hasExp ? (
        <div key="experience">
          <SH label="Experience" />
          {(experience || []).map(exp => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontSize: '10.5pt', color: '#0f172a' }}>{exp.jobTitle}</b>
                <span style={{ fontSize: '8.5pt', color: '#64748b' }}>{exp.dates}</span>
              </div>
              <p style={{ color: ac, fontSize: '9pt', fontWeight: 600, margin: '2px 0' }}>{exp.company}</p>
              <div style={{ fontSize: fs, color: '#374151' }} dangerouslySetInnerHTML={{ __html: exp.description || '' }} />
            </div>
          ))}
        </div>
      ) : null,
      education: hasEdu ? (
        <div key="education">
          <SH label="Education" />
          {(education || []).map(edu => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontSize: '10.5pt', color: '#0f172a' }}>{edu.degree}</b>
                <span style={{ fontSize: '8.5pt', color: '#64748b' }}>{edu.graduationYear}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '9pt', margin: '2px 0' }}>{edu.institution}</p>
            </div>
          ))}
        </div>
      ) : null,
      skills: hasSkills ? (
        <div key="skills">
          <SH label="Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(skills || []).flatMap(s => (s.skills_list || '').split(',').map(sk => sk.trim()).filter(Boolean)).map((sk, i) => (
              <span key={i} style={{ fontSize: '8.5pt', background: `${ac}12`, border: `1px solid ${ac}25`, borderRadius: '4px', padding: '2px 8px', color: '#1e293b' }}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      ) : null,
      projects: hasProj ? (
        <div key="projects">
          <SH label="Projects" />
          {(projects || []).map(p => (
            <div key={p.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontSize: '10.5pt', color: '#0f172a' }}>{p.title}</b>
                <span style={{ fontSize: '8.5pt', color: '#64748b' }}>{p.date}</span>
              </div>
              <div style={{ fontSize: fs, color: '#374151', marginTop: '3px' }} dangerouslySetInnerHTML={{ __html: p.description || '' }} />
            </div>
          ))}
        </div>
      ) : null,
      certifications: hasCerts ? (
        <div key="certifications">
          <SH label="Certifications" />
          {(certifications || []).map(c => (
            <div key={c.id} style={{ marginBottom: '4px', fontSize: fs, color: '#374151' }}>
              <b>{c.name}</b> {c.issuer && `  |  ${c.issuer}`} {c.date && ` (${c.date})`}
            </div>
          ))}
        </div>
      ) : null,
      publications: hasPubs ? (
        <div key="publications">
          <SH label="Publications" />
          {(publications || []).map(p => (
            <div key={p.id} style={{ marginBottom: '4px', fontSize: fs, color: '#374151' }}>
              <b>{p.title}</b> {p.journal && `  |  ${p.journal}`} {p.date && ` (${p.date})`}
            </div>
          ))}
        </div>
      ) : null,
      languages: hasLangs ? (
        <div key="languages">
          <SH label="Languages" />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {(languages || []).map(l => (
              <div key={l.id} style={{ fontSize: fs, color: '#374151' }}>
                <b>{l.language}</b>: <span style={{ color: '#64748b' }}>{l.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null,
      volunteer: hasVol ? (
        <div key="volunteer">
          <SH label="Volunteer Experience" />
          {(volunteer || []).map(v => (
            <div key={v.id} style={{ marginBottom: '6px', fontSize: fs, color: '#374151' }}>
              <b>{v.role}</b> {v.organization && ` at ${v.organization}`} {v.dates && ` (${v.dates})`}
            </div>
          ))}
        </div>
      ) : null,
      awards: hasAwards ? (
        <div key="awards">
          <SH label="Awards & Honors" />
          {(awards || []).map(a => (
            <div key={a.id} style={{ marginBottom: '4px', fontSize: fs, color: '#374151' }}>
              <b>{a.title}</b> {a.issuer && ` from ${a.issuer}`} {a.date && ` (${a.date})`}
            </div>
          ))}
        </div>
      ) : null,
    };

    if (template === 'latex_academic') {
      return (
        <div id="resume-preview-content" style={{
          fontFamily: '"EB Garamond", "Garamond", "Times New Roman", serif',
          lineHeight: '1.4',
          color: '#111827',
          backgroundColor: '#ffffff',
          padding: '40px',
          minHeight: '297mm',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          borderRadius: '4px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#111827' }}>
              {personal.name || 'Your Name'}
            </h1>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>
              {[
                personal.phone,
                personal.email,
                personal.location,
                personal.website,
                personal.linkedin,
                personal.github
              ].filter(Boolean).join('   •   ')}
            </div>
          </div>

          {/* Dynamic Section Blocks in Order */}
          {sectionOrder.filter(k => !hiddenSections.has(k)).map(k => {
            if (k === 'summary' && (summary || '').trim()) {
              return (
                <div key="summary" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Summary</h3>
                  <div style={{ fontSize: '11px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: summary || '' }} />
                </div>
              );
            }
            if (k === 'experience' && hasExp) {
              return (
                <div key="experience" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Experience</h3>
                  {(experience || []).map(exp => (
                    <div key={exp.id} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                        <div>{exp.jobTitle} — {exp.company}</div>
                        <div>{exp.dates}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#374151', paddingLeft: '12px', marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: exp.description || '' }} />
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'education' && hasEdu) {
              return (
                <div key="education" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Education</h3>
                  {(education || []).map(edu => (
                    <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <div><strong>{edu.institution}</strong> — <em>{edu.degree}</em></div>
                      <div>{edu.graduationYear}</div>
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'skills' && hasSkills) {
              return (
                <div key="skills" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Skills</h3>
                  <div style={{ fontSize: '11px', color: '#374151' }}>
                    {(skills || []).map(s => (
                      <div key={s.id} style={{ marginBottom: '3px' }}>
                        <strong>{s.category}:</strong> {s.skills_list}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (k === 'projects' && hasProj) {
              return (
                <div key="projects" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Projects</h3>
                  {(projects || []).map(p => (
                    <div key={p.id} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                        <div>{p.title}</div>
                        <div>{p.date}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#374151', paddingLeft: '12px', marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: p.description || '' }} />
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'certifications' && hasCerts) {
              return (
                <div key="certifications" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Certifications</h3>
                  {(certifications || []).map(c => (
                    <div key={c.id} style={{ marginBottom: '3px', fontSize: '11px', color: '#374151' }}>
                      <strong>{c.name}</strong> {c.issuer && ` — ${c.issuer}`} {c.date && ` (${c.date})`}
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'publications' && hasPubs) {
              return (
                <div key="publications" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Publications</h3>
                  {(publications || []).map(p => (
                    <div key={p.id} style={{ marginBottom: '3px', fontSize: '11px', color: '#374151' }}>
                      <strong>{p.title}</strong> {p.journal && ` — ${p.journal}`} {p.date && ` (${p.date})`}
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'languages' && hasLangs) {
              return (
                <div key="languages" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Languages</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {(languages || []).map(l => (
                      <div key={l.id} style={{ fontSize: '11px', color: '#374151' }}>
                        <strong>{l.language}:</strong> {l.proficiency}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (k === 'volunteer' && hasVol) {
              return (
                <div key="volunteer" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Volunteer</h3>
                  {(volunteer || []).map(v => (
                    <div key={v.id} style={{ marginBottom: '4px', fontSize: '11px', color: '#374151' }}>
                      <strong>{v.role}</strong> {v.organization && ` — ${v.organization}`} {v.dates && ` (${v.dates})`}
                    </div>
                  ))}
                </div>
              );
            }
            if (k === 'awards' && hasAwards) {
              return (
                <div key="awards" style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px 0', borderBottom: '1px solid #9ca3af', paddingBottom: '2px', color: '#111827' }}>Awards</h3>
                  {(awards || []).map(a => (
                    <div key={a.id} style={{ marginBottom: '3px', fontSize: '11px', color: '#374151' }}>
                      <strong>{a.title}</strong> {a.issuer && ` — ${a.issuer}`} {a.date && ` (${a.date})`}
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }

    if (template === 'modern') {
      return (
        <div id="resume-preview-content" style={{ ...baseStyle, display: 'flex', padding: 0, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: '32%', backgroundColor: `${ac}08`, borderRight: `3px solid ${ac}`, padding: '32px 16px', flexShrink: 0 }}>
            <h2 style={{ fontSize: '15pt', fontWeight: 'bold', color: ac, marginBottom: '6px' }}>{personal.name || 'Your Name'}</h2>
            <p style={{ fontSize: '8pt', color: '#555', marginBottom: '24px', lineHeight: 1.6 }}>
              {[personal.email, personal.phone, personal.location].filter(Boolean).map((d, i) => (
                <span key={i} style={{ display: 'block' }}>{d}</span>
              ))}
            </p>
            {hasSkills && (
              <>
                <p style={{ fontWeight: 700, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '1px', color: ac, borderBottom: `1px solid ${ac}`, paddingBottom: '3px', marginBottom: '8px' }}>Skills</p>
                {(skills || []).map(skill => (
                  <div key={skill.id} style={{ marginBottom: '8px' }}>
                    {skill.category && <p style={{ fontWeight: 600, fontSize: '8pt', color: '#333' }}>{skill.category}</p>}
                    <p style={{ fontSize: '8pt', color: '#555' }}>{skill.skills_list || ''}</p>
                  </div>
                ))}
              </>
            )}
            {hasCerts && (
              <>
                <p style={{ fontWeight: 700, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '1px', color: ac, borderBottom: `1px solid ${ac}`, paddingBottom: '3px', marginTop: '16px', marginBottom: '8px' }}>Certifications</p>
                {(certifications || []).map(cert => (
                  <div key={cert.id} style={{ fontSize: '8pt', marginBottom: '4px', color: '#444' }}>
                    <b>{cert.name}</b> {cert.date && ` (${cert.date})`}
                  </div>
                ))}
              </>
            )}
          </div>
          {/* Main Content Area */}
          <div style={{ flex: 1, padding: '32px 24px' }}>
            {(summary || '').trim() && (
              <>
                <p style={{ fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1px', color: ac, marginBottom: '4px' }}>Summary</p>
                <div style={{ fontSize: fs, marginBottom: '16px', color: '#374151' }} dangerouslySetInnerHTML={{ __html: summary || '' }} />
              </>
            )}
            {hasExp && (
              <>
                <p style={{ fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1px', color: ac, borderBottom: `1.5px solid ${ac}`, paddingBottom: '2px', marginBottom: '8px' }}>Experience</p>
                {(experience || []).map(exp => (
                  <div key={exp.id} style={{ marginBottom: '12px' }}>
                    <b style={{ fontSize: '10pt', color: '#0f172a' }}>{exp.jobTitle}</b>
                    <p style={{ color: '#64748b', fontSize: '8.5pt', margin: '2px 0' }}>{exp.company} {exp.dates && ` | ${exp.dates}`}</p>
                    <div style={{ fontSize: fs, color: '#374151' }} dangerouslySetInnerHTML={{ __html: exp.description || '' }} />
                  </div>
                ))}
              </>
            )}
            {hasEdu && (
              <>
                <p style={{ fontWeight: 700, fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1px', color: ac, borderBottom: `1.5px solid ${ac}`, paddingBottom: '2px', marginTop: '16px', marginBottom: '8px' }}>Education</p>
                {(education || []).map(edu => (
                  <div key={edu.id} style={{ marginBottom: '8px' }}>
                    <b style={{ fontSize: '10pt', color: '#0f172a' }}>{edu.degree}</b>
                    <p style={{ color: '#64748b', fontSize: '8.5pt', margin: '2px 0' }}>{edu.institution} {edu.graduationYear && ` | ${edu.graduationYear}`}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    }

    if (template === 'minimal') {
      return (
        <div id="resume-preview-content" style={{ ...baseStyle, padding: '40px 48px' }}>
          <h2 style={{ fontSize: '24pt', fontWeight: 300, letterSpacing: '3px', textTransform: 'uppercase', color: '#0f172a', marginBottom: '6px', textAlign: 'center' }}>
            {personal.name || 'Your Name'}
          </h2>
          <p style={{ fontSize: '8.5pt', color: '#64748b', letterSpacing: '1px', marginBottom: '24px', textAlign: 'center' }}>
            {[personal.email, personal.phone, personal.location, personal.website, personal.linkedin].filter(Boolean).join('  |  ')}
          </p>
          {sectionOrder.filter(k => !hiddenSections.has(k)).map(k => sectionBlocks[k] || null)}
        </div>
      );
    }

    if (template === 'executive') {
      return (
        <div id="resume-preview-content" style={{ ...baseStyle, padding: '36px 40px' }}>
          <div style={{ borderLeft: `6px solid ${ac}`, paddingLeft: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24pt', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
              {personal.name || 'Your Name'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#475569', margin: '4px 0 0 0' }}>
              {[personal.email, personal.phone, personal.location, personal.linkedin].filter(Boolean).join('   •   ')}
            </p>
          </div>
          {sectionOrder.filter(k => !hiddenSections.has(k)).map(k => sectionBlocks[k] || null)}
        </div>
      );
    }

    // Default: Classic Template
    return (
      <div id="resume-preview-content" style={baseStyle}>
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: `2.5px solid ${ac}` }}>
          <h2 style={{ fontSize: '24pt', fontWeight: 800, color: ac, margin: '0 0 6px 0' }}>{personal.name || 'Your Name'}</h2>
          <p style={{ color: '#475569', fontSize: '9pt', margin: 0 }}>
            {[personal.email, personal.phone, personal.location, personal.website, personal.linkedin].filter(Boolean).join('   •   ')}
          </p>
        </div>
        {sectionOrder.filter(k => !hiddenSections.has(k)).map(k => sectionBlocks[k] || null)}
      </div>
    );
  };

  const sectionGroups = [
    {
      label: 'Content Sections',
      items: [
        { id: 'personal', name: 'Personal Details', icon: <User size={16} /> },
        { id: 'summary', name: 'Summary', icon: <FileText size={16} /> },
        { id: 'experience', name: 'Experience', icon: <Briefcase size={16} /> },
        { id: 'education', name: 'Education', icon: <GraduationCap size={16} /> },
        { id: 'skills', name: 'Skills', icon: <Award size={16} /> },
        { id: 'projects', name: 'Projects', icon: <FolderGit2 size={16} /> },
        { id: 'certifications', name: 'Certifications', icon: <Award size={16} /> },
        { id: 'publications', name: 'Publications', icon: <BookOpen size={16} /> },
        { id: 'languages', name: 'Languages', icon: <Globe size={16} /> },
        { id: 'volunteer', name: 'Volunteer', icon: <Heart size={16} /> },
        { id: 'awards', name: 'Awards', icon: <Trophy size={16} /> },
      ]
    },
    {
      label: 'AI Match & Export',
      items: [
        { id: 'ats_optimizer', name: 'ATS Match & LaTeX', icon: <Sparkles size={16} style={{ color: 'var(--primary)' }} /> },
        { id: 'latex_code', name: 'LaTeX Code View', icon: <FileText size={16} /> },
      ]
    },
    {
      label: 'Design & Layout',
      items: [
        { id: 'templates', name: 'Templates & Style', icon: <Palette size={16} /> },
        { id: 'reorder', name: 'Reorder Sections', icon: <LayoutGrid size={16} /> },
      ]
    }
  ];

  if (!resumeData) return null;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between glass-panel p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white transition-all"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {workspaceMode === 'tailor' ? 'AI Resume Tailoring Workspace' : 'Fresh Resume Builder'}
            </h2>
            <p className="text-[10px] text-zinc-400">
              {workspaceMode === 'tailor' ? 'Fine-tune your tailored achievements and download PDF' : 'Manage your master profile details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {generatedLatexResume && (
            <button
              type="button"
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([generatedLatexResume], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `resume_tailored.tex`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                toast.success('LaTeX code downloaded!');
              }}
              className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Download size={12} /> LaTeX (.tex)
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Download size={12} /> Download PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-full xl:w-64 flex-shrink-0 space-y-4">
          {sectionGroups.map((group, gIdx) => (
            <div key={gIdx} className="glass-panel p-4 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-2">
                {group.label}
              </h4>
              <div className="flex flex-row xl:flex-col gap-1 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
                {group.items.map(section => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      style={{
                        background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                        borderColor: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white border hover:bg-white/[0.05] transition-all whitespace-nowrap xl:w-full`}
                    >
                      {section.icon}
                      <span>{section.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 glass-panel p-6 overflow-y-auto max-h-[85vh] min-h-[500px] relative">
          {/* Inline AI Rewrite Dialog / Overlay */}
          {rewriteState.activeItemId && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-xl">
              <div className="glass-panel p-6 max-w-lg w-full space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-400" /> Rewrite Section with AI
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setRewriteState(prev => ({ ...prev, activeItemId: null }))}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label>Original text</Label>
                  <div className="p-3 rounded bg-white/5 border border-white/10 text-xs text-zinc-300 max-h-[100px] overflow-y-auto">
                    {rewriteState.originalText || 'Empty description'}
                  </div>
                </div>

                <div className="form-group space-y-1.5">
                  <Label>Custom Instruction (Optional)</Label>
                  <textarea
                    rows="3"
                    className="flex w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    style={{ background: 'rgba(15,23,42,0.4)', resize: 'none' }}
                    placeholder="e.g. 'Make it sound more leadership oriented', 'Highlight Cloud migration details'..."
                    value={rewriteState.customPrompt}
                    onChange={(e) => setRewriteState(prev => ({ ...prev, customPrompt: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={rewriteState.loading}
                    onClick={() => handleRewriteSubmit(true)}
                    className="flex-1 btn btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={12} /> {rewriteState.loading ? 'Rewriting...' : 'Auto-Tailor to JD'}
                  </button>
                  <button
                    type="button"
                    disabled={rewriteState.loading || !rewriteState.customPrompt.trim()}
                    onClick={() => handleRewriteSubmit(false)}
                    className="flex-1 btn btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={12} /> {rewriteState.loading ? 'Rewriting...' : 'Apply Custom Prompt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'personal' && (
            <PersonalForm data={resumeData.personal} onChange={handlePersonalChange} />
          )}
          {activeSection === 'summary' && (
            <SummaryForm value={resumeData.summary} onChange={handleSummaryChange} onOpenRewrite={handleOpenRewrite} />
          )}
          {activeSection === 'experience' && (
            <DynamicSection 
              sectionKey="experience" 
              data={resumeData.experience} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              onOpenRewrite={handleOpenRewrite}
              addPayload={{ jobTitle: '', company: '', dates: '', description: '<p></p>' }} 
              fields={[
                { key: 'jobTitle', label: 'Job Title' }, 
                { key: 'company', label: 'Company' }, 
                { key: 'dates', label: 'Dates' }, 
                { key: 'description', label: 'Description/Achievements', type: 'textarea', colSpan: 2 }
              ]} 
            />
          )}
          {activeSection === 'education' && (
            <DynamicSection 
              sectionKey="education" 
              data={resumeData.education} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ degree: '', institution: '', graduationYear: '' }} 
              fields={[
                { key: 'degree', label: 'Degree' }, 
                { key: 'institution', label: 'Institution / School Name' }, 
                { key: 'graduationYear', label: 'Graduation Year / Dates' }
              ]} 
            />
          )}
          {activeSection === 'skills' && (
            <DynamicSection 
              sectionKey="skills" 
              data={resumeData.skills} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ category: 'Technical Skills', skills_list: '' }} 
              fields={[
                { key: 'category', label: 'Category' }, 
                { key: 'skills_list', label: 'Skills', type: 'skill_tags', colSpan: 2 }
              ]} 
            />
          )}
          {activeSection === 'projects' && (
            <DynamicSection 
              sectionKey="projects" 
              data={resumeData.projects} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              onOpenRewrite={handleOpenRewrite}
              addPayload={{ title: '', date: '', description: '<p></p>' }} 
              fields={[
                { key: 'title', label: 'Project Title' }, 
                { key: 'date', label: 'Date / Duration' }, 
                { key: 'description', label: 'Description', type: 'textarea', colSpan: 2 }
              ]} 
            />
          )}
          {activeSection === 'certifications' && (
            <DynamicSection 
              sectionKey="certifications" 
              data={resumeData.certifications} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ name: '', issuer: '', date: '' }} 
              fields={[
                { key: 'name', label: 'Certification Name' }, 
                { key: 'issuer', label: 'Issuing Organization' }, 
                { key: 'date', label: 'Date Earned' }
              ]} 
            />
          )}
          {activeSection === 'publications' && (
            <DynamicSection 
              sectionKey="publications" 
              data={resumeData.publications} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ title: '', journal: '', date: '' }} 
              fields={[
                { key: 'title', label: 'Publication Title' }, 
                { key: 'journal', label: 'Journal / Publisher' }, 
                { key: 'date', label: 'Publication Date' }
              ]} 
            />
          )}
          {activeSection === 'languages' && (
            <LanguagesForm 
              data={resumeData.languages} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
            />
          )}
          {activeSection === 'volunteer' && (
            <DynamicSection 
              sectionKey="volunteer" 
              data={resumeData.volunteer} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ role: '', organization: '', dates: '' }} 
              fields={[
                { key: 'role', label: 'Role / Position' }, 
                { key: 'organization', label: 'Organization' }, 
                { key: 'dates', label: 'Dates / Duration' }
              ]} 
            />
          )}
          {activeSection === 'awards' && (
            <DynamicSection 
              sectionKey="awards" 
              data={resumeData.awards} 
              onChange={handleDynamicChange} 
              onAdd={addDynamicEntry} 
              onRemove={removeDynamicEntry} 
              addPayload={{ title: '', issuer: '', date: '' }} 
              fields={[
                { key: 'title', label: 'Award Title' }, 
                { key: 'issuer', label: 'Issuer / Organization' }, 
                { key: 'date', label: 'Date Received' }
              ]} 
            />
          )}
          {activeSection === 'templates' && (
            <DesignOptionsPanel 
              options={styleOptions} 
              template={template}
              onTemplateChange={setTemplate}
              onChange={(key, val) => setStyleOptions(prev => ({ ...prev, [key]: val }))} 
            />
          )}
          {activeSection === 'reorder' && (
            <ReorderSectionPanel 
              order={sectionOrder} 
              hidden={hiddenSections} 
              onReorder={setSectionOrder} 
              onToggleHide={toggleSectionHide} 
            />
          )}
          {activeSection === 'ats_optimizer' && (
            <AtsOptimizerPanel
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              runAtsScoring={runAtsScoring}
              scoring={scoring}
              atsScoreData={atsScoreData}
              generateLatexResumeSubmit={generateLatexResumeSubmit}
              generatingLatex={generatingLatex}
              generatedLatexResume={generatedLatexResume}
              showRawLatexPane={showRawLatexPane}
              setShowRawLatexPane={setShowRawLatexPane}
            />
          )}
          {activeSection === 'latex_code' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} /> LaTeX Source Code
                </h3>
              </div>
              {generatedLatexResume ? (
                <div className="space-y-3">
                  <textarea
                    readOnly
                    className="w-full min-h-[400px] rounded-md border border-white/10 p-3 text-xs text-indigo-200 font-mono focus:outline-none"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                    value={generatedLatexResume}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLatexResume);
                      toast.success('LaTeX code copied to clipboard!');
                    }}
                    className="btn btn-secondary text-xs py-2 w-full"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Generate a tailored LaTeX resume in the ATS tab to inspect the source code.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visual Resume Preview Area */}
        {activeSection !== 'ats_optimizer' && activeSection !== 'latex_code' && (
          <div className="hidden lg:block w-full xl:w-[480px] flex-shrink-0">
            <div className="glass-panel p-4 flex flex-col h-[85vh]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 flex-shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye size={16} /> Live Visual Preview
                </h3>
                <button
                  onClick={() => {
                    const element = document.createElement("a");
                    const htmlStr = `
                      <html>
                        <head>
                          <style>
                            body { margin: 0; padding: 20px; font-family: sans-serif; }
                            #resume-preview-content { max-width: 800px; margin: 0 auto; }
                          </style>
                        </head>
                        <body>
                          ${document.getElementById('resume-preview-content')?.outerHTML || ''}
                        </body>
                      </html>
                    `;
                    const file = new Blob([htmlStr], { type: 'text/html' });
                    element.href = URL.createObjectURL(file);
                    element.download = `${(resumeData.personal?.name || 'resume').replace(/\s+/g, '_')}_Preview.html`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Download size={12} /> Download HTML Preview
                </button>
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4 max-h-[75vh]">
                <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
                  {renderVisualPreview()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
