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
INIT='''({util,app,fixture,mode='valid'})=>{
 window.__store={flora:{},juliana:{}};window.__writeFailure=false;window.__authMode=mode;window.__expiredWrite=false;
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 window.fetch=async (url,options={})=>{
  const action=String(url).replace(/^\\/api\\//,'');
  if(action==='schedule')return json({ok:true,data:fixture});
  if(action==='me'||action==='preferences'){
   if(window.__authMode==='401')return json({ok:false,error:{code:'UNAUTHENTICATED',message:'Login requerido'}},401);
   if(window.__authMode==='403')return json({ok:false,error:{code:'FORBIDDEN',message:'Negado'}},403);
   if(window.__authMode==='html')return new Response('<html>Access login</html>',{status:200,headers:{'content-type':'text/html'}});
   if(window.__authMode==='redirect')return new Response(null,{status:302,headers:{location:'https://auth.example.invalid/login'}});
  }
  if(action==='me')return json({ok:true,data:{id:'flora',label:'Flora'}});
  if(action==='preferences'&&(options.method||'GET')==='GET')return json({ok:true,data:{items:Object.values(window.__store.flora)}});
  if(action==='preferences'&&options.method==='POST'){
   if(window.__expiredWrite)return json({ok:false,error:{code:'UNAUTHENTICATED',message:'Sessão expirada'}},401);
   if(window.__writeFailure)return json({ok:false,error:{message:'Falha sintética'}},502);
   const data=JSON.parse(options.body);window.__store.flora[data.sessionId]=data;
   return json({ok:true,data});
  }
  return json({},404);
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
  check('login hidden for authorized profile',page.locator('#loginButton').is_hidden())
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
  # Public program stays visible when Access redirects or refuses API access.
  for mode in ['401','403','html','redirect']:
   gate=browser.new_page(viewport={'width':390,'height':844})
   gate.set_content(HTML);gate.evaluate(INIT,dict(util=UTIL,app=APP,fixture=FIXTURE,mode=mode))
   gate.wait_for_selector('article.session')
   check('public agenda with '+mode,gate.locator('article.session').count()==3)
   check('login shown '+mode,gate.locator('#loginButton').is_visible())
   check('private editor hidden '+mode,gate.locator('[data-save]').count()==0)
   check('meaningful message '+mode,'Resposta inválida' not in gate.locator('#identity').inner_text())
   gate.close()
  expired=browser.new_page()
  expired.set_content(HTML);expired.evaluate(INIT,dict(util=UTIL,app=APP,fixture=FIXTURE))
  expired.wait_for_selector('article.session')
  expired.evaluate('window.__expiredWrite=true')
  article=expired.locator('article.session').first
  article.locator('summary').click()
  article.locator('[data-field=comment]').fill('não confirmado')
  article.locator('[data-save]').click()
  expired.wait_for_timeout(100)
  check('expired write announces unsaved', 'não salva' in expired.locator('#notice').inner_text())
  check('expired write clears private editors',expired.locator('[data-save]').count()==0)
  check('expired write offers login',expired.locator('#loginButton').is_visible())
  check('expired write not persisted',expired.evaluate('Object.keys(window.__store.flora).length')==0)
  expired.close()
  # Browser's sandbox blocks even routed navigation to arbitrary hostnames.
  # Verify the original production call exists; instrument only its side effect.
  assert "window.location.assign('/auth/login')" in APP
  login=browser.new_page()
  login.set_content(HTML)
  mocked_app=APP.replace("window.location.assign('/auth/login')","window.__loginDestination='/auth/login'")
  login.evaluate(INIT,dict(util=UTIL,app=mocked_app,fixture=FIXTURE,mode='401'))
  login.wait_for_selector('#loginButton:visible')
  login.locator('#loginButton').click()
  check('login CTA targets protected route with mocked navigation',login.evaluate('window.__loginDestination')=='/auth/login')
  login.close()
  browser.close()
 print('BROWSER_SMOKE:',len(checks),'PASS')
if __name__=='__main__':run()
