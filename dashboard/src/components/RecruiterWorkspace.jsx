import React, { useState } from "react";
import { toast } from "sonner";
import {
  Search as IconSearch,
  Sparkles as IconSparkles,
  UserCheck as IconUserCheck,
  Briefcase as IconBriefcase,
  MapPin as IconMapPin,
  Code as IconCode,
  Github as IconGithub,
  Globe as IconGlobe,
  Mail as IconMail,
  Star as IconStar,
  Download as IconDownload,
  CheckCircle2 as IconCheckCircle2,
  X as IconX,
  Plus as IconPlus,
  Loader2 as IconLoader2,
  Send as IconSend,
  Sliders as IconSliders
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

export default function RecruiterWorkspace({ apiKey }) {
  // Search Inputs State
  const [roleTitle, setRoleTitle] = useState("Senior Fullstack Engineer");
  const [skills, setSkills] = useState(["React", "Node.js", "TypeScript", "Python", "AWS"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [minExperience, setMinExperience] = useState("3+ Yrs");
  const [location, setLocation] = useState("San Francisco, CA");
  const [sourcingChannel, setSourcingChannel] = useState("github");

  // Results & Sourcing State
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [activeViewTab, setActiveViewTab] = useState("all"); // 'all' | 'shortlist'

  // Outreach Modal State
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [companyName, setCompanyName] = useState("Apex AI Labs");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // Skill Tag Handlers
  const handleAddSkill = () => {
    const val = newSkillInput.trim();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Execute Headless Candidate Sourcing
  const handleStartSearch = async () => {
    if (!roleTitle.trim()) {
      toast.error("Please enter a target role title first");
      return;
    }

    setIsSearching(true);
    setSearchStatus("Initiating Playwright headless browser instance...");

    try {
      setTimeout(() => setSearchStatus("Navigating to platform developer directories..."), 1200);
      setTimeout(() => setSearchStatus("Extracting candidate profiles, repositories & bios..."), 2500);
      setTimeout(() => setSearchStatus("Evaluating candidate skills & computing ATS Match Scores..."), 3800);

      const response = await fetch(`${API_BASE_URL}/api/recruiter/search-candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: roleTitle,
          skills: skills,
          minExp: minExperience,
          location: location,
          platform: sourcingChannel
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const results = resData.candidates || [];
        setCandidates(results);
        toast.success(`Found ${results.length} matching candidate profiles!`);
      } else {
        toast.error("Search request failed. Please check backend connection.");
      }
    } catch (err) {
      console.warn("Headless search error fallback:", err);
      toast.error("Network error connecting to backend sourcing engine.");
    } finally {
      setIsSearching(false);
      setSearchStatus("");
    }
  };

  // Toggle Shortlist
  const toggleShortlist = (cand) => {
    if (shortlist.some((c) => c.id === cand.id)) {
      setShortlist(shortlist.filter((c) => c.id !== cand.id));
      toast.info(`Removed ${cand.name} from shortlist.`);
    } else {
      setShortlist([...shortlist, cand]);
      toast.success(`Saved ${cand.name} to recruiter shortlist!`);
    }
  };

  // Open AI Outreach Modal
  const handleOpenOutreach = async (cand) => {
    setSelectedCandidate(cand);
    setShowOutreachModal(true);
    setIsGeneratingOutreach(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recruiter/generate-outreach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey || ""
        },
        body: JSON.stringify({
          apiKey,
          candidate: cand,
          role: roleTitle,
          companyName: companyName
        })
      });

      if (response.ok) {
        const resData = await response.json();
        setOutreachMessage(resData.outreachMessage || "");
      }
    } catch (err) {
      console.warn("Outreach generator fallback:", err);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Export Candidate Profile Dossier
  const handleExportCandidate = (cand) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cand, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${cand.name.toLowerCase().replace(/\s+/g, "_")}_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${cand.name} candidate dossier!`);
  };

  const displayedCandidates = activeViewTab === "shortlist" ? shortlist : candidates;

  return (
    <div className="space-y-6">
      {/* Recruiter Workspace Header */}
      <div className="glass-panel p-6" style={{ borderLeft: "4px solid #7c3aed" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "white" }}>
                {"Recruiter AI Candidate Sourcing Workspace"}
              </h2>
              <span style={{ fontSize: "11px", background: "rgba(124, 58, 237, 0.2)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "12px", padding: "2px 10px", fontWeight: "600" }}>
                {"⚡ Playwright Headless Agent"}
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              {"Specify required candidate skills and role parameters to initiate an autonomous browser search, scrape candidate profiles, and rank them by ATS Match Score."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveViewTab("all")}
              className={`btn ${activeViewTab === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "8px 16px", fontSize: "12.5px" }}
            >
              {`All Results (${candidates.length})`}
            </button>
            <button
              onClick={() => setActiveViewTab("shortlist")}
              className={`btn ${activeViewTab === "shortlist" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "8px 16px", fontSize: "12.5px", display: "flex", gap: "6px", alignItems: "center" }}
            >
              <IconStar size={14} style={{ fill: shortlist.length > 0 ? "#fde047" : "none", color: shortlist.length > 0 ? "#fde047" : "currentColor" }} />
              {`Shortlist (${shortlist.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Recruiter Search Parameters Form */}
      <div className="glass-panel p-6 space-y-5">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <IconSliders size={16} style={{ color: "#a855f7" }} />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "white" }}>
            {"Target Role & Candidate Criteria"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Role Title */}
          <div>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Target Role / Job Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Senior Fullstack Engineer"
              style={{ fontSize: "13px" }}
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>

          {/* Min Experience */}
          <div>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Minimum Experience</label>
            <select
              className="form-control"
              style={{ fontSize: "13px" }}
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            >
              <option>{"Any Experience"}</option>
              <option>{"1-3 Yrs (Junior / Mid)"}</option>
              <option>{"3+ Yrs (Senior)"}</option>
              <option>{"5+ Yrs (Staff / Lead)"}</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Target Location / Remote</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. San Francisco, CA or Remote"
              style={{ fontSize: "13px" }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Required Skills Tag Editor */}
        <div>
          <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>Required Technical Skills</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {skills.map((skill, idx) => (
              <span key={idx} style={{ background: "rgba(124, 58, 237, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "14px", padding: "4px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontSize: "13px", padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Type a skill (e.g. Docker, Kubernetes, GraphQL) and press Enter"
              style={{ fontSize: "12.5px" }}
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="btn btn-secondary"
              style={{ padding: "6px 16px", fontSize: "12.5px", whiteSpace: "nowrap" }}
            >
              + Add Skill
            </button>
          </div>
        </div>

        {/* Sourcing Channel & Action Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>Sourcing Channel:</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setSourcingChannel("github")}
                className={`btn ${sourcingChannel === "github" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "5px 12px", fontSize: "11.5px", display: "flex", gap: "6px", alignItems: "center" }}
              >
                <IconGithub size={13} /> GitHub Developers
              </button>
              <button
                type="button"
                onClick={() => setSourcingChannel("web")}
                className={`btn ${sourcingChannel === "web" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "5px 12px", fontSize: "11.5px", display: "flex", gap: "6px", alignItems: "center" }}
              >
                <IconGlobe size={13} /> Web X-Ray Search
              </button>
            </div>
          </div>

          <button
            onClick={handleStartSearch}
            disabled={isSearching}
            className="btn btn-primary"
            style={{ padding: "10px 24px", fontSize: "13.5px", fontWeight: "700", display: "flex", gap: "8px", alignItems: "center", background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)" }}
          >
            {isSearching ? <IconLoader2 size={16} className="animate-spin" /> : <IconSparkles size={16} />}
            {isSearching ? "Searching Candidates..." : "⚡ Start Headless AI Candidate Search"}
          </button>
        </div>

        {/* Live Search Status Bar */}
        {isSearching && (
          <div style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <IconLoader2 size={18} style={{ color: "#a855f7" }} className="animate-spin" />
            <div style={{ fontSize: "12.5px", color: "#c084fc", fontWeight: "500" }}>
              {searchStatus}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Search Results Feed */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "white" }}>
            {activeViewTab === "shortlist" ? "Shortlisted Candidates" : `Candidate Search Results (${candidates.length})`}
          </h3>
        </div>

        {displayedCandidates.length === 0 ? (
          <div className="glass-panel" style={{ padding: "48px", textAlign: "center" }}>
            <IconUserCheck size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px auto" }} />
            <h4 style={{ margin: 0, fontSize: "15px", color: "white" }}>
              {activeViewTab === "shortlist" ? "No Shortlisted Candidates Yet" : "Ready to Search Candidates"}
            </h4>
            <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              {activeViewTab === "shortlist" ? "Click the ⭐ button on candidate cards to add candidates to your shortlist." : "Specify target role and skills above, then click 'Start Headless AI Candidate Search'."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedCandidates.map((cand) => {
              const isShortlisted = shortlist.some((c) => c.id === cand.id);
              return (
                <div key={cand.id} className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: isShortlisted ? "1px solid #eab308" : "1px solid var(--border-color)" }}>
                  <div>
                    {/* Header: Avatar, Name, Score */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#1e293b", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
                        />
                        <div>
                          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "white" }}>
                            {cand.name}
                          </h4>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {cand.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                            <IconMapPin size={11} /> {cand.location}
                          </div>
                        </div>
                      </div>

                      {/* ATS Score Gauge */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", padding: "3px 10px", borderRadius: "12px", background: cand.matchScore >= 85 ? "rgba(34,197,94,0.2)" : cand.matchScore >= 70 ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)", color: cand.matchScore >= 85 ? "#4ade80" : cand.matchScore >= 70 ? "#fde047" : "#f87171", border: `1px solid ${cand.matchScore >= 85 ? "#22c55e" : cand.matchScore >= 70 ? "#eab308" : "#ef4444"}` }}>
                          {`${cand.matchScore}% Match`}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Bio */}
                    {cand.bio && (
                      <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.45", marginBottom: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "6px" }}>
                        {cand.bio}
                      </div>
                    )}

                    {/* Matched & Missing Skills */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#4ade80", marginBottom: "4px" }}>
                        ✓ Matched Skills
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                        {(cand.matchedSkills || cand.skills || []).map((sk, sIdx) => (
                          <span key={sIdx} style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "2px 8px", fontSize: "11px" }}>
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Key Highlights */}
                    {cand.highlights && cand.highlights.length > 0 && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", marginBottom: "4px" }}>
                          Profile Highlights
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                          {cand.highlights.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Candidate Action Buttons */}
                  <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                    <button
                      onClick={() => handleOpenOutreach(cand)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: "6px 12px", fontSize: "11.5px", justifyContent: "center", gap: "4px" }}
                    >
                      <IconSend size={12} /> ✉️ AI Outreach
                    </button>
                    <button
                      onClick={() => toggleShortlist(cand)}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "11.5px", color: isShortlisted ? "#fde047" : "white", borderColor: isShortlisted ? "#eab308" : "var(--border-color)" }}
                    >
                      <IconStar size={13} style={{ fill: isShortlisted ? "#fde047" : "none" }} />
                      {isShortlisted ? "Saved" : "Shortlist"}
                    </button>
                    <button
                      onClick={() => handleExportCandidate(cand)}
                      className="btn btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "11.5px" }}
                      title="Export Candidate Dossier JSON"
                    >
                      <IconDownload size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Candidate Outreach Modal */}
      {showOutreachModal && selectedCandidate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "24px", background: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconSend size={18} style={{ color: "#a855f7" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "white" }}>
                  {`AI Candidate Outreach to ${selectedCandidate.name}`}
                </h3>
              </div>
              <button onClick={() => setShowOutreachModal(false)} className="text-zinc-400 hover:text-white" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: "600" }}>Your Company / Team Name</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: "12.5px" }}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", margin: 0 }}>Personalized AI Cold Outreach Message</label>
                  {isGeneratingOutreach && <span style={{ fontSize: "11px", color: "#a855f7" }}>Generating Gemini message...</span>}
                </div>
                <textarea
                  className="form-control"
                  style={{ minHeight: "180px", fontSize: "12.5px", fontFamily: "sans-serif", lineHeight: "1.45" }}
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(outreachMessage);
                    toast.success("Outreach message copied to clipboard!");
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  📋 Copy Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Outreach message sent to ${selectedCandidate.email}!`);
                    setShowOutreachModal(false);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  🚀 Send Outreach Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
