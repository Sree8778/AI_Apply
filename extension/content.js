// content.js - High-Accuracy DOM Autofill Engine

// 1. Sync profile details, API keys, and tracked applications between Web Dashboard and Extension Storage
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  const syncInterval = setInterval(() => {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        clearInterval(syncInterval);
        return;
      }

      const profileStr = localStorage.getItem('ai_apply_profile');
      const profilesStr = localStorage.getItem('ai_apply_profiles');
      const activeProfileId = localStorage.getItem('ai_apply_active_profile_id') || 'default';
      const apiKey = localStorage.getItem('ai_apply_api_key');
      const appsStr = localStorage.getItem('ai_apply_applications');
      const appMode = localStorage.getItem('ai_apply_app_mode') || 'hybrid';
      const jobDesc = localStorage.getItem('ai_apply_job_description');
      const jobCompany = localStorage.getItem('ai_apply_job_company');
      const jobTitle = localStorage.getItem('ai_apply_job_title');
      
      chrome.storage.local.get(['userProfile', 'profiles', 'activeProfileId', 'apiKey', 'applications', 'appMode', 'jobDescription', 'jobCompany', 'jobTitle'], (result) => {
        if (chrome.runtime.lastError) {
          console.warn("[AI-Apply Sync] Sync failed: Extension context invalidated.");
          clearInterval(syncInterval);
          return;
        }

        let needsSync = false;
        const updates = {};
        let triggerDashboardSyncEvent = false;

        // Sync Profile
        if (profileStr) {
          try {
            const profileObj = JSON.parse(profileStr);
            if (JSON.stringify(result.userProfile) !== JSON.stringify(profileObj)) {
              updates.userProfile = profileObj;
              needsSync = true;
            }
          } catch (e) {}
        } else if (result.userProfile) {
          localStorage.setItem('ai_apply_profile', JSON.stringify(result.userProfile));
        }

        // Sync Profiles List
        if (profilesStr) {
          try {
            const profilesObj = JSON.parse(profilesStr);
            if (JSON.stringify(result.profiles) !== JSON.stringify(profilesObj)) {
              updates.profiles = profilesObj;
              needsSync = true;
            }
          } catch (e) {}
        } else if (result.profiles) {
          localStorage.setItem('ai_apply_profiles', JSON.stringify(result.profiles));
        }

        // Sync Active Profile ID
        if (activeProfileId && result.activeProfileId !== activeProfileId) {
          updates.activeProfileId = activeProfileId;
          needsSync = true;
        } else if (result.activeProfileId && result.activeProfileId !== localStorage.getItem('ai_apply_active_profile_id')) {
          localStorage.setItem('ai_apply_active_profile_id', result.activeProfileId);
          if (result.profiles) {
            const activeProfile = result.profiles.find(p => p.id === result.activeProfileId);
            if (activeProfile) {
              localStorage.setItem('ai_apply_profile', JSON.stringify(activeProfile));
            }
          }
        }

        // Sync API Key
        if (apiKey && result.apiKey !== apiKey) {
          updates.apiKey = apiKey;
          needsSync = true;
        }

        // Sync App Mode
        if (appMode && result.appMode !== appMode) {
          updates.appMode = appMode;
          needsSync = true;
        } else if (result.appMode && result.appMode !== localStorage.getItem('ai_apply_app_mode')) {
          localStorage.setItem('ai_apply_app_mode', result.appMode);
        }

        // Sync Job Description
        if (jobDesc && result.jobDescription !== jobDesc) {
          updates.jobDescription = jobDesc;
          needsSync = true;
        } else if (result.jobDescription && result.jobDescription !== jobDesc) {
          localStorage.setItem('ai_apply_job_description', result.jobDescription);
          triggerDashboardSyncEvent = true;
        }

        // Sync Job Company
        if (jobCompany && result.jobCompany !== jobCompany) {
          updates.jobCompany = jobCompany;
          needsSync = true;
        } else if (result.jobCompany && result.jobCompany !== jobCompany) {
          localStorage.setItem('ai_apply_job_company', result.jobCompany);
          triggerDashboardSyncEvent = true;
        }

        // Sync Job Title
        if (jobTitle && result.jobTitle !== jobTitle) {
          updates.jobTitle = jobTitle;
          needsSync = true;
        } else if (result.jobTitle && result.jobTitle !== jobTitle) {
          localStorage.setItem('ai_apply_job_title', result.jobTitle);
          triggerDashboardSyncEvent = true;
        }

        if (triggerDashboardSyncEvent) {
          window.dispatchEvent(new CustomEvent('ai_apply_sync'));
        }

        // Sync Applications (Two-way merged sync)
        let localApps = [];
        try { localApps = appsStr ? JSON.parse(appsStr) : []; } catch (e) {}
        let extApps = result.applications || [];

        if (JSON.stringify(localApps) !== JSON.stringify(extApps)) {
          const mergedMap = new Map();
          [...localApps, ...extApps].forEach(app => {
            if (app && app.id) mergedMap.set(app.id, app);
          });
          const mergedApps = Array.from(mergedMap.values()).sort((a, b) => b.id - a.id);
          
          updates.applications = mergedApps;
          localStorage.setItem('ai_apply_applications', JSON.stringify(mergedApps));
          needsSync = true;
        }

        if (needsSync) {
          chrome.storage.local.set(updates, () => {
            if (chrome.runtime.lastError) {
              clearInterval(syncInterval);
              return;
            }
            console.log("[AI-Apply Sync] Dashboard and Extension successfully synchronized.");
          });
        }
      });
    } catch (err) {
      console.warn("[AI-Apply Sync] Context invalidated, stopping sync interval.");
      clearInterval(syncInterval);
    }
  }, 2000);
}

