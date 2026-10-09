"""Synthetic browser smoke checks. Requires Python playwright + Chromium; no external services or network."""
import pathlib
import os
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]/'public'
APP=(ROOT/'app.js').read_text(encoding='utf-8')
UTIL=(ROOT/'schedule-utils.js').read_text(encoding='utf-8')
HTML=(ROOT/'index.html').read_text(encoding='utf-8').replace('<script type="module" src="/app.js"></script>','')
SOURCE='https://conahp.org.br/conahp-2026/'
def session(id,day,start,end,title,track,speakers):
 return dict(id=id,day=day,start=start,end=end,title=title,track=track,stage='Palco - '+track,speakers=speakers,source=SOURCE,verifiedAt='2026-10-09')
FIXTURE=dict(checkedAt='2026-10-09',sessions=[
 session('c26-t001','2026-10-14','12:00','13:15','A era da agent AI na saúde','Tecnologia','April Saathoff | Johns Hopkins'),
 session('c26-t002','2026-10-14','12:00','13:15','Sistemas de saúde sob pressão','Compromissos','Paulo Chapchap | Hospital Beta'),
 session('c26-t003','2026-10-15','09:00','10:15','O trabalho em saúde','Pessoas','Michelle Schneider')])
INIT='''({util,app,fixture})=>{
 window.__store={flora:{},juliana:{}};window.__writeFailure=false;
 window.fetch=async (url,options={})=>{
  const action=String(url).replace(/^\\/api\\//,'');
  if(action==='schedule')return new Response(JSON.stringify({ok:true,data:fixture}));
  if(action==='me')return new Response(JSON.stringify({ok:true,data:{id:'flora',label:'Flora'}}));
  if(action==='preferences'&&(options.method||'GET')==='GET')return new Response(JSON.stringify({ok:true,data:{items:Object.values(window.__store.flora)}}));
  if(action==='preferences'&&options.method==='POST'){
   if(window.__writeFailure)return new Response(JSON.stringify({ok:false,error:{message:'Falha sintética'}}),{status:502});
   const data=JSON.parse(options.body);window.__store.flora[data.sessionId]=data;
   return new Response(JSON.stringify({ok:true,data}));
  }
  return new Response('{}',{status:404});
 };
 Object.assign(window,new Function(util.replaceAll('export ','')+';return {filterSessions,conflictIds,auditSchedule,minutes,layoutDay};')());
 new Function(app.replace(/^import[^\\n]*\\n/,''))();
}'''
def run():
 checks=[]
 def check(name,value):
  checks.append((name,bool(value)))
  assert value,name
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1100,'height':800})
  page.set_content(HTML);page.evaluate(INIT,dict(util=UTIL,app=APP,fixture=FIXTURE));page.wait_for_selector('article.session')
  check('3 sessions',page.locator('article.session').count()==3)
  check('authorized profile',page.locator('#identity').inner_text().endswith('Flora'))
  page.locator('#search').fill('hospital beta');check('institution search',page.locator('article.session').count()==1)
  page.locator('#search').fill('');page.locator('#day').select_option('2026-10-15');check('second day',page.locator('article.session').count()==1)
  page.locator('#day').select_option('');page.locator('#view').select_option('grid');check('grid',page.locator('.grid-event').count()==3)
  check('hourly labels',page.locator('.time-axis span').count()==24)
  page.locator('#view').select_option('list')
  first=page.locator('article.session').filter(has_text='A era da agent AI')
  first.locator('summary').click();first.locator('[data-field=attending]').check();first.locator('[data-save]').click();page.wait_for_timeout(950)
  check('save attended',page.evaluate('window.__store.flora["c26-t001"].attending'))
  second=page.locator('article.session').filter(has_text='Sistemas de saúde')
  second.locator('summary').click();second.locator('[data-field=attending]').check();second.locator('[data-save]').click();page.wait_for_timeout(950)
  check('conflicts only attending',page.locator('article.conflict-border').count()==2)
  page.evaluate('window.__writeFailure=true')
  first=page.locator('article.session').filter(has_text='A era da agent AI')
  first.locator('summary').click();first.locator('[data-field=comment]').fill('should not persist');first.locator('[data-save]').click();page.wait_for_timeout(150)
  check('write error shown','Falha' in first.locator('.save-state').inner_text())
  check('write error not persisted','should not persist' not in str(page.evaluate('window.__store')))
  phone=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  phone.set_content(HTML);phone.evaluate(INIT,dict(util=UTIL,app=APP,fixture=FIXTURE));phone.wait_for_selector('article.session')
  phone.locator('#view').select_option('grid');check('mobile grid',phone.locator('.grid-event').count()==3)
  phone.locator('.grid-event').first.click();check('mobile detail',phone.locator('.grid-detail article').count()==1)
  check('mobile header',phone.locator('h1').is_visible())
  browser.close()
 print('BROWSER_SMOKE:',len(checks),'PASS')
if __name__=='__main__':run()
