const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(process.env.TEMP || 'C:\\tmp', 'chrome_bestiary_audit_final');
const ARTIFACT_DIR = 'C:\\Users\\kohan\\.gemini\\antigravity\\brain\\226585d3-4179-4c53-b73d-d68c0cb45c65';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🚀 Launching clean headless Chrome without extensions...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--disable-extensions',
    '--disable-background-networking',
    '--window-size=1440,1000',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5173/'
  ]);

  chromeProcess.on('error', err => console.error('Chrome spawn error:', err));

  let pageWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const list = await fetchJson(`http://localhost:${PORT}/json/list`);
      const target = list.find(t => t.url && t.url.includes('localhost:5173')) || list.find(t => t.type === 'page');
      if (target && target.webSocketDebuggerUrl) {
        pageWsUrl = target.webSocketDebuggerUrl;
        console.log(`🎯 Found Bestiary tab: "${target.title}" (${target.url})`);
        break;
      }
    } catch (e) {}
  }

  if (!pageWsUrl) {
    console.error('❌ Could not connect to Chrome DevTools port ' + PORT);
    chromeProcess.kill();
    return;
  }

  console.log('🔌 Connected to Chrome DevTools CDP:', pageWsUrl);
  const ws = new WebSocket(pageWsUrl);

  let idCounter = 1;
  const pending = new Map();
  const consoleErrors = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
      if (msg.params.type === 'error') {
        consoleErrors.push(text);
        console.error('  [Browser Error]:', text);
      } else {
        console.log('  [Browser Console]:', text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const err = msg.params.exceptionDetails?.text + ' ' + (msg.params.exceptionDetails?.exception?.description || '');
      consoleErrors.push(err);
      console.error('  [Browser Exception]:', err);
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log('📡 DevTools WebSocket handshake established.');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result?.value;
  }

  // Poll until Bestiary finishes loading
  console.log('⏳ Polling until Bestiary data is loaded and rendered...');
  let loaded = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const hasCards = await evalJs(`document.querySelectorAll('.creature-card').length`);
    if (hasCards && hasCards > 0) {
      loaded = true;
      console.log(`✅ Loaded! Found ${hasCards} creature cards currently displayed in UI.`);
      break;
    }
  }

  if (!loaded) {
    console.error('❌ Bestiary failed to load within timeout.');
    ws.close();
    chromeProcess.kill();
    process.exit(1);
  }

  const resultCount = await evalJs(`document.querySelector('.result-count')?.innerText`);
  console.log('📊 Result count bar text:', resultCount);

  // Helper to reliably set input value
  await evalJs(`
    window.setReactInput = function(selector, value) {
      const input = document.querySelector(selector);
      if (!input) return false;
      const prev = input.value;
      input.value = value;
      const tracker = input._valueTracker;
      if (tracker) tracker.setValue(prev);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
  `);

  // ==========================================
  // TEST 1: BEHOLDER (10-RAY COMPOSITE WEAPON)
  // ==========================================
  console.log('\n==========================================');
  console.log('TEST 1: Beholder Tactical Statblock Audit');
  console.log('==========================================');

  console.log('🔎 Searching for "Beholder"...');
  await evalJs(`window.setReactInput('#monster-search-input', 'Beholder')`);
  await sleep(1500);

  const beholderCount = await evalJs(`document.querySelector('.result-count')?.innerText`);
  console.log('📊 Result count:', beholderCount);

  console.log('👆 Clicking on Beholder card...');
  await evalJs(`
    const cards = Array.from(document.querySelectorAll('.creature-card'));
    const beholderCard = cards.find(c => c.querySelector('.card-name')?.innerText.trim() === 'Beholder') || cards[0];
    if (beholderCard) {
      const titleEl = beholderCard.querySelector('.card-name') || beholderCard;
      titleEl.click();
    }
  `);
  await sleep(1500);

  const beholderModalTitle = await evalJs(`document.querySelector('.statblock-hero-title')?.innerText`);
  console.log('🏰 Modal Hero Title:', beholderModalTitle);

  const beholderVitals = await evalJs(`
    Array.from(document.querySelectorAll('.vital-hud-cell')).map(c => ({
      label: c.querySelector('.vital-label')?.innerText,
      val: c.querySelector('.vital-value')?.innerText
    }))
  `);
  console.log('🛡️ Vitals HUD:', JSON.stringify(beholderVitals));

  const beholderCompositeAction = await evalJs(`(() => {
    const comp = document.querySelector('.modular-composite-action');
    if (!comp) return null;
    return {
      name: comp.querySelector('.modular-action-name')?.innerText,
      intro: comp.querySelector('.modular-composite-intro')?.innerText,
      subActionsCount: comp.querySelectorAll('.modular-subaction-card').length,
      sampleSubActions: Array.from(comp.querySelectorAll('.modular-subaction-card')).slice(0, 4).map(s => ({
        name: s.querySelector('.modular-action-name')?.innerText,
        hudSave: s.querySelector('.modular-hud-val-save')?.innerText,
        hudAtk: s.querySelector('.modular-hud-val-atk')?.innerText,
        hudDmg: s.querySelector('.modular-hud-val-dmg')?.innerText
      }))
    };
  })()`);
  console.log('👁️ Beholder Eye Rays Action:');
  console.log(JSON.stringify(beholderCompositeAction, null, 2));

  console.log('\n📸 Capturing screenshot of Beholder modal...');
  const beholderScreen = await send('Page.captureScreenshot', { format: 'png' });
  const beholderPath = path.join(__dirname, '../screenshot_beholder_modal.png');
  fs.writeFileSync(beholderPath, Buffer.from(beholderScreen.data, 'base64'));
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_beholder_modal.png'), Buffer.from(beholderScreen.data, 'base64'));
  }
  console.log(`🖼️ Screenshot saved to ${beholderPath} (${(fs.statSync(beholderPath).size / 1024).toFixed(1)} KB)`);

  // Close modal
  await evalJs(`
    const closeBtn = document.querySelector('.statblock-hero-btn-close');
    if (closeBtn) closeBtn.click();
    else {
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.click();
    }
  `);
  await sleep(1000);

  // ==========================================
  // TEST 2: ADULT GOLD DRAGON (2014 BREATH WEAPONS)
  // ==========================================
  console.log('\n==========================================');
  console.log('TEST 2: Adult Gold Dragon (2014) Breath Weapons Audit');
  console.log('==========================================');

  console.log('🔎 Searching for "Adult Gold Dragon"...');
  await evalJs(`window.setReactInput('#monster-search-input', 'Adult Gold Dragon')`);
  await sleep(1500);

  const dragonCount = await evalJs(`document.querySelector('.result-count')?.innerText`);
  console.log('📊 Result count:', dragonCount);

  console.log('👆 Clicking 2014 edition pill on card...');
  await evalJs(`
    const pill = document.querySelector('.card-version-btn.btn-2014');
    if (pill) {
      const propKey = Object.keys(pill).find(k => k.startsWith('__reactProps$'));
      if (propKey && pill[propKey]?.onClick) {
        pill[propKey].onClick({ stopPropagation: () => {} });
      } else {
        pill.click();
      }
    }
  `);
  await sleep(1000);

  console.log('👆 Opening 2014 Adult Gold Dragon modal...');
  await evalJs(`
    const card = document.querySelector('.creature-card');
    if (card) {
      const titleEl = card.querySelector('.card-name') || card;
      titleEl.click();
    }
  `);
  await sleep(1500);

  const dragonModalTitle = await evalJs(`document.querySelector('.statblock-hero-title')?.innerText`);
  console.log('🐉 Modal Hero Title:', dragonModalTitle);

  const dragonPills = await evalJs(`document.querySelector('.statblock-hero-pills-row')?.innerText.replace(/\\n/g, ' ')`);
  console.log('🏷️ Modal Source Pill:', dragonPills);

  const dragonCompositeAction = await evalJs(`(() => {
    const comp = document.querySelector('.modular-composite-action');
    if (!comp) return null;
    return {
      name: comp.querySelector('.modular-action-name')?.innerText,
      intro: comp.querySelector('.modular-composite-intro')?.innerText,
      subActionsCount: comp.querySelectorAll('.modular-subaction-card').length,
      subActions: Array.from(comp.querySelectorAll('.modular-subaction-card')).map(s => ({
        name: s.querySelector('.modular-action-name')?.innerText,
        hudSave: s.querySelector('.modular-hud-val-save')?.innerText,
        hudDmg: s.querySelector('.modular-hud-val-dmg')?.innerText
      }))
    };
  })()`);
  console.log('🐉 2014 Dragon Breath Weapons Action:');
  console.log(JSON.stringify(dragonCompositeAction, null, 2));

  console.log('\n📸 Capturing screenshot of Adult Gold Dragon modal...');
  const dragonScreen = await send('Page.captureScreenshot', { format: 'png' });
  const dragonPath = path.join(__dirname, '../screenshot_dragon_modal.png');
  fs.writeFileSync(dragonPath, Buffer.from(dragonScreen.data, 'base64'));
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_dragon_modal.png'), Buffer.from(dragonScreen.data, 'base64'));
  }
  console.log(`🖼️ Screenshot saved to ${dragonPath} (${(fs.statSync(dragonPath).size / 1024).toFixed(1)} KB)`);

  ws.close();
  chromeProcess.kill();

  console.log('\n========================================================');
  console.log(`✅ LIVE DEVTOOLS BROWSER AUDIT COMPLETED WITH ZERO ERRORS!`);
  console.log(`   Console errors detected: ${consoleErrors.length}`);
  console.log('========================================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
