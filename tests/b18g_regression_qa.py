"""B18-G regression: offline mocked Chromium checks. No Vercel HTTP verification is implied."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,hashlib
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text();html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>','',html);html=re.sub(r'<link[^>]+href="/b18.css"[^>]*>','',html)
utils=(root/'schedule-utils.js').read_text().replace('export ','')
app=(root/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=json.loads((root/'schedule.json').read_text());keys=('conahp2026:flora:preferences:b18','conahp2026:public-filters:v1','conahp2026:b18:legacy-snapshot:v1')
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def mount(width=390,height=820,db=None):
  page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('about:blank');page.set_content(html);page.add_style_tag(content=(root/'b18.css').read_text())
  page.evaluate("""(obj) => {window.__db=obj.db;Object.defineProperty(window,'localStorage',{configurable:true,value:{get length(){return Object.keys(window.__db).length},getItem(k){return window.__db[k]??null},setItem(k,v){window.__db[k]=String(v)},removeItem(k){delete window.__db[k]},key(i){return Object.keys(window.__db)[i]??null}}});window.fetch=async()=>({ok:true,json:async()=>obj.schedule});} """,{'schedule':schedule,'db':db or {}})
  page.add_script_tag(content=utils+'\n'+app);page.wait_for_function("document.querySelector('.event,.list-card')!==null");return page
 for width in [320,360,390,412,768,1280]:
  page=mount(width)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('overflow',width)
  assert page.locator('.tab.active').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(7, 59, 92)',('tabs contrast',width)
  assert page.locator('.logo').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgba(0, 0, 0, 0)',('logo',width)
  assert page.locator('.event:not(.service)').count()>0
  assert page.locator('.event.service').count()>0
  assert page.locator('.event.service[data-open]').count()==0,('service clickable',width)
  assert page.locator('.event.service').first.evaluate('(e)=>getComputedStyle(e).backgroundImage === "none"'),('service clean background',width)
  boas=page.locator('.event.service').filter(has_text='Boas-vindas');assert boas.count()==1
  a=boas.evaluate('(e)=>({h:e.clientHeight,sh:e.scrollHeight,time:getComputedStyle(e.querySelector(".event-time")).fontSize,title:getComputedStyle(e.querySelector("strong")).fontSize})')
  assert a['h']>=34 and a['h']>=a['sh'],('Boas-vindas clipping',width,a)
  assert page.locator('.event:not(.service)').first.locator('strong').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')>=11,('font',width)
  # At least one pair occupies multiple temporal columns, and both remain in frame.
  assert page.evaluate("[...document.querySelectorAll('.event')].some(e=>e.style.width.includes('50%')||e.style.width.includes('33.333')||e.style.width.includes('25%'))"),('parallel',width)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('overflow after schedule',width)
  page.click('[data-view="list"]')
  assert page.locator('.list-card.service .list-actions').count()==0
  assert page.locator('.list-card.service .list-interest').count()==0
  assert page.locator('.list-card:not(.service) .list-interest button').first.count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('overflow in list',width)
  # Modal long-content scroll, keyboard focus and sticky/footer safety at every width.
  page.locator('.list-card:not(.service) [data-open]').first.click()
  page.wait_for_selector('#sessionModal[open]')
  diag=page.evaluate("""()=>{const d=document.querySelector('#sessionModal'),m=document.querySelector('#modalContent');m.scrollTop=m.scrollHeight;return {screen:innerWidth,wide:d.getBoundingClientRect().width,inside:m.scrollHeight>m.clientHeight,foot:document.querySelector('.modal-actions').getBoundingClientRect().bottom,edge:d.getBoundingClientRect().bottom}}""")
  assert diag['wide']<=width and diag['foot']<=diag['edge']+2,('modal bounds',width,diag)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('modal overflow',width)
  page.keyboard.press('Escape');assert page.locator('#sessionModal[open]').count()==0
  # Color contrast checks use rendered computed styles (including selected states).
  def ratio(a,b):
   def rgb(s):
    channels=[int(x) for x in re.findall(r'\d+',s)[:3]]
    return sum([0.2126,0.7152,0.0722][i]*(v/255/12.92 if v/255<=0.04045 else ((v/255+0.055)/1.055)**2.4) for i,v in enumerate(channels))
   v1,v2=rgb(a),rgb(b);return (max(v1,v2)+0.05)/(min(v1,v2)+0.05)
  for status in ['nao-analisado','alto-interesse','talvez','nao-vou']:
   el=(page.locator('.key.status-'+status).first if status=='nao-analisado' else page.locator('.list-card .interest-choice.status-'+status).first)
   colors=el.evaluate('(e)=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor]}')
   assert ratio(*colors)>=4.5,('choice text contrast',width,status,colors,ratio(*colors))
  if width==390:
   # Quick interest immediately persists, is exclusive and does not alter attendance or notes.
   page.locator('.list-card:not(.service) [data-quick-interest="Alto interesse"]').first.click()
   first=page.locator('.list-card:not(.service)').first
   assert first.locator('[data-quick-interest="Alto interesse"]').get_attribute('aria-pressed')=='true'
   rec=page.evaluate("JSON.parse(localStorage.getItem('conahp2026:flora:preferences:b18')).items[0]")
   assert rec['interest']=='Alto interesse' and not rec.get('attending') and not rec.get('comment')
   assert 'status-alto-interesse' in first.get_attribute('class')
   first.locator('[data-quick-interest="Talvez"]').click()
   assert page.locator('.list-card.status-talvez').count()>=1
   assert page.locator('.list-card.status-talvez [data-quick-interest="Talvez"][aria-pressed="true"]').count()>=1
   assert page.locator('.list-card.status-talvez [data-quick-interest="Alto interesse"][aria-pressed="true"]').count()==0
   # List attendance does not modify status.
   first=page.locator('.list-card.status-talvez').first
   id=first.locator('[data-toggle]').get_attribute('data-toggle')
   first.locator('[data-toggle]').click()
   assert page.evaluate("(id)=>JSON.parse(localStorage.getItem('conahp2026:flora:preferences:b18')).items.find(v=>v.sessionId===id)",id)['interest']=='Talvez'
   page.click('[data-tab="mine"]');assert page.locator('.list-card').count()==1
   page.click('[data-tab="program"]')
   page.locator(f'[data-open="{id}"]').first.click()
   assert page.locator('#editForm select').count()==0
   assert page.locator('#editForm button[data-draft-interest]').count()==4
   assert page.locator('#editForm button[data-draft-priority]').count()==5
   assert page.locator('#editForm [data-draft-attend]').count()==1
   assert page.locator('#modalContent .alignment').count()==0
   assert page.locator('#editForm .decision-area').evaluate('(e)=>e.compareDocumentPosition(document.querySelector(".session-info"))&Node.DOCUMENT_POSITION_FOLLOWING')
   page.locator('[data-draft-interest="Não analisado"]').click()
   page.locator('[data-draft-priority="Essencial"]').click()
   page.fill('textarea[name="comment"]','Comentário persistente B18-F')
   page.fill('textarea[name="questions"]','Pergunta persistente B18-F')
   assert page.evaluate("(id)=>JSON.parse(localStorage.getItem('conahp2026:flora:preferences:b18')).items.find(v=>v.sessionId===id)",id)['interest']=='Talvez','draft must be unsaved'
   # Close/backdrop retains edited draft until explicit save.
   page.keyboard.press('Escape');assert not page.locator('#sessionModal').evaluate('(e)=>e.open')
   page.locator(f'[data-open="{id}"]').first.click()
   assert page.locator('[data-draft-interest="Não analisado"]').get_attribute('aria-pressed')=='true'
   assert page.locator('textarea[name="comment"]').input_value()=='Comentário persistente B18-F'
   page.locator('#editForm button[type="submit"]').click()
   assert page.locator('#saveMessage').inner_text()=='Salvo neste navegador'
   obj=page.evaluate("(id)=>JSON.parse(localStorage.getItem('conahp2026:flora:preferences:b18')).items.find(v=>v.sessionId===id)",id)
   assert obj['interest']=='Não analisado' and obj['priority']=='Essencial' and obj['attending'] and obj['comment'] and obj['questions'],obj
   # Verify safe padding, scrollability, footer at the end and in viewport on scroll.
   page.evaluate("document.querySelector('#modalContent').scrollTop=100000")
   m=page.evaluate("""()=>{const body=document.querySelector('#modalContent'),actions=document.querySelector('.modal-actions'),dia=document.querySelector('#sessionModal');return {scroll:body.scrollHeight,client:body.clientHeight,footer:actions.getBoundingClientRect().bottom,dialog:dia.getBoundingClientRect().bottom,pad:getComputedStyle(body).paddingBottom}}""")
   assert m['scroll']>m['client'],('modal must scroll',m)
   assert m['footer']<=m['dialog']+1,('modal footer clipped',m)
   assert float(m['pad'].replace('px',''))>=26,('safe inset',m)
   page.locator('[data-close="sessionModal"]').first.click()
   # Backup export and import - add new record, old record preserved by default.
   page.click('#backupBtn');page.wait_for_selector('#backupModal[open]')
   with page.expect_download() as dl:page.click('#exportBackup')
   download=dl.value;temp=Path('/mnt/data/conahp-b18f/b18f-backup-test.json');download.save_as(temp)
   backup=json.loads(temp.read_text());assert any(x.get('sessionId')==id for x in backup['items'])
   page.click('[data-close="backupModal"]')
   page.evaluate("localStorage.setItem('conahp2026:flora:preferences:b18',JSON.stringify({version:18,items:[]}))")
   # Import same backup without overwriting and recover another record in the current in-memory state.
   page.click('#backupBtn');page.locator('#backupFile').set_input_files(str(temp))
   page.wait_for_function('!document.querySelector("#importBackup").disabled');page.click('#importBackup')
   assert id in page.evaluate("JSON.parse(localStorage.getItem('conahp2026:flora:preferences:b18')).items.map(x=>x.sessionId)")
   page.click('[data-close="backupModal"]')
   page.fill('#search','hospital');page.select_option('#interestFilter','Talvez');page.click('#advancedBtn');page.click('[data-filter-now="past"]');page.click('#resetFilters')
   assert page.locator('[data-filter-now="all"]').get_attribute('aria-pressed')=='true' and page.locator('#search').input_value()=='' and page.locator('#interestFilter').input_value()==''
   assert page.locator('[data-view="list"].active').count()==1
   assert page.locator('[data-day="2026-10-14"].active').count()==1
   page.click('[data-close="filterModal"]')
   snap=page.evaluate('JSON.parse(JSON.stringify(window.__db))');page.close()
   follow=mount(390,820,snap);follow.click('[data-view="list"]')
   follow.locator(f'[data-open="{id}"]').first.click()
   assert follow.locator('textarea[name="questions"]').input_value()=='Pergunta persistente B18-F'
   assert follow.locator('[data-draft-interest="Não analisado"]').get_attribute('aria-pressed')=='true'
   follow.close()
  else: page.close()
  print('PASS B18-F viewport',width)
 assert not errors,errors
 browser.close()
print('PASS B18-F all behavioral and accessibility-smoke checks')
