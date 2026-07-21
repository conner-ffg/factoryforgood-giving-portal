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
  check('member logged in, gate gone', await page.evaluate(() => document.querySelector('#gate').style.display === 'none'));
  check('member greeted by name', (await page.textContent('#dashGreeting')).includes('Mia'));
  check('Data studio hidden for member', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/editor"]').style.display === 'none'));
  check('no demo toggle for member', await page.evaluate(() => !document.querySelector('#demoToggle')));
  await page.evaluate(() => go('#/editor')); await page.waitForTimeout(500);
  check('editor route bounces member to dashboard', await page.evaluate(() => location.hash.includes('dashboard')));
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
  await page.close();

  // ---------- staff journey ----------
  page = await browser.newPage({ viewport: { width: 1500, height: 980 } });
  page.on('pageerror', e => errs.push('staff: ' + e.message));
  await page.goto(U); await page.waitForTimeout(700);
  await page.fill('#gateEmail', 'staff@factoryforgood.com');
  await page.click('#gatePwToggle'); await page.fill('#gatePw', 'pw'); await page.click('#gatePwGo');
  await page.waitForTimeout(1800);
  check('staff sees Data studio', await page.evaluate(() =>
    document.querySelector('#mainNav [data-route="#/editor"]').style.display !== 'none'));
  check('staff sees demo toggle', await page.evaluate(() => !!document.querySelector('#demoToggle')));
  check('collective totals include member gift', await page.evaluate(() => scopeData('network').total) === 300000);
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
  check('back to live totals', await page.evaluate(() => scopeData('network').total) === 300000);
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
  check('comments restored after fresh login', await page.evaluate(() => NOTES.length) === 1);
  check('cell notes restored', await page.evaluate(() => Object.keys(CELLNOTES).length) === 1);
  await page.close();

  console.log('\nPASS', ok.length, '| FAIL', bad.length, bad.length ? bad : '');
  console.log('page errors:', errs.length ? errs : 'none');
  await browser.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})();
