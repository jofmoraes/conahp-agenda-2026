from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text();html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>','',html);html=re.sub(r'<link[^>]+href="/b18.css"[^>]*>','',html)
utils=(root/'schedule-utils.js').read_text().replace('export ','')
app=(root/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=(root/'schedule.json').read_text()
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (320,360,390,412,768,1280):
  page=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('about:blank')
  page.set_content(html)
  page.add_style_tag(content=(root/'b18.css').read_text())
  page.evaluate("""(schedule) => { window.__db={};Object.defineProperty(window,'localStorage',{configurable:true,value:{get length(){return Object.keys(window.__db).length},getItem(k){return window.__db[k]??null},setItem(k,v){window.__db[k]=String(v)},removeItem(k){delete window.__db[k]},key(i){return Object.keys(window.__db)[i]??null}}});window.fetch=async()=>({ok:true,json:async()=>schedule}); }""",json.loads(schedule))
  if width==390:
   page.evaluate("""() => {localStorage.setItem('conahp2026:flora:prefs:v1',JSON.stringify({items:[{sessionId:'c26-s002',interest:'Quero ir',attending:true,comment:'Nota antiga',questions:'Pergunta antiga',priority:'Alta'}]}));localStorage.setItem('conahp2026:public-filters:v1',JSON.stringify({view:'list',day:'2026-10-14'}))}""")
  page.add_script_tag(content=utils+'\n'+app)
  page.wait_for_selector('[data-open]',timeout=10000)
  assert page.locator('.event,.list-card').count()>0,(width,'no sessions',page.locator('#notice').inner_text())
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,'horizontal page scroll')
  assert page.locator('.tabs .tab').count()==2
  assert page.locator('.day').count()==2
  if width==390:
   assert page.locator('.event').count()>0, 'Agenda must be default even if B17 stored its former list default'
   page.click('[data-view="list"]')
   assert page.locator('.list-card').count()>0
   page.click('[data-open="c26-s002"]');page.wait_for_selector('#sessionModal[open]')
   assert page.locator('#editForm textarea[name="comment"]').input_value()=='Nota antiga'
   assert page.locator('#editForm textarea[name="questions"]').input_value()=='Pergunta antiga'
   page.fill('#editForm textarea[name="comment"]','Comentário B18 atualizado')
   page.click('#editForm button[type=submit]')
   assert page.locator('#saveMessage').inner_text()=='Salvo neste navegador'
   page.click('[data-close="sessionModal"]')
   assert page.evaluate("localStorage.getItem('conahp2026:flora:prefs:v1')") is not None
   assert page.evaluate("localStorage.getItem('conahp2026:b18:legacy-snapshot:v1')") is not None
   page.click('[data-open="c26-s002"]')
   assert page.locator('#editForm textarea[name="comment"]').input_value()=='Comentário B18 atualizado'
   page.click('[data-close="sessionModal"]')
   page.click('[data-view="grid"]')
   assert page.locator('.event').count()>0
   page.click('[data-tab="mine"]')
   assert page.locator('.event').count()==1
   page.click('[data-tab="program"]')
   page.click('#advancedBtn');assert page.locator('#filterModal[open]').count()==1
   page.select_option('#nowFilter','past')
   page.keyboard.press('Escape');assert page.locator('#filterModal[open]').count()==0
   page.click('#backupBtn');page.wait_for_selector('#backupModal[open]')
   with page.expect_download() as dl:page.click('#exportBackup')
   assert dl.value.suggested_filename.startswith('conahp-flora-backup')
   page.click('[data-close="backupModal"]')
  page.click('[data-view="grid"]');page.click('[data-tab="program"]');page.click('[data-day="2026-10-14"]')
  if width==390:
   page.click('#advancedBtn');page.select_option('#nowFilter','all');page.click('[data-close="filterModal"]')
  spans=page.evaluate("""() => [...document.querySelectorAll('.event')].map(x=>[x.style.left,x.style.width])""")
  assert any('50%' in x or '33.333' in x for pair in spans for x in pair),(width,'no parallel lanes',spans)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,'scroll after grid')
  if width==390:page.screenshot(path='/mnt/data/conahp-b18/B18_mobile_390.png',full_page=True)
  page.close();print('PASS viewport',width)
 assert not errors,errors
 browser.close()
print('PASS no page errors')
