const fs = require('fs');
const path = require('path');

const demoDataPath = path.join(__dirname, 'demo_breakers_data.json');
const creaturesData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demostración Segura - Pruebas de Estrés "Rompe-Statblock" (Obsidian Fantasy Statblocks)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    
    /* Obsidian Simulation Styles */
    .obsidian-window {
      background: #18181f;
      border: 1px solid #2e2e38;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .obsidian-tab {
      background: #1e1e26;
      border-top: 2px solid #a855f7;
    }
    
    /* 5e Fantasy Statblock Parchment CSS (Matches obsidian-5e-statblocks basic-5e-layout) */
    .fantasy-statblock {
      background: linear-gradient(135deg, #1a1714 0%, #221e1a 100%);
      border: 2px solid #922610;
      border-image: linear-gradient(to bottom, #c5311b, #7a1d0d) 1;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0, 0, 0, 0.5);
      color: #e2dcd2;
      font-size: 13px;
      line-height: 1.45;
    }
    .fs-header {
      border-bottom: 2px solid #922610;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .fs-title {
      font-family: 'Cinzel', serif;
      color: #e09f3e;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.5px;
      line-height: 1.1;
      text-transform: capitalize;
    }
    .fs-subtitle {
      font-style: italic;
      color: #a8a096;
      font-size: 12px;
    }
    .fs-divider {
      height: 2px;
      background: linear-gradient(90deg, #922610 0%, #d4af37 50%, #922610 100%);
      margin: 10px 0;
    }
    .fs-ability-table {
      width: 100%;
      text-align: center;
      margin: 8px 0;
      border-collapse: collapse;
    }
    .fs-ability-table th {
      color: #922610;
      font-weight: 700;
      font-size: 11px;
      padding: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .fs-ability-table td {
      color: #f3efe6;
      font-size: 12px;
      padding: 4px 2px;
    }
    .fs-section-title {
      font-family: 'Cinzel', serif;
      color: #922610;
      font-size: 16px;
      font-weight: 700;
      border-bottom: 1px solid #922610;
      padding-bottom: 2px;
      margin-top: 12px;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .fs-property-line {
      margin-bottom: 4px;
      color: #ded7cb;
    }
    .fs-property-name {
      font-weight: 700;
      color: #f1ebd9;
    }
    
    /* Bestiary Modular Card Styles */
    .bestiary-card {
      background: #0f1219;
      border: 1px solid #1f2638;
      border-radius: 16px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6);
    }
    .modular-action-card {
      background: #141824;
      border: 1px solid #232b40;
      border-radius: 12px;
      padding: 12px;
      transition: all 0.2s ease;
    }
    .modular-action-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }
  </style>
</head>
<body class="bg-[#08090d] text-slate-100 min-h-screen p-3 md:p-6">

  <!-- Modal de Notificación de Exportación -->
  <div id="export-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#12141c] border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold">
            🟣
          </div>
          <div>
            <h3 class="font-bold text-white text-base">Exportación a Obsidian Lista</h3>
            <p class="text-xs text-slate-400">Protocolo <code class="text-purple-300">obsidian://new</code> generado</p>
          </div>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white text-lg px-2">✕</button>
      </div>

      <div class="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
        <div class="flex justify-between text-slate-300">
          <span class="text-slate-500">Bóveda (Vault):</span>
          <span class="font-semibold text-purple-300 font-mono">DnD - DM (Remote)</span>
        </div>
        <div class="flex justify-between text-slate-300">
          <span class="text-slate-500">Carpeta destino:</span>
          <span class="font-semibold text-slate-300 font-mono">04. Custom Bestiary/00. Criaturas Varias/</span>
        </div>
        <div class="flex justify-between text-slate-300">
          <span class="text-slate-500">Nombre de archivo:</span>
          <span id="modal-file-name" class="font-bold text-amber-300 font-mono"></span>
        </div>
        <div class="flex justify-between text-slate-300">
          <span class="text-slate-500">Longitud de Payload:</span>
          <span id="modal-uri-len" class="font-mono text-purple-400"></span>
        </div>
      </div>

      <!-- Alerta si el payload es muy grande para URI directa en Windows -->
      <div id="modal-uri-warning" class="hidden p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] leading-tight space-y-1">
        <strong>⚠️ Payload Extenso (> 4KB):</strong>
        <p>Algunos navegadores en Windows pueden truncar URIs muy largas de protocolos externos. Si Obsidian te da error de JSON incompleto al abrir el enlace directo, usa el botón <strong>"Copiar Markdown"</strong> o <strong>"Descargar .md"</strong> (ambos transfieren el 100% íntegro sin límites).</p>
      </div>

      <div class="space-y-2">
        <p class="text-xs text-slate-400">
          Elige el método de transferencia que prefieras:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <a id="modal-open-uri-btn" href="#" target="_blank" onclick="handleUriClick()" class="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/30">
            <span>🚀</span> Abrir en Obsidian
          </a>
          <button onclick="copyCurrentMarkdown()" class="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700">
            <span id="modal-copy-icon">📋</span> <span id="modal-copy-text">Copiar Markdown</span>
          </button>
        </div>

        <button onclick="downloadCurrentMd()" class="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 px-4 rounded-xl text-xs transition-all border border-slate-800">
          <span>📥</span> Descargar archivo .md directo
        </button>
      </div>

      <div class="border-t border-slate-800/80 pt-3">
        <details class="text-[11px] text-slate-500">
          <summary class="cursor-pointer hover:text-slate-300">Ver URL técnica completa del protocolo</summary>
          <div id="modal-uri-text" class="mt-2 p-2 bg-black/60 rounded font-mono text-[10px] break-all text-slate-400 border border-slate-800 max-h-24 overflow-y-auto"></div>
        </details>
      </div>
    </div>
  </div>

  <!-- Toast flotante de confirmación rápida -->
  <div id="toast" class="fixed bottom-6 right-6 bg-slate-900 border border-purple-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs transition-all duration-300 opacity-0 translate-y-4 pointer-events-none z-50">
    <span class="text-lg">✨</span>
    <div>
      <div id="toast-title" class="font-bold text-purple-300">Copiado al portapapeles</div>
      <div id="toast-desc" class="text-slate-400 text-[11px]">Listo para pegar en tu nota de sesión</div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Top Sandbox Badge / Header -->
    <header class="border-b border-slate-800 pb-5 space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Batería de Pruebas de Estrés "Rompe-Statblocks"
            </span>
            <span class="text-slate-500 text-xs">•</span>
            <span class="text-slate-400 text-xs font-mono">Entorno Seguro / Código Base Intacto</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
            Laboratorio de Criaturas Complejas para Fantasy Statblocks
          </h1>
          <p class="text-slate-400 text-xs md:text-sm">
            Prueba interactiva del botón de exportación para Jeremy Valentine's <strong class="text-purple-300">Fantasy Statblocks (v4.10.3)</strong> con los casos límite más extremos de D&D 5e hacia <code class="text-amber-300 font-mono">DnD - DM (Remote)</code>.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a href="demos.html" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all">
            ← Ver Comparativa UI
          </a>
        </div>
      </div>

      <!-- Barra de Estado de la Bóveda -->
      <div class="bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 text-slate-300">
          <span class="text-purple-400 font-bold text-base">🟣</span>
          <span><strong>Destino en Vault:</strong> <code class="bg-slate-950 px-2 py-0.5 rounded border border-purple-500/30 text-purple-300 font-mono">C:\\Obsidian Remote\\DnD - DM (Remote)\\04. Custom Bestiary\\00. Criaturas Varias\\</code></span>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-slate-400">
          <span class="flex items-center gap-1 text-emerald-400">✓ JSON Validado 100% Libre de Errores de Sintaxis</span>
          <span class="flex items-center gap-1 text-amber-400">✓ 8 Criaturas Disponibles</span>
        </div>
      </div>
    </header>

    <!-- Selector de Filtros de Criaturas -->
    <section class="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <span>🎯</span> Selecciona la Criatura a Evaluar:
        </span>
        <div class="flex items-center gap-1.5">
          <button onclick="filterCategory('all')" id="filter-all" class="filter-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-slate-950">Todas (8)</button>
          <button onclick="filterCategory('breakers')" id="filter-breakers" class="filter-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white">⚡ Casos Rompe-Statblock (5)</button>
          <button onclick="filterCategory('standard')" id="filter-standard" class="filter-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white">🟢 Casos Estándar (3)</button>
        </div>
      </div>

      <!-- Grilla de Tarjetas Selectoras de Criaturas -->
      <div id="creatures-selector-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <!-- Inyectado por JS -->
      </div>
    </section>

    <!-- Barra de Modo de Vista -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
      <div class="flex items-center gap-1">
        <button onclick="setViewMode('split')" id="tab-split" class="view-tab px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-purple-600 text-white shadow-md">
          🪟 Vista Dividida (Lado a Lado)
        </button>
        <button onclick="setViewMode('bestiary')" id="tab-bestiary" class="view-tab px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all">
          🐉 Ficha Bestiario (Con Botón)
        </button>
        <button onclick="setViewMode('obsidian')" id="tab-obsidian" class="view-tab px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all">
          📓 Simulador Nota Obsidian
        </button>
        <button onclick="setViewMode('raw')" id="tab-raw" class="view-tab px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all">
          💻 Código Markdown / JSON (.md)
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="triggerExportAction()" class="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-purple-600/30 transition-all">
          <span>🟣</span> <span>Probar Exportar Nota Ahora</span>
        </button>
      </div>
    </div>

    <!-- Tarjeta de Diagnóstico Técnico del "Rompe-Statblock" Actual -->
    <div id="breaker-diagnostics" class="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      <!-- Inyectado por JS -->
    </div>

    <!-- Contenedor Principal de Contenido Dinámico -->
    <main id="main-content" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      <!-- Panel Izquierdo: Ficha Modular del Bestiario -->
      <section id="panel-bestiary" class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
          <span class="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
            <span>🐉</span> Vista de la Ficha en la Aplicación (Bestiary)
          </span>
          <span class="text-[11px] font-mono text-slate-500">Pulsa el botón violeta para exportar</span>
        </div>

        <div id="bestiary-card-container">
          <!-- Inyectado por JS -->
        </div>
      </section>

      <!-- Panel Derecho: Simulador de la Nota en Obsidian -->
      <section id="panel-obsidian" class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
          <span class="font-bold uppercase tracking-wider flex items-center gap-1.5 text-purple-300">
            <span>📓</span> Resultado Exacto en Obsidian (DnD - DM Remote)
          </span>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono text-emerald-400">● 5e Statblocks Render</span>
          </div>
        </div>

        <div id="obsidian-simulator-container">
          <!-- Inyectado por JS -->
        </div>
      </section>

      <!-- Panel Alternativo de Código Puro -->
      <section id="panel-raw" class="lg:col-span-2 hidden space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            📄 Contenido Markdown Puro generado para el archivo <span id="raw-filename" class="text-amber-300"></span>
          </span>
          <button onclick="copyCurrentMarkdown()" class="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-lg transition-all font-semibold">
            📋 Copiar Todo el Markdown
          </button>
        </div>
        <pre id="raw-markdown-code" class="bg-[#0b0d13] p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[700px] leading-relaxed"></pre>
      </section>

    </main>

    <!-- Explicación Técnica y Validación contra Errores Comunes -->
    <footer class="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs text-slate-400 mt-8">
      <h4 class="text-sm font-bold text-slate-200 font-cinzel flex items-center gap-2">
        <span>🔬</span> Cómo Este Sistema Evita Que Fantasy Statblocks Se "Rompa"
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <strong class="text-purple-300 block">1. Listas y Objetos Anidados</strong>
          <p class="text-[11px] leading-relaxed">
            Criaturas como el <strong>Beholder</strong> tienen 10 rayos oculares dentro de una sola acción. Nuestro extractor recursivo los serializa como texto claro con saltos de línea e identaciones, evitando que se colapsen o generen <code class="text-rose-400">[object Object]</code>.
          </p>
        </div>
        <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <strong class="text-amber-300 block">2. Mega-Listas de Conjuros</strong>
          <p class="text-[11px] leading-relaxed">
            El <strong>Lich</strong> tiene 10 niveles de conjuros. El algoritmo organiza automáticamente los trucos, slots y niveles en líneas limpias y escapa comillas dobles internas para que el bloque JSON nunca falle en <code class="text-amber-400">JSON.parse</code>.
          </p>
        </div>
        <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <strong class="text-rose-300 block">3. Fase 2 & Acciones Míticas</strong>
          <p class="text-[11px] leading-relaxed">
            <strong>Tiamat</strong> y el <strong>Adult Suneater Owlbear</strong> usan <code class="text-rose-300 font-mono">mythic_actions</code> y <code class="text-rose-300 font-mono">mythic_description</code>, los cuales son perfectamente reconocidos por el layout <code class="text-slate-300 font-mono">basic-5e-layout</code> de tu bóveda.
          </p>
        </div>
        <div class="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <strong class="text-emerald-300 block">4. Reacciones y Múltiples Ataques</strong>
          <p class="text-[11px] leading-relaxed">
            La <strong>Marilith</strong> genera bloques nativos de <code class="text-emerald-300 font-mono">reactions</code> con su <em>Parry</em> (+5 AC) y preserva los 7 ataques de su Multiattack sin recortar ninguna regla.
          </p>
        </div>
      </div>
    </footer>

  </div>

  <script>
    const CREATURES = ${JSON.stringify(creaturesData, null, 2)};
    
    let currentIndex = 3; // Empezar con Beholder por defecto para mostrar el caso rompedor
    let currentViewMode = 'split';
    let currentFilter = 'all';

    function filterCategory(cat) {
      currentFilter = cat;
      
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.className = "filter-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white";
      });
      const activeBtn = document.getElementById('filter-' + cat);
      if (activeBtn) activeBtn.className = "filter-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-slate-950";

      renderSelectorGrid();
    }

    function renderSelectorGrid() {
      const grid = document.getElementById('creatures-selector-grid');
      let html = '';

      CREATURES.forEach((c, idx) => {
        const isBreaker = c.tag.includes('Rompe') || c.tag.includes('Benchmark');
        if (currentFilter === 'breakers' && !isBreaker) return;
        if (currentFilter === 'standard' && isBreaker) return;

        const isSelected = idx === currentIndex;
        const borderClass = isSelected 
          ? 'border-purple-500 bg-purple-950/40 text-white shadow-lg shadow-purple-950/50 scale-[1.01]' 
          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white';
        
        const badgeColor = isBreaker ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

        html += \`
          <button onclick="selectCreature(\${idx})" class="creature-select-btn text-left p-2.5 rounded-xl border transition-all relative overflow-hidden \${borderClass}">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-xs \${isSelected ? 'text-amber-300' : 'text-slate-200'} truncate">\${c.name}</span>
              <span class="text-[9px] font-mono px-1.5 py-0.5 rounded-full border \${badgeColor} flex-shrink-0">CR \${c.raw.cr}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
              \${c.breakerReason}
            </div>
            <div class="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>\${c.tag}</span>
              <span class="\${c.uriLength > 7000 ? 'text-purple-400 font-bold' : ''}">\${Math.round(c.uriLength / 1024 * 10) / 10} KB</span>
            </div>
          </button>
        \`;
      });

      grid.innerHTML = html;
    }

    function selectCreature(idx) {
      currentIndex = idx;
      renderSelectorGrid();
      renderCurrent();
    }

    function setViewMode(mode) {
      currentViewMode = mode;
      
      const tabSplit = document.getElementById('tab-split');
      const tabBestiary = document.getElementById('tab-bestiary');
      const tabObsidian = document.getElementById('tab-obsidian');
      const tabRaw = document.getElementById('tab-raw');
      
      const panelBestiary = document.getElementById('panel-bestiary');
      const panelObsidian = document.getElementById('panel-obsidian');
      const panelRaw = document.getElementById('panel-raw');
      const mainContent = document.getElementById('main-content');

      [tabSplit, tabBestiary, tabObsidian, tabRaw].forEach(t => {
        t.className = "view-tab px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all";
      });

      if (mode === 'split') {
        tabSplit.className = "view-tab px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-purple-600 text-white shadow-md";
        mainContent.className = "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start";
        panelBestiary.classList.remove('hidden');
        panelObsidian.classList.remove('hidden');
        panelRaw.classList.add('hidden');
      } else if (mode === 'bestiary') {
        tabBestiary.className = "view-tab px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-md";
        mainContent.className = "grid grid-cols-1 gap-6 items-start max-w-4xl mx-auto";
        panelBestiary.classList.remove('hidden');
        panelObsidian.classList.add('hidden');
        panelRaw.classList.add('hidden');
      } else if (mode === 'obsidian') {
        tabObsidian.className = "view-tab px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-purple-600 text-white shadow-md";
        mainContent.className = "grid grid-cols-1 gap-6 items-start max-w-4xl mx-auto";
        panelBestiary.classList.add('hidden');
        panelObsidian.classList.remove('hidden');
        panelRaw.classList.add('hidden');
      } else if (mode === 'raw') {
        tabRaw.className = "view-tab px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-slate-700 text-white shadow-md";
        panelBestiary.classList.add('hidden');
        panelObsidian.classList.add('hidden');
        panelRaw.classList.remove('hidden');
      }
    }

    function getMod(val) {
      const m = Math.floor((val - 10) / 2);
      return m >= 0 ? '+' + m : String(m);
    }

    function renderCurrent() {
      const c = CREATURES[currentIndex];
      const raw = c.raw;
      const sb = c.statblockJson;

      // Renderizar Diagnóstico Técnico
      const diag = document.getElementById('breaker-diagnostics');
      const isBreaker = c.tag.includes('Rompe') || c.tag.includes('Benchmark');
      diag.innerHTML = \`
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl \${isBreaker ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'} flex items-center justify-center font-bold text-lg flex-shrink-0">
            \${isBreaker ? '⚡' : '🛡️'}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <strong class="text-white text-sm font-cinzel">\${c.name} (\${c.tag})</strong>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">Payload: \${c.uriLength} caracteres</span>
            </div>
            <p class="text-slate-300 text-xs mt-0.5">\${c.breakerReason}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          \${c.uriLength > 7000 ? \`
            <span class="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold">
              ⚠️ Payload > 7KB (Recomendado: Copiar)
            </span>
          \` : \`
            <span class="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold">
              ✓ Protocolo URI Directo OK
            </span>
          \`}
          <button onclick="triggerExportAction()" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all">
            Exportar
          </button>
        </div>
      \`;

      // 1. Renderizar Ficha Modular en Bestiario (Izquierda)
      const bestiaryContainer = document.getElementById('bestiary-card-container');
      bestiaryContainer.innerHTML = \`
        <div class="bestiary-card p-5 space-y-4">
          <!-- Header de Criatura -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-full border-2 border-amber-500/60 bg-slate-900 flex items-center justify-center text-2xl shadow-lg">
                \${raw.name.includes('Beholder') ? '👁️' : raw.name.includes('Lich') ? '💀' : raw.name.includes('Tiamat') ? '🐲' : raw.name.includes('Owlbear') ? '🦉' : raw.name.includes('Marilith') ? '⚔️' : raw.name.includes('Dragon') ? '🐉' : raw.name.includes('Mind') ? '🦑' : '👺'}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-xl font-black font-cinzel text-amber-300">\${raw.name}</h2>
                  <span class="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">CR \${raw.cr}</span>
                  <span class="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">PB \${sb.proficiency_bonus}</span>
                </div>
                <p class="text-xs text-slate-400 italic">
                  \${sb.size} \${sb.type}, \${sb.alignment} • \${raw.source}
                </p>
              </div>
            </div>

            <!-- BOTÓN PRINCIPAL DE EXPORTACIÓN A OBSIDIAN -->
            <button onclick="triggerExportAction()" class="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-lg shadow-purple-900/50 hover:scale-[1.02] border border-purple-400/30 flex-shrink-0">
              <span class="text-sm">🟣</span>
              <div class="text-left leading-tight">
                <div class="text-[10px] text-purple-200 uppercase font-mono">Exportar</div>
                <div>A Obsidian</div>
              </div>
            </button>
          </div>

          <!-- Métricas Tácticas HUD: AC, HP, Speed -->
          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-cyan-900/40 text-center">
              <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Clase Armadura</span>
              <span class="text-sm sm:text-base font-extrabold text-cyan-200">\${sb.ac}</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-rose-900/40 text-center">
              <span class="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Puntos Golpe</span>
              <span class="text-sm sm:text-base font-extrabold text-rose-300">\${sb.hp}</span>
              <span class="text-[10px] text-slate-400 block font-mono">(\${sb.hit_dice})</span>
            </div>
            <div class="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-900/40 text-center">
              <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Velocidad</span>
              <span class="text-xs font-bold text-emerald-300 block mt-1">\${sb.speed}</span>
            </div>
          </div>

          <!-- Matriz de Atributos -->
          <div class="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center font-mono">
            \${['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((attr, i) => \`
              <div class="p-1">
                <span class="text-[10px] text-slate-500 block">\${attr}</span>
                <span class="text-xs font-bold text-slate-200 block">\${sb.stats[i]}</span>
                <span class="text-[11px] font-bold text-amber-400 block">\${getMod(sb.stats[i])}</span>
              </div>
            \`).join('')}
          </div>

          <!-- Salvaciones y Habilidades -->
          <div class="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
            \${sb.saves ? \`
              <div class="flex items-start gap-1.5">
                <strong class="text-purple-400 flex-shrink-0">Salvaciones:</strong>
                <span class="text-slate-300 font-mono">\${sb.saves.map(s => Object.entries(s).map(([k, v]) => \`\${k.toUpperCase()} \${v}\`)).join(', ')}</span>
              </div>
            \` : ''}
            \${sb.skills ? \`
              <div class="flex items-start gap-1.5">
                <strong class="text-amber-400 flex-shrink-0">Habilidades:</strong>
                <span class="text-slate-300 font-mono">\${Object.entries(sb.skills).map(([k, v]) => \`\${k} \${v}\`).join(', ')}</span>
              </div>
            \` : ''}
            \${sb.damage_resistances ? \`
              <div class="flex items-start gap-1.5">
                <strong class="text-cyan-400 flex-shrink-0">Resistencias:</strong>
                <span class="text-slate-300">\${sb.damage_resistances}</span>
              </div>
            \` : ''}
            \${sb.damage_immunities ? \`
              <div class="flex items-start gap-1.5">
                <strong class="text-rose-400 flex-shrink-0">Inmunidades Daño:</strong>
                <span class="text-slate-300">\${sb.damage_immunities}</span>
              </div>
            \` : ''}
            \${sb.condition_immunities ? \`
              <div class="flex items-start gap-1.5">
                <strong class="text-amber-400 flex-shrink-0">Inmunidades Estado:</strong>
                <span class="text-slate-300">\${sb.condition_immunities}</span>
              </div>
            \` : ''}
            <div class="flex items-start gap-1.5">
              <strong class="text-slate-400 flex-shrink-0">Sentidos:</strong>
              <span class="text-slate-300">\${sb.senses}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <strong class="text-slate-400 flex-shrink-0">Idiomas:</strong>
              <span class="text-slate-300">\${sb.languages}</span>
            </div>
          </div>

          <!-- Rasgos Especiales (Traits) -->
          \${sb.traits && sb.traits.length > 0 ? \`
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-400 font-cinzel">Rasgos Especiales</h4>
              <div class="space-y-1.5">
                \${sb.traits.map(t => \`
                  <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <strong class="text-amber-300 font-bold">\${t.name}.</strong>
                    <div class="text-slate-300 whitespace-pre-line mt-1">\${t.desc}</div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Acciones de Combate (Tarjetas Modulares) -->
          \${sb.actions && sb.actions.length > 0 ? \`
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-rose-400 font-cinzel flex items-center gap-1.5">
                <span>⚔️</span> Acciones de Combate
              </h4>
              <div class="space-y-2">
                \${sb.actions.map(a => \`
                  <div class="modular-action-card space-y-1.5">
                    <div class="flex items-center justify-between">
                      <h5 class="font-bold text-xs text-white">\${a.name}</h5>
                      <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Acción</span>
                    </div>
                    <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">\${a.desc}</div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Reacciones si aplica -->
          \${sb.reactions && sb.reactions.length > 0 ? \`
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400 font-cinzel flex items-center gap-1.5">
                <span>⚡</span> Reacciones
              </h4>
              <div class="space-y-1.5">
                \${sb.reactions.map(r => \`
                  <div class="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/30 text-xs">
                    <strong class="text-emerald-300 font-bold">\${r.name}.</strong>
                    <span class="text-slate-300 ml-1">\${r.desc}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Acciones Legendarias si aplica -->
          \${sb.legendary_actions && sb.legendary_actions.length > 0 ? \`
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 font-cinzel flex items-center gap-1.5">
                <span>👑</span> Acciones Legendarias (3/Ronda)
              </h4>
              <div class="space-y-1.5">
                \${sb.legendary_actions.map(la => \`
                  <div class="bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/30 text-xs">
                    <strong class="text-purple-300 font-bold">\${la.name}.</strong>
                    <span class="text-slate-300 ml-1">\${la.desc}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Acciones Míticas si aplica -->
          \${sb.mythic_actions && sb.mythic_actions.length > 0 ? \`
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-rose-500 font-cinzel flex items-center gap-1.5">
                <span>🔥</span> Acciones Míticas (Fase 2 de Jefe)
              </h4>
              <div class="text-[11px] text-amber-300/80 italic">\${sb.mythic_description}</div>
              <div class="space-y-1.5">
                \${sb.mythic_actions.map(ma => \`
                  <div class="bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/30 text-xs">
                    <strong class="text-rose-400 font-bold">\${ma.name}.</strong>
                    <span class="text-slate-300 ml-1">\${ma.desc}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}
        </div>
      \`;

      // 2. Renderizar Simulador de Nota en Obsidian (Derecha)
      const obsidianContainer = document.getElementById('obsidian-simulator-container');
      obsidianContainer.innerHTML = \`
        <div class="obsidian-window rounded-2xl overflow-hidden">
          <div class="bg-[#121217] px-3 py-2 border-b border-[#2e2e38] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="flex gap-1.5 mr-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <div class="obsidian-tab px-3 py-1 rounded-t-md text-xs font-mono text-purple-300 flex items-center gap-1.5 border border-b-0 border-[#2e2e38]">
                <span>🟣</span>
                <span>\${raw.name}.md</span>
                <span class="text-slate-500 hover:text-white cursor-pointer ml-1">×</span>
              </div>
            </div>
            <div class="text-[10px] text-slate-500 font-mono hidden sm:block">
              Vault: DnD - DM (Remote)
            </div>
          </div>

          <div class="p-4 sm:p-6 max-h-[850px] overflow-y-auto space-y-4 bg-[#16161c]">
            <div class="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
              <span>Ruta: <strong class="text-slate-300">04. Custom Bestiary / 00. Criaturas Varias / \${raw.name}.md</strong></span>
              <span class="text-purple-400 font-bold">Modo Lectura (Live Preview)</span>
            </div>

            <!-- Ficha Fantasy Statblock simulada -->
            <div class="fantasy-statblock p-4 rounded-sm">
              <div class="fs-header">
                <div class="fs-title">\${sb.name}</div>
                <div class="fs-subtitle">\${sb.size} \${sb.type}, \${sb.alignment}</div>
              </div>

              <div class="fs-divider"></div>

              <div class="fs-property-line">
                <span class="fs-property-name">Armor Class</span> <span>\${sb.ac}</span>
              </div>
              <div class="fs-property-line">
                <span class="fs-property-name">Hit Points</span> <span>\${sb.hp} (\${sb.hit_dice})</span>
              </div>
              <div class="fs-property-line">
                <span class="fs-property-name">Speed</span> <span>\${sb.speed}</span>
              </div>

              <div class="fs-divider"></div>

              <table class="fs-ability-table">
                <thead>
                  <tr>
                    <th>STR</th>
                    <th>DEX</th>
                    <th>CON</th>
                    <th>INT</th>
                    <th>WIS</th>
                    <th>CHA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    \${sb.stats.map(s => \`<td>\${s} (\${getMod(s)})</td>\`).join('')}
                  </tr>
                </tbody>
              </table>

              <div class="fs-divider"></div>

              \${sb.saves ? \`
                <div class="fs-property-line">
                  <span class="fs-property-name">Saving Throws</span> 
                  <span>\${sb.saves.map(s => Object.entries(s).map(([k, v]) => \`\${k.charAt(0).toUpperCase() + k.slice(1)} \${v}\`)).join(', ')}</span>
                </div>
              \` : ''}

              \${sb.skills ? \`
                <div class="fs-property-line">
                  <span class="fs-property-name">Skills</span> 
                  <span>\${Object.entries(sb.skills).map(([k, v]) => \`\${k} \${v}\`).join(', ')}</span>
                </div>
              \` : ''}

              \${sb.damage_resistances ? \`
                <div class="fs-property-line">
                  <span class="fs-property-name">Damage Resistances</span> <span>\${sb.damage_resistances}</span>
                </div>
              \` : ''}

              \${sb.damage_immunities ? \`
                <div class="fs-property-line">
                  <span class="fs-property-name">Damage Immunities</span> <span>\${sb.damage_immunities}</span>
                </div>
              \` : ''}

              \${sb.condition_immunities ? \`
                <div class="fs-property-line">
                  <span class="fs-property-name">Condition Immunities</span> <span>\${sb.condition_immunities}</span>
                </div>
              \` : ''}

              <div class="fs-property-line">
                <span class="fs-property-name">Senses</span> <span>\${sb.senses}</span>
              </div>
              <div class="fs-property-line">
                <span class="fs-property-name">Languages</span> <span>\${sb.languages}</span>
              </div>
              <div class="fs-property-line">
                <span class="fs-property-name">Challenge</span> <span>\${sb.cr} (\${raw.xp || ''} XP)</span>
                <span class="ml-2"><span class="fs-property-name">Proficiency Bonus</span> \${sb.proficiency_bonus}</span>
              </div>

              <div class="fs-divider"></div>

              <!-- Traits -->
              \${sb.traits && sb.traits.length > 0 ? \`
                \${sb.traits.map(t => \`
                  <div class="my-2">
                    <span class="font-bold italic text-[#f1ebd9]">\${t.name}.</span>
                    <span class="whitespace-pre-line ml-1">\${t.desc}</span>
                  </div>
                \`).join('')}
              \` : ''}

              <!-- Actions -->
              \${sb.actions && sb.actions.length > 0 ? \`
                <div class="fs-section-title">Actions</div>
                \${sb.actions.map(a => \`
                  <div class="my-2">
                    <span class="font-bold italic text-[#f1ebd9]">\${a.name}.</span>
                    <span class="whitespace-pre-line ml-1">\${a.desc}</span>
                  </div>
                \`).join('')}
              \` : ''}

              <!-- Reactions -->
              \${sb.reactions && sb.reactions.length > 0 ? \`
                <div class="fs-section-title">Reactions</div>
                \${sb.reactions.map(r => \`
                  <div class="my-2">
                    <span class="font-bold italic text-[#f1ebd9]">\${r.name}.</span>
                    <span class="ml-1">\${r.desc}</span>
                  </div>
                \`).join('')}
              \` : ''}

              <!-- Legendary Actions -->
              \${sb.legendary_actions && sb.legendary_actions.length > 0 ? \`
                <div class="fs-section-title">Legendary Actions</div>
                <div class="my-2 text-[12px] italic text-[#d4af37]">
                  \${sb.legendary_description}
                </div>
                \${sb.legendary_actions.map(la => \`
                  <div class="my-2">
                    <span class="font-bold italic text-[#f1ebd9]">\${la.name}.</span>
                    <span class="ml-1">\${la.desc}</span>
                  </div>
                \`).join('')}
              \` : ''}

              <!-- Mythic Actions -->
              \${sb.mythic_actions && sb.mythic_actions.length > 0 ? \`
                <div class="fs-section-title">Mythic Actions</div>
                <div class="my-2 text-[12px] italic text-[#d4af37]">
                  \${sb.mythic_description}
                </div>
                \${sb.mythic_actions.map(ma => \`
                  <div class="my-2">
                    <span class="font-bold italic text-[#f1ebd9]">\${ma.name}.</span>
                    <span class="ml-1">\${ma.desc}</span>
                  </div>
                \`).join('')}
              \` : ''}
            </div>

            <!-- Embebido de Ilustración abajo de la nota -->
            <div class="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center bg-slate-900/40 space-y-2">
              <div class="text-xs font-mono text-purple-300">![[\${raw.name}.png|center|350]]</div>
              <p class="text-[11px] text-slate-500">
                (Obsidian mostrará automáticamente la ilustración o token vinculado desde tu bóveda)
              </p>
            </div>
          </div>
        </div>
      \`;

      // 3. Renderizar Código Markdown Puro
      document.getElementById('raw-filename').textContent = raw.name + '.md';
      document.getElementById('raw-markdown-code').textContent = c.markdown;
    }

    function triggerExportAction() {
      const c = CREATURES[currentIndex];
      document.getElementById('modal-file-name').textContent = c.raw.name + '.md';
      document.getElementById('modal-open-uri-btn').href = c.obsidianUri;
      document.getElementById('modal-uri-text').textContent = c.obsidianUri;
      document.getElementById('modal-uri-len').textContent = c.uriLength + ' caracteres';
      
      const warnBox = document.getElementById('modal-uri-warning');
      if (c.uriLength > 5000) {
        warnBox.classList.remove('hidden');
      } else {
        warnBox.classList.add('hidden');
      }

      document.getElementById('export-modal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('export-modal').classList.add('hidden');
    }

    function handleUriClick() {
      showToast('Enviado a Obsidian', 'Abriendo o creando nota en DnD - DM (Remote)...');
    }

    function copyCurrentMarkdown() {
      const c = CREATURES[currentIndex];
      navigator.clipboard.writeText(c.markdown).then(() => {
        const icon = document.getElementById('modal-copy-icon');
        const text = document.getElementById('modal-copy-text');
        if (icon) icon.textContent = '✓';
        if (text) text.textContent = '¡Copiado!';
        showToast('¡Markdown Copiado!', 'Formato 5e Statblocks listo para pegar en Obsidian.');
        setTimeout(() => {
          if (icon) icon.textContent = '📋';
          if (text) text.textContent = 'Copiar Markdown';
        }, 2000);
      });
    }

    function downloadCurrentMd() {
      const c = CREATURES[currentIndex];
      const blob = new Blob([c.markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = c.raw.name + '.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Descargado', c.raw.name + '.md listo para arrastrar a tu bóveda.');
    }

    function showToast(title, desc) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-title').textContent = title;
      document.getElementById('toast-desc').textContent = desc;
      toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      }, 3500);
    }

    // Inicializar con la primera vista
    filterCategory('all');
    selectCreature(3); // Iniciar con Beholder
  </script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'obsidian-export-demo.html');
fs.writeFileSync(outPath, htmlContent, 'utf8');
console.log('✓ Archivo public/obsidian-export-demo.html actualizado con casos rompe-statblocks.');

