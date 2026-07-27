import React, { useState, useEffect } from 'react';
import { 
  saveToCloud, 
  loadFromCloud, 
  subscribeToAuthChanges, 
  signOutUser 
} from './firebase.js';
import AuthPage from './components/AuthPage.jsx';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Settings, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  Globe,
  Github,
  Linkedin,
  Mic,
  Award,
  BookOpen,
  Send,
  MessageSquare,
  Search,
  Zap,
  Terminal,
  Download,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Sun,
  Moon,
  LogOut,
  Upload
} from 'lucide-react';
import ResumeBuilder from './components/ResumeBuilder.jsx';
import { Toaster } from 'sonner';


const parseDateRange = (datesStr) => {
  const defaultVal = { startMonth: '01', startYear: new Date().getFullYear().toString(), endMonth: '01', endYear: new Date().getFullYear().toString(), isPresent: false };
  if (!datesStr || typeof datesStr !== 'string') return defaultVal;
  
  const parts = datesStr.split('-').map(s => s.trim());
  if (parts.length < 1) return defaultVal;
  
  const parsePart = (part) => {
    if (!part) return { month: '01', year: new Date().getFullYear().toString(), isPresent: false };
    if (part.toLowerCase() === 'present' || part.toLowerCase() === 'current') {
      return { month: '01', year: new Date().getFullYear().toString(), isPresent: true };
    }
    const sub = part.split('/');
    if (sub.length === 2) {
      return { month: sub[0].padStart(2, '0'), year: sub[1], isPresent: false };
    } else if (sub.length === 1 && sub[0].length === 4) {
      return { month: '01', year: sub[0], isPresent: false };
    }
    return { month: '01', year: new Date().getFullYear().toString(), isPresent: false };
  };
  
  const start = parsePart(parts[0]);
  const end = parts.length > 1 ? parsePart(parts[1]) : { month: '01', year: new Date().getFullYear().toString(), isPresent: true };
  
  return {
    startMonth: start.month,
    startYear: start.year,
    endMonth: end.isPresent ? '01' : end.month,
    endYear: end.isPresent ? new Date().getFullYear().toString() : end.year,
    isPresent: end.isPresent
  };
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const parseSingleDate = (datesStr) => {
  const defaultVal = { month: '01', year: new Date().getFullYear().toString() };
  if (!datesStr || typeof datesStr !== 'string') return defaultVal;
  const sub = datesStr.split('/');
  if (sub.length === 2) {
    return { month: sub[0].padStart(2, '0'), year: sub[1] };
  } else if (datesStr.length === 4) {
    return { month: '01', year: datesStr };
  }
  return defaultVal;
};

const ProjectDatePicker = ({ value, onChange }) => {
  let detectedStyle = 'none';
  if (value && typeof value === 'string' && value.trim()) {
    if (value.includes('-')) {
      detectedStyle = 'range';
    } else {
      detectedStyle = 'single';
    }
  }

  const [dateStyle, setDateStyle] = useState(detectedStyle);

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthNames = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - 30 + i).toString()).reverse();

  const handleStyleChange = (newStyle) => {
    setDateStyle(newStyle);
    if (newStyle === 'none') {
      onChange('');
    } else if (newStyle === 'single') {
      onChange(`01/${currentYear}`);
    } else if (newStyle === 'range') {
      onChange(`01/${currentYear} - Present`);
    }
  };

  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label">Project Dates</label>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          {['none', 'single', 'range'].map(style => (
            <button
              key={style}
              type="button"
              onClick={() => handleStyleChange(style)}
              style={{
                background: dateStyle === style ? 'var(--primary)' : 'none',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {style === 'none' ? 'No Date' : style === 'single' ? 'Single Date' : 'Date Range'}
            </button>
          ))}
        </div>
      </div>

      {dateStyle === 'single' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(() => {
            const parsed = parseSingleDate(value);
            return (
              <>
                <select 
                  value={parsed.month} 
                  onChange={(e) => onChange(`${e.target.value}/${parsed.year}`)}
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  {months.map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
                </select>
                <select 
                  value={parsed.year} 
                  onChange={(e) => onChange(`${parsed.month}/${e.target.value}`)}
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            );
          })()}
        </div>
      )}

      {dateStyle === 'range' && (
        <DateRangePicker value={value} onChange={onChange} />
      )}
    </div>
  );

const compileDateRange = (startMonth, startYear, endMonth, endYear, isPresent) => {
  const startStr = `${startMonth}/${startYear}`;
  const endStr = isPresent ? 'Present' : `${endMonth}/${endYear}`;
  return `${startStr} - ${endStr}`;
};

const DateRangePicker = ({ value, onChange }) => {
  const { startMonth, startYear, endMonth, endYear, isPresent } = parseDateRange(value);
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthNames = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - 30 + i).toString()).reverse();

  const handleUpdate = (updates) => {
    const updated = { startMonth, startYear, endMonth, endYear, isPresent, ...updates };
    onChange(compileDateRange(updated.startMonth, updated.startYear, updated.endMonth, updated.endYear, updated.isPresent));
  };

  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="form-label">Dates / Duration</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          value={startMonth} 
          onChange={(e) => handleUpdate({ startMonth: e.target.value })}
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'white', outline: 'none', cursor: 'pointer' }}
        >
          {months.map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
        </select>

        <select 
          value={startYear} 
          onChange={(e) => handleUpdate({ startYear: e.target.value })}
          style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'white', outline: 'none', cursor: 'pointer' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <span style={{ color: 'var(--text-muted)' }}>to</span>

        <select 
          value={endMonth} 
          disabled={isPresent}
          onChange={(e) => handleUpdate({ endMonth: e.target.value })}
          style={{ background: isPresent ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: isPresent ? 'var(--text-muted)' : 'white', outline: 'none', cursor: 'pointer' }}
        >
          {months.map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
        </select>

        <select 
          value={endYear} 
          disabled={isPresent}
          onChange={(e) => handleUpdate({ endYear: e.target.value })}
          style={{ background: isPresent ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: isPresent ? 'var(--text-muted)' : 'white', outline: 'none', cursor: 'pointer' }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', marginLeft: '8px' }}>
          <input 
            type="checkbox" 
            checked={isPresent} 
            onChange={(e) => handleUpdate({ isPresent: e.target.checked })}
            style={{ cursor: 'pointer', width: '14px', height: '14px' }}
          />
          Present / Current
        </label>
      </div>
    </div>
  );
};

// Typing Demo Component for Landing Page
function InteractiveDemo() {
  const [typedText, setTypedText] = useState('');
  const fullText = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position. With 5+ years of experience building React applications and optimizing database metrics by 40%, I am excited to contribute to your engineering team...`;
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) {
        setTimeout(() => { index = 0; }, 3000); // pause and restart
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="demo-widget">
      <div className="demo-pane">
        <div className="demo-title">📄 Candidate Resume</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <strong>Name:</strong> Steve Jobs<br/>
          <strong>Role:</strong> Product Leader<br/>
          <strong>Skills:</strong> Product Management, React, Mobile Apps<br/>
          <strong>Experience:</strong><br/>
          • CEO at Apple Inc (1997 - 2011)<br/>
          • Founder & CEO at NeXT (1985 - 1996)
        </div>
      </div>
      <div className="demo-pane" style={{ borderLeft: '1px solid var(--border-color)' }}>
        <div className="demo-title">✨ AI Cover Letter Generator</div>
        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-main)', whiteSpace: 'pre-wrap', minHeight: '120px', lineHeight: '1.4' }}>
          {typedText}
          <span className="pulse-primary" style={{ display: 'inline-block', width: '6px', height: '12px', background: 'var(--primary)' }}></span>
        </div>
      </div>
    </div>
  );
}

const cleanAchievement = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/^[-•*]\s*/, '');
};

function generateDefaultLatexTemplate(p) {
  if (!p) return '';
  const name = p.personal?.name || 'Your Name';
  const email = p.personal?.email || 'email@example.com';
  const phone = p.personal?.phone || '';
  const linkedin = p.personal?.linkedin || '';
  const github = p.personal?.github || '';
  
  let skillsLatex = '';
  if (p.skills && p.skills.length > 0) {
    skillsLatex = `\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${p.skills.join(', ')}}
    }}
 \\end{itemize}
\\vspace{-16pt}`;
  } else {
    skillsLatex = `\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: }
    }}
 \\end{itemize}
\\vspace{-16pt}`;
  }

  let workLatex = '';
  if (p.work_history && p.work_history.length > 0) {
    workLatex = `\\section{Work Experience}
  \\resumeSubHeadingListStart\n`;
    p.work_history.forEach(job => {
      const position = job.position || job.role || 'Position';
      const company = job.company || 'Company';
      const duration = job.duration || job.dates || 'Dates';
      const achievements = job.achievements || [];
      workLatex += `    \\resumeSubheading
      {${position}}{${duration}}
      {${company}}{}
      \\resumeItemListStart\n`;
      if (achievements.length > 0) {
        achievements.forEach(ach => {
          workLatex += `        \\resumeItem{${cleanAchievement(ach)}}\n`;
        });
      } else if (typeof job.description === 'string' && job.description.trim()) {
        const lines = job.description.split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
        lines.forEach(line => {
          workLatex += `        \\resumeItem{${line}}\n`;
        });
      } else {
        workLatex += `        \\resumeItem{}\n        \\resumeItem{}\n`;
      }
      workLatex += `      \\resumeItemListEnd\n\n`;
    });
    workLatex += `  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  } else {
    workLatex = `\\section{Work Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Role / Position}{Dates}
      {Company Name}{Location}
      \\resumeItemListStart
        \\resumeItem{}
        \\resumeItem{}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  }

  let projectsLatex = '';
  if (p.projects && p.projects.length > 0) {
    projectsLatex = `\\section{Projects}
  \\resumeSubHeadingListStart\n`;
    p.projects.forEach(proj => {
      const projName = proj.name || 'Project Name';
      const duration = proj.duration || proj.dates || 'Dates';
      const achievements = proj.achievements || [];
      projectsLatex += `    \\resumeProjectHeading
      {\\textbf{${projName}}}{${duration}}
      \\resumeItemListStart\n`;
      if (achievements.length > 0) {
        achievements.forEach(ach => {
          projectsLatex += `        \\resumeItem{${cleanAchievement(ach)}}\n`;
        });
      } else if (typeof proj.description === 'string' && proj.description.trim()) {
        const lines = proj.description.split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
        lines.forEach(line => {
          projectsLatex += `        \\resumeItem{${line}}\n`;
        });
      } else {
        projectsLatex += `        \\resumeItem{}\n`;
      }
      projectsLatex += `      \\resumeItemListEnd
      \\vspace{-13pt}\n\n`;
    });
    projectsLatex += `  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  } else {
    projectsLatex = `\\section{Projects}
  \\resumeSubHeadingListStart
    \\resumeProjectHeading
      {\\textbf{Project Name}}{Dates}
      \\resumeItemListStart
        \\resumeItem{}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  }

  let eduLatex = '';
  if (p.education && p.education.length > 0) {
    eduLatex = `\\section{Education}
  \\resumeSubHeadingListStart\n`;
    p.education.forEach(edu => {
      const inst = edu.institution || edu.school || 'University Name';
      const degree = edu.degree || edu.field_of_study || 'Degree';
      const duration = edu.duration || edu.date || edu.graduation || 'Dates';
      eduLatex += `    \\resumeSubheading
      {${inst}}{${duration}}
      {${degree}}{}\n`;
    });
    eduLatex += `  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  } else {
    eduLatex = `\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {University Name}{Dates}
      {Degree}{}
  \\resumeSubHeadingListEnd
\\vspace{-16pt}`;
  }

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
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titrule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{
    {#1 \\vspace{-2pt}}
  }}
}

