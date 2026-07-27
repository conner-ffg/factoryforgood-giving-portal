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
  // comment + note persist
  const cell = await page.$('#edBody tr:nth-child(2) td[data-k="hq"]');
  await cell.click({ button: 'right' }); await page.waitForTimeout(250);
  await page.click('#cmComment'); await page.waitForTimeout(250);
  await page.fill('#noteTxt', 'check this'); await page.click('#noteSave'); await page.waitForTimeout(600);
  check('comment persisted', await page.evaluate(async () => (await sb.rest('org_comments?select=*')).length) === 1);
  await cell.click({ button: 'right' }); await page.waitForTimeout(250);
  await page.click('#cmNote'); await page.waitForTimeout(250);
  await page.fill('#cnTxt', 'note body'); await page.click('#cnSave'); await page.waitForTimeout(600);
  check('cell note persisted', await page.evaluate(async () => (await sb.rest('org_cell_notes?select=*')).length) === 1);
  // demo mode
  await page.click('#demoToggle'); await page.waitForTimeout(1200);
  check('demo banner visible', await page.evaluate(() => !!document.querySelector('#demoBar')));
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
  await page.evaluate(() => { window.dismissOverlay && dismissOverlay(); window.endTour && endTour(); }); await page.waitForTimeout(600);
  check('comments restored after fresh login', await page.evaluate(() => NOTES.length) === 1);
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
  await page.close();

  console.log('\nPASS', ok.length, '| FAIL', bad.length, bad.length ? bad : '');
  console.log('page errors:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})();
