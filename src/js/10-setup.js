/* ============================== 새 견적서 ============================== */
/* 정형화된 질문 4단계로 계획을 모으고, 5단계에서 AI가 정리한 내용을 말로 고친다 */
var WIZ_T = ['', '어떤 게임인가요?', '무엇을 만들어야 하나요?', '일정과 예산을 알려 주세요', '작업 환경을 알려 주세요', '마지막으로 확인해요'];
var WIZ_N = 5;
function chip(attr, val, label, on, sub){ return '<button type="button" class="choice'+(sub ? ' has-sub' : '')+'" '+attr+'="'+esc(val)+'" aria-pressed="'+!!on+'">'+label+(sub ? '<small>'+sub+'</small>' : '')+'</button>'; }
function defaultName(st){ return (st.genres[0] ? GENRE[st.genres[0]].name : '새') + ' 프로젝트'; }
function msLabel(m){ return monthLabel(m); }
function stepGame(s){
  var gs = Object.keys(GENRE).map(function(k){ return chip('data-gen', k, GENRE[k].name, s.genres.indexOf(k) >= 0); }).join('');
  var vs = Object.keys(VIEWS).map(function(k){ return chip('data-set="view" data-val', k, VIEWS[k].name, s.view === k, VIEWS[k].d); }).join('');
  function sty(cls){ return Object.keys(STYLES).filter(function(k){ return STYLES[k].cls === cls; }).map(function(k){ return chip('data-set="style" data-val', k, STYLES[k].name, s.style === k); }).join(''); }
  return '<div class="qrow"><label class="ql" for="inName">프로젝트 이름</label><input class="field" id="inName" maxlength="30" placeholder="'+esc(defaultName(s))+'" value="'+esc(s.name)+'"><span class="hint">비워 두면 장르 이름으로 저장해요.</span></div>'
    + '<div class="qrow"><span class="ql">장르<span class="ql-s">여러 개 골라도 돼요</span></span><div class="vstack"><div class="choices" role="group" aria-label="장르">'+gs+'</div><input class="field" id="inGenreText" maxlength="30" placeholder="목록에 없으면 직접 적어 주세요 (예: 낚시, 육성)" value="'+esc(s.genreText)+'"></div><span class="hint" id="genreHint">고른 장르를 합쳐 2단계의 에셋 목록 초안을 채워요.'+(s.invTouched ? ' 에셋 목록을 직접 고친 뒤라 장르를 바꿔도 목록은 그대로 둬요. <button type="button" class="link sm" data-act="inv-reset">장르 기준으로 다시 채우기</button>' : '')+'</span></div>'
    + '<div class="qrow"><span class="ql">화면 시점</span><div class="choices" role="group" aria-label="화면 시점">'+vs+'</div><span class="hint">시점에 따라 동작 하나에 그려야 하는 방향 수가 달라져요. 탑다운은 사이드뷰의 약 2배, 쿼터뷰는 약 2.5배로 잡아요.</span></div>'
    + '<div class="qrow"><span class="ql">그림체</span><div class="vstack"><div class="choices sty" role="group" aria-label="도트 그림체"><span class="cg">도트</span>'+sty('pixel')+'</div><div class="choices sty" role="group" aria-label="2D 그림체"><span class="cg">2D</span>'+sty('2d')+'</div><div class="choices sty" role="group" aria-label="3D 그림체"><span class="cg">3D</span>'+sty('3d')+'</div></div><span class="hint">그림체에 맞는 도구만 견적에 넣어요. 도트는 도트 전용 AI 도구까지, 3D는 3D 모델링 도구와 무료 3D 에셋을 비교해요.</span></div>'
    + '<div class="qrow"><span class="ql">엔진</span><div class="choices" role="group" aria-label="엔진">'+ENGINES.map(function(e){ return chip('data-set="engine" data-val', e, e, s.engine === e); }).join('')+'</div><span class="hint">코드 결과물 비교와 코드 후기를 이 엔진 기준으로 보여 드려요.</span></div>';
}
function numIn(id, val, min, max, unit, ph){ return '<span class="ninp"><input class="field" id="'+id+'" type="number" inputmode="numeric" min="'+min+'" max="'+max+'" value="'+(val == null ? '' : val)+'"'+(ph ? ' placeholder="'+ph+'"' : '')+'>'+unit+'</span>'; }
/* 작업판(노션·트렐로·시트)에서 복사한 목록을 읽는다. 한 줄에 '이름, 개수, 동작 수'. 이름으로 종류를 짐작한다 */
function parsePaste(text){
  var lines = text.split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean), objs = [], other = [], skipped = [];
  lines.forEach(function(l, li){
    var cells = l.split(/\t|,|\|/).map(function(c){ return c.trim(); }).filter(function(c){ return c !== ''; }); if(!cells.length) return;
    var name = cells[0].replace(/^[-*•·\s]+/, '').replace(/^\d+[.)]\s*/, '').trim(), nums = cells.slice(1).map(function(c){ var m = c.match(/\d+/); return m ? +m[0] : null; }).filter(function(x){ return x != null; });
    if(!nums.length){ var m2 = name.match(/^(.*?)\s*(\d+)\s*(종|개|마리|명|장|곡|세트|체)?$/); if(m2){ name = m2[1].trim(); nums = [+m2[2]]; } }
    if(!name || !nums.length){ if(li > 0) skipped.push(l); return; }
    var n = Math.min(500, nums[0]), a = nums[1] != null ? Math.min(40, nums[1]) : 3;
    var key = /효과음|사운드|sfx/i.test(name) ? 'sfx' : /배경음악|음악|bgm|ost/i.test(name) ? 'bgm' : /ui|아이콘|버튼/i.test(name) ? 'ui' : /일러스트|컷신|홍보|캡슐/i.test(name) ? 'illus' : /대사|스크립트|텍스트|글/i.test(name) ? 'text' : /배경|맵|타일|스테이지/i.test(name) ? 'scene' : 'obj';
    if(key === 'obj') objs.push([name.slice(0, 20), n, a]); else other.push({key:key, name:name, n:n});
  });
  return {objs:objs, other:other, skipped:skipped};
}
function pasteHTML(){
  return '<details class="paste"'+(S.pasteOpen ? ' open' : '')+'><summary>노션·시트 등에 정리해 둔 에셋 목록이 있나요? 붙여 넣어서 채우기</summary><div class="stack"><span class="hint">노션, 트렐로, 구글 시트에서 복사해 붙여 넣으세요. 한 줄에 ‘이름, 개수, 동작 수’ 순서예요. 효과음, UI, 배경처럼 이름으로 알 수 있는 줄은 그 칸에 넣어요.</span>'
    + '<textarea class="field" id="inPaste" rows="4" placeholder="주인공, 1, 6&#10;슬라임, 4, 3&#10;효과음, 40"></textarea>'
    + '<div class="row-acts"><button type="button" class="btn sm sec" data-act="paste-inv">목록 채우기</button></div>' + (S.pasteMsg ? '<p class="note" role="status">'+S.pasteMsg+'</p>' : '') + '</div></details>';
}
function stepAssets(s){
  var inv = s.inv, V = VIEWS[s.view], is3 = has3d(s);
  var objRows = inv.obj.map(function(g){
    return '<div class="ob"><input class="field" data-objname="'+g.id+'" value="'+esc(g.name)+'" maxlength="20" aria-label="묶음 이름"><span class="ninp"><input class="field" data-objn="'+g.id+'" type="number" inputmode="numeric" min="0" max="300" value="'+g.n+'" aria-label="'+esc(g.name)+' 개수">'+(is3 ? '개' : '종')+'</span><span class="ninp" data-l="각각"><input class="field" data-obja="'+g.id+'" type="number" inputmode="numeric" min="0" max="40" value="'+g.a+'" aria-label="'+esc(g.name)+' 1'+(is3 ? '개' : '종')+'당 동작 수">동작</span><button type="button" class="iconbtn sm" data-objdel="'+g.id+'" aria-label="'+esc(g.name)+' 묶음 빼기"'+(inv.obj.length <= 1 ? ' disabled' : '')+'>'+ui('close', 16)+'</button></div>';
  }).join('');
  var sm = inv.scene.mode, modes = Object.keys(SCENE_MODES).map(function(k){ return '<button type="button" data-scenemode="'+k+'" aria-pressed="'+(sm === k)+'">'+SCENE_MODES[k].name+'</button>'; }).join('');
  var sys = sysList(s), sysChips = sys.map(function(x){ return chip('data-sys', x.id, x.name, x.on); }).join('');
  var extra = EXTRA_SYS.filter(function(k){ return inv.sys[k] == null; }).map(function(k){ return '<button type="button" class="choice add" data-sysadd="'+k+'">+ '+SYSTEMS[k][0]+'</button>'; }).join('');
  var custom = (inv.custom || []).map(function(c){ return '<span class="tchip">'+esc(c.name)+' · '+c.n+(c.unit || '개')+'<button type="button" class="mini" data-cusdel="'+c.id+'" aria-label="'+esc(c.name)+' 빼기">'+ui('close', 12)+'</button></span>'; }).join('');
  return pasteHTML() + '<div class="qrow"><span class="ql">움직이는 오브젝트<span class="ql-s">애니메이션이 들어가는 모든 것</span></span><div class="vstack"><div class="obh" aria-hidden="true"><span>묶음</span><span>개수</span><span>1'+(has3d(s) ? '개' : '종')+'당 동작</span><span></span></div><div class="obl">'+objRows+'</div><button type="button" class="link" data-act="obj-add">'+ui('plus', 14)+'묶음 추가</button></div>'
    + '<span class="hint">캐릭터뿐 아니라 적, NPC, 움직이는 사물(문, 상자, 이펙트)까지 세요. 색만 다른 것은 1종으로 세면 돼요. 동작은 대기·걷기·공격·피격·쓰러짐처럼 세요'+(s.view === 'fixed' ? '. 고정 화면이면 같은 인물의 표정·포즈 그림 수를 동작으로 세면 돼요' : has3d(s) ? '. 3D는 동작 하나를 애니메이션 클립 하나로 세요' : '')+'.</span></div>'
    + '<div class="qrow"><span class="ql">배경·맵</span><div class="vstack"><div class="seg" role="group" aria-label="배경 만드는 방식">'+modes+'</div>'+numIn('inScene', inv.scene.n, 0, 300, SCENE_MODES[sm].unit)+'</div><span class="hint">'+({tile:'작은 조각을 이어 붙여 맵을 만들어요. 지형 종류(숲, 동굴…)마다 1세트로 세요.', paint:'장면마다 한 장으로 그린 배경이에요. 비주얼 노벨, 어드벤처에서 많이 써요.', space:'3D로 만든 맵이에요. 구역(마을, 던전 1층…)마다 1개로 세요.'})[sm]+'</span></div>'
    + '<div class="qrow"><label class="ql" for="inUI">UI·아이콘</label>'+numIn('inUI', inv.ui, 0, 500, '개')+'<span class="hint">버튼, 창, 아이템 아이콘, 체력바를 각각 하나로 세요.</span></div>'
    + '<div class="qrow"><label class="ql" for="inIllus">일러스트·홍보 이미지</label>'+numIn('inIllus', inv.illus, 0, 300, '장')+'<span class="hint">컷신, 카드 그림, 스토어 대표 이미지처럼 한 장으로 완성하는 그림이에요. 스팀은 대표 이미지(캡슐)가 여러 크기로 필요해요.</span></div>'
    + '<div class="qrow"><label class="ql" for="inSfx">효과음</label>'+numIn('inSfx', inv.sfx, 0, 500, '개', String(autoSfx(s)))+'<span class="hint">비워 두면 동작 수를 보고 '+autoSfx(s)+'개로 계산해요.</span></div>'
    + '<div class="qrow"><label class="ql" for="inBgm">배경음악</label>'+numIn('inBgm', inv.bgm, 0, 100, '곡')+'<span class="hint">장면과 메뉴마다 1곡 정도예요.</span></div>'
    + '<div class="qrow"><label class="ql" for="inText">대사·글</label>'+numIn('inText', inv.text, 0, 500, '장면')+'<span class="hint">대화 장면이나 아이템 설명 묶음 수예요. 없으면 0으로 두세요.</span></div>'
    + '<div class="qrow"><span class="ql">코드 기능</span><div class="vstack"><div class="choices" role="group" aria-label="코드 기능">'+sysChips+extra+'</div><span class="ninp wide"><input class="field" id="inSysAdd" maxlength="20" placeholder="다른 기능 (예: 낚시 미니게임)"><button type="button" class="btn sm sec" data-act="sys-add">추가</button></span></div><span class="hint">장르를 보고 필요한 기능을 골라 뒀어요. 잘 모르면 그대로 두세요. 끄면 그만큼 코드 작업 시간이 빠져요.</span></div>'
    + '<div class="qrow"><span class="ql">그 밖의 에셋</span><div class="vstack">'+(custom ? '<div class="chips">'+custom+'</div>' : '')+'<span class="ninp wide"><input class="field" id="inCusName" maxlength="20" placeholder="이름 (예: 컷신 영상용 그림)"><select class="field" id="inCusKind" aria-label="종류"><option value="art">그림</option><option value="sound">소리</option><option value="text">글</option></select><input class="field" id="inCusN" type="number" inputmode="numeric" min="1" max="300" value="1" aria-label="개수"><button type="button" class="btn sm sec" data-act="cus-add">추가</button></span></div><span class="hint">목록에 없는 에셋을 더해요.</span></div>';
}
function stepPlan(s){
  var budgets = [[0,'0원'],[10000,'1만 원'],[30000,'3만 원'],[50000,'5만 원']].map(function(b){ return chip('data-set="budget" data-val', b[0], b[1], s.budget === b[0]); }).join('');
  var onces = [[0,'안 사요'],[30000,'3만 원'],[100000,'10만 원']].map(function(b){ return chip('data-set="onceBudget" data-val', b[0], b[1], (s.onceBudget || 0) === b[0]); }).join('');
  return '<div class="qrow"><label class="ql" for="inRelease">출시 목표</label><div class="vstack">'+numIn('inRelease', s.release, 1, 60, '개월 뒤')+'<span class="note" id="relLbl">'+msLabel(s.release)+' 출시 목표</span></div><span class="hint">작업 시간이 이 기간 안에 들어오는지 함께 보여 드려요.</span></div>'
    + '<div class="qrow"><label class="ql" for="inWeekly">일주일 작업 시간</label>'+numIn('inWeekly', s.weekly, 1, 80, '시간')+'<span class="hint">작업 시간을 몇 주 분량인지로 바꿔 보여 드리고, 구독할 달 수를 계산해요.</span></div>'
    + '<div class="qrow"><span class="ql">한 달 구독 예산</span><div class="vstack"><div class="choices" role="group" aria-label="한 달 구독 예산">'+budgets+'</div><span class="ninp"><label for="inBudget">직접 입력</label> <input class="field" id="inBudget" type="number" inputmode="numeric" min="0" step="1000" value="'+s.budget+'">원</span></div><span class="hint">지금 내고 있는 구독료는 빼고, 새로 매달 낼 수 있는 돈을 알려 주세요.</span></div>'
    + '<div class="qrow"><span class="ql">한 번에 살 수 있는 돈<span class="ql-s">고르지 않아도 돼요</span></span><div class="vstack"><div class="choices" role="group" aria-label="한 번에 살 수 있는 돈">'+onces+'</div><span class="ninp"><label for="inOnce">직접 입력</label> <input class="field" id="inOnce" type="number" inputmode="numeric" min="0" step="1000" value="'+(s.onceBudget || 0)+'">원</span></div><span class="hint">에셋 팩이나 한 번 사서 쓰는 도구처럼 구독이 아닌 돈이에요. 0원이면 사는 방법은 견적에 넣지 않고 표에서만 보여 드려요.</span></div>'
    + '<p class="note">중간 일정과 출시하는 곳은 견적을 저장할 때 정해요. 지금 말해 두고 싶으면 마지막 단계에서 “12월에 데모 공개해”처럼 말해 주세요.</p>';
}
var HAVE_CHIPS = ['claude','copilot','aseprite','pixellab','midjourney','eleven','suno','blender'];
function stepEnv(s){
  var haves = HAVE_CHIPS.map(function(t){ return chip('data-have', t, TOOLS[t].name, s.have.indexOf(t) >= 0); }).join('')
    + s.have.filter(function(t){ return HAVE_CHIPS.indexOf(t) < 0 && TOOLS[t] && TOOLS[t].usd > 0; }).map(function(t){ return chip('data-have', t, TOOLS[t].name, true); }).join('')
    + (s.haveCustom || []).map(function(n){ return '<span class="tchip">'+esc(n)+'<button type="button" class="mini" data-havedel="'+esc(n)+'" aria-label="'+esc(n)+' 빼기">'+ui('close', 12)+'</button></span>'; }).join('');
  var ais = Object.keys(AIKEYS).map(function(k){ return chip('data-ai', k, AIKEYS[k], s.ai[k]); }).join('');
  var vr = Object.keys(VRAM).map(function(k){ return chip('data-set="vram" data-val', k, VRAM[k].name, s.vram === k); }).join('');
  var plans = s.have.filter(function(t){ return TOOLS[t] && TOOLS[t].plans && TOOLS[t].plans.length > 1; }).map(function(t){ var cur = (s.havePlan || {})[t] || TOOLS[t].def;
    return '<label class="planfld"><span>'+TOOLS[t].name+' 요금제</span><select class="field" data-haveplan="'+t+'">'+TOOLS[t].plans.map(function(p){ return '<option value="'+p.id+'"'+(cur === p.id ? ' selected' : '')+'>'+esc(planOpt(p))+'</option>'; }).join('')+'</select></label>'; }).join('');
  var sty = STYLES[s.style], is3 = has3d(s);
  var dr = Object.keys(DRAW).map(function(k){ return chip('data-set="draw" data-val', k, DRAW[k].name, s.draw === k); }).join('');
  return '<div class="qrow"><span class="ql">이미 쓰는 도구</span><div class="vstack"><div class="choices" role="group" aria-label="이미 쓰는 도구">'+haves+'</div>'+(plans ? '<div class="plans">'+plans+'</div>' : '')+'<span class="ninp wide"><input class="field" id="inHave" maxlength="30" placeholder="다른 도구 이름 (예: Krita, ChatGPT)"><button type="button" class="btn sm sec" data-act="have-add">추가</button></span></div><span class="hint">요금제까지 골라 주세요. 상업 이용이 되는 요금제일 때만 추가 비용 0원으로 계산해요. 무료 플랜은 판매용 게임에 못 쓰는 도구가 많아요.</span></div>'
    + '<div class="qrow"><span class="ql">AI를 쓸 곳</span><div class="vstack"><div class="choices" role="group" aria-label="AI를 쓸 곳">'+ais+'</div><div class="row-acts"><button type="button" class="link sm" data-aipreset="all">모두 켜기</button><button type="button" class="link sm" data-aipreset="codetext">코드·글만</button><button type="button" class="link sm" data-aipreset="none">모두 끄기</button></div></div><span class="hint">끈 곳은 직접 만들기, 무료 에셋, 구매로만 견적을 짜요. 그림은 쓰고 애니메이션은 직접 그리는 것처럼 나눠 고를 수 있어요.</span></div>'
    + (s.ai.art ? '<div class="qrow"><span class="ql">그래픽카드 메모리(VRAM)</span><div class="choices" role="group" aria-label="그래픽카드 메모리">'+vr+'</div><span class="hint">그래픽카드에 따로 달린 메모리예요. 내 PC에서 돌리는 무료 그림 AI(Z-Image)를 쓸 수 있는지가 이 값으로 정해져요. 공식 안내는 16GB이고, 압축 버전은 8GB에서도 돌아가요. 윈도우는 작업 관리자 → 성능 → GPU의 ‘전용 GPU 메모리’에서 확인할 수 있어요. 맥(애플 실리콘)은 그래픽 메모리를 따로 두지 않으니 ‘잘 모르겠어요’를 골라 주세요. 모르면 그런 도구는 기본 견적에 넣지 않아요.</span></div>' : '')
    + '<div class="qrow"><span class="ql">직접 만드는 속도</span><div class="vstack"><span class="qtx">'+sty.name+roStr(sty.name)+(is3 ? ' 캐릭터 모델 하나를 만드는 데' : ' 캐릭터 하나를 대기 자세 한 장으로 그리는 데')+' 얼마나 걸리나요?</span><div class="choices" role="group" aria-label="직접 만드는 속도">'+dr+'</div></div><span class="hint">이 시간을 기준으로 동작, 배경, UI의 직접 작업 시간을 계산해요. 잘 모르겠으면 '+sty.name+' 평균('+sty.dh+'시간)으로, 거의 그려 본 적이 없으면 그 두 배로 잡아요.</span></div>';
}
/* 5단계: 지금까지 고른 내용을 문장으로 정리한다 */
function planLines(s){
  syncSt(s);
  var inv = s.inv, L = [];
  L.push('<b>게임</b> ' + esc(s.name || defaultName(s)) + ' · ' + esc(genreName(s)) + ' · ' + VIEWS[s.view].name + ' · ' + STYLES[s.style].name + ' · ' + s.engine);
  L.push('<b>움직이는 오브젝트</b> ' + inv.obj.map(function(g){ return esc(g.name) + ' ' + g.n + (has3d(s) ? '개' : '종') + '(동작 ' + g.a + ')'; }).join(', '));
  var q = qtyOf(s);
  L.push('<b>그 밖의 에셋</b> 배경 ' + inv.scene.n + SCENE_MODES[inv.scene.mode].unit + '(' + SCENE_MODES[inv.scene.mode].name + '), UI ' + inv.ui + '개, 일러스트 ' + inv.illus + '장, 효과음 ' + q.sfx + '개, 배경음악 ' + inv.bgm + '곡' + (inv.text ? ', 대사 ' + inv.text + '장면' : '') + ((inv.custom || []).length ? ', ' + inv.custom.map(function(c){ return esc(c.name) + ' ' + c.n + (c.unit || '개'); }).join(', ') : ''));
  L.push('<b>코드 기능</b> ' + sysList(s).filter(function(x){ return x.on; }).map(function(x){ return esc(x.name); }).join(', '));
  L.push('<b>일정·예산</b> ' + msLabel(s.release) + ' 출시 목표(주 ' + s.weekly + '시간)' + ((s.ms || []).length ? ', ' + s.ms.map(function(m){ return esc(m.name) + ' ' + shortMonth(msLabel(m.m)); }).join(', ') : '') + ' · 한 달 구독 ' + manwon(s.budget) + ' · 한 번에 ' + manwon(s.onceBudget || 0));
  var hv = s.have.map(function(t){ var p = TOOLS[t] ? planOf(t, (s.havePlan || {})[t]) : null; return TOOLS[t] ? TOOLS[t].name + (p && TOOLS[t].plans.length > 1 ? ' ' + p.name : '') : t; }).concat(s.haveCustom || []);
  L.push('<b>작업 환경</b> 이미 쓰는 도구 ' + (hv.length ? esc(hv.join(', ')) : '없음') + ' · AI는 ' + (Object.keys(AIKEYS).filter(function(k){ return s.ai[k]; }).map(function(k){ return AIKEYS[k]; }).join(', ') || '안 씀') + (s.ai.art ? ' · VRAM ' + VRAM[s.vram].name : '') + ' · 캐릭터 하나 ' + (DRAW[s.draw].h != null ? DRAW[s.draw].name : drawH(s) + '시간으로 계산'));
  return L;
}
function stepReview(s){
  if(!S.intake.length) S.intake.push({who:'bot', text:'지금까지 알려 주신 내용을 정리했어요. 빠졌거나 다른 게 있으면 말해 주세요. 예를 들어 “보스 2마리 추가, 동작은 6개”, “12월에 데모 공개해”처럼요.'});
  return '<div class="plan"><h3>정리한 계획</h3><ul>' + planLines(s).map(function(l){ return '<li>'+l+'</li>'; }).join('') + '</ul></div>'
    + '<div class="ichat"><div class="msgs" id="imsgs" aria-live="polite">' + S.intake.map(function(m, i){ return '<div class="msg '+m.who+'">'+(m.who === 'bot' ? '<span class="sr">도우미: </span>' : '')+m.text+(m.pend && !m.done ? '<span class="ask"><button type="button" class="p" data-ipend="'+i+':1">만들기</button><button type="button" data-ipend="'+i+':0">아니요</button></span>' : '')+'</div>'; }).join('') + '</div>'
    + '<div class="sugg" role="group" aria-label="이렇게 말해 보세요">' + INTAKE_SUGG.filter(function(x){ return !(S.intake || []).some(function(m){ return m.who === 'me' && m.text === x; }); }).map(function(x){ return '<button type="button" data-isay="'+esc(x)+'">'+esc(x)+'</button>'; }).join('') + '</div>'
    + '<form class="chatf" id="intakeF"><label class="sr" for="intakeIn">계획 고치기</label><input class="field" id="intakeIn" autocomplete="off" placeholder="예: NPC는 빼 줘, 출시는 내년 8월이야"><button type="submit" class="iconbtn send" aria-label="보내기">'+ui('send', 18)+'</button></form>'
    + '<p class="note">도우미는 정해진 규칙으로 말을 알아들어요. 알아들은 내용은 위 계획에 바로 반영하고, 새 묶음을 만들 때는 먼저 물어봐요. 못 알아들으면 이전 단계에서 직접 고쳐 주세요.</p></div>';
}
function applyGenres(){
  var s = S.setup;
  if(!s.viewTouched && s.genres.length){ s.views = uniq(s.genres.map(function(g){ return GENRE[g].view; })); s.view = s.views[0]; }
  if(!s.invTouched){ var f0 = s.inv && s.inv.feat; s.inv = invFromGenres(s.genres.length ? s.genres : ['plat']); s.inv.feat = f0 || {}; }
  syncSt(s);
}
/* 3D 그림체에는 3D 시점이, 2D 그림체에는 2D 시점이 맞도록 맞춘다 */
function syncStyleView(s, changed){
  var is3s = has3d(s), v3only = !!VIEWS[s.view].is3d, msg = '';
  if(!is3s && v3only){
    if(changed === 'style'){ s.view = s.genres[0] && !VIEWS[GENRE[s.genres[0]].view].is3d ? GENRE[s.genres[0]].view : 'side'; msg = '2D 그림체라 시점을 ' + VIEWS[s.view].name + roStr(VIEWS[s.view].name) + ' 바꿨어요.'; }
    else { s.style = 'lowpoly'; is3s = true; msg = VIEWS[s.view].name + ' 시점은 3D라 그림체를 로우폴리 3D로 바꿨어요. 다른 3D 그림체로 바꿔도 돼요.'; }
  }
  if(is3s && s.inv.scene.mode !== 'space'){ s.inv.scene.mode = 'space'; msg += (msg ? ' ' : '') + '배경 방식을 3D 공간으로 바꿨어요.'; }
  if(!is3s && s.inv.scene.mode === 'space'){ s.inv.scene.mode = 'tile'; msg += (msg ? ' ' : '') + '배경 방식을 타일 조합으로 바꿨어요.'; }
  return msg;
}