// 2. Traverses recursively to find elements inside Shadow DOMs
function queryAllIncludingShadows(selector, root = document) {
  const elements = Array.from(root.querySelectorAll(selector));
  const hasShadows = root.querySelectorAll('*');
  for (const el of hasShadows) {
    if (el.shadowRoot) {
      elements.push(...queryAllIncludingShadows(selector, el.shadowRoot));
    }
  }
  return elements;
}

// 3. Dispatch helper to trigger dynamic UI framework updates (React/Vue/Angular)
function triggerInputChange(element, value) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  // Simulate keyboard stroke events to satisfy validation keyup listeners
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
  element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
}

// 3. Listen for Autofill Request from Extension Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    const profile = request.profile;
    const apiKey = request.apiKey;
    const mode = request.mode || 'hybrid';

    performAutofill(profile, apiKey, mode)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true; // Keep channel open for async sendResponse
  }
});

// 4. Extract Job details heuristically from current page context
function extractJobContext() {
  let jobTitle = document.title.split(' - ')[0] || "";
  let companyName = "Acme Corp"; // Default fallback
  let jobDescription = "";

  // Common selectors for Job Titles
  const titleSelectors = ['h1', '.job-title', '.position-title', '.job-header h1'];
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      jobTitle = el.innerText.trim();
      break;
    }
  }

  // Common selectors for Company Name
  const companySelectors = ['.company-name', '.company', '[class*="companyName"]', '.app-header__logo'];
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      companyName = el.innerText.trim();
      break;
    }
  }

  // Common selectors for Job Descriptions
  const descSelectors = ['#job-description', '.job-description', '#description', '[class*="jobDescription"]', 'article'];
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      jobDescription = el.innerText.trim().substring(0, 4000); // Limit to first 4k chars
      break;
    }
  }

  return { jobTitle, companyName, jobDescription };
}

