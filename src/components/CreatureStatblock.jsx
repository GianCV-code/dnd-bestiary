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
import ObsidianExportModal from './ObsidianExportModal.jsx';

/**
 * Renders nested statblock entries, preserving HTML tables, lists, and sub-entries.
 */
function RenderEntries({ entries }) {
  if (!entries) return null;
  if (typeof entries === 'string') {
    return <p className="entry-paragraph">{clean5eTags(entries)}</p>;
  }
  if (Array.isArray(entries)) {
    return (
      <div className="entries-block">
        {entries.map((item, idx) => (
          <RenderEntries key={idx} entries={item} />
        ))}
      </div>
    );
  }
  if (typeof entries === 'object') {
    // 1. Table
    if (entries.type === 'table' || (entries.colLabels && entries.rows)) {
      return (
        <div className="statblock-table-wrapper">
          {entries.caption && (
            <div className="statblock-table-caption">{clean5eTags(entries.caption)}</div>
          )}
          <table className="statblock-table">
            {entries.colLabels && entries.colLabels.length > 0 && (
              <thead>
                <tr>
                  {entries.colLabels.map((col, cIdx) => (
                    <th key={cIdx}>{clean5eTags(col)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(entries.rows || []).map((row, rIdx) => (
                <tr key={rIdx}>
                  {(Array.isArray(row) ? row : [row]).map((cell, cellIdx) => (
                    <td key={cellIdx}>{clean5eTags(String(cell))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // 2. List
    if (entries.type === 'list' && entries.items) {
      return (
        <ul className="statblock-list">
          {entries.items.map((it, iIdx) => (
            <li key={iIdx}>
              {typeof it === 'string' ? (
                clean5eTags(it)
              ) : it.name ? (
                <>
                  <strong className="subentry-title">{clean5eTags(it.name)}. </strong>
                  <RenderEntries entries={it.entries || it.entry} />
                </>
              ) : (
                <RenderEntries entries={it} />
              )}
            </li>
          ))}
        </ul>
      );
    }
    // 3. Named Subentry
    if (entries.name && (entries.entries || entries.entry)) {
      return (
        <div className="statblock-named-subentry">
          <strong className="subentry-title">{clean5eTags(entries.name)}. </strong>
          <RenderEntries entries={entries.entries || entries.entry} />
        </div>
      );
    }
  }
  return <p className="entry-paragraph">{extractEntryText(entries)}</p>;
}

/**
 * Modular Tactical Card for Actions, Bonus Actions, Reactions, and Sub-Actions
 */
function ModularCard({ action, isSubAction = false }) {
  if (!action) return null;

  // Composite Action with Sub-Actions (e.g. Breath Weapons, Eye Rays)
  if (action.isComposite && action.subActions && action.subActions.length > 0) {
    return (
      <div className="modular-composite-action">
        <div className="modular-composite-header">
          <h5 className="modular-action-name">{action.name}</h5>
          <span className="modular-type-badge">{action.atkType}</span>
        </div>
        {action.introText && (
          <p className="modular-composite-intro">{action.introText}</p>
        )}
        <div className="modular-subactions-grid">
          {action.subActions.map((sub, sIdx) => (
            <ModularCard key={sIdx} action={sub} isSubAction={true} />
          ))}
        </div>
      </div>
    );
  }

  const hasAttackOrSave = action.atkBonus || action.saveDC || action.isAutoHit;
  const hasDamage = action.avgDamage;

  return (
    <div className={`modular-action-card ${isSubAction ? 'modular-subaction-card' : ''}`}>
      <div>
        {/* Card Header */}
        <div className="modular-card-header">
          <h5 className="modular-action-name">{action.name}</h5>
          <span className="modular-type-badge">{action.atkType}</span>
        </div>

        {/* Tactical HUD: Attack / DC & Average Damage */}
        {(hasAttackOrSave || hasDamage) && (
          <div className="modular-hud-boxes">
            <div className="modular-hud-box">
              <span className="modular-hud-title">To Hit / DC</span>
              {action.atkBonus ? (
                <>
                  <span className="modular-hud-val-atk">
                    {action.atkBonus} to hit
                  </span>
                  {action.saveDC && (
                    <span className="modular-dice-sub" style={{ display: 'block', fontSize: '0.73rem', marginTop: '2px', color: '#c084fc' }}>
                      DC {action.saveDC} {action.saveStat || ''}
                    </span>
                  )}
                </>
              ) : action.isAutoHit ? (
                <>
                  <span className="modular-hud-val-atk" style={{ color: '#38bdf8' }}>
                    Auto-hit
                  </span>
                  {action.saveDC && (
                    <span className="modular-dice-sub" style={{ display: 'block', fontSize: '0.73rem', marginTop: '2px', color: '#c084fc' }}>
                      DC {action.saveDC} {action.saveStat || ''}
                    </span>
                  )}
                </>
              ) : action.saveDC ? (
                <span className="modular-hud-val-save">
                  DC {action.saveDC} {action.saveStat || ''}
                </span>
              ) : (
                <span className="modular-hud-val-neutral">—</span>
              )}
            </div>

            <div className="modular-hud-box">
              <span className="modular-hud-title">Avg Damage</span>
              {action.avgDamage ? (
                <span className="modular-hud-val-dmg">
                  {action.avgDamage} {action.damageDice ? <span className="modular-dice-sub">({action.damageDice})</span> : null}
                  {action.damageType ? ` ${action.damageType}` : ''}
                  {action.plusDamage ? ` + ${action.plusDamage}` : ''}
                </span>
              ) : (
                <span className="modular-hud-val-neutral">—</span>
              )}
            </div>
          </div>
        )}

        {/* Reach / Range */}
        {action.reach && (
          <div className="modular-reach-text">
            📏 {action.reach}
          </div>
        )}

        {/* Reaction Trigger */}
        {action.trigger && (
          <div className="modular-trigger-box">
            <strong>⚡ Trigger:</strong> {action.trigger}
          </div>
        )}

        {/* Tactical Condition Alert (Grappled, Prone, Restrained, etc.) */}
        {action.conditions && action.conditions.length > 0 && (
          <div className="modular-tactical-alert">
            <div className="alert-condition-tags">
              <AlertTriangle size={13} className="flex-shrink-0" />
              <strong>Condition:</strong> {action.conditions.join(', ')}
            </div>
          </div>
        )}

        {/* Full narrative / rules text */}
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
  const [failedArtUrls, setFailedArtUrls] = useState(new Set());
  const [failedTokenUrls, setFailedTokenUrls] = useState(new Set());
  const [isObsidianModalOpen, setIsObsidianModalOpen] = useState(false);

  if (!creature) return null;

  // Ability modifier calculator
  const getMod = (val) => {
    const m = Math.floor((val - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  // Speed in English
  const speedParts = [];
  if (creature.speed) {
    if (typeof creature.speed === 'number') {
      speedParts.push(`${creature.speed} ft`);
    } else if (typeof creature.speed === 'string') {
      speedParts.push(creature.speed);
    } else if (typeof creature.speed === 'object') {
      const { walk, fly, swim, climb, burrow, canHover } = creature.speed;
      const hasOtherSpeeds = Boolean(fly || swim || climb || burrow);
      if (walk !== undefined && walk !== null) speedParts.push(`${walk} ft`);
      if (fly) speedParts.push(`fly ${fly} ft${canHover ? ' (hover)' : ''}`);
      if (swim) speedParts.push(`swim ${swim} ft`);
      if (climb) speedParts.push(`climb ${climb} ft`);
      if (burrow) speedParts.push(`burrow ${burrow} ft`);
    }
  }
  const speedText = speedParts.length > 0 ? speedParts.join(', ') : (creature.speed ? '0 ft' : '30 ft');

  // Initiative score
  const dexMod = Math.floor(((creature.dex || 10) - 10) / 2);
  const initiativeScore = 10 + dexMod;
  const initiativeText = dexMod >= 0 ? `+${dexMod} (${initiativeScore})` : `${dexMod} (${initiativeScore})`;
  const pb = calculatePB(creature.cr);

  // Parse Actions
  const rawActions = creature.action || [];
  const parsedActions = rawActions.map(a => parseModularAction(a, 'Action'));
  const multiattackAction = parsedActions.find(a => a && a.isMultiattack);
  const combatActions = parsedActions.filter(a => a && !a.isMultiattack);

  // Parse Bonus Actions
  const rawBonus = creature.bonus || [];
  const parsedBonus = rawBonus.map(b => parseModularAction(b, 'Bonus Action'));

  // Parse Reactions
  const rawReactions = creature.reaction || [];
  const parsedReactions = rawReactions.map(r => parseModularAction(r, 'Reaction'));

  // Parse Legendary & Mythic Actions
  const legendary = creature.legendary || [];
  const mythic = creature.mythic || [];
  const spellcasting = creature.spellcasting || [];

  // Helper to resolve official 5etools URL
  const getOfficialArtUrl = (c) => {
    if (!c || (c.category && c.category !== 'Official WotC')) return null;
    const src = c.source || 'MM';
    let name = c.name || '';
    if (src === 'MM' && name.includes('Dragon')) {
      const match = name.match(/^(Ancient|Young)\s+(.+Dragon)$/i);
      if (match) name = `Adult ${match[2]}`;
    }
    return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/${src}/${encodeURIComponent(name)}.webp`;
  };

  const getOfficialTokenUrl = (c) => {
    if (!c || (c.category && c.category !== 'Official WotC')) return null;
    const src = c.source || 'MM';
    return `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/tokens/${src}/${encodeURIComponent(c.name)}.webp`;
  };

  // Ordered candidate artworks: current version -> sibling versions in group -> official 5eTools -> MM fallback
  const candidateArts = [];
  if (creature.artUrl) candidateArts.push(creature.artUrl);
  const curOfficialArt = getOfficialArtUrl(creature);
  if (curOfficialArt && !candidateArts.includes(curOfficialArt)) {
    candidateArts.push(curOfficialArt);
  }
  if (modalGroup?.versions) {
    for (const v of modalGroup.versions) {
      if (v.artUrl && !candidateArts.includes(v.artUrl)) {
        candidateArts.push(v.artUrl);
      }
      const vOfficial = getOfficialArtUrl(v);
      if (vOfficial && !candidateArts.includes(vOfficial)) {
        candidateArts.push(vOfficial);
      }
    }
  }
  if ((creature.category === 'Official WotC' || !creature.category) && creature.source !== 'MM') {
    let fbName = creature.name || '';
    if (fbName.includes('Dragon')) {
      const match = fbName.match(/^(Ancient|Young)\s+(.+Dragon)$/i);
      if (match) fbName = `Adult ${match[2]}`;
    }
    const mmArt = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/MM/${encodeURIComponent(fbName)}.webp`;
    if (!candidateArts.includes(mmArt)) {
      candidateArts.push(mmArt);
    }
  }
  const fullArtUrl = candidateArts.find(url => !failedArtUrls.has(url)) || null;

  // Ordered candidate tokens: current version -> sibling versions in group -> official 5eTools -> MM fallback
  const candidateTokens = [];
  if (creature.tokenUrl) candidateTokens.push(creature.tokenUrl);
  const curOfficialToken = getOfficialTokenUrl(creature);
  if (curOfficialToken && !candidateTokens.includes(curOfficialToken)) {
    candidateTokens.push(curOfficialToken);
  }
  if (modalGroup?.versions) {
    for (const v of modalGroup.versions) {
      if (v.tokenUrl && !candidateTokens.includes(v.tokenUrl)) {
        candidateTokens.push(v.tokenUrl);
      }
      const vToken = getOfficialTokenUrl(v);
      if (vToken && !candidateTokens.includes(vToken)) {
        candidateTokens.push(vToken);
      }
    }
  }
  if ((creature.category === 'Official WotC' || !creature.category) && creature.source !== 'MM') {
    const mmToken = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/bestiary/tokens/MM/${encodeURIComponent(creature.name)}.webp`;
    if (!candidateTokens.includes(mmToken)) {
      candidateTokens.push(mmToken);
    }
  }
  const tokenUrl = candidateTokens.find(url => !failedTokenUrls.has(url)) || null;

  return (
    <div className="statblock-sheet" onClick={e => e.stopPropagation()}>
      
      {/* 1. Hero Cinematic Banner */}
      <div className="statblock-hero-banner">
        {/* Banner Background */}
        {fullArtUrl ? (
          <img 
            src={fullArtUrl} 
            alt={creature.name} 
            className="statblock-hero-bg-art"
            onError={() => setFailedArtUrls(prev => new Set(prev).add(fullArtUrl))} 
          />
        ) : (
          <div className="statblock-hero-bg-fallback">
            {tokenUrl && (
              <img 
                src={tokenUrl} 
                alt="" 
                className="statblock-hero-bg-fallback-token" 
                onError={() => setFailedTokenUrls(prev => new Set(prev).add(tokenUrl))}
              />
            )}
            <div className="statblock-hero-bg-fallback-pattern"></div>
          </div>
        )}

        {/* Cinematic Multi-Layer Vignette */}
        <div className="statblock-hero-vignette-bottom"></div>
        <div className="statblock-hero-vignette-top"></div>
        <div className="statblock-hero-vignette-sides"></div>

        {/* Banner Top Actions */}
        <div className="statblock-hero-top-actions">
          <button 
            type="button"
            className="statblock-hero-btn-obsidian"
            onClick={() => setIsObsidianModalOpen(true)}
            title="Send creature to Obsidian vault (DnD - DM Remote)"
          >
            <span className="obsidian-dot">🟣</span>
            <span>Send to Obsidian</span>
          </button>

          {fullArtUrl && (
            <button 
              type="button"
              className="statblock-hero-btn-zoom"
              onClick={() => setLightboxOpen(true)}
              title="View full high-definition official artwork"
            >
              <Maximize2 size={13} />
              <span>Full Artwork</span>
            </button>
          )}
          <button 
            type="button" 
            className="statblock-hero-btn-close" 
            onClick={onClose} 
            title="Close statblock (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Footer Content */}
        <div className="statblock-hero-footer-content">
          {/* Floating VTT Token */}
          {tokenUrl && (
            <div 
              className="statblock-hero-token-frame"
              onClick={() => setLightboxOpen(true)}
              title="Click to inspect token / artwork"
            >
              <img 
                src={tokenUrl} 
                alt={creature.name}
                className="statblock-hero-token-img"
                onError={() => setFailedTokenUrls(prev => new Set(prev).add(tokenUrl))}
              />
              <span className="statblock-hero-token-badge" title="Official VTT Token">
                VTT
              </span>
            </div>
          )}

          {/* Title, Badges & Subtitle */}
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

      {/* 2. Version Selector & Diff (if 2014 / 2024 multiples exist) */}
      {modalGroup && modalGroup.versions.length > 1 && (
        <div className="modal-versions-container">
          <div className="modal-versions-header">
            <span className="modal-versions-heading">
              <Sparkles size={14} color="var(--accent-gold)" />
              <span>Available Versions ({modalGroup.versions.length})</span>
            </span>
            <span className="modal-versions-help">
              Click to toggle statblocks across editions and printings
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
                    {isSelected && <span className="tab-selected-dot">● Active</span>}
                  </div>
                  <div className="tab-source-sub" title={v.sourceGroup || v.source}>
                    {v.sourceGroup || v.source}
                  </div>
                  <div className="tab-quick-stats">
                    CR {v.cr} • {v.hp} HP • AC {v.ac}
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
                  Differences compared to <strong>{comparisonBaseline.versionMeta.shortLabel} ({comparisonBaseline.source})</strong>:
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

      {/* 3. Statblock Body */}
      <div className="statblock-body">

        {/* Vital HUD Strip */}
        <div className="vitals-modular-strip">
          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-ac">
              <Shield size={18} />
            </div>
            <div>
              <span className="vital-label">Armor Class</span>
              <span className="vital-value">{creature.acText || creature.ac}</span>
            </div>
          </div>

          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-hp">
              <Heart size={18} />
            </div>
            <div>
              <span className="vital-label">Hit Points</span>
              <span className="vital-value text-hp">
                {creature.hp} <span className="vital-sub">({creature.hpFormula || 'Hit Die'})</span>
              </span>
            </div>
          </div>

          <div className="vital-hud-cell">
            <div className="vital-icon-box icon-speed">
              <Zap size={18} />
            </div>
            <div>
              <span className="vital-label">Speed / Init.</span>
              <span className="vital-value text-speed">{speedText} <span className="vital-sub">Init {initiativeText}</span></span>
            </div>
          </div>
        </div>

        {/* 6 Core Abilities Grid */}
        <div className="abilities-grid">
          {[
            { label: 'STR', val: creature.str },
            { label: 'DEX', val: creature.dex },
            { label: 'CON', val: creature.con },
            { label: 'INT', val: creature.int },
            { label: 'WIS', val: creature.wis },
            { label: 'CHA', val: creature.cha },
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

        {/* Defenses, Saves, Senses & Languages */}
        <div className="defenses-modular-card">
          {creature.forcesSaves && creature.forcesSaves.length > 0 && (
            <div className="defense-row text-forces-saves">
              <Zap size={14} className="flex-shrink-0" />
              <span><strong>Forces Saves (Offensive):</strong> {creature.forcesSaves.map(s => s.toUpperCase()).join(', ')}</span>
            </div>
          )}

          {creature.save && Object.keys(creature.save).length > 0 && (
            <div className="defense-row text-saves">
              <Shield size={14} className="flex-shrink-0" />
              <span><strong>Saving Throws:</strong> {Object.entries(creature.save).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')}</span>
            </div>
          )}

          {creature.resist && creature.resist.length > 0 && (
            <div className="defense-row">
              <strong>Damage Resistances:</strong> <span>{creature.resist.join(', ')}</span>
            </div>
          )}

          {creature.immune && creature.immune.length > 0 && (
            <div className="defense-row">
              <strong>Damage Immunities:</strong> <span className="text-immune">{creature.immune.join(', ')}</span>
            </div>
          )}

          {creature.vulnerable && creature.vulnerable.length > 0 && (
            <div className="defense-row">
              <strong>Damage Vulnerabilities:</strong> <span className="text-vulnerable">{creature.vulnerable.join(', ')}</span>
            </div>
          )}

          {creature.conditionImmune && creature.conditionImmune.length > 0 && (
            <div className="defense-row">
              <strong>Condition Immunities:</strong> <span>{creature.conditionImmune.join(', ')}</span>
            </div>
          )}

          <div className="defense-row">
            <strong>Senses:</strong> <span>{creature.senses || '—'}, Passive Perception {creature.passivePerception}</span>
          </div>

          <div className="defense-row">
            <strong>Languages:</strong> <span>{creature.languages || '—'}</span>
          </div>
        </div>

        {/* 4. Special Traits */}
        {creature.trait && creature.trait.length > 0 && (
          <div className="modular-section">
            <h4 className="modular-section-title">
              <span>Special Traits</span>
              <span className="section-count">{creature.trait.length}</span>
            </h4>
            <div className="modular-traits-list">
              {creature.trait.map((t, idx) => (
                <div key={idx} className="modular-trait-card">
                  <strong className="trait-title">{clean5eTags(t.name)}. </strong>
                  <div className="trait-text-block">
                    <RenderEntries entries={t.entries} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Combat Actions - MODULAR CARDS */}
        {rawActions.length > 0 && (
          <div className="modular-section">
            <div className="modular-section-header">
              <h4 className="modular-section-title text-crimson">
                <Swords size={16} />
                <span>Actions</span>
              </h4>
              <span className="section-badge-help">Main Action</span>
            </div>

            {/* Multiattack Strategy Card (if present) */}
            {multiattackAction && (
              <div className="modular-multiattack-card">
                <div className="multiattack-header">
                  <span className="multiattack-tag">Multiattack Strategy</span>
                </div>
                <div className="multiattack-text">
                  {multiattackAction.rawText}
                </div>
              </div>
            )}

            {/* Modular Actions Grid */}
            <div className="modular-actions-grid">
              {combatActions.map((a, idx) => (
                <ModularCard key={idx} action={a} />
              ))}
            </div>
          </div>
        )}

        {/* 6. BONUS ACTIONS */}
        {parsedBonus.length > 0 && (
          <div className="modular-section bonus-section">
            <div className="modular-section-header header-bonus">
              <h4 className="modular-section-title text-cyan">
                <Zap size={16} />
                <span>Bonus Actions</span>
              </h4>
              <span className="section-badge-help">1 per turn</span>
            </div>

            <div className="modular-actions-grid">
              {parsedBonus.map((b, idx) => (
                <ModularCard key={idx} action={b} />
              ))}
            </div>
          </div>
        )}

        {/* 7. REACTIONS */}
        {parsedReactions.length > 0 && (
          <div className="modular-section reaction-section">
            <div className="modular-section-header header-reaction">
              <h4 className="modular-section-title text-amber">
                <RotateCcw size={16} />
                <span>Reactions</span>
              </h4>
              <span className="section-badge-help">Trigger / 1 per round</span>
            </div>

            <div className="modular-actions-grid">
              {parsedReactions.map((r, idx) => (
                <ModularCard key={idx} action={r} />
              ))}
            </div>
          </div>
        )}

        {/* 8. Spellcasting */}
        {spellcasting.length > 0 && (
          <div className="modular-section spellcasting-section">
            <h4 className="modular-section-title text-purple">
              <BookOpen size={16} />
              <span>Spellcasting</span>
            </h4>
            <div className="modular-traits-list">
              {spellcasting.map((s, idx) => (
                <div key={idx} className="modular-trait-card border-purple">
                  <strong className="trait-title">{clean5eTags(s.name)}. </strong>
                  {s.headerEntries && (
                    <div className="spellcasting-headers">{s.headerEntries.join(' ')}</div>
                  )}
                  {s.will && s.will.length > 0 && (
                    <div className="spell-row"><strong>At will:</strong> {s.will.join(', ')}</div>
                  )}
                  {s.daily && (
                    <div className="spell-daily-block">
                      {Object.entries(s.daily).map(([times, list]) => (
                        <div key={times} className="spell-row">
                          <strong>{times}/day each:</strong> {Array.isArray(list) ? list.map(clean5eTags).join(', ') : clean5eTags(String(list))}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.spells && Object.keys(s.spells).length > 0 && (
                    <div className="spell-levels-block">
                      {Object.entries(s.spells).map(([lvl, info]) => (
                        <div key={lvl} className="spell-row">
                          <strong>{lvl === '0' ? 'Cantrips (at will)' : `Level ${lvl}`}{info.slots ? ` (${info.slots} slots)` : ''}:</strong> {Array.isArray(info.spells) ? info.spells.map(clean5eTags).join(', ') : clean5eTags(String(info))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Legendary Actions */}
        {legendary.length > 0 && (
          <div className="modular-section legendary-section">
            <div className="modular-section-header header-legendary">
              <h4 className="modular-section-title text-gold">
                <Crown size={16} />
                <span>Legendary Actions</span>
              </h4>
              <span className="legendary-budget-pill">3 / Round</span>
            </div>
            <p className="legendary-intro-text">
              {creature.legendaryHeader || 'The creature can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature’s turn. The creature regains spent legendary actions at the start of its turn.'}
            </p>
            <div className="modular-traits-list">
              {legendary.map((l, idx) => {
                const parsedL = parseModularAction(l, 'Legendary Action');
                const costMatch = (l.name || '').match(/\(\s*costs?\s*(\d+)\s*actions?\s*\)/i);
                const cost = costMatch ? costMatch[1] : 1;
                const cleanName = clean5eTags(
                  (l.name || '')
                    .replace(/\(\s*(?:costs?|takes)?\s*\d+\s*actions?\s*(?:;[^)]*)?\)/i, '')
                    .trim()
                );

                return (
                  <div key={idx} className="modular-legendary-card">
                    <div className="modular-legendary-card-top">
                      <div>
                        <strong className="legendary-card-title">{cleanName}. </strong>
                        <div className="legendary-card-text">
                          <RenderEntries entries={l.entries} />
                        </div>
                      </div>
                      <span className="legendary-cost-chip">
                        {cost > 1 ? `Cost: ${cost} Actions` : '1 Action'}
                      </span>
                    </div>

                    {/* Tactical HUD box if Legendary action has attack/DC/damage */}
                    {(parsedL.atkBonus || parsedL.saveDC || parsedL.avgDamage) && (
                      <div className="modular-hud-boxes">
                        <div className="modular-hud-box">
                          <span className="modular-hud-title">To Hit / DC</span>
                          {parsedL.saveDC ? (
                            <span className="modular-hud-val-save">
                              DC {parsedL.saveDC} {parsedL.saveStat || ''}
                            </span>
                          ) : parsedL.atkBonus ? (
                            <span className="modular-hud-val-atk">
                              {parsedL.atkBonus} to hit
                            </span>
                          ) : (
                            <span className="modular-hud-val-neutral">Action</span>
                          )}
                        </div>

                        <div className="modular-hud-box">
                          <span className="modular-hud-title">Avg Damage</span>
                          {parsedL.avgDamage ? (
                            <span className="modular-hud-val-dmg">
                              {parsedL.avgDamage} <span className="modular-dice-sub">({parsedL.damageDice || ''})</span>
                              {parsedL.damageType ? ` ${parsedL.damageType}` : ''}
                              {parsedL.plusDamage ? ` + ${parsedL.plusDamage}` : ''}
                            </span>
                          ) : (
                            <span className="modular-hud-val-neutral">—</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. Mythic Actions */}
        {mythic.length > 0 && (
          <div className="modular-section mythic-section">
            <div className="modular-section-header header-mythic">
              <h4 className="modular-section-title text-crimson">
                <Flame size={16} />
                <span>Mythic Actions</span>
              </h4>
              <span className="legendary-budget-pill">Mythic Phase</span>
            </div>
            <p className="legendary-intro-text">
              {creature.mythicHeader || 'If the creature’s mythic trait is active, it can use the options below as legendary actions.'}
            </p>
            <div className="modular-traits-list">
              {mythic.map((m, idx) => {
                const parsedM = parseModularAction(m, 'Mythic Action');
                return (
                  <div key={idx} className="modular-legendary-card border-mythic">
                    <div className="modular-legendary-card-top">
                      <div>
                        <strong className="legendary-card-title">{clean5eTags(m.name)}. </strong>
                        <div className="legendary-card-text">
                          <RenderEntries entries={m.entries} />
                        </div>
                      </div>
                    </div>

                    {(parsedM.atkBonus || parsedM.saveDC || parsedM.avgDamage) && (
                      <div className="modular-hud-boxes">
                        <div className="modular-hud-box">
                          <span className="modular-hud-title">To Hit / DC</span>
                          {parsedM.saveDC ? (
                            <span className="modular-hud-val-save">
                              DC {parsedM.saveDC} {parsedM.saveStat || ''}
                            </span>
                          ) : parsedM.atkBonus ? (
                            <span className="modular-hud-val-atk">
                              {parsedM.atkBonus} to hit
                            </span>
                          ) : (
                            <span className="modular-hud-val-neutral">Action</span>
                          )}
                        </div>

                        <div className="modular-hud-box">
                          <span className="modular-hud-title">Avg Damage</span>
                          {parsedM.avgDamage ? (
                            <span className="modular-hud-val-dmg">
                              {parsedM.avgDamage} <span className="modular-dice-sub">({parsedM.damageDice || ''})</span>
                              {parsedM.damageType ? ` ${parsedM.damageType}` : ''}
                            </span>
                          ) : (
                            <span className="modular-hud-val-neutral">—</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 11. Bottom Action Bar */}
        <div className="statblock-bottom-bar">
          <button 
            type="button"
            className="add-to-encounter-action-btn"
            onClick={() => onAddToEncounter && onAddToEncounter(creature)}
          >
            <Plus size={16} />
            <span>Add to Encounter</span>
          </button>

          <button 
            type="button"
            className="statblock-bottom-btn-obsidian"
            onClick={() => setIsObsidianModalOpen(true)}
            title="Send creature to Obsidian vault (DnD - DM Remote)"
          >
            <span>🟣</span>
            <span>Send to Obsidian</span>
          </button>
        </div>

      </div>

      {/* Obsidian Export Modal */}
      {isObsidianModalOpen && (
        <ObsidianExportModal 
          creature={creature}
          onClose={() => setIsObsidianModalOpen(false)}
        />
      )}

      {/* Lightbox Modal for Full Artwork / VTT Token */}
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
              title="Close (Esc)"
            >
              <X size={20} />
            </button>

            <div className="statblock-lightbox-media">
              {fullArtUrl ? (
                <img 
                  src={fullArtUrl} 
                  alt={creature.name}
                  className="statblock-lightbox-img"
                  onError={() => setFailedArtUrls(prev => new Set(prev).add(fullArtUrl))}
                />
              ) : tokenUrl ? (
                <div className="statblock-lightbox-token-wrap">
                  <img 
                    src={tokenUrl} 
                    alt={creature.name}
                    className="statblock-lightbox-token-img"
                    onError={() => setFailedTokenUrls(prev => new Set(prev).add(tokenUrl))}
                  />
                  <p className="statblock-lightbox-note">
                    Official VTT Token • No full-page book illustration
                  </p>
                </div>
              ) : (
                <p className="statblock-lightbox-note">No illustration available for this creature</p>
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
                href={fullArtUrl || tokenUrl} 
                target="_blank" 
                rel="noreferrer"
                className="statblock-lightbox-dl-btn"
              >
                Open Original Image ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
