"""B18-G actual localhost HTTP Chromium smoke, not Vercel/Android QA."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,functools
root=Path(__file__).resolve().parents[1]/'public'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
handler=functools.partial(Quiet,directory=str(root))
server=ThreadingHTTPServer(('127.0.0.1',0),handler)
t=Thread(target=server.serve_forever,daemon=True);t.start()
base='http://127.0.0.1:'+str(server.server_port)
errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width in [320,390,1280]:
   context=browser.new_context(viewport={'width':width,'height':800},accept_downloads=True,service_workers='allow')
   page=context.new_page();page.on('pageerror',lambda e: errors.append(str(e)))
   response=page.goto(base+'/',wait_until='domcontentloaded');assert response.status==200
   page.wait_for_function('document.querySelector("#startup").classList.contains("is-complete")')
   page.wait_for_selector('.event')
   assert page.locator('.event').count()==16
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.locator('.loading-logo').evaluate('(e)=>e.complete&&e.naturalWidth>0'),('logo fail',width)
   assert page.locator('#startup').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
   assert (await_manifest:=json.loads(page.request.get(base+'/manifest.webmanifest').text()))['background_color']=='#073b5c'
   assert len(await_manifest['icons'])==4
   for icon in await_manifest['icons']:
    resp=page.request.get(base+icon['src']);assert resp.status==200
   assert page.request.get(base+'/schedule.json').status==200
   assert page.evaluate("'serviceWorker' in navigator")
   page.wait_for_function('navigator.serviceWorker.controller !== null || !!navigator.serviceWorker.ready',timeout=12000)
   page.locator('[data-view="list"]').click(); first=page.locator('.list-card:not(.service)').first
   sid=first.locator('[data-quick-interest="Alto interesse"]').get_attribute('data-session-id')
   first.locator('[data-quick-interest="Alto interesse"]').click()
   before=page.evaluate('(id)=>JSON.parse(localStorage.getItem("conahp2026:flora:preferences:b18")).items.find(v=>v.sessionId===id)',sid)
   assert before['interest']=='Alto interesse'
   page.reload(wait_until='domcontentloaded');page.wait_for_selector('.event,.list-card')
   after=page.evaluate('(id)=>JSON.parse(localStorage.getItem("conahp2026:flora:preferences:b18")).items.find(v=>v.sessionId===id)',sid)
   assert after==before,(width,before,after)
   assert page.locator('[data-view="list"].active').count()==1
   assert page.locator('.list-card.status-alto-interesse .pill').first.inner_text()=='Interesse'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   print('PASS real localhost HTTP',width)
   context.close()
  browser.close()
 assert not errors, errors
finally:
 server.shutdown();server.server_close()
