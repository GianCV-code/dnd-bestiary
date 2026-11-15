import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Download, ExternalLink, Sparkles, Folder, Database } from 'lucide-react';
import { generateObsidianMarkdown, generateObsidianUri, downloadObsidianMarkdown } from '../engine/obsidianExporter.js';

export default function ObsidianExportModal({ creature, onClose }) {
  const [vaultName, setVaultName] = useState(() => {
    return localStorage.getItem('obsidian_vault_name') || 'DnD - DM (Remote)';
  });
  const [folderPath, setFolderPath] = useState(() => {
    return localStorage.getItem('obsidian_folder_path') || '04. Custom Bestiary/00. Criaturas Varias';
  });

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCodePreview, setShowCodePreview] = useState(false);

  useEffect(() => {
    localStorage.setItem('obsidian_vault_name', vaultName);
  }, [vaultName]);

  useEffect(() => {
    localStorage.setItem('obsidian_folder_path', folderPath);
  }, [folderPath]);

  if (!creature) return null;

  const markdownContent = generateObsidianMarkdown(creature);
  const obsidianUri = generateObsidianUri(creature, vaultName, folderPath);
  const targetFilePath = `${folderPath.replace(/^\/+|\/+$/g, '')}/${creature.name}.md`;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenObsidianUri = (e) => {
    e.preventDefault();
    showToast(`⚡ Sending to Obsidian: "${creature.name}" in ${vaultName}...`);
    // Try opening via an invisible link or window.location
    const a = document.createElement('a');
    a.href = obsidianUri;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      showToast('📋 Markdown copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownload = () => {
    downloadObsidianMarkdown(creature);
    showToast(`💾 Downloaded ${creature.name}.md`);
  };

  // Direct save using File System Access API if supported in Chromium
  const handleDirectSave = async () => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${creature.name}.md`,
          types: [{
            description: 'Markdown File',
            accept: { 'text/markdown': ['.md'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(markdownContent);
        await writable.close();
        showToast(`✅ Saved directly to vault: ${creature.name}.md`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          handleDownload();
        }
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="obsidian-modal-backdrop" onClick={onClose}>
      <div className="obsidian-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="obsidian-modal-header">
          <div className="obsidian-modal-title-group">
            <div className="obsidian-badge-pill">
              <span className="obsidian-gem">🟣</span>
              <span>Obsidian Vault Bridge</span>
            </div>
            <h3 className="obsidian-modal-heading">Send "{creature.name}" to Obsidian</h3>
            <span className="obsidian-modal-sub">
              Compatible with <strong>Fantasy Statblocks</strong> and <strong>03. Views (Action Dashboard)</strong>
            </span>
          </div>
          <button className="obsidian-modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Vault Configuration Bar */}
        <div className="obsidian-vault-config-panel">
          <div className="obsidian-input-row">
            <div className="obsidian-input-group flex-1">
              <label><Database size={13} /> Vault Name</label>
              <input 
                type="text" 
                value={vaultName} 
                onChange={e => setVaultName(e.target.value)}
                placeholder="DnD - DM (Remote)"
              />
            </div>
            <div className="obsidian-input-group flex-2">
              <label><Folder size={13} /> Target Folder</label>
              <input 
                type="text" 
                value={folderPath} 
                onChange={e => setFolderPath(e.target.value)}
                placeholder="04. Custom Bestiary/00. Criaturas Varias"
              />
            </div>
          </div>
          <div className="obsidian-path-preview">
            <span>Target File:</span> <code>{targetFilePath}</code>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="obsidian-actions-grid">
          {/* Action 1: Direct URI */}
          <button 
            type="button" 
            className="obsidian-action-btn btn-primary-uri"
            onClick={handleOpenObsidianUri}
          >
            <div className="action-btn-icon">⚡</div>
            <div className="action-btn-text">
              <strong>Open & Create in Obsidian</strong>
              <span>Invokes obsidian://new directly in your vault</span>
            </div>
            <ExternalLink size={16} className="action-corner-icon" />
          </button>

          {/* Action 2: Direct Save / Download */}
          <button 
            type="button" 
            className="obsidian-action-btn btn-secondary-save"
            onClick={handleDirectSave}
          >
            <div className="action-btn-icon"><Download size={18} /></div>
            <div className="action-btn-text">
              <strong>Save / Download .md File</strong>
              <span>Instant .md file ready for your bestiary folder</span>
            </div>
          </button>

          {/* Action 3: Copy Markdown */}
          <button 
            type="button" 
            className="obsidian-action-btn btn-tertiary-copy"
            onClick={handleCopyMarkdown}
          >
            <div className="action-btn-icon">
              {copied ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </div>
            <div className="action-btn-text">
              <strong>{copied ? 'Statblock Copied!' : 'Copy Markdown'}</strong>
              <span>Paste into session notes or custom encounter files</span>
            </div>
          </button>
        </div>

        {/* Real-time Toast Feedback */}
        {toastMessage && (
          <div className="obsidian-toast-banner">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Benefits & Sync Note */}
        <div className="obsidian-sync-info-box">
          <div className="sync-info-item">
            <Sparkles size={15} className="text-purple-accent flex-shrink-0" />
            <span>
              <strong>Cross-Device Sync:</strong> Once saved in <code>DnD - DM (Remote)</code> on your PC, <strong>Obsidian Sync</strong> automatically propagates this creature to your laptop in seconds.
            </span>
          </div>
          <div className="sync-info-item">
            <span className="flex-shrink-0">🐉</span>
            <span>
              <strong>03. Views Integration:</strong> Your creature searcher in Obsidian will index this note immediately for one-click Action Dashboard combat tracking.
            </span>
          </div>
        </div>

        {/* Code Preview Toggle */}
        <div className="obsidian-preview-accordion">
          <button 
            type="button" 
            className="obsidian-toggle-code-btn"
            onClick={() => setShowCodePreview(prev => !prev)}
          >
            <span>{showCodePreview ? '▼ Hide Markdown Preview' : '▶ Show Markdown Preview'}</span>
            <span className="code-length-tag">{markdownContent.length} chars</span>
          </button>

          {showCodePreview && (
            <div className="obsidian-code-box">
              <pre><code>{markdownContent}</code></pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
