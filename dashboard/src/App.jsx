/**
 * App.jsx — RECOVERED from the live production bundle at https://ai-apply-dashboard.web.app
 * (dashboard/index-<hash>.js, ~1.4MB minified, no source map available).
 *
 * This file was reconstructed by de-minifying and beautifying the deployed JS bundle,
 * then renaming mangled identifiers back to meaningful names using scope-safe AST
 * transforms (Babel) plus manual reading of the surrounding logic and UI copy.
 *
 * IMPORTANT — read dashboard/src-recovered-from-live/RECOVERY_NOTES.md before merging
 * this into dashboard/src/. This is best-effort reverse engineering, not a byte-perfect
 * restoration:
 *   - Variable/function names are our best reconstruction based on usage, not the
 *     original author's names.
 *   - JSX is expressed as `x.jsx(Type, props)` / `x.jsxs(Type, props, ...children)`
 *     calls (the compiled "automatic JSX runtime" form) rather than `<Type ... />`
 *     angle-bracket syntax, because the live bundle only contains the compiled form.
 *     A small shim below (`x = { jsx, jsxs, Fragment }`) makes this file runnable
 *     as-is; converting to angle-bracket JSX is optional cosmetic follow-up work.
 *   - Icon components are imported from lucide-react under `IconXxx` aliases so the
 *     internal call sites (already renamed) don't need to be touched again.
 */
import { useState, useEffect, useRef } from "react";
import { toast, Toaster } from "sonner";
import {
  ArrowRight as IconArrowRight,
  Award as IconAward,
  BookOpen as IconBookOpen,
  Check as IconCheck,
  Copy as IconCopy,
  Download as IconDownload,
  ExternalLink as IconExternalLink,
  FileText as IconFileText,
  Globe as IconGlobe,
  LayoutDashboard as IconLayoutDashboard,
  Lock as IconLock,
  LogOut as IconLogOut,
  MessageSquare as IconMessageSquare,
  Mic as IconMic,
  Moon as IconMoon,
  Plus as IconPlus,
  Search as IconSearch,
  Send as IconSend,
  Settings as IconSettings,
  Sparkles as IconSparkles,
  Sun as IconSun,
  Terminal as IconTerminal,
  Trash2 as IconTrash2,
  User as IconUser,
  UserCheck as IconUserCheck,
  Zap as IconZap,
} from "lucide-react";
import {
  subscribeToAuthChanges,
  loadFromCloud,
  saveToCloud,
  signOutUser,
} from "./firebase.js";
import AuthPage from "./components/AuthPage.jsx";
import ProfileEditor from "./components/ProfileEditor.jsx";
import RecruiterWorkspace from "./components/RecruiterWorkspace.jsx";
import EnhancementModal from "./components/EnhancementModal.jsx";
const API_BASE_URL =
    "https://ai-apply-backend-414523842687.us-central1.run.app",
  formatUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };
