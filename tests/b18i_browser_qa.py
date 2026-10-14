"""B18-I: cross-day global Minha agenda, fixed grid, immediate interest and attendance tests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
PUB=Path(__file__).resolve().parents[1]/'public'
html=re.sub(r'<script[^>]+src="/b18.js"[^>]*></script>|<link[^>]+href="/b18.css"[^>]*>','',(PUB/'index.html').read_text())
js=(PUB/'schedule-utils.js').read_text().replace('export ','')+'\n'+(PUB/'b18.js').read_text().replace("import {auditSchedule, conflictIds, layoutDay, minutes, normalize} from './schedule-utils.js';",'')
schedule=json.loads((PUB/'schedule.json').read_text())
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in (320,360,390,412,768,1280):
  page=browser.new_page(viewport={'width':width,'height':844})
  page.goto('about:blank');page.set_content(html);page.add_style_tag(content=(PUB/'b18.css').read_text())
  page.evaluate('''schedule=>{window.__db={};Object.defineProperty(window,'localStorage',{value:{get length(){return Object.keys(__db).length},getItem(k){return __db[k]??null},setItem(k,v){__db[k]=String(v)},key(i){return Object.keys(__db)[i]??null}}});window.fetch=async()=>({ok:true,json:async()=>schedule});}''',schedule)
  page.add_script_tag(content=js);page.wait_for_function('document.documentElement.classList.contains("app-loaded")')
  assert page.locator('.hour').first.inner_text()=='09:00'
  page.locator('[data-view="list"]').click()
  for id in ('c26-s002','c26-s006'):
   page.locator('[data-toggle="'+id+'"]').click()
  page.locator('[data-day="2026-10-15"]').click()
  page.locator('[data-toggle="c26-s018"]').click()
  page.locator('#search').fill('inexistente')
  page.locator('[data-tab="mine"]').click()
  assert page.locator('#mineCount').inner_text()=='3'
  assert page.locator('.day-picker').is_hidden()
  assert [x.locator('.list-card').count() for x in page.locator('.day-section').all()]==[2,1]
  page.locator('[data-view="grid"]').click()
  assert [x.locator('.event[data-open]').count() for x in page.locator('.day-section').all()]==[2,1]
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('[data-open="c26-s018"]').click()
  page.locator('[data-draft-interest="Alto interesse"]').click()
  assert 'Interesse salvo' in page.locator('#saveMessage').inner_text()
  assert 'Alto interesse' in page.evaluate("localStorage.getItem('conahp2026:flora:preferences:b18')")
  page.locator('[data-draft-attend]').click()
  assert page.locator('#mineCount').inner_text()=='2'
  page.locator('#modalContent textarea[name="comment"]').fill('Registro '+str(width))
  page.locator('#editForm button[type="submit"]').click()
  assert page.locator('#saveMessage').inner_text()=='Salvo neste navegador'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.close()
  print('PASS B18-I',width,flush=True)
 browser.close()
