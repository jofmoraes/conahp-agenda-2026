"""B18-H DOM Chromium owner QA proxy; not a real HTTPS or installed Android test."""
from pathlib import Path
import json, re, hashlib, zipfile
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
PUB=ROOT/'public'
html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>|<link[^>]+href="/b18.css"[^>]*>','', (PUB/'index.html').read_text())
css=(PUB/'b18.css').read_text()
js=(PUB/'schedule-utils.js').read_text().replace('export ','')+'\n'+(PUB/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=json.loads((PUB/'schedule.json').read_text())
assert len(schedule['sessions'])==32 and len(set(s['id'] for s in schedule['sessions']))==32
assert all(s['day'] in ('2026-10-14','2026-10-15') for s in schedule['sessions'])
assert (PUB/'index.html').read_text().count('Carregando agenda')==1
assert (PUB/'index.html').read_text().count('14 e 15 de outubro · São Paulo')==1
assert 'conahp-b18i-public-v1' in (PUB/'service-worker.js').read_text()
orig=Path('/mnt/data/CONAHP_B18G_UX_FLORA_READY_FOR_OWNER_QA.zip')
with zipfile.ZipFile(orig) as z:
 for name in ['schedule.json','schedule-utils.js','logo-conahp.svg','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png','manifest.webmanifest']:
  assert (PUB/name).read_bytes()==z.read('public/'+name),name

KEY='conahp2026:flora:preferences:b18'
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 def mount(w,db=None,deferred=False):
  page=browser.new_page(viewport={'width':w,'height':846},accept_downloads=True)
  page.set_default_timeout(4500)
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('about:blank');page.set_content(html);page.add_style_tag(content=css)
  assert page.locator('#startup').is_visible()
  page.evaluate("""({db,schedule,deferred})=>{window.__db=db;Object.defineProperty(window,'localStorage',{configurable:true,value:{get length(){return Object.keys(__db).length},getItem(k){return __db[k]??null},setItem(k,v){__db[k]=String(v)},removeItem(k){delete __db[k]},key(i){return Object.keys(__db)[i]??null}}});window.__resolveSchedule=null;window.fetch=deferred?()=>new Promise(r=>{window.__resolveSchedule=()=>r({ok:true,json:async()=>schedule})}):async()=>({ok:true,json:async()=>schedule});}""",{'db':db if db is not None else {},'schedule':schedule,'deferred':deferred})
  page.add_script_tag(content=js)
  if deferred:
   page.wait_for_function('typeof window.__resolveSchedule==="function"')
   assert page.locator('#startup').is_visible() and page.locator('#startup h2').inner_text()=='Carregando agenda'
   assert page.locator('#startup p').inner_text()=='14 e 15 de outubro · São Paulo'
   page.evaluate('window.__resolveSchedule()')
  page.wait_for_selector('.event,.list-card')
  page.wait_for_function('getComputedStyle(document.querySelector("#startup")).visibility==="hidden"')
  return page
 def nooverflow(page,w,stage):
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(w,stage,'overflow')
 for w in [320,360,390,412,768,1280]:
  print('RUN',w,flush=True)
  page=mount(w,deferred=w==390)
  nooverflow(page,w,'load')
  assert page.locator('[data-tab="mine"] .mine-badge').inner_text()=='0'
  assert page.locator('[data-tab="mine"]').get_attribute('aria-label')=='Minha agenda: 0 sessões incluídas'
  assert page.locator('[data-tab="mine"] .mine-badge').evaluate('(e)=>getComputedStyle(e).fontSize').endswith('px')
  legend=page.locator('.legend .key').evaluate_all('els=>els.map(e=>({r:e.getBoundingClientRect(),font:parseFloat(getComputedStyle(e).fontSize)}))')
  assert len(legend)==6
  assert max(x['r']['top'] for x in legend)-min(x['r']['top'] for x in legend)<3,(w,'legend not one line',legend)
  assert max(x['r']['right'] for x in legend)<w,(w,'legend spill',legend)
  assert min(x['font'] for x in legend)>=10.5,(w,'font',legend)
  assert page.locator('.legend .service-key').inner_text()=='Gap'
  assert page.locator('.legend .service-key').get_attribute('title')=='Evento de serviço oficial'
  assert page.locator('.legend .conflict-key').get_attribute('aria-label')=='Conflito de horário'
  service=page.locator('.event.service').first
  assert service.count() and service.get_attribute('data-open') is None
  assert service.get_attribute('role')=='note'
  val=service.evaluate('e=>({l:getComputedStyle(e).borderLeftColor,b:getComputedStyle(e).borderTopColor,bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color})')
  assert val['l']=='rgb(255, 255, 255)' and val['b']!='rgb(255, 255, 255)',(w,val)
  assert val['bg']=='rgb(251, 252, 253)',val
  # At 12:00 three sessions must be separate columns and title be promoted above stage.
  triple=page.locator('.event[data-open="c26-s005"],.event[data-open="c26-s006"],.event[data-open="c26-s007"]')
  assert triple.count()==3
  boxes=triple.evaluate_all('els=>els.map(e=>({id:e.dataset.open,x:e.getBoundingClientRect().x,w:e.getBoundingClientRect().width,y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height,title:e.querySelector("strong").textContent,visible:getComputedStyle(e.querySelector(".event-track")).display,aria:e.getAttribute("aria-label")}))')
  assert len(set(round(x['x']) for x in boxes))==3,(w,'missing columns',boxes)
  assert len(set(round(x['y']) for x in boxes))==1,(w,'temporal alignment',boxes)
  for s in boxes:
   assert s['visible']=='none' and s['title'] in s['aria'],(w,s)
  page.locator('[data-open="c26-s006"]').click()
  assert page.locator('#sessionModal[open]').count()==1
  assert page.locator('.modal-attend').inner_text().startswith('+ Incluir')
  assert page.locator('.modal-attend').get_attribute('aria-pressed')=='false'
  page.locator('[data-draft-priority="Alta"]').click()
  page.locator('textarea[name="comment"]').fill(f'Nota teste {w}')
  page.locator('textarea[name="questions"]').fill(f'Pergunta teste {w}')
  page.locator('[data-draft-attend]').click()
  b=page.locator('.modal-attend')
  assert b.inner_text()=='✓ Retirar da minha agenda' and b.get_attribute('aria-pressed')=='true'
  assert b.evaluate('e=>getComputedStyle(e).backgroundColor')in ('rgb(215, 234, 243)','rgb(201, 227, 238)')
  page.locator('#editForm button[type="submit"]').click()
  assert page.locator('#saveMessage').inner_text()=='Salvo neste navegador'
  assert page.locator('#mineCount').inner_text()=='1'
  assert page.locator('[data-tab="mine"]').get_attribute('aria-label')=='Minha agenda: 1 sessão incluída'
  page.locator('[data-close="sessionModal"]').first.click()
  page.locator('[data-view="list"]').click()
  assert page.locator('.list-card.service .list-actions').count()==0
  assert page.locator('.list-card.service .list-interest').count()==0
  li=page.locator('.list-card [data-toggle="c26-s006"]')
  assert li.count() and li.inner_text()=='✓ Retirar da minha agenda'
  assert li.evaluate('e=>getComputedStyle(e).backgroundColor')in ('rgb(215, 234, 243)','rgb(201, 227, 238)')
  li.click()
  assert page.locator('#mineCount').inner_text()=='0'
  li=page.locator('.list-card [data-toggle="c26-s006"]')
  assert li.inner_text()=='+ Incluir na minha agenda'
  assert li.evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(7, 59, 92)'
  li.click();assert page.locator('#mineCount').inner_text()=='1'
  page.locator('[data-open="c26-s006"]').click()
  assert page.locator('.modal-attend').inner_text()=='✓ Retirar da minha agenda'
  assert page.locator('textarea[name="comment"]').input_value()==f'Nota teste {w}'
  assert page.locator('textarea[name="questions"]').input_value()==f'Pergunta teste {w}'
  assert page.locator('#editForm [data-draft-priority="Alta"]').get_attribute('aria-pressed')=='true'
  page.keyboard.press('Escape')
  print('STAGE',w,'advanced',flush=True)
  page.locator('#advancedBtn').click()
  assert page.locator('#filterModal[open]').count()==1
  assert page.locator('#priorityFilter').count()==0 and page.locator('#nowFilter').count()==0
  assert page.locator('[data-filter-priority]').count()==6 and page.locator('[data-filter-now]').count()==4
  assert page.locator('[data-filter-priority=""]').get_attribute('aria-pressed')=='true'
  assert page.locator('[data-filter-now="all"]').get_attribute('aria-pressed')=='true'
  nooverflow(page,w,'modal-filters')
  # Priority empty must be different from absence of filter and match unprioritized sessions.
  print('STAGE',w,'priority',flush=True)
  page.locator('[data-filter-priority="Sem"]').click()
  assert page.locator('[data-filter-priority="Sem"]').get_attribute('aria-pressed')=='true'
  assert page.locator('[data-filter-priority=""]').get_attribute('aria-pressed')=='false'
  assert page.locator('#eventCount').inner_text().startswith('15 '),(w,'sem priority',page.locator('#eventCount').inner_text())
  page.locator('[data-filter-priority="Alta"]').click()
  assert page.locator('#eventCount').inner_text().startswith('1 ')
  page.locator('[data-filter-priority=""]').click()
  assert page.locator('#eventCount').inner_text().startswith('16 ')
  page.locator('[data-filter-now="current"]').click()
  assert page.locator('[data-filter-now="current"]').get_attribute('aria-pressed')=='true'
  assert page.locator('[data-filter-now="current"]').inner_text()=='Agora'
  page.locator('[data-filter-now="next"]').click()
  assert page.locator('[data-filter-now="current"]').get_attribute('aria-pressed')=='false'
  page.locator('[data-filter-now="past"]').click()
  page.locator('[data-filter-now="all"]').click()
  page.locator('#resetFilters').click()
  assert page.locator('[data-filter-priority=""]').get_attribute('aria-pressed')=='true'
  assert page.locator('[data-filter-now="all"]').get_attribute('aria-pressed')=='true'
  assert page.locator('[data-view="list"].active').count()==1
  page.locator('[data-close="filterModal"]').first.click()
  nooverflow(page,w,'list after filters')
  print('STAGE',w,'donefilters',flush=True)
  if w==390:
   page.locator('[data-quick-interest="Alto interesse"][data-session-id="c26-s006"]').click()
   pref=page.evaluate(f'JSON.parse(localStorage.getItem("{KEY}")).items.find(x=>x.sessionId==="c26-s006")')
   assert pref['interest']=='Alto interesse' and pref['attending'] and pref['priority']=='Alta' and pref['comment'] and pref['questions'],pref
   page.screenshot(path=str(ROOT/'b18h-mobile-390.png'),full_page=True)
   db=page.evaluate('JSON.parse(JSON.stringify(window.__db))')
   page.close()
   new=mount(w,db)
   assert new.locator('#mineCount').inner_text()=='1'
   new.locator('[data-view="list"]').click()
   assert new.locator('[data-toggle="c26-s006"]').inner_text()=='✓ Retirar da minha agenda'
   new.locator('[data-open="c26-s006"]').click()
   assert new.locator('textarea[name="comment"]').input_value()=='Nota teste 390'
   assert new.locator('textarea[name="questions"]').input_value()=='Pergunta teste 390'
   assert new.locator('#editForm input[name="interest"]').input_value()=='Alto interesse'
   assert new.locator('[data-draft-priority="Alta"]').get_attribute('aria-pressed')=='true'
   new.keyboard.press('Escape')
   new.locator('#backupBtn').click()
   with new.expect_download() as d: new.locator('#exportBackup').click()
   assert d.value.suggested_filename.startswith('conahp-flora-backup')
   new.locator('[data-close="backupModal"]').first.click()
   new.close()
  else: page.close()
  print('PASS B18-H responsive and interactions',w)
 browser.close()
assert not errors,errors
print('PASS B18-H 32 source IDs, immutable icons, internal loading, 3 lanes, 6 legend items, filters, persistence, notes, backup')