\\newcommand{\\classesList}[4]{
    \\item\\small{{
        {#1 #2 #3 #4 \\vspace{-2pt}}
  }}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.15in, label=$\\vcenter{\\hbox{\\tiny$\\bullet$}}$]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    {\\Huge \\scshape ${name}} \\\\ \\vspace{4pt}
    \\small
    ${phone ? phone + ' \\;\\textbar\\; ' : ''}
    \\href{mailto:${email}}{${email}}
    ${linkedin ? ' \\;\\textbar\\; \\href{' + linkedin + '}{LinkedIn}' : ''}
    ${github ? ' \\;\\textbar\\; \\href{' + github + '}{GitHub}' : ''}
    \\vspace{-6pt}
\\end{center}

%-----------PROFESSIONAL SUMMARY-----------
\\section{Professional Summary}
${p.summary || ''}

%-----------TECHNICAL SKILLS-----------
${skillsLatex}

%-----------WORK EXPERIENCE-----------
${workLatex}

%-----------PROJECTS-----------
${projectsLatex}

%-----------EDUCATION-----------
${eduLatex}

\\end{document}`;
}

export default function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' or 'dashboard'
  const [activeTab, setActiveTab] = useState('overview');
  const [saveAlert, setSaveAlert] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ai_apply_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai_apply_theme', theme);
  }, [theme]);
  
  // BYOK Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_apply_api_key') || '');
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Firebase Configuration & State
  const [firebaseConfig, setFirebaseConfig] = useState(() => localStorage.getItem('ai_apply_firebase_config') || '');
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [appMode, setAppMode] = useState(() => localStorage.getItem('ai_apply_app_mode') || 'hybrid');

  // Firebase Auth Session State
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [skipAuth, setSkipAuth] = useState(() => localStorage.getItem('ai_apply_skip_auth') === 'true');

  // Sync skipAuth changes to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_skip_auth', skipAuth ? 'true' : 'false');
  }, [skipAuth]);

  // Subscribe to Firebase Authentication changes
  useEffect(() => {
    if (!firebaseConfig) {
      setAuthLoading(false);
      setAuthUser(null);
      return;
    }
    
    setAuthLoading(true);
    try {
      const unsubscribe = subscribeToAuthChanges(firebaseConfig, (user) => {
        setAuthUser(user);
        setAuthLoading(false);
        if (user) {
          setSkipAuth(false);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Auth subscription error:", e);
      setAuthLoading(false);
    }
  }, [firebaseConfig]);

  // Multiple Profiles State
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('ai_apply_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    
    // Check if there was an old single profile saved
    const oldSaved = localStorage.getItem('ai_apply_profile');
    let oldProfileData = null;
    if (oldSaved) {
      try { oldProfileData = JSON.parse(oldSaved); } catch (e) {}
    }
    
    const defaultProfile = {
      id: 'default',
      name: 'Default Profile',
      personal: oldProfileData?.personal || {
        name: '',
        email: '',
        phone: '',
        website: '',
        github: '',
        linkedin: '',
        location: ''
      },
      summary: oldProfileData?.summary || '',
      skills: oldProfileData?.skills || [],
      work_history: oldProfileData?.work_history || [
        {
          role: '',
          company: '',
          dates: '',
          description: ''
        }
      ]
    };
    return [defaultProfile];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('ai_apply_active_profile_id') || 'default';
  });

  // Derived active profile with safety fallback
  const defaultProfileStructure = {
    id: 'default',
    name: 'Default Profile',
    personal: {
      name: '',
      email: '',
      phone: '',
      website: '',
      github: '',
      linkedin: '',
      location: ''
    },
    summary: '',
    skills: [],
    work_history: [],
    projects: [],
    education: [],
    resumes: []
  };

  const rawProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || defaultProfileStructure;
  
  const profile = {
    ...defaultProfileStructure,
    ...rawProfile,
    personal: {
      ...defaultProfileStructure.personal,
      ...(rawProfile?.personal || {})
    }
  };

  // Derived resumes list (ensures backward compatibility)
  const candidateResumes = profile.resumes && profile.resumes.length > 0 ? profile.resumes : [
    {
      id: 'default_resume',
      name: 'Primary Resume',
      summary: profile.summary || '',
      skills: profile.skills || [],
      work_history: profile.work_history || [],
      education: profile.education || [],
      projects: profile.projects || []
    }
  ];
  const activeResumeId = rawProfile?.activeResumeId || 'default_resume';

  // Custom setter wrapper to keep compatibility with existing form handlers
  const setProfile = (arg) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        const nextProfile = typeof arg === 'function' ? arg(p) : arg;
        
        // Mirror top-level edits to the active resume item in lists
        const activeId = nextProfile.activeResumeId || 'default_resume';
        const list = nextProfile.resumes || [
          {
            id: 'default_resume',
            name: 'Primary Resume',
            summary: p.summary || '',
            skills: p.skills || [],
            work_history: p.work_history || [],
            education: p.education || [],
            projects: p.projects || []
          }
        ];
        
        const updatedResumes = list.map(r => {
          if (r.id === activeId) {
            return {
              ...r,
              summary: nextProfile.summary || '',
              skills: nextProfile.skills || [],
              work_history: nextProfile.work_history || [],
              education: nextProfile.education || [],
              projects: nextProfile.projects || []
            };
          }
          return r;
        });

        return {
          ...nextProfile,
          id: p.id,
          name: p.name,
          resumes: updatedResumes
        };
      }
      return p;
    }));
  };

  const handleAddWorkHistory = () => {
    setProfile(prev => ({
      ...prev,
      work_history: [
        ...(prev.work_history || []),
        { role: '', company: '', dates: '', description: '' }
      ]
    }));
  };

  const handleRemoveWorkHistory = (index) => {
    setProfile(prev => {
      const list = [...(prev.work_history || [])];
      list.splice(index, 1);
      return { ...prev, work_history: list };
    });
  };

  const handleAddEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { institution: '', degree: '', duration: '' }
      ]
    }));
  };

  const handleRemoveEducation = (index) => {
    setProfile(prev => {
      const list = [...(prev.education || [])];
      list.splice(index, 1);
      return { ...prev, education: list };
    });
  };

  const handleAddProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { name: '', duration: '', description: '' }
      ]
    }));
  };

  const handleRemoveProject = (index) => {
    setProfile(prev => {
      const list = [...(prev.projects || [])];
      list.splice(index, 1);
      return { ...prev, projects: list };
    });
  };

  const handleActiveResumeChange = (resumeId) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        const list = p.resumes || [
          {
            id: 'default_resume',
            name: 'Primary Resume',
            summary: p.summary || '',
            skills: p.skills || [],
            work_history: p.work_history || [],
            education: p.education || [],
            projects: p.projects || []
          }
        ];
        const targetResume = list.find(r => r.id === resumeId) || list[0];
        return {
          ...p,
          activeResumeId: targetResume.id,
          summary: targetResume.summary,
          skills: targetResume.skills,
          work_history: targetResume.work_history,
          education: targetResume.education,
          projects: targetResume.projects || [],
          resumes: list
        };
      }
      return p;
    }));
  };

  const handleDeleteResume = (resumeId) => {
    const list = profile.resumes || [
      {
        id: 'default_resume',
        name: 'Primary Resume',
        summary: profile.summary || '',
        skills: profile.skills || [],
        work_history: profile.work_history || [],
        education: profile.education || [],
        projects: profile.projects || []
      }
    ];
    if (list.length <= 1) {
      alert("You must keep at least one resume version.");
      return;
    }
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    const remaining = list.filter(r => r.id !== resumeId);
    const nextActiveId = remaining[0].id;
    const target = remaining[0];
    
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          activeResumeId: nextActiveId,
          summary: target.summary,
          skills: target.skills,
          work_history: target.work_history,
          education: target.education,
          projects: target.projects || [],
          resumes: remaining
        };
      }
      return p;
    }));
  };

  // Tracked applications list
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('ai_apply_applications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Resume Parsing Progress
  const [parsing, setParsing] = useState(false);

  // Tailoring Context States
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem('ai_apply_job_description') || '');
  const [targetCompany, setTargetCompany] = useState(() => localStorage.getItem('ai_apply_job_company') || 'Markel Group');
  const [targetJobTitle, setTargetJobTitle] = useState(() => localStorage.getItem('ai_apply_job_title') || 'Generative AI Engineer');
  const [showGlobalJobEdit, setShowGlobalJobEdit] = useState(false);
  const [tailoringSubTab, setTailoringSubTab] = useState('resume'); // 'resume' | 'coverletter' | 'outreach'
  const [showRawLatexPane, setShowRawLatexPane] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // ATS Optimizer State
  const [atsScoreData, setAtsScoreData] = useState(null);
  const [scoring, setScoring] = useState(false);
  const [tailoredResumeMd, setTailoredResumeMd] = useState('');
  const [tailoring, setTailoring] = useState(false);

  // Career Templates State
  const [careerTemplateType, setCareerTemplateType] = useState('STAR Story');
  const [careerExtraContext, setCareerExtraContext] = useState('');
  const [careerDraft, setCareerDraft] = useState('');
  const [careerWriting, setCareerWriting] = useState(false);

  // Mock Interview Coach State
  const [mockQuestions, setMockQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(null);
  const [candidateAnswerText, setCandidateAnswerText] = useState('');
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [grading, setGrading] = useState(false);

  // Voice AI Practice Interview States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voicePhase, setVoicePhase] = useState('setup');
  const [voiceType, setVoiceType] = useState('Technical');
  const [voiceDifficulty, setVoiceDifficulty] = useState('Mid');
  const [voiceRole, setVoiceRole] = useState('Software Engineer');
  const [voiceConversation, setConversation] = useState([]);
  const [voiceRoomState, setVoiceRoomState] = useState('loading');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceAIText, setVoiceAIText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState(null);
  const [currentVoiceTurn, setCurrentVoiceTurn] = useState(1);

  // Job Search Feed State
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobSearchLocation, setJobSearchLocation] = useState('Remote');
  const [filterSource, setFilterSource] = useState('All');
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [filterLocation, setFilterLocation] = useState('');
  const [jobListings, setJobListings] = useState([]);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [personalizedSearch, setPersonalizedSearch] = useState(true);

  // One-Click Apply Modal State
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyingLogs, setApplyingLogs] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  // Interactive Job Tracker States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCompany, setManualCompany] = useState('');
  const [manualJobTitle, setManualJobTitle] = useState('');
  const [manualStatus, setManualStatus] = useState('Applied');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [followUpApp, setFollowUpApp] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState('');

  // LaTeX Resume Generator States
  const [latexPasscode, setLatexPasscode] = useState(() => localStorage.getItem('ai_apply_latex_passcode') || '');
  const [generatedLatexResume, setGeneratedLatexResume] = useState('');
  const [latexAtsScore, setLatexAtsScore] = useState(null);
  const [generatingLatex, setGeneratingLatex] = useState(false);
  const [latexTemplate, setLatexTemplate] = useState(() => localStorage.getItem('ai_apply_latex_template') || `\\documentclass[letterpaper,11pt]{article}

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
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\titrule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{{
    {#1 \\vspace{-2pt}}
  }}
}

\\newcommand{\\classesList}[4]{
    \\item\\small{{
        {#1 #2 #3 #4 \\vspace{-2pt}}
  }}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={{}}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{{document}}

\\begin{{center}}
    {{\\Huge \\scshape Sumanth Gadiraju}} \\\\ \\vspace{4pt}
    
    \\small
    Herndon, VA 20171 \\;\\textbar\\;
    +1 (571) 250-9873 \\;\\textbar\\;
    \\href{{mailto:sumanth.g3009@gmail.com}}{{sumanth.g3009@gmail.com}} \\;\\textbar\\;
    \\href{{https://www.linkedin.com/in/sumanth-g3009/}}{{LinkedIn}} \\;\\textbar\\;
    \\href{{https://github.com/sumanthvarma27}}{{GitHub}}
    
    \\vspace{-6pt}
\\end{{center}}

%-----------PROFESSIONAL SUMMARY-----------
\\section{{Professional Summary}}


%-----------TECHNICAL SKILLS-----------
\\section{{Technical Skills}}
 \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
     \\textbf{{Languages}}{{: }} \\\\
     \\textbf{{ML \\& Data Science}}{{: }} \\\\
     \\textbf{{Signal Processing \\& Sensing}}{{: }} \\\\
     \\textbf{{Databases \\& Data}}{{: }} \\\\
     \\textbf{{Cloud \\& MLOps}}{{: }} \\\\
     \\textbf{{Tools \\& Frameworks}}{{: }} \\\\
    }}}}
 \\end{{itemize}}
\\vspace{-16pt}
%-----------WORK EXPERIENCE-----------
\\section{{Work Experience}}
  \\resumeSubHeadingListStart

    \\resumeSubheading
      {{Generative AI Engineer}}{{05/25 -- Present}}
      {{Markel Group}}{{Richmond, VA}}
      \\resumeItemListStart
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
      \\resumeItemListEnd

    \\resumeSubheading
      {{Machine Learning Engineer}}{{11/23 -- 04/25}}
      {{Mars Global}}{{McLean, VA}}
      \\resumeItemListStart
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
      \\resumeItemListEnd

     \\resumeSubheading
      {{Data Scientist}}{{07/22 -- 07/23}}
      {{Fourrts}}{{Chennai, India}}
      \\resumeItemListStart
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
      \\resumeItemListEnd

      \\resumeSubheading
      {{Data Scientist}}{{05/20 -- 06/22}}
      {{Five Star Business Finance Limited}}{{Chennai, India}}
      \\resumeItemListStart
        \\resumeItem{{}}
        \\resumeItem{{}}
        \\resumeItem{{}}
      \\resumeItemListEnd

  \\resumeSubHeadingListEnd
\\vspace{-16pt}

%-----------PROJECTS-----------
\\section{{Projects}}
    \\vspace{-5pt}
    \\resumeSubHeadingListStart
      \\resumeProjectHeading
          {{\\textbf{{Project 1}} $|$ \\emph{{skill 1, skill2, skill 3}}}}{{Year matching to work exp}}
          \\resumeItemListStart
            \\resumeItem{{}}
            \\resumeItem{{}}
          \\resumeItemListEnd
          \\vspace{-13pt}


\\resumeProjectHeading
          {{\\textbf{{Project 2}} $|$ \\emph{{skill 1, skill2, skill 3}}}}{{Year matching to work exp}}
          \\resumeItemListStart
            \\resumeItem{{}}
            \\resumeItem{{}}
          \\resumeItemListEnd
\\resumeProjectHeading
          {{\\textbf{{Project 3}} $|$ \\emph{{skill 1, skill2, skill 3}}}}{{Year matching to work exp}}
          \\resumeItemListStart
            \\resumeItem{{}}
            \\resumeItem{{}}
          \\resumeItemListEnd
        \\resumeSubHeadingListEnd
%-----------EDUCATION-----------
\\section{{Education}}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {{George Mason University}}{{05/25}}
      {{Master of Science in Computer Science}}{{Fairfax, VA}}
  \\resumeSubHeadingListEnd


%-----------CERTIFICATIONS-----------
\\section{{Certifications}}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {{Certification 1}}{{Year}}
      {{Company}}{{}}
    \\resumeSubheading
      {{Certification 2}}{{Year}}
      {{Company}}{{}}
  \\resumeSubHeadingListEnd

\\end{{document}}`);

  // Personalized Outreach Generator States
  const [outreachName, setOutreachName] = useState('');
  const [outreachTitle, setOutreachTitle] = useState('');
  const [outreachAbout, setOutreachAbout] = useState('');
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState(null);

  // Sync profiles and active profile ID to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_job_company', targetCompany);
  }, [targetCompany]);

  useEffect(() => {
    localStorage.setItem('ai_apply_profiles', JSON.stringify(profiles));
    localStorage.setItem('ai_apply_profile', JSON.stringify(profile));
  }, [profiles, activeProfileId, profile]);

  useEffect(() => {
    localStorage.setItem('ai_apply_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  // Sync applications list to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_applications', JSON.stringify(applications));
  }, [applications]);

  // Sync API Key to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_api_key', apiKey);
  }, [apiKey]);

  // Sync Automation Mode to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_app_mode', appMode);
  }, [appMode]);

  // Sync Firebase config to localStorage
  useEffect(() => {
    localStorage.setItem('ai_apply_firebase_config', firebaseConfig);
  }, [firebaseConfig]);

  useEffect(() => {
    localStorage.setItem('ai_apply_latex_passcode', latexPasscode);
  }, [latexPasscode]);

  useEffect(() => {
    localStorage.setItem('ai_apply_latex_template', latexTemplate);
  }, [latexTemplate]);

  useEffect(() => {
    localStorage.setItem('ai_apply_job_description', jobDescription);
  }, [jobDescription]);

  useEffect(() => {
    localStorage.setItem('ai_apply_job_title', targetJobTitle);
  }, [targetJobTitle]);

  useEffect(() => {
    const handleSyncEvent = () => {
      console.log("[AI-Apply Web Sync] Received custom sync event from extension. Reloading context parameters...");
      setJobDescription(localStorage.getItem('ai_apply_job_description') || '');
      setTargetCompany(localStorage.getItem('ai_apply_job_company') || 'Markel Group');
      setTargetJobTitle(localStorage.getItem('ai_apply_job_title') || 'Generative AI Engineer');
    };
    window.addEventListener('ai_apply_sync', handleSyncEvent);
    return () => window.removeEventListener('ai_apply_sync', handleSyncEvent);
  }, []);

  // --- Firebase Cloud Syncing Handlers ---
  // 1. Pull data from Firestore on startup / login
  useEffect(() => {
    if (!firebaseConfig || !authUser) return;
    
    const pullData = async () => {
      try {
        const data = await loadFromCloud(firebaseConfig, 'users', authUser.uid);
        if (data) {
          console.log("[Firebase] Successfully retrieved cloud data.");
          if (data.profiles && Array.isArray(data.profiles)) {
            setProfiles(data.profiles);
          }
          if (data.activeProfileId) {
            setActiveProfileId(data.activeProfileId);
          }
          if (data.applications && Array.isArray(data.applications)) {
            setApplications(data.applications);
          }
          if (data.apiKey) {
            setApiKey(data.apiKey);
          }
        }
      } catch (err) {
        console.warn("[Firebase] Initial load failed: ", err);
      }
    };
    
    pullData();
  }, [firebaseConfig, authUser]);

  // 2. Debounced save to Firestore on local state changes
  useEffect(() => {
    if (!firebaseConfig || !authUser) return;
    
    const timeout = setTimeout(async () => {
      setCloudSyncing(true);
      try {
        await saveToCloud(firebaseConfig, 'users', authUser.uid, {
          profiles,
          activeProfileId,
          applications,
          apiKey
        });
        console.log("[Firebase Cloud Sync] Auto-saved changes.");
      } catch (err) {
        console.warn("[Firebase] Save failed: ", err);
      } finally {
        setCloudSyncing(false);
      }
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [profiles, activeProfileId, applications, apiKey, firebaseConfig, authUser]);

  // Listen for storage changes from the extension's two-way sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ai_apply_app_mode') {
        setAppMode(e.newValue || 'hybrid');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Run initial job search automatically when Job Board tab opens
  useEffect(() => {
    if (activeTab === 'job-board') {
      searchJobListings();
    }
  }, [activeTab]);



  const downloadCoverLetterPdf = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5005/api/generate-cover-letter-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.personal?.name || 'Candidate',
          email: profile.personal?.email || '',
          phone: profile.personal?.phone || '',
          linkedin: profile.personal?.linkedin || '',
          github: profile.personal?.github || '',
          companyName: targetCompany,
          text: generatedLetter
        })
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(profile.personal?.name || 'Candidate').replace(/\s+/g, '_')}_CoverLetter.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("PDF download failed: " + err.message);
    }
  };

  const downloadCoverLetterLatex = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5005/api/generate-latex-tex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.personal?.name || 'Candidate',
          email: profile.personal?.email || 'email@example.com',
          phone: profile.personal?.phone || '',
          linkedin: profile.personal?.linkedin || '',
          github: profile.personal?.github || '',
          companyName: targetCompany,
          text: generatedLetter
        })
      });
      if (!response.ok) throw new Error("Failed to generate LaTeX");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(profile.personal?.name || 'Candidate').replace(/\s+/g, '_')}_CoverLetter.tex`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("LaTeX download failed: " + err.message);
    }
  };

  const handleProfileChange = (section, fieldOrIndex, valueOrSubfield, subfieldKey) => {
    setProfile(prev => {
      const updated = { ...prev };
      if (subfieldKey !== undefined) {
        const list = [...(updated[section] || [])];
        list[fieldOrIndex] = { ...list[fieldOrIndex], [subfieldKey]: valueOrSubfield };
        updated[section] = list;
      } else {
        if (fieldOrIndex === null) {
          updated[section] = valueOrSubfield;
        } else {
          updated[section] = { 
            ...(updated[section] || {}), 
            [fieldOrIndex]: valueOrSubfield 
          };
        }
      }
      return updated;
    });
  };

  const handleCreateProfile = () => {
    const name = prompt("Enter a name for the new candidate profile (e.g. 'Backend Engineer'):");
    if (!name) return;
    const newId = Date.now().toString();
    const newProfile = {
      id: newId,
      name: name,
      personal: {
        name: '',
        email: '',
        phone: '',
        website: '',
        github: '',
        linkedin: '',
        location: ''
      },
      summary: '',
      skills: [],
      work_history: [
        {
          role: '',
          company: '',
          dates: '',
          description: ''
        }
      ]
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newId);
  };

  const handleDeleteProfile = (id) => {
    if (profiles.length <= 1) {
      alert("You must keep at least one profile.");
      return;
    }
    if (!confirm("Are you sure you want to delete this profile?")) return;
    const remaining = profiles.filter(p => p.id !== id);
    setProfiles(remaining);
    if (activeProfileId === id) {
      setActiveProfileId(remaining[0].id);
    }
  };

  const handleRenameProfile = (id, currentName) => {
    const name = prompt("Enter a new name for the profile:", currentName);
    if (!name) return;
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name: name };
      }
      return p;
    }));
  };

  const handleSaveNotification = () => {
    setSaveAlert(true);
    setTimeout(() => setSaveAlert(false), 3000);
  };

  // PDF Resume parsing handler
  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!apiKey) {
      alert("Please add your Gemini API Key in the Settings tab first to parse resumes.");
      return;
    }

    const resumeName = prompt("Enter a label for this resume version (e.g. 'Frontend Dev', 'ML Specialist'):", file.name.replace(".pdf", ""));
    if (!resumeName) return;

    setParsing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://127.0.0.1:5005/api/parse-resume', {
          method: 'POST',
          headers: {
            'X-Gemini-Key': apiKey
          },
          body: formData
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to parse resume");
        }

        const parsedProfile = await response.json();
        
        const normalizedWorkHistory = (parsedProfile.work_history || []).map(work => {
          let achievements = [];
          if (work.achievements) {
            achievements = Array.isArray(work.achievements) ? work.achievements : [work.achievements];
          } else if (work.description) {
            achievements = typeof work.description === 'string' 
              ? work.description.split('\n').map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
              : [];
          }
          return {
            position: work.position || work.role || '',
            company: work.company || '',
            duration: work.duration || work.dates || '',
            achievements: achievements
          };
        });

        const normalizedEducation = (parsedProfile.education || []).map(edu => ({
          institution: edu.institution || edu.school || '',
          degree: edu.degree || edu.field_of_study || '',
          duration: edu.duration || edu.dates || edu.date || edu.graduation || ''
        }));

        const normalizedProjects = (parsedProfile.projects || []).map(proj => {
          let achievements = [];
          if (proj.achievements) {
            achievements = Array.isArray(proj.achievements) ? proj.achievements : [proj.achievements];
          } else if (proj.description) {
            achievements = typeof proj.description === 'string'
              ? proj.description.split('\n').map(s => s.trim().replace(/^[-*]\s*/, '')).filter(Boolean)
              : [];
          }
          return {
            name: proj.name || '',
            dates: proj.dates || proj.duration || '',
            achievements: achievements,
            description: proj.description || achievements.join('\n')
          };
        });

        setProfiles(prev => prev.map(p => {
          if (p.id === activeProfileId) {
            const list = p.resumes || [
              {
                id: 'default_resume',
                name: 'Primary Resume',
                summary: p.summary || '',
                skills: p.skills || [],
                work_history: p.work_history || [],
                education: p.education || [],
                projects: p.projects || []
              }
            ];
            const newResume = {
              id: Date.now().toString(),
              name: resumeName,
              summary: parsedProfile.summary || '',
              skills: parsedProfile.skills || [],
              work_history: normalizedWorkHistory,
              education: normalizedEducation,
              projects: normalizedProjects,
              pdfBase64: base64Data
            };
            return {
              ...p,
              activeResumeId: newResume.id,
              summary: newResume.summary,
              skills: newResume.skills,
              work_history: newResume.work_history,
              education: newResume.education,
              projects: newResume.projects,
              resumes: [...list, newResume]
            };
          }
          return p;
        }));

        handleSaveNotification();
      } catch (e) {
        alert("Error parsing resume: " + e.message);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Verify BYOK API Key
  const verifyApiKey = async () => {
    if (!apiKey) return;
    setVerifying(true);
    setApiKeyVerified(false);
    
    try {
      const response = await fetch('http://127.0.0.1:5005/api/solve-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          questions: ["Hi! Verify connection."]
        })
      });

      if (response.ok) {
        setApiKeyVerified(true);
      } else {
        try {
          const errData = await response.json();
          alert(`Verification failed: ${errData.error || "Unknown error"}`);
        } catch (e) {
          alert("Invalid API key or backend connection failure. Please confirm backend server is running on port 5005.");
        }
      }
    } catch (e) {
      alert("Error contacting local server. Verify that `python app.py` is running on port 5005.");
    } finally {
      setVerifying(false);
    }
  };

  // Generate Tailored Cover Letter
  const generateLetterSubmit = async () => {
    if (!apiKey) {
      setGenError("Please configure your Gemini API Key in Settings first.");
      return;
    }
    if (!jobDescription) {
      setGenError("Please paste a Job Description.");
      return;
    }

    setGenerating(true);
    setGenError('');
    setGeneratedLetter('');

    try {
      const response = await fetch('http://127.0.0.1:5005/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobDescription: jobDescription,
          companyName: targetCompany,
          passcode: latexPasscode
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed generation");
      }

      const resJson = await response.json();
      setGeneratedLetter(resJson.coverLetter || '');
      
      // Log to tracker
      setApplications(prev => [
        {
          id: Date.now(),
          company: targetCompany,
          title: 'Custom Role (Studio)',
          status: 'Drafting',
          date: new Date().toISOString().split('T')[0]
        },
        ...prev
      ]);
    } catch (e) {
      setGenError(e.message || "Failed to contact local AI engine.");
    } finally {
      setGenerating(false);
    }
  };

  // Run ATS Resume Optimization Match Scorer
  const runAtsScoring = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    if (!jobDescription) { alert("Please paste the target Job Description."); return; }

    setScoring(true);
    setAtsScoreData(null);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/ats-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobDescription: jobDescription
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed ATS evaluation");
      }

      const scoreRes = await response.json();
      setAtsScoreData(scoreRes);
    } catch (e) {
      alert("ATS Optimization Error: " + e.message);
    } finally {
      setScoring(false);
    }
  };

  // Generate Tailored Markdown Resume
  const tailorAndDownloadResume = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    if (!jobDescription) { alert("Please paste the target Job Description."); return; }

    setTailoring(true);
    try {
      const response = await fetch('http://127.0.0.1:5005/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobDescription: jobDescription
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed tailoring");
      }

      const resJson = await response.json();
      setTailoredResumeMd(resJson.markdown || '');

      // Trigger markdown file download
      const element = document.createElement("a");
      const file = new Blob([resJson.markdown || ''], { type: 'text/markdown' });
      element.href = URL.createObjectURL(file);
      element.download = `${profile.personal.name || 'Tailored'}_Resume.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      alert("Tailoring Error: " + e.message);
    } finally {
      setTailoring(false);
    }
  };

  // Run Career template compiler (STAR, Outreach, Negotiations)
  const compileCareerTemplate = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    
    setCareerWriting(true);
    setCareerDraft('');

    try {
      const response = await fetch('http://127.0.0.1:5005/api/career-write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          templateType: careerTemplateType,
          extraContext: careerExtraContext,
          passcode: latexPasscode
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed templates compiling");
      }

      const resData = await response.json();
      setCareerDraft(resData.text || '');
    } catch (e) {
      alert("Career compiler error: " + e.message);
    } finally {
      setCareerWriting(false);
    }
  };

  const generateLatexResumeSubmit = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    if (!jobDescription) { alert("Please paste the target Job Description."); return; }
    if (!latexTemplate) { alert("LaTeX Template is empty."); return; }

    setGeneratingLatex(true);
    setGeneratedLatexResume('');
    setLatexAtsScore(null);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/generate-latex-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobDescription: jobDescription,
          latexTemplate: latexTemplate
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed LaTeX Resume generation");
      }

      const resJson = await response.json();
      setGeneratedLatexResume(resJson.latex || '');
      setLatexAtsScore(resJson.atsScore || null);

      if (resJson.tailoredResumeData) {
        setProfiles(prev => prev.map(p => {
          if (p.id === activeProfileId) {
            const list = p.resumes || [];
            const activeId = p.activeResumeId || 'default_resume';
            const updatedResumes = list.map(r => {
              if (r.id === activeId) {
                return {
                  ...r,
                  personal: { ...r.personal, ...resJson.tailoredResumeData.personal },
                  skills: resJson.tailoredResumeData.skills || r.skills,
                  work_history: resJson.tailoredResumeData.work_history || r.work_history,
                  projects: resJson.tailoredResumeData.projects || r.projects,
                  education: resJson.tailoredResumeData.education || r.education
                };
              }
              return r;
            });
            const activeRes = updatedResumes.find(r => r.id === activeId);
            return {
              ...p,
              resumes: updatedResumes,
              personal: { ...p.personal, ...resJson.tailoredResumeData.personal },
              skills: activeRes?.skills || p.skills,
              work_history: activeRes?.work_history || p.work_history,
              projects: activeRes?.projects || p.projects,
              education: activeRes?.education || p.education
            };
          }
          return p;
        }));
      }
    } catch (e) {
      alert("LaTeX Resume Studio Error: " + e.message);
    } finally {
      setGeneratingLatex(false);
    }
  };

  const generateOutreachSubmit = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    if (!outreachName) { alert("Please provide the contact person's name."); return; }
    if (!outreachTitle) { alert("Please provide the contact's title/role."); return; }

    setGeneratingOutreach(true);
    setOutreachResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/generate-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          contactName: outreachName,
          contactTitle: outreachTitle,
          contactAbout: outreachAbout,
          passcode: latexPasscode
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed outreach generation");
      }

      const resJson = await response.json();
      setOutreachResult(resJson);
    } catch (e) {
      alert("Outreach Studio Error: " + e.message);
    } finally {
      setGeneratingOutreach(false);
    }
  };

  // Run Mock Interview Question Generation
  const runMockQuestionGeneration = async () => {
    if (!apiKey) { alert("Please configure your Gemini API Key in Settings first."); return; }
    if (!jobDescription) { alert("Please paste a target Job Description."); return; }

    setGeneratingQuestions(true);
    setMockQuestions([]);
    setSelectedQuestionIdx(null);
    setCandidateAnswerText('');
    setGradingResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/mock-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobDescription: jobDescription
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed mock generation");
      }

      const resData = await response.json();
      setMockQuestions(resData.questions || []);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Speech Recognition wrapper for Mock Coach responses
  const triggerSpeechAnswerCapture = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser version. Please type your response.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecordingAnswer(true);
    };
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setCandidateAnswerText(prev => (prev ? prev + " " : "") + text);
    };

    recognition.onerror = (e) => {
      setIsRecordingAnswer(false);
      alert("Speech capturing failed: " + e.error);
    };

    recognition.onend = () => {
      setIsRecordingAnswer(false);
    };

    recognition.start();
  };

  // ── VOICE AI PRACTICE INTERVIEW LOGIC ──
  let recognitionRef = null;

  const speakTextOutLoud = (text, onEnd) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser version.");
      return;
    }
    
    recognitionRef = new SpeechRecognition();
    recognitionRef.continuous = true;
    recognitionRef.interimResults = false;
    recognitionRef.lang = 'en-US';

    recognitionRef.onstart = () => {
      setVoiceRoomState('listening');
    };

    recognitionRef.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setVoiceTranscript(prev => (prev ? prev + " " : "") + text);
    };

    recognitionRef.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.error("Speech Recognition Error:", e.error);
      }
    };

    recognitionRef.start();
  };

  const stopVoiceSpeechRecognition = () => {
    if (recognitionRef) {
      try { recognitionRef.stop(); } catch (e) {}
      recognitionRef = null;
    }
  };

  const beginVoiceInterview = async () => {
    if (!apiKey) { alert("API key missing. Load in settings."); return; }
    setConversation([]);
    setVoicePhase('room');
    setVoiceRoomState('loading');
    setVoiceTranscript('');
    setVoiceAIText('');
    setCurrentVoiceTurn(1);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/practice-interview/ai-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          conversation: [],
          role: voiceRole,
          interviewType: voiceType,
          difficulty: voiceDifficulty,
          turnNumber: 1,
          totalTurns: 5,
          jobDescription: jobDescription
        })
      });

      if (!response.ok) throw new Error("Voice turn generation failed");
      const resData = await response.json();
      
      const text = resData.text;
      setVoiceAIText(text);
      setConversation([{ role: 'ai', text }]);
      setVoiceRoomState('ai-speaking');
      
      speakTextOutLoud(text, () => {
        startVoiceSpeechRecognition();
      });
    } catch (e) {
      alert("Voice error: " + e.message);
      setVoicePhase('setup');
    }
  };

  const submitVoiceTurn = async () => {
    stopVoiceSpeechRecognition();
    setVoiceRoomState('processing');

    const updatedConv = [
      ...voiceConversation,
      { role: 'user', text: voiceTranscript }
    ];
    setConversation(updatedConv);

    if (currentVoiceTurn >= 5) {
      // End session, evaluate feedback
      try {
        const response = await fetch('http://127.0.0.1:5005/api/practice-interview/final-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': apiKey
          },
          body: JSON.stringify({
            conversation: updatedConv,
            role: voiceRole,
            interviewType: voiceType
          })
        });

        if (!response.ok) throw new Error("Evaluation failed");
        const fb = await response.json();
        setVoiceFeedback(fb);
        setVoicePhase('results');
      } catch (e) {
        alert("Evaluation failed: " + e.message);
        setVoicePhase('setup');
      }
    } else {
      const nextTurn = currentVoiceTurn + 1;
      setCurrentVoiceTurn(nextTurn);
      setVoiceTranscript('');

      try {
        const response = await fetch('http://127.0.0.1:5005/api/practice-interview/ai-turn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': apiKey
          },
          body: JSON.stringify({
            conversation: updatedConv,
            role: voiceRole,
            interviewType: voiceType,
            difficulty: voiceDifficulty,
            turnNumber: nextTurn,
            totalTurns: 5,
            jobDescription: jobDescription
          })
        });

        if (!response.ok) throw new Error("Voice turn generation failed");
        const resData = await response.json();
        
        const text = resData.text;
        setVoiceAIText(text);
        setConversation([...updatedConv, { role: 'ai', text }]);
        setVoiceRoomState('ai-speaking');
        
        speakTextOutLoud(text, () => {
          startVoiceSpeechRecognition();
        });
      } catch (e) {
        alert("Voice turn failed: " + e.message);
        setVoicePhase('setup');
      }
    }
  };

  const endVoiceSession = () => {
    stopVoiceSpeechRecognition();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setVoicePhase('setup');
  };

  // Submit Answer to Coach Grading Engine
  const runAnswerGrading = async () => {
    if (!apiKey) { alert("API key missing."); return; }
    if (selectedQuestionIdx === null || !candidateAnswerText) { alert("Select a question and answer it first."); return; }

    setGrading(true);
    setGradingResult(null);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/mock-coach/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          question: mockQuestions[selectedQuestionIdx],
          answer: candidateAnswerText,
          resumeData: profile
        })
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed answer grading");
      }

      const gradeRes = await response.json();
      setGradingResult(gradeRes);
    } catch (e) {
      alert("Grading failed: " + e.message);
    } finally {
      setGrading(false);
    }
  };

  // Search listings from RemoteOK Feed
  const searchJobListings = async () => {
    setSearchingJobs(true);
    setJobListings([]);
    try {
      let query = jobSearchQuery;
      let location = 'Remote';
      let skills = '';

      if (personalizedSearch) {
        if (!query && profile?.work_history && profile.work_history.length > 0) {
          query = profile.work_history[0].role;
        }
        if (profile?.personal?.location) {
          location = profile.personal.location;
        }
        if (profile?.skills && profile.skills.length > 0) {
          skills = profile.skills.join(',');
        }
      }

      if (!query) query = 'Software Engineer';

      const response = await fetch(`http://127.0.0.1:5005/api/search-jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&skills=${encodeURIComponent(skills)}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      const list = await response.json();
      setJobListings(list);
    } catch (e) {
      alert("Job board error: " + e.message);
    } finally {
      setSearchingJobs(false);
    }
  };

  // One-Click Background auto apply trigger
  const runOneClickApply = async (job) => {
    if (!apiKey) { alert("Configure API Key in Settings first."); return; }
    setApplyingJobId(job.id);
    setIsApplying(true);
    setApplyResult(null);
    setApplyingLogs(["[AUTO-APPLY] Spawning headless Playwright browser thread...", `[AUTO-APPLY] Querying URL: ${job.url}`]);

    try {
      const response = await fetch('http://127.0.0.1:5005/api/auto-apply/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          jobUrl: job.url,
          mode: appMode
        })
      });

      if (!response.ok) throw new Error("Auto-apply request failed");
      const res = await response.json();
      
      setApplyingLogs(prev => [...prev, ...res.logs]);
      
      if (res.success) {
        setApplyResult("success");
        setApplications(prev => [
          {
            id: Date.now(),
            company: job.company,
            title: job.title,
            status: appMode === 'auto' ? 'Applied (Auto)' : 'Applied (Review)',
            date: new Date().toISOString().split('T')[0]
          },
          ...prev
        ]);
      } else {
        setApplyResult("error");
      }
    } catch (e) {
      setApplyingLogs(prev => [...prev, `[AUTO-APPLY ERROR] ${e.message}`]);
      setApplyResult("error");
    } finally {
      setIsApplying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ── INTERACTIVE JOB TRACKER HELPER FUNCTIONS ──
  const handleAddManualApplication = () => {
    if (!manualCompany || !manualJobTitle) {
      alert("Please enter both Company and Job Title.");
      return;
    }
    const newApp = {
      id: Date.now(),
      company: manualCompany,
      title: manualJobTitle,
      status: manualStatus,
      date: manualDate
    };
    setApplications(prev => [newApp, ...prev]);
    
    // Clear & Close
    setManualCompany('');
    setManualJobTitle('');
    setManualStatus('Applied');
    setManualDate(new Date().toISOString().split('T')[0]);
    setIsManualModalOpen(false);
  };

  const handleDeleteApplication = (id) => {
    if (confirm("Are you sure you want to delete this tracked application?")) {
      setApplications(prev => prev.filter(app => app.id !== id));
    }
  };

  const handleUpdateApplicationStatus = (id, newStatus) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const exportTrackerToCsv = () => {
    if (applications.length === 0) {
      alert("No applications to export.");
      return;
    }
    const headers = ["Company", "Job Title", "Status", "Date Applied"];
    const rows = applications.map(app => [
      `"${app.company.replace(/"/g, '""')}"`,
      `"${app.title.replace(/"/g, '""')}"`,
      `"${app.status}"`,
      `"${app.date}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `AI_Apply_Job_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerAIFollowUpEmail = async (app) => {
    if (!apiKey) {
      alert("Configure your Gemini API Key in Settings first.");
      return;
    }
    setFollowUpApp(app);
    setFollowUpLoading(true);
    setFollowUpDraft('');

    try {
      const response = await fetch('http://127.0.0.1:5005/api/career-write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': apiKey
        },
        body: JSON.stringify({
          resumeData: profile,
          templateType: 'LinkedIn Outreach',
          extraContext: `Write a friendly follow-up email/outreach message to ${app.company} regarding my application for the ${app.title} position.`
        })
      });

      if (!response.ok) throw new Error("Outreach compiler failed");
      const resJson = await response.json();
      setFollowUpDraft(resJson.text || '');
    } catch (e) {
      alert("AI follow-up error: " + e.message);
      setFollowUpApp(null);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // RENDER LANDING PAGE VIEW MODE
  if (viewMode === 'landing') {
    return (
      <div className="landing-container" style={{ paddingBottom: '80px' }}>
        {/* Navigation Header */}
        <div className="landing-nav">
          <div className="logo-container" style={{ marginBottom: 0 }}>
            <Sparkles className="pulse-primary" style={{ color: 'var(--primary)' }} />
            <div className="logo-text">AI-Apply Pro</div>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
            <a href="#reviews" className="landing-nav-link">Reviews</a>
          </div>
          <button onClick={() => setViewMode('dashboard')} className="btn btn-primary">
            Launch Dashboard <ArrowRight size={14} />
          </button>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">
            Automate Your Entire Job Search With Privacy-First AI
          </h1>
          <p className="hero-subtitle">
            AI-Apply Pro finds high-match roles, tailors your resumes & cover letters, and auto-applies in the background—powered completely by your own API key.
          </p>
          <div className="hero-buttons">
            <button onClick={() => setViewMode('dashboard')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '15px' }}>
              Start for Free (BYOK)
            </button>
            <a href="http://127.0.0.1:5005/sandbox.html" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '15px' }}>
              Test Extension Sandbox
            </a>
          </div>

          {/* Interactive Live Demo */}
          <InteractiveDemo />
        </div>

        {/* Features Section */}
        <div id="features" style={{ padding: '40px 0' }}>
          <h2 className="section-title">All-In-One AI Job Hunting Toolkit</h2>
          <p className="section-subtitle">Ditch the manual search fatigue. Get more responses with high-impact automated modules.</p>
          
          <div className="grid-container" style={{ marginBottom: '80px' }}>
            <div className="glass-panel dashboard-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <Zap style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Auto-Apply Feed</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Aggregate active remote jobs and trigger background Playwright browser sessions to auto-fill applications with one click.
              </p>
            </div>

            <div className="glass-panel dashboard-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <Award style={{ color: 'var(--secondary)' }} />
                <h3 style={{ margin: 0 }}>ATS Optimizer</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Identify score compatibility against target roles, isolate missing keywords, and download tailored markdown resumes.
              </p>
            </div>

            <div className="glass-panel dashboard-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <MessageSquare style={{ color: 'var(--success)' }} />
                <h3 style={{ margin: 0 }}>Mock Coach</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Simulate role-specific technical and behavioral mock interview sessions using voice-to-text inputs and receive structural grades.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div id="pricing" style={{ padding: '40px 0' }}>
          <h2 className="section-title">100% Free & Open Source</h2>
          <p className="section-subtitle">No subscriptions, no credits, no limitations. Run everything locally on your own terms.</p>

          <div className="pricing-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto 80px auto' }}>
            <div className="glass-panel pricing-card featured" style={{ padding: '40px' }}>
              <span className="pricing-badge">UNLIMITED</span>
              <div>
                <h3 style={{ fontSize: '22px', margin: '0 0 8px 0', color: 'var(--primary)' }}>Self-Hosted BYOK Edition</h3>
                <div style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}>
                  $0 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ forever</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Enjoy all premium features without paying for marked-up SaaS subscriptions. Supply your personal Gemini API Key and pay only direct Google API costs (fractions of a cent).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
                  <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '2', margin: 0 }}>
                    <li>100% Free & Open-Source</li>
                    <li>Bring Your Own Key (BYOK)</li>
                    <li>Unlimited Resume Tailoring</li>
                    <li>Unlimited Cover Letters</li>
                  </ul>
                  <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: '2', margin: 0 }}>
                    <li>One-Click Auto-Apply Feed</li>
                    <li>Playwright Browser Automation</li>
                    <li>Speech-to-Text Mock Coach</li>
                    <li>Live Voice Interview Buddy</li>
                  </ul>
                </div>
              </div>
              <button onClick={() => setViewMode('dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Launch Free Dashboard <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="reviews" style={{ padding: '40px 0' }}>
          <h2 className="section-title">Success Stories From Our Users</h2>
          <p className="section-subtitle">Over 1,166,440+ experienced job seekers are automating their searches.</p>

          <div className="testimonial-grid">
            <div className="glass-panel testimonial-card">
              <p className="testimonial-text">
                "Before AI Apply I was stuck in an underpaid role with a terrible boss. A couple of days later I gave AI Apply a try, and within 48 hours the interview requests started rolling in!"
              </p>
              <div>
                <div className="testimonial-author">Alexander K.</div>
                <div className="testimonial-meta">Software Developer • Landed job in 2 weeks</div>
              </div>
            </div>

            <div className="glass-panel testimonial-card">
              <p className="testimonial-text">
                "I got hired by Truist bank! They wrote an amazing cover letter and highlighted my experience beautifully. The responses keep coming, and recruiters call me almost every day."
              </p>
              <div>
                <div className="testimonial-author">Jessica M.</div>
                <div className="testimonial-meta">Financial Analyst • Landed Corporate Role</div>
              </div>
            </div>

            <div className="glass-panel testimonial-card">
              <p className="testimonial-text">
                "Having AIApply find the jobs, tailor my resume, and apply for me automatically makes the whole thing so much easier. I got 4 interviews booked in the first week!"
              </p>
              <div>
                <div className="testimonial-author">Daniel S.</div>
                <div className="testimonial-meta">Product Manager • Landing 4 interviews in Week 1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '40px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
          © 2026 AI-Apply Pro Limited, All rights reserved. Powered by Google Gemini.
        </div>
      </div>
    );
  }

  // Handle Firebase Auth blocking for dashboard view
  if (firebaseConfig && !authUser && !skipAuth) {
    if (authLoading) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at top left, #1e1b4b 0%, #09090b 100%)',
          color: '#e4e4e7',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div className="pulse-primary" style={{ color: 'var(--primary)', marginBottom: '16px' }}>
            <Sparkles size={48} />
          </div>
          <p style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '500' }}>Initializing Secure Session...</p>
        </div>
      );
    }
    return (
      <AuthPage 
        firebaseConfig={firebaseConfig} 
        setFirebaseConfig={setFirebaseConfig} 
        onLoginSuccess={(user) => {
          setAuthUser(user);
          setSkipAuth(false);
        }}
        onSkipAuth={() => {
          setSkipAuth(true);
        }}
      />
    );
  }

  // RENDER APP DASHBOARD VIEW MODE
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div>
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => setViewMode('landing')}>
            <Sparkles className="pulse-primary" style={{ color: 'var(--primary)' }} />
            <div className="logo-text">AI-Apply Pro</div>
          </div>

          <div className="nav-links">
            <div style={{ padding: '0 12px 6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', marginTop: '12px' }}>
              Pipeline & CRM
            </div>
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>


            <div style={{ padding: '16px 12px 6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>
              Base Materials
            </div>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Personal Profile
            </button>

            <div style={{ padding: '16px 12px 6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>
              Tailoring Studio
            </div>
            <button 
              className={`nav-item ${activeTab === 'tailoring-workspace' ? 'active' : ''}`}
              onClick={() => setActiveTab('tailoring-workspace')}
            >
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              Tailoring Workspace
            </button>

            <div style={{ padding: '16px 12px 6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>
              Outreach & Prep
            </div>
            <button 
              className={`nav-item ${activeTab === 'mock-coach' ? 'active' : ''}`}
              onClick={() => setActiveTab('mock-coach')}
            >
              <MessageSquare size={18} />
              Mock Interview
            </button>
            <button 
              className={`nav-item ${activeTab === 'career-templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('career-templates')}
            >
              <BookOpen size={18} />
              Career Templates
            </button>

            <div style={{ padding: '16px 12px 6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>
              Configuration
            </div>
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              AI settings (BYOK)
            </button>
          </div>
        </div>

        {/* Firebase Authentication Sidebar Card */}
        {firebaseConfig && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '4px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            {authUser ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: '600', marginBottom: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  Cloud Sync Active
                </div>
                <div style={{ color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '8px' }} title={authUser.email}>
                  {authUser.email}
                </div>
                <button 
                  onClick={async () => {
                    await signOutUser(firebaseConfig);
                    setAuthUser(null);
                  }}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '6px 10px', fontSize: '11px', justifyContent: 'center', gap: '6px', display: 'flex', alignItems: 'center' }}
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            ) : (
              <div>
                <div style={{ color: '#f87171', fontWeight: '600', marginBottom: '4px' }}>Local Storage Mode</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px', lineHeight: '1.3' }}>
                  Connect cloud workspace to save and sync profiles.
                </div>
                <button 
                  onClick={() => {
                    setSkipAuth(false);
                  }}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '6px 10px', fontSize: '11px', justifyContent: 'center' }}
                >
                  Sign In / Sync Cloud
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '11px', justifyContent: 'center', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            {theme === 'dark' ? <Sun size={14} style={{ color: '#ffd000' }} /> : <Moon size={14} style={{ color: '#7c3aed' }} />}
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button onClick={() => setViewMode('landing')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '11px', justifyContent: 'center' }}>
            Back to Homepage
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Local Sync Server: Active
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="main-content">
        {saveAlert && (
          <div className="alert alert-success">
            <Check size={18} />
            Changes saved and synced to Chrome Extension.
          </div>
        )}

        {/* Unified Active Job Context Bar */}
        <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
              🎯
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary)', fontWeight: 'bold' }}>Active Job Application Target</div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                {targetJobTitle} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>at</span> {targetCompany}
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {jobDescription ? (
              <span style={{ fontSize: '11px', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(16,185,129,0.2)' }}>
                ✔ Job description configured
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠ Missing job description
              </span>
            )}
            <button 
              onClick={() => setShowGlobalJobEdit(!showGlobalJobEdit)} 
              className="btn btn-secondary" 
              style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              💼 {showGlobalJobEdit ? 'Close Context Editor' : 'Edit Job Requirements'}
            </button>
          </div>
        </div>

        {/* Global Active Job Context Editor Modal/Dropdown */}
        {showGlobalJobEdit && (
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', animation: 'slideDown 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700' }}>Modify Active Job Specifications</h3>
            <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Job Title / Role</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Generative AI Engineer"
                  value={targetJobTitle}
                  onChange={(e) => setTargetJobTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Company</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Markel Group"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Complete Job Description (JD)</label>
              <textarea 
                className="form-control textarea-control" 
                placeholder="Paste the target job description requirements here..."
                style={{ minHeight: '140px' }}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Candidate Hub</h1>
                <div className="page-subtitle">Track your automated applications and configurations</div>
              </div>
              <a href="http://127.0.0.1:5005/sandbox.html" target="_blank" rel="noreferrer" className="btn btn-secondary">
                Open Testing Sandbox <ExternalLink size={14} />
              </a>
            </div>

            <div className="grid-container" style={{ marginBottom: '40px' }}>
              <div className="glass-panel dashboard-card">
                <div className="form-label">Total Applications</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
                  {applications.length}
                </div>
              </div>
              <div className="glass-panel dashboard-card">
                <div className="form-label">API Status</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: apiKey ? 'var(--success)' : 'var(--error)', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} />
                  {apiKey ? 'BYOK Configured' : 'Needs API Key'}
                </div>
              </div>
              <div className="glass-panel dashboard-card">
                <div className="form-label">Extension Pairing</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>
                  Open Extension Popup on any page to start auto-filling. Keep this tab open to sync.
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Application Pipeline</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsManualModalOpen(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Plus size={14} /> Add Application
                  </button>
                  <button onClick={exportTrackerToCsv} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {applications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No applications tracked yet. Autofill applications via the extension or manually log them above.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Company</th>
                      <th style={{ padding: '12px' }}>Job Title</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{app.company}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{app.title}</td>
                        <td style={{ padding: '12px' }}>
                          <select 
                            value={app.status} 
                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              background: app.status === 'Offer' ? 'rgba(16, 185, 129, 0.15)' : 
                                          app.status === 'Interviewing' ? 'rgba(56, 189, 248, 0.15)' : 
                                          app.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 
                                          'rgba(168, 85, 247, 0.15)',
                              color: app.status === 'Offer' ? 'var(--success)' : 
                                     app.status === 'Interviewing' ? 'var(--primary)' : 
                                     app.status === 'Rejected' ? 'var(--error)' : 
                                     'var(--secondary)',
                              border: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Applied (Auto)">Applied (Auto)</option>
                            <option value="Applied (Review)">Applied (Review)</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{app.date}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => triggerAIFollowUpEmail(app)} 
                              title="Write AI Follow-up Outreach"
                              className="btn btn-secondary" 
                              style={{ padding: '6px', borderRadius: '4px' }}
                            >
                              <Send size={14} style={{ color: 'var(--primary)' }} />
                            </button>
                            <button 
                              onClick={() => handleDeleteApplication(app.id)} 
                              title="Delete entry"
                              className="btn btn-secondary" 
                              style={{ padding: '6px', borderRadius: '4px', borderColor: 'rgba(239,68,68,0.2)' }}
                            >
                              <Trash2 size={14} style={{ color: 'var(--error)' }} />
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

        {/* PERSONAL PROFILE TAB */}
        {activeTab === 'profile' && (
          <div>
            <div className="page-header" style={{ marginBottom: '20px' }}>
              <div>
                <h1 className="page-title">Personal Profile</h1>
                <div className="page-subtitle">Configure contact credentials and professional background details</div>
              </div>
              <button onClick={() => { localStorage.setItem('ai_apply_profiles', JSON.stringify(profiles)); localStorage.setItem('ai_apply_profile', JSON.stringify(profile)); handleSaveNotification(); }} className="btn btn-primary">
                Save All Profiles
              </button>
            </div>

            {/* Profile Management toolbar */}
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Active Profile:</span>
                <select 
                  value={activeProfileId} 
                  onChange={(e) => setActiveProfileId(e.target.value)}
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none', cursor: 'pointer', minWidth: '180px' }}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCreateProfile} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ➕ New Profile
                </button>
                <button onClick={() => handleRenameProfile(activeProfileId, profile.name)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  ✏ Rename
                </button>
                <button onClick={() => handleDeleteProfile(activeProfileId)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--error)' }}>
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Import Details from PDF and Resume Versions */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Import Details from PDF</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Upload a PDF resume to instantly populate all forms using AI extraction.
                </p>
              </div>
              <div>
                <label className="btn btn-primary" style={{ display: 'inline-flex', cursor: 'pointer', padding: '10px 20px', fontSize: '13px' }}>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
                  {parsing ? 'Parsing PDF...' : 'Upload PDF Resume'}
                </label>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Resume Version:</span>
                <select 
                  value={activeResumeId} 
                  onChange={(e) => handleActiveResumeChange(e.target.value)}
                  style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none', cursor: 'pointer', minWidth: '180px' }}
                >
                  {candidateResumes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  const label = prompt("Rename resume version:", candidateResumes.find(r => r.id === activeResumeId)?.name || 'Primary Resume');
                  if (label) {
                    setProfiles(prev => prev.map(p => {
                      if (p.id === activeProfileId) {
                        const list = p.resumes || [
                          {
                            id: 'default_resume',
                            name: 'Primary Resume',
                            summary: p.summary || '',
                            skills: p.skills || [],
                            work_history: p.work_history || [],
                            education: p.education || [],
                            projects: p.projects || []
                          }
                        ];
                        const updatedResumes = list.map(r => r.id === activeResumeId ? { ...r, name: label } : r);
                        return { ...p, resumes: updatedResumes };
                      }
                      return p;
                    }));
                  }
                }} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  ✏ Rename Version
                </button>
                <button onClick={() => handleDeleteResume(activeResumeId)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--error)' }}>
                  🗑 Delete Version
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Personal Details</h3>
              <div className="grid-container">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profile.personal.name || ''} 
                    onChange={(e) => handleProfileChange('personal', 'name', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={profile.personal.email || ''} 
                    onChange={(e) => handleProfileChange('personal', 'email', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profile.personal.phone || ''} 
                    onChange={(e) => handleProfileChange('personal', 'phone', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Location (City, State / Country)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. San Francisco, CA"
                    value={profile.personal.location || ''} 
                    onChange={(e) => handleProfileChange('personal', 'location', e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid-container" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Portfolio Link</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profile.personal.website || ''} 
                    onChange={(e) => handleProfileChange('personal', 'website', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Github size={14} /> GitHub Profile</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profile.personal.github || ''} 
                    onChange={(e) => handleProfileChange('personal', 'github', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Linkedin size={14} /> LinkedIn URL</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profile.personal.linkedin || ''} 
                    onChange={(e) => handleProfileChange('personal', 'linkedin', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <div className="form-group">
                <label className="form-label">Professional Summary</label>
                <textarea 
                  className="form-control textarea-control" 
                  style={{ minHeight: '120px' }}
                  value={profile.summary || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Skills / Technologies</label>
                
                {/* Floating Bubbles List */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  marginBottom: '12px',
                  minHeight: '34px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '6px'
                }}>
                  {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '16px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          fontWeight: 500,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (profile.skills || []).filter((_, i) => i !== idx);
                            setProfile(prev => ({ ...prev, skills: updated }));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: '0 2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => e.target.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                          ✖
                        </button>
                      </span>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                      No skills added yet. Type below and press Enter to add.
                    </div>
                  )}
                </div>

                {/* Add Skill Input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Type a skill (e.g. React, Python) and press Enter..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val) {
                          const newSkills = val.split(',').map(s => s.trim()).filter(Boolean);
                          const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
                          const uniqueNew = newSkills.filter(s => !currentSkills.includes(s));
                          setProfile(prev => ({ ...prev, skills: [...currentSkills, ...uniqueNew] }));
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      const val = input.value.trim();
                      if (val) {
                        const newSkills = val.split(',').map(s => s.trim()).filter(Boolean);
                        const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
                        const uniqueNew = newSkills.filter(s => !currentSkills.includes(s));
                        setProfile(prev => ({ ...prev, skills: [...currentSkills, ...uniqueNew] }));
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Work Experience */}
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '32px 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Work Experience</span>
                <button onClick={handleAddWorkHistory} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  + Add Job
                </button>
              </h3>
              {(profile.work_history || []).map((job, idx) => (
                <div key={idx} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative' }}>
                  <button 
                    onClick={() => handleRemoveWorkHistory(idx)} 
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px' }}
                    title="Delete Entry"
                  >
                    ✖ Delete
                  </button>
                  <div className="grid-container" style={{ marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Job Title / Role</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={job.role || job.position || ''}
                        onChange={(e) => {
                          const updated = [...(profile.work_history || [])];
                          updated[idx] = { ...updated[idx], role: e.target.value, position: e.target.value };
                          setProfile(prev => ({ ...prev, work_history: updated }));
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={job.company || ''}
                        onChange={(e) => {
                          const updated = [...(profile.work_history || [])];
                          updated[idx] = { ...updated[idx], company: e.target.value };
                          setProfile(prev => ({ ...prev, work_history: updated }));
                        }}
                      />
                    </div>
                    <DateRangePicker 
                      value={job.dates || job.duration || ''}
                      onChange={(newDates) => {
                        const updated = [...(profile.work_history || [])];
                        updated[idx] = { ...updated[idx], dates: newDates, duration: newDates };
                        setProfile(prev => ({ ...prev, work_history: updated }));
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Description / Achievements</label>
                    <textarea 
                      className="form-control" 
                      style={{ minHeight: '80px' }}
                      value={job.description || (Array.isArray(job.achievements) ? job.achievements.join('\n') : '')}
                      onChange={(e) => {
                        const updated = [...(profile.work_history || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setProfile(prev => ({ ...prev, work_history: updated }));
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Projects */}
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '32px 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Projects</span>
                <button onClick={handleAddProject} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  + Add Project
                </button>
              </h3>
              {(profile.projects || []).map((proj, idx) => (
                <div key={idx} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative' }}>
                  <button 
                    onClick={() => handleRemoveProject(idx)} 
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px' }}
                    title="Delete Entry"
                  >
                    ✖ Delete
                  </button>
                  <div className="grid-container" style={{ marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Project Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={proj.name || ''}
                        onChange={(e) => {
                          const updated = [...(profile.projects || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setProfile(prev => ({ ...prev, projects: updated }));
                        }}
                      />
                    </div>
                    <ProjectDatePicker 
                      value={proj.dates || proj.duration || ''}
                      onChange={(newDates) => {
                        const updated = [...(profile.projects || [])];
                        updated[idx] = { ...updated[idx], dates: newDates, duration: newDates };
                        setProfile(prev => ({ ...prev, projects: updated }));
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Description / Achievements</label>
                    <textarea 
                      className="form-control" 
                      style={{ minHeight: '80px' }}
                      value={proj.description || (Array.isArray(proj.achievements) ? proj.achievements.join('\n') : '')}
                      onChange={(e) => {
                        const updated = [...(profile.projects || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setProfile(prev => ({ ...prev, projects: updated }));
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Education */}
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '32px 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Education</span>
                <button onClick={handleAddEducation} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  + Add Education
                </button>
              </h3>
              {(profile.education || []).map((edu, idx) => (
                <div key={idx} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative' }}>
                  <button 
                    onClick={() => handleRemoveEducation(idx)} 
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '12px' }}
                    title="Delete Entry"
                  >
                    ✖ Delete
                  </button>
                  <div className="grid-container" style={{ marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">Institution / School</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={edu.institution || edu.school || ''}
                        onChange={(e) => {
                          const updated = [...(profile.education || [])];
                          updated[idx] = { ...updated[idx], institution: e.target.value, school: e.target.value };
                          setProfile(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Degree / Field of Study</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={edu.degree || edu.field_of_study || ''}
                        onChange={(e) => {
                          const updated = [...(profile.education || [])];
                          updated[idx] = { ...updated[idx], degree: e.target.value, field_of_study: e.target.value };
                          setProfile(prev => ({ ...prev, education: updated }));
                        }}
                      />
                    </div>
                    <DateRangePicker 
                      value={edu.dates || edu.duration || edu.graduation || edu.date || ''}
                      onChange={(newDates) => {
                        const updated = [...(profile.education || [])];
                        updated[idx] = { ...updated[idx], dates: newDates, duration: newDates, graduation: newDates, date: newDates };
                        setProfile(prev => ({ ...prev, education: updated }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JOB BOARD FEED TAB */}
        {activeTab === 'job-board' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Auto-Apply Feed</h1>
                <div className="page-subtitle">Browse active remote listings and trigger one-click automated submissions</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={personalizedSearch ? "Search keywords (or leave empty to match your resume)..." : "Search job titles or keywords (e.g. react, python, designer)..."}
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchJobListings()}
                />
                <button onClick={searchJobListings} className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Search size={16} /> Search
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                <input 
                  type="checkbox" 
                  id="personalized-search-toggle"
                  checked={personalizedSearch}
                  onChange={(e) => setPersonalizedSearch(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="personalized-search-toggle" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎯 <strong>Personalized Search:</strong> Scrape and filter matching my resume skills, location ({profile?.personal?.location || 'Remote'}), and role ({profile?.work_history?.[0]?.role || 'Developer'})
                </label>
              </div>
            </div>

            {searchingJobs ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Scraping live listings from LinkedIn and Indeed...
              </div>
            ) : (
              <div className="grid-container" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                {jobListings.map(job => (
                  <div key={job.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {job.logo ? (
                        <img src={job.logo} alt={job.company} style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                          {job.company?.[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{job.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong>{job.company}</strong>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span style={{ 
                            background: job.source === 'LinkedIn' ? 'rgba(10, 102, 194, 0.15)' : 'rgba(255, 98, 0, 0.15)', 
                            color: job.source === 'LinkedIn' ? '#0a66c2' : '#ff6200', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {job.source}
                          </span>
                          {job.matchScore && (
                            <>
                              <span>•</span>
                              <span style={{
                                color: job.matchScore > 85 ? 'var(--success)' : 'var(--primary)',
                                fontWeight: 'bold',
                                fontSize: '11px'
                              }}>
                                🎯 {job.matchScore}% Match
                              </span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {job.tags.slice(0, 4).map((tag, idx) => (
                            <span key={idx} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <a href={job.url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        View Job <ExternalLink size={12} />
                      </a>
                      <button 
                        onClick={() => runOneClickApply(job)}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}
                      >
                        <Zap size={12} /> One-Click Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIVE AUTO-APPLY MODAL */}
            {applyingJobId && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 1000, padding: '20px' }}>
                <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '32px', background: '#090d16', margin: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Terminal size={18} style={{ color: 'var(--primary)' }} /> Auto-Apply Execution Console</h3>
                    <button 
                      onClick={() => setApplyingJobId(null)} 
                      className="btn btn-secondary"
                      disabled={isApplying}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Close Console
                    </button>
                  </div>

                  <div style={{ 
                    background: '#020617', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    fontFamily: 'monospace', 
                    fontSize: '11px', 
                    height: '240px', 
                    overflowY: 'auto', 
                    color: '#38bdf8', 
                    lineHeight: '1.4',
                    marginBottom: '20px'
                  }}>
                    {applyingLogs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '6px', color: log.includes('ERROR') || log.includes('❌') ? 'var(--error)' : log.includes('✓') || log.includes('success') ? 'var(--success)' : '#38bdf8' }}>
                        {log}
                      </div>
                    ))}
                    {isApplying && <div className="pulse-primary" style={{ display: 'inline-block', width: '8px', height: '12px', background: 'var(--primary)' }}></div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: isApplying ? 'var(--text-muted)' : applyResult === 'success' ? 'var(--success)' : 'var(--error)' }}>
                      {isApplying ? '🚀 Executing backend browser task...' : applyResult === 'success' ? '✔ Application filled successfully (Review Mode).' : '❌ Execution failed. Check logs.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATS OPTIMIZER TAB */}
        {activeTab === 'optimizer' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">ATS Resume Optimizer</h1>
                <div className="page-subtitle">Rate your resume score against a Job Description & reveal improvements</div>
              </div>
            </div>

            {!jobDescription ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Target Job Description Configured</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Paste a target job description to unlock real-time keyword compatibility scanning and automated resume tailoring.
                </p>
                <button onClick={() => setShowGlobalJobEdit(true)} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  💼 Configure Active Job Requirements
                </button>
              </div>
            ) : (
              <>
                <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(79,70,229,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Target Job Profile</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Analyzing match compatibility for <strong>{targetJobTitle}</strong> at <strong>{targetCompany}</strong>.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={runAtsScoring} className="btn btn-primary" disabled={scoring}>
                        {scoring ? 'Scoring Resume...' : 'Analyze & Score Match'}
                      </button>
                      <button 
                        onClick={tailorAndDownloadResume} 
                        className="btn btn-secondary" 
                        disabled={tailoring}
                        style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                      >
                        <Download size={14} /> {tailoring ? 'Tailoring Resume...' : 'Download Tailored Resume (.md)'}
                      </button>
                    </div>
                  </div>
                </div>

                {atsScoreData && (
                  <div className="grid-container" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="form-label" style={{ marginBottom: '16px' }}>ATS Match Score</div>
                      <div style={{ 
                        position: 'relative', 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: `4px solid ${atsScoreData.score >= 80 ? 'var(--success)' : atsScoreData.score >= 60 ? 'var(--warning)' : 'var(--error)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: '800',
                        color: atsScoreData.score >= 80 ? 'var(--success)' : atsScoreData.score >= 60 ? 'var(--warning)' : 'var(--error)'
                      }}>
                        {atsScoreData.score}%
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Missing Keywords / Skills</h3>
                      {atsScoreData.missingKeywords && atsScoreData.missingKeywords.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                          {atsScoreData.missingKeywords.map((kw, i) => (
                            <span key={i} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '24px' }}>✔ Zero missing keywords! Excellent resume keywords density.</div>
                      )}

                      <h3 style={{ margin: '0 0 12px 0' }}>Tailored Summary Suggestion</h3>
                      <div style={{ fontSize: '14px', lineHeight: '1.5', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#cbd5e1' }}>
                        {atsScoreData.tailoredSummary}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LATEX RESUME STUDIO TAB */}
        {activeTab === 'latex-resume-studio' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">LaTeX Resume Studio</h1>
                <div className="page-subtitle">Compile and tailor resumes for target roles using LaTeX format</div>
              </div>
            </div>

            {!jobDescription ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Target Job Description Configured</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Paste a target job description to unlock LaTeX typesetting modifications and ATS formatting.
                </p>
                <button onClick={() => setShowGlobalJobEdit(true)} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  💼 Configure Active Job Requirements
                </button>
              </div>
            ) : (
              <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>1. Master LaTeX Template</h3>
                  <div className="form-group">
                    <textarea 
                      className="form-control textarea-control"
                      style={{ minHeight: '400px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.4' }}
                      value={latexTemplate}
                      onChange={(e) => setLatexTemplate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>2. Generate Tailored Resume</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                      Tailor achievements and skills for <strong>{targetJobTitle}</strong> at <strong>{targetCompany}</strong> using the master template structure.
                    </p>
                    <button 
                      onClick={generateLatexResumeSubmit} 
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={generatingLatex}
                    >
                      {generatingLatex ? 'Tailoring LaTeX Resume...' : 'Generate LaTeX Resume'}
                    </button>
                  </div>

                {generatedLatexResume && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Tailored Resume</h3>
                      {latexAtsScore !== null && (
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          color: 'var(--success)', 
                          background: 'rgba(16,185,129,0.1)', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          border: '1px solid rgba(16,185,129,0.2)' 
                        }}>
                          ATS Score: {latexAtsScore}/100
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <textarea 
                        className="form-control textarea-control" 
                        readOnly
                        style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '11px', background: 'rgba(0,0,0,0.2)' }}
                        value={generatedLatexResume}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button 
                        onClick={() => {
                          const element = document.createElement("a");
                          const file = new Blob([generatedLatexResume], { type: 'text/plain' });
                          element.href = URL.createObjectURL(file);
                          element.download = `${(profile.personal?.name || 'Sumanth_Gadiraju').replace(/\s+/g, '_')}_Resume.tex`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }} 
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Download size={14} /> Download LaTeX (.tex)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COVER LETTER STUDIO TAB */}
        {activeTab === 'studio' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">AI Cover Letter Studio</h1>
                <div className="page-subtitle">Generate optimized and tailored cover letters for specific jobs</div>
              </div>
            </div>

            {!jobDescription ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Target Job Description Configured</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Paste a target job description to unlock structured cover letter generation.
                </p>
                <button onClick={() => setShowGlobalJobEdit(true)} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  💼 Configure Active Job Requirements
                </button>
              </div>
            ) : (
              <>
                <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(79,70,229,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
                  {genError && (
                    <div className="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', marginBottom: '16px' }}>
                      {genError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Target Job Profile</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Drafting cover letter for <strong>{targetJobTitle}</strong> at <strong>{targetCompany}</strong>.
                      </p>
                    </div>
                    <div>
                      <button 
                        onClick={generateLetterSubmit} 
                        className="btn btn-primary" 
                        disabled={generating}
                      >
                        {generating ? 'Generating Letter...' : 'Generate Cover Letter'}
                      </button>
                    </div>
                  </div>
                </div>

                {generatedLetter && (
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Compiled Cover Letter</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => copyToClipboard(generatedLetter)} 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                          {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button 
                          onClick={downloadCoverLetterPdf} 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <Download size={14} /> Download PDF
                        </button>
                        <button 
                          onClick={downloadCoverLetterLatex} 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <FileText size={14} style={{ color: 'white' }} /> Download LaTeX (.tex)
                        </button>
                      </div>
                    </div>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      padding: '24px', 
                      fontFamily: 'serif', 
                      fontSize: '15px', 
                      lineHeight: '1.6', 
                      whiteSpace: 'pre-wrap', 
                      color: '#e2e8f0' 
                    }}>
                      {generatedLetter}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CAREER TEMPLATES TAB */}
        {activeTab === 'career-templates' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Career Templates Studio</h1>
                <div className="page-subtitle">Compile STAR stories, outreach template, or salary negotiation scripts</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
              <div className="grid-container" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div>
                  <div className="form-group">
                    <label className="form-label">Template Type</label>
                    <select 
                      className="form-control" 
                      value={careerTemplateType}
                      onChange={(e) => setCareerTemplateType(e.target.value)}
                    >
                      <option value="STAR Story">STAR Method Behavioral Answer</option>
                      <option value="LinkedIn Outreach">LinkedIn Recruiter Cold Message</option>
                      <option value="Salary Negotiation">Salary Counteroffer Negotiation Email</option>
                      <option value="Professional Bio">Professional Bio Generator</option>
                      <option value="Subject Line Creator">Networking Email Subject Line Creator</option>
                      <option value="JD Keyword Finder">Job Description Keyword Finder</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Extra Context</label>
                    <textarea 
                      className="form-control" 
                      style={{ minHeight: '100px' }}
                      placeholder="STAR situation prompt, company targets, target base salary details..."
                      value={careerExtraContext}
                      onChange={(e) => setCareerExtraContext(e.target.value)}
                    />
                  </div>
                  <button onClick={compileCareerTemplate} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={careerWriting}>
                    {careerWriting ? 'Compiling Template...' : 'Compile Document'}
                  </button>
                </div>

                <div className="glass-panel" style={{ padding: '24px', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>Generated Output</h4>
                    {careerDraft && (
                      <button 
                        onClick={() => copyToClipboard(careerDraft)} 
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        {copySuccess ? <Check size={12} /> : <Copy size={12} />}
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  {careerDraft ? (
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.5', color: '#cbd5e1', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#020617' }}>
                      {careerDraft}
                    </div>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Click "Compile Document" to generate template.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OUTREACH STUDIO TAB */}
        {activeTab === 'outreach-studio' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">AI Outreach Studio</h1>
                <div className="page-subtitle">Generate highly personalized cold emails and LinkedIn messages for recruiters or engineers</div>
              </div>
            </div>

            {!jobDescription ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Target Job Description Configured</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Paste a target job description to personalize recruiter email drafts and cold LinkedIn messages.
                </p>
                <button onClick={() => setShowGlobalJobEdit(true)} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  💼 Configure Active Job Requirements
                </button>
              </div>
            ) : (
              <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>1. Contact Details</h3>
                  <div style={{ marginBottom: '16px', background: 'rgba(79,70,229,0.04)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(79,70,229,0.1)' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary)', fontWeight: 'bold' }}>Active Job Target Context</span>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>{targetJobTitle} at {targetCompany}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Sarah Jenkins"
                      value={outreachName}
                      onChange={(e) => setOutreachName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Title / Role</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Lead Software Engineer or Technical Recruiter"
                      value={outreachTitle}
                      onChange={(e) => setOutreachTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">LinkedIn About / Bio (Optional)</label>
                    <textarea 
                      className="form-control textarea-control" 
                      placeholder="Paste their LinkedIn 'About' section or details from their profile to personalize..."
                      style={{ minHeight: '120px' }}
                      value={outreachAbout}
                      onChange={(e) => setOutreachAbout(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={generateOutreachSubmit} 
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
                    disabled={generatingOutreach}
                  >
                    {generatingOutreach ? 'Generating Outreach...' : 'Generate Outreach Messages'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {outreachResult ? (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Tailored Outreach Outputs</h3>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: 'var(--primary)', 
                          background: 'rgba(79,70,229,0.1)', 
                          padding: '4px 8px', 
                          borderRadius: '4px' 
                        }}>
                          Detected: {outreachResult.detectedRole}
                        </span>
                      </div>

                      <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>LinkedIn Connection Message</h4>
                      <div style={{ position: 'relative' }}>
                        <textarea 
                          className="form-control textarea-control" 
                          readOnly
                          style={{ minHeight: '80px', fontSize: '13px', background: 'rgba(0,0,0,0.2)', marginBottom: '8px' }}
                          value={outreachResult.linkedinMessage}
                        />
                        <button 
                          onClick={() => copyToClipboard(outreachResult.linkedinMessage)} 
                          className="btn btn-secondary"
                          style={{ position: 'absolute', right: '8px', bottom: '16px', padding: '4px 8px', fontSize: '11px' }}
                        >
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                      </div>

                      <h4 style={{ margin: '20px 0 8px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Cold Email Outreach</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '11px' }}>Subject Line</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            readOnly 
                            style={{ background: 'rgba(0,0,0,0.2)', fontSize: '13px' }}
                            value={outreachResult.emailSubject} 
                          />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Body</label>
                          <textarea 
                            className="form-control textarea-control" 
                            readOnly
                            style={{ minHeight: '200px', fontSize: '13px', background: 'rgba(0,0,0,0.2)' }}
                            value={outreachResult.emailBody}
                          />
                          <button 
                            onClick={() => copyToClipboard(`${outreachResult.emailSubject}\n\n${outreachResult.emailBody}`)} 
                            className="btn btn-secondary"
                            style={{ position: 'absolute', right: '8px', bottom: '8px', padding: '4px 8px', fontSize: '11px' }}
                          >
                            {copySuccess ? 'Copied!' : 'Copy Subject + Body'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Fill out the contact details and click "Generate Outreach Messages" to construct optimized templates.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MOCK COACH TAB */}
        {activeTab === 'mock-coach' && (
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="page-title">AI Mock Interview Coach</h1>
                <div className="page-subtitle">Simulate real-time interviews with voice captures and AI evaluations</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => { setVoiceActive(false); stopVoiceSpeechRecognition(); }} 
                  className={`btn ${!voiceActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Written Mode
                </button>
                <button 
                  onClick={() => { setVoiceActive(true); setVoicePhase('setup'); }} 
                  className={`btn ${voiceActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  <Mic size={14} /> Voice AI Room (Alex)
                </button>
              </div>
            </div>

            {!jobDescription ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px', marginTop: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>No Target Job Description Configured</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Paste a target job description to customize mock interview questions and voice practice scenarios.
                </p>
                <button onClick={() => setShowGlobalJobEdit(true)} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  💼 Configure Active Job Requirements
                </button>
              </div>
            ) : ( !voiceActive ? (
              // WRITTEN PRACTICE MODE
              <div>
                <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(79,70,229,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Written Interview Simulation</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Prepare answers to custom behavioral and technical questions for <strong>{targetJobTitle}</strong> at <strong>{targetCompany}</strong>.
                      </p>
                    </div>
                    <button onClick={runMockQuestionGeneration} className="btn btn-primary" disabled={generatingQuestions}>
                      {generatingQuestions ? 'Generating Questions...' : 'Generate Mock Questions'}
                    </button>
                  </div>
                </div>

                {mockQuestions.length > 0 && (
                  <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Select Question</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mockQuestions.map((q, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => { setSelectedQuestionIdx(idx); setGradingResult(null); setCandidateAnswerText(''); }}
                            className={`nav-item`}
                            style={{ 
                              textAlign: 'left', 
                              border: '1px solid var(--border-color)', 
                              background: selectedQuestionIdx === idx ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                              borderColor: selectedQuestionIdx === idx ? 'var(--primary)' : 'var(--border-color)',
                              color: selectedQuestionIdx === idx ? 'var(--text-main)' : 'var(--text-muted)'
                            }}
                          >
                            {idx + 1}. {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                      {selectedQuestionIdx !== null ? (
                        <div>
                          <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)' }}>Q: {mockQuestions[selectedQuestionIdx]}</h4>
                          
                          <div className="form-group">
                            <label className="form-label">Your Response</label>
                            <div style={{ position: 'relative' }}>
                              <textarea 
                                className="form-control" 
                                style={{ minHeight: '120px', paddingRight: '48px' }}
                                placeholder="Type your response, or click the mic button to speak your answer..."
                                value={candidateAnswerText}
                                onChange={(e) => setCandidateAnswerText(e.target.value)}
                              />
                              <button 
                                onClick={triggerSpeechAnswerCapture}
                                className="btn btn-secondary"
                                style={{ 
                                  position: 'absolute', 
                                  right: '12px', 
                                  bottom: '12px', 
                                  padding: '8px', 
                                  borderRadius: '50%',
                                  background: isRecordingAnswer ? 'var(--error)' : 'rgba(255,255,255,0.05)',
                                  color: isRecordingAnswer ? 'white' : 'var(--text-main)'
                                }}
                              >
                                <Mic size={16} className={isRecordingAnswer ? 'pulse-primary' : ''} />
                              </button>
                            </div>
                            {isRecordingAnswer && (
                              <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', fontStyle: 'italic' }}>
                                🎙 Capture in progress... speak now. Click mic again or stop to end.
                              </div>
                            )}
                          </div>

                          <button onClick={runAnswerGrading} className="btn btn-primary" style={{ width: '100%', justifycontent: 'center' }} disabled={grading || !candidateAnswerText}>
                            {grading ? 'Evaluating Answer...' : 'Submit Answer for Grading'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Select an interview question to start responding.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {gradingResult && (
                  <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0 }}>AI Evaluation Results</h3>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>
                        Grade Score: {gradingResult.score}/100
                      </div>
                    </div>

                    <div className="grid-container" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0' }}>Structural Evaluation</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1', margin: '0 0 20px 0' }}>{gradingResult.feedback}</p>
                        
                        <h4 style={{ margin: '0 0 8px 0' }}>Clarity & Style</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1', margin: '0 0 20px 0' }}>{gradingResult.clarity}</p>

                        <h4 style={{ margin: '0 0 8px 0' }}>Grammar Status</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>{gradingResult.grammar}</p>
                      </div>

                      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(0,0,0,0.1)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--warning)' }}>Suggested Improvements:</h4>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
                          {gradingResult.suggestedImprovement && gradingResult.suggestedImprovement.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // VOICE INTERVIEW PRACTICE ROOM (ALEX)
              <div>
                {voicePhase === 'setup' && (
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Configure Voice Interview Session</h3>
                    <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Interview Role</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={voiceRole}
                          onChange={(e) => setVoiceRole(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Interview Type</label>
                        <select 
                          className="form-control" 
                          value={voiceType}
                          onChange={(e) => setVoiceType(e.target.value)}
                        >
                          <option value="Technical">Technical</option>
                          <option value="Behavioral">Behavioral</option>
                          <option value="HR">HR</option>
                          <option value="Mixed">Mixed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Difficulty Level</label>
                        <select 
                          className="form-control" 
                          value={voiceDifficulty}
                          onChange={(e) => setVoiceDifficulty(e.target.value)}
                        >
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid / Intermediate</option>
                          <option value="Senior">Senior</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', marginBottom: '16px', background: 'rgba(79,70,229,0.04)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(79,70,229,0.1)' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--primary)', fontWeight: 'bold' }}>Active Job Target Context</span>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>{targetJobTitle} at {targetCompany}</div>
                    </div>
                    <button onClick={beginVoiceInterview} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Mic size={16} /> Start Voice Practice Room
                    </button>
                  </div>
                )}

                {voicePhase === 'room' && (
                  <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    
                    {/* Pulsing Avatar Container */}
                    <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '24px' }}>
                      {voiceRoomState === 'ai-speaking' && (
                        <>
                          <div className="pulse-primary" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid var(--primary)', opacity: 0.3 }} />
                          <div className="pulse-primary" style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', border: '2px solid var(--primary)', opacity: 0.15 }} />
                        </>
                      )}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '56px',
                        boxShadow: '0 10px 30px rgba(56, 189, 248, 0.2)'
                      }}>
                        {voiceRoomState === 'loading' || voiceRoomState === 'processing' ? '⚙' : '🤖'}
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'white',
                        background: voiceRoomState === 'listening' ? 'var(--success)' : 'var(--primary)'
                      }}>
                        {voiceRoomState === 'ai-speaking' ? 'SPEAKING' : voiceRoomState === 'listening' ? 'LISTENING' : 'PROCESSING'}
                      </div>
                    </div>

                    <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>Alex (AI Interviewer)</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
                      Question {currentVoiceTurn} of 5 • {voiceType} Mode ({voiceDifficulty})
                    </div>

                    {/* Speech display logs */}
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '24px', background: '#020617', textAlign: 'left', marginBottom: '32px', minHeight: '120px' }}>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px' }}>Alex:</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '20px', fontStyle: 'italic' }}>
                        {voiceAIText || 'Initializing conversation thread...'}
                      </div>

                      {voiceTranscript && (
                        <>
                          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 'bold', marginBottom: '6px' }}>You:</div>
                          <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.4' }}>
                            {voiceTranscript}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Floating indicators and triggers */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button 
                        onClick={submitVoiceTurn} 
                        className="btn btn-primary" 
                        disabled={voiceRoomState !== 'listening'}
                        style={{ padding: '12px 24px', fontSize: '14px' }}
                      >
                        Submit Response & Continue
                      </button>
                      <button onClick={endVoiceSession} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '14px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        End Session
                      </button>
                    </div>
                  </div>
                )}

                {voicePhase === 'results' && voiceFeedback && (
                  <div className="glass-panel" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '32px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '22px' }}>Holistic Performance Evaluation</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Feedback provided by senior interviewer coach AI</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Overall Score</div>
                        <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)' }}>{voiceFeedback.overallScore} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 10</span></div>
                      </div>
                    </div>

                    <div className="grid-container" style={{ gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 12px 0' }}>Coaching Summary</h4>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '32px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {voiceFeedback.summary}
                        </p>

                        <h4 style={{ margin: '0 0 12px 0' }}>Key Strengths</h4>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#e2e8f0', lineHeight: '2', marginBottom: '32px' }}>
                          {voiceFeedback.strengths && voiceFeedback.strengths.map((str, idx) => (
                            <li key={idx} style={{ color: 'var(--success)' }}>✔ {str}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="glass-panel" style={{ padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', color: 'var(--warning)' }}>Areas for Improvement</h4>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.8' }}>
                          {voiceFeedback.improvements && voiceFeedback.improvements.map((imp, idx) => (
                            <li key={idx} style={{ marginBottom: '8px' }}>• {imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button onClick={() => setVoicePhase('setup')} className="btn btn-primary" style={{ marginTop: '32px' }}>
                      Start New Voice Session
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI & BYOK SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">AI Settings (BYOK)</h1>
                <div className="page-subtitle">Manage Gemini API keys for local question answering</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <Lock style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Bring Your Own Key (BYOK)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    Your API keys are stored purely in your browser's local storage and are never sent to external servers other than directly to the Gemini API during query resolutions.
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gemini API Key</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Enter your Gemini API key (AIzaSy...)" 
                    value={apiKey} 
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setApiKeyVerified(false);
                    }}
                  />
                  <button 
                    onClick={verifyApiKey}
                    className="btn btn-secondary"
                    disabled={!apiKey || verifying}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {verifying ? 'Verifying...' : 'Verify Connection'}
                  </button>
                </div>
                {apiKeyVerified && (
                  <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>
                    ✔ API Key is valid and successfully connected to the Gemini API!
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label className="form-label">Default Automation Mode</label>
                <select 
                  className="form-control" 
                  value={appMode}
                  onChange={(e) => setAppMode(e.target.value)}
                  style={{ maxWidth: '400px', cursor: 'pointer' }}
                >
                  <option value="manual">Manual (Basic contact details + Resume only)</option>
                  <option value="hybrid">Hybrid (Autofill everything, manual review before submit)</option>
                  <option value="auto">Auto (Full auto-fill & auto-submit)</option>
                </select>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px', lineHeight: '1.4' }}>
                  Choose how automated your job applications should be. This preference synchronizes automatically with your Chrome Extension popup settings.
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Firebase Firestore Sync (Optional)</label>
                <textarea 
                  className="form-control" 
                  style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
                  placeholder='Paste your Firebase config JSON here:&#10;{&#10;  "apiKey": "...",&#10;  "authDomain": "...",&#10;  "projectId": "...",&#10;  "storageBucket": "...",&#10;  "messagingSenderId": "...",&#10;  "appId": "..."&#10;}'
                  value={firebaseConfig}
                  onChange={(e) => setFirebaseConfig(e.target.value)}
                />
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px', lineHeight: '1.4' }}>
                  {cloudSyncing ? (
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>⚡ Synchronizing updates to cloud Firestore...</span>
                  ) : (
                    <span>Provide your Firebase SDK configuration to enable cloud synchronization for your candidate profiles, applications log, and active configurations.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* MANUAL APPLICATION ADDITION MODAL */}
        {isManualModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '32px', background: '#090d16', margin: 'auto' }}>
              <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Add Tracked Application</h3>
              
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Google"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Job Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Senior Frontend Engineer"
                  value={manualJobTitle}
                  onChange={(e) => setManualJobTitle(e.target.value)}
                />
              </div>

              <div className="grid-container" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-control"
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date Applied</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsManualModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAddManualApplication} className="btn btn-primary">
                  Save Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI FOLLOW-UP OUTREACH MODAL */}
        {followUpApp && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '32px', background: '#090d16', margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>AI Follow-Up Generator</h3>
                <button onClick={() => setFollowUpApp(null)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                  Close
                </button>
              </div>

              {followUpLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Drafting customized outreach template via Gemini...
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Tailored message for <strong>{followUpApp.title}</strong> at <strong>{followUpApp.company}</strong>:
                  </div>
                  <textarea 
                    className="form-control"
                    style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                    value={followUpDraft}
                    onChange={(e) => setFollowUpDraft(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button onClick={() => copyToClipboard(followUpDraft)} className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                      {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}