from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text();html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>','',html)
html=re.sub(r'<link[^>]+href="/b18.css"[^>]*>','',html)
utils=(root/'schedule-utils.js').read_text().replace('export ','')
app=(root/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=json.loads((root/'schedule.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 def run_page(db):
  pg=b.new_page(viewport={'width':390,'height':844});pg.goto('about:blank');pg.set_content(html)
  pg.add_style_tag(content=(root/'b18.css').read_text())
  pg.evaluate("""({schedule,db}) => {window.__db=db; Object.defineProperty(window,'localStorage',{configurable:true,value:{get length(){return Object.keys(window.__db).length},getItem(k){return window.__db[k]??null},setItem(k,v){window.__db[k]=String(v)},removeItem(k){delete window.__db[k]},key(i){return Object.keys(window.__db)[i]??null}}});window.fetch=async()=>({ok:true,json:async()=>schedule});}""", {'schedule':schedule,'db':db})
  pg.add_script_tag(content=utils+'\n'+app)
  pg.wait_for_selector('[data-open]')
  return pg
 legacy={'conahp2026:flora:prefs:v1':json.dumps({'items':[{'sessionId':'c26-s002','interest':'Interesse','comment':'Histórico protegido','questions':'Questão B17','attending':False,'priority':'Alta'}]},ensure_ascii=False), 'conahp2026:public-filters:v1':json.dumps({'view':'list','day':'2026-10-14'})}
 first=run_page(legacy)
 assert first.locator('.event').count()>0, 'B18 must open in Agenda despite old B17 list default'
 first.click('[data-open="c26-s002"]')
 assert first.locator('#editForm textarea[name="comment"]').input_value()=='Histórico protegido'
 assert first.locator('#editForm input[name="interest"]').input_value()=='Talvez', 'Legacy mapping must be virtual'
 assert first.locator('#editForm input[name="attending"]').input_value()=='false'
 first.click('[data-close="sessionModal"]')
 assert '"Interesse"' in first.evaluate("localStorage.getItem('conahp2026:flora:prefs:v1')")
 first.click('[data-view="list"]')
 first.click('[data-open="c26-s002"]')
 first.fill('#editForm textarea[name="questions"]','Nova questão B18')
 first.click('#editForm button[data-draft-attend]')
 first.click('#editForm button[type=submit]')
 first.click('[data-close="sessionModal"]')
 saved=first.evaluate('JSON.parse(JSON.stringify(window.__db))')
 assert saved['conahp2026:flora:prefs:v1']==legacy['conahp2026:flora:prefs:v1'],'Legacy raw must stay unchanged'
 assert 'Nova questão B18' in saved['conahp2026:flora:preferences:b18']
 first.close()
 second=run_page(saved)
 assert second.locator('.list-card').count()>0,'Last explicit view must persist across reload'
 second.click('[data-tab="mine"]')
 assert second.locator('.list-card').count()==1,'Selected session must persist to Minha agenda'
 second.click('[data-open="c26-s002"]')
 assert second.locator('#editForm textarea[name="questions"]').input_value()=='Nova questão B18'
 assert second.locator('#editForm textarea[name="comment"]').input_value()=='Histórico protegido'
 second.click('[data-close="sessionModal"]')
 second.click('[data-tab="program"]');second.click('[data-day="2026-10-15"]')
 s3=second.evaluate('JSON.parse(JSON.stringify(window.__db))')
 second.close()
 third=run_page(s3)
 assert third.locator('[data-day="2026-10-15"].active').count()==1,'Last day should persist'
 assert third.locator('[data-view="list"].active').count()==1,'Last view should persist'
 third.close();b.close()
 print('PASS synthetic reload: legacy untouched, explicit Agenda/Lista, comments/questions/attending/day persisted')