// 5. Main form-filling coordinator
async function performAutofill(profile, apiKey, mode = 'hybrid') {
  sendLog("Parsing page form elements...");
  const inputs = queryAllIncludingShadows('input, textarea, select');
  
  const jobContext = extractJobContext();
  sendLog(`Detected Job: "${jobContext.jobTitle}" at "${jobContext.companyName}"`);

  // --- PHASE 1: Personal Details, Location, Portfolios, Yes/No Options, Checkboxes ---
  const confirmPersonal = await showDOMConfirmationOverlay('personal', 'Confirm autofilling personal details, social profile links, work options, and privacy agreements?');
  
  if (confirmPersonal) {
    sendLog("Autofilling personal details and options...");
    for (const input of inputs) {
      if (input.type === 'hidden' || input.style.display === 'none' || input.style.visibility === 'hidden') continue;
      if (input.closest('[style*="display: none"]')) continue;

      const labelText = getLabelText(input).toLowerCase();
      const inputName = (input.name || '').toLowerCase();
      const inputId = (input.id || '').toLowerCase();

      const isFirstName = /first.*name/i.test(labelText) || /first.*name/i.test(inputName);
      const isLastName = /last.*name/i.test(labelText) || /last.*name/i.test(inputName);
      const isFullName = !isFirstName && !isLastName && (/name/i.test(labelText) || /name/i.test(inputName));
      const isEmail = /email/i.test(labelText) || /email/i.test(inputName) || input.type === 'email';
      const isPhone = /phone|tel/i.test(labelText) || /phone|tel/i.test(inputName) || input.type === 'tel';
      const isLinkedIn = /linkedin/i.test(labelText) || /linkedin/i.test(inputName);
      const isGitHub = /github/i.test(labelText) || /github/i.test(inputName);
      const isWebsite = /website|portfolio/i.test(labelText) || /website|portfolio/i.test(inputName);
      const isLocation = /location|city|residence|address|country|state|zip/i.test(labelText) || /location|city|address|country|state|zip/i.test(inputName);

      if (isFirstName) {
        const firstName = profile.personal?.name?.split(' ')[0] || profile.personal?.name || '';
        triggerInputChange(input, firstName);
        sendLog(`Filled First Name: ${firstName}`);
      } else if (isLastName) {
        const lastName = profile.personal?.name?.split(' ').slice(1).join(' ') || 'Doe';
        triggerInputChange(input, lastName);
        sendLog(`Filled Last Name: ${lastName}`);
      } else if (isFullName) {
        const name = profile.personal?.name || '';
        triggerInputChange(input, name);
        sendLog(`Filled Full Name: ${name}`);
      } else if (isEmail) {
        const email = profile.personal?.email || '';
        triggerInputChange(input, email);
        sendLog(`Filled Email: ${email}`);
      } else if (isPhone) {
        const phone = profile.personal?.phone || '';
        triggerInputChange(input, phone);
        sendLog(`Filled Phone: ${phone}`);
      } else if (isLinkedIn) {
        const li = profile.personal?.linkedin || '';
        triggerInputChange(input, li);
        sendLog(`Filled LinkedIn: ${li}`);
      } else if (isGitHub) {
        const gh = profile.personal?.github || '';
        triggerInputChange(input, gh);
        sendLog(`Filled GitHub: ${gh}`);
      } else if (isWebsite) {
        const web = profile.personal?.website || '';
        triggerInputChange(input, web);
        sendLog(`Filled Portfolio: ${web}`);
      } else if (isLocation) {
        const loc = profile.personal?.location || '';
        triggerInputChange(input, loc);
        sendLog(`Filled Location: ${loc}`);
      } else if (/job.*title|role|position/i.test(labelText) && !isFirstName && !isLastName && !isFullName && !/company/i.test(labelText)) {
        if (profile.work_history && profile.work_history[0]) {
          const val = profile.work_history[0].role || '';
          triggerInputChange(input, val);
          sendLog(`Filled Experience Job Title: ${val}`);
        }
      } else if (/company|employer/i.test(labelText) && !isEmail && !isWebsite) {
        if (profile.work_history && profile.work_history[0]) {
          const val = profile.work_history[0].company || '';
          triggerInputChange(input, val);
          sendLog(`Filled Experience Company: ${val}`);
        }
      } else if (/duties|responsibilities|job.*experience|experience.*description/i.test(labelText)) {
        if (profile.work_history && profile.work_history[0]) {
          const val = profile.work_history[0].description || '';
          triggerInputChange(input, val);
          sendLog(`Filled Experience Description`);
        }
      } else if (/school|university|college|institution/i.test(labelText)) {
        const val = 'University';
        triggerInputChange(input, val);
        sendLog(`Filled Education School: ${val}`);
      } else if (/degree|major|study/i.test(labelText)) {
        const val = 'Computer Science';
        triggerInputChange(input, val);
        sendLog(`Filled Education Degree: ${val}`);
      } else if (input.type === 'radio') {
        const parentQuestion = input.closest('fieldset') || input.closest('div[class*="question"]') || input.closest('.field') || input.parentElement?.parentElement;
        const questionText = parentQuestion ? (parentQuestion.querySelector('label')?.innerText || parentQuestion.innerText || '').toLowerCase() : '';
        
        const isSponsorshipQuestion = /sponsor/i.test(questionText) || /require.*visa/i.test(questionText);
        const isAuthorizationQuestion = /authorized|eligible.*work|right.*work/i.test(questionText);
        
        const radioLabel = (input.value || getLabelText(input) || '').toLowerCase();
        if (isSponsorshipQuestion) {
          const isNoValue = /no|false|do not/i.test(radioLabel) || /no|false|do not/i.test(input.value);
          if (isNoValue) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sendLog(`Selected Sponsorship Radio: No`);
          }
        } else if (isAuthorizationQuestion) {
          const isYesValue = /yes|true/i.test(radioLabel) || /yes|true/i.test(input.value);
          if (isYesValue) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sendLog(`Selected Authorization Radio: Yes`);
          }
        }
      } else if (input.type === 'checkbox') {
        const isConsent = /consent|agree|acknowledge|privacy|understand|accept|terms/i.test(labelText) || /consent|agree|acknowledge/i.test(inputName);
        if (isConsent) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          sendLog(`Checked Consent Checkbox`);
        }
      } else if (input.tagName === 'SELECT') {
        const options = Array.from(input.options).map(o => o.text.toLowerCase());
        const isSponsorship = /sponsor/i.test(labelText) || /sponsor/i.test(inputName);
        const isAuthorization = /authorized|eligible.*work|right.*work/i.test(labelText) || /authorized|eligible/i.test(inputName);
        
        if (isSponsorship) {
          const index = options.findIndex(o => o.includes('no') || o.includes('do not'));
          if (index !== -1) {
            input.selectedIndex = index;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sendLog(`Selected Sponsorship option: "${input.options[index].text}"`);
          }
        } else if (isAuthorization) {
          const index = options.findIndex(o => o.includes('yes') || o.includes('eligible') || o.includes('authorized'));
          if (index !== -1) {
            input.selectedIndex = index;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sendLog(`Selected Authorization option: "${input.options[index].text}"`);
          }
        }
      }
    }
  } else {
    sendLog("Skipped personal details autofill step.", "warn");
  }

  // --- PHASE 2: Resume & Cover Letter File Upload ---
  const resumeInputs = inputs.filter(input => input.type === 'file' && (input.id.toLowerCase().includes('resume') || input.name.toLowerCase().includes('resume') || getLabelText(input).toLowerCase().includes('resume') || getLabelText(input).toLowerCase().includes('cv')));
  const coverLetterInputs = inputs.filter(input => input.type === 'file' && (input.id.toLowerCase().includes('cover') || input.name.toLowerCase().includes('cover') || getLabelText(input).toLowerCase().includes('cover') || getLabelText(input).toLowerCase().includes('letter')));

  if (resumeInputs.length > 0 || coverLetterInputs.length > 0) {
    const confirmUploads = await showDOMConfirmationOverlay('uploads', `Confirm generating and uploading PDF attachments (${resumeInputs.length ? 'Resume' : ''} ${coverLetterInputs.length ? 'Cover Letter' : ''})?`);
    if (confirmUploads) {
      for (const input of resumeInputs) {
        await uploadResumeFile(input, profile.personal?.name || 'Candidate', profile);
      }
      for (const input of coverLetterInputs) {
        await uploadCoverLetterFile(input, profile.personal?.name || 'Candidate', apiKey, profile, jobContext);
      }
    } else {
      sendLog("Skipped document attachment upload step.", "warn");
    }
  }

  // --- PHASE 3: Custom AI Questions ---
  const customQuestions = [];
  if (mode !== 'manual') {
    for (const input of inputs) {
      if (input.type === 'hidden' || input.style.display === 'none' || input.style.visibility === 'hidden') continue;
      if (input.closest('[style*="display: none"]')) continue;
      if (input.type === 'radio' || input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'file') continue;

      const labelText = getLabelText(input).toLowerCase();
      const inputName = (input.name || '').toLowerCase();

      // Check if it is a general text question and not a personal/basic contact field
      const isBasic = /name|email|phone|tel|linkedin|github|website|portfolio|location|city|address|zip|country/i.test(labelText) || 
                      /name|email|phone|tel|linkedin|github|website|portfolio|location|city|address|zip|country/i.test(inputName);
      
      if (labelText && labelText.length > 5 && !isBasic) {
        const isCoverLetter = /cover.*letter|motivation|statement/i.test(labelText) || /cover.*letter/i.test(inputName);
        customQuestions.push({
          label: getLabelText(input),
          element: input,
          isCoverLetter: isCoverLetter
        });
      }
    }
  }

  if (customQuestions.length > 0) {
    const confirmQuestions = await showDOMConfirmationOverlay('questions', `Confirm solving and autofilling ${customQuestions.length} custom questions using Gemini AI?`);
    if (confirmQuestions) {
      if (!apiKey) {
        sendLog("⚠ Custom questions skipped: No Gemini API Key configured.", "warn");
      } else {
        sendLog(`Solving ${customQuestions.length} custom questions with Gemini...`);
        const questionLabels = customQuestions.map(q => q.label);

        try {
          const response = await fetch('http://127.0.0.1:5005/api/solve-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Gemini-Key': apiKey
            },
            body: JSON.stringify({
              resumeData: profile,
              questions: questionLabels,
              jobDescription: jobContext.jobDescription,
              companyName: jobContext.companyName
            })
          });

          if (!response.ok) throw new Error("AI custom solver failed");
          const res = await response.json();
          const answers = res.answers || [];

          for (let idx = 0; idx < customQuestions.length; idx++) {
            const q = customQuestions[idx];
            if (q.isCoverLetter) {
              sendLog("Generating custom Cover Letter text response...");
              try {
                const clRes = await fetch('http://127.0.0.1:5005/api/generate-cover-letter', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Gemini-Key': apiKey
                  },
                  body: JSON.stringify({
                    resumeData: profile,
                    jobDescription: jobContext.jobDescription,
                    companyName: jobContext.companyName
                  })
                });
                if (clRes.ok) {
                  const clJson = await clRes.json();
                  triggerInputChange(q.element, clJson.coverLetter || "");
                  sendLog("✔ Filled text Cover Letter into textarea.");
                }
              } catch (e) {
                sendLog(`Cover letter generation failed: ${e.message}`, "error");
              }
            } else {
              const ans = answers[idx];
              if (ans) {
                triggerInputChange(q.element, ans);
                sendLog(`[AI Answer] Filled question "${q.label.substring(0, 30)}...": "${ans.substring(0, 30)}..."`);
              }
            }
          }
          sendLog("✔ Successfully completed AI custom question responses.");
        } catch (e) {
          sendLog(`Error solving questions: ${e.message}`, "error");
        }
      }
    } else {
      sendLog(`Skipped AI question solving for ${customQuestions.length} questions.`, "warn");
    }
  }

  // --- Log history ---
  const newApp = {
    id: Date.now(),
    company: jobContext.companyName || "Acme Corp",
    title: jobContext.jobTitle || "Software Engineer",
    status: mode === 'auto' ? 'Applied (Auto)' : 'Applied (Review)',
    date: new Date().toISOString().split('T')[0]
  };

  chrome.storage.local.get(['applications'], (res) => {
    const currentApps = res.applications || [];
    const isDuplicate = currentApps.some(app => app.company === newApp.company && app.title === newApp.title && app.date === newApp.date);
    if (!isDuplicate) {
      chrome.storage.local.set({
        applications: [newApp, ...currentApps]
      }, () => {
        sendLog(`Logged application for "${newApp.title}" at "${newApp.company}" to local history.`);
      });
    }
  });

  // --- PHASE 4: Submit Application ---
  if (mode === 'auto') {
    const confirmSubmit = await showDOMConfirmationOverlay('submit', 'Form autofill completed. Proceed to auto-submit this job application now?');
    if (confirmSubmit) {
      sendLog("Auto-Submit confirmed. Locating submit button...");
      const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button#submit, #submit-button');
      let foundBtn = submitBtn;
      if (!foundBtn) {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        foundBtn = buttons.find(b => {
          const txt = (b.innerText || b.value || '').toLowerCase();
          return txt.includes('submit') || txt.includes('apply') || txt.includes('submit application');
        });
      }
      if (foundBtn) {
        sendLog("Found submit button. Clicking now...");
        foundBtn.click();
        sendLog("✓ Application auto-submitted successfully!", "success", true);
      } else {
        sendLog("⚠ Could not locate a submit button on this page.", "warn");
        sendLog("Form auto-fill process finished!", "success", true);
      }
    } else {
      sendLog("Auto-submit skipped by user. Form is filled.", "warn");
      sendLog("Form auto-fill process finished!", "success", true);
    }
  } else {
    sendLog(`Autofill completed. Submit skipped (run in ${mode.toUpperCase()} mode).`);
    sendLog("Form auto-fill process finished!", "success", true);
  }
}

