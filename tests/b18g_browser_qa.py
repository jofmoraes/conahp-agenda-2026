"""B18-G offline Chromium check. No claim of external HTTP/real Android QA."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re, hashlib
ROOT=Path(__file__).resolve().parents[1]
pub=ROOT/'public'
html=(pub/'index.html').read_text()
html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>','',html)
html=re.sub(r'<link[^>]+href="/b18.css"[^>]*>','',html)
utils=(pub/'schedule-utils.js').read_text().replace('export ','')
app=(pub/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=json.loads((pub/'schedule.json').read_text())
assert len(schedule['sessions'])==32 and len({s['id'] for s in schedule['sessions']})==32
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def mount(width,db=None):
  page=browser.new_page(viewport={'width':width,'height':845},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank');page.set_content(html);page.add_style_tag(content=(pub/'b18.css').read_text())
  assert page.locator('#startup').is_visible(),('loading initial',width)
  assert page.locator('#startup h2').inner_text()=='Carregando agenda'
  assert page.locator('.loading-logo').get_attribute('src')=='/logo-conahp.svg'
  assert page.locator('.loading-screen').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(7, 59, 92)'
  page.evaluate("""(data)=>{window.__db=data.db;Object.defineProperty(window,'localStorage',{configurable:true,value:{get length(){return Object.keys(window.__db).length},getItem(k){return window.__db[k]??null},setItem(k,v){window.__db[k]=String(v)},removeItem(k){delete window.__db[k]},key(i){return Object.keys(window.__db)[i]??null}}});window.fetch=async()=>({ok:true,json:async()=>data.schedule});}""",{'db':db or {},'schedule':schedule})
  page.add_script_tag(content=utils+'\n'+app)
  page.wait_for_function('document.getElementById("startup").classList.contains("is-complete")')
  page.wait_for_function('getComputedStyle(document.getElementById("startup")).visibility==="hidden"')
  page.wait_for_selector('.event')
  assert page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(243, 247, 248)'
  return page
 for w in [320,360,390,412,768,1280]:
  page=mount(w)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('initial overflow',w)
  assert page.locator('[data-day]').all_inner_texts()==['Quarta','Quinta']
  assert page.locator('[data-day="2026-10-14"]').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')>=14.5
  assert page.locator('.key.status-alto-interesse').inner_text()=='Interesse'
  assert page.locator('.key.service-key').inner_text()=='Evento de serviço'
  legend=page.locator('.legend-states .key').evaluate_all('(e)=>e.map(x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y,r:x.getBoundingClientRect().right}))')
  assert max(a['y'] for a in legend)-min(a['y'] for a in legend)<2,('legend multiline',w,legend)
  assert max(a['r'] for a in legend)<w,('legend overflow',w,legend)
  service=page.locator('.event.service').first
  assert service.count()==1 and service.get_attribute('data-open') is None
  assert service.evaluate('(e)=>getComputedStyle(e).backgroundImage')=='none'
  assert page.locator('.event:not(.service)').count()>0
  page.locator('[data-view="list"]').click()
  assert page.locator('.list-card.service .list-actions').count()==0
  assert page.locator('.list-card.service .list-interest').count()==0
  assert page.locator('.list-card:not(.service) .list-interest [data-quick-interest="Alto interesse"]').first.inner_text()=='Interesse'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('list overflow',w)
  page.locator('.list-card:not(.service) [data-open]').first.click()
  assert page.locator('#editForm [data-draft-interest="Alto interesse"]').inner_text()=='Interesse'
  assert [v.replace('✓','').strip() for v in page.locator('#editForm [data-draft-priority]').all_inner_texts()]==['Essencial','Alta','Média','Baixa','Sem']
  assert page.locator('#modalContent').inner_text().count('manual')==0
  assert page.locator('.modal-attend').get_attribute('aria-pressed')=='false'
  assert page.locator('.modal-attend').inner_text().startswith('+ Incluir')
  assert page.locator('.modal-attend').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(7, 59, 92)'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('modal overflow',w)
  page.keyboard.press('Escape')
  page.click('#advancedBtn')
  assert page.locator('#filterModal[open]').count()==1
  assert page.locator('#attendFilter[type="checkbox"]').count()==0
  assert page.locator('#conflictFilter[type="checkbox"]').count()==0
  assert page.locator('#priorityFilter').locator('xpath=..').inner_text().startswith('Prioridade')
  assert page.locator('#nowFilter').locator('xpath=..').inner_text().startswith('Em relação a agora')
  page.click('#attendFilter');assert page.locator('#attendFilter').get_attribute('aria-pressed')=='true'
  page.click('#attendFilter');assert page.locator('#attendFilter').get_attribute('aria-pressed')=='false'
  page.click('#conflictFilter');assert page.locator('#conflictFilter').get_attribute('aria-pressed')=='true'
  page.click('#resetFilters');assert page.locator('#conflictFilter').get_attribute('aria-pressed')=='false'
  assert page.locator('[data-day="2026-10-14"].active').count()==1
  assert page.locator('[data-view="list"].active').count()==1
  page.locator('[data-close="filterModal"]').first.click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('filters overflow',w)
  if w==390:
   # Raw enum preserved; label intentionally renamed only in UI.
   card=page.locator('.list-card:not(.service)').first
   sid=card.locator('[data-quick-interest="Alto interesse"]').get_attribute('data-session-id')
   card.locator('[data-quick-interest="Alto interesse"]').click()
   row=page.evaluate('(id)=>JSON.parse(localStorage.getItem("conahp2026:flora:preferences:b18")).items.find(x=>x.sessionId===id)',sid)
   assert row['interest']=='Alto interesse' and not row.get('attending'),row
   assert page.locator(f'[data-quick-interest="Alto interesse"][data-session-id="{sid}"]').get_attribute('aria-pressed')=='true'
   page.locator(f'[data-toggle="{sid}"]').click()
   page.locator(f'[data-open="{sid}"]').first.click()
   assert page.locator('.modal-attend').get_attribute('aria-pressed')=='true'
   assert page.locator('.modal-attend').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(237, 244, 248)'
   assert page.locator('[data-draft-priority]').all_inner_texts()[0].endswith('Essencial')
   page.locator('[data-draft-priority="Alta"]').click()
   page.locator('textarea[name="comment"]').fill('Comentário B18-G preservado')
   page.locator('textarea[name="questions"]').fill('Pergunta B18-G preservada')
   assert page.locator('.modal-body dd').filter(has_text='Palco -').count()>=0
   # Deduplicate stage/track on real session c26-s006 even when modal content changes.
   page.keyboard.press('Escape')
   page.locator('[data-view="grid"]').click()
   page.locator('[data-open="c26-s006"]').first.click()
   dd=page.locator('.modal-body dd').all_inner_texts()
   assert any(x=='Palco - Tecnologia e inteligência em saúde' for x in dd),dd
   assert all('· Tecnologia e inteligência em saúde' not in x for x in dd),dd
   page.keyboard.press('Escape')
   # Reopen saved data fixture and verify visual name doesn't migrate store.
   page.locator('[data-view="list"]').click()
   page.locator(f'[data-open="{sid}"]').first.click()
   page.locator('[data-draft-priority="Alta"]').click()
   page.locator('textarea[name="comment"]').fill('Comentário B18-G preservado')
   page.locator('textarea[name="questions"]').fill('Pergunta B18-G preservada')
   page.locator('#editForm button[type="submit"]').click()
   saved=page.evaluate('(id)=>JSON.parse(localStorage.getItem("conahp2026:flora:preferences:b18")).items.find(x=>x.sessionId===id)',sid)
   assert saved['interest']=='Alto interesse' and saved['attending'] and saved['priority']=='Alta' and saved['comment'] and saved['questions'],saved
   keys=page.evaluate('Object.keys(window.__db)')
   assert 'conahp2026:flora:preferences:b18' in keys and 'conahp2026:public-filters:v1' in keys
   page.locator('[data-close="sessionModal"]').first.click()
   page.screenshot(path=str(ROOT/'b18g-mobile-390.png'),full_page=True)
   assert page.locator('.key.status-alto-interesse').inner_text()=='Interesse'
  else: page.close()
  print('PASS B18-G viewport',w)
 browser.close()
assert not errors,errors
orig=Path('/mnt/data/CONAHP_B18F_UX_FLORA_READY_FOR_OWNER_QA.zip')
import zipfile
with zipfile.ZipFile(orig) as z:
 for file in ['schedule.json','schedule-utils.js','logo-conahp.svg','icon-192.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png']:
  assert (pub/file).read_bytes()==z.read('public/'+file),file
 old=json.loads(z.read('public/manifest.webmanifest'))
 cur=json.loads((pub/'manifest.webmanifest').read_text())
 assert old['icons']==cur['icons'] and old['theme_color']==cur['theme_color'] and cur['background_color']=='#073b5c'
print('PASS source data/icon binary integrity, splash manifest and browser behavior')
