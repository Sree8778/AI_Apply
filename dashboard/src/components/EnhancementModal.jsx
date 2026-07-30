import React from 'react';
import { Sparkles, Check, X, RefreshCw, Wand2, Layers, Award } from 'lucide-react';

export default function EnhancementModal({
  isOpen,
  onClose,
  originalText = '',
  versions = [],
  selected = '',
  onSelect,
  onApply,
  loading = false,
  sectionName = 'Section'
}) {
  if (!isOpen) return null;

  const versionLabels = [
    { title: 'Version 1: Metrics & Quantified Impact', desc: 'Emphasizes ROI, numbers, and measurable business outcomes.', badge: 'Metrics' },
    { title: 'Version 2: ATS Verb & Keyword Dense', desc: 'Packed with active verbs, technical competencies, and ATS keywords.', badge: 'ATS Boost' },
    { title: 'Version 3: Concise Executive Tone', desc: 'Polished, punchy, high-level leadership phrasing.', badge: 'Executive' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#090d16',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(124, 58, 237, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Sparkles size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>
                AI Enhancement - {sectionName}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Select your preferred variation or stick with your original text
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '8px' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="spin-animation" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>Generating 3 High-Impact AI Variations...</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Analyzing metrics, ATS keyword density, and phrasing.</div>
          </div>
        ) : (
          <div>
            {/* Original Text Reference Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '6px' }}>
                Original Text
              </div>
              <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5', fontFamily: 'sans-serif' }}>
                {originalText || '(Empty)'}
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wand2 size={15} /> Select an Enhanced AI Variation:
            </div>

            {/* Versions Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Option 0: Keep Original */}
              <div
                onClick={() => onSelect(originalText)}
                style={{
                  border: selected === originalText ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selected === originalText ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <input
                  type="radio"
                  name="enhancementOption"
                  checked={selected === originalText}
                  onChange={() => onSelect(originalText)}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: 'white' }}>Original Version (Unchanged)</span>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>Original</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>{originalText}</div>
                </div>
              </div>

              {/* Generated AI Versions */}
              {versions.map((ver, idx) => {
                const label = versionLabels[idx] || { title: `Version ${idx + 1}`, desc: 'AI Enhanced Variation', badge: 'AI Enhanced' };
                const isSelected = selected === ver;
                return (
                  <div
                    key={idx}
                    onClick={() => onSelect(ver)}
                    style={{
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <input
                      type="radio"
                      name="enhancementOption"
                      checked={isSelected}
                      onChange={() => onSelect(ver)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'white' }}>{label.title}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label.desc}</div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: isSelected ? 'var(--primary)' : 'rgba(56, 189, 248, 0.15)',
                          color: isSelected ? 'white' : 'var(--primary)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Sparkles size={11} /> {label.badge}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13.5px',
                        color: isSelected ? '#f8fafc' : '#cbd5e1',
                        lineHeight: '1.5',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px',
                        marginTop: '6px',
                        borderLeft: '3px solid var(--primary)'
                      }}>
                        {ver}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={onApply}
                className="btn btn-primary"
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                disabled={!selected}
              >
                <Check size={16} /> Apply Enhancement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