// Helper to get labels from DOM elements
function getLabelText(input) {
  // Check data-automation-id (Workday)
  const automationId = input.getAttribute('data-automation-id');
  if (automationId) return automationId;

  // Check aria-label
  const ariaLabel = input.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const ariaLabelledBy = input.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelEl = document.getElementById(ariaLabelledBy);
    if (labelEl && labelEl.innerText.trim()) return labelEl.innerText.trim();
  }

  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.innerText.trim();
  }
  const parent = input.closest('label');
  if (parent) return parent.innerText.trim();

  // Preceding sibling check
  const sib = input.previousElementSibling;
  if (sib && (sib.tagName === 'LABEL' || sib.tagName === 'DIV' || sib.tagName === 'SPAN')) {
    return sib.innerText.trim();
  }

  // Check for common parent wrappers containing label texts
  const formFieldParent = input.closest('.form-group, .field-wrapper, .form-row, [class*="Field"], [class*="Group"]');
  if (formFieldParent) {
    const labelEl = formFieldParent.querySelector('label, [class*="Label"]');
    if (labelEl && labelEl.innerText.trim()) return labelEl.innerText.trim();
  }
  
  return input.placeholder || input.name || "";
}

// Generate PDF from backend and attach to file input
async function uploadResumeFile(fileInput, candidateName, profile) {
  sendLog("Requesting PDF resume attachment...");
  try {
    const activeResumeId = profile?.activeResumeId || 'default_resume';
    const activeResume = profile?.resumes?.find(r => r.id === activeResumeId);
    const pdfBase64 = activeResume?.pdfBase64 || profile?.pdfBase64;

    let fileToUpload = null;

    if (pdfBase64) {
      // Decode Base64 Data URL to Blob/File
      const arr = pdfBase64.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const filename = activeResume ? `${activeResume.name.replace(/\s+/g, '_')}_Resume.pdf` : `${candidateName.replace(' ', '_')}_Resume.pdf`;
      fileToUpload = new File([blob], filename, { type: 'application/pdf' });
      sendLog(`✔ Attaching original PDF resume version: "${activeResume?.name || 'Primary'}"`);
    } else {
      sendLog("No original PDF source found in profile. Requesting dynamic compilation...");
      const response = await fetch('http://127.0.0.1:5005/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: candidateName })
      });

      if (!response.ok) throw new Error("Could not fetch compiled PDF");

      const blob = await response.blob();
      fileToUpload = new File([blob], `${candidateName.replace(' ', '_')}_Resume.pdf`, { type: 'application/pdf' });
      sendLog("✔ Successfully attached compiled PDF resume.");
    }

    if (fileToUpload) {
      const dt = new DataTransfer();
      dt.items.add(fileToUpload);
      fileInput.files = dt.files;

      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (err) {
    sendLog(`Error uploading resume: ${err.message}`, 'error');
  }
}

// Send logs back to popup
function sendLog(text, logType = 'info', completed = false) {
  chrome.runtime.sendMessage({
    action: 'log',
    text: text,
    logType: logType,
    completed: completed
  });
}

// ── DOM CO-PILOT STEP-BY-STEP CONFIRMATION OVERLAY ──
function showDOMConfirmationOverlay(stepName, messageText) {
  return new Promise((resolve) => {
    // Remove any existing overlay
    const existing = document.getElementById('aiapply-co-pilot-overlay');
    if (existing) existing.remove();

    // Create the overlay container
    const container = document.createElement('div');
    container.id = 'aiapply-co-pilot-overlay';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(11, 15, 25, 0.95);
      border: 2px solid #38bdf8;
      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 16px;
      z-index: 999999;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;

    // Title / Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    `;
    header.innerHTML = `
      <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.05em;">AI Co-Pilot Step</span>
      <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">Pending Action</span>
    `;
    container.appendChild(header);

    // Message
    const msg = document.createElement('div');
    msg.style.cssText = `
      font-size: 12px;
      line-height: 1.4;
      color: #e2e8f0;
      margin-bottom: 16px;
    `;
    msg.innerText = messageText;
    container.appendChild(msg);

    // Button Row
    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      display: flex;
      gap: 10px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Proceed';
    confirmBtn.style.cssText = `
      flex: 1;
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      transition: background 0.2s;
    `;
    confirmBtn.onclick = () => {
      container.remove();
      resolve(true);
    };

    const skipBtn = document.createElement('button');
    skipBtn.innerText = 'Skip Step';
    skipBtn.style.cssText = `
      background: rgba(255,255,255,0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      transition: background 0.2s;
    `;
    skipBtn.onclick = () => {
      container.remove();
      resolve(false);
    };

    btnRow.appendChild(skipBtn);
    btnRow.appendChild(confirmBtn);
    container.appendChild(btnRow);

    document.body.appendChild(container);
  });
}

// --- UPLOAD COVER LETTER PDF HELPER ---
async function uploadCoverLetterFile(fileInput, candidateName, apiKey, profile, jobContext) {
  sendLog("Generating custom Cover Letter text...");
  try {
    const clResponse = await fetch('http://127.0.0.1:5005/api/generate-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': apiKey
      },
      body: JSON.stringify({
        resumeData: profile,
        jobDescription: jobContext.jobDescription,
        companyName: jobContext.companyName
      })
    });

    if (!clResponse.ok) throw new Error("Could not generate Cover Letter text");
    const clJson = await clResponse.json();
    const clText = clJson.coverLetter || "Dear Hiring Manager,\n\nI am excited to apply...";

    // Prompt user to review/edit the generated cover letter text before compiling PDF!
    const reviewResult = await showDOMCoverLetterPreviewOverlay(clText);

    if (reviewResult.proceed) {
      sendLog("Compiling Cover Letter into dynamic PDF...");
      const pdfResponse = await fetch('http://127.0.0.1:5005/api/generate-cover-letter-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: candidateName,
          text: reviewResult.text
        })
      });

      if (!pdfResponse.ok) throw new Error("Could not compile Cover Letter PDF");
      const blob = await pdfResponse.blob();
      const file = new File([blob], `${candidateName.replace(' ', '_')}_CoverLetter.pdf`, { type: 'application/pdf' });

      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;

      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      sendLog("✔ Successfully attached Cover Letter PDF.");
    } else {
      sendLog("Skipped Cover Letter PDF upload step.", "warn");
    }
  } catch (err) {
    sendLog(`Error uploading cover letter: ${err.message}`, 'error');
  }
}

// ── DOM CO-PILOT COVER LETTER PREVIEW OVERLAY ──
function showDOMCoverLetterPreviewOverlay(coverLetterText) {
  return new Promise((resolve) => {
    const existing = document.getElementById('aiapply-co-pilot-overlay');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'aiapply-co-pilot-overlay';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 380px;
      background: rgba(11, 15, 25, 0.98);
      border: 2px solid #38bdf8;
      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 16px;
      z-index: 999999;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 8px;
    `;
    header.innerHTML = `
      <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.05em;">Review Cover Letter</span>
      <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">AI Generated</span>
    `;
    container.appendChild(header);

    const desc = document.createElement('div');
    desc.style.fontSize = '11px';
    desc.style.color = '#cbd5e1';
    desc.innerText = 'Review/Edit the cover letter text below. Click Proceed to compile it to PDF and upload it.';
    container.appendChild(desc);

    const textReview = document.createElement('textarea');
    textReview.id = 'aiapply-cl-editor';
    textReview.value = coverLetterText;
    textReview.style.cssText = `
      width: 100%;
      height: 180px;
      box-sizing: border-box;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 6px;
      padding: 8px;
      color: #e2e8f0;
      font-size: 11px;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      font-family: inherit;
    `;
    container.appendChild(textReview);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      display: flex;
      gap: 10px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Proceed with PDF';
    confirmBtn.style.cssText = `
      flex: 1;
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
    `;
    confirmBtn.onclick = () => {
      const editedText = textReview.value;
      container.remove();
      resolve({ proceed: true, text: editedText });
    };

    const skipBtn = document.createElement('button');
    skipBtn.innerText = 'Skip Upload';
    skipBtn.style.cssText = `
      background: rgba(255,255,255,0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
    `;
    skipBtn.onclick = () => {
      container.remove();
      resolve({ proceed: false, text: coverLetterText });
    };

    btnRow.appendChild(skipBtn);
    btnRow.appendChild(confirmBtn);
    container.appendChild(btnRow);

    document.body.appendChild(container);
  });
}

// ── FLOATING WIDGET CO-PILOT INTERFACE ──
function injectFloatingCoPilot(profile, apiKey, initialMode = 'hybrid', profiles = [], activeProfileId = 'default') {
  if (document.getElementById('aiapply-orb-widget')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes orb-pulse {
      0% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
      50% { box-shadow: 0 0 25px rgba(56, 189, 248, 0.8); }
      100% { box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
    }
    .aiapply-console-log {
      font-family: monospace;
      font-size: 10px;
      line-height: 1.4;
      padding: 6px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 6px;
      max-height: 120px;
      overflow-y: auto;
      margin-top: 10px;
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
  `;
  document.head.appendChild(style);

  const orb = document.createElement('div');
  orb.id = 'aiapply-orb-widget';
  orb.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0284c7, #0369a1);
    border: 2px solid #38bdf8;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.5);
    z-index: 999998;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
    animation: orb-pulse 2s infinite;
    user-select: none;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  orb.innerHTML = `🤖`;

  const panel = document.createElement('div');
  panel.id = 'aiapply-panel-widget';
  panel.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 320px;
    background: rgba(11, 15, 25, 0.96);
    border: 2px solid #38bdf8;
    box-shadow: 0 10px 40px rgba(56, 189, 248, 0.3);
    border-radius: 16px;
    padding: 16px;
    z-index: 999998;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    backdrop-filter: blur(10px);
    display: none;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease;
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
      <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.05em;">AI Co-Pilot Dashboard</span>
      <span style="font-size: 11px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px;">Connected</span>
    </div>
    
    <div>
      <div style="font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 4px;">Candidate Profile</div>
      <select id="widget-profile-select" style="width: 100%; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 6px; color: white; font-size: 12px; outline: none; cursor: pointer; margin-bottom: 6px;">
        ${profiles.map(p => `<option value="${p.id}" ${p.id === activeProfileId ? 'selected' : ''}>${p.name}</option>`).join('')}
      </select>
      <div id="widget-profile-details" style="font-size: 11px; color: #cbd5e1; padding-left: 2px;">
        Active: <strong>${profile.personal?.name || 'Candidate'}</strong> (${profile.personal?.email || ''})
      </div>
    </div>

    <div>
      <div style="font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 4px;">Automation Mode</div>
      <select id="widget-mode-select" style="width: 100%; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 6px; color: white; font-size: 12px; outline: none; cursor: pointer;">
        <option value="manual" ${initialMode === 'manual' ? 'selected' : ''}>Manual (Contact details + Resume only)</option>
        <option value="hybrid" ${initialMode === 'hybrid' ? 'selected' : ''}>Hybrid (Review filled questions)</option>
        <option value="auto" ${initialMode === 'auto' ? 'selected' : ''}>Auto (Full Auto-Submit)</option>
      </select>
    </div>

    <button id="widget-autofill-btn" style="width: 100%; background: linear-gradient(135deg, #38bdf8, #0284c7); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: all 0.2s;">
      🚀 Run Auto-Fill Form
    </button>

    <button id="widget-voice-btn" style="width: 100%; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; transition: all 0.2s;">
      🎙 Start Live Interview Assist
    </button>

    <div id="widget-transcription-box" style="display: none; font-size: 11px; color: #a7f3d0; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px; border-radius: 6px;"></div>

    <div style="font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: -4px;">Co-Pilot Activity Logs</div>
    <div id="widget-logs" class="aiapply-console-log">Ready for action.</div>
    <div style="text-align: center; margin-top: 6px;">
      <button id="widget-hide-site-btn" style="background: transparent; border: none; color: rgba(255,255,255,0.35); font-size: 10px; cursor: pointer; text-decoration: underline; transition: color 0.2s;">
        Hide bot icon on this website
      </button>
    </div>
  `;

  document.body.appendChild(orb);
  document.body.appendChild(panel);

  orb.onclick = () => {
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'flex';
      orb.style.transform = 'rotate(180deg)';
      orb.innerHTML = '✖';
    } else {
      panel.style.display = 'none';
      orb.style.transform = 'rotate(0deg)';
      orb.innerHTML = '🤖';
    }
  };

  const profileSelect = panel.querySelector('#widget-profile-select');
  const profileDetails = panel.querySelector('#widget-profile-details');

  if (profileSelect && profileDetails) {
    profileSelect.onchange = () => {
      const selectedId = profileSelect.value;
      const selectedProfile = profiles.find(p => p.id === selectedId);
      if (selectedProfile) {
        profile = selectedProfile;
        chrome.storage.local.set({ 
          activeProfileId: selectedId,
          userProfile: selectedProfile
        }, () => {
          profileDetails.innerHTML = `Active: <strong>${selectedProfile.personal?.name || 'Candidate'}</strong> (${selectedProfile.personal?.email || ''})`;
          sendLog(`Switched active profile to: "${selectedProfile.name}"`, "info");
        });
      }
    };
  }

  const hideSiteBtn = panel.querySelector('#widget-hide-site-btn');
  if (hideSiteBtn) {
    hideSiteBtn.onclick = () => {
      const hostname = window.location.hostname;
      chrome.storage.local.get(['blacklistedDomains'], (res) => {
        const list = res.blacklistedDomains || [];
        if (!list.includes(hostname)) {
          list.push(hostname);
          chrome.storage.local.set({ blacklistedDomains: list }, () => {
            orb.remove();
            panel.remove();
            console.log(`[AI Co-Pilot] Domain ${hostname} added to blacklist.`);
          });
        } else {
          orb.remove();
          panel.remove();
        }
      });
    };
  }

  const autofillBtn = panel.querySelector('#widget-autofill-btn');
  const modeSelect = panel.querySelector('#widget-mode-select');
  const logsContainer = panel.querySelector('#widget-logs');

  autofillBtn.onclick = async () => {
    autofillBtn.disabled = true;
    autofillBtn.innerText = '⚡ Processing form...';
    logsContainer.innerHTML = '';
    
    const selectedMode = modeSelect.value;
    chrome.storage.local.set({ appMode: selectedMode });

    try {
      await performAutofill(profile, apiKey, selectedMode);
    } catch (e) {
      logsContainer.innerHTML += `<div style="color:#ef4444;">Error: ${e.message}</div>`;
    }
    autofillBtn.disabled = false;
    autofillBtn.innerText = '🚀 Run Auto-Fill Form';
  };

  const voiceBtn = panel.querySelector('#widget-voice-btn');
  const transBox = panel.querySelector('#widget-transcription-box');
  let recognition = null;
  let isListening = false;

  voiceBtn.onclick = () => {
    if (isListening) {
      isListening = false;
      voiceBtn.innerText = '🎙 Start Live Interview Assist';
      voiceBtn.style.background = 'rgba(168, 85, 247, 0.15)';
      voiceBtn.style.color = '#c084fc';
      voiceBtn.style.borderColor = 'rgba(168, 85, 247, 0.4)';
      transBox.style.display = 'none';
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
        recognition = null;
      }
      logsContainer.innerHTML += `<div>[Voice Assist] Stopped.</div>`;
    } else {
      if (!('webkitSpeechRecognition' in window)) {
        alert("Speech Recognition not supported in this browser.");
        return;
      }
      if (!apiKey) {
        alert("No Gemini API Key loaded. Solve standard profile details first to sync key.");
        return;
      }

      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        voiceBtn.innerText = '🛑 Stop Interview Assist';
        voiceBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        voiceBtn.style.color = '#f87171';
        voiceBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        transBox.style.display = 'block';
        transBox.innerText = 'Listening for interview questions...';
        logsContainer.innerHTML += `<div>[Voice Assist] Listening...</div>`;
      };

      recognition.onresult = async (event) => {
        const questionText = event.results[event.results.length - 1][0].transcript.trim();
        transBox.innerText = `Recruiter: "${questionText}"`;
        logsContainer.innerHTML += `<div>[Transcribed] "${questionText}"</div>`;

        try {
          const buddyRes = await fetch('http://127.0.0.1:5005/api/interview-buddy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Gemini-Key': apiKey
            },
            body: JSON.stringify({
              question: questionText,
              resumeData: profile
            })
          });

          if (buddyRes.ok) {
            const resJson = await buddyRes.json();
            const hints = resJson.hints || [];
            logsContainer.innerHTML += `<div style="color: #a7f3d0; font-weight: bold; margin-top: 4px;">Hints:</div>`;
            hints.forEach(hint => {
              logsContainer.innerHTML += `<div style="color: #e2e8f0; padding-left: 6px;">• ${hint}</div>`;
            });
            logsContainer.scrollTop = logsContainer.scrollHeight;
          }
        } catch (err) {
          logsContainer.innerHTML += `<div style="color:#ef4444;">Buddy Assist failed: ${err.message}</div>`;
        }
      };

      recognition.onerror = (e) => {
        logsContainer.innerHTML += `<div style="color:#ef4444;">Speech Error: ${e.error}</div>`;
      };

      recognition.onend = () => {
        if (isListening) recognition.start();
      };

      recognition.start();
    }
  };

  const logsObserver = setInterval(() => {
    if (!document.body.contains(orb)) {
      clearInterval(logsObserver);
      return;
    }
  }, 2000);
}

function initWidget() {
  try {
    const hostname = window.location.hostname;
    chrome.storage.local.get(['userProfile', 'apiKey', 'appMode', 'profiles', 'activeProfileId', 'blacklistedDomains'], (result) => {
      if (chrome.runtime.lastError) return;

      const blacklist = result.blacklistedDomains || [];
      if (blacklist.includes(hostname)) {
        console.log(`[AI Co-Pilot] Widget is disabled on ${hostname} (blacklisted)`);
        return;
      }

      if (result.userProfile) {
        injectFloatingCoPilot(
          result.userProfile, 
          result.apiKey, 
          result.appMode || 'hybrid', 
          result.profiles || [], 
          result.activeProfileId || 'default'
        );
      }
    });
  } catch(e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
