// Removed DOMContentLoaded wrapper to guarantee instant execution
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const profileInfo = document.getElementById('profileInfo');
  const jobSection = document.getElementById('jobSection');
  const detectedJobTitle = document.getElementById('detectedJobTitle');
  const detectedJobSource = document.getElementById('detectedJobSource');
  const autofillBtn = document.getElementById('autofillBtn');
  const consoleBox = document.getElementById('consoleBox');
  const appModeSelect = document.getElementById('appModeSelect');

  // Voice Assist elements
  const buddyToggleBtn = document.getElementById('buddyToggleBtn');
  const buddyTranscription = document.getElementById('buddyTranscription');
  const buddyHintsContainer = document.getElementById('buddyHintsContainer');
  const buddyHints = document.getElementById('buddyHints');

  let cachedProfile = null;
  let cachedApiKey = null;
  let recognition = null;
  let isListening = false;

  function log(message, type = 'info') {
    consoleBox.style.display = 'block';
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleBox.appendChild(entry);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  // 1. Reusable loader and instant scripting sync from open dashboard tabs
  function loadExtensionParameters() {
    chrome.storage.local.get(['userProfile', 'apiKey', 'appMode'], (result) => {
      if (result.appMode) {
        appModeSelect.value = result.appMode;
      }
      
      if (result.userProfile) {
        statusDot.classList.add('connected');
        statusText.innerText = 'Connected';
        
        cachedProfile = result.userProfile;
        cachedApiKey = result.apiKey;

        const profile = result.userProfile;
        profileInfo.innerHTML = `
          <div class="profile-name">${profile.personal?.name || 'Jane Doe'}</div>
          <div class="profile-email">${profile.personal?.email || 'jane@example.com'}</div>
          <div style="font-size: 11px; margin-top: 4px; color: var(--success);">
            ✔ Synced ${result.apiKey ? '(API Key Loaded)' : '(No Key Configured)'}
          </div>
        `;

        checkActiveTab(profile, result.apiKey);
      } else {
        statusDot.classList.remove('connected');
        statusText.innerText = 'Disconnected';
        profileInfo.innerHTML = `
          <span style="color: var(--error); font-size: 12px;">
            Please open the Web Dashboard (localhost:5173) to sync your profile.
          </span>
        `;
      }
    });
  }

  function tryInstantScriptingSync() {
    try {
      if (!chrome.scripting) {
        console.warn("Scripting API not available, falling back to local storage query.");
        loadExtensionParameters();
        return;
      }
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          profileInfo.innerHTML = `<span style="color: var(--error); font-size: 11px;">Query Error: ${chrome.runtime.lastError.message}</span>`;
          loadExtensionParameters();
          return;
        }
        if (!tabs || tabs.length === 0) {
          loadExtensionParameters();
          return;
        }
        const tab = tabs[0];
        const url = tab.url || "";
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return {
                profile: localStorage.getItem('ai_apply_profile'),
                apiKey: localStorage.getItem('ai_apply_api_key'),
                appMode: localStorage.getItem('ai_apply_app_mode'),
                applications: localStorage.getItem('ai_apply_applications')
              };
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.log("Instant sync scripting failed:", chrome.runtime.lastError.message);
              profileInfo.innerHTML = `<span style="color: var(--error); font-size: 11px;">Active Tab Exec Error: ${chrome.runtime.lastError.message}</span>`;
              loadExtensionParameters();
              return;
            }
            if (results && results[0] && results[0].result) {
              const data = results[0].result;
              const updates = {};
              try {
                if (data.profile) updates.userProfile = JSON.parse(data.profile);
                if (data.apiKey) updates.apiKey = data.apiKey;
                if (data.appMode) updates.appMode = data.appMode;
                if (data.applications) updates.applications = JSON.parse(data.applications);
              } catch (e) {
                console.error("Failed to parse local storage details:", e);
              }

              if (Object.keys(updates).length > 0) {
                chrome.storage.local.set(updates, () => {
                  loadExtensionParameters();
                });
                return;
              }
            }
            loadExtensionParameters();
          });
        } else {
          chrome.tabs.query({}, (allTabs) => {
            if (chrome.runtime.lastError) {
              profileInfo.innerHTML = `<span style="color: var(--error); font-size: 11px;">All Tabs Error: ${chrome.runtime.lastError.message}</span>`;
              loadExtensionParameters();
              return;
            }
            const dashboardTab = allTabs.find(t => t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1')));
            if (dashboardTab) {
              chrome.scripting.executeScript({
                target: { tabId: dashboardTab.id },
                func: () => {
                  return {
                    profile: localStorage.getItem('ai_apply_profile'),
                    apiKey: localStorage.getItem('ai_apply_api_key'),
                    appMode: localStorage.getItem('ai_apply_app_mode'),
                    applications: localStorage.getItem('ai_apply_applications')
                  };
                }
              }, (results) => {
                if (chrome.runtime.lastError) {
                  profileInfo.innerHTML = `<span style="color: var(--error); font-size: 11px;">Bg Tab Exec Error: ${chrome.runtime.lastError.message}</span>`;
                  loadExtensionParameters();
                  return;
                }
                if (results && results[0] && results[0].result) {
                  const data = results[0].result;
                  const updates = {};
                  try {
                    if (data.profile) updates.userProfile = JSON.parse(data.profile);
                    if (data.apiKey) updates.apiKey = data.apiKey;
                    if (data.appMode) updates.appMode = data.appMode;
                    if (data.applications) updates.applications = JSON.parse(data.applications);
                  } catch (e) {}

                  if (Object.keys(updates).length > 0) {
                    chrome.storage.local.set(updates, () => {
                      loadExtensionParameters();
                    });
                    return;
                  }
                }
                loadExtensionParameters();
              });
            } else {
              loadExtensionParameters();
            }
          });
        }
      });
    } catch (err) {
      console.warn("Scripting sync failed, falling back:", err);
      profileInfo.innerHTML = `<span style="color: var(--error); font-size: 11px;">Sync Catch: ${err.message}</span>`;
      loadExtensionParameters();
    }
  }

  // Trigger instant sync on popup launch
  tryInstantScriptingSync();

  // Handle Mode Change
  appModeSelect.onchange = () => {
    const selectedMode = appModeSelect.value;
    chrome.storage.local.set({ appMode: selectedMode });
    log(`Application automation mode changed to: ${selectedMode.toUpperCase()}`, 'info');
  };

  // 2. Identify active tab content
  function checkActiveTab(profile, apiKey) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];
      const url = tab.url || "";

      let platform = "";
      if (url.includes('greenhouse.io') || url.includes('sandbox.html') || url.includes('5005')) {
        platform = "Greenhouse Board / Sandbox";
      } else if (url.includes('lever.co')) {
        platform = "Lever.co Application";
      }

      if (platform) {
        jobSection.style.display = 'block';
        detectedJobTitle.innerText = tab.title.split(' - ')[0] || 'Job Application Form';
        detectedJobSource.innerText = `Source: ${platform}`;
        autofillBtn.disabled = false;

        autofillBtn.onclick = () => {
          autofillBtn.disabled = true;
          log(`Initializing page analyzer [Mode: ${appModeSelect.value.toUpperCase()}]...`, 'info');

          // Programmatically inject content.js on click to guarantee it is active
          chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.log("Programmatic injection status:", chrome.runtime.lastError.message);
            }

            // Send action message to content script
            chrome.tabs.sendMessage(tab.id, {
              action: 'autofill',
              profile: profile,
              apiKey: apiKey,
              mode: appModeSelect.value
            }, (response) => {
              if (chrome.runtime.lastError) {
                log(`Tab Connection Failed: ${chrome.runtime.lastError.message}`, 'error');
                autofillBtn.disabled = false;
                return;
              }
              if (response && response.success) {
                log('Autofill request processed successfully.', 'success');
              } else {
                log(`Autofill failed: ${response?.error || 'Unknown error'}`, 'error');
                autofillBtn.disabled = false;
              }
            });
          });
        };
      } else {
        log('Navigate to a supported job board or sandbox.html to begin.', 'warn');
      }
    });
  }

  // 3. Voice Assist Setup
  if (buddyToggleBtn) {
    buddyToggleBtn.onclick = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };
  }

  function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this Chrome version.");
      return;
    }

    if (!cachedApiKey || !cachedProfile) {
      alert("Please ensure your API Key and Profile are configured and synced in dashboard settings.");
      return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      buddyToggleBtn.querySelector('span').innerText = '🛑 Stop Voice Assist';
      buddyToggleBtn.style.background = 'rgba(239, 68, 68, 0.1)';
      buddyToggleBtn.style.color = 'var(--error)';
      buddyToggleBtn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      buddyTranscription.style.display = 'block';
      buddyTranscription.innerText = 'Listening for recruiter question...';
      log("Voice Assist started. Speak near the microphone.", "info");
    };

    recognition.onresult = async (event) => {
      const result = event.results[event.results.length - 1];
      const questionText = result[0].transcript.trim();
      
      buddyTranscription.innerText = `Question detected: "${questionText}"`;
      log(`Transcribed recruiter question: "${questionText}"`, "info");

      // Query Buddy API on Port 5005
      try {
        const response = await fetch('http://127.0.0.1:5005/api/interview-buddy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': cachedApiKey
          },
          body: JSON.stringify({
            question: questionText,
            resumeData: cachedProfile
          })
        });

        if (!response.ok) throw new Error("API request failed");
        
        const resJson = await response.json();
        const hints = resJson.hints || [];

        // Display hints
        buddyHints.innerHTML = '';
        hints.forEach(hint => {
          const li = document.createElement('li');
          li.style.marginBottom = '6px';
          li.innerText = hint;
          buddyHints.appendChild(li);
        });
        buddyHintsContainer.style.display = 'block';
      } catch (err) {
        log(`Buddy Assist failed: ${err.message}`, "error");
      }
    };

    recognition.onerror = (event) => {
      log(`Speech Recognition Error: ${event.error}`, "error");
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };

    recognition.start();
  }

  function stopListening() {
    isListening = false;
    buddyToggleBtn.querySelector('span').innerText = '🎙 Start Voice Assist';
    buddyToggleBtn.style.background = 'rgba(168, 85, 247, 0.1)';
    buddyToggleBtn.style.color = '#a855f7';
    buddyToggleBtn.style.borderColor = 'rgba(168, 85, 247, 0.3)';
    buddyTranscription.style.display = 'none';
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
    }
    log("Voice Assist stopped.", "warn");
  }

  // 4. Receive logs from Content Script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'log') {
      log(message.text, message.logType || 'info');
      if (message.completed) {
        autofillBtn.disabled = false;
      }
    }
  });

  const resetBlacklistBtn = document.getElementById('resetBlacklistBtn');
  if (resetBlacklistBtn) {
    resetBlacklistBtn.onclick = () => {
      chrome.storage.local.set({ blacklistedDomains: [] }, () => {
        alert("Domain blacklist cleared! Refresh your web tabs to restore the Co-Pilot widget.");
      });
    };
  }

  const syncJobBtn = document.getElementById('syncJobBtn');
  if (syncJobBtn) {
    syncJobBtn.onclick = () => {
      if (!cachedApiKey) {
        alert("Please ensure your API Key is configured and synced in the dashboard settings first.");
        return;
      }
      
      syncJobBtn.disabled = true;
      syncJobBtn.innerText = "⏳ Parsing Page...";
      log("Extracting target job page details...", "info");
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          syncJobBtn.disabled = false;
          syncJobBtn.innerText = "🎯 Sync Job Target to App";
          return;
        }
        const tab = tabs[0];
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body.innerText
        }, async (results) => {
          if (chrome.runtime.lastError || !results || !results[0]) {
            log(`Failed to scrape page text: ${chrome.runtime.lastError?.message || 'Empty response'}`, "error");
            syncJobBtn.disabled = false;
            syncJobBtn.innerText = "🎯 Sync Job Target to App";
            return;
          }
          
          const pageText = results[0].result;
          
          try {
            const response = await fetch('http://127.0.0.1:5005/api/parse-job-details', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Gemini-Key': cachedApiKey
              },
              body: JSON.stringify({
                pageText: pageText,
                url: tab.url
              })
            });
            
            if (!response.ok) throw new Error("Parser API failed");
            const data = await response.json();
            
            chrome.storage.local.set({
              jobTitle: data.title,
              jobCompany: data.company,
              jobDescription: data.description
            }, () => {
              log(`Target Job Synced: "${data.title}" at "${data.company}"`, "success");
              syncJobBtn.disabled = false;
              syncJobBtn.innerText = "🎯 Sync Job Target to App";
              alert(`Successfully targeted: ${data.title} at ${data.company}! View the dashboard tab to start tailoring.`);
            });
          } catch (err) {
            log(`Failed to parse job details: ${err.message}`, "error");
            syncJobBtn.disabled = false;
            syncJobBtn.innerText = "🎯 Sync Job Target to App";
          }
        });
      });
    };
  }
