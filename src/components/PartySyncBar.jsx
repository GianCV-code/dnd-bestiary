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
            description: 'Ficha de Jugadores D&D (JSON)',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        showToast(`¡Guardado en "${handle.name}"! Google Drive lo sincronizará.`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          showToast('Error al guardar el archivo', 'error');
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
      showToast('Archivo dnd_party.json descargado. Guárdalo en tu carpeta G:');
    }
  };

  // Cargar desde G: (o desde cualquier archivo)
  const handleLoadFromDrive = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Ficha de Jugadores D&D (JSON)',
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
          showToast(`¡Cargado "${file.name}" y guardado en esta PC!`);
        } else {
          showToast('El archivo no contiene una lista de jugadores válida', 'error');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          showToast('Error al leer el archivo', 'error');
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
              showToast(`¡Cargado "${file.name}" y guardado en esta PC!`);
            }
          } catch (err) {
            showToast('Archivo JSON no válido', 'error');
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
      showToast('¡Enlace copiado! Ábrelo en tu otra PC para transferir el grupo.');
    } catch (e) {
      console.error(e);
      showToast('No se pudo generar el enlace', 'error');
    }
  };

  return (
    <div className="party-sync-box">
      <div className="party-sync-header">
        <span className="party-sync-title">
          <HardDrive size={12} color="var(--accent-gold)" />
          Sincronizar entre PCs (Google Drive / G:)
        </span>
        <button 
          type="button" 
          className="party-sync-share-btn" 
          onClick={handleCopyLink}
          title="Copiar link con tus jugadores para abrir en otra PC"
        >
          <Share2 size={11} /> Link
        </button>
      </div>

      <div className="party-sync-actions">
        <button 
          type="button" 
          className="party-sync-btn save" 
          onClick={handleSaveToDrive}
          title="Guardar dnd_party.json en tu disco G: de Google Drive"
        >
          <Save size={13} />
          <span>Guardar en G:</span>
        </button>

        <button 
          type="button" 
          className="party-sync-btn load" 
          onClick={handleLoadFromDrive}
          title="Cargar dnd_party.json desde tu disco G: de Google Drive"
        >
          <FolderOpen size={13} />
          <span>Cargar de G:</span>
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