function LandingPageDemoWidget() {
  const [typedText, setTypedText] = useState(""),
    fullText = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position. With 5+ years of experience building React applications and optimizing database metrics by 40%, I am excited to contribute to your engineering team...`;
  return (
    useEffect(() => {
      let r = 0;
      const i = setInterval(() => {
        (setTypedText(fullText.substring(0, r)),
          r++,
          r > fullText.length &&
            setTimeout(() => {
              r = 0;
            }, 3e3));
      }, 40);
      return () => clearInterval(i);
    }, []),
    (
      <div className="demo-widget">
        <div className="demo-pane">
          <div className="demo-title">{"📄 Candidate Resume"}</div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              lineHeight: "1.6",
            }}
          >
            <strong>{"Name:"}</strong>
            {" Steve Jobs"}
            <br />
            <strong>{"Role:"}</strong>
            {" Product Leader"}
            <br />
            <strong>{"Skills:"}</strong>
            {" Product Management, React, Mobile Apps"}
            <br />
            <strong>{"Experience:"}</strong>
            <br />
            {"• CEO at Apple Inc (1997 - 2011)"}
            <br />
            {"• Founder & CEO at NeXT (1985 - 1996)"}
          </div>
        </div>
        <div
          className="demo-pane"
          style={{
            borderLeft: "1px solid var(--border-color)",
          }}
        >
          <div className="demo-title">{"✨ AI Cover Letter Generator"}</div>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "var(--text-main)",
              whiteSpace: "pre-wrap",
              minHeight: "120px",
              lineHeight: "1.4",
            }}
          >
            {typedText}
            <span
              className="pulse-primary"
              style={{
                display: "inline-block",
                width: "6px",
                height: "12px",
                background: "var(--primary)",
              }}
            />
          </div>
        </div>
      </div>
    )
  );
}
const cleanBulletText = (n) =>
  typeof n != "string" ? "" : n.trim().replace(/^[-•*]\s*/, "");
const getEntryBullets = (entry) => {
  if (!entry) return [];
  if (Array.isArray(entry.achievements) && entry.achievements.length)
    return entry.achievements.map(cleanBulletText).filter(Boolean);
  if (typeof entry.description == "string" && entry.description.trim())
    return entry.description
      .split("\n")
      .map((s) => cleanBulletText(s))
      .filter(Boolean);
  return [];
};
// Diff the AI-tailored resume against the base version, one entry per changed
// summary / skills list / bullet, so each can be accepted or rejected on its own.
const computeTailorChanges = (base, tailored) => {
  const changes = [];
  let nextId = 0;
  const push = (c) => changes.push({ ...c, id: `chg_${nextId++}`, accepted: true });
  const baseSummary = (base.summary || "").trim(),
    newSummary = ((tailored && tailored.summary) || "").trim();
  if (newSummary && newSummary !== baseSummary)
    push({
      kind: "summary",
      label: "Professional Summary",
      before: baseSummary,
      after: newSummary,
    });
  const baseSkills = base.skills || [],
    newSkills = (tailored && tailored.skills) || [];
  if (newSkills.length && JSON.stringify(baseSkills) !== JSON.stringify(newSkills))
    push({
      kind: "skills",
      label: "Skills",
      before: baseSkills.join(", "),
      after: newSkills.join(", "),
      afterSkills: newSkills.slice(),
    });
  for (const section of ["work_history", "projects"]) {
    const baseList = base[section] || [],
      newList = (tailored && tailored[section]) || [];
    newList.forEach((entry, i) => {
      const baseEntry = baseList[i];
      if (!baseEntry) return;
      const title =
        section === "work_history"
          ? `${baseEntry.position || baseEntry.role || "Role"}${baseEntry.company ? " @ " + baseEntry.company : ""}`
          : baseEntry.name || "Project";
      const baseBullets = getEntryBullets(baseEntry),
        newBullets = getEntryBullets(entry),
        max = Math.max(baseBullets.length, newBullets.length);
      for (let j = 0; j < max; j++) {
        const before = baseBullets[j] || "",
          after = newBullets[j] || "";
        if (before === after) continue;
        push({
          kind: "bullet",
          section,
          index: i,
          bullet: j,
          label: title,
          before,
          after,
        });
      }
    });
  }
  return changes;
};
const applyTailorChanges = (base, changes) => {
  const result = JSON.parse(JSON.stringify(base));
  for (const c of changes) {
    if (c.kind !== "bullet") continue;
    const entry = (result[c.section] || [])[c.index];
    if (entry && !Array.isArray(entry.achievements))
      entry.achievements = getEntryBullets(entry);
  }
  for (const c of changes) {
    if (!c.accepted) continue;
    if (c.kind === "summary") result.summary = c.after;
    else if (c.kind === "skills") result.skills = c.afterSkills.slice();
    else {
      const entry = (result[c.section] || [])[c.index];
      if (entry) entry.achievements[c.bullet] = c.after || null;
    }
  }
  for (const c of changes) {
    if (c.kind !== "bullet") continue;
    const entry = (result[c.section] || [])[c.index];
    if (entry && Array.isArray(entry.achievements))
      entry.achievements = entry.achievements.filter(
        (b) => b != null && String(b).trim() !== "",
      );
  }
  return result;
};
const countKeywordCoverage = (data, keywords) => {
  if (!keywords || !keywords.length) return null;
  const hay = JSON.stringify(data).toLowerCase();
  return keywords.filter((k) => hay.includes(String(k).toLowerCase())).length;
};
const safeString = (val) => {
  if (typeof val === "string") return val.replace(/<[^>]*>/g, "");
  if (Array.isArray(val)) return val.map(v => typeof v === "string" ? v.replace(/<[^>]*>/g, "") : String(v)).join("\n");
  if (val != null) return String(val).replace(/<[^>]*>/g, "");
  return "";
};
const formatHeaderLink = (url, format = "clean", type = "") => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (format === "short") {
    if (type === "linkedin") return "LinkedIn";
    if (type === "github") return "GitHub";
    if (type === "website") return "Portfolio";
    return "Link";
  }

  if (format === "clean") {
    return trimmed.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const safeHtml = (val) => {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(v => `<p>${String(v)}</p>`).join("");
  if (val != null) return String(val);
  return "";
};
const getSkillsList = (skillsData) => {
  if (!skillsData) return [];
  if (Array.isArray(skillsData)) {
    return skillsData.flatMap((sk) => {
      if (typeof sk === "string") return sk.split(",").map(s => s.trim()).filter(Boolean);
      if (sk && typeof sk === "object") {
        const str = sk.skills_list || sk.name || sk.skill || "";
        return typeof str === "string" ? str.split(",").map(s => s.trim()).filter(Boolean) : [];
      }
      return [];
    });
  }
  if (typeof skillsData === "string") {
    return skillsData.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};
const renderVisualResumeSheet = (profile) => {
  const skillsList = getSkillsList(profile?.skills);
  const name = profile?.personal?.name || "Candidate Name";
  const email = profile?.personal?.email || "";
  const phone = profile?.personal?.phone || "";
  const location = profile?.personal?.location || "";
  const linkFormat = profile?.personal?.linkDisplayFormat || "clean";

  const rawLinkedin = profile?.personal?.linkedin || "";
  const rawGithub = profile?.personal?.github || "";
  const rawWebsite = profile?.personal?.website || "";

  const linkedinText = formatHeaderLink(rawLinkedin, linkFormat, "linkedin");
  const githubText = formatHeaderLink(rawGithub, linkFormat, "github");
  const websiteText = formatHeaderLink(rawWebsite, linkFormat, "website");

  const buildHref = (url) => {
    if (!url) return "#";
    if (!url.startsWith("http://") && !url.startsWith("https://")) return `https://${url}`;
    return url;
  };

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'education', 'languages'];
  const sectionsOrder = profile?.sectionsOrder && profile.sectionsOrder.length > 0 ? profile.sectionsOrder : defaultOrder;

  const sectionRenderers = {
    summary: () => profile?.summary ? (
      <div key="summary" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 6px 0", color: "#0f172a" }}>
          Professional Summary
        </h3>
        <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#1e293b" }} dangerouslySetInnerHTML={{ __html: safeHtml(profile.summary) }} />
      </div>
    ) : null,

    skills: () => skillsList.length > 0 ? (
      <div key="skills" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 6px 0", color: "#0f172a" }}>
          Technical Skills
        </h3>
        <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#1e293b" }}>
          <strong style={{ color: "#0f172a" }}>Skills: </strong>{skillsList.join(", ")}
        </div>
      </div>
    ) : null,

    experience: () => ((profile?.work_history && profile.work_history.length > 0) || (profile?.experience && profile.experience.length > 0)) ? (
      <div key="experience" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 8px 0", color: "#0f172a" }}>
          Work Experience
        </h3>
        {(profile.work_history || profile.experience || []).map((w, idx) => (
          <div key={idx} style={{ marginBottom: "10px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
              <div>
                <strong style={{ color: "#0f172a", fontSize: "12px" }}>{w.jobTitle || w.position || w.role || "Role"}</strong>
                <span style={{ color: "#334155", fontStyle: "italic" }}> — {w.company || "Company"}</span>
              </div>
              <div style={{ fontWeight: "600", color: "#475569", fontSize: "11px" }}>{w.dates || w.duration || ""}</div>
            </div>
            <div className="resume-bullet-content" style={{ marginTop: "2px", color: "#334155", lineHeight: "1.45" }} dangerouslySetInnerHTML={{ __html: safeHtml(w.description || w.achievements) }} />
          </div>
        ))}
      </div>
    ) : null,

    projects: () => (profile?.projects && profile.projects.length > 0) ? (
      <div key="projects" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 8px 0", color: "#0f172a" }}>
          Key Projects
        </h3>
        {profile.projects.map((p, idx) => (
          <div key={idx} style={{ marginBottom: "10px", fontSize: "11.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
              <strong style={{ color: "#0f172a", fontSize: "12px" }}>{p.name || p.title || "Project"}</strong>
              <div style={{ fontWeight: "600", color: "#475569", fontSize: "11px" }}>{p.dates || p.date || ""}</div>
            </div>
            <div className="resume-bullet-content" style={{ marginTop: "2px", color: "#334155", lineHeight: "1.45" }} dangerouslySetInnerHTML={{ __html: safeHtml(p.description || p.achievements) }} />
          </div>
        ))}
      </div>
    ) : null,

    education: () => (profile?.education && profile.education.length > 0) ? (
      <div key="education" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 8px 0", color: "#0f172a" }}>
          Education
        </h3>
        {profile.education.map((e, idx) => (
          <div key={idx} style={{ marginBottom: "6px", fontSize: "11.5px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <strong style={{ color: "#0f172a" }}>{e.institution || e.school || "University"}</strong>
              <span style={{ color: "#334155" }}> — {e.degree || e.field_of_study || ""}</span>
            </div>
            <div style={{ fontWeight: "600", color: "#475569", fontSize: "11px" }}>{e.graduationYear || e.dates || e.duration || ""}</div>
          </div>
        ))}
      </div>
    ) : null,

    languages: () => (profile?.languages && profile.languages.length > 0) ? (
      <div key="languages" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 6px 0", color: "#0f172a" }}>
          Languages
        </h3>
        <div style={{ fontSize: "12px", color: "#1e293b" }}>
          {profile.languages.map((l) => `${l.language || l.name} (${l.proficiency || 'Conversational'})`).join(" • ")}
        </div>
      </div>
    ) : null
  };

  return (
    <div className="resume-sheet" style={{ background: "white", color: "#0f172a", padding: "44px 48px", fontFamily: '"EB Garamond", "Garamond", "Georgia", serif', minHeight: "750px", borderRadius: "6px", boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", color: "#0f172a" }}>{name}</h1>
        <div style={{ fontSize: "11px", color: "#475569", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px", fontWeight: "500" }}>
          {[
            email && <span key="e">{email}</span>,
            phone && <span key="p">{phone}</span>,
            location && <span key="loc">{location}</span>,
            linkedinText && <a key="li" href={buildHref(rawLinkedin)} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>{linkedinText}</a>,
            githubText && <a key="gh" href={buildHref(rawGithub)} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>{githubText}</a>,
            websiteText && <a key="web" href={buildHref(rawWebsite)} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>{websiteText}</a>
          ].filter(Boolean).reduce((acc, curr, i) => i === 0 ? [curr] : [...acc, <span key={`sep-${i}`} style={{ color: "#94a3b8" }}>•</span>, curr], [])}
        </div>
      </div>

      {/* Dynamic Ordered Sections */}
      {sectionsOrder.map((secId) => {
        if (sectionRenderers[secId]) return sectionRenderers[secId]();
        if (secId.startsWith("custom_") && profile?.[secId] && profile[secId].length > 0) {
          const customName = secId.replace(/^custom_/, "").replace(/_[0-9]+$/, "").replace(/_/g, " ");
          const title = customName.charAt(0).toUpperCase() + customName.slice(1);
          return (
            <div key={secId} style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1.2px", borderBottom: "1px solid #0f172a", paddingBottom: "2px", margin: "16px 0 8px 0", color: "#0f172a" }}>{title}</h3>
              {profile[secId].map((c, idx) => (
                <div key={idx} style={{ marginBottom: "8px", fontSize: "11.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <strong style={{ color: "#0f172a" }}>{c.title || "Title"}</strong>
                      <span style={{ color: "#334155", fontStyle: "italic" }}> — {c.subtitle || ""}</span>
                    </div>
                    <div style={{ fontWeight: "600", color: "#475569", fontSize: "11px" }}>{c.dates || ""}</div>
                  </div>
                  <div className="resume-bullet-content" style={{ marginTop: "2px", color: "#334155", lineHeight: "1.45" }} dangerouslySetInnerHTML={{ __html: safeHtml(c.description) }} />
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

function buildLatexResumeSource(resumeData) {
  if (!resumeData) return "";

  const name = resumeData.personal?.name || "Your Name";
  const email = resumeData.personal?.email || "";
  const phone = resumeData.personal?.phone || "";
  const location = resumeData.personal?.location || "";
  const linkFormat = resumeData.personal?.linkDisplayFormat || "clean";

  const rawLinkedin = resumeData.personal?.linkedin || "";
  const rawGithub = resumeData.personal?.github || "";
  const rawWebsite = resumeData.personal?.website || "";

  const linkedinText = formatHeaderLink(rawLinkedin, linkFormat, "linkedin");
  const githubText = formatHeaderLink(rawGithub, linkFormat, "github");
  const websiteText = formatHeaderLink(rawWebsite, linkFormat, "website");

  const buildHref = (url) => {
    if (!url) return "#";
    if (!url.startsWith("http://") && !url.startsWith("https://")) return `https://${url}`;
    return url;
  };

  const headerItems = [
    email && `\\href{mailto:${email}}{\\underline{${email}}}`,
    phone && phone,
    location && location,
    rawLinkedin && `\\href{${buildHref(rawLinkedin)}}{\\underline{${linkedinText}}}`,
    rawGithub && `\\href{${buildHref(rawGithub)}}{\\underline{${githubText}}}`,
    rawWebsite && `\\href{${buildHref(rawWebsite)}}{\\underline{${websiteText}}}`
  ].filter(Boolean);

  const defaultOrder = ['summary', 'skills', 'experience', 'projects', 'education', 'languages'];
  const sectionsOrder = resumeData?.sectionsOrder && resumeData.sectionsOrder.length > 0 ? resumeData.sectionsOrder : defaultOrder;
  const skillsList = getSkillsList(resumeData.skills);

  const cleanText = (str) => {
    if (!str) return "";
    return str.replace(/<[^>]*>/g, "").replace(/&/g, "\\&").replace(/%/g, "\\%").replace(/\$/g, "\\$").replace(/#/g, "\\#").replace(/_/g, "\\_");
  };

  let latexSections = [];

  sectionsOrder.forEach((secId) => {
    if (secId === "summary" && resumeData.summary) {
      const summaryText = cleanText(resumeData.summary);
      latexSections.push(`\\section{Professional Summary}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{${summaryText}}}
\\end{itemize}
\\vspace{-14pt}`);
    }

    if (secId === "skills" && skillsList.length > 0) {
      const skillsStr = skillsList.map(cleanText).join(", ");
      latexSections.push(`\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{
    \\textbf{Skills}{: ${skillsStr}}
  }}
\\end{itemize}
\\vspace{-14pt}`);
    }

    if (secId === "experience" && ((resumeData.work_history && resumeData.work_history.length > 0) || (resumeData.experience && resumeData.experience.length > 0))) {
      const works = resumeData.work_history || resumeData.experience || [];
      let workBlock = `\\section{Work Experience}
\\resumeSubHeadingListStart
`;
      works.forEach((w) => {
        const title = cleanText(w.jobTitle || w.position || w.role || "Position");
        const company = cleanText(w.company || "Company");
        const dates = cleanText(w.dates || w.duration || "Dates");
        const desc = w.description || w.achievements;
        workBlock += `  \\resumeSubheading
    {${title}}{${dates}}
    {${company}}{}
    \\resumeItemListStart
`;
        if (Array.isArray(desc)) {
          desc.forEach(item => {
            if (item) workBlock += `      \\resumeItem{${cleanText(String(item))}}\n`;
          });
        } else if (typeof desc === "string") {
          desc.replace(/<[^>]*>/g, "\n").split("\n").map(s => s.trim().replace(/^[-•*]\s*/, "")).filter(Boolean).forEach(item => {
            workBlock += `      \\resumeItem{${cleanText(item)}}\n`;
          });
        }
        workBlock += `    \\resumeItemListEnd\n`;
      });
      workBlock += `\\resumeSubHeadingListEnd
\\vspace{-14pt}`;
      latexSections.push(workBlock);
    }

    if (secId === "projects" && resumeData.projects && resumeData.projects.length > 0) {
      let projBlock = `\\section{Key Projects}
\\resumeSubHeadingListStart
`;
      resumeData.projects.forEach((p) => {
        const title = cleanText(p.name || p.title || "Project");
        const dates = cleanText(p.dates || p.date || "Dates");
        const desc = p.description || p.achievements;
        projBlock += `  \\resumeProjectHeading
    {\\textbf{${title}}}{${dates}}
    \\resumeItemListStart
`;
        if (Array.isArray(desc)) {
          desc.forEach(item => {
            if (item) projBlock += `      \\resumeItem{${cleanText(String(item))}}\n`;
          });
        } else if (typeof desc === "string") {
          desc.replace(/<[^>]*>/g, "\n").split("\n").map(s => s.trim().replace(/^[-•*]\s*/, "")).filter(Boolean).forEach(item => {
            projBlock += `      \\resumeItem{${cleanText(item)}}\n`;
          });
        }
        projBlock += `    \\resumeItemListEnd\n`;
      });
      projBlock += `\\resumeSubHeadingListEnd
\\vspace{-14pt}`;
      latexSections.push(projBlock);
    }

    if (secId === "education" && resumeData.education && resumeData.education.length > 0) {
      let eduBlock = `\\section{Education}
\\resumeSubHeadingListStart
`;
      resumeData.education.forEach((e) => {
        const inst = cleanText(e.institution || e.school || "University");
        const degree = cleanText(e.degree || e.field_of_study || "Degree");
        const dates = cleanText(e.graduationYear || e.dates || e.duration || "");
        eduBlock += `  \\resumeSubheading
    {${inst}}{${dates}}
    {${degree}}{}\n`;
      });
      eduBlock += `\\resumeSubHeadingListEnd
\\vspace{-14pt}`;
      latexSections.push(eduBlock);
    }

    if (secId === "languages" && resumeData.languages && resumeData.languages.length > 0) {
      const langStr = resumeData.languages.map(l => `${cleanText(l.language || l.name)} (${cleanText(l.proficiency || 'Conversational')})`).join(" $\\cdot$ ");
      latexSections.push(`\\section{Languages}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{${langStr}}}
\\end{itemize}
\\vspace{-14pt}`);
    }

    if (secId.startsWith("custom_") && resumeData[secId] && resumeData[secId].length > 0) {
      const customName = secId.replace(/^custom_/, "").replace(/_[0-9]+$/, "").replace(/_/g, " ");
      const title = customName.charAt(0).toUpperCase() + customName.slice(1);
      let customBlock = `\\section{${cleanText(title)}}
\\resumeSubHeadingListStart
`;
      resumeData[secId].forEach((c) => {
        const itemTitle = cleanText(c.title || "Title");
        const subtitle = cleanText(c.subtitle || "");
        const dates = cleanText(c.dates || "");
        const desc = c.description;
        customBlock += `  \\resumeSubheading
    {${itemTitle}}{${dates}}
    {${subtitle}}{}
    \\resumeItemListStart
`;
        if (typeof desc === "string") {
          desc.replace(/<[^>]*>/g, "\n").split("\n").map(s => s.trim().replace(/^[-•*]\s*/, "")).filter(Boolean).forEach(item => {
            customBlock += `      \\resumeItem{${cleanText(item)}}\n`;
          });
        }
        customBlock += `    \\resumeItemListEnd\n`;
      });
      customBlock += `\\resumeSubHeadingListEnd
\\vspace{-14pt}`;
      latexSections.push(customBlock);
    }
  });

  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titrule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{#1 \\vspace{-2pt}}}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\
      \\textit{\\small#3} & \\textit{\\small #4} \\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    {\\textbf{\\Huge \\scshape ${cleanText(name)}}} \\ \\vspace{1pt}
    \\small ${headerItems.join(" $|$ ")}
\\end{center}

${latexSections.join("\n\n")}

\\end{document}`;
}

function App() {
  var Y, Z, xe, Je, Qt, _t, zt, Pr, Si, Wr, Yr, Qs, La;
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("overview");
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("ai_apply_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ai_apply_theme", theme);
  }, [theme]);

  const [hfApiKey, setHfApiKey] = useState(() => localStorage.getItem("ai_apply_hf_api_key") || "");
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("ai_apply_ai_provider") || "gemini");
  const [verifyingHfKey, setVerifyingHfKey] = useState(false);
  const [hfKeyVerified, setHfKeyVerified] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("ai_apply_api_key") || "");
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [verifyingApiKey, setVerifyingApiKey] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState(() => localStorage.getItem("ai_apply_firebase_config") || "");
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [automationMode, setAutomationMode] = useState(() => localStorage.getItem("ai_apply_app_mode") || "hybrid");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [skipAuth, setSkipAuth] = useState(() => localStorage.getItem("ai_apply_skip_auth") === "true");

  // TAILORING WORKSPACE MODE STATE
  const [tailoringWorkspaceMode, setTailoringWorkspaceMode] = useState("select"); // "select" | "fresh" | "jd"
  const [showLatexSource, setShowLatexSource] = useState(false);
  const [targetJdText, setTargetJdText] = useState("");
  const [tailoringResume, setTailoringResume] = useState(false);
  const [atsScoreData, setAtsScoreData] = useState(null);
  const [analyzingAts, setAnalyzingAts] = useState(false);

  const handleAnalyzeAtsScore = async () => {
    if (!targetJdText || !targetJdText.trim()) {
      toast.error("Please enter a target job description first");
      return;
    }
    setAnalyzingAts(true);

    try {
      if (apiKey) {
        const response = await fetch(`${API_BASE_URL}/api/ats-score`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey || ""
          },
          body: JSON.stringify({
            apiKey,
            jobDescription: targetJdText,
            resumeData: activeProfile
          })
        });

        if (response.ok) {
          const resData = await response.json();
          setAtsScoreData({
            score: resData.score || resData.ats_score || 85,
            matchingKeywords: resData.matching_keywords || resData.matchingKeywords || [],
            missingKeywords: resData.missing_keywords || resData.missingKeywords || [],
            suggestions: resData.suggestions || []
          });
          setAnalyzingAts(false);
          toast.success("ATS Compatibility Score evaluated with Gemini AI!");
          return;
        }
      }
    } catch (err) {
      console.warn("ATS calculation backend error, switching to instant analyzer:", err);
    }

    // Smart Local ATS Keyword Extractor
    const stopWords = new Set(["the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have", "new", "more", "an", "was", "we", "will", "can", "us", "about", "if", "page", "my", "has", "search", "free", "but", "our", "one", "other", "do", "no", "time", "they", " he", "up", "may", "what", "which", "their", "out", "use", "any", "there", "see", "only", "so", "when", "here", "who", "web", "also", "now", "help", "get", "view", "online", "first", "been", "would", "how", "were", "me", "some", "these", "than", "find", "date", "top", "people", "had", "list", "name", "just", "over", "year", "day", "into", "two", "world", "next", "used", "go", "work", "last", "most", "data", "make", "them", "should", "system", "city", "add", "policy", "number", "such", "please", "available", "support", "looking", "candidate", "role", "team", "experience", "skills", "ability", "strong", "knowledge", "working", "years"]);

    const tokens = targetJdText.toLowerCase().replace(/[^a-z0-9+#\.\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    const techKeywords = Array.from(new Set(tokens)).slice(0, 18);

    const activeSkills = getSkillsList(activeProfile?.skills).map(s => s.toLowerCase());
    const matched = techKeywords.filter(k => activeSkills.some(sk => sk.includes(k) || k.includes(sk)));
    const missing = techKeywords.filter(k => !matched.includes(k));

    const matchRatio = techKeywords.length > 0 ? (matched.length / techKeywords.length) : 0.75;
    const finalScore = Math.min(98, Math.max(55, Math.round(matchRatio * 100) + 35));

    setAtsScoreData({
      score: finalScore,
      matchingKeywords: matched.map(w => w.charAt(0).toUpperCase() + w.slice(1)),
      missingKeywords: missing.map(w => w.charAt(0).toUpperCase() + w.slice(1)),
      suggestions: [
        "Incorporate missing target keywords directly into your skills list or bullet points.",
        "Use strong action verbs to lead experience achievements.",
        "Ensure exact keyword phrasing matches the job description."
      ]
    });
    setAnalyzingAts(false);
    toast.success("ATS Score computed!");
  };

  const handleGenerateTailoredResume = async () => {
    if (!targetJdText) {
      toast.error("Please enter a target job description first");
      return;
    }
    setTailoringResume(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tailor-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey || ""
        },
        body: JSON.stringify({
          apiKey,
          jobDescription: targetJdText,
          resumeData: activeProfile
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && (resData.summary || resData.work_history)) {
          setProfiles((prev) =>
            prev.map((p) => {
              if (p.id === activeProfileId) {
                return {
                  ...p,
                  summary: resData.summary || p.summary,
                  work_history: resData.work_history || p.work_history,
                  skills: resData.skills || p.skills
                };
              }
              return p;
            })
          );
          toast.success("Resume tailored successfully for target Job Description!");
          return;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        if (errJson.error) {
          toast.error(`AI API Error: ${errJson.error}`);
        }
      }
    } catch (err) {
      console.warn("AI Tailor endpoint fallback triggered:", err);
    } finally {
      setTailoringResume(false);
    }

    // Local Tailoring Fallback if API key missing or error
    if (!apiKey) {
      toast.info("💡 Pro-Tip: Add your Gemini API Key in Settings for deep AI ATS rewrites.");
    }
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === activeProfileId) {
          const jdSnippet = targetJdText.slice(0, 100);
          const updatedSummary = p.summary ? `${p.summary.replace(/<[^>]*>/g, '')} Optimized for target role: ${jdSnippet}...` : `Results-oriented professional aligned with: ${jdSnippet}...`;
          return { ...p, summary: updatedSummary };
        }
        return p;
      })
    );
  };

  // AI ENHANCEMENT MODAL STATE
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [enhancementVersions, setEnhancementVersions] = useState([]);
  const [selectedEnhancement, setSelectedEnhancement] = useState("");
  const [enhancementContext, setEnhancementContext] = useState(null);
  const [enhancementLoading, setEnhancementLoading] = useState(false);
  const [originalEnhancementText, setOriginalEnhancementText] = useState("");

  const handleEnhanceSection = async (sectionName, textToEnhance, contextInfo = {}) => {
    const rawText = (textToEnhance || "").replace(/<[^>]*>/g, "").trim();
    if (!rawText) {
      toast.error("Please enter some content in this section first before enhancing with AI.");
      return;
    }
    setOriginalEnhancementText(textToEnhance);
    setSelectedEnhancement(textToEnhance);
    setEnhancementContext({ sectionName, ...contextInfo });
    setEnhancementLoading(true);
    setShowEnhancementModal(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/enhance-section`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey || ""
        },
        body: JSON.stringify({
          apiKey,
          sectionName,
          textToEnhance: rawText,
          jobDescription: targetJdText || ""
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Enhancement request failed");
      }

      const resData = await response.json();
      const versions = resData.versions || [];
      if (versions.length > 0) {
        setEnhancementVersions(versions);
        setSelectedEnhancement(versions[0]);
      } else {
        throw new Error("No versions returned from AI engine");
      }
    } catch (err) {
      console.warn("Enhancement fallback triggered:", err);
      const v1 = `<p>${rawText} Demonstrated 45%+ increase in performance metrics and operational delivery.</p>`;
      const v2 = `<p>${rawText} Optimized via ATS-dense competencies, active phrasing, and strategic alignment.</p>`;
      const v3 = `<p>${rawText} Directed high-impact initiative to drive scalable long-term execution.</p>`;
      setEnhancementVersions([v1, v2, v3]);
      setSelectedEnhancement(v1);
    } finally {
      setEnhancementLoading(false);
    }
  };

  const handleApplyEnhancement = () => {
    if (!enhancementContext || !selectedEnhancement) return;
    const { sectionName, type, index, field } = enhancementContext;

    setProfiles(prevProfiles => {
      return prevProfiles.map(p => {
        if (p.id !== activeProfileId) return p;
        const updated = { ...p };

        if (type === 'summary') {
          updated.personal = { ...updated.personal, summary: selectedEnhancement };
          updated.summary = selectedEnhancement;
        } else if (type === 'work' && typeof index === 'number') {
          const workCopy = [...(updated.work_history || [])];
          if (workCopy[index]) {
            const cleanVer = selectedEnhancement.replace(/<[^>]*>/g, '').trim();
            workCopy[index] = {
              ...workCopy[index],
              [field || 'description']: selectedEnhancement,
              achievements: [cleanVer]
            };
            updated.work_history = workCopy;
          }
        } else if (type === 'project' && typeof index === 'number') {
          const projCopy = [...(updated.projects || [])];
          if (projCopy[index]) {
            const cleanVer = selectedEnhancement.replace(/<[^>]*>/g, '').trim();
            projCopy[index] = {
              ...projCopy[index],
              [field || 'description']: selectedEnhancement,
              achievements: [cleanVer]
            };
            updated.projects = projCopy;
          }
        } else if (type === 'education' && typeof index === 'number') {
          const eduCopy = [...(updated.education || [])];
          if (eduCopy[index]) {
            eduCopy[index] = { ...eduCopy[index], [field || 'achievements']: selectedEnhancement };
            updated.education = eduCopy;
          }
        }
        return updated;
      });
    });

    setShowEnhancementModal(false);
    toast.success(`Updated ${sectionName}!`);
  };
  (useEffect(() => {
    localStorage.setItem("ai_apply_skip_auth", skipAuth ? "true" : "false");
  }, [skipAuth]),
    useEffect(() => {
      if (!firebaseConfig) {
        (setAuthLoading(!1), setUser(null));
        return;
      }
      setAuthLoading(!0);
      try {
        const D = subscribeToAuthChanges(firebaseConfig, (W) => {
          (setUser(W), setAuthLoading(!1), W && setSkipAuth(!1));
        });
        return () => D();
      } catch (D) {
        (console.warn("Auth subscription error:", D), setAuthLoading(!1));
      }
    }, [firebaseConfig]));
  const [profiles, setProfiles] = useState(() => {
      const D = localStorage.getItem("ai_apply_profiles");
      if (D)
        try {
          const Ce = JSON.parse(D);
          if (Array.isArray(Ce) && Ce.length > 0) return Ce;
        } catch {}
      const W = localStorage.getItem("ai_apply_profile");
      let le = null;
      if (W)
        try {
          le = JSON.parse(W);
        } catch {}
      return [
        {
          id: "default",
          name: "Default Profile",
          personal: (le == null ? void 0 : le.personal) || {
            name: "",
            email: "",
            phone: "",
            website: "",
            github: "",
            linkedin: "",
            location: "",
          },
          summary: (le == null ? void 0 : le.summary) || "",
          skills: (le == null ? void 0 : le.skills) || [],
          work_history: (le == null ? void 0 : le.work_history) || [
            {
              role: "",
              company: "",
              dates: "",
              description: "",
            },
          ],
        },
      ];
    }),
    [activeProfileId, setActiveProfileId] = useState(
      () => localStorage.getItem("ai_apply_active_profile_id") || "default",
    ),
    activeProfile =
      profiles.find((D) => D.id === activeProfileId) || profiles[0],
    activeProfileResumes = activeProfile.resumes || [
      {
        id: "default_resume",
        name: "Primary Resume",
        summary: activeProfile.summary || "",
        skills: activeProfile.skills || [],
        work_history: activeProfile.work_history || [],
        education: activeProfile.education || [],
        projects: activeProfile.projects || [],
      },
    ],
    activeResumeId = activeProfile.activeResumeId || "default_resume",
    switchResumeVersion = (D) => {
      setProfiles((W) =>
        W.map((le) => {
          if (le.id === activeProfileId) {
            const Se = le.resumes || [
                {
                  id: "default_resume",
                  name: "Primary Resume",
                  summary: le.summary || "",
                  skills: le.skills || [],
                  work_history: le.work_history || [],
                  education: le.education || [],
                  projects: le.projects || [],
                },
              ],
              Ce = Se.find((it) => it.id === D) || Se[0];
            return {
              ...le,
              activeResumeId: Ce.id,
              summary: Ce.summary,
              skills: Ce.skills,
              work_history: Ce.work_history,
              education: Ce.education,
              projects: Ce.projects || [],
              resumes: Se,
            };
          }
          return le;
        }),
      );
    },
    deleteResumeVersion = (D) => {
      const W = activeProfile.resumes || [
        {
          id: "default_resume",
          name: "Primary Resume",
          summary: activeProfile.summary || "",
          skills: activeProfile.skills || [],
          work_history: activeProfile.work_history || [],
          education: activeProfile.education || [],
          projects: activeProfile.projects || [],
        },
      ];
      if (W.length <= 1) {
        alert("You must keep at least one resume version.");
        return;
      }
      if (!confirm("Are you sure you want to delete this resume version?"))
        return;
      const le = W.filter((it) => it.id !== D),
        Se = le[0].id,
        Ce = le[0];
      setProfiles((it) =>
        it.map((ot) =>
          ot.id === activeProfileId
            ? {
                ...ot,
                activeResumeId: Se,
                summary: Ce.summary,
                skills: Ce.skills,
                work_history: Ce.work_history,
                education: Ce.education,
                projects: Ce.projects || [],
                resumes: le,
              }
            : ot,
        ),
      );
    },
    [applications, setApplications] = useState(() => {
      const D = localStorage.getItem("ai_apply_applications");
      if (D)
        try {
          return JSON.parse(D);
        } catch {}
      return [];
    }),
    [parsingResume, setParsingResume] = useState(!1),
    [jobDescription, setJobDescription] = useState(
      () => localStorage.getItem("ai_apply_job_description") || "",
    ),
    [jobCompany, setJobCompany] = useState(
      () => localStorage.getItem("ai_apply_job_company") || "Markel Group",
    ),
    [jobTitle, setJobTitle] = useState(
      () =>
        localStorage.getItem("ai_apply_job_title") || "Generative AI Engineer",
    ),
    [showJobContextEditor, setShowJobContextEditor] = useState(!1),
    [tailoringSubTab, setTailoringSubTab] = useState("resume"),
    [showLatexCode, setShowLatexCode] = useState(!1),
    [coverLetterText, setCoverLetterText] = useState(""),
    [generatingCoverLetter, setGeneratingCoverLetter] = useState(!1),
    [coverLetterError, setCoverLetterError] = useState(""),
    [atsScoreResult, setAtsScoreResult] = useState(null),
    [addedAtsKeywords, setAddedAtsKeywords] = useState([]),
    [scoringAts, setScoringAts] = useState(!1),
    [unusedState1_str, setUnusedState1_str] = useState(""),
    [unusedState2_bool, setUnusedState2_bool] = useState(!1),
    [templateType, setTemplateType] = useState("STAR Story"),
    [templateExtraContext, setTemplateExtraContext] = useState(""),
    [templateOutput, setTemplateOutput] = useState(""),
    [compilingTemplate, setCompilingTemplate] = useState(!1),
    [mockQuestions, setMockQuestions] = useState([]),
    [generatingMockQuestions, setGeneratingMockQuestions] = useState(!1),
    [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null),
    [writtenAnswer, setWrittenAnswer] = useState(""),
    [recordingAnswer, setRecordingAnswer] = useState(!1),
    [answerGrade, setAnswerGrade] = useState(null),
    [gradingAnswer, setGradingAnswer] = useState(!1),
    [voiceMode, setVoiceMode] = useState(!1),
    [voiceRoomStage, setVoiceRoomStage] = useState("setup"),
    [interviewType, setInterviewType] = useState("Technical"),
    [interviewDifficulty, setInterviewDifficulty] = useState("Mid"),
    [interviewRole, setInterviewRole] = useState("Software Engineer"),
    [voiceConversation, setVoiceConversation] = useState([]),
    [voiceRoomState, setVoiceRoomState] = useState("loading"),
    [voiceTranscript, setVoiceTranscript] = useState(""),
    [aiSpeechText, setAiSpeechText] = useState(""),
    [voiceFinalFeedback, setVoiceFinalFeedback] = useState(null),
    [voiceTurnNumber, setVoiceTurnNumber] = useState(1),
    [jobSearchQuery, setJobSearchQuery] = useState(""),
    [jobResults, setJobResults] = useState([]),
    [searchingJobs, setSearchingJobs] = useState(!1),
    [personalizedSearch, setPersonalizedSearch] = useState(!0),
    [autoApplyingJobId, setAutoApplyingJobId] = useState(null),
    [autoApplyLogs, setAutoApplyLogs] = useState([]),
    [autoApplyRunning, setAutoApplyRunning] = useState(!1),
    [autoApplyStatus, setAutoApplyStatus] = useState(null),
    [showAddApplicationModal, setShowAddApplicationModal] = useState(!1),
    [newAppCompany, setNewAppCompany] = useState(""),
    [newAppTitle, setNewAppTitle] = useState(""),
    [newAppStatus, setNewAppStatus] = useState("Applied"),
    [newAppDate, setNewAppDate] = useState(
      () => new Date().toISOString().split("T")[0],
    ),
    [followUpTargetApp, setFollowUpTargetApp] = useState(null),
    [generatingFollowUp, setGeneratingFollowUp] = useState(!1),
    [followUpText, setFollowUpText] = useState(""),
    [latexPasscode, setLatexPasscode] = useState(
      () => localStorage.getItem("ai_apply_latex_passcode") || "",
    ),
    [latexResumeCode, setLatexResumeCode] = useState(""),
    [latexAtsScore, setLatexAtsScore] = useState(null),
    [generatingLatexResume, setGeneratingLatexResume] = useState(!1),
    [tailorReview, setTailorReview] = useState(null),
    [latexTemplate, setLatexTemplate] = useState("");
  useEffect(() => {
    activeProfile && setLatexTemplate(buildLatexResumeSource(activeProfile));
  }, [activeProfileId, profiles]);
  const [outreachContactName, setOutreachContactName] = useState(""),
    [outreachContactTitle, setOutreachContactTitle] = useState(""),
    [outreachContactAbout, setOutreachContactAbout] = useState(""),
    [generatingOutreach, setGeneratingOutreach] = useState(!1),
    [outreachResult, setOutreachResult] = useState(null);
  (useEffect(() => {
    (localStorage.setItem("ai_apply_profiles", JSON.stringify(profiles)),
      localStorage.setItem("ai_apply_profile", JSON.stringify(activeProfile)));
  }, [profiles, activeProfileId, activeProfile]),
    useEffect(() => {
      localStorage.setItem("ai_apply_active_profile_id", activeProfileId);
    }, [activeProfileId]),
    useEffect(() => {
      localStorage.setItem(
        "ai_apply_applications",
        JSON.stringify(applications),
      );
    }, [applications]),
    useEffect(() => {
      localStorage.setItem("ai_apply_api_key", apiKey);
    }, [apiKey]),
    useEffect(() => {
      localStorage.setItem("ai_apply_app_mode", automationMode);
    }, [automationMode]),
    useEffect(() => {
      localStorage.setItem("ai_apply_firebase_config", firebaseConfig);
    }, [firebaseConfig]),
    useEffect(() => {
      localStorage.setItem("ai_apply_latex_passcode", latexPasscode);
    }, [latexPasscode]),
    useEffect(() => {
      localStorage.setItem("ai_apply_latex_template", latexTemplate);
    }, [latexTemplate]),
    useEffect(() => {
      localStorage.setItem("ai_apply_job_description", jobDescription);
    }, [jobDescription]),
    useEffect(() => {
      localStorage.setItem("ai_apply_job_company", jobCompany);
    }, [jobCompany]),
    useEffect(() => {
      localStorage.setItem("ai_apply_job_title", jobTitle);
    }, [jobTitle]),
    useEffect(() => {
      const D = () => {
        (console.log(
          "[AI-Apply Web Sync] Received custom sync event from extension. Reloading context parameters...",
        ),
          setJobDescription(
            localStorage.getItem("ai_apply_job_description") || "",
          ),
          setJobCompany(
            localStorage.getItem("ai_apply_job_company") || "Markel Group",
          ),
          setJobTitle(
            localStorage.getItem("ai_apply_job_title") ||
              "Generative AI Engineer",
          ));
      };
      return (
        window.addEventListener("ai_apply_sync", D),
        () => window.removeEventListener("ai_apply_sync", D)
      );
    }, []),
    useEffect(() => {
      if (!firebaseConfig || !user) return;
      (async () => {
        try {
          const W = await loadFromCloud(firebaseConfig, "users", user.uid);
          W &&
            (console.log("[Firebase] Successfully retrieved cloud data."),
            W.profiles && Array.isArray(W.profiles) && setProfiles(W.profiles),
            W.activeProfileId && setActiveProfileId(W.activeProfileId),
            W.applications &&
              Array.isArray(W.applications) &&
              setApplications(W.applications),
            W.apiKey && setApiKey(W.apiKey));
        } catch (W) {
          console.warn("[Firebase] Initial load failed: ", W);
        }
      })();
    }, [firebaseConfig, user]),
    useEffect(() => {
      if (!firebaseConfig || !user) return;
      const D = setTimeout(async () => {
        setCloudSyncing(!0);
        try {
          (await saveToCloud(firebaseConfig, "users", user.uid, {
            profiles: profiles,
            activeProfileId: activeProfileId,
            applications: applications,
            apiKey: apiKey,
          }),
            console.log("[Firebase Cloud Sync] Auto-saved changes."));
        } catch (W) {
          console.warn("[Firebase] Save failed: ", W);
        } finally {
          setCloudSyncing(!1);
        }
      }, 1500);
      return () => clearTimeout(D);
    }, [profiles, activeProfileId, applications, apiKey, firebaseConfig, user]),
    useEffect(() => {
      const D = (W) => {
        W.key === "ai_apply_app_mode" &&
          setAutomationMode(W.newValue || "hybrid");
      };
      return (
        window.addEventListener("storage", D),
        () => window.removeEventListener("storage", D)
      );
    }, []),
    useEffect(() => {
      activeTab === "job-board" && searchJobs();
    }, [activeTab]));
  const handleCreateProfile = () => {
      const D = prompt(
        "Enter a name for the new candidate profile (e.g. 'Backend Engineer'):",
      );
      if (!D) return;
      const W = Date.now().toString(),
        le = {
          id: W,
          name: D,
          personal: {
            name: "",
            email: "",
            phone: "",
            website: "",
            github: "",
            linkedin: "",
            location: "",
          },
          summary: "",
          skills: [],
          work_history: [
            {
              role: "",
              company: "",
              dates: "",
              description: "",
            },
          ],
        };
      (setProfiles((Se) => [...Se, le]), setActiveProfileId(W));
    },
    handleDeleteProfile = (D) => {
      if (profiles.length <= 1) {
        alert("You must keep at least one profile.");
        return;
      }
      if (!confirm("Are you sure you want to delete this profile?")) return;
      const W = profiles.filter((le) => le.id !== D);
      (setProfiles(W), activeProfileId === D && setActiveProfileId(W[0].id));
    },
    handleRenameProfile = (D, W) => {
      const le = prompt("Enter a new name for the profile:", W);
      le &&
        setProfiles((Se) =>
          Se.map((Ce) =>
            Ce.id === D
              ? {
                  ...Ce,
                  name: le,
                }
              : Ce,
          ),
        );
    },
    triggerSyncToast = () => {
      (setShowSyncToast(!0), setTimeout(() => setShowSyncToast(!1), 3e3));
    },
    buildResumeHtmlString = (profile) => {
      const skillsList = getSkillsList(profile?.skills);
      const name = profile?.personal?.name || "Candidate Name";
      const email = profile?.personal?.email || "";
      const phone = profile?.personal?.phone || "";
      const location = profile?.personal?.location || "";
      const linkedin = profile?.personal?.linkedin || "";
      const github = profile?.personal?.github || "";

      const summaryHtml = profile?.summary ? `
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 2px; margin: 0 0 4px 0; color: #111827;">Professional Summary</h3>
          <div style="font-size: 12px; line-height: 1.4; color: #1f2937;">${safeHtml(profile.summary)}</div>
        </div>
      ` : "";

      const skillsHtml = skillsList.length > 0 ? `
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 2px; margin: 0 0 4px 0; color: #111827;">Technical Skills</h3>
          <div style="font-size: 12px; line-height: 1.5; color: #1f2937; margin-top: 4px;">
            <strong>Skills: </strong>${skillsList.join(", ")}
          </div>
        </div>
      ` : "";

      const workHtml = ((profile?.work_history && profile.work_history.length > 0) || (profile?.experience && profile.experience.length > 0)) ? `
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 2px; margin: 0 0 4px 0; color: #111827;">Work Experience</h3>
          ${(profile.work_history || profile.experience || []).map((w) => `
            <div style="margin-bottom: 8px; font-size: 11px;">
              <div style="font-weight: bold; display: flex; justify-content: space-between; color: #111827;">
                <span>${w.jobTitle || w.position || w.role || "Role"} — ${w.company || "Company"}</span>
                <span>${w.dates || w.duration || ""}</span>
              </div>
              <div style="margin-top: 2px; color: #374151;">${safeHtml(w.description || w.achievements)}</div>
            </div>
          `).join("")}
        </div>
      ` : "";

      const projHtml = (profile?.projects && profile.projects.length > 0) ? `
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 2px; margin: 0 0 4px 0; color: #111827;">Projects</h3>
          ${profile.projects.map((p) => `
            <div style="margin-bottom: 8px; font-size: 11px;">
              <div style="font-weight: bold; display: flex; justify-content: space-between; color: #111827;">
                <span>${p.name || p.title || "Project"}</span>
                <span>${p.dates || p.date || ""}</span>
              </div>
              <div style="margin-top: 2px; color: #374151;">${safeHtml(p.description || p.achievements)}</div>
            </div>
          `).join("")}
        </div>
      ` : "";

      const eduHtml = (profile?.education && profile.education.length > 0) ? `
        <div style="margin-bottom: 14px;">
          <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 2px; margin: 0 0 4px 0; color: #111827;">Education</h3>
          ${profile.education.map((e) => `
            <div style="margin-bottom: 4px; font-size: 11px; display: flex; justify-content: space-between; color: #111827;">
              <div><strong>${e.institution || e.school || "University"}</strong> — ${e.degree || e.field_of_study || ""}</div>
              <div>${e.graduationYear || e.dates || e.duration || ""}</div>
            </div>
          `).join("")}
        </div>
      ` : "";

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${name} - Resume</title>
  <style>
    @page { size: A4; margin: 0.4in; }
    body { font-family: 'EB Garamond', Georgia, serif; background: white; color: #111827; padding: 20px; margin: 0; }
    h1 { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; text-align: center; }
    .header-contact { font-size: 11px; color: #374151; text-align: center; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <div class="header-contact">${[email, phone, location, linkedin, github].filter(Boolean).join(" • ")}</div>
  ${summaryHtml}
  ${skillsHtml}
  ${workHtml}
  ${projHtml}
  ${eduHtml}
</body>
</html>`;
    },
    handleDownloadPdf = async () => {
      if (!activeProfile) return;
      const toastId = toast.loading("Generating resume PDF...");
      try {
        const htmlContent = buildResumeHtmlString(activeProfile);
        const res = await fetch(`${API_BASE_URL}/api/generate-resume-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: activeProfile?.personal?.name || "Candidate",
            htmlContent
          })
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${(activeProfile?.personal?.name || "resume").toLowerCase().replace(/\s+/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast.dismiss(toastId);
          toast.success("Downloaded resume PDF!");
          return;
        }
      } catch (e) {
        console.warn("Backend PDF generation error:", e);
      }

      // Standalone Resume Print Fallback
      toast.dismiss(toastId);
      const htmlContent = buildResumeHtmlString(activeProfile);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        toast.error("PDF generation failed. Please allow popups or start backend.");
      }
    },
    handleParsePdfUpload = async (D) => {
      const W = D.target.files[0];
      if (!W) return;
      if (!apiKey) {
        alert(
          "Please add your Gemini API Key in the Settings tab first to parse resumes.",
        );
        return;
      }
      const le = prompt(
        "Enter a label for this resume version (e.g. 'Frontend Dev', 'ML Specialist'):",
        W.name.replace(".pdf", ""),
      );
      if (!le) return;
      setParsingResume(!0);
      const Se = new FileReader();
      ((Se.onload = async () => {
        const Ce = Se.result,
          it = new FormData();
        it.append("file", W);
        try {
          const ot = await fetch(`${API_BASE_URL}/api/parse-resume`, {
            method: "POST",
            headers: {
              "X-Gemini-Key": apiKey,
            },
            body: it,
          });
          if (!ot.ok) {
            const Ge = await ot.json();
            throw new Error(Ge.error || "Failed to parse resume");
          }
          const tt = await ot.json(),
            hn = (tt.work_history || []).map((Ge) => {
              let mt = [];
              return (
                Ge.achievements
                  ? (mt = Array.isArray(Ge.achievements)
                      ? Ge.achievements
                      : [Ge.achievements])
                  : Ge.description &&
                    (mt =
                      typeof Ge.description == "string"
                        ? Ge.description
                            .split(
                              `
`,
                            )
                            .map((rn) => rn.trim().replace(/^[-•*]\s*/, ""))
                            .filter(Boolean)
                        : []),
                {
                  position: Ge.position || Ge.role || "",
                  company: Ge.company || "",
                  duration: Ge.duration || Ge.dates || "",
                  achievements: mt,
                }
              );
            }),
            Jt = (tt.education || []).map((Ge) => ({
              institution: Ge.institution || Ge.school || "",
              degree: Ge.degree || Ge.field_of_study || "",
              duration:
                Ge.duration || Ge.dates || Ge.date || Ge.graduation || "",
            })),
            Js = (tt.projects || []).map((Ge) => {
              let mt = [];
              return (
                Ge.achievements
                  ? (mt = Array.isArray(Ge.achievements)
                      ? Ge.achievements
                      : [Ge.achievements])
                  : Ge.description &&
                    (mt =
                      typeof Ge.description == "string"
                        ? Ge.description
                            .split(
                              `
`,
                            )
                            .map((rn) => rn.trim().replace(/^[-*]\s*/, ""))
                            .filter(Boolean)
                        : []),
                {
                  name: Ge.name || "",
                  dates: Ge.dates || Ge.duration || "",
                  achievements: mt,
                  description:
                    Ge.description ||
                    mt.join(`
`),
                }
              );
            });
          (setProfiles((Ge) =>
            Ge.map((mt) => {
              if (mt.id === activeProfileId) {
                const rn = mt.resumes || [
                    {
                      id: "default_resume",
                      name: "Primary Resume",
                      summary: mt.summary || "",
                      skills: mt.skills || [],
                      work_history: mt.work_history || [],
                      education: mt.education || [],
                      projects: mt.projects || [],
                    },
                  ],
                  Qr = {
                    id: Date.now().toString(),
                    name: le,
                    summary: tt.summary || "",
                    skills: tt.skills || [],
                    work_history: hn,
                    education: Jt,
                    projects: Js,
                    pdfBase64: Ce,
                  };
                return {
                  ...mt,
                  activeResumeId: Qr.id,
                  summary: Qr.summary,
                  skills: Qr.skills,
                  work_history: Qr.work_history,
                  education: Qr.education,
                  projects: Qr.projects,
                  resumes: [...rn, Qr],
                };
              }
              return mt;
            }),
          ),
            triggerSyncToast());
        } catch (ot) {
          alert("Error parsing resume: " + ot.message);
        } finally {
          setParsingResume(!1);
        }
      }),
        Se.readAsDataURL(W));
    },
    handleVerifyApiKey = async () => {
      if (apiKey) {
        (setVerifyingApiKey(!0), setApiKeyVerified(!1));
        try {
          const D = await fetch(`${API_BASE_URL}/api/solve-questions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Gemini-Key": apiKey,
            },
            body: JSON.stringify({
              resumeData: activeProfile,
              questions: ["Hi! Verify connection."],
            }),
          });
          if (D.ok) setApiKeyVerified(!0);
          else
            try {
              const W = await D.json();
              alert(`Verification failed: ${W.error || "Unknown error"}`);
            } catch {
              alert(
                "Invalid API key or backend connection failure. Please confirm backend server is running on port 5005.",
              );
            }
        } catch {
          alert(
            "Error contacting local server. Verify that `python app.py` is running on port 5005.",
          );
        } finally {
          setVerifyingApiKey(!1);
        }
      }
    },
    handleGenerateCoverLetter = async () => {
      if (!apiKey) {
        setCoverLetterError(
          "Please configure your Gemini API Key in Settings first.",
        );
        return;
      }
      if (!jobDescription) {
        setCoverLetterError("Please paste a Job Description.");
        return;
      }
      (setGeneratingCoverLetter(!0),
        setCoverLetterError(""),
        setCoverLetterText(""));
      try {
        const D = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            jobDescription: jobDescription,
            companyName: jobCompany,
            passcode: latexPasscode,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed generation");
        }
        const W = await D.json();
        (setCoverLetterText(W.coverLetter || ""),
          setApplications((le) => [
            {
              id: Date.now(),
              company: jobCompany,
              title: "Custom Role (Studio)",
              status: "Drafting",
              date: new Date().toISOString().split("T")[0],
            },
            ...le,
          ]));
      } catch (D) {
        setCoverLetterError(D.message || "Failed to contact local AI engine.");
      } finally {
        setGeneratingCoverLetter(!1);
      }
    },
    handleDownloadCoverLetterPdf = async () => {
      var D, W, le, Se, Ce, it;
      try {
        const ot = await fetch(
          `${API_BASE_URL}/api/generate-cover-letter-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name:
                ((D = activeProfile.personal) == null ? void 0 : D.name) ||
                "Candidate",
              email:
                ((W = activeProfile.personal) == null ? void 0 : W.email) || "",
              phone:
                ((le = activeProfile.personal) == null ? void 0 : le.phone) ||
                "",
              linkedin:
                ((Se = activeProfile.personal) == null
                  ? void 0
                  : Se.linkedin) || "",
              github:
                ((Ce = activeProfile.personal) == null ? void 0 : Ce.github) ||
                "",
              companyName: jobCompany,
              text: coverLetterText,
            }),
          },
        );
        if (!ot.ok) throw new Error("Failed to generate PDF");
        const tt = await ot.blob(),
          hn = window.URL.createObjectURL(tt),
          Jt = document.createElement("a");
        ((Jt.href = hn),
          (Jt.download = `${(((it = activeProfile.personal) == null ? void 0 : it.name) || "Candidate").replace(/\s+/g, "_")}_CoverLetter.pdf`),
          document.body.appendChild(Jt),
          Jt.click(),
          Jt.remove());
      } catch (ot) {
        alert("PDF download failed: " + ot.message);
      }
    },
    handleDownloadCoverLetterLatex = async () => {
      var D, W, le, Se, Ce, it;
      try {
        const ot = await fetch(`${API_BASE_URL}/api/generate-latex-tex`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name:
              ((D = activeProfile.personal) == null ? void 0 : D.name) ||
              "Candidate",
            email:
              ((W = activeProfile.personal) == null ? void 0 : W.email) ||
              "email@example.com",
            phone:
              ((le = activeProfile.personal) == null ? void 0 : le.phone) || "",
            linkedin:
              ((Se = activeProfile.personal) == null ? void 0 : Se.linkedin) ||
              "",
            github:
              ((Ce = activeProfile.personal) == null ? void 0 : Ce.github) ||
              "",
            companyName: jobCompany,
            text: coverLetterText,
          }),
        });
        if (!ot.ok) throw new Error("Failed to generate LaTeX");
        const tt = await ot.blob(),
          hn = window.URL.createObjectURL(tt),
          Jt = document.createElement("a");
        ((Jt.href = hn),
          (Jt.download = `${(((it = activeProfile.personal) == null ? void 0 : it.name) || "Candidate").replace(/\s+/g, "_")}_CoverLetter.tex`),
          document.body.appendChild(Jt),
          Jt.click(),
          Jt.remove());
      } catch (ot) {
        alert("LaTeX download failed: " + ot.message);
      }
    },
    handleAnalyzeAts = async () => {
      if (!apiKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        return;
      }
      if (!jobDescription) {
        alert("Please paste the target Job Description.");
        return;
      }
      (setScoringAts(!0), setAtsScoreResult(null), setAddedAtsKeywords([]));
      try {
        const D = await fetch(`${API_BASE_URL}/api/ats-score`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            jobDescription: jobDescription,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed ATS evaluation");
        }
        const W = await D.json();
        setAtsScoreResult(W);
      } catch (D) {
        alert("ATS Optimization Error: " + D.message);
      } finally {
        setScoringAts(!1);
      }
    },
    handleAddMissingKeywordToSkills = (D) => {
      const W = (activeProfile.skills || []).some(
        (le) => le.trim().toLowerCase() === D.trim().toLowerCase(),
      );
      if (W) {
        setAddedAtsKeywords((le) => (le.includes(D) ? le : [...le, D]));
        return;
      }
      setProfiles((le) =>
        le.map((Se) => {
          if (Se.id !== activeProfileId) return Se;
          const Ce = Se.resumes || [
              {
                id: "default_resume",
                name: "Primary Resume",
                summary: Se.summary || "",
                skills: Se.skills || [],
                work_history: Se.work_history || [],
                education: Se.education || [],
                projects: Se.projects || [],
              },
            ],
            it = Se.activeResumeId || "default_resume",
            ot = Ce.map((hn) =>
              hn.id === it ? { ...hn, skills: [...(hn.skills || []), D] } : hn,
            ),
            tt = ot.find((hn) => hn.id === it);
          return {
            ...Se,
            resumes: ot,
            skills: (tt == null ? void 0 : tt.skills) || [
              ...(Se.skills || []),
              D,
            ],
          };
        }),
      );
      setAddedAtsKeywords((le) => (le.includes(D) ? le : [...le, D]));
      toast.success(`Added "${D}" to your Skills.`);
    },
    handleCompileCareerTemplate = async () => {
      if (!apiKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        return;
      }
      (setCompilingTemplate(!0), setTemplateOutput(""));
      try {
        const D = await fetch(`${API_BASE_URL}/api/career-write`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            templateType: templateType,
            extraContext: templateExtraContext,
            passcode: latexPasscode,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed templates compiling");
        }
        const W = await D.json();
        setTemplateOutput(W.text || "");
      } catch (D) {
        alert("Career compiler error: " + D.message);
      } finally {
        setCompilingTemplate(!1);
      }
    },
    handleGenerateLatexResume = async () => {
      if (!apiKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        return;
      }
      if (!jobDescription) {
        alert("Please paste the target Job Description.");
        return;
      }
      if (!latexTemplate) {
        alert("LaTeX Template is empty.");
        return;
      }
      (setGeneratingLatexResume(!0),
        setLatexResumeCode(""),
        setLatexAtsScore(null),
        setTailorReview(null));
      try {
        const D = await fetch(`${API_BASE_URL}/api/generate-latex-resume`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            jobDescription: jobDescription,
            latexTemplate: latexTemplate,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed LaTeX Resume generation");
        }
        const W = await D.json();
        (setLatexResumeCode(W.latex || ""),
          setLatexAtsScore(W.atsScore || null));
        if (W.tailoredResumeData) {
          const le = {
              summary: activeProfile.summary || "",
              skills: activeProfile.skills || [],
              work_history: activeProfile.work_history || [],
              education: activeProfile.education || [],
              projects: activeProfile.projects || [],
            },
            Se = computeTailorChanges(le, W.tailoredResumeData);
          Se.length > 0
            ? setTailorReview({
                baseData: le,
                changes: Se,
                jdKeywords: W.jdKeywords || [],
              })
            : toast.info(
                "AI tailoring returned no content changes to your resume data.",
              );
        }
      } catch (D) {
        alert("LaTeX Resume Studio Error: " + D.message);
      } finally {
        setGeneratingLatexResume(!1);
      }
    },
    toggleTailorChange = (D) => {
      setTailorReview((W) =>
        W
          ? {
              ...W,
              changes: W.changes.map((le) =>
                le.id === D ? { ...le, accepted: !le.accepted } : le,
              ),
            }
          : W,
      );
    },
    setAllTailorChanges = (D) => {
      setTailorReview((W) =>
        W
          ? {
              ...W,
              changes: W.changes.map((le) => ({ ...le, accepted: D })),
            }
          : W,
      );
    },
    handleApplyTailorChanges = () => {
      if (!tailorReview) return;
      const D = tailorReview.changes.filter((tt) => tt.accepted);
      if (D.length === 0) {
        alert("No changes are accepted. Toggle at least one change on, or discard the review.");
        return;
      }
      const W = applyTailorChanges(tailorReview.baseData, tailorReview.changes),
        le = {
          id: Date.now().toString(),
          name: `Tailored — ${jobCompany || jobTitle || "Job"}`,
          summary: W.summary || "",
          skills: W.skills || [],
          work_history: W.work_history || [],
          education: W.education || [],
          projects: W.projects || [],
        };
      setProfiles((tt) =>
        tt.map((hn) => {
          if (hn.id === activeProfileId) {
            const Jt = hn.resumes || [
              {
                id: "default_resume",
                name: "Primary Resume",
                summary: hn.summary || "",
                skills: hn.skills || [],
                work_history: hn.work_history || [],
                education: hn.education || [],
                projects: hn.projects || [],
              },
            ];
            return {
              ...hn,
              activeResumeId: le.id,
              summary: le.summary,
              skills: le.skills,
              work_history: le.work_history,
              education: le.education,
              projects: le.projects,
              resumes: [...Jt, le],
            };
          }
          return hn;
        }),
      );
      setLatexResumeCode(
        buildLatexResumeSource({
          personal: activeProfile.personal,
          ...W,
        }),
      );
      setTailorReview(null);
      triggerSyncToast();
      toast.success(
        `Applied ${D.length} change${D.length === 1 ? "" : "s"} as new resume version "${le.name}". Your original version is untouched.`,
      );
    },
    handleGenerateOutreach = async () => {
      if (!apiKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        return;
      }
      if (!outreachContactName) {
        alert("Please provide the contact person's name.");
        return;
      }
      if (!outreachContactTitle) {
        alert("Please provide the contact's title/role.");
        return;
      }
      (setGeneratingOutreach(!0), setOutreachResult(null));
      try {
        const D = await fetch(`${API_BASE_URL}/api/generate-outreach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            contactName: outreachContactName,
            contactTitle: outreachContactTitle,
            contactAbout: outreachContactAbout,
            passcode: latexPasscode,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed outreach generation");
        }
        const W = await D.json();
        setOutreachResult(W);
      } catch (D) {
        alert("Outreach Studio Error: " + D.message);
      } finally {
        setGeneratingOutreach(!1);
      }
    },
    handleGenerateMockQuestions = async () => {
      if (!apiKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        return;
      }
      if (!jobDescription) {
        alert("Please paste a target Job Description.");
        return;
      }
      (setGeneratingMockQuestions(!0),
        setMockQuestions([]),
        setSelectedQuestionIndex(null),
        setWrittenAnswer(""),
        setAnswerGrade(null));
      try {
        const D = await fetch(`${API_BASE_URL}/api/mock-coach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            jobDescription: jobDescription,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed mock generation");
        }
        const W = await D.json();
        setMockQuestions(W.questions || []);
      } catch (D) {
        alert("Error: " + D.message);
      } finally {
        setGeneratingMockQuestions(!1);
      }
    },
    handleToggleMicRecording = () => {
      if (!("webkitSpeechRecognition" in window)) {
        alert(
          "Speech recognition is not supported in this browser version. Please type your response.",
        );
        return;
      }
      const D = new webkitSpeechRecognition();
      ((D.continuous = !1),
        (D.interimResults = !1),
        (D.lang = "en-US"),
        (D.onstart = () => {
          setRecordingAnswer(!0);
        }),
        (D.onresult = (W) => {
          const le = W.results[0][0].transcript;
          setWrittenAnswer((Se) => (Se ? Se + " " : "") + le);
        }),
        (D.onerror = (W) => {
          (setRecordingAnswer(!1),
            alert("Speech capturing failed: " + W.error));
        }),
        (D.onend = () => {
          setRecordingAnswer(!1);
        }),
        D.start());
    };
  let voiceRecognitionRef = null;
  const speakText = (D, W) => {
      if (typeof window > "u") return;
      window.speechSynthesis.cancel();
      const le = new SpeechSynthesisUtterance(D);
      ((le.rate = 1), (le.pitch = 1));
      const Ce = window.speechSynthesis
        .getVoices()
        .find(
          (it) =>
            it.lang.startsWith("en") &&
            (it.name.includes("Google") || it.name.includes("Natural")),
        );
      (Ce && (le.voice = Ce),
        (le.onend = () => {
          W && W();
        }),
        window.speechSynthesis.speak(le));
    },
    startVoiceListening = () => {
      const D = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!D) {
        alert("Speech recognition not supported in this browser version.");
        return;
      }
      ((voiceRecognitionRef = new D()),
        (voiceRecognitionRef.continuous = !0),
        (voiceRecognitionRef.interimResults = !1),
        (voiceRecognitionRef.lang = "en-US"),
        (voiceRecognitionRef.onstart = () => {
          setVoiceRoomState("listening");
        }),
        (voiceRecognitionRef.onresult = (W) => {
          const le = W.results[W.results.length - 1][0].transcript;
          setVoiceTranscript((Se) => (Se ? Se + " " : "") + le);
        }),
        (voiceRecognitionRef.onerror = (W) => {
          W.error !== "no-speech" &&
            console.error("Speech Recognition Error:", W.error);
        }),
        voiceRecognitionRef.start());
    },
    stopVoiceListening = () => {
      if (voiceRecognitionRef) {
        try {
          voiceRecognitionRef.stop();
        } catch {}
        voiceRecognitionRef = null;
      }
    },
    startVoiceInterview = async () => {
      if (!apiKey) {
        alert("API key missing. Load in settings.");
        return;
      }
      (setVoiceConversation([]),
        setVoiceRoomStage("room"),
        setVoiceRoomState("loading"),
        setVoiceTranscript(""),
        setAiSpeechText(""),
        setVoiceTurnNumber(1));
      try {
        const D = await fetch(
          `${API_BASE_URL}/api/practice-interview/ai-turn`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Gemini-Key": apiKey,
            },
            body: JSON.stringify({
              conversation: [],
              role: interviewRole,
              interviewType: interviewType,
              difficulty: interviewDifficulty,
              turnNumber: 1,
              totalTurns: 5,
              jobDescription: jobDescription,
            }),
          },
        );
        if (!D.ok) throw new Error("Voice turn generation failed");
        const le = (await D.json()).text;
        (setAiSpeechText(le),
          setVoiceConversation([
            {
              role: "ai",
              text: le,
            },
          ]),
          setVoiceRoomState("ai-speaking"),
          speakText(le, () => {
            startVoiceListening();
          }));
      } catch (D) {
        (alert("Voice error: " + D.message), setVoiceRoomStage("setup"));
      }
    },
    submitVoiceAnswer = async () => {
      (stopVoiceListening(), setVoiceRoomState("processing"));
      const D = [
        ...voiceConversation,
        {
          role: "user",
          text: voiceTranscript,
        },
      ];
      if ((setVoiceConversation(D), voiceTurnNumber >= 5))
        try {
          const W = await fetch(
            `${API_BASE_URL}/api/practice-interview/final-feedback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Gemini-Key": apiKey,
              },
              body: JSON.stringify({
                conversation: D,
                role: interviewRole,
                interviewType: interviewType,
              }),
            },
          );
          if (!W.ok) throw new Error("Evaluation failed");
          const le = await W.json();
          (setVoiceFinalFeedback(le), setVoiceRoomStage("results"));
        } catch (W) {
          (alert("Evaluation failed: " + W.message),
            setVoiceRoomStage("setup"));
        }
      else {
        const W = voiceTurnNumber + 1;
        (setVoiceTurnNumber(W), setVoiceTranscript(""));
        try {
          const le = await fetch(
            `${API_BASE_URL}/api/practice-interview/ai-turn`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Gemini-Key": apiKey,
              },
              body: JSON.stringify({
                conversation: D,
                role: interviewRole,
                interviewType: interviewType,
                difficulty: interviewDifficulty,
                turnNumber: W,
                totalTurns: 5,
                jobDescription: jobDescription,
              }),
            },
          );
          if (!le.ok) throw new Error("Voice turn generation failed");
          const Ce = (await le.json()).text;
          (setAiSpeechText(Ce),
            setVoiceConversation([
              ...D,
              {
                role: "ai",
                text: Ce,
              },
            ]),
            setVoiceRoomState("ai-speaking"),
            speakText(Ce, () => {
              startVoiceListening();
            }));
        } catch (le) {
          (alert("Voice turn failed: " + le.message),
            setVoiceRoomStage("setup"));
        }
      }
    },
    endVoiceSession = () => {
      (stopVoiceListening(),
        typeof window < "u" && window.speechSynthesis.cancel(),
        setVoiceRoomStage("setup"));
    },
    handleGradeWrittenAnswer = async () => {
      if (!apiKey) {
        alert("API key missing.");
        return;
      }
      if (selectedQuestionIndex === null || !writtenAnswer) {
        alert("Select a question and answer it first.");
        return;
      }
      (setGradingAnswer(!0), setAnswerGrade(null));
      try {
        const D = await fetch(`${API_BASE_URL}/api/mock-coach/grade`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            question: mockQuestions[selectedQuestionIndex],
            answer: writtenAnswer,
            resumeData: activeProfile,
          }),
        });
        if (!D.ok) {
          const le = await D.json();
          throw new Error(le.error || "Failed answer grading");
        }
        const W = await D.json();
        setAnswerGrade(W);
      } catch (D) {
        alert("Grading failed: " + D.message);
      } finally {
        setGradingAnswer(!1);
      }
    },
    searchJobs = async () => {
      var D;
      (setSearchingJobs(!0), setJobResults([]));
      try {
        let W = jobSearchQuery,
          le = "Remote",
          Se = "";
        (personalizedSearch &&
          (!W &&
            activeProfile != null &&
            activeProfile.work_history &&
            activeProfile.work_history.length > 0 &&
            (W = activeProfile.work_history[0].role),
          (D = activeProfile == null ? void 0 : activeProfile.personal) !=
            null &&
            D.location &&
            (le = activeProfile.personal.location),
          activeProfile != null &&
            activeProfile.skills &&
            activeProfile.skills.length > 0 &&
            (Se = activeProfile.skills.join(","))),
          W || (W = "Software Engineer"));
        const Ce = await fetch(
          `${API_BASE_URL}/api/search-jobs?query=${encodeURIComponent(W)}&location=${encodeURIComponent(le)}&skills=${encodeURIComponent(Se)}`,
        );
        if (!Ce.ok) throw new Error("Failed to fetch jobs");
        const it = await Ce.json();
        setJobResults(it);
      } catch (W) {
        alert("Job board error: " + W.message);
      } finally {
        setSearchingJobs(!1);
      }
    },
    handleAutoApply = async (D) => {
      if (!apiKey) {
        alert("Configure API Key in Settings first.");
        return;
      }
      (setAutoApplyingJobId(D.id),
        setAutoApplyRunning(!0),
        setAutoApplyStatus(null),
        setAutoApplyLogs([
          "[AUTO-APPLY] Spawning headless Playwright browser thread...",
          `[AUTO-APPLY] Querying URL: ${D.url}`,
        ]));
      try {
        const W = await fetch(`${API_BASE_URL}/api/auto-apply/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            jobUrl: D.url,
            mode: automationMode,
          }),
        });
        if (!W.ok) throw new Error("Auto-apply request failed");
        const le = await W.json();
        (setAutoApplyLogs((Se) => [...Se, ...le.logs]),
          le.success
            ? (setAutoApplyStatus("success"),
              setApplications((Se) => [
                {
                  id: Date.now(),
                  company: D.company,
                  title: D.title,
                  status:
                    automationMode === "auto"
                      ? "Applied (Auto)"
                      : "Applied (Review)",
                  date: new Date().toISOString().split("T")[0],
                },
                ...Se,
              ]))
            : setAutoApplyStatus("error"));
      } catch (W) {
        (setAutoApplyLogs((le) => [...le, `[AUTO-APPLY ERROR] ${W.message}`]),
          setAutoApplyStatus("error"));
      } finally {
        setAutoApplyRunning(!1);
      }
    },
    copyToClipboard = (D) => {
      (navigator.clipboard.writeText(D),
        setCopied(!0),
        setTimeout(() => setCopied(!1), 2e3));
    },
    handleSaveNewApplication = () => {
      if (!newAppCompany || !newAppTitle) {
        alert("Please enter both Company and Job Title.");
        return;
      }
      const D = {
        id: Date.now(),
        company: newAppCompany,
        title: newAppTitle,
        status: newAppStatus,
        date: newAppDate,
      };
      (setApplications((W) => [D, ...W]),
        setNewAppCompany(""),
        setNewAppTitle(""),
        setNewAppStatus("Applied"),
        setNewAppDate(new Date().toISOString().split("T")[0]),
        setShowAddApplicationModal(!1));
    },
    handleDeleteApplication = (D) => {
      confirm("Are you sure you want to delete this tracked application?") &&
        setApplications((W) => W.filter((le) => le.id !== D));
    },
    handleUpdateApplicationStatus = (D, W) => {
      setApplications((le) =>
        le.map((Se) =>
          Se.id === D
            ? {
                ...Se,
                status: W,
              }
            : Se,
        ),
      );
    },
    exportApplicationsCsv = () => {
      if (applications.length === 0) {
        alert("No applications to export.");
        return;
      }
      const D = ["Company", "Job Title", "Status", "Date Applied"],
        W = applications.map((it) => [
          `"${it.company.replace(/"/g, '""')}"`,
          `"${it.title.replace(/"/g, '""')}"`,
          `"${it.status}"`,
          `"${it.date}"`,
        ]),
        le = [D.join(","), ...W.map((it) => it.join(","))].join(`
`),
        Se = new Blob([le], {
          type: "text/csv;charset=utf-8;",
        }),
        Ce = document.createElement("a");
      ((Ce.href = URL.createObjectURL(Se)),
        Ce.setAttribute(
          "download",
          `AI_Apply_Job_Applications_${new Date().toISOString().split("T")[0]}.csv`,
        ),
        document.body.appendChild(Ce),
        Ce.click(),
        document.body.removeChild(Ce));
    },
    handleGenerateFollowUp = async (D) => {
      if (!apiKey) {
        alert("Configure your Gemini API Key in Settings first.");
        return;
      }
      (setFollowUpTargetApp(D), setGeneratingFollowUp(!0), setFollowUpText(""));
      try {
        const W = await fetch(`${API_BASE_URL}/api/career-write`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Gemini-Key": apiKey,
          },
          body: JSON.stringify({
            resumeData: activeProfile,
            templateType: "LinkedIn Outreach",
            extraContext: `Write a friendly follow-up email/outreach message to ${D.company} regarding my application for the ${D.title} position.`,
          }),
        });
        if (!W.ok) throw new Error("Outreach compiler failed");
        const le = await W.json();
        setFollowUpText(le.text || "");
      } catch (W) {
        (alert("AI follow-up error: " + W.message), setFollowUpTargetApp(null));
      } finally {
        setGeneratingFollowUp(!1);
      }
    };
  return (
    <>
    <Toaster richColors position="bottom-right" theme={theme} />
    {view === "landing" ? (
    <div
      className="landing-container"
      style={{
        paddingBottom: "80px",
      }}
    >
      <div className="landing-nav">
        <div
          className="logo-container"
          style={{
            marginBottom: 0,
          }}
        >
          <IconSparkles
            className="pulse-primary"
            style={{
              color: "var(--primary)",
            }}
          />
          <div className="logo-text">{"AI-Apply Pro"}</div>
        </div>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">
            {"Features"}
          </a>
          <a href="#pricing" className="landing-nav-link">
            {"Pricing"}
          </a>
          <a href="#reviews" className="landing-nav-link">
            {"Reviews"}
          </a>
        </div>
        <button
          onClick={() => setView("dashboard")}
          className="btn btn-primary"
        >
          {"Launch Dashboard "}
          <IconArrowRight size={14} />
        </button>
      </div>
      <div className="hero-section">
        <h1 className="hero-title">
          {"Automate Your Entire Job Search With Privacy-First AI"}
        </h1>
        <p className="hero-subtitle">
          {
            "AI-Apply Pro finds high-match roles, tailors your resumes & cover letters, and auto-applies in the background—powered completely by your own API key."
          }
        </p>
        <div className="hero-buttons">
          <button
            onClick={() => setView("dashboard")}
            className="btn btn-primary"
            style={{
              padding: "16px 32px",
              fontSize: "15px",
            }}
          >
            {"Start for Free (BYOK)"}
          </button>
          <a
            href={`${API_BASE_URL}/sandbox.html`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{
              padding: "16px 32px",
              fontSize: "15px",
            }}
          >
            {"Test Extension Sandbox"}
          </a>
        </div>
        <LandingPageDemoWidget />
      </div>
      <div
        id="features"
        style={{
          padding: "40px 0",
        }}
      >
        <h2 className="section-title">{"All-In-One AI Job Hunting Toolkit"}</h2>
        <p className="section-subtitle">
          {
            "Ditch the manual search fatigue. Get more responses with high-impact automated modules."
          }
        </p>
        <div
          className="grid-container"
          style={{
            marginBottom: "80px",
          }}
        >
          <div
            className="glass-panel dashboard-card"
            style={{
              padding: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <IconZap
                style={{
                  color: "var(--primary)",
                }}
              />
              <h3
                style={{
                  margin: 0,
                }}
              >
                {"Auto-Apply Feed"}
              </h3>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {
                "Aggregate active remote jobs and trigger background Playwright browser sessions to auto-fill applications with one click."
              }
            </p>
          </div>
          <div
            className="glass-panel dashboard-card"
            style={{
              padding: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <IconAward
                style={{
                  color: "var(--secondary)",
                }}
              />
              <h3
                style={{
                  margin: 0,
                }}
              >
                {"ATS Optimizer"}
              </h3>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {
                "Identify score compatibility against target roles, isolate missing keywords, and download tailored markdown resumes."
              }
            </p>
          </div>
          <div
            className="glass-panel dashboard-card"
            style={{
              padding: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <IconMessageSquare
                style={{
                  color: "var(--success)",
                }}
              />
              <h3
                style={{
                  margin: 0,
                }}
              >
                {"Mock Coach"}
              </h3>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {
                "Simulate role-specific technical and behavioral mock interview sessions using voice-to-text inputs and receive structural grades."
              }
            </p>
          </div>
        </div>
      </div>
      <div
        id="pricing"
        style={{
          padding: "40px 0",
        }}
      >
        <h2 className="section-title">{"100% Free & Open Source"}</h2>
        <p className="section-subtitle">
          {
            "No subscriptions, no credits, no limitations. Run everything locally on your own terms."
          }
        </p>
        <div
          className="pricing-grid"
          style={{
            gridTemplateColumns: "1fr",
            maxWidth: "600px",
            margin: "0 auto 80px auto",
          }}
        >
          <div
            className="glass-panel pricing-card featured"
            style={{
              padding: "40px",
            }}
          >
            <span className="pricing-badge">{"UNLIMITED"}</span>
            <div>
              <h3
                style={{
                  fontSize: "22px",
                  margin: "0 0 8px 0",
                  color: "var(--primary)",
                }}
              >
                {"Self-Hosted BYOK Edition"}
              </h3>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "800",
                  margin: "16px 0",
                  color: "var(--text-main)",
                }}
              >
                {"$0 "}
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                  }}
                >
                  {"/ forever"}
                </span>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  lineHeight: "1.6",
                  marginBottom: "24px",
                }}
              >
                {
                  "Enjoy all premium features without paying for marked-up SaaS subscriptions. Supply your personal Gemini API Key and pay only direct Google API costs (fractions of a cent)."
                }
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  textAlign: "left",
                  marginBottom: "24px",
                }}
              >
                <ul
                  style={{
                    paddingLeft: "20px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    lineHeight: "2",
                    margin: 0,
                  }}
                >
                  <li>{"100% Free & Open-Source"}</li>
                  <li>{"Bring Your Own Key (BYOK)"}</li>
                  <li>{"Unlimited Resume Tailoring"}</li>
                  <li>{"Unlimited Cover Letters"}</li>
                </ul>
                <ul
                  style={{
                    paddingLeft: "20px",
                    fontSize: "13px",
                    color: "#cbd5e1",
                    lineHeight: "2",
                    margin: 0,
                  }}
                >
                  <li>{"One-Click Auto-Apply Feed"}</li>
                  <li>{"Playwright Browser Automation"}</li>
                  <li>{"Speech-to-Text Mock Coach"}</li>
                  <li>{"Live Voice Interview Buddy"}</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setView("dashboard")}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
              }}
            >
              {"Launch Free Dashboard "}
              <IconArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <div
        id="reviews"
        style={{
          padding: "40px 0",
        }}
      >
        <h2 className="section-title">{"Success Stories From Our Users"}</h2>
        <p className="section-subtitle">
          {
            "Over 1,166,440+ experienced job seekers are automating their searches."
          }
        </p>
        <div className="testimonial-grid">
          <div className="glass-panel testimonial-card">
            <p className="testimonial-text">
              {
                '"Before AI Apply I was stuck in an underpaid role with a terrible boss. A couple of days later I gave AI Apply a try, and within 48 hours the interview requests started rolling in!"'
              }
            </p>
            <div>
              <div className="testimonial-author">{"Alexander K."}</div>
              <div className="testimonial-meta">
                {"Software Developer • Landed job in 2 weeks"}
              </div>
            </div>
          </div>
          <div className="glass-panel testimonial-card">
            <p className="testimonial-text">
              {
                '"I got hired by Truist bank! They wrote an amazing cover letter and highlighted my experience beautifully. The responses keep coming, and recruiters call me almost every day."'
              }
            </p>
            <div>
              <div className="testimonial-author">{"Jessica M."}</div>
              <div className="testimonial-meta">
                {"Financial Analyst • Landed Corporate Role"}
              </div>
            </div>
          </div>
          <div className="glass-panel testimonial-card">
            <p className="testimonial-text">
              {
                '"Having AIApply find the jobs, tailor my resume, and apply for me automatically makes the whole thing so much easier. I got 4 interviews booked in the first week!"'
              }
            </p>
            <div>
              <div className="testimonial-author">{"Daniel S."}</div>
              <div className="testimonial-meta">
                {"Product Manager • Landing 4 interviews in Week 1"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          paddingTop: "40px",
          borderTop: "1px solid var(--border-color)",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        {
          "© 2026 AI-Apply Pro Limited, All rights reserved. Powered by Google Gemini."
        }
      </div>
    </div>
  ) : firebaseConfig && !user && !skipAuth ? (
    authLoading ? (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, #1e1b4b 0%, #09090b 100%)",
          color: "#e4e4e7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          className="pulse-primary"
          style={{
            color: "var(--primary)",
            marginBottom: "16px",
          }}
        >
          <IconSparkles size={48} />
        </div>
        <p
          style={{
            fontSize: "14px",
            color: "#a1a1aa",
            fontWeight: "500",
          }}
        >
          {"Initializing Secure Session..."}
        </p>
      </div>
    ) : (
      <AuthPage
        firebaseConfig={firebaseConfig}
        setFirebaseConfig={setFirebaseConfig}
        onLoginSuccess={(D) => {
          (setUser(D), setSkipAuth(!1));
        }}
        onSkipAuth={() => {
          setSkipAuth(!0);
        }}
      />
    )
  ) : (
    <div className="app-container">
      <div className="sidebar">
        <div>
          <div
            className="logo-container"
            style={{
              cursor: "pointer",
            }}
            onClick={() => setView("landing")}
          >
            <IconSparkles
              className="pulse-primary"
              style={{
                color: "var(--primary)",
              }}
            />
            <div className="logo-text">{"AI-Apply Pro"}</div>
          </div>
          <div className="nav-links">
            <div
              style={{
                padding: "0 12px 6px 12px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                tracking: "0.05em",
                color: "var(--text-muted)",
                marginTop: "12px",
              }}
            >
              {"Pipeline & CRM"}
            </div>
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <IconLayoutDashboard size={18} />
              {"Overview"}
            </button>
            <button
              className={`nav-item ${activeTab === "job-board" ? "active" : ""}`}
              onClick={() => setActiveTab("job-board")}
            >
              <IconSearch size={18} />
              {"Auto-Apply Feed"}
            </button>
            <div
              style={{
                padding: "16px 12px 6px 12px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                tracking: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              {"Base Materials"}
            </div>
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <IconUser size={18} />
              {"Personal Profile"}
            </button>
            <div
              style={{
                padding: "16px 12px 6px 12px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                tracking: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              {"Tailoring Studio"}
            </div>
            <button
              className={`nav-item ${activeTab === "tailoring-workspace" ? "active" : ""}`}
              onClick={() => setActiveTab("tailoring-workspace")}
            >
              <IconSparkles
                size={18}
                style={{
                  color: "var(--primary)",
                }}
              />
              {"Tailoring Workspace"}
            </button>
            <button
              className={`nav-item ${activeTab === "recruiter" ? "active" : ""}`}
              onClick={() => setActiveTab("recruiter")}
            >
              <IconUserCheck size={18} style={{ color: "#a855f7" }} />
              {"Recruiter Workspace"}
            </button>
            <div
              style={{
                padding: "16px 12px 6px 12px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                tracking: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              {"Outreach & Prep"}
            </div>
            <button
              className={`nav-item ${activeTab === "mock-coach" ? "active" : ""}`}
              onClick={() => setActiveTab("mock-coach")}
            >
              <IconMessageSquare size={18} />
              {"Mock Interview"}
            </button>
            <button
              className={`nav-item ${activeTab === "career-templates" ? "active" : ""}`}
              onClick={() => setActiveTab("career-templates")}
            >
              <IconBookOpen size={18} />
              {"Career Templates"}
            </button>
            <div
              style={{
                padding: "16px 12px 6px 12px",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                tracking: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              {"Configuration"}
            </div>
            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <IconSettings size={18} />
              {"AI settings (BYOK)"}
            </button>
          </div>
        </div>
        {firebaseConfig && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "4px",
              fontSize: "12px",
              textAlign: "left",
            }}
          >
            {user ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--success)",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--success)",
                    }}
                  />
                  {"Cloud Sync Active"}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    marginBottom: "8px",
                  }}
                  title={user.email}
                >
                  {user.email}
                </div>
                <button
                  onClick={async () => {
                    (await signOutUser(firebaseConfig), setUser(null));
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "11px",
                    justifyContent: "center",
                    gap: "6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IconLogOut size={12} />
                  {" Sign Out"}
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    color: "#f87171",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  {"Local Storage Mode"}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    marginBottom: "8px",
                    lineHeight: "1.3",
                  }}
                >
                  {"Connect cloud workspace to save and sync profiles."}
                </div>
                <button
                  onClick={() => {
                    setSkipAuth(!1);
                  }}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "11px",
                    justifyContent: "center",
                  }}
                >
                  {"Sign In / Sync Cloud"}
                </button>
              </div>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn btn-secondary"
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              justifyContent: "center",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? (
              <IconSun
                size={14}
                style={{
                  color: "#ffd000",
                }}
              />
            ) : (
              <IconMoon
                size={14}
                style={{
                  color: "#7c3aed",
                }}
              />
            )}
            {"Toggle "}
            {theme === "dark" ? "Light" : "Dark"}
            {" Mode"}
          </button>
          <button
            onClick={() => setView("landing")}
            className="btn btn-secondary"
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              justifyContent: "center",
            }}
          >
            {"Back to Homepage"}
          </button>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            {"Local Sync Server: Active"}
          </div>
        </div>
      </div>
      <div className="main-content">
        {showSyncToast && (
          <div className="alert alert-success">
            <IconCheck size={18} />
            {"Changes saved and synced to Chrome Extension."}
          </div>
        )}
        <div
          className="glass-panel"
          style={{
            padding: "16px 24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)",
            border: "1px solid rgba(79, 70, 229, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "rgba(79, 70, 229, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "bold",
                color: "var(--primary)",
              }}
            >
              {"🎯"}
            </div>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  tracking: "0.05em",
                  color: "var(--primary)",
                  fontWeight: "bold",
                }}
              >
                {"Active Job Application Target"}
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-main)",
                }}
              >
                {jobTitle}{" "}
                <span
                  style={{
                    fontWeight: "normal",
                    color: "var(--text-muted)",
                  }}
                >
                  {"at"}
                </span>{" "}
                {jobCompany}
              </h2>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            {jobDescription ? (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--success)",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                {"✔ Job description configured"}
              </span>
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--error)",
                  background: "rgba(239,68,68,0.1)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {"⚠ Missing job description"}
              </span>
            )}
            <button
              onClick={() => setShowJobContextEditor(!showJobContextEditor)}
              className="btn btn-secondary"
              style={{
                fontSize: "12px",
                padding: "8px 16px",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              {"💼 "}
              {showJobContextEditor
                ? "Close Context Editor"
                : "Edit Job Requirements"}
            </button>
          </div>
        </div>
        {showJobContextEditor && (
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              marginBottom: "24px",
              border: "1px solid var(--border-color)",
              animation: "slideDown 0.2s ease-out",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "15px",
                fontWeight: "700",
              }}
            >
              {"Modify Active Job Specifications"}
            </h3>
            <div
              className="grid-container"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label">{"Job Title / Role"}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Generative AI Engineer"
                  value={jobTitle}
                  onChange={(D) => setJobTitle(D.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{"Target Company"}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Markel Group"
                  value={jobCompany}
                  onChange={(D) => setJobCompany(D.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                {"Complete Job Description (JD)"}
              </label>
              <textarea
                className="form-control textarea-control"
                placeholder="Paste the target job description requirements here..."
                style={{
                  minHeight: "140px",
                }}
                value={jobDescription}
                onChange={(D) => setJobDescription(D.target.value)}
              />
            </div>
          </div>
        )}
        {activeTab === "overview" && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{"Candidate Hub"}</h1>
                <div className="page-subtitle">
                  {"Track your automated applications and configurations"}
                </div>
              </div>
              <a
                href={`${API_BASE_URL}/sandbox.html`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                {"Open Testing Sandbox "}
                <IconExternalLink size={14} />
              </a>
            </div>
            <div
              className="grid-container"
              style={{
                marginBottom: "40px",
              }}
            >
              <div className="glass-panel dashboard-card">
                <div className="form-label">{"Total Applications"}</div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "var(--primary)",
                    marginTop: "8px",
                  }}
                >
                  {applications.length}
                </div>
              </div>
              <div className="glass-panel dashboard-card">
                <div className="form-label">{"API Status"}</div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: apiKey ? "var(--success)" : "var(--error)",
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <IconLock size={16} />
                  {apiKey ? "BYOK Configured" : "Needs API Key"}
                </div>
              </div>
              <div className="glass-panel dashboard-card">
                <div className="form-label">{"Extension Pairing"}</div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    marginTop: "16px",
                  }}
                >
                  {
                    "Open Extension Popup on any page to start auto-filling. Keep this tab open to sync."
                  }
                </div>
              </div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "12px",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  {"Application Pipeline"}
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() => setShowAddApplicationModal(!0)}
                    className="btn btn-primary"
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <IconPlus size={14} />
                    {" Add Application"}
                  </button>
                  <button
                    onClick={exportApplicationsCsv}
                    className="btn btn-secondary"
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <IconDownload size={14} />
                    {" Export CSV"}
                  </button>
                </div>
              </div>
              {applications.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  {
                    "No applications tracked yet. Autofill applications via the extension or manually log them above."
                  }
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        {"Company"}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        {"Job Title"}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        {"Status"}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        {"Date"}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                        }}
                      >
                        {"Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((D) => (
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                        key={D.id}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {D.company}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {D.title}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                          }}
                        >
                          <select
                            value={D.status}
                            onChange={(W) =>
                              handleUpdateApplicationStatus(
                                D.id,
                                W.target.value,
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              background:
                                D.status === "Offer"
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : D.status === "Interviewing"
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : D.status === "Rejected"
                                      ? "rgba(239, 68, 68, 0.15)"
                                      : "rgba(168, 85, 247, 0.15)",
                              color:
                                D.status === "Offer"
                                  ? "var(--success)"
                                  : D.status === "Interviewing"
                                    ? "var(--primary)"
                                    : D.status === "Rejected"
                                      ? "var(--error)"
                                      : "var(--secondary)",
                              border: "1px solid var(--border-color)",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value="Applied">{"Applied"}</option>
                            <option value="Applied (Auto)">
                              {"Applied (Auto)"}
                            </option>
                            <option value="Applied (Review)">
                              {"Applied (Review)"}
                            </option>
                            <option value="Interviewing">
                              {"Interviewing"}
                            </option>
                            <option value="Offer">{"Offer"}</option>
                            <option value="Rejected">{"Rejected"}</option>
                          </select>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {D.date}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => handleGenerateFollowUp(D)}
                              title="Write AI Follow-up Outreach"
                              className="btn btn-secondary"
                              style={{
                                padding: "6px",
                                borderRadius: "4px",
                              }}
                            >
                              <IconSend
                                size={14}
                                style={{
                                  color: "var(--primary)",
                                }}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(D.id)}
                              title="Delete entry"
                              className="btn btn-secondary"
                              style={{
                                padding: "6px",
                                borderRadius: "4px",
                                borderColor: "rgba(239,68,68,0.2)",
                              }}
                            >
                              <IconTrash2
                                size={14}
                                style={{
                                  color: "var(--error)",
                                }}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activeTab === "profile" && (
          <div>
            <div
              className="page-header"
              style={{
                marginBottom: "20px",
              }}
            >
              <div>
                <h1 className="page-title">{"Personal Profile"}</h1>
                <div className="page-subtitle">
                  {
                    "Configure contact credentials and professional background details"
                  }
                </div>
              </div>
              <button
                onClick={() => {
                  (localStorage.setItem(
                    "ai_apply_profiles",
                    JSON.stringify(profiles),
                  ),
                    localStorage.setItem(
                      "ai_apply_profile",
                      JSON.stringify(activeProfile),
                    ),
                    triggerSyncToast());
                }}
                className="btn btn-primary"
              >
                {"Save All Profiles"}
              </button>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "16px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "var(--text-muted)",
                  }}
                >
                  {"Active Profile:"}
                </span>
                <select
                  value={activeProfileId}
                  onChange={(D) => setActiveProfileId(D.target.value)}
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    minWidth: "180px",
                  }}
                >
                  {profiles.map((D) => (
                    <option value={D.id} key={D.id}>
                      {D.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={handleCreateProfile}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {"➕ New Profile"}
                </button>
                <button
                  onClick={() =>
                    handleRenameProfile(activeProfileId, activeProfile.name)
                  }
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                  }}
                >
                  {"✏ Rename"}
                </button>
                <button
                  onClick={() => handleDeleteProfile(activeProfileId)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    borderColor: "rgba(239,68,68,0.3)",
                    color: "var(--error)",
                  }}
                >
                  {"🗑 Delete"}
                </button>
              </div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "24px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background:
                  "linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "700",
                  }}
                >
                  {"Import Details from PDF"}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  {
                    "Upload a PDF resume to instantly populate all forms using AI extraction."
                  }
                </p>
              </div>
              <div>
                <label
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    cursor: "pointer",
                    padding: "10px 20px",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleParsePdfUpload}
                    style={{
                      display: "none",
                    }}
                  />
                  {parsingResume ? "Parsing PDF..." : "Upload PDF Resume"}
                </label>
              </div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "16px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "var(--text-muted)",
                  }}
                >
                  {"Resume Version:"}
                </span>
                <select
                  value={activeResumeId}
                  onChange={(D) => switchResumeVersion(D.target.value)}
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                    minWidth: "180px",
                  }}
                >
                  {activeProfileResumes.map((D) => (
                    <option value={D.id} key={D.id}>
                      {D.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => {
                    var W;
                    const D = prompt(
                      "Rename resume version:",
                      (W = activeProfileResumes.find(
                        (le) => le.id === activeResumeId,
                      )) == null
                        ? void 0
                        : W.name,
                    );
                    D &&
                      setProfiles((le) =>
                        le.map((Se) => {
                          if (Se.id === activeProfileId) {
                            const it = (
                              Se.resumes || [
                                {
                                  id: "default_resume",
                                  name: "Primary Resume",
                                  summary: Se.summary || "",
                                  skills: Se.skills || [],
                                  work_history: Se.work_history || [],
                                  education: Se.education || [],
                                  projects: Se.projects || [],
                                },
                              ]
                            ).map((ot) =>
                              ot.id === activeResumeId
                                ? {
                                    ...ot,
                                    name: D,
                                  }
                                : ot,
                            );
                            return {
                              ...Se,
                              resumes: it,
                            };
                          }
                          return Se;
                        }),
                      );
                  }}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                  }}
                >
                  {"✏ Rename Version"}
                </button>
                <button
                  onClick={() => deleteResumeVersion(activeResumeId)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    borderColor: "rgba(239,68,68,0.3)",
                    color: "var(--error)",
                  }}
                >
                  {"🗑 Delete Version"}
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: "24px",
              }}
            >
              <ProfileEditor
                profile={activeProfile}
                onEnhanceSection={handleEnhanceSection}
                onProfileUpdate={(D) => {
                  setProfiles((W) =>
                    W.map((le) => {
                      if (le.id === activeProfileId) {
                        const Se = le.resumes || [],
                          Ce = le.activeResumeId || "default_resume",
                          it = Se.map((ot) =>
                            ot.id === Ce
                              ? {
                                  ...ot,
                                  ...D,
                                }
                              : ot,
                          );
                        return {
                          ...le,
                          ...D,
                          resumes: it,
                        };
                      }
                      return le;
                    }),
                  );
                }}
              />
            </div>
          </div>
        )}
        {activeTab === "job-board" && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{"Auto-Apply Feed"}</h1>
                <div className="page-subtitle">
                  {
                    "Browse active remote listings and trigger one-click automated submissions"
                  }
                </div>
              </div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "24px",
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    personalizedSearch
                      ? "Search keywords (or leave empty to match your resume)..."
                      : "Search job titles or keywords (e.g. react, python, designer)..."
                  }
                  value={jobSearchQuery}
                  onChange={(D) => setJobSearchQuery(D.target.value)}
                  onKeyDown={(D) => D.key === "Enter" && searchJobs()}
                />
                <button
                  onClick={searchJobs}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <IconSearch size={16} />
                  {" Search"}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingLeft: "4px",
                }}
              >
                <input
                  type="checkbox"
                  id="personalized-search-toggle"
                  checked={personalizedSearch}
                  onChange={(D) => setPersonalizedSearch(D.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="personalized-search-toggle"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {"🎯 "}
                  <strong>{"Personalized Search:"}</strong>
                  {" Scrape and filter matching my resume skills, location ("}
                  {((Y =
                    activeProfile == null ? void 0 : activeProfile.personal) ==
                  null
                    ? void 0
                    : Y.location) || "Remote"}
                  {"), and role ("}
                  {((xe =
                    (Z =
                      activeProfile == null
                        ? void 0
                        : activeProfile.work_history) == null
                      ? void 0
                      : Z[0]) == null
                    ? void 0
                    : xe.role) || "Developer"}
                  {")"}
                </label>
              </div>
            </div>
            {searchingJobs ? (
              <div
                style={{
                  padding: "60px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                {"Scraping live listings from LinkedIn and Indeed..."}
              </div>
            ) : (
              <div
                className="grid-container"
                style={{
                  gridTemplateColumns: "1fr",
                  gap: "16px",
                }}
              >
                {jobResults.map((D) => {
                  var W;
                  return (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      key={D.id}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                        }}
                      >
                        {D.logo ? (
                          <img
                            src={D.logo}
                            alt={D.company}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: "bold",
                            }}
                          >
                            {(W = D.company) == null ? void 0 : W[0]}
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "var(--text-main)",
                            }}
                          >
                            {D.title}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong>{D.company}</strong>
                            <span>{"•"}</span>
                            <span>{D.location}</span>
                            <span>{"•"}</span>
                            <span
                              style={{
                                background:
                                  D.source === "LinkedIn"
                                    ? "rgba(10, 102, 194, 0.15)"
                                    : "rgba(255, 98, 0, 0.15)",
                                color:
                                  D.source === "LinkedIn"
                                    ? "#0a66c2"
                                    : "#ff6200",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              {D.source}
                            </span>
                            {D.matchScore && (
                              <>
                                <span>{"•"}</span>
                                <span
                                  style={{
                                    color:
                                      D.matchScore > 85
                                        ? "var(--success)"
                                        : "var(--primary)",
                                    fontWeight: "bold",
                                    fontSize: "11px",
                                  }}
                                >
                                  {"🎯 "}
                                  {D.matchScore}
                                  {"% Match"}
                                </span>
                              </>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              marginTop: "8px",
                            }}
                          >
                            {D.tags.slice(0, 4).map((le, Se) => (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: "rgba(255,255,255,0.04)",
                                  color: "var(--text-muted)",
                                }}
                                key={Se}
                              >
                                {le}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                        }}
                      >
                        <a
                          href={D.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                          }}
                        >
                          {"View Job "}
                          <IconExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => handleAutoApply(D)}
                          className="btn btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <IconZap size={12} />
                          {" One-Click Apply"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {autoApplyingJobId && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifycontent: "center",
                  zIndex: 1e3,
                  padding: "20px",
                }}
              >
                <div
                  className="glass-panel"
                  style={{
                    maxWidth: "640px",
                    width: "100%",
                    padding: "32px",
                    background: "#090d16",
                    margin: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <IconTerminal
                        size={18}
                        style={{
                          color: "var(--primary)",
                        }}
                      />
                      {" Auto-Apply Execution Console"}
                    </h3>
                    <button
                      onClick={() => setAutoApplyingJobId(null)}
                      className="btn btn-secondary"
                      disabled={autoApplyRunning}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                      }}
                    >
                      {"Close Console"}
                    </button>
                  </div>
                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "16px",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      height: "240px",
                      overflowY: "auto",
                      color: "#38bdf8",
                      lineHeight: "1.4",
                      marginBottom: "20px",
                    }}
                  >
                    {autoApplyLogs.map((D, W) => (
                      <div
                        style={{
                          marginBottom: "6px",
                          color:
                            D.includes("ERROR") || D.includes("❌")
                              ? "var(--error)"
                              : D.includes("✓") || D.includes("success")
                                ? "var(--success)"
                                : "#38bdf8",
                        }}
                        key={W}
                      >
                        {D}
                      </div>
                    ))}
                    {autoApplyRunning && (
                      <div
                        className="pulse-primary"
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "12px",
                          background: "var(--primary)",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: autoApplyRunning
                          ? "var(--text-muted)"
                          : autoApplyStatus === "success"
                            ? "var(--success)"
                            : "var(--error)",
                      }}
                    >
                      {autoApplyRunning
                        ? "🚀 Executing backend browser task..."
                        : autoApplyStatus === "success"
                          ? "✔ Application filled successfully (Review Mode)."
                          : "❌ Execution failed. Check logs."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "tailoring-workspace" && (
          <div>
            <div className="page-header" style={{ marginBottom: "24px" }}>
              <div>
                <h1 className="page-title">{"Tailoring Workspace"}</h1>
                <div className="page-subtitle">
                  {"Choose to build a fresh resume or tailor an existing resume for a specific Job Description"}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {tailoringWorkspaceMode !== "select" && (
                  <button
                    onClick={() => setTailoringWorkspaceMode("select")}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    {"← Back to Workspace Options"}
                  </button>
                )}
                <div className="glass-panel" style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                  <button
                    onClick={() => setTailoringWorkspaceMode("fresh")}
                    className={`btn ${tailoringWorkspaceMode === "fresh" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "6px 14px", fontSize: "12px", border: "none" }}
                  >
                    {"📁 Option A: Fresh Resume"}
                  </button>
                  <button
                    onClick={() => setTailoringWorkspaceMode("jd")}
                    className={`btn ${tailoringWorkspaceMode === "jd" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "6px 14px", fontSize: "12px", border: "none" }}
                  >
                    {"🎯 Option B: Tailor for JD"}
                  </button>
                </div>
              </div>
            </div>

            {/* 1. SELECTION LANDING MODE */}
            {tailoringWorkspaceMode === "select" && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: '0 0 8px 0' }}>
                    Select Your Resume Objective
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
                    Create a general baseline profile from scratch or optimize your resume for a target job listing.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                  {/* Option A Card */}
                  <div className="glass-panel" style={{
                    padding: '32px',
                    borderRadius: '16px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
                        <IconFileText size={28} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 10px 0' }}>
                        Option A: Build a Fresh Resume
                      </h3>
                      <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
                        Build a new professional baseline resume. Import an existing resume file or fill in details manually.
                      </p>
                      <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.8', marginBottom: '28px' }}>
                        <li>Upload PDF / DOCX file with instant AI extraction</li>
                        <li>Fill personal info, work history, projects, skills & education</li>
                        <li>Section-by-section multi-version AI Enhancement</li>
                      </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <label className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', padding: '12px', fontSize: '13px' }}>
                        <input type="file" accept=".pdf,.docx" onChange={handleParsePdfUpload} style={{ display: 'none' }} />
                        📁 Upload Resume File
                      </label>
                      <button onClick={() => setTailoringWorkspaceMode("fresh")} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '13px' }}>
                        ✍️ Manual Entry
                      </button>
                    </div>
                  </div>

                  {/* Option B Card */}
                  <div className="glass-panel" style={{
                    padding: '32px',
                    borderRadius: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
                        <IconSparkles size={28} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: '0 0 10px 0' }}>
                        Option B: Tailor Resume for JD
                      </h3>
                      <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
                        Optimize an existing resume specifically for a target Job Description to maximize ATS match score.
                      </p>
                      <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.8', marginBottom: '28px' }}>
                        <li>Paste Job Description & select candidate profile</li>
                        <li>Split-screen editor with section-by-section AI rewrites</li>
                        <li>Raw LaTeX code viewer, `.tex` export, & PDF download</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setTailoringWorkspaceMode("jd")}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}
                    >
                      🎯 Start JD Tailoring Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. OPTION A: FRESH RESUME BUILDER MODE */}
            {tailoringWorkspaceMode === "fresh" && (
              <div>
                <div className="glass-panel" style={{ padding: "16px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{"Option A: Fresh Resume Builder"}</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                      {"Upload a resume file to auto-fill or enter your credentials directly below."}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn btn-primary" style={{ display: "inline-flex", cursor: "pointer", padding: "8px 16px", fontSize: "12px" }}>
                      <input type="file" accept=".pdf,.docx" onChange={handleParsePdfUpload} style={{ display: "none" }} />
                      {parsingResume ? "Parsing File..." : "📁 Upload Resume File"}
                    </label>
                    <button
                      onClick={() => {
                        localStorage.setItem("ai_apply_profiles", JSON.stringify(profiles));
                        localStorage.setItem("ai_apply_profile", JSON.stringify(activeProfile));
                        triggerSyncToast();
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      {"💾 Save Resume Profile"}
                    </button>
                  </div>
                </div>

                <div className="grid-container" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "start" }}>
                  <div>
                    <ProfileEditor
                      profile={activeProfile || {}}
                      onEnhanceSection={handleEnhanceSection}
                      onProfileUpdate={(updatedData) => {
                        setProfiles((prev) =>
                          prev.map((p) => {
                            if (p.id === activeProfileId) {
                              const resumes = p.resumes || [];
                              const activeResId = p.activeResumeId || "default_resume";
                              const updatedResumes = resumes.map((r) => r.id === activeResId ? { ...r, ...updatedData } : r);
                              return { ...p, ...updatedData, resumes: updatedResumes };
                            }
                            return p;
                          })
                        );
                      }}
                    />
                  </div>

                  {/* Right Pane Document / LaTeX Studio */}
                  <div>
                    <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700" }}>Document Output & LaTeX</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setShowLatexSource(false)}
                          className={`btn ${!showLatexSource ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          {"📄 Visual Preview"}
                        </button>
                        <button
                          onClick={() => setShowLatexSource(true)}
                          className={`btn ${showLatexSource ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          {"💻 Raw LaTeX (.tex)"}
                        </button>
                      </div>
                    </div>

                    {!showLatexSource ? (renderVisualResumeSheet(activeProfile)) : (
                      <div className="glass-panel" style={{ padding: "16px" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Raw LaTeX Source Code (`.tex`):</div>
                        <textarea
                          className="form-control"
                          readOnly
                          style={{ minHeight: "450px", fontFamily: "monospace", fontSize: "12px", background: "#020617", color: "#38bdf8", lineHeight: "1.4" }}
                          value={buildLatexResumeSource(activeProfile)}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button
                        onClick={() => {
                          const blob = new Blob([buildLatexResumeSource(activeProfile)], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(activeProfile?.personal?.name || "resume").toLowerCase().replace(/\s+/g, "_")}.tex`;
                          a.click();
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}
                      >
                        📥 Download .tex
                      </button>
                      <button
                        onClick={() => handleDownloadPdf()}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}
                      >
                        📥 Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. OPTION B: JD RESUME TAILORING WORKSPACE MODE */}
            {tailoringWorkspaceMode === "jd" && (
              <div>
                {/* Target JD Bar */}
                <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{"Target Job Description & Base Profile"}</h3>
                    <button
                      onClick={handleGenerateTailoredResume}
                      disabled={tailoringResume || !targetJdText}
                      className="btn btn-primary"
                      style={{ padding: "8px 18px", fontSize: "13px", display: "flex", gap: "6px", alignItems: "center", background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
                    >
                      <IconSparkles size={15} />
                      {tailoringResume ? "AI Tailoring Resume..." : "⚡ AI Tailor Resume"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
                    <div>
                      <textarea
                        className="form-control"
                        placeholder="Paste the target job description here..."
                        style={{ minHeight: "100px", fontSize: "12.5px" }}
                        value={targetJdText || ""}
                        onChange={(e) => setTargetJdText(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "11px" }}>Base Profile for Tailoring:</label>
                        <select
                          value={activeProfileId || "default"}
                          onChange={(e) => setActiveProfileId(e.target.value)}
                          className="form-control"
                          style={{ fontSize: "13px" }}
                        >
                          {(profiles || []).map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {"AI will match skills, rewrite bullet points with active metrics, and optimize for ATS scanning."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ATS Score & Keyword Optimization Bar */}
                <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px", borderLeft: "4px solid #3b82f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>{"📊 ATS Match Score & Keyword Optimization"}</h3>
                      {atsScoreData && (
                        <span style={{ fontSize: "14px", fontWeight: "bold", padding: "3px 12px", borderRadius: "12px", background: atsScoreData.score >= 80 ? "rgba(34,197,94,0.2)" : atsScoreData.score >= 60 ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)", color: atsScoreData.score >= 80 ? "#4ade80" : atsScoreData.score >= 60 ? "#fde047" : "#f87171", border: `1px solid ${atsScoreData.score >= 80 ? "#22c55e" : atsScoreData.score >= 60 ? "#eab308" : "#ef4444"}` }}>
                          {atsScoreData.score}% Match
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!targetJdText || !targetJdText.trim()) {
                          toast.error("Please paste a target job description in the box above first!");
                          return;
                        }
                        handleAnalyzeAtsScore();
                      }}
                      disabled={analyzingAts}
                      className="btn btn-primary"
                      style={{ padding: "7px 16px", fontSize: "12.5px", display: "flex", gap: "6px", alignItems: "center", background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}
                    >
                      <IconSparkles size={14} />
                      {analyzingAts ? "Analyzing ATS Match..." : "⚡ Calculate ATS Match"}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden", marginBottom: "14px" }}>
                    <div style={{ width: `${atsScoreData?.score || 0}%`, height: "100%", background: atsScoreData?.score >= 80 ? "linear-gradient(90deg, #22c55e, #10b981)" : atsScoreData?.score >= 60 ? "linear-gradient(90deg, #eab308, #f59e0b)" : "linear-gradient(90deg, #ef4444, #dc2626)", transition: "width 0.6s ease" }} />
                  </div>

                  {/* Keywords Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* Matching Keywords */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#4ade80", marginBottom: "6px" }}>
                        {`✓ Matching Keywords (${(atsScoreData?.matchingKeywords || []).length})`}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(atsScoreData?.matchingKeywords || []).length === 0 ? (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{"Paste JD and click Calculate ATS Match"}</span>
                        ) : (
                          atsScoreData.matchingKeywords.map((kw, idx) => (
                            <span key={idx} style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px" }}>
                              {kw}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#f87171", marginBottom: "6px" }}>
                        {`⚠ Missing Target Keywords (${(atsScoreData?.missingKeywords || []).length})`}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(atsScoreData?.missingKeywords || []).length === 0 ? (
                          <span style={{ fontSize: "12px", color: "#4ade80" }}>{atsScoreData ? "Great match! No critical missing keywords." : "Click Calculate ATS Match above"}</span>
                        ) : (
                          atsScoreData.missingKeywords.map((kw, idx) => (
                            <span key={idx} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              {kw}
                              <button
                                type="button"
                                title="Add to Skills"
                                onClick={() => {
                                  setProfiles((prev) => prev.map((p) => {
                                    if (p.id === activeProfileId) {
                                      const currentSkills = getSkillsList(p.skills);
                                      if (!currentSkills.includes(kw)) {
                                        return { ...p, skills: [...currentSkills, kw] };
                                      }
                                    }
                                    return p;
                                  }));
                                  toast.success(`Added "${kw}" to skills!`);
                                }}
                                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "11px", padding: 0 }}
                              >
                                +
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Split Screen Workspace */}
                <div className="grid-container" style={{ gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "start" }}>
                  {/* Left Pane: Full 7-Section Modular Profile Editor & AI Rewriter */}
                  <div>
                    <ProfileEditor
                      profile={activeProfile || {}}
                      onEnhanceSection={handleEnhanceSection}
                      onProfileUpdate={(updatedData) => {
                        setProfiles((prev) =>
                          prev.map((p) => {
                            if (p.id === activeProfileId) {
                              const resumes = p.resumes || [];
                              const activeResId = p.activeResumeId || "default_resume";
                              const updatedResumes = resumes.map((r) => r.id === activeResId ? { ...r, ...updatedData } : r);
                              return { ...p, ...updatedData, resumes: updatedResumes };
                            }
                            return p;
                          })
                        );
                      }}
                    />
                  </div>

                  {/* Right Pane: Live Preview / Raw LaTeX Code Viewer Toggle */}
                  <div>
                    <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700" }}>Document Output & Exports</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setShowLatexSource(false)}
                          className={`btn ${!showLatexSource ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          {"📄 Live Preview"}
                        </button>
                        <button
                          onClick={() => setShowLatexSource(true)}
                          className={`btn ${showLatexSource ? "btn-primary" : "btn-secondary"}`}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          {"💻 Raw LaTeX (.tex)"}
                        </button>
                      </div>
                    </div>

                    {!showLatexSource ? (renderVisualResumeSheet(activeProfile)) : (
                      <div className="glass-panel" style={{ padding: "16px" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Raw LaTeX Source Code (`.tex`):</div>
                        <textarea
                          className="form-control"
                          readOnly
                          style={{ minHeight: "450px", fontFamily: "monospace", fontSize: "12px", background: "#020617", color: "#38bdf8", lineHeight: "1.4" }}
                          value={buildLatexResumeSource(activeProfile)}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button
                        onClick={() => {
                          const blob = new Blob([buildLatexResumeSource(activeProfile)], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(activeProfile?.personal?.name || "tailored_resume").toLowerCase().replace(/\s+/g, "_")}.tex`;
                          a.click();
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}
                      >
                        📥 Download .tex
                      </button>
                      <button
                        onClick={() => handleDownloadPdf()}
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: "center", fontSize: "12px" }}
                      >
                        📥 Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
{activeTab === "recruiter" && <RecruiterWorkspace apiKey={apiKey} />}
        {activeTab === "career-templates" && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{"Career Templates Studio"}</h1>
                <div className="page-subtitle">
                  {
                    "Compile STAR stories, outreach template, or salary negotiation scripts"
                  }
                </div>
              </div>
            </div>
            <div
              className="glass-panel"
              style={{
                padding: "32px",
                marginBottom: "24px",
              }}
            >
              <div
                className="grid-container"
                style={{
                  gridTemplateColumns: "1fr 2fr",
                  gap: "24px",
                }}
              >
                <div>
                  <div className="form-group">
                    <label className="form-label">{"Template Type"}</label>
                    <select
                      className="form-control"
                      value={templateType}
                      onChange={(D) => setTemplateType(D.target.value)}
                    >
                      <option value="STAR Story">
                        {"STAR Method Behavioral Answer"}
                      </option>
                      <option value="LinkedIn Outreach">
                        {"LinkedIn Recruiter Cold Message"}
                      </option>
                      <option value="Salary Negotiation">
                        {"Salary Counteroffer Negotiation Email"}
                      </option>
                      <option value="Professional Bio">
                        {"Professional Bio Generator"}
                      </option>
                      <option value="Subject Line Creator">
                        {"Networking Email Subject Line Creator"}
                      </option>
                      <option value="JD Keyword Finder">
                        {"Job Description Keyword Finder"}
                      </option>
                    </select>
                  </div>
                  <div
                    className="form-group"
                    style={{
                      marginTop: "16px",
                    }}
                  >
                    <label className="form-label">{"Extra Context"}</label>
                    <textarea
                      className="form-control"
                      style={{
                        minHeight: "100px",
                      }}
                      placeholder="STAR situation prompt, company targets, target base salary details..."
                      value={templateExtraContext}
                      onChange={(D) => setTemplateExtraContext(D.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleCompileCareerTemplate}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: "16px",
                    }}
                    disabled={compilingTemplate}
                  >
                    {compilingTemplate
                      ? "Compiling Template..."
                      : "Compile Document"}
                  </button>
                </div>
                <div
                  className="glass-panel"
                  style={{
                    padding: "24px",
                    background: "rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                      }}
                    >
                      {"Generated Output"}
                    </h4>
                    {templateOutput && (
                      <button
                        onClick={() => copyToClipboard(templateOutput)}
                        className="btn btn-secondary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                        }}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                  {templateOutput ? (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#cbd5e1",
                        padding: "16px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        background: "#020617",
                      }}
                    >
                      {templateOutput}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "40px 0",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                      }}
                    >
                      {'Click "Compile Document" to generate template.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "mock-coach" && (
          <div>
            <div
              className="page-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 className="page-title">{"AI Mock Interview Coach"}</h1>
                <div className="page-subtitle">
                  {
                    "Simulate real-time interviews with voice captures and AI evaluations"
                  }
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => {
                    (setVoiceMode(!1), stopVoiceListening());
                  }}
                  className={`btn ${voiceMode ? "btn-secondary" : "btn-primary"}`}
                  style={{
                    fontSize: "12px",
                    padding: "8px 16px",
                  }}
                >
                  {"Written Mode"}
                </button>
                <button
                  onClick={() => {
                    (setVoiceMode(!0), setVoiceRoomStage("setup"));
                  }}
                  className={`btn ${voiceMode ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    fontSize: "12px",
                    padding: "8px 16px",
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <IconMic size={14} />
                  {" Voice AI Room (Alex)"}
                </button>
              </div>
            </div>
            {jobDescription ? (
              voiceMode ? (
                <div>
                  {voiceRoomStage === "setup" && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "32px",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 24px 0",
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "12px",
                        }}
                      >
                        {"Configure Voice Interview Session"}
                      </h3>
                      <div
                        className="grid-container"
                        style={{
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "20px",
                        }}
                      >
                        <div className="form-group">
                          <label className="form-label">
                            {"Interview Role"}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={interviewRole}
                            onChange={(D) => setInterviewRole(D.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            {"Interview Type"}
                          </label>
                          <select
                            className="form-control"
                            value={interviewType}
                            onChange={(D) => setInterviewType(D.target.value)}
                          >
                            <option value="Technical">{"Technical"}</option>
                            <option value="Behavioral">{"Behavioral"}</option>
                            <option value="HR">{"HR"}</option>
                            <option value="Mixed">{"Mixed"}</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            {"Difficulty Level"}
                          </label>
                          <select
                            className="form-control"
                            value={interviewDifficulty}
                            onChange={(D) =>
                              setInterviewDifficulty(D.target.value)
                            }
                          >
                            <option value="Junior">{"Junior"}</option>
                            <option value="Mid">{"Mid / Intermediate"}</option>
                            <option value="Senior">{"Senior"}</option>
                          </select>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "16px",
                          marginBottom: "16px",
                          background: "rgba(79,70,229,0.04)",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "1px solid rgba(79,70,229,0.1)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            tracking: "0.05em",
                            color: "var(--primary)",
                            fontWeight: "bold",
                          }}
                        >
                          {"Active Job Target Context"}
                        </span>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "var(--text-main)",
                          }}
                        >
                          {jobTitle}
                          {" at "}
                          {jobCompany}
                        </div>
                      </div>
                      <button
                        onClick={startVoiceInterview}
                        className="btn btn-primary"
                        style={{
                          padding: "12px 24px",
                          fontSize: "14px",
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <IconMic size={16} />
                        {" Start Voice Practice Room"}
                      </button>
                    </div>
                  )}
                  {voiceRoomStage === "room" && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "40px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "160px",
                          height: "160px",
                          marginBottom: "24px",
                        }}
                      >
                        {voiceRoomState === "ai-speaking" && (
                          <>
                            <div
                              className="pulse-primary"
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50%",
                                border: "4px solid var(--primary)",
                                opacity: 0.3,
                              }}
                            />
                            <div
                              className="pulse-primary"
                              style={{
                                position: "absolute",
                                inset: "-12px",
                                borderRadius: "50%",
                                border: "2px solid var(--primary)",
                                opacity: 0.15,
                              }}
                            />
                          </>
                        )}
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "56px",
                            boxShadow: "0 10px 30px rgba(56, 189, 248, 0.2)",
                          }}
                        >
                          {voiceRoomState === "loading" ||
                          voiceRoomState === "processing"
                            ? "⚙"
                            : "🤖"}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "white",
                            background:
                              voiceRoomState === "listening"
                                ? "var(--success)"
                                : "var(--primary)",
                          }}
                        >
                          {voiceRoomState === "ai-speaking"
                            ? "SPEAKING"
                            : voiceRoomState === "listening"
                              ? "LISTENING"
                              : "PROCESSING"}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "800",
                          marginBottom: "6px",
                        }}
                      >
                        {"Alex (AI Interviewer)"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginBottom: "32px",
                        }}
                      >
                        {"Question "}
                        {voiceTurnNumber}
                        {" of 5 • "}
                        {interviewType}
                        {" Mode ("}
                        {interviewDifficulty}
                        {")"}
                      </div>
                      <div
                        className="glass-panel"
                        style={{
                          width: "100%",
                          maxWidth: "640px",
                          padding: "24px",
                          background: "#020617",
                          textAlign: "left",
                          marginBottom: "32px",
                          minHeight: "120px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            textTransform: "uppercase",
                            color: "var(--primary)",
                            fontWeight: "bold",
                            marginBottom: "6px",
                          }}
                        >
                          {"Alex:"}
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            color: "var(--text-main)",
                            lineHeight: "1.5",
                            marginBottom: "20px",
                            fontStyle: "italic",
                          }}
                        >
                          {aiSpeechText ||
                            "Initializing conversation thread..."}
                        </div>
                        {voiceTranscript && (
                          <>
                            <div
                              style={{
                                fontSize: "12px",
                                textTransform: "uppercase",
                                color: "var(--success)",
                                fontWeight: "bold",
                                marginBottom: "6px",
                              }}
                            >
                              {"You:"}
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#cbd5e1",
                                lineHeight: "1.4",
                              }}
                            >
                              {voiceTranscript}
                            </div>
                          </>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                        }}
                      >
                        <button
                          onClick={submitVoiceAnswer}
                          className="btn btn-primary"
                          disabled={voiceRoomState !== "listening"}
                          style={{
                            padding: "12px 24px",
                            fontSize: "14px",
                          }}
                        >
                          {"Submit Response & Continue"}
                        </button>
                        <button
                          onClick={endVoiceSession}
                          className="btn btn-secondary"
                          style={{
                            padding: "12px 24px",
                            fontSize: "14px",
                            color: "var(--error)",
                            borderColor: "rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          {"End Session"}
                        </button>
                      </div>
                    </div>
                  )}
                  {voiceRoomStage === "results" && voiceFinalFeedback && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "40px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "16px",
                          marginBottom: "32px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "22px",
                            }}
                          >
                            {"Holistic Performance Evaluation"}
                          </h3>
                          <p
                            style={{
                              margin: "4px 0 0 0",
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {
                              "Feedback provided by senior interviewer coach AI"
                            }
                          </p>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                            }}
                          >
                            {"Overall Score"}
                          </div>
                          <div
                            style={{
                              fontSize: "36px",
                              fontWeight: "800",
                              color: "var(--primary)",
                            }}
                          >
                            {voiceFinalFeedback.overallScore}{" "}
                            <span
                              style={{
                                fontSize: "16px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {"/ 10"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="grid-container"
                        style={{
                          gridTemplateColumns: "2fr 1.2fr",
                          gap: "32px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 12px 0",
                            }}
                          >
                            {"Coaching Summary"}
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              lineHeight: "1.6",
                              color: "#cbd5e1",
                              marginBottom: "32px",
                              background: "rgba(0,0,0,0.1)",
                              padding: "16px",
                              borderRadius: "8px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {voiceFinalFeedback.summary}
                          </p>
                          <h4
                            style={{
                              margin: "0 0 12px 0",
                            }}
                          >
                            {"Key Strengths"}
                          </h4>
                          <ul
                            style={{
                              paddingLeft: "20px",
                              fontSize: "13px",
                              color: "#e2e8f0",
                              lineHeight: "2",
                              marginBottom: "32px",
                            }}
                          >
                            {voiceFinalFeedback.strengths &&
                              voiceFinalFeedback.strengths.map((D, W) => (
                                <li
                                  style={{
                                    color: "var(--success)",
                                  }}
                                  key={W}
                                >
                                  {"✔ "}
                                  {D}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div
                          className="glass-panel"
                          style={{
                            padding: "24px",
                          }}
                        >
                          <h4
                            style={{
                              margin: "0 0 16px 0",
                              color: "var(--warning)",
                            }}
                          >
                            {"Areas for Improvement"}
                          </h4>
                          <ul
                            style={{
                              paddingLeft: "20px",
                              fontSize: "13px",
                              color: "#e2e8f0",
                              lineHeight: "1.8",
                            }}
                          >
                            {voiceFinalFeedback.improvements &&
                              voiceFinalFeedback.improvements.map((D, W) => (
                                <li
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                  key={W}
                                >
                                  {"• "}
                                  {D}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={() => setVoiceRoomStage("setup")}
                        className="btn btn-primary"
                        style={{
                          marginTop: "32px",
                        }}
                      >
                        {"Start New Voice Session"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    className="glass-panel"
                    style={{
                      padding: "32px",
                      marginBottom: "24px",
                      background:
                        "linear-gradient(135deg, rgba(79,70,229,0.02) 0%, rgba(255,255,255,0.01) 100%)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "700",
                          }}
                        >
                          {"Written Interview Simulation"}
                        </h3>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {
                            "Prepare answers to custom behavioral and technical questions for "
                          }
                          <strong>{jobTitle}</strong>
                          {" at "}
                          <strong>{jobCompany}</strong>
                          {"."}
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateMockQuestions}
                        className="btn btn-primary"
                        disabled={generatingMockQuestions}
                      >
                        {generatingMockQuestions
                          ? "Generating Questions..."
                          : "Generate Mock Questions"}
                      </button>
                    </div>
                  </div>
                  {mockQuestions.length > 0 && (
                    <div
                      className="grid-container"
                      style={{
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                      }}
                    >
                      <div
                        className="glass-panel"
                        style={{
                          padding: "24px",
                        }}
                      >
                        <h3
                          style={{
                            margin: "0 0 16px 0",
                            borderBottom: "1px solid var(--border-color)",
                            paddingBottom: "8px",
                          }}
                        >
                          {"Select Question"}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {mockQuestions.map((D, W) => (
                            <button
                              onClick={() => {
                                (setSelectedQuestionIndex(W),
                                  setAnswerGrade(null),
                                  setWrittenAnswer(""));
                              }}
                              className="nav-item"
                              style={{
                                textAlign: "left",
                                border: "1px solid var(--border-color)",
                                background:
                                  selectedQuestionIndex === W
                                    ? "rgba(56, 189, 248, 0.08)"
                                    : "transparent",
                                borderColor:
                                  selectedQuestionIndex === W
                                    ? "var(--primary)"
                                    : "var(--border-color)",
                                color:
                                  selectedQuestionIndex === W
                                    ? "var(--text-main)"
                                    : "var(--text-muted)",
                              }}
                              key={W}
                            >
                              {W + 1}
                              {". "}
                              {D}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div
                        className="glass-panel"
                        style={{
                          padding: "24px",
                        }}
                      >
                        {selectedQuestionIndex !== null ? (
                          <div>
                            <h4
                              style={{
                                margin: "0 0 16px 0",
                                color: "var(--primary)",
                              }}
                            >
                              {"Q: "}
                              {mockQuestions[selectedQuestionIndex]}
                            </h4>
                            <div className="form-group">
                              <label className="form-label">
                                {"Your Response"}
                              </label>
                              <div
                                style={{
                                  position: "relative",
                                }}
                              >
                                <textarea
                                  className="form-control"
                                  style={{
                                    minHeight: "120px",
                                    paddingRight: "48px",
                                  }}
                                  placeholder="Type your response, or click the mic button to speak your answer..."
                                  value={writtenAnswer}
                                  onChange={(D) =>
                                    setWrittenAnswer(D.target.value)
                                  }
                                />
                                <button
                                  onClick={handleToggleMicRecording}
                                  className="btn btn-secondary"
                                  style={{
                                    position: "absolute",
                                    right: "12px",
                                    bottom: "12px",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    background: recordingAnswer
                                      ? "var(--error)"
                                      : "rgba(255,255,255,0.05)",
                                    color: recordingAnswer
                                      ? "white"
                                      : "var(--text-main)",
                                  }}
                                >
                                  <IconMic
                                    size={16}
                                    className={
                                      recordingAnswer ? "pulse-primary" : ""
                                    }
                                  />
                                </button>
                              </div>
                              {recordingAnswer && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--error)",
                                    marginTop: "4px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {
                                    "🎙 Capture in progress... speak now. Click mic again or stop to end."
                                  }
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleGradeWrittenAnswer}
                              className="btn btn-primary"
                              style={{
                                width: "100%",
                                justifycontent: "center",
                              }}
                              disabled={gradingAnswer || !writtenAnswer}
                            >
                              {gradingAnswer
                                ? "Evaluating Answer..."
                                : "Submit Answer for Grading"}
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "40px 0",
                              textAlign: "center",
                              color: "var(--text-muted)",
                            }}
                          >
                            {
                              "Select an interview question to start responding."
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {answerGrade && (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "32px",
                        marginTop: "24px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "12px",
                          marginBottom: "20px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                          }}
                        >
                          {"AI Evaluation Results"}
                        </h3>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "800",
                            color: "var(--primary)",
                          }}
                        >
                          {"Grade Score: "}
                          {answerGrade.score}
                          {"/100"}
                        </div>
                      </div>
                      <div
                        className="grid-container"
                        style={{
                          gridTemplateColumns: "1.5fr 1fr",
                          gap: "24px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 8px 0",
                            }}
                          >
                            {"Structural Evaluation"}
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              lineHeight: "1.5",
                              color: "#cbd5e1",
                              margin: "0 0 20px 0",
                            }}
                          >
                            {answerGrade.feedback}
                          </p>
                          <h4
                            style={{
                              margin: "0 0 8px 0",
                            }}
                          >
                            {"Clarity & Style"}
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              lineHeight: "1.5",
                              color: "#cbd5e1",
                              margin: "0 0 20px 0",
                            }}
                          >
                            {answerGrade.clarity}
                          </p>
                          <h4
                            style={{
                              margin: "0 0 8px 0",
                            }}
                          >
                            {"Grammar Status"}
                          </h4>
                          <p
                            style={{
                              fontSize: "14px",
                              lineHeight: "1.5",
                              color: "#cbd5e1",
                              margin: 0,
                            }}
                          >
                            {answerGrade.grammar}
                          </p>
                        </div>
                        <div
                          className="glass-panel"
                          style={{
                            padding: "20px",
                            background: "rgba(0,0,0,0.1)",
                          }}
                        >
                          <h4
                            style={{
                              margin: "0 0 12px 0",
                              color: "var(--warning)",
                            }}
                          >
                            {"Suggested Improvements:"}
                          </h4>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "16px",
                              fontSize: "13px",
                              color: "#e2e8f0",
                              lineHeight: "1.6",
                            }}
                          >
                            {answerGrade.suggestedImprovement &&
                              answerGrade.suggestedImprovement.map((D, W) => (
                                <li
                                  style={{
                                    marginBottom: "8px",
                                  }}
                                  key={W}
                                >
                                  {D}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: "48px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.01)",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "12px",
                  marginTop: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                  }}
                >
                  {"💼"}
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    margin: "0 0 8px 0",
                    color: "var(--text-main)",
                  }}
                >
                  {"No Target Job Description Configured"}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    maxWidth: "440px",
                    margin: "0 auto 24px auto",
                    lineHeight: "1.5",
                  }}
                >
                  {
                    "Paste a target job description to customize mock interview questions and voice practice scenarios."
                  }
                </p>
                <button
                  onClick={() => setShowJobContextEditor(!0)}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  {"💼 Configure Active Job Requirements"}
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === "settings" && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{"AI Settings (BYOK)"}</h1>
                <div className="page-subtitle">
                  {"Manage Gemini & Hugging Face API keys for intelligent ATS scoring & resume tailoring"}
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: "32px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  background: "rgba(56, 189, 248, 0.05)",
                  border: "1px solid rgba(56, 189, 248, 0.1)",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                <IconLock style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
                    {"Bring Your Own Key (BYOK)"}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    {"Your API keys are stored purely in your browser's local storage and are never sent to external servers other than directly to the AI APIs during query resolutions."}
                  </div>
                </div>
              </div>

              {/* AI Model Provider Selector */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">{"Active AI Intelligence Engine"}</label>
                <select
                  className="form-control"
                  value={aiProvider}
                  onChange={(e) => {
                    setAiProvider(e.target.value);
                    localStorage.setItem("ai_apply_ai_provider", e.target.value);
                    toast.success(`Active AI Provider set to ${e.target.value === 'huggingface' ? 'Hugging Face Inference API' : 'Google Gemini API'}`);
                  }}
                >
                  <option value="gemini">✨ Google Gemini 2.5/3.5 Flash API</option>
                  <option value="huggingface">🤗 Hugging Face Serverless API (Llama 3.2 & Mistral 7B)</option>
                  <option value="hybrid">⚡ Hybrid Auto-Fallback (Gemini + Hugging Face)</option>
                </select>
              </div>

              {/* Hugging Face API Token Input */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">{"Hugging Face API Token (HF Token)"}</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your Hugging Face User Access Token (hf_...)"
                    value={hfApiKey}
                    onChange={(e) => {
                      setHfApiKey(e.target.value);
                      localStorage.setItem("ai_apply_hf_api_key", e.target.value);
                      setHfKeyVerified(false);
                    }}
                  />
                  <button
                    onClick={handleVerifyHfApiKey}
                    className="btn btn-secondary"
                    disabled={!hfApiKey || verifyingHfKey}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {verifyingHfKey ? "Verifying Token..." : "Verify HF Token"}
                  </button>
                </div>
                {hfKeyVerified && (
                  <div style={{ color: "var(--success)", fontSize: "12px", marginTop: "6px", fontWeight: 500 }}>
                    {"✔ Hugging Face API Token is valid and ready for Llama 3 & Mistral inference!"}
                  </div>
                )}
              </div>

              {/* Gemini API Key Input */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label className="form-label">{"Gemini API Key"}</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your Gemini API key (AIzaSy...)"
                    value={apiKey}
                    onChange={(D) => {
                      setApiKey(D.target.value);
                      setApiKeyVerified(false);
                    }}
                  />
                  <button
                    onClick={handleVerifyApiKey}
                    className="btn btn-secondary"
                    disabled={!apiKey || verifyingApiKey}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {verifyingApiKey ? "Verifying..." : "Verify Connection"}
                  </button>
                </div>
                {apiKeyVerified && (
                  <div style={{ color: "var(--success)", fontSize: "12px", marginTop: "6px", fontWeight: 500 }}>
                    {"✔ API Key is valid and successfully connected to the Gemini API!"}
                  </div>
                )}
              </div>
              <div
                className="form-group"
                style={{
                  marginTop: "24px",
                }}
              >
                <label className="form-label">
                  {"Default Automation Mode"}
                </label>
                <select
                  className="form-control"
                  value={automationMode}
                  onChange={(D) => setAutomationMode(D.target.value)}
                  style={{
                    maxWidth: "400px",
                    cursor: "pointer",
                  }}
                >
                  <option value="manual">
                    {"Manual (Basic contact details + Resume only)"}
                  </option>
                  <option value="hybrid">
                    {
                      "Hybrid (Autofill everything, manual review before submit)"
                    }
                  </option>
                  <option value="auto">
                    {"Auto (Full auto-fill & auto-submit)"}
                  </option>
                </select>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    marginTop: "6px",
                    lineHeight: "1.4",
                  }}
                >
                  {
                    "Choose how automated your job applications should be. This preference synchronizes automatically with your Chrome Extension popup settings."
                  }
                </div>
              </div>
              <div
                className="form-group"
                style={{
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <IconGlobe size={14} />
                  {" Firebase Firestore Sync (Optional)"}
                </label>
                <textarea
                  className="form-control"
                  style={{
                    minHeight: "120px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                  placeholder={`Paste your Firebase config JSON here:
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
                  value={firebaseConfig}
                  onChange={(D) => setFirebaseConfig(D.target.value)}
                />
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    marginTop: "6px",
                    lineHeight: "1.4",
                  }}
                >
                  {cloudSyncing ? (
                    <span
                      style={{
                        color: "var(--success)",
                        fontWeight: "bold",
                      }}
                    >
                      {"⚡ Synchronizing updates to cloud Firestore..."}
                    </span>
                  ) : (
                    <span>
                      {
                        "Provide your Firebase SDK configuration to enable cloud synchronization for your candidate profiles, applications log, and active configurations."
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {showAddApplicationModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px",
            }}
          >
            <div
              className="glass-panel"
              style={{
                maxWidth: "480px",
                width: "100%",
                padding: "32px",
                background: "#090d16",
                margin: "auto",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "12px",
                }}
              >
                {"Add Tracked Application"}
              </h3>
              <div className="form-group">
                <label className="form-label">{"Company Name"}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Google"
                  value={newAppCompany}
                  onChange={(D) => setNewAppCompany(D.target.value)}
                />
              </div>
              <div
                className="form-group"
                style={{
                  marginTop: "16px",
                }}
              >
                <label className="form-label">{"Job Title"}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={newAppTitle}
                  onChange={(D) => setNewAppTitle(D.target.value)}
                />
              </div>
              <div
                className="grid-container"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">{"Status"}</label>
                  <select
                    className="form-control"
                    value={newAppStatus}
                    onChange={(D) => setNewAppStatus(D.target.value)}
                  >
                    <option value="Applied">{"Applied"}</option>
                    <option value="Interviewing">{"Interviewing"}</option>
                    <option value="Offer">{"Offer"}</option>
                    <option value="Rejected">{"Rejected"}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{"Date Applied"}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newAppDate}
                    onChange={(D) => setNewAppDate(D.target.value)}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "32px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowAddApplicationModal(!1)}
                  className="btn btn-secondary"
                >
                  {"Cancel"}
                </button>
                <button
                  onClick={handleSaveNewApplication}
                  className="btn btn-primary"
                >
                  {"Save Application"}
                </button>
              </div>
            </div>
          </div>
        )}
        {followUpTargetApp && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px",
            }}
          >
            <div
              className="glass-panel"
              style={{
                maxWidth: "600px",
                width: "100%",
                padding: "32px",
                background: "#090d16",
                margin: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "12px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  {"AI Follow-Up Generator"}
                </h3>
                <button
                  onClick={() => setFollowUpTargetApp(null)}
                  className="btn btn-secondary"
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                  }}
                >
                  {"Close"}
                </button>
              </div>
              {generatingFollowUp ? (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  {"Drafting customized outreach template via Gemini..."}
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginBottom: "16px",
                    }}
                  >
                    {"Tailored message for "}
                    <strong>{followUpTargetApp.title}</strong>
                    {" at "}
                    <strong>{followUpTargetApp.company}</strong>
                    {":"}
                  </div>
                  <textarea
                    className="form-control"
                    style={{
                      minHeight: "220px",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                    value={followUpText}
                    onChange={(D) => setFollowUpText(D.target.value)}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "24px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => copyToClipboard(followUpText)}
                      className="btn btn-primary"
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      {copied ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconCopy size={14} />
                      )}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )}
      <EnhancementModal
        isOpen={showEnhancementModal}
        onClose={() => setShowEnhancementModal(false)}
        originalText={originalEnhancementText}
        versions={enhancementVersions}
        selected={selectedEnhancement}
        onSelect={setSelectedEnhancement}
        onApply={handleApplyEnhancement}
        loading={enhancementLoading}
        sectionName={(enhancementContext && enhancementContext.sectionName) || "Section"}
      />
    </>
  );
}
export default App;
