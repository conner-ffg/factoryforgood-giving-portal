// End-to-end test against the mock Supabase server.
// Run: python3 dev/mock_supabase.py &  then  NODE_PATH=$(npm root -g) node dev/test_e2e.js
const { chromium } = require('playwright');
const U = 'file://' + require('path').resolve(__dirname, 'index.mock.html');
const ok = [], bad = [];
const check = (name, cond) => (cond ? ok : bad).push(name) && console.log((cond?'  ✓ ':'  ✗ ')+name);

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---------- member journey ----------
  let page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  const errs = [];
  page.on('pageerror', e => errs.push('member: ' + e.message));
  await page.goto(U); await page.waitForTimeout(900);
  check('gate shows before login', await page.evaluate(() => getComputedStyle(document.querySelector('#gate')).display !== 'none'));
  await page.fill('#gateEmail', 'member@example.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(600);
  check('member logged in, gate gone', await page.evaluate(() => document.querySelector('#gate').style.display === 'none'));
  check('member greeted by name', (await page.textContent('#dashGreeting')).includes('Mia'));
  check('Data studio hidden for member', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/editor"]').style.display === 'none'));
  check('no demo toggle for member', await page.evaluate(() => !document.querySelector('#demoToggle')));
  await page.evaluate(() => go('#/editor')); await page.waitForTimeout(500);
  check('editor route bounces member to dashboard', await page.evaluate(() => location.hash.includes('dashboard')));
  check('Donor studio hidden for member', await page.evaluate(() => {
    const b = document.querySelector('#mainNav [data-route="#/donors"]');
    return b && b.style.display === 'none';
  }));
  await page.evaluate(() => go('#/donors')); await page.waitForTimeout(500);
  check('donors route bounces member to dashboard', await page.evaluate(() => location.hash.includes('dashboard')));
  check('member sees their circle pill', await page.evaluate(() =>
    !!document.querySelector('#scopeToggle [data-circle="test-circle"]')));
  // log a real gift
  await page.click('#dashTabs button[data-tab="history"]'); await page.waitForTimeout(300);
  await page.evaluate(() => openGiftModal()); await page.waitForTimeout(300);
  await page.selectOption('#gOrg', '1');
  await page.fill('#gAmt', '250000');
  await page.click('#gSave'); await page.waitForTimeout(1500);
  check('gift appears in history', (await page.textContent('#dashPanel')).includes('$250k'));
  const total1 = await page.evaluate(() => scopeData('me').total);
  check('lifetime giving = 250k', total1 === 250000);
  // edit it
  await page.evaluate(() => { const g = MEMBER.donations[0]; editGift(g.id); }); await page.waitForTimeout(300);
  await page.fill('#gAmt', '300000'); await page.click('#gSave'); await page.waitForTimeout(1500);
  check('gift edit persists', await page.evaluate(() => scopeData('me').total) === 300000);
  // build a shortlist cart + send it to the advisor, then leave without ceremony
  await page.evaluate(() => { toggleShortlist(4); toggleShortlist(6); });
  await page.waitForTimeout(900);
  await page.evaluate(() => sendPlanToAdvisor());
  await page.waitForTimeout(700);
  await page.close();

  // ---------- the cart survives leaving and coming back ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('return: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'member@example.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(400);
  check('shortlist restored on return', await page.evaluate(() => SHORTLIST.length === 2 && SHORTLIST.some(s => s.id === 4)));
  await page.evaluate(() => sb.signOut());
  await page.close();

  // ---------- second member: personal data stays private ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('member2: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'member2@example.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(600);
  check('second member sees none of the first member\'s gifts', await page.evaluate(() =>
    scopeData('me').total === 0 && MEMBER.donations.length === 0));
  check('own-password users are never forced to create another', await page.evaluate(async () => {
    // member2 has no pw_set flag but signed in with a unique password —
    // no forced modal, and the flag is stamped silently
    const noForce = !document.querySelector('#modalVeil').dataset.required;
    const u = await (await fetch(SUPABASE_URL + '/auth/v1/user', { headers: sb.headers() })).json();
    return noForce && u.user_metadata.pw_set === true;
  }));
  // log their own gift, then check the shared circle pools exactly both members
  await page.evaluate(async () => {
    await sb.rest('donations', { method: 'POST', body: { org_id: 4, amount: 50000, gift_date: '2026-03-01', status: 'logged', user_id: APP.userId } });
    await loadLiveData(); route();
  });
  await page.waitForTimeout(1200);
  check('second member sees only their own 50k', await page.evaluate(() => scopeData('me').total) === 50000);
  await page.evaluate(() => { document.querySelector('#scopeToggle [data-circle="test-circle"]').click(); });
  await page.waitForTimeout(800);
  check('circle total pools exactly its two members', await page.evaluate(() => scopeData('network').total) === 350000);
  await page.evaluate(() => sb.signOut());
  await page.close();

  // ---------- staff journey ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('staff: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'staff@factoryforgood.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(600);
  check('staff sees Data studio', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/editor"]').style.display !== 'none'));
  check('staff sees demo toggle', await page.evaluate(() => !!document.querySelector('#demoToggle')));
  check('collective totals include member gift', await page.evaluate(() => scopeData('network').total) === 350000);
  // staff logs their own gift — it must NOT leak into the circle's pooled total
  await page.evaluate(async () => {
    await sb.rest('donations', { method: 'POST', body: { org_id: 6, amount: 100000, gift_date: '2026-04-01', status: 'logged', user_id: APP.userId } });
    await loadLiveData(); route();
  });
  await page.waitForTimeout(1200);
  const circleVsNet = await page.evaluate(async () => {
    const st = await sb.rest('rpc/circle_stats', { method: 'POST', body: { cid: 'test-circle' } });
    return { circle: st.ytd, net: scopeData('network').total };
  });
  check('circle excludes non-members (350k vs 450k collective)', circleVsNet.circle === 350000 && circleVsNet.net === 450000);
  // Donor studio
  check('staff sees Donor studio', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/donors"]').style.display !== 'none'));
  await page.evaluate(() => go('#/donors')); await page.waitForTimeout(900);
  check('Donor studio lists every live profile', await page.evaluate(() => {
    const t = document.querySelector('#dsTable').textContent;
    return document.querySelectorAll('#dsTable tbody tr').length === 3 &&
      t.includes('Mia Member') && t.includes('Noah Chen') && t.includes('Sam Staff');
  }));
  // invite someone new — they appear as a pending profile immediately
  await page.evaluate(async () => {
    await PERSIST.donorInvite({ email: 'truman@example.com', fullName: 'Truman Wells' });
    await loadDonorRoster(); renderDonorStudio();
  });
  await page.waitForTimeout(600);
  check('pending invite listed until first sign-in', (await page.textContent('#dsTable')).includes('truman@example.com'));
  // + Add profile creates the account immediately with the starter password
  await page.evaluate(async () => {
    await createInvitedAccount('truman2@example.com', 'Truman Wells');
    await loadDonorRoster(); renderDonorStudio();
  });
  await page.waitForTimeout(600);
  check('invited account appears as a full editable profile', await page.evaluate(() =>
    DB.donors.some(d => d.email === 'truman2@example.com' && d.fullName === 'Truman Wells')));
  check('Donor studio shows real lifetime totals', (await page.textContent('#dsTable')).includes('$300k'));
  // view-as: open the first member's dashboard exactly as they see it
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[data-open]')].find(b =>
      b.closest('tr').textContent.includes('Mia Member'));
    btn.click();
  });
  await page.waitForTimeout(1200);
  check('view-as shows the member\'s own dashboard', await page.evaluate(() =>
    !!document.querySelector('#viewAsBar') &&
    document.querySelector('#topMemberName').textContent === 'Mia Member' &&
    scopeData('me').total === 300000));
  check('view-as hides all staff chrome', await page.evaluate(() =>
    document.body.classList.contains('va-member') &&
    getComputedStyle(document.querySelector('#mainNav [data-route="#/editor"]')).display === 'none' &&
    getComputedStyle(document.querySelector('#demoToggle')).display === 'none'));
  check('view-as blocks gift logging', await page.evaluate(() => { openGiftModal(); return !document.querySelector('#modalVeil').classList.contains('show'); }));
  await page.evaluate(() => exitViewAs()); await page.waitForTimeout(700);
  check('exit view-as returns to Donor studio', await page.evaluate(() =>
    location.hash.includes('donors') && !document.querySelector('#viewAsBar')));
  // staff manage a member's gifts on their behalf (create → edit → delete)
  const noahId = await page.evaluate(() => DB.donors.find(d => d.fullName === 'Noah Chen').id);
  await page.evaluate(async id => { await staffGiftOp(id, 'create', { org: 4, amount: 80000, date: '2026-05-05', status: 'logged' }); }, noahId);
  const afterCreate = await page.evaluate(id => {
    const dn = DB.donors.find(d => d.id === id);
    return { lt: dn.donations.reduce((s, g) => s + g.amount, 0), n: dn.donations.length };
  }, noahId);
  check('staff creates a gift on a member\'s behalf', afterCreate.lt === 130000 && afterCreate.n === 2);
  const gid = await page.evaluate(id => DB.donors.find(d => d.id === id).donations.find(g => g.amount === 80000).id, noahId);
  await page.evaluate(async ({ id, gid }) => { await staffGiftOp(id, 'update', { id: gid, org: 4, amount: 60000, date: '2026-05-05', status: 'planned' }); }, { id: noahId, gid });
  const afterEdit = await page.evaluate(id => {
    const dn = DB.donors.find(d => d.id === id);
    return { lt: dn.donations.reduce((s, g) => s + g.amount, 0), planned: dn.planned.reduce((s, g) => s + g.amount, 0) };
  }, noahId);
  check('staff edits a member\'s gift (amount + status)', afterEdit.lt === 50000 && afterEdit.planned === 60000);
  await page.evaluate(async ({ id, gid }) => { await staffGiftOp(id, 'delete', { id: gid }); }, { id: noahId, gid });
  const afterDel = await page.evaluate(async id => {
    const dn = DB.donors.find(d => d.id === id);
    const st = await sb.rest('rpc/circle_stats', { method: 'POST', body: { cid: 'test-circle' } });
    return { lt: dn.donations.reduce((s, g) => s + g.amount, 0), planned: (dn.planned || []).length, circleYtd: st.ytd };
  }, noahId);
  check('staff deletes a member\'s gift, circle totals stay honest', afterDel.lt === 50000 && afterDel.planned === 0 && afterDel.circleYtd === 350000);
  // the gift-manager modal opens from the studio
  await page.evaluate(() => go('#/donors')); await page.waitForTimeout(600);
  await page.evaluate(id => openDonorGifts(id), noahId);
  await page.waitForTimeout(400);
  check('gift manager modal lists the member\'s record', await page.evaluate(() =>
    document.querySelector('#modalVeil').classList.contains('show') &&
    document.querySelector('#modalBox').textContent.includes('giving record') &&
    !!document.querySelector('#dgSave')));
  await page.evaluate(() => closeModal());
  // staff see the member's saved cart + advisor request, and confirm an item
  const miaId = await page.evaluate(() => DB.donors.find(d => d.fullName === 'Mia Member').id);
  check('staff sees member shortlist and advisor request', await page.evaluate(id => {
    const dn = DB.donors.find(d => d.id === id);
    return dn.shortlist.length === 2 && dn.notifications.length === 1 && dn.notifications[0].body.includes('total');
  }, miaId));
  await page.evaluate(async id => { await confirmShortlistGift(id, 4); }, miaId);
  await page.waitForTimeout(600);
  const conf = await page.evaluate(id => {
    const dn = DB.donors.find(d => d.id === id);
    return { sl: dn.shortlist.length, hasPlanned: dn.planned.some(g => g.org === 4 && g.amount === 100000) };
  }, miaId);
  check('shortlist item confirmed into a planned gift', conf.sl === 1 && conf.hasPlanned);
  await page.evaluate(async id => {
    const dn = DB.donors.find(d => d.id === id);
    await toggleNotifHandled(id, dn.notifications[0].id);
  }, miaId);
  check('advisor request marked handled', await page.evaluate(id =>
    DB.donors.find(d => d.id === id).notifications[0].handled, miaId));
  // Data studio edit persists to backend
  await page.evaluate(() => go('#/editor')); await page.waitForTimeout(900);
  await page.evaluate(() => { const td = document.querySelector('#edBody td[data-k="hq"]'); td.focus(); td.textContent = 'Pune HQ (verified)'; td.blur(); });
  await page.waitForTimeout(800);
  const persisted = await page.evaluate(async () => {
    const r = await sb.rest('orgs?id=eq.' + document.querySelector('#edBody tr').dataset.id);
    return r[0].data.hq;
  });
  check('org edit persisted to API', persisted === 'Pune HQ (verified)');
  // numeric columns: commas accepted, full-number display, single-field save
  const numRes = await page.evaluate(async () => {
    const tr = document.querySelector('#edBody tr');
    const id = +tr.dataset.id;
    // switch to a group that includes Annual Reach (Core has it)
    const td = tr.querySelector('td[data-k="annualReach"]');
    td.focus(); td.textContent = '5,100,000'; td.blur();
    await new Promise(r => setTimeout(r, 600));
    const o = byId(id);
    const api = await sb.rest('orgs?id=eq.' + id);
    return { local: o.annualReach, remote: api[0].data.annualReach, cellText: td.textContent };
  });
  check('comma-formatted number commits as full value', numRes.local === 5100000 && numRes.remote === 5100000);
  check('numeric cell redisplays with thousands separators', numRes.cellText === '5,100,000');
  const multRes = await page.evaluate(() => {
    const tr = document.querySelector('#edBody tr');
    const td = tr.querySelector('td[data-k="budgetM"]');
    const before = td.textContent;
    td.focus(); td.textContent = '12,500,000'; td.blur();
    return { before, stored: byId(+tr.dataset.id).budgetM };
  });
  check('$ field shows full dollars, stores millions', /,/.test(multRes.before) && multRes.stored === 12.5);
  check('~ input marks the value approximate and shows a range', await page.evaluate(() => {
    const tr = document.querySelector('#edBody tr');
    const o = byId(+tr.dataset.id);
    const td = tr.querySelector('td[data-k="teamSize"]');
    td.textContent = '~50'; commitCell(td);
    return (o._approx||{}).teamSize === 1 && td.textContent === '~50' &&
           fmtApproxRange(50) === '35+' && fmtApproxRange(1000000, true) === '$750K+';
  }));
  check('brief + vertical-edit buttons on every row', await page.evaluate(() =>
    !!document.querySelector('#edBody .row-ic[title*="brief"]') &&
    !!document.querySelector('#edBody .row-ic[title*="vertical"]')));
  await page.evaluate(() => { openVerticalEdit(+document.querySelector('#edBody tr').dataset.id); });
  await page.waitForTimeout(400);
  check('vertical edit lists all fields as rows', await page.evaluate(() =>
    document.querySelectorAll('#modalBox .ve-in').length > 60));
  await page.evaluate(() => closeModal());
  // From the field: real quarterly updates managed from the leftmost 🗞 column
  check('updates column is the first studio column', await page.evaluate(() =>
    document.querySelector('#edTable thead th').classList.contains('upd-c') &&
    !!document.querySelector('#edBody tr td.upd-c .upd-ic')));
  check('Tier is the first column after Display Name (flagged selectable)', await page.evaluate(() => {
    const ths = [...document.querySelectorAll('#edTable thead th')].map(th => th.dataset.th);
    const iName = ths.indexOf('name');
    const sel = document.querySelector('#edBody td[data-k="tier"] select');
    return ths[iName+1] === 'tier' && !!sel && [...sel.options].some(o => o.value === 'flagged');
  }));
  check('Display Name column frozen after the Show column, opaque header', await page.evaluate(() => {
    const td = document.querySelector('#edBody td.name-c'), th = document.querySelector('#edTable th.name-c');
    const bg = getComputedStyle(th).backgroundColor;
    return getComputedStyle(td).left === '192px' && getComputedStyle(td).position === 'sticky' &&
           !/rgba\(.*,\s*0?\.\d+\)/.test(bg);
  }));
  check('header carries the full-length FFG logo (text fallback if blocked)', await page.evaluate(() =>
    !!document.querySelector('.brand img[alt="Factory for Good"]') ||
    getComputedStyle(document.querySelector('.brand .mark')).display !== 'none'));
  check('live update badge on Fortify Health row', await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#edBody tr')].find(t => byId(+t.dataset.id).name === 'Fortify Health');
    return !!tr && tr.querySelector('.upd-ic').classList.contains('on') && tr.querySelector('.upd-n').textContent === '1';
  }));
  await page.evaluate(() => openUpdatesMgr(ORGS.find(o => o.name === 'Fortify Health').id));
  await page.waitForTimeout(300);
  check('manager logs the Q2 update as live', await page.evaluate(() =>
    document.querySelector('#modalBox').textContent.includes('Twelve new mills') &&
    document.querySelector('#modalBox').textContent.includes('● Live')));
  await page.evaluate(() => updMgrEdit('new'));
  await page.waitForTimeout(250);
  await page.fill('#umTitle', 'Premix depots pilot underway');
  await page.fill('#umSum', 'Planned announcement for the Q4 rotation.');
  await page.fill('#umBody', 'First paragraph.\n\nSecond paragraph.');
  await page.evaluate(() => {
    document.querySelector('#umQuarter').value = '2026-Q4';
    document.querySelector('#umStatus').value = 'ready';
  });
  await page.evaluate(() => saveUpdMgr());
  await page.waitForTimeout(800);
  check('drafted future update persists + shows as scheduled', await page.evaluate(async () => {
    const rows = await sb.rest('org_updates?select=*');
    const mine = rows.find(r => r.title === 'Premix depots pilot underway');
    return !!mine && mine.quarter === '2026-Q4' && mine.status === 'ready' &&
      document.querySelector('#modalBox').textContent.includes('Scheduled');
  }));
  await page.evaluate(() => updMgrEdit('new'));
  await page.waitForTimeout(250);
  check('AI auto-write controls in the update form', await page.evaluate(() =>
    !!document.querySelector('#umAiUrl') && !!document.querySelector('#umAiFile') && !!document.querySelector('#umAiGo')));
  await page.evaluate(async () => {
    const orig = window.fetch;
    window.fetch = (u, opts) => String(u).includes('/api/updatewrite')
      ? Promise.resolve({ ok: true, json: async () => ({ title: 'Stub title', summary: 'Stub summary.', body: ['Para one.', 'Para two.'] }) })
      : orig(u, opts);
    document.querySelector('#umAiUrl').value = 'https://example.org/update';
    await aiWriteUpdate();
    window.fetch = orig;
  });
  await page.waitForTimeout(200);
  check('auto-write fills title, summary, mini-blog body + link', await page.evaluate(() =>
    document.querySelector('#umTitle').value === 'Stub title' &&
    document.querySelector('#umSum').value === 'Stub summary.' &&
    document.querySelector('#umBody').value === 'Para one.\n\nPara two.' &&
    document.querySelector('#umLink').value === 'https://example.org/update'));
  await page.evaluate(() => { updMgrState.editId = null; closeModal(); });
  await page.evaluate(() => go('#/dashboard')); await page.waitForTimeout(900);
  check('From the field shows only real live updates', await page.evaluate(() => {
    const t = document.querySelector('#updGrid').textContent;
    return t.includes('Malawi lead-paint standard') && t.includes('Twelve new mills') &&
      !t.includes('Premix depots') && !t.includes('Immunization reminders');
  }));
  check('update article cites its real quarter + links', await page.evaluate(() => {
    const u = ORG_UPDATES.find(x => x.quarter === '2026-Q3');
    openUpdateArticle(u.id);
    const box = document.querySelector('#modalBox');
    const ok = box.textContent.includes('Q3 2026 update') && box.textContent.includes('Watch the video');
    closeModal(); return ok;
  }));
  check('dynamic mesh gradient on for the dashboard', await page.evaluate(() =>
    document.body.classList.contains('mesh-on')));
  check('cause carousel auto-runs with top picks default + Other bucket', await page.evaluate(() =>
    causeAuto === true && state.globe.tier === 'top' &&
    [...document.querySelectorAll('#gCause option')].some(op => op.textContent === 'Other') &&
    document.querySelectorAll('#gRegions .chip').length > 3));
  check('globe zoom: buttons, glide target, region tween, state', await page.evaluate(() => {
    const ok = !!document.getElementById('gzIn') && !!document.getElementById('gzOut') && typeof globeZoomTo === 'function';
    globeSetZoom(2.2); const z2 = Math.abs(globeState.zoomT - 2.2) < 0.01;   // target moves; zoom glides
    globeSetZoom(globeState.zoomBase);
    return ok && z2;
  }));
  check('globe starts partially zoomed toward the card edges', await page.evaluate(() =>
    globeState.zoomBase > 1.05 && typeof globeState.zoomT === 'number'));
  check('carousel never sits on All causes', await page.evaluate(() =>
    state.globe.cause !== '' && [...document.querySelector('#gCause').options].some(o => o.value === '')));
  check('region zoom pauses the idle spin; World resumes it', await page.evaluate(() => {
    globeZoomTo('Africa');
    const paused = globeState.spinPaused === true;
    globeZoomTo('World');
    return paused && globeState.spinPaused === false;
  }));
  check('pins carry fade timestamps for soft enter/exit', await page.evaluate(() => {
    buildPins();
    const hasBorn = globeState.pins.every(p => typeof p.born === 'number');
    const before = globeState.pins.length;
    const savedCause = state.globe.cause;
    state.globe.cause = 'Mental Health'; buildPins();
    const dyingSome = (globeState.dying||[]).length > 0 || globeState.pins.length === before;
    state.globe.cause = savedCause; buildPins();
    return hasBorn && dyingSome;
  }));
  check('cause filter shows only matching orgs', await page.evaluate(() => {
    stopCauseAuto(); state.globe.tier = ''; state.globe.cause = 'Animal Welfare'; buildPins();
    const strict = globeState.pins.every(p => p.o.causes.includes('Animal Welfare'));
    state.globe.cause = ''; buildPins();
    return strict;
  }));
  check('orgs pin every country they serve', await page.evaluate(() => {
    buildPins();
    const multi = ORGS.find(o => o.tier !== 'represented' && isShown(o) && (o.countries||[]).filter(c => COUNTRY_LL[c]).length >= 2);
    return !!multi && globeState.pins.filter(p => p.o.id === multi.id).length >= 2;
  }));
  check('stacked pins get breathing room (no exact overlaps)', await page.evaluate(() => {
    const seen = new Set();
    for (const p of globeState.pins){
      const k = p.lat.toFixed(3) + ',' + p.lng.toFixed(3);
      if (seen.has(k)) return false;
      seen.add(k);
    }
    return globeState.pins.length > 0;
  }));
  check('library region dropdown filters geographies', await page.evaluate(() => {
    go('#/orgs'); renderLibrary();
    const sel = document.querySelector('#libRegion');
    if (sel.options.length < 3) return false;                 // populated from live data
    const region = [...sel.options].find(o => o.value)?.value;
    state.lib.region = region; renderLibGrid();
    const strict = libFiltered().every(o => o.region === region) && libFiltered().length > 0;
    state.lib.region = ''; sel.value = ''; renderLibGrid(); go('#/dashboard');
    return strict;
  }));
  check('flagged orgs tracked but never showcased', await page.evaluate(() => {
    const o = ORGS.find(x => x.tier === 'recommended' && isShown(x) && (x.countries||[]).length);
    o.tier = 'flagged'; buildPins();
    const noPin = !globeState.pins.some(p => p.o.id === o.id);
    const noLib = !showcased(o);
    o.tier = 'recommended'; buildPins();
    return noPin && noLib && TIER_LABEL.flagged === 'Flagged';
  }));
  await page.evaluate(() => go('#/org/' + ORGS.find(o => o.name === 'Lead Exposure Elimination Project').id));
  await page.waitForTimeout(1200);
  check('entering an org with updates fades in the summary list', await page.evaluate(() =>
    document.querySelector('#modalVeil').classList.contains('show') &&
    document.querySelector('#modalBox').textContent.includes('Updates, past and present') &&
    document.querySelector('#modalBox').textContent.includes('Malawi lead-paint standard')));
  await page.evaluate(() => closeModal());
  check('re-entry does not re-open the overlay', await page.evaluate(async () => {
    const id = ORGS.find(o => o.name === 'Lead Exposure Elimination Project').id;
    go('#/dashboard'); await new Promise(r => setTimeout(r, 150));
    go('#/org/' + id); await new Promise(r => setTimeout(r, 800));
    return !document.querySelector('#modalVeil').classList.contains('show');
  }));
  check('suffering scale speaks in words, not numbers', await page.evaluate(() => {
    const note = document.querySelector('.delta-note');
    const ends = document.querySelector('.scale-ends');
    return note && !/state \d/.test(note.textContent) && /[A-Za-z]/.test(note.textContent) &&
           ends && ends.textContent.includes('Stable') &&
           STATE_WORDS[5] === 'Stable';
  }));
  check('View updates pill sits beside the Deeper insights tab', await page.evaluate(() =>
    [...document.querySelectorAll('.panel-tabs .pill')].some(p => p.textContent.includes('View updates')) &&
    !!document.querySelector('.panel-tabs [data-otab="insights"]')));
  check('brief updates list opens the real article', await page.evaluate(() => {
    const o = ORGS.find(x => x.name === 'Lead Exposure Elimination Project');
    openOrgUpdates(o.id);
    const listOk = document.querySelector('#modalBox').textContent.includes('Malawi lead-paint standard');
    const row = document.querySelector('#modalBox .upd-row'); if (row) row.click();
    const artOk = document.querySelector('#modalBox').textContent.includes('Q3 2026 update');
    closeModal(); return listOk && artOk;
  }));
  await page.evaluate(() => go('#/editor')); await page.waitForTimeout(600);
  check('mesh gradient off outside dashboard/library/briefs', await page.evaluate(() =>
    !document.body.classList.contains('mesh-on')));
  // review workflow: invite submission → queue → reviewed, with logged activity
  const wfIds = await page.evaluate(() => [...document.querySelectorAll('#edBody tr')].slice(0, 3).map(tr => +tr.dataset.id));
  await page.evaluate(ids => { wfAction(ids[1], 'sub'); wfAction(ids[2], 'req'); }, wfIds);
  await page.waitForTimeout(700);
  check('submission invite + review request recorded', await page.evaluate(ids => {
    const a = byId(ids[1]), b = byId(ids[2]);
    return !!a.workflow.sub && !!b.workflow.req && WFLOG.length === 2;
  }, wfIds));
  check('requests sort to the top with color coding', await page.evaluate(ids => {
    const rows = [...document.querySelectorAll('#edBody tr')];
    return +rows[0].dataset.id === ids[2] && rows[0].classList.contains('wf-req') &&
           +rows[1].dataset.id === ids[1] && rows[1].classList.contains('wf-sub');
  }, wfIds));
  check('review queue badge + standalone drawer list the org', await page.evaluate(ids => {
    rvTab = 'req'; renderReviewPanel();
    return document.querySelector('#edRevCnt').textContent === '(1)' &&
           document.querySelector('#reviewBody').textContent.includes(byId(ids[2]).name) &&
           !!document.querySelector('#rvTabs [data-rvtab="sub"]');
  }, wfIds));
  check('requester cannot perform their own review', await page.evaluate(ids => {
    wfAction(ids[2], 'done');   // Sam requested this review — Sam may not perform it
    return !byId(ids[2]).workflow.done && !!byId(ids[2]).workflow.req;
  }, wfIds));
  check('first review requires an open review request', await page.evaluate(() => {
    const o = ORGS.find(x => !x.workflow);
    wfAction(o.id, 'done');
    return !(o.workflow && o.workflow.done);
  }));
  await page.evaluate(ids => {
    const me = APP.profile.full_name;
    APP.profile.full_name = 'Tess Staff';     // a second reviewer performs it
    wfAction(ids[2], 'done');
    APP.profile.full_name = me;
  }, wfIds);
  await page.waitForTimeout(700);
  check('marking reviewed clears the queue and logs who/when', await page.evaluate(ids => {
    const o = byId(ids[2]);
    return !!o.workflow.done && o.workflow.done.by === 'Tess Staff' && !o.workflow.req &&
           WFLOG[0].kind === 'review' && document.querySelector('#edRevCnt').textContent === '';
  }, wfIds));
  check('workflow events persisted to the API', await page.evaluate(async () =>
    (await sb.rest('org_workflow_events?select=*')).length === 3));
  check('team activity totals count per person', await page.evaluate(() => {
    rvTab = 'done'; renderReviewPanel();
    const t = document.querySelector('#reviewBody').textContent;
    return t.includes('SS') && t.includes('Sam Staff') && t.includes('TS') && t.includes('Recently reviewed');
  }));
  check('history grouped by day, then person, then stage', await page.evaluate(() => {
    const b = document.querySelector('#reviewBody');
    return !!b.querySelector('.rvh-day') && !!b.querySelector('.rvh-person') && !!b.querySelector('.rvh-line');
  }));
  check('a review without an open request logs the date but not the tally', await page.evaluate(ids => {
    const before = WFLOG.filter(e => e.kind === 'review').length;
    wfAction(ids[2], 'done');   // ids[2] was already reviewed — no open request now
    const o = byId(ids[2]);
    return WFLOG[0].kind === 'review0' &&
           WFLOG.filter(e => e.kind === 'review').length === before &&
           Object.keys(o.workflow.doneBy || {}).length >= 1;
  }, wfIds));
  await page.waitForTimeout(600);
  check('unreviewed-only filter hides reviewed orgs', await page.evaluate(ids => {
    const sel = document.querySelector('#edRev');
    sel.value = 'un'; edState.rev = 'un'; renderEdRows();
    const gone = ![...document.querySelectorAll('#edBody tr')].some(tr => +tr.dataset.id === ids[2]);
    sel.value = ''; edState.rev = ''; renderEdRows();
    return !!sel && gone;
  }, wfIds));
  check('@FFG Team is a mention option', await page.evaluate(() =>
    teamMembers()[0] === 'FFG Team' && extractMentions('heads up @FFG Team please read').includes('FFG Team')));
  // retract vs fulfil counting + late callouts
  const wf2 = await page.evaluate(() => [...document.querySelectorAll('#edBody tr')].slice(-3).map(tr => +tr.dataset.id));
  await page.evaluate(id => wfAction(id, 'sub'), wf2[0]); await page.waitForTimeout(500);
  await page.evaluate(id => wfAction(id, 'sub'), wf2[0]); await page.waitForTimeout(700);
  check('withdrawn requests drop out of the tallies', await page.evaluate(async id => {
    const o = byId(id);
    for (let i = 0; i < 20; i++){   // the delete may trail the retract by a round-trip
      const api = await sb.rest('org_workflow_events?select=*');
      if (api.length === 4) return !(o.workflow||{}).sub && WFLOG.filter(e => e.orgId === id).length === 0;
      await new Promise(r => setTimeout(r, 300));
    }
    return false;
  }, wf2[0]));
  await page.evaluate(id => wfAction(id, 'sub'), wf2[1]); await page.waitForTimeout(500);
  await page.evaluate(id => wfAction(id, 'req'), wf2[1]); await page.waitForTimeout(700);
  check('review request fulfils the submission invite but keeps its count', await page.evaluate(async id => {
    const o = byId(id);
    const api = await sb.rest('org_workflow_events?select=*');
    return !o.workflow.sub && !!o.workflow.subDone && !!o.workflow.req &&
           api.filter(e => e.org_id === id).length === 2;
  }, wf2[1]));
  check('reviewed hover shows the trail + most recent review', await page.evaluate(ids => {
    const t = wfTipHTML(byId(ids[2]));
    return t.includes('Review requested') && t.includes('Most recent review');
  }, wfIds));
  await page.evaluate(id => {
    const o = byId(id);
    o.workflow = { req: { by: 'Sam Staff', date: new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10) } };
    renderEdRows();
  }, wf2[2]);
  await page.waitForTimeout(400);
  check('6+ day requests flagged late and sorted first', await page.evaluate(id => {
    const first = document.querySelector('#edBody tr');
    return +first.dataset.id === id && first.classList.contains('wf-late');
  }, wf2[2]));
  check('Late box on the review-requests tab of the drawer', await page.evaluate(() => {
    rvTab = 'req'; renderReviewPanel();
    const t = document.querySelector('#reviewBody').textContent;
    return t.includes('Late — waiting 6+') && t.includes('Review queue');
  }));
  check('drawer opens standalone from the Reviews button', await page.evaluate(() => {
    document.querySelector('#edReviews').click();
    const ok = document.querySelector('#reviewDrawer').classList.contains('show') &&
               !document.querySelector('#notesDrawer').classList.contains('show');
    closeDrawers(); return ok;
  }));
  // comment + note persist
  const cell = await page.$('#edBody tr:nth-child(2) td[data-k="hq"]');
  await cell.click({ button: 'right' }); await page.waitForTimeout(250);
  await page.click('#cmComment'); await page.waitForTimeout(250);
  await page.fill('#noteTxt', 'check this @Sam'); await page.click('#noteSave'); await page.waitForTimeout(600);
  check('comment persisted', await page.evaluate(async () => (await sb.rest('org_comments?select=*')).length) === 1);
  check('@mention captured on the comment', await page.evaluate(() =>
    NOTES[0].mentions && NOTES[0].mentions.includes('Sam Staff')));
  check('comments drawer filters by tagged teammate', await page.evaluate(() => {
    drTab = 'comments'; window._cmWho = 'Sam Staff'; renderNotesPanel();
    const n = document.querySelectorAll('#notesBody .note-item').length;
    window._cmWho = ''; renderNotesPanel();
    return n === 1;
  }));
  // donor-profile comment with a tag, from the Donor studio
  await page.evaluate(() => {
    const dn = DB.donors.find(d => d.fullName === 'Mia Member');
    openDonorComment(dn.id);
  });
  await page.waitForTimeout(300);
  await page.fill('#dcTxt', '@Sam please review this giving plan');
  await page.click('#dcSave'); await page.waitForTimeout(600);
  check('donor comment saved with tag + donor link', await page.evaluate(async () => {
    const rows = await sb.rest('org_comments?select=*');
    const d = rows.find(r => r.donor_id);
    return rows.length === 2 && !!d && (d.mentions || '').includes('Sam Staff');
  }));
  // @typeahead (Tab completes) + Ctrl/Cmd+Enter submits
  const acCell = await page.$('#edBody tr:nth-child(6) td[data-k="hq"]');
  await acCell.click({ button: 'right' }); await page.waitForTimeout(250);
  await page.click('#cmComment'); await page.waitForTimeout(250);
  await page.click('#noteTxt');
  await page.keyboard.type('ping @Sa'); await page.waitForTimeout(250);
  check('@ typeahead suggests while typing', await page.evaluate(() => {
    const ac = document.querySelector('.ac-pop');
    return !!ac && ac.textContent.includes('Sam Staff');
  }));
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  check('Tab completes the tagged teammate', await page.evaluate(() =>
    document.querySelector('#noteTxt').value.includes('@Sam Staff ')));
  await page.keyboard.type('please double-check this row');
  await page.keyboard.press('Control+Enter'); await page.waitForTimeout(600);
  check('Ctrl+Enter submits the comment', await page.evaluate(() =>
    document.querySelector('#notePop').style.display === 'none' &&
    NOTES.some(n => n.text.includes('please double-check') && (n.mentions || []).includes('Sam Staff'))));
  await cell.click({ button: 'right' }); await page.waitForTimeout(250);
  await page.click('#cmNote'); await page.waitForTimeout(250);
  await page.fill('#cnTxt', 'note body'); await page.click('#cnSave'); await page.waitForTimeout(600);
  check('cell note persisted', await page.evaluate(async () => (await sb.rest('org_cell_notes?select=*')).length) === 1);
  // demo mode
  await page.click('#demoToggle'); await page.waitForTimeout(1200);
  check('demo banner visible', await page.evaluate(() => !!document.querySelector('#demoBar')));
  check('impact overlay appears on demo entry only', await page.evaluate(() => !!document.querySelector('#impactOverlay')));
  await page.evaluate(() => dismissOverlay()); await page.waitForTimeout(600);
  check('demo shows illustrative portfolio', await page.evaluate(() => scopeData('me').total) > 1e6);
  await page.evaluate(() => setDemo(false)); await page.waitForTimeout(1500);
  check('back to live totals', await page.evaluate(() => scopeData('network').total) === 450000);
  // sign out
  await page.evaluate(() => sb.signOut());
  await page.close();

  // ---------- reload persistence (staff sees comment restored) ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('reload: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'staff@factoryforgood.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  check('no intro overlay on a general sign-in or refresh', await page.evaluate(() =>
    !document.querySelector('#impactOverlay')));
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(600);
  check('comments restored after fresh login', await page.evaluate(() => NOTES.length) === 3);
  check('mentions + donor link survive reload', await page.evaluate(() =>
    NOTES.some(n => (n.mentions || []).includes('Sam Staff')) && NOTES.some(n => n.donorId)));
  check('cell notes restored', await page.evaluate(() => Object.keys(CELLNOTES).length) === 1);
  await page.close();

  // ---------- invited guest: starter password, then set their own ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('invited: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'truman2@example.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'FFGwelcome2026!'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(400);
  check('first login forces creating an own password', await page.evaluate(() =>
    document.querySelector('#modalVeil').classList.contains('show') &&
    !!document.querySelector('#pw1') &&
    document.querySelector('#modalVeil').dataset.required === '1' &&
    !document.querySelector('#modalBox').textContent.includes('Cancel')));
  check('invited guest signs in with the starter password', await page.evaluate(() =>
    document.querySelector('#gate').style.display === 'none'));
  // set their own password via the avatar modal, sign out, sign back in with it
  await page.evaluate(() => document.querySelector('#topAvatar').click()); await page.waitForTimeout(300);
  await page.fill('#pw1', 'myOwnPass9'); await page.fill('#pw2', 'myOwnPass9');
  await page.click('#pwGo'); await page.waitForTimeout(600);
  await page.evaluate(async () => { await sb.signOut(); location.reload(); }); await page.waitForTimeout(1200);
  await page.fill('#gateEmail', 'truman2@example.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'myOwnPass9'); await page.click('#gatePwGo');
  await page.waitForTimeout(1500);
  check('self-set password replaces the starter one', await page.evaluate(() =>
    document.querySelector('#gate').style.display === 'none'));
  // tools are staff-only: members don't see the tab and get bounced
  check('Tools hidden for members', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/tools"]').style.display === 'none'));
  await page.evaluate(() => go('#/tools')); await page.waitForTimeout(500);
  check('tools route bounces members to dashboard', await page.evaluate(() => location.hash.includes('dashboard')));
  await page.close();

  // ---------- tools hub (staff) ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('tools: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'staff@factoryforgood.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(400);
  await page.evaluate(() => go('#/tools')); await page.waitForTimeout(700);
  check('tools library renders all four tools (staff)', await page.evaluate(() =>
    document.querySelector('#view-tools').classList.contains('active') &&
    document.querySelectorAll('.tool-card').length === 4));
  await page.evaluate(() => go('#/tools/phinder')); await page.waitForTimeout(800);
  check('phinder deals cards from the live library', await page.evaluate(() =>
    !!document.querySelector('.ph-card[data-id]')));
  const before = await page.evaluate(() => SHORTLIST.length);
  await page.evaluate(() => _phAct(true)); await page.waitForTimeout(900);
  check('phinder right-swipe saves to the shortlist', await page.evaluate(() => SHORTLIST.length) === before + 1);
  await page.close();

  console.log('\nPASS', ok.length, '| FAIL', bad.length, bad.length ? bad : '');
  console.log('page errors:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})();
