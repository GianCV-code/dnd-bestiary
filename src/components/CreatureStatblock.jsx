import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Heart, 
  Zap, 
  Sparkles, 
  Activity, 
  Plus, 
  X, 
  Swords, 
  Crown, 
  Flame, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Compass,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { parseModularAction, calculatePB, extractEntryText, clean5eTags } from '../engine/statblockParser';

/**
 * Tarjeta Modular Reutilizable para Acciones, Acciones Adicionales y Reacciones
 */
function ModularCard({ action }) {
  if (!action) return null;
  const hasAttackOrSave = action.atkBonus || action.saveDC;
  const hasDamage = action.avgDamage;

  return (
    <div className="modular-action-card">
      <div>
        {/* Cabecera de la Tarjeta */}
        <div className="modular-card-header">
          <h5 className="modular-action-name">{action.name}</h5>
          <span className="modular-type-badge">{action.atkType}</span>
        </div>

        {/* Bloque HUD de Tirada y Daño (alto contraste) */}
        {(hasAttackOrSave || hasDamage) && (
          <div className="modular-hud-boxes">
            <div className="modular-hud-box">
              <span className="modular-hud-title">Tirada / CD</span>
              {action.saveDC ? (
                <span className="modular-hud-val-save">
                  CD {action.saveDC} {action.saveStat || ''}
                </span>
              ) : action.atkBonus ? (
                <span className="modular-hud-val-atk">
                  {action.atkBonus} to hit
                </span>
              ) : (
                <span className="modular-hud-val-neutral">Acción</span>
              )}
            </div>

            <div className="modular-hud-box">
              <span className="modular-hud-title">Daño Promedio</span>
              {action.avgDamage ? (
                <span className="modular-hud-val-dmg">
                  {action.avgDamage} <span className="modular-dice-sub">({action.damageDice || ''})</span>
                  {action.damageType ? ` ${action.damageType}` : ''}
                  {action.plusDamage ? ` + ${action.plusDamage}` : ''}
                </span>
              ) : (
                <span className="modular-hud-val-neutral">—</span>
              )}
            </div>
          </div>
        )}

        {/* Alcance / Rango si aplica */}
        {action.reach && (
          <div className="modular-reach-text">
            📏 {action.reach}
          </div>
        )}

        {/* Disparador de Reacción si aplica */}
        {action.trigger && (
          <div className="modular-trigger-box">
            <strong>⚡ Disparador:</strong> {action.trigger}
          </div>
        )}

        {/* Caja de Alerta para Condiciones Tácticas (Grappled, Prone, Restrained, etc.) */}
        {action.conditions && action.conditions.length > 0 && (
          <div className="modular-tactical-alert">
            <div className="alert-condition-tags">
              <AlertTriangle size={13} className="flex-shrink-0" />
              <strong>Condición:</strong> {action.conditions.join(', ')}
            </div>
          </div>
        )}

        {/* Texto Completo de la Acción / Regla (Nunca se recorta información) */}
        <div className="modular-full-text">
          {action.narrativeText || action.response || action.rawText}
        </div>
      </div>
    </div>
  );
}

