/**
 * components/ProfileEditor.jsx — RECOVERED from the live production bundle at
 * https://ai-apply-dashboard.web.app (no source map available). See
 * dashboard/src-recovered-from-live/RECOVERY_NOTES.md before merging into dashboard/src/.
 *
 * This is the tabbed "Personal Profile" editor (Personal / Summary / Experience /
 * Education / Skills / Projects / Languages) rendered from the App's "profile" tab.
 * It is a genuinely separate, high-value component found in the live bundle:
 * a rich-text (tiptap) editor is used for Summary/Experience/Project descriptions,
 * and there's a dedicated tag-style Skills input.
 *
 * JSX is expressed as `x.jsx(Type, props)` / `x.jsxs(...)` calls (the compiled
 * "automatic JSX runtime" form) — see the note at the top of App.jsx for why, and
 * the shim below that makes this runnable as-is.
 */
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import {
  Award as IconAward,
  Bold as IconBold,
  Briefcase as IconBriefcase,
  FileText as IconFileText,
  FolderGit2 as IconFolderGit2,
  Globe as IconGlobe,
  GraduationCap as IconGraduationCap,
  Italic as IconItalic,
  Link as IconLink,
  List as IconList,
  ListOrdered as IconListOrdered,
  Plus as IconPlus,
  Trash2 as IconTrash2,
  User as IconUser,
  X as IconX,
  Zap as IconZap,
  Sparkles as IconSparkles
} from "lucide-react";
const LANGUAGE_PROFICIENCY_LEVELS = [
    "Native",
    "Fluent",
    "Professional",
    "Conversational",
    "Elementary",
  ],
  RichTextEditor = ({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
  }) => {
    const [mounted, setMounted] = useState(!1);
    useEffect(() => (setMounted(!0), () => setMounted(!1)), []);
    const editor = useEditor(
      {
        extensions: [
          StarterKit.configure({
            blockquote: !1,
            code: !1,
            horizontalRule: !1,
            hardBreak: !1,
            gapcursor: !1,
            history: !1,
          }),
          LinkExtension.configure({
            openOnClick: !1,
            autolink: !0,
            linkOnPaste: !0,
          }),
          PlaceholderExtension.configure({
            placeholder: placeholder || "Write something...",
          }),
        ],
        content: value || "<p></p>",
        onUpdate: ({ editor: o }) => {
          onChange(o.getHTML());
        },
        editorProps: {
          attributes: {
            class:
              "prose prose-sm max-w-none text-white focus:outline-none min-h-[120px] p-3 rounded-md border border-white/20 bg-white/5",
          },
        },
        injectCSS: !1,
        immediatelyRender: !1,
      },
      [],
    );

    useEffect(() => {
      if (editor && value !== undefined && !editor.isFocused) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== value) {
          editor.commands.setContent(value || "<p></p>", false);
        }
      }
    }, [value, editor]);
    return !mounted || !editor ? (
      <div className="min-h-[120px] p-3 rounded-md border border-white/20 bg-white/5 text-white placeholder-gray-400">
        {placeholder || "Loading editor..."}
      </div>
    ) : (
      <div
        className="tiptap-editor-wrapper"
        style={{
          marginTop: "4px",
        }}
      >
        <div className="flex items-center gap-1 p-1 rounded-t-md border-t border-x border-white/20 bg-white/5 text-white">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={
              editor.isActive("bold")
                ? "p-1.5 rounded bg-white/20"
                : "p-1.5 rounded hover:bg-white/10"
            }
            type="button"
          >
            <IconBold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={
              editor.isActive("italic")
                ? "p-1.5 rounded bg-white/20"
                : "p-1.5 rounded hover:bg-white/10"
            }
            type="button"
          >
            <IconItalic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={
              editor.isActive("bulletList")
                ? "p-1.5 rounded bg-white/20"
                : "p-1.5 rounded hover:bg-white/10"
            }
            type="button"
          >
            <IconList size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={
              editor.isActive("orderedList")
                ? "p-1.5 rounded bg-white/20"
                : "p-1.5 rounded hover:bg-white/10"
            }
            type="button"
          >
            <IconListOrdered size={14} />
          </button>
          <button
            onClick={() => {
              const o = editor.getAttributes("link").href,
                c = window.prompt("URL", o);
              if (c !== null) {
                if (c === "") {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .unsetLink()
                    .run();
                  return;
                }
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({
                    href: c,
                  })
                  .run();
              }
            }}
            className={
              editor.isActive("link")
                ? "p-1.5 rounded bg-white/20"
                : "p-1.5 rounded hover:bg-white/10"
            }
            type="button"
          >
            <IconLink size={14} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  },
  SkillTagsInput = ({ value: value, onChange: onChange }) => {
    const [inputValue, setInputValue] = useState(""),
      [focused, setFocused] = useState(!1),
      inputRef = useRef(null),
      tags = value
        ? value
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [],
      commitTags = (b) => onChange(b.join(", ")),
      addTag = (b) => {
        const E = b.trim();
        if (!E || tags.includes(E)) {
          setInputValue("");
          return;
        }
        (commitTags([...tags, E]), setInputValue(""));
      },
      removeTag = (b) => commitTags(tags.filter((E) => E !== b)),
      handleKeyDown = (b) => {
        ((b.key === "Enter" || b.key === ",") &&
          (b.preventDefault(), addTag(inputValue)),
          b.key === "Backspace" &&
            !inputValue &&
            tags.length &&
            removeTag(tags[tags.length - 1]));
      };
    return (
      <div
        className="relative"
        style={{
          marginTop: "4px",
        }}
      >
        <div
          className="min-h-[52px] flex flex-wrap gap-1.5 items-center p-2.5 rounded-lg border border-white/20 bg-white/5 cursor-text focus-within:border-indigo-500/60 transition-colors"
          onClick={() => {
            var b;
            return (b = inputRef.current) == null ? void 0 : b.focus();
          }}
        >
          {tags.map((b) => (
            <span
              className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-full"
              key={b}
            >
              {b}
              <button
                type="button"
                onClick={(E) => {
                  (E.stopPropagation(), removeTag(b));
                }}
                className="hover:text-rose-400 transition-colors ml-0.5"
              >
                <IconX size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(b) => setInputValue(b.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(!0)}
            onBlur={() => setTimeout(() => setFocused(!1), 150)}
            placeholder={
              tags.length === 0
                ? "Type a skill and press Enter or comma…"
                : "Add more…"
            }
            className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>
    );
  },
  FieldLabel = ({ children: n }) => (
    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 block">
      {n}
    </label>
  ),
  TextInput = (n) => (
    <input
      {...n}
      style={{
        background: "rgba(15,23,42,0.4)",
      }}
      className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
    />
  ),
  SelectInput = ({ children: n, ...e }) => (
    <select
      {...e}
      style={{
        background: "rgba(15,23,42,0.4)",
      }}
      className="flex h-10 w-full rounded-md border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-colors"
    >
      {n}
    </select>
  ),
  PersonalInfoSection = ({ data: data, onChange: onFieldChange }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>{"Full Name"}</FieldLabel>
          <TextInput
            value={data.name || ""}
            onChange={(t) => onFieldChange("name", t.target.value)}
          />
        </div>
        <div>
          <FieldLabel>{"Email"}</FieldLabel>
          <TextInput
            type="email"
            value={data.email || ""}
            onChange={(t) => onFieldChange("email", t.target.value)}
          />
        </div>
        <div>
          <FieldLabel>{"Phone"}</FieldLabel>
          <TextInput
            value={data.phone || ""}
            onChange={(t) => onFieldChange("phone", t.target.value)}
          />
        </div>
        <div>
          <FieldLabel>{"Location"}</FieldLabel>
          <TextInput
            value={data.location || ""}
            onChange={(t) => onFieldChange("location", t.target.value)}
          />
        </div>
        <div>
          <FieldLabel>{"LinkedIn URL (optional)"}</FieldLabel>
          <TextInput
            value={data.linkedin || ""}
            placeholder="linkedin.com/in/username"
            onChange={(t) => onFieldChange("linkedin", t.target.value)}
          />
        </div>
        <div>
          <FieldLabel>{"GitHub URL (optional)"}</FieldLabel>
          <TextInput
            value={data.github || ""}
            placeholder="github.com/username"
            onChange={(t) => onFieldChange("github", t.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>{"Website / Portfolio (optional)"}</FieldLabel>
          <TextInput
            value={data.website || ""}
            placeholder="yoursite.com"
            onChange={(t) => onFieldChange("website", t.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>{"Header Links Display Format on Resume"}</FieldLabel>
          <SelectInput
            value={data.linkDisplayFormat || "clean"}
            onChange={(t) => onFieldChange("linkDisplayFormat", t.target.value)}
          >
            <option value="clean">{"Clean Handle (e.g. linkedin.com/in/username)"}</option>
            <option value="short">{"Short Label (e.g. LinkedIn | GitHub | Portfolio)"}</option>
            <option value="full">{"Full URL (e.g. https://linkedin.com/in/username)"}</option>
          </SelectInput>
        </div>
      </div>
      <div>
        <FieldLabel>{"Legal Status"}</FieldLabel>
        <SelectInput
          value={data.legalStatus || "Prefer not to say"}
          onChange={(t) => onFieldChange("legalStatus", t.target.value)}
        >
          <option>{"Prefer not to say"}</option>
          <option>{"U.S. Citizen"}</option>
          <option>{"Permanent Resident"}</option>
          <option>{"Work Visa (H-1B)"}</option>
          <option>{"OPT / CPT"}</option>
          <option>{"EU Citizen"}</option>
        </SelectInput>
      </div>
    </div>
  ),
  SummarySection = ({ value: value, onChange: onChange, onEnhance: onEnhance }) => (
    <div className="space-y-4">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <FieldLabel>{"Professional Summary"}</FieldLabel>
          {onEnhance && (
            <button
              type="button"
              onClick={() => onEnhance('Summary', value || '', { type: 'summary' })}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', gap: '5px', alignItems: 'center', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}
            >
              <IconSparkles size={12} /> {"✨ Enhance with AI"}
            </button>
          )}
        </div>
        <RichTextEditor
          value={value || ""}
          onChange={onChange}
          placeholder="A concise summary of your professional experience and goals..."
        />
      </div>
    </div>
  ),
  DynamicListSection = ({
    sectionKey: sectionKey,
    data: data,
    onChange: onChange,
    onAdd: onAdd,
    onRemove: onRemove,
    fields: fields,
    addPayload: addPayload,
    onEnhance: onEnhance
  }) => (
    <div className="space-y-4">
      {(data || []).map((c, h) => (
        <div
          className="p-4 border border-white/10 bg-white/[0.02] rounded-lg relative space-y-3"
          key={c.id}
        >
          <button
            type="button"
            onClick={() => onRemove(sectionKey, c.id)}
            className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
          >
            <IconTrash2 size={16} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((d) => {
              const p = d.colSpan === 2 ? "md:col-span-2" : "";
              let g = {
                value: c[d.key] || "",
                onChange: (b) => onChange(sectionKey, h, d.key, b.target.value),
                placeholder: `Enter ${d.label.toLowerCase()}...`,
              };
              return d.type === "textarea" ? (
                <div className={p} key={d.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <FieldLabel>{d.label}</FieldLabel>
                    {onEnhance && (
                      <button
                        type="button"
                        onClick={() => onEnhance(`${sectionKey === 'work_history' ? 'Work Experience' : sectionKey === 'projects' ? 'Project' : 'Education'} #${h + 1}`, c[d.key] || '', { type: sectionKey === 'work_history' ? 'work' : sectionKey === 'projects' ? 'project' : 'education', index: h, field: d.key })}
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                      >
                        <IconSparkles size={11} /> {"✨ Enhance"}
                      </button>
                    )}
                  </div>
                  <RichTextEditor
                    value={c[d.key] || ""}
                    onChange={(b) => onChange(sectionKey, h, d.key, b)}
                    placeholder={g.placeholder}
                  />
                </div>
              ) : d.type === "skill_tags" ? (
                <div className={p} key={d.key}>
                  <FieldLabel>{d.label}</FieldLabel>
                  <SkillTagsInput
                    value={c[d.key] || ""}
                    onChange={(b) => onChange(sectionKey, h, d.key, b)}
                  />
                </div>
              ) : (
                <div className={p} key={d.key}>
                  <FieldLabel>{d.label}</FieldLabel>
                  <TextInput {...g} />
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
        <IconPlus size={16} />
        {" Add Entry"}
      </button>
    </div>
  ),
  LanguagesSection = ({
    data: data,
    onChange: onChange,
    onAdd: onAdd,
    onRemove: onRemove,
  }) => (
    <div className="space-y-4">
      {(data || []).map((i, s) => (
        <div
          className="flex items-center gap-3 p-3 border border-white/10 bg-white/[0.02] rounded-lg relative"
          key={i.id}
        >
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel>{"Language"}</FieldLabel>
              <TextInput
                value={i.language || ""}
                placeholder="e.g. Spanish"
                onChange={(o) =>
                  onChange("languages", s, "language", o.target.value)
                }
              />
            </div>
            <div>
              <FieldLabel>{"Proficiency"}</FieldLabel>
              <SelectInput
                value={i.proficiency || "Conversational"}
                onChange={(o) =>
                  onChange("languages", s, "proficiency", o.target.value)
                }
              >
                {LANGUAGE_PROFICIENCY_LEVELS.map((o) => (
                  <option value={o} key={o}>
                    {o}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove("languages", i.id)}
            className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
          >
            <IconTrash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onAdd("languages", {
            language: "",
            proficiency: "Conversational",
          })
        }
        className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-white/40 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
      >
        <IconPlus size={16} />
        {" Add Language"}
      </button>
    </div>
  ),
  profileEditorStateToResumeData = (state) => {
    var p1, p2, p3, p4, p5, p6, p7, p8;
    return {
      personal: {
        name: ((p1 = state.personal) == null ? void 0 : p1.name) || "",
        email: ((p2 = state.personal) == null ? void 0 : p2.email) || "",
        phone: ((p3 = state.personal) == null ? void 0 : p3.phone) || "",
        location: ((p4 = state.personal) == null ? void 0 : p4.location) || "",
        legalStatus:
          ((p5 = state.personal) == null ? void 0 : p5.legalStatus) ||
          "Prefer not to say",
        linkedin: ((p6 = state.personal) == null ? void 0 : p6.linkedin) || "",
        github: ((p7 = state.personal) == null ? void 0 : p7.github) || "",
        website: ((p8 = state.personal) == null ? void 0 : p8.website) || "",
        linkDisplayFormat: state.personal?.linkDisplayFormat || "clean",
      },
      summary: state.summary || "",
      skills: (state.skills || []).flatMap((d) =>
        d.skills_list
          ? d.skills_list
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      ),
      work_history: (state.experience || []).map((d) => ({
        position: d.jobTitle || "",
        company: d.company || "",
        dates: d.dates || "",
        achievements: d.description
          ? d.description
              .replace(
                /<[^>]*>/g,
                `
`,
              )
              .split(
                `
`,
              )
              .map((p) => p.trim().replace(/^[-•*]\s*/, ""))
              .filter(Boolean)
          : [],
      })),
      projects: (state.projects || []).map((d) => ({
        name: d.title || "",
        dates: d.date || "",
        achievements: d.description
          ? d.description
              .replace(
                /<[^>]*>/g,
                `
`,
              )
              .split(
                `
`,
              )
              .map((p) => p.trim().replace(/^[-•*]\s*/, ""))
              .filter(Boolean)
          : [],
      })),
      education: (state.education || []).map((d) => ({
        institution: d.institution || "",
        degree: d.degree || "",
        dates: d.graduationYear || "",
      })),
    };
  },
  resumeDataToProfileEditorState = (resumeData) => {
    var p1, p2, p3, p4, p5, p6, p7, p8;
    return resumeData
      ? {
          personal: {
            name: ((p1 = resumeData.personal) == null ? void 0 : p1.name) || "",
            email:
              ((p2 = resumeData.personal) == null ? void 0 : p2.email) || "",
            phone:
              ((p3 = resumeData.personal) == null ? void 0 : p3.phone) || "",
            location:
              ((p4 = resumeData.personal) == null ? void 0 : p4.location) || "",
            legalStatus:
              ((p5 = resumeData.personal) == null ? void 0 : p5.legalStatus) ||
              "Prefer not to say",
            linkedin:
              ((p6 = resumeData.personal) == null ? void 0 : p6.linkedin) || "",
            github:
              ((p7 = resumeData.personal) == null ? void 0 : p7.github) || "",
            website:
              ((p8 = resumeData.personal) == null ? void 0 : p8.website) || "",
            linkDisplayFormat: resumeData.personal?.linkDisplayFormat || "clean",
          },
          summary: resumeData.summary || "",
          experience: (resumeData.work_history || []).map((d, p) => ({
            id: `exp-${p}-${Date.now()}`,
            jobTitle: d.position || "",
            company: d.company || "",
            dates: d.dates || "",
            description: d.achievements
              ? `<p>${d.achievements.join("</p><p>")}</p>`
              : "",
          })),
          education: (resumeData.education || []).map((d, p) => ({
            id: `edu-${p}-${Date.now()}`,
            degree: d.degree || "",
            institution: d.institution || "",
            graduationYear: d.dates || "",
            gpa: "",
            achievements: "",
          })),
          skills: [
            {
              id: `skills-0-${Date.now()}`,
              category: "Technical Skills",
              skills_list: (resumeData.skills || []).join(", "),
            },
          ],
          projects: (resumeData.projects || []).map((d, p) => ({
            id: `proj-${p}-${Date.now()}`,
            title: d.name || "",
            date: d.dates || "",
            description: d.achievements
              ? `<p>${d.achievements.join("</p><p>")}</p>`
              : "",
          })),
          publications: [],
          certifications: [],
          languages: [],
          volunteer: [],
          awards: [],
        }
      : null;
  };
function ProfileEditor({ profile: profile, onProfileUpdate: onProfileUpdate, onEnhanceSection: onEnhanceSection }) {
  const [activeSection, setActiveSection] = useState("personal"),
    [formData, setFormData] = useState(() =>
      resumeDataToProfileEditorState(profile),
    );
  useEffect(() => {
    if (profile) {
      const E = resumeDataToProfileEditorState(profile);
      setFormData((S) => {
        var w, k, N, K;
        return JSON.stringify(S == null ? void 0 : S.personal) !==
          JSON.stringify(E.personal) ||
          ((w = S == null ? void 0 : S.experience) == null
            ? void 0
            : w.length) !== ((k = E.experience) == null ? void 0 : k.length) ||
          ((N = S == null ? void 0 : S.projects) == null
            ? void 0
            : N.length) !== ((K = E.projects) == null ? void 0 : K.length)
          ? E
          : S;
      });
    }
  }, [profile]);
  const commitChange = (E) => {
      setFormData(E);
      const S = profileEditorStateToResumeData(E);
      onProfileUpdate(S);
    },
    updatePersonalField = (E, S) => {
      const w = {
        ...formData,
        personal: {
          ...formData.personal,
          [E]: S,
        },
      };
      commitChange(w);
    },
    updateSummary = (E) => {
      const S = {
        ...formData,
        summary: E,
      };
      commitChange(S);
    },
    updateListItemField = (E, S, w, k) => {
      const N = [...(formData[E] || [])];
      N[S] = {
        ...N[S],
        [w]: k,
      };
      const K = {
        ...formData,
        [E]: N,
      };
      commitChange(K);
    },
    addListItem = (E, S) => {
      const w = {
        ...formData,
        [E]: [
          ...(formData[E] || []),
          {
            id: `dyn-${Date.now()}`,
            ...S,
          },
        ],
      };
      (commitChange(w), toast.success("Added new entry"));
    },
    removeListItem = (E, S) => {
      const w = {
        ...formData,
        [E]: (formData[E] || []).filter((k) => k.id !== S),
      };
      (commitChange(w), toast.error("Removed entry"));
    };

    const DEFAULT_SECTIONS = [
      { id: "personal", name: "Personal", icon: <IconUser size={15} /> },
      { id: "summary", name: "Summary", icon: <IconFileText size={15} /> },
      { id: "experience", name: "Experience", icon: <IconBriefcase size={15} /> },
      { id: "education", name: "Education", icon: <IconGraduationCap size={15} /> },
      { id: "skills", name: "Skills", icon: <IconAward size={15} /> },
      { id: "projects", name: "Projects", icon: <IconFolderGit2 size={15} /> },
      { id: "languages", name: "Languages", icon: <IconGlobe size={15} /> },
    ];
    const [sections, setSections] = useState(DEFAULT_SECTIONS);

    const moveSection = (idx, direction) => {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= sections.length) return;
      const nextSections = [...sections];
      const temp = nextSections[idx];
      nextSections[idx] = nextSections[targetIdx];
      nextSections[targetIdx] = temp;
      setSections(nextSections);
      const nextOrder = nextSections.map((s) => s.id);
      const updatedData = {
        ...formData,
        sectionsOrder: nextOrder,
        customSectionsList: nextSections
      };
      commitChange(updatedData);
      toast.success(`Reordered section "${temp.name}"`);
    };

    const handleAddCustomSection = () => {
      const sectionName = prompt("Enter Custom Section Title (e.g. Certifications, Publications, Volunteering):");
      if (!sectionName || !sectionName.trim()) return;
      const cleanName = sectionName.trim();
      const customId = `custom_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
      const newSec = {
        id: customId,
        name: cleanName,
        isCustom: true,
        icon: <IconSparkles size={15} />
      };
      const nextSections = [...sections, newSec];
      setSections(nextSections);
      setActiveSection(customId);
      const nextOrder = nextSections.map((s) => s.id);
      const updatedData = {
        ...formData,
        sectionsOrder: nextOrder,
        customSectionsList: nextSections
      };
      commitChange(updatedData);
      toast.success(`Added new custom section: "${cleanName}"`);
    };

  return formData ? (
    <div className="flex flex-col gap-4 min-h-0 w-full">
      {/* Horizontal Top Section Navigation Bar */}
      <div className="glass-panel p-3">
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {"CONTENT SECTIONS (Reorder with ◀ ▶)"}
          </div>
          <button
            type="button"
            onClick={handleAddCustomSection}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-purple-300 border border-purple-500/30 hover:bg-purple-500/10 transition-colors"
          >
            <IconPlus size={13} />
            <span>{"+ Add Custom Section"}</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((w, sIdx) => {
            const k = activeSection === w.id;
            return (
              <div key={w.id} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveSection(w.id)}
                  style={{
                    background: k
                      ? "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                      : "rgba(255,255,255,0.03)",
                    borderColor: k
                      ? "#c084fc"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: k ? "0 4px 14px rgba(168, 85, 247, 0.3)" : "none"
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white border hover:bg-white/[0.08] transition-all whitespace-nowrap"
                >
                  {w.icon}
                  <span>{w.name}</span>
                </button>
                <div className="flex flex-col opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={sIdx === 0}
                    onClick={() => moveSection(sIdx, -1)}
                    className="text-[10px] text-zinc-400 hover:text-white px-1 py-0 disabled:opacity-20"
                    title="Move Left"
                  >
                    {"◀"}
                  </button>
                  <button
                    type="button"
                    disabled={sIdx === sections.length - 1}
                    onClick={() => moveSection(sIdx, 1)}
                    className="text-[10px] text-zinc-400 hover:text-white px-1 py-0 disabled:opacity-20"
                    title="Move Right"
                  >
                    {"▶"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full glass-panel p-6 overflow-y-auto max-h-[80vh]">
        {activeSection === "personal" && (
          <PersonalInfoSection
            data={formData.personal}
            onChange={updatePersonalField}
          />
        )}
        {activeSection === "summary" && (
          <SummarySection value={formData.summary} onChange={updateSummary} onEnhance={onEnhanceSection} />
        )}
        {activeSection === "experience" && (
          <DynamicListSection
            sectionKey="experience"
            data={formData.experience}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
            onEnhance={onEnhanceSection}
            addPayload={{
              jobTitle: "",
              company: "",
              dates: "",
              description: "<p></p>",
            }}
            fields={[
              {
                key: "jobTitle",
                label: "Job Title",
              },
              {
                key: "company",
                label: "Company",
              },
              {
                key: "dates",
                label: "Dates",
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                colSpan: 2,
              },
            ]}
          />
        )}
        {activeSection === "education" && (
          <DynamicListSection
            sectionKey="education"
            data={formData.education}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
            onEnhance={onEnhanceSection}
            addPayload={{
              degree: "",
              institution: "",
              graduationYear: "",
            }}
            fields={[
              {
                key: "degree",
                label: "Degree",
              },
              {
                key: "institution",
                label: "Institution",
              },
              {
                key: "graduationYear",
                label: "Graduation Year / Dates",
              },
            ]}
          />
        )}
        {activeSection === "skills" && (
          <DynamicListSection
            sectionKey="skills"
            data={formData.skills}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
            addPayload={{
              category: "Technical Skills",
              skills_list: "",
            }}
            fields={[
              {
                key: "category",
                label: "Category",
              },
              {
                key: "skills_list",
                label: "Skills",
                type: "skill_tags",
                colSpan: 2,
              },
            ]}
          />
        )}
        {activeSection === "projects" && (
          <DynamicListSection
            sectionKey="projects"
            data={formData.projects}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
            onEnhance={onEnhanceSection}
            addPayload={{
              title: "",
              date: "",
              description: "<p></p>",
            }}
            fields={[
              {
                key: "title",
                label: "Project Title",
              },
              {
                key: "date",
                label: "Date / Duration",
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                colSpan: 2,
              },
            ]}
          />
        )}
        {activeSection === "languages" && (
          <LanguagesSection
            data={formData.languages}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
          />
        )}
        {activeSection.startsWith("custom_") && (
          <DynamicListSection
            sectionKey={activeSection}
            data={formData[activeSection] || []}
            onChange={updateListItemField}
            onAdd={addListItem}
            onRemove={removeListItem}
            onEnhance={onEnhanceSection}
            addPayload={{
              title: "",
              subtitle: "",
              dates: "",
              description: "<p></p>",
            }}
            fields={[
              {
                key: "title",
                label: "Title / Name",
              },
              {
                key: "subtitle",
                label: "Organization / Subtitle",
              },
              {
                key: "dates",
                label: "Dates / Year",
              },
              {
                key: "description",
                label: "Description / Highlights",
                type: "textarea",
                colSpan: 2,
              },
            ]}
          />
        )}
      </div>
    </div>
  ) : null;
}
export default ProfileEditor;
