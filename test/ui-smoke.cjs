const {chromium}=require('playwright');
const F='file://'+require('path').resolve(__dirname,'../dist/index.test.html');
const W=+(process.argv[2]||1440), H=+(process.argv[3]||900), TAG=process.argv[4]||'d';
(async()=>{const b=await chromium.launch();const errs=[];const log=(...a)=>console.log(...a);
const p=await (await b.newContext({viewport:{width:W,height:H}})).newPage();p.setDefaultTimeout(3000);
p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
let n=0;const shot=async(nm,full)=>{n++;await p.screenshot({path:require('path').resolve(__dirname,'shots')+'/'+TAG+'-'+String(n).padStart(2,'0')+'-'+nm+'.png',fullPage:!!full})};
const step=async(nm,f)=>{const e0=errs.length;try{await f();await p.waitForTimeout(120);log(errs.length>e0?'ERR':'ok',nm,errs.slice(e0).join(' || ').slice(0,400))}catch(e){log('FAIL',nm,e.message.split('\n')[0])}};
const menu=async()=>{if(W<=980){await p.click('#menuBtn');await p.waitForTimeout(150)}};
const bot=()=>p.evaluate(()=>{const m=[...document.querySelectorAll('.msg.bot')];return m.length?m[m.length-1].innerText.replace(/\s+/g,' '):''});
const chatOpen=async()=>{if(W<=1340){const o=await p.evaluate(()=>__t.S.chatOpen);if(!o)await p.click('.rbar .chatbtn')}};
const chatClose=async()=>{if(W<=1340){const o=await p.evaluate(()=>__t.S.chatOpen);if(o)await p.keyboard.press('Escape')}};
await p.goto(F);await p.waitForTimeout(400);
await step('home',()=>shot('home'));
await step('start',async()=>{await p.click('.ph [data-go=setup]');await shot('start',true)});
await step('start pick',async()=>{await p.click('[data-gen=rogue]');await p.click('[data-sty=px16]');await p.click('[data-set=budget][data-val="50000"]')});
await step('intake say',async()=>{await p.fill('#intakeIn','적은 10종쯤 있어');await p.press('#intakeIn','Enter');await p.waitForTimeout(150);log('   ->',await p.evaluate(()=>{const m=[...document.querySelectorAll('#imsgs .msg.bot')];return m[m.length-1].innerText.replace(/\s+/g,' ')}))});
await step('make',async()=>{await p.click('.row-acts [data-wiz="2"]');await shot('step2',true);await p.click('.row-acts [data-act=make]');await p.waitForTimeout(1600);await shot('quote');await shot('quote-full',true)});
log('cmp',await p.$$eval('.cm-h',x=>x.map(e=>e.innerText.replace(/\s+/g,' '))));
for(let i=0;i<12;i++){
  const q=await p.evaluate(()=>{const b=document.querySelector('.nq:not(.done) b');return b?b.innerText:null});
  if(!q)break;
  await step('nq '+q.slice(0,24),async()=>{await chatOpen();const chips=await p.$$('.nq [data-nq]');const multi=await p.$('.nq [data-nqdone]');
    if(multi){await chips[0].click();await p.click('.nq [data-nqdone]')}else{await chips[Math.min(1,chips.length-1)].click()}
    await p.waitForTimeout(150);log('   ->',(await bot()).slice(0,160))});
}
await step('nq shot',async()=>{await chatOpen();await shot('nq-done');await chatClose()});
await step('cond look',async()=>{await p.click('[data-cond=look]');await shot('cond-look');await p.click('[data-csty=cartoon]');await p.click('[data-act=cs-apply]');await p.waitForTimeout(150);log('   flash',await p.$$eval('.tr-wrap.flash',x=>x.length));log('   ->',(await bot()).slice(0,200))});
await step('cond once',async()=>{await p.click('[data-act=cond-all]');await p.click('[data-cond=once]');await shot('cond-once');await p.click('[data-cs=onceBudget][data-val="100000"]');await p.click('[data-act=cs-apply]')});
await step('pick col',async()=>{const h=await p.$$('.cm-h, .cm-tabs [data-q]');await p.locator('.cmp [data-q], .cm-tabs [data-q]').filter({visible:true}).last().click();log('   sel',await p.evaluate(()=>__t.S.draft.sel))});
await step('basep',async()=>{await p.click('[data-basep]');await shot('basep');await p.keyboard.press('Escape')});
await step('cell',async()=>{const c=await p.$('.cm-card.sel .cm-sec');await c.click();await p.waitForTimeout(200);log('   open',await p.evaluate(()=>__t.S.draft.open))});

await step('row open',async()=>{await shot('row-open')});
await step('swap',async()=>{const s=await p.$('.rd [data-swap]');if(s){await s.click();log('   toast',await p.innerText('#toast'))}});

await step('chat',async()=>{await chatOpen();await p.fill('#chatIn','효과음은 AI로 뽑을래요');await p.press('#chatIn','Enter');await p.waitForTimeout(800);log('   ->',(await bot()).slice(0,200));await chatClose()});
await step('toolgo',async()=>{if(!(await p.evaluate(()=>__t.S.draft.open==='bgm')))await p.click('[data-open=bgm]');await p.click('#row-bgm .rd [data-toolgo]');await p.waitForTimeout(200);await shot('tool-from-quote',true)});
await step('back to draft',async()=>{await menu();await p.click('[data-act=to-draft]');await p.waitForTimeout(200)});
await step('save',async()=>{await p.click('.rbar [data-act=save]');await p.click('#saveF button[type=submit]');await p.waitForTimeout(300);log('   view',await p.evaluate(()=>__t.S.view+' '+__t.S.quotes.length))});
await step('tools',async()=>{await menu();await p.click('.navbtn[data-go=tools]');await shot('tools',true)});
await step('tools filter',async()=>{await p.click('[data-tcat=obj]');await p.click('[data-tcls=pixel]');log('   cards',await p.$$eval('.tcard b',x=>x.map(e=>e.innerText).join(',')))});
await step('tool page',async()=>{await p.click('[data-toolpage=pixellab]');await shot('tool-page',true)});
await step('tool tab',async()=>{await p.click('[data-tpcat=scene]');log('   works',await p.$$eval('.wcard',x=>x.length))});
await step('work',async()=>{await p.click('[data-tpcat=obj]');await p.click('.wcard');await shot('work')});
await step('unlock',async()=>{await shot('work-locked');await p.click('[data-unlock]');await p.waitForTimeout(150);log('   tok',await p.innerText('#toast'))});
await step('work votes',async()=>{await p.click('[data-whelp]');await p.click('[data-wvote$="|same"]');log('   ',await p.innerText('.wsec.other .row-acts'))});
await step('comment',async()=>{await p.fill('#cIn','좋은 팁 고마워요');await p.click('[data-cmtsend]');await p.click('[data-replyto]');await p.fill('#rIn','저도 해 볼게요');await p.click('[data-replysend]');log('   cms',await p.$$eval('.cm',x=>x.length));await shot('work-cm');await p.keyboard.press('Escape')});
await step('rev unlock',async()=>{const u=await p.$('[data-unlockrev]');if(u){await u.click();log('   ',await p.innerText('#toast'))}});
await step('tool review',async()=>{await p.click('[data-trev]');await p.click('[data-trstar="5"]');await p.fill('#trText','좋아요');await p.click('#trF button[type=submit]');log('   star',await p.innerText('.tp-star .big'))});
await step('upload',async()=>{await p.click('.ph [data-uploadfor]');await p.click('[data-act=pick-file]');await p.fill('#upTitle','테스트 결과물 올리기');await p.click('[data-upstar="4"]');await p.click('[data-upsat=meet]');await p.click('[data-uphow=aiedit]');await p.check('#upOwn');await shot('upload');await p.click('#upF button[type=submit]');await p.waitForTimeout(200);log('   toast',await p.innerText('#toast'))});
await step('game log',async()=>{await p.evaluate(()=>__t.go('quote',{q:'q1',step:2}));await p.click('.lrow [data-logadd]');await shot('logform');await p.click('[data-lfhow=aiedit]');await p.click('#logF button[type=submit]');log('   toast',await p.innerText('#toast'))});
await step('game disc',async()=>{await p.evaluate(()=>__t.go('quote',{q:'q2',step:3}));await p.click('[data-dlive=no]');log('   en',(await p.innerText('.copybox')).replace(/\n/g,' / '))});
await step('game quote',async()=>{await p.evaluate(()=>__t.go('quote',{q:'q1',step:1}));await shot('game-quote',true)});
await step('edit quote',async()=>{await p.click('[data-act=edit-quote]');await p.waitForTimeout(300);log('   sel',await p.evaluate(()=>__t.S.draft.sel));await shot('edit')});
log('ERRORS',errs.length);errs.slice(0,15).forEach(e=>log(' ',e));
await b.close();})();