export default function CreatureStatblock({
  creature,
  modalGroup,
  onSelectVersion,
  modalVersionDiffs,
  comparisonBaseline,
  onAddToEncounter,
  onClose
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [artLoadFailed, setArtLoadFailed] = useState(false);

  useEffect(() => {
    setArtLoadFailed(false);
  }, [creature?.id]);

  if (!creature) return null;

  // Calculo de modificadores
  const getMod = (val) => {
    const m = Math.floor((val - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  // Velocidad formateada
  const speedParts = [];
  if (creature.speed) {
    if (creature.speed.walk) speedParts.push(`${creature.speed.walk} ft`);
    else if (typeof creature.speed === 'number') speedParts.push(`${creature.speed} ft`);
    else if (typeof creature.speed === 'string') speedParts.push(creature.speed);

    if (creature.speed.fly) speedParts.push(`volar ${creature.speed.fly} ft${creature.speed.canHover ? ' (levita)' : ''}`);
    if (creature.speed.swim) speedParts.push(`nadar ${creature.speed.swim} ft`);
    if (creature.speed.climb) speedParts.push(`trepar ${creature.speed.climb} ft`);
    if (creature.speed.burrow) speedParts.push(`cavar ${creature.speed.burrow} ft`);
  }
  const speedText = speedParts.length > 0 ? speedParts.join(', ') : '30 ft';

  // Iniciativa estimada o explícita
  const dexMod = Math.floor(((creature.dex || 10) - 10) / 2);
  const initiativeScore = 10 + dexMod;
  const initiativeText = dexMod >= 0 ? `+${dexMod} (${initiativeScore})` : `${dexMod} (${initiativeScore})`;
  const pb = calculatePB(creature.cr);

  // Parsear Acciones
  const rawActions = creature.action || [];
  const parsedActions = rawActions.map(a => parseModularAction(a, 'Acción'));
  const multiattackAction = parsedActions.find(a => a && a.isMultiattack);
  const combatActions = parsedActions.filter(a => a && !a.isMultiattack);

  // Parsear Acciones Adicionales (Bonus Actions)
  const rawBonus = creature.bonus || [];
  const parsedBonus = rawBonus.map(b => parseModularAction(b, 'Acción Adicional'));

  // Parsear Reacciones
  const rawReactions = creature.reaction || [];
  const parsedReactions = rawReactions.map(r => parseModularAction(r, 'Reacción'));

  // Parsear Legendarias y Míticas
  const legendary = creature.legendary || [];
  const mythic = creature.mythic || [];
  const spellcasting = creature.spellcasting || [];

  // Token & Art URLs resolution (with smart MM dragon artwork mapping)
  const source = creature.source || 'MM';
  let artName = creature.name || '';
  if (source === 'MM' && artName.includes('Dragon')) {
    const match = artName.match(/^(Ancient|Young)\s+(.+Dragon)$/i);
    if (match) {
      artName = `Adult ${match[2]}`;
    }
  }

  const tokenUrl = creature.tokenUrl || (
    creature.category === 'Official WotC' || !creature.category
      ? `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/tokens/${source}/${encodeURIComponent(creature.name)}.webp`
      : null
  );

  const fullArtUrl = creature.artUrl || (
    creature.category === 'Official WotC' || !creature.category
      ? `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/${source}/${encodeURIComponent(artName)}.webp`
      : null
  );

  return (
    <div className="statblock-sheet" onClick={e => e.stopPropagation()}>
      
      {/* 1. Hero Cinematic Banner (Modelo Visual 1) */}
      <div className="statblock-hero-banner">
        {/* Fondo del Banner: Ilustración Oficial o Fallback Atmosférico */}
        {fullArtUrl && !artLoadFailed ? (
          <img 
            src={fullArtUrl} 
            alt={creature.name} 
            className="statblock-hero-bg-art"
            onError={() => setArtLoadFailed(true)} 
          />
        ) : (
          <div className="statblock-hero-bg-fallback">
            {tokenUrl && (
              <img 
                src={tokenUrl} 
                alt="" 
                className="statblock-hero-bg-fallback-token" 
              />
            )}
            <div className="statblock-hero-bg-fallback-pattern"></div>
          </div>
        )}

        {/* Degradados de Viñeta Cinematográfica Multi-Capa */}
        <div className="statblock-hero-vignette-bottom"></div>
        <div className="statblock-hero-vignette-top"></div>
        <div className="statblock-hero-vignette-sides"></div>

        {/* Barra Superior de Acciones del Banner */}
        <div className="statblock-hero-top-actions">
          {fullArtUrl && !artLoadFailed && (
            <button 
              type="button"
              className="statblock-hero-btn-zoom"
              onClick={() => setLightboxOpen(true)}
              title="Ver ilustración oficial completa en alta definición"
            >
              <Maximize2 size={13} />
              <span>Ver Ilustración Completa</span>
            </button>
          )}
          <button 
            type="button" 
            className="statblock-hero-btn-close" 
            onClick={onClose} 
            title="Cerrar ficha (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Superpuesto al pie del Banner */}
        <div className="statblock-hero-footer-content">
          {/* Token Flotante con Anillo Dorado */}
          {tokenUrl && (
            <div 
              className="statblock-hero-token-frame"
              onClick={() => setLightboxOpen(true)}
              title="Clic para inspeccionar token / ilustración"
            >
              <img 
                src={tokenUrl} 
                alt={creature.name}
                className="statblock-hero-token-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="statblock-hero-token-badge" title="Token VTT Oficial">
                VTT
              </span>
            </div>
          )}

          {/* Título, Badges y Subtítulo */}
          <div className="statblock-hero-meta-block">
            <div className="statblock-hero-title-row">
              <h2 className="statblock-hero-title">{creature.name}</h2>
              <div className="statblock-hero-badges">
                <span className="cr-badge">CR {creature.cr} ({creature.xp?.toLocaleString ? creature.xp.toLocaleString() : creature.xp} XP)</span>
                <span className="pb-badge">PB +{pb}</span>
              </div>
            </div>

            <p className="statblock-hero-subtitle">
              {creature.size} {creature.type}
              {creature.typeTags && creature.typeTags.length > 0 ? ` (${creature.typeTags.join(', ')})` : ''}, {creature.alignment}
            </p>

            <div className="statblock-hero-pills-row">
              <span className={`publisher-pill ${
                creature.category === 'Third-Party (3PP Pro)' 
                  ? 'pill-3pp' 
                  : creature.category === 'Crossover / Video Games' 
                    ? 'pill-crossover' 
                    : 'pill-wotc'
              }`}>
                {creature.publisher || 'Wizards of the Coast'}
              </span>
              <span className="source-meta-text">
                {creature.sourceGroup || creature.source}
              </span>
              <span className="category-meta-text">
                • {creature.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Selector de Versiones y Diff (si existen múltiples versiones 2024 / 2014) */}
      {modalGroup && modalGroup.versions.length > 1 && (
        <div className="modal-versions-container">
          <div className="modal-versions-header">
            <span className="modal-versions-heading">
              <Sparkles size={14} color="var(--accent-gold)" />
              <span>Versiones disponibles ({modalGroup.versions.length})</span>
            </span>
            <span className="modal-versions-help">
              Haz clic para alternar estadísticas entre ediciones y fuentes
            </span>
          </div>

          <div className="modal-version-tabs">
            {modalGroup.versions.map(v => {
              const isSelected = v.id === creature.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`modal-version-tab ${isSelected ? 'active' : ''} tab-${v.versionMeta.pillType}`}
                  onClick={() => onSelectVersion && onSelectVersion(v)}
                >
                  <div className="tab-top-row">
                    <span className="tab-badge-title">
                      {v.versionMeta.is2024 && '✨ '}
                      {v.versionMeta.is2014 && '📜 '}
                      {v.versionMeta.badge}
                    </span>
                    {isSelected && <span className="tab-selected-dot">● Activa</span>}
                  </div>
                  <div className="tab-source-sub" title={v.sourceGroup || v.source}>
                    {v.sourceGroup || v.source}
                  </div>
                  <div className="tab-quick-stats">
                    CR {v.cr} • {v.hp} HP • CA {v.ac}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Smart Diff Comparison Banner */}
          {modalVersionDiffs && modalVersionDiffs.length > 0 && comparisonBaseline && (
            <div className="modal-version-diff-card">
              <div className="diff-header">
                <Activity size={13} color="var(--accent-gold)" />
                <span>
                  Diferencias respecto a <strong>{comparisonBaseline.versionMeta.shortLabel} ({comparisonBaseline.source})</strong>:
                </span>
              </div>
              <div className="diff-badges-row">
                {modalVersionDiffs.map((d, idx) => (
                  <span key={idx} className="diff-chip" title={d.text}>
                    <strong>{d.label}:</strong> {d.delta ? `${d.from} → ${d.to} (${d.delta})` : `${d.from} → ${d.to}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Cuerpo del Statblock */}
      <div className="statblock-body">

        {/* Vitales en Franja HUD */}
        <div className="vitals-modular-strip">
          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-ac">
              <Shield size={18} />
            </div>
            <div>
              <span className="vital-label">Clase Armadura</span>
              <span className="vital-value">{creature.acText || creature.ac}</span>
            </div>
          </div>

          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-hp">
              <Heart size={18} />
            </div>
            <div>
              <span className="vital-label">Puntos de Golpe</span>
              <span className="vital-value text-hp">
                {creature.hp} <span className="vital-sub">({creature.hpFormula || 'Dado base'})</span>
              </span>
            </div>
          </div>

          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-speed">
              <Zap size={18} />
            </div>
            <div>
              <span className="vital-label">Velocidad / Inic.</span>
              <span className="vital-value text-speed">{speedText} <span className="vital-sub">Inic {initiativeText}</span></span>
            </div>
          </div>
        </div>

        {/* Matriz de Habilidades (6 Atributos) */}
        <div className="abilities-grid">
          {[
            { label: 'FUE / STR', val: creature.str },
            { label: 'DES / DEX', val: creature.dex },
            { label: 'CON', val: creature.con },
            { label: 'INT', val: creature.int },
            { label: 'SAB / WIS', val: creature.wis },
            { label: 'CAR / CHA', val: creature.cha },
          ].map(att => {
            const modStr = getMod(att.val);
            return (
              <div key={att.label} className="ability-cell">
                <span className="ability-label">{att.label}</span>
                <span className="ability-score">{att.val}</span>
                <span className="ability-mod">{modStr}</span>
              </div>
            );
          })}
        </div>

        {/* Defensas, Salvaciones, Sentidos e Idiomas */}
        <div className="defenses-modular-card">
          {creature.forcesSaves && creature.forcesSaves.length > 0 && (
            <div className="defense-row text-forces-saves">
              <Zap size={14} className="flex-shrink-0" />
              <span><strong>Exige Salvaciones (Ofensivas):</strong> {creature.forcesSaves.map(s => s.toUpperCase()).join(', ')}</span>
            </div>
          )}

          {creature.save && Object.keys(creature.save).length > 0 && (
            <div className="defense-row text-saves">
              <Shield size={14} className="flex-shrink-0" />
              <span><strong>Salvaciones (Defensivas):</strong> {Object.entries(creature.save).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')}</span>
            </div>
          )}

          {creature.resist && creature.resist.length > 0 && (
            <div className="defense-row">
              <strong>Resistencias a Daño:</strong> <span>{creature.resist.join(', ')}</span>
            </div>
          )}

          {creature.immune && creature.immune.length > 0 && (
            <div className="defense-row">
              <strong>Inmunidades a Daño:</strong> <span className="text-immune">{creature.immune.join(', ')}</span>
            </div>
          )}

          {creature.vulnerable && creature.vulnerable.length > 0 && (
            <div className="defense-row">
              <strong>Vulnerabilidades:</strong> <span className="text-vulnerable">{creature.vulnerable.join(', ')}</span>
            </div>
          )}

          {creature.conditionImmune && creature.conditionImmune.length > 0 && (
            <div className="defense-row">
              <strong>Inmunidades a Estados:</strong> <span>{creature.conditionImmune.join(', ')}</span>
            </div>
          )}

          <div className="defense-row">
            <strong>Sentidos:</strong> <span>{creature.senses || '—'}, Percepción Pasiva {creature.passivePerception}</span>
          </div>

          <div className="defense-row">
            <strong>Idiomas:</strong> <span>{creature.languages || '—'}</span>
          </div>
        </div>

        {/* 4. Rasgos Especiales (Traits) en Fichas Modulares */}
        {creature.trait && creature.trait.length > 0 && (
          <div className="modular-section">
            <h4 className="modular-section-title">
              <span>Rasgos Especiales</span>
              <span className="section-count">{creature.trait.length}</span>
            </h4>
            <div className="modular-traits-list">
              {creature.trait.map((t, idx) => (
                <div key={idx} className="modular-trait-card">
                  <strong className="trait-title">{clean5eTags(t.name)}. </strong>
                  <div className="trait-text-block">{extractEntryText(t.entries)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Acciones de Combate - TARJETAS MODULARES */}
        {rawActions.length > 0 && (
          <div className="modular-section">
            <div className="modular-section-header">
              <h4 className="modular-section-title text-crimson">
                <Swords size={16} />
                <span>Acciones de Combate</span>
              </h4>
              <span className="section-badge-help">Acción Principal</span>
            </div>

            {/* Tarjeta de Multiataque (si existe) */}
            {multiattackAction && (
              <div className="modular-multiattack-card">
                <div className="multiattack-header">
                  <span className="multiattack-tag">Estrategia de Turno: Multiataque</span>
                </div>
                <div className="multiattack-text">
                  {multiattackAction.rawText}
                </div>
              </div>
            )}

            {/* Grid de Tarjetas Modulares de Ataque */}
            <div className="modular-actions-grid">
              {combatActions.map((a, idx) => (
                <ModularCard key={idx} action={a} />
              ))}
            </div>
          </div>
        )}

        {/* 6. ACCIONES ADICIONALES (BONUS ACTIONS) - NUEVA SECCIÓN MODULAR */}
        {parsedBonus.length > 0 && (
          <div className="modular-section bonus-section">
            <div className="modular-section-header header-bonus">
              <h4 className="modular-section-title text-cyan">
                <Zap size={16} />
                <span>Acciones Adicionales (Bonus Actions)</span>
              </h4>
              <span className="section-badge-help">1 por turno</span>
            </div>

            <div className="modular-actions-grid">
              {parsedBonus.map((b, idx) => (
                <ModularCard key={idx} action={b} />
              ))}
            </div>
          </div>
        )}

        {/* 7. REACCIONES EN TARJETAS MODULARES */}
        {parsedReactions.length > 0 && (
          <div className="modular-section reaction-section">
            <div className="modular-section-header header-reaction">
              <h4 className="modular-section-title text-amber">
                <RotateCcw size={16} />
                <span>Reacciones</span>
              </h4>
              <span className="section-badge-help">Disparador / 1 por ronda</span>
            </div>

            <div className="modular-actions-grid">
              {parsedReactions.map((r, idx) => (
                <ModularCard key={idx} action={r} />
              ))}
            </div>
          </div>
        )}

        {/* 8. Lanzamiento de Conjuros (Spellcasting) si aplica */}
        {spellcasting.length > 0 && (
          <div className="modular-section spellcasting-section">
            <h4 className="modular-section-title text-purple">
              <BookOpen size={16} />
              <span>Lanzamiento de Conjuros (Spellcasting)</span>
            </h4>
            <div className="modular-traits-list">
              {spellcasting.map((s, idx) => (
                <div key={idx} className="modular-trait-card border-purple">
                  <strong className="trait-title">{clean5eTags(s.name)}. </strong>
                  {s.headerEntries && (
                    <div className="spellcasting-headers">{s.headerEntries.join(' ')}</div>
                  )}
                  {s.will && s.will.length > 0 && (
                    <div className="spell-row"><strong>A voluntad:</strong> {s.will.join(', ')}</div>
                  )}
                  {s.daily && (
                    <div className="spell-daily-block">
                      {Object.entries(s.daily).map(([times, list]) => (
                        <div key={times} className="spell-row">
                          <strong>{times}/día:</strong> {Array.isArray(list) ? list.map(clean5eTags).join(', ') : clean5eTags(String(list))}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.spells && Object.keys(s.spells).length > 0 && (
                    <div className="spell-levels-block">
                      {Object.entries(s.spells).map(([lvl, info]) => (
                        <div key={lvl} className="spell-row">
                          <strong>Nivel {lvl}{info.slots ? ` (${info.slots} espacios)` : ''}:</strong> {Array.isArray(info.spells) ? info.spells.map(clean5eTags).join(', ') : clean5eTags(String(info))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Acciones Legendarias en Tarjetas Modulares (si existen) */}
        {legendary.length > 0 && (
          <div className="modular-section legendary-section">
            <div className="modular-section-header header-legendary">
              <h4 className="modular-section-title text-gold">
                <Crown size={16} />
                <span>Acciones Legendarias</span>
              </h4>
              <span className="legendary-budget-pill">3 / Turno</span>
            </div>
            <p className="legendary-intro-text">
              {creature.legendaryHeader || 'La criatura puede realizar 3 acciones legendarias al final del turno de otra criatura. Recupera las gastadas al inicio de su turno.'}
            </p>
            <div className="modular-traits-list">
              {legendary.map((l, idx) => {
                const costMatch = (l.name || '').match(/\(\s*costs?\s*(\d+)\s*actions?\s*\)/i);
                const cost = costMatch ? costMatch[1] : 1;
                const cleanName = clean5eTags((l.name || '').replace(/\(\s*costs?\s*\d+\s*actions?\s*\)/i, '').trim());

                return (
                  <div key={idx} className="modular-legendary-card">
                    <div>
                      <strong className="legendary-card-title">{cleanName}. </strong>
                      <div className="legendary-card-text">{extractEntryText(l.entries)}</div>
                    </div>
                    <span className="legendary-cost-chip">
                      {cost > 1 ? `Coste: ${cost} Acciones` : '1 Acción'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. Acciones Míticas (si existen) */}
        {mythic.length > 0 && (
          <div className="modular-section mythic-section">
            <div className="modular-section-header header-mythic">
              <h4 className="modular-section-title text-crimson">
                <Flame size={16} />
                <span>Acciones Míticas</span>
              </h4>
              <span className="legendary-budget-pill">Fase Mítica</span>
            </div>
            <p className="legendary-intro-text">
              {creature.mythicHeader || 'Si el rasgo mítico de la criatura se activa, puede usar las siguientes opciones como acciones legendarias.'}
            </p>
            <div className="modular-traits-list">
              {mythic.map((m, idx) => (
                <div key={idx} className="modular-legendary-card border-mythic">
                  <div>
                    <strong className="legendary-card-title">{clean5eTags(m.name)}. </strong>
                    <div className="legendary-card-text">{extractEntryText(m.entries)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. Botón inferior para añadir al combate */}
        <div className="statblock-bottom-bar">
          <button 
            type="button"
            className="add-to-encounter-action-btn"
            onClick={() => onAddToEncounter && onAddToEncounter(creature)}
          >
            <Plus size={16} />
            <span>Añadir al Encuentro</span>
          </button>
        </div>

      </div>

      {/* Lightbox Modal HD para ver Arte / Token */}
      {lightboxOpen && (
        <div 
          className="statblock-lightbox-backdrop"
          onClick={() => setLightboxOpen(false)}
        >
          <div 
            className="statblock-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              className="statblock-lightbox-close"
              onClick={() => setLightboxOpen(false)}
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>

            <div className="statblock-lightbox-media">
              {fullArtUrl && !artLoadFailed ? (
                <img 
                  src={fullArtUrl} 
                  alt={creature.name}
                  className="statblock-lightbox-img"
                  onError={() => setArtLoadFailed(true)}
                />
              ) : tokenUrl ? (
                <div className="statblock-lightbox-token-wrap">
                  <img 
                    src={tokenUrl} 
                    alt={creature.name}
                    className="statblock-lightbox-token-img"
                  />
                  <p className="statblock-lightbox-note">
                    Token VTT Oficial • Sin ilustración de página completa en libro
                  </p>
                </div>
              ) : (
                <p className="statblock-lightbox-note">Sin imagen disponible para esta criatura</p>
              )}
            </div>

            <div className="statblock-lightbox-footer">
              <div>
                <h3 className="statblock-lightbox-name">{creature.name}</h3>
                <p className="statblock-lightbox-meta">
                  {creature.size} {creature.type} • CR {creature.cr} • {creature.sourceGroup || creature.source}
                </p>
              </div>
              <a 
                href={fullArtUrl && !artLoadFailed ? fullArtUrl : tokenUrl} 
                target="_blank" 
                rel="noreferrer"
                className="statblock-lightbox-dl-btn"
              >
                Abrir Archivo Original ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
