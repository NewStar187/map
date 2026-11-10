function startAssetsHTML(s){
  var inv = s.inv, multiS = s.styles.length > 1, multiV = s.views.length > 1, open = S.assetOpen == null ? 'obj' : S.assetOpen, seen = s.aseen || {}, fl = S.aflash || [];
  S.aflash = null;
  function styleSel(attr, cur){ return multiS ? '<select class="field sm" '+attr+' aria-label="그림체">' + s.styles.map(function(k){ return '<option value="'+k+'"'+(styleOfRow(s, cur) === k ? ' selected' : '')+'>'+STYLES[k].name+'</option>'; }).join('') + '</select>' : ''; }
  function viewSel(attr, cur){ return multiV ? '<select class="field sm" '+attr+' aria-label="시점">' + s.views.map(function(k){ return '<option value="'+k+'"'+(viewOfRow(s, cur) === k ? ' selected' : '')+'>'+VIEWS[k].name+'</option>'; }).join('') + '</select>' : ''; }
  function fld(lbl, inner, note){ return '<div class="acf"><span class="acl">'+lbl+'</span><div class="row-acts">'+inner+'</div>'+(note ? '<span class="note">'+note+'</span>' : '')+'</div>'; }
  var scls = STYLES[styleOfRow(s, inv.scene.style)].cls, f = inv.feat || {};
  var body = {
    obj: function(){
      return '<span class="note">주인공, 적, NPC, 문이나 상자처럼 움직이는 것을 묶음으로 적어요. 색만 다른 것은 1종으로 세요.</span>'
        + inv.obj.map(function(g){ return '<div class="ob2"><input class="field" data-objname="'+g.id+'" value="'+esc(g.name)+'" maxlength="20" aria-label="묶음 이름"><span class="ninp"><input class="field" data-objn="'+g.id+'" type="number" inputmode="numeric" min="0" max="300" value="'+g.n+'" aria-label="'+esc(g.name)+' 개수">'+(STYLES[styleOfRow(s, g.style)].cls === '3d' ? '개' : '종')+'</span>' + styleSel('data-objsty="'+g.id+'"', g.style) + viewSel('data-objvw="'+g.id+'"', g.view) + '<button type="button" class="iconbtn sm" data-objdel="'+g.id+'" aria-label="'+esc(g.name)+' 묶음 지우기"'+(inv.obj.length > 1 ? '' : ' disabled')+'>'+ui('close', 16)+'</button></div>'; }).join('')
        + '<div class="row-acts"><button type="button" class="btn sm sec" data-act="obj-add">'+ui('plus', 14)+' 묶음 더하기</button></div>';
    },
    scene: function(){
      var modes = Object.keys(SCENE_MODES).filter(function(k){ return scls === '3d' ? k === 'space' : k !== 'space'; }).map(function(k){ return '<button type="button" data-scenemode="'+k+'" aria-pressed="'+((scls === '3d' ? 'space' : inv.scene.mode) === k)+'">'+SCENE_MODES[k].name+'</button>'; }).join('');
      return fld('만드는 방식', '<div class="seg" role="group" aria-label="배경 만드는 방식">'+modes+'</div>') + fld('개수', numIn('inScene', inv.scene.n, 0, 300, SCENE_MODES[scls === '3d' ? 'space' : inv.scene.mode].unit) + styleSel('data-gsty="scene"', inv.scene.style), '타일은 묶음 수, 한 장 배경은 장면 수로 세요.');
    },
    ui: function(){ return fld('개수', numIn('inUI', inv.ui, 0, 500, '개') + styleSel('data-gsty="ui"', inv.uiStyle), '버튼, 창, 아이템 아이콘, 체력바를 각각 하나로 세요.'); },
    illus: function(){ return fld('장 수', numIn('inIllus', inv.illus, 0, 300, '장') + styleSel('data-gsty="illus"', inv.illusStyle), '컷신, 카드 그림, 스토어 대표 이미지처럼 한 장으로 완성하는 그림이에요.'); },
    sound: function(){ return '<div class="acg">' + fld('효과음', numIn('inSfx', inv.sfx, 0, 500, '개', String(autoSfx(s))), '비워 두면 동작 수를 보고 '+autoSfx(s)+'개로 잡아요.') + fld('배경음악', numIn('inBgm', inv.bgm, 0, 100, '곡'), '장면과 메뉴마다 1곡 정도예요.') + '</div>'; },
    text: function(){ return fld('장면 수', numIn('inText', inv.text, 0, 500, '장면'), '대화 장면이나 아이템 설명 묶음 수예요. 없으면 0으로 두세요.'); },
    feat: function(){ return '<div class="choices">' + Object.keys(FEATS).map(function(x){ return chip('data-sfeat', x, FEATS[x][0], x === 'i18n' ? f.i18n > 0 : !!f[x]); }).join('') + '</div><span class="note">튜토리얼은 안내 UI와 대사를, 다국어는 번역 줄을, 모바일은 화면 크기별 UI를, 온라인 멀티는 서버와 연결 코드를 더해요.</span>'; },
    etc: function(){
      var cs = inv.custom || [];
      return '<span class="note">위 카테고리에 맞지 않는 에셋을 더해요. 종류에 따라 그림·소리·글 도구로 견적을 짜요.</span>'
        + (cs.length ? '<ul class="cuslist">' + cs.map(function(c){ return '<li><span class="ck">'+(CUS_KIND[c.kind] || '그림')+'</span><b>'+esc(c.name)+'</b><span class="cn">'+c.n+(c.unit || '개')+'</span><button type="button" class="iconbtn sm" data-cusdel="'+c.id+'" aria-label="'+esc(c.name)+' 빼기">'+ui('close', 14)+'</button></li>'; }).join('') + '</ul>' : '')
        + '<div class="cusadd"><input class="field" id="inCusName" maxlength="20" placeholder="이름 (예: 컷신 그림)" aria-label="에셋 이름"><select class="field" id="inCusKind" aria-label="종류"><option value="art">그림</option><option value="sound">소리</option><option value="text">글</option></select><span class="ninp"><input class="field" id="inCusN" type="number" inputmode="numeric" min="1" max="300" value="1" aria-label="개수"></span><button type="button" class="btn sm sec" data-act="cus-add">'+ui('plus', 14)+' 추가</button></div>'
        + '<div class="cushint">'+icon('spark', 14)+'<span>도우미에게 말해도 돼요.</span><button type="button" class="linkbtn" data-ifill="컷신 그림 10장 추가해 줘">“컷신 그림 10장 추가해 줘”</button></div>';
    }
  };
  var list = ACATS.map(function(c, i){
    var k = c[0], isOpen = open === k, nx = ACATS[i + 1], done = !!seen[k];
    return '<section class="ac'+(isOpen ? ' open' : '')+(done ? ' seen' : '')+(fl.indexOf(k) >= 0 ? ' flash' : '')+'" id="ac-'+k+'">'
      + '<h3><button type="button" class="ach" data-acat="'+k+'" aria-expanded="'+isOpen+'" aria-controls="acb-'+k+'"><span class="acn" aria-hidden="true">'+(done && !isOpen ? ui('check', 14) : i + 1)+'</span><span class="act"><b>'+c[1]+'</b><small>'+c[2]+'</small></span><span class="acs" data-asum="'+k+'">'+acatSum(s, k)+'</span><span class="cv">'+ui(isOpen ? 'chevUp' : 'chev', 16)+'</span></button></h3>'
      + (isOpen ? '<div class="acb" id="acb-'+k+'">' + body[k]() + (nx ? '<div class="acnext"><button type="button" class="btn sm sec" data-acat="'+nx[0]+'">다음: '+nx[1]+' '+ui('chev', 14)+'</button></div>' : '') + '</div>' : '')
      + '</section>';
  }).join('');
  var nSeen = ACATS.filter(function(c){ return seen[c[0]]; }).length;
  return '<p class="note">'+esc(genreName(s))+' 기본값으로 채워 뒀어요. 카테고리를 하나씩 열어 확인하시고, 모르는 건 그대로 두셔도 돼요. 견적을 본 뒤에도 고칠 수 있어요.'+(multiS || multiV ? ' 그림체나 시점을 여러 개 고르셔서 묶음마다 따로 정할 수 있어요.' : '')+'</p>'
    + '<div class="acc"><div class="acc-h"><span>에셋 카테고리</span><small>'+nSeen+' / '+ACATS.length+' 확인</small></div>' + list + '</div>'
    + pasteHTML();
}
var INTAKE_SUGG = ['도트 그림 로그라이크야', '적은 10종쯤 있어', '예산은 월 2만 원', '보스 3마리 추가해 줘'];
var INTAKE_SUGG2 = ['보스 3마리 추가해 줘', '컷신 그림 10장 추가해 줘', '배경음악 5곡', '튜토리얼도 넣을 거야'];
function renderSetup(){
  var s = syncSt(S.setup), w = S.wiz === 2 ? 2 : 1;
  if(!S.intake.length) S.intake.push({who:'bot', text:'안녕하세요. 어떤 게임인지 먼저 알려 주시면, 다음 단계에서 필요한 에셋을 함께 정해요. 왼쪽에서 골라도 되고, 여기에 말로 적어도 돼요.'});
  var gs = Object.keys(GENRE).map(function(k){ return chip('data-gen', k, GENRE[k].name, s.genres.indexOf(k) >= 0); }).join('');
  function sty(cls){ return Object.keys(STYLES).filter(function(k){ return STYLES[k].cls === cls; }).map(function(k){ var i0 = s.styles.indexOf(k); return chip('data-sty', k, STYLES[k].name, i0 >= 0); }).join(''); }
  var vs = Object.keys(VIEWS).map(function(k){ var i0 = s.views.indexOf(k); return chip('data-vw', k, VIEWS[k].name, i0 >= 0, VIEWS[k].d); }).join('');
  var budgets = [[0, '0원'], [10000, '1만 원'], [30000, '3만 원'], [50000, '5만 원']].map(function(b){ return chip('data-set="budget" data-val', b[0], b[1], s.budget === b[0]); }).join('');
  var body = w === 1
    ? '<div class="sq"><h2><span class="n">1</span>어떤 게임인가요?</h2><span class="note">여러 장르가 섞여 있다면 모두 고르세요.</span><div class="choices" role="group" aria-label="장르">'+gs+'</div><input class="field" id="inGenreText" maxlength="30" placeholder="목록에 없으면 적어 주세요 (예: 낚시, 육성)" value="'+esc(s.genreText)+'"></div>'
      + '<div class="sq"><h2><span class="n">2</span>어떻게 보이나요?</h2><span class="note">그림체와 시점 모두 여러 개 골라도 돼요.</span><div class="choices sty" role="group" aria-label="도트 그림체"><span class="cg">도트</span>'+sty('pixel')+'</div><div class="choices sty" role="group" aria-label="2D 그림체"><span class="cg">2D</span>'+sty('2d')+'</div><div class="choices sty" role="group" aria-label="3D 그림체"><span class="cg">3D</span>'+sty('3d')+'</div>'
      + '<span class="note">화면 시점 · 장면마다 다르다면(예: 탐험은 사이드뷰, 마을은 탑다운) 모두 고르세요</span><div class="choices" role="group" aria-label="화면 시점">'+vs+'</div></div>'
      + '<div class="sq"><h2><span class="n">3</span>지금 쓰는 요금제 말고, 한 달에 더 쓸 수 있는 돈은요?</h2><div class="choices" role="group" aria-label="월 추가 예산">'+budgets+'</div><label class="ninp">직접 적기 <input class="field" id="inBudget" type="number" inputmode="numeric" min="0" max="1000000" value="'+s.budget+'">원</label><span class="note">이미 내고 있는 구독료는 빼고 생각해 주세요. 견적은 이 돈 안에서 짜요.</span></div>'
      + '<div class="row-acts between"><button type="button" class="btn sec" data-act="make">에셋은 기본값으로 견적 보기</button><button type="button" class="btn lg" data-wiz="2">다음: 에셋 구성</button></div>'
    : startAssetsHTML(s) + '<div class="row-acts between"><button type="button" class="btn sec" data-wiz="1">이전</button><button type="button" class="btn lg" data-act="make">견적 보기</button></div>';
  $('view').innerHTML = '<div class="qtop"><button type="button" class="crumb" data-go="home">'+ui('left', 16)+'내 게임</button><h1>새 게임 견적</h1><p class="lead">게임을 알려 주시고, 필요한 에셋을 정하면 바로 견적을 보여 드려요. 나머지는 견적을 보면서 하나씩 여쭤볼게요.</p></div>'
    + '<div class="slay"><div class="card start stack"><nav class="sstep" aria-label="단계"><button type="button" data-wiz="1"'+(w === 1 ? ' aria-current="step"' : '')+'><i>1</i>게임</button><span aria-hidden="true">›</span><button type="button" data-wiz="2"'+(w === 2 ? ' aria-current="step"' : '')+'><i>2</i>에셋 구성</button><span aria-hidden="true">›</span><span class="sx"><i>3</i>견적</span></nav>'
    + '<h2 class="wz-t" tabindex="-1" id="wzT">'+(w === 1 ? '게임을 알려 주세요' : '어떤 에셋이 필요한가요?')+'</h2>' + body + '</div>'
    + '<aside class="card chat ichat" aria-labelledby="ichT"><div class="chat-h"><span class="av">'+icon('spark', 18)+'</span><div><b id="ichT">견적 도우미</b><small>처음부터 끝까지 같은 대화로 이어져요</small></div></div>'
    + '<div class="msgs" id="imsgs" aria-live="polite">' + S.intake.map(function(m, i){ return m.hide ? '' : '<div class="msg '+m.who+'">'+(m.who === 'bot' ? '<span class="sr">도우미: </span>' : '<span class="sr">나: </span>')+m.text+(m.pend && !m.done ? '<span class="ask"><button type="button" class="p" data-ipend="'+i+':1">만들기</button><button type="button" data-ipend="'+i+':0">아니요</button></span>' : '')+'</div>'; }).join('') + '</div>'
    + '<div class="sugg" role="group" aria-label="이렇게 말해 보세요">' + (w === 2 ? INTAKE_SUGG2 : INTAKE_SUGG).filter(function(x){ return !S.intake.some(function(m){ return m.who === 'me' && m.text === x; }); }).map(function(x){ return '<button type="button" data-isay="'+esc(x)+'">'+esc(x)+'</button>'; }).join('') + '</div>'
    + '<form class="chatf" id="intakeF"><label class="sr" for="intakeIn">도우미에게 할 말</label><input class="field" id="intakeIn" autocomplete="off" placeholder="'+(w === 1 ? '예: 도트 그림 플랫포머야' : '예: 보스 3마리 추가해 줘')+'"><button type="submit" class="iconbtn send" aria-label="보내기">'+ui('send', 18)+'</button></form>'
    + '<p class="note">도우미는 정해진 규칙으로 말을 알아들어요. 알아들은 내용은 왼쪽에 바로 반영돼요.</p></aside></div>';
  var im = $('imsgs'); if(im) im.scrollTop = im.scrollHeight;
}
function renderPreview(){}

/* 견적 하나의 되돌리기용 스냅샷: 고른 방법과 고정한 줄. 예산은 메시지에 따로 남긴다 */
/* cap: 도우미에게 "월 1만 원 안으로"처럼 말해 그 견적에만 둔 월 상한. 이후 도우미 요청은 이 상한을 넘으면 묻고 바꾼다 */
