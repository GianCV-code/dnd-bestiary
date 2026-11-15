import React, { useState } from 'react';
import {
  Save,
  FolderOpen,
  Share2,
  Check,
  HardDrive,
  AlertCircle
} from 'lucide-react';

export default function PartySyncBar({ customPlayers, onPartyLoaded }) {
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Guardar en G: (o en cualquier carpeta local / nube)
  const handleSaveToDrive = async () => {
    const jsonStr = JSON.stringify(customPlayers, null, 2);

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'dnd_party.json',
          types: [{
            description: 'D&D Player Party (JSON)',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        showToast(`Saved to "${handle.name}"! Google Drive will sync it.`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          showToast('Error saving file', 'error');
        }
      }
    } else {
      // Fallback para navegadores sin showSaveFilePicker
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dnd_party.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File dnd_party.json downloaded. Save it to your G: drive folder.');
    }
  };

  // Cargar desde G: (o desde cualquier archivo)
  const handleLoadFromDrive = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'D&D Player Party (JSON)',
            accept: { 'application/json': ['.json'] }
          }],
          multiple: false
        });
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        const party = Array.isArray(parsed) ? parsed : parsed.party;

        if (Array.isArray(party) && party.length > 0) {
          onPartyLoaded(party);
          showToast(`Loaded "${file.name}" and saved to this PC!`);
        } else {
          showToast('The file does not contain a valid party list', 'error');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          showToast('Error reading file', 'error');
        }
      }
    } else {
      // Fallback con input oculto
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            const party = Array.isArray(parsed) ? parsed : parsed.party;
            if (Array.isArray(party) && party.length > 0) {
              onPartyLoaded(party);
              showToast(`Loaded "${file.name}" and saved to this PC!`);
            }
          } catch (err) {
            showToast('Invalid JSON file', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  // Copiar link directo con los jugadores
  const handleCopyLink = () => {
    try {
      const compactData = customPlayers.map(p => ({
        name: p.name,
        class: p.className,
        lvl: p.level,
        hp: p.hp,
        ac: p.ac,
        hit: p.toHit,
        dpr: p.dpr
      }));
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compactData)))));
      const url = `${window.location.origin}${window.location.pathname}#party=${encoded}`;
      navigator.clipboard.writeText(url);
      showToast('Link copied! Open on your other PC to transfer party.');
    } catch (e) {
      console.error(e);
      showToast('Could not generate link', 'error');
    }
  };

  return (
    <div className="party-sync-box">
      <div className="party-sync-header">
        <span className="party-sync-title">
          <HardDrive size={12} color="var(--accent-gold)" />
          Sync across devices (Google Drive / G:)
        </span>
        <button
          type="button"
          className="party-sync-share-btn"
          onClick={handleCopyLink}
          title="Copy link with your party to open on another PC"
        >
          <Share2 size={11} /> Link
        </button>
      </div>

      <div className="party-sync-actions">
        <button
          type="button"
          className="party-sync-btn save"
          onClick={handleSaveToDrive}
          title="Save dnd_party.json to your Google Drive G: disk"
        >
          <Save size={13} />
          <span>Save to G:</span>
        </button>

        <button
          type="button"
          className="party-sync-btn load"
          onClick={handleLoadFromDrive}
          title="Load dnd_party.json from your Google Drive G: disk"
        >
          <FolderOpen size={13} />
          <span>Load from G:</span>
        </button>
      </div>

      {notification && (
        <div className={`party-sync-toast ${notification.type}`}>
          {notification.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}

