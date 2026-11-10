/* ============================== 기준 데이터 ============================== */
var FX = 1341.0;   /* 1 USD = 1,341.0원 (2026-11-03 서울 외환시장 종가) */
var FX_NOTE = '1달러 1,341원(11월 3일 종가)';
var VAT = 1.1;     /* 해외 디지털 서비스 부가세 10% 포함 */
function usd(d){ return Math.round(d * FX * VAT); }
var TODAY = '11월 4일', CHECKED = '11월 4일';
var MIN_WAGE = 10320;
function hourV(){ return S && S.hourVal != null ? S.hourVal : MIN_WAGE; } /* 2026년 최저시급. '균형' 비교의 기본 시간 값 */
var STORE_KEY = 'asset-quote-proto-v8';

var TOOLS = {
  aseprite: {name:'Aseprite', price:'ok', rights:'self', label:'Aseprite로 직접', say:'Aseprite로 직접 그려요', av:'#cdd6f4', why:'내가 그린 그림이라 권리 걱정이 없어요.', alias:'에이스프라이트|아세프라이트', plans:[{id:'own', name:'구매함', usd:0, rights:'ok'}], def:'own'},
  selfart:  {name:'직접 그리기', price:'ok', rights:'self', label:'직접 그리기', say:'직접 그려요', av:'#cdd6f4', why:'내가 그린 그림이라 권리 걱정이 없어요.'},
  blender:  {name:'Blender', plan:'무료', price:'ok', rights:'self', label:'Blender로 직접', say:'Blender로 직접 만들어요', av:'#fab387', ro:'로', why:'내가 만든 모델이라 권리 걱정이 없어요.', alias:'블렌더'},
  selfsound:{name:'직접 녹음·편집', price:'ok', rights:'self', label:'직접 녹음·편집', say:'직접 녹음하고 편집해요', av:'#89b4fa', why:''},
  selfmusic:{name:'직접 작곡', price:'ok', rights:'self', label:'직접 작곡', say:'직접 작곡해요', av:'#89b4fa', why:''},
  selfcode: {name:'직접 코딩', price:'ok', rights:'self', label:'직접 코딩', say:'직접 짜요', av:'#94e2d5', why:''},
  selftext: {name:'직접 쓰기', price:'ok', rights:'self', label:'직접 쓰기', say:'직접 써요', av:'#94e2d5', why:''},
  kenney:   {name:'Kenney', plan:'무료 에셋', price:'ok', rights:'ok', pack:true, label:'Kenney 무료 에셋', say:'Kenney 무료 에셋을 써요', av:'#a6e3a1', simple:true, src:'kenney.nl 라이선스 안내(CC0 1.0)', why:'CC0(저작권을 포기한 공개 라이선스)라서 출처를 밝히지 않아도 상업적으로 쓸 수 있어요.', alias:'케니'},
  quaternius:{name:'Quaternius', plan:'무료 3D 에셋', price:'ok', rights:'ok', pack:true, label:'Quaternius 무료 3D', say:'Quaternius 무료 3D 에셋을 써요', av:'#a6e3a1', simple:true, src:'quaternius.com 라이선스 안내(CC0)', why:'CC0라서 출처를 밝히지 않아도 상업적으로 쓸 수 있어요.', alias:'쿼터니우스'},
  cc0sound: {name:'무료 효과음 팩', price:'ok', rights:'check', pack:true, label:'무료 효과음 팩', say:'무료 효과음 팩을 써요', av:'#89b4fa', why:'팩마다 라이선스가 달라요. 받은 곳의 조건을 확인해 주세요.'},
  cc0music: {name:'무료 음원', price:'ok', rights:'check', pack:true, label:'무료 음원', say:'무료 음원을 받아 써요', av:'#89b4fa', why:'곡마다 라이선스가 달라요. 받은 곳의 조건을 확인해 주세요.'},
  jsfxr:    {name:'jsfxr', plan:'무료', price:'ok', rights:'ok', label:'jsfxr로 직접', say:'jsfxr로 직접 만들어요', av:'#89b4fa', src:'jsfxr 프로젝트 안내', why:'직접 만든 소리라 출처를 밝히지 않아도 쓸 수 있어요.'},
  pixellab: {name:'PixelLab', price:'third', ai:true, anim:true, say:'PixelLab으로 뽑아요', av:'#cba6f7', ro:'으로', src:'PixelLab 이용약관(10월 30일 개정본)', alias:'픽셀랩',
             plans:[{id:'free', name:'무료', usd:0, rights:'ok', small:true}, {id:'apprentice', name:'Pixel Apprentice', usd:12, rights:'ok'}, {id:'artisan', name:'Pixel Artisan', usd:24, rights:'ok'}], def:'apprentice',
             why:'이용약관이 요금제를 나누지 않고 상업적 이용을 허락하고, 저작권도 사용자에게 있다고 적어요. 결과물로 다른 AI를 학습시키는 것만 금지해요.'},
  retro:    {name:'Retro Diffusion', price:'ok', ai:true, say:'Retro Diffusion으로 뽑아요', av:'#f5c2e7', ro:'으로', src:'Retro Diffusion 구매 페이지(itch.io)', alias:'레트로',
             plans:[{id:'full', name:'Aseprite 확장', once:65, rights:'ok'}, {id:'lite', name:'Lite', once:20, rights:'ok'}], def:'full', rightsCheck:true,
             why:'한 번 사서 쓰는 Aseprite 확장이에요. 생성물은 사용자 소유라고 판매자가 안내하지만 판매 페이지 본문에는 적혀 있지 않아요. 애니메이션은 웹 크레딧이 따로 필요해서 동작은 직접 그리는 것으로 계산했어요.'},
  zimage:   {name:'Z-Image', plan:'내 PC에서 실행', price:'ok', rights:'ok', ai:true, gpuMin:8, setupH:3, say:'Z-Image로 뽑아요', av:'#f9e2af', ro:'로', src:'Z-Image 모델 카드(Apache 2.0) · 압축 버전 사양은 2차 출처', why:'Apache 2.0 공개 모델이라 결과물을 상업적으로 쓸 수 있어요. 공식 안내는 16GB 기준이고, 8GB 그래픽카드에서는 압축 버전(FP8)을 써요.', alias:'지이미지|z이미지'},
  midjourney:{name:'Midjourney', price:'ok', ai:true, say:'Midjourney로 뽑아요', av:'#b4befe', ro:'로', src:'Midjourney 요금제·이용약관', alias:'미드저니',
             plans:[{id:'basic', name:'Basic', usd:10, rights:'ok', pub:true}, {id:'standard', name:'Standard', usd:30, rights:'ok', pub:true}, {id:'pro', name:'Pro', usd:60, rights:'ok'}, {id:'mega', name:'Mega', usd:120, rights:'ok'}], def:'basic',
             why:'유료 구독 중에 만든 이미지는 상업적으로 쓸 수 있어요. Basic·Standard로 만든 그림은 기본으로 공개되고, 비공개 모드는 Pro·Mega에만 있어요. 연 매출 100만 달러가 넘는 회사는 Pro 이상이 필요해요.'},
  meshy:    {name:'Meshy', price:'ok', ai:true, say:'Meshy로 만들어요', av:'#94e2d5', ro:'로', src:'Meshy 요금제 안내', alias:'메시',
             plans:[{id:'free', name:'무료', usd:0, rights:'attr'}, {id:'pro', name:'Pro', usd:20, rights:'ok', keep:true}], def:'pro',
             why:'유료 요금제로 만든 모델은 상업적으로 쓸 수 있어요.'},
  eleven:   {name:'ElevenLabs', price:'ok', ai:true, say:'ElevenLabs로 뽑아요', av:'#fab387', ro:'로', src:'ElevenLabs 도움말 · 상업 이용 안내', alias:'일레븐랩스|일레븐',
             plans:[{id:'free', name:'무료', usd:0, rights:'none'}, {id:'starter', name:'Starter', usd:6, rights:'ok', keep:true}, {id:'creator', name:'Creator', usd:22, rights:'ok', keep:true}], def:'starter',
             why:'유료 구독 중에 만든 소리는 구독이 끝나도 상업적으로 쓸 수 있어요. 무료 플랜이나 구독 기간 밖에 만든 소리는 상업 이용이 안 돼요.'},
  suno:     {name:'Suno', price:'ok', ai:true, say:'Suno로 만들어요', av:'#f2cdcd', ro:'로', src:'Suno 이용약관(9월 3일 개정) · 요금제', alias:'수노',
             plans:[{id:'free', name:'무료', usd:0, rights:'none'}, {id:'pro', name:'Pro', usd:10, rights:'ok', dl:20}, {id:'premier', name:'Premier', usd:30, rights:'ok', dl:60}], def:'pro',
             why:'유료 플랜을 쓰는 동안 내려받은 곡만 상업적으로 쓸 수 있어요(9월 3일 약관). 한 달에 Pro는 20곡, Premier는 60곡까지 내려받을 수 있어요.'},
  claude:   {name:'Claude', price:'ok', ai:true, say:'Claude로 짜요', av:'#fab387', ro:'로', src:'Anthropic 소비자 이용약관', alias:'클로드',
             plans:[{id:'free', name:'무료', usd:0, rights:'ok'}, {id:'pro', name:'Pro', usd:20, rights:'ok'}, {id:'max', name:'Max', usd:100, rights:'ok'}, {id:'ultra', name:'Ultra', usd:200, rights:'ok'}], def:'pro',
             why:'생성한 결과물은 상업적으로 쓸 수 있어요.'},
  copilot:  {name:'GitHub Copilot', price:'ok', ai:true, say:'GitHub Copilot으로 짜요', av:'#b4befe', ro:'으로', src:'GitHub Copilot 제품 약관', alias:'코파일럿|깃허브',
             plans:[{id:'free', name:'Free', usd:0, rights:'ok'}, {id:'pro', name:'Pro', usd:10, rights:'ok'}, {id:'proplus', name:'Pro+', usd:39, rights:'ok'}], def:'pro',
             why:'GitHub는 입력과 결과물의 소유권을 주장하지 않아요. 다른 코드의 라이선스를 확인할 책임은 사용자에게 있어요.'},
  unityai:  {name:'Unity AI', price:'ok', ai:true, say:'Unity AI로 뽑아요', av:'#cdd6f4', ro:'로', src:'Unity AI 안내 · 크레딧 안내', alias:'유니티 AI|유니티AI|unity ai', engine:'Unity', beta:true,
             plans:[{id:'personal', name:'Personal', usd:10, rights:'ok'}], def:'personal',
             why:'Unity 6의 생성 도구(스프라이트, 애니메이션, 소리)예요. 판매용 게임에 쓸 수 있지만 권리 침해 검토는 개발자 책임이에요. 만든 에셋에는 AI로 만들었다는 정보가 파일 속성(메타데이터)으로 붙어요. 오픈 베타예요.'},
  buyasset: {name:'유료 에셋', price:'ok', rights:'check', pack:true, label:'유료 에셋 구매', say:'유료 에셋을 사서 써요', av:'#f2cdcd', why:'구매처 라이선스에서 상업적 이용 범위를 확인해 주세요.'}
};
/* 기본 요금제의 값을 도구에 펼쳐 둔다: usd(월 구독료), once(한 번 내는 돈), plan(이름), rights */
Object.keys(TOOLS).forEach(function(t){ var T = TOOLS[t]; if(!T.plans) { T.usd = T.usd || 0; T.once = 0; return; } var p = T.plans.filter(function(x){ return x.id === T.def; })[0]; T.usd = p.usd || 0; T.once = p.once || 0; T.plan = p.name; T.rights = p.rights; });
var MNAME = {direct:'직접 만들기', free:'무료 에셋', ai:'AI로 만들기', buy:'사서 쓰기'};

/* 그림체: cls(도트·2D·3D), ai = AI 결과를 손보는 배율, dh = 이 그림체로 캐릭터 하나를 그리는 평균 시간 */
var STYLES = {
  px16:   {name:'도트 16px', cls:'pixel', ai:0.9, dh:1, en:'16x16 pixel art', ko:'16×16 도트'},
  px32:   {name:'도트 32px', cls:'pixel', ai:1, dh:2, en:'32x32 pixel art', ko:'32×32 도트'},
  px64:   {name:'도트 64px', cls:'pixel', ai:1.2, dh:4, en:'64x64 high-bit pixel art', ko:'64×64 도트'},
  cartoon:{name:'카툰·손그림', cls:'2d', ai:1.3, dh:3, en:'hand-drawn cartoon style', ko:'손그림 카툰'},
  anime:  {name:'애니메이션풍', cls:'2d', ai:1.4, dh:4, en:'anime cel-shaded style', ko:'애니메이션풍 셀 채색'},
  paint:  {name:'반실사·회화풍', cls:'2d', ai:1.6, dh:8, en:'painterly semi-realistic style', ko:'반실사 회화풍'},
  flat:   {name:'플랫 일러스트', cls:'2d', ai:1.1, dh:2, en:'flat vector style', ko:'플랫 일러스트'},
  lowpoly:{name:'로우폴리 3D', cls:'3d', ai:1.2, dh:6, en:'low-poly 3D model', ko:'로우폴리 3D 모델'},
  toon3d: {name:'카툰풍 3D', cls:'3d', ai:1.6, dh:12, en:'stylized 3D model', ko:'카툰풍 3D 모델'}
};
/* 화면 시점: vf = 동작 하나에 그려야 하는 방향 수 배율 */
var VIEWS = {
  side:   {name:'사이드뷰', d:'옆에서 본 화면', vf:1, en:'side view', ko:'옆모습'},
  top:    {name:'탑다운', d:'위에서 내려다본 화면', vf:2, en:'top-down view', ko:'위에서 본 모습'},
  quarter:{name:'쿼터뷰', d:'비스듬히 내려다본 화면', vf:2.5, en:'isometric view', ko:'비스듬히 본 모습'},
  fixed:  {name:'고정 화면', d:'비주얼 노벨·카드처럼 움직이지 않는 화면', vf:0.35, en:'front view', ko:'정면'},
  tps:    {name:'3D 3인칭', d:'캐릭터 뒤를 따라가는 카메라', vf:1, is3d:true, en:'third-person 3D', ko:'3인칭 3D'},
  fps:    {name:'3D 1인칭', d:'캐릭터의 눈으로 보는 카메라', vf:0.6, is3d:true, en:'first-person 3D', ko:'1인칭 3D'}
};
/* 직접 그리는 속도: 고른 그림체로 캐릭터 하나(대기 자세 한 장, 3D는 모델 하나)를 만드는 시간 */
var DRAW = {fast:{name:'30분 안쪽', h:0.5}, mid:{name:'1~2시간', h:1.5}, slow:{name:'반나절', h:4}, day:{name:'하루 이상', h:8}, novice:{name:'그려 본 적이 거의 없어요', h:null, x:2}, avg:{name:'잘 모르겠어요', h:null}};
/* 기준 시간: 고른 답, 모르면 그림체 평균. 거의 그려 보지 않았다면 평균의 두 배로 잡는다 */
function drawH(st){ var d = DRAW[st.draw], base = (STYLES[st.style] || STYLES.px32).dh; return d && d.h != null ? d.h : base * (d && d.x ? d.x : 1); }
var VRAM = {le6:{name:'6GB 이하', gb:6}, g8:{name:'8GB', gb:8}, g12:{name:'12GB', gb:12}, g16:{name:'16GB 이상', gb:16}, unknown:{name:'잘 모르겠어요', gb:null}};
var ENGINES = ['Unity','Godot','Unreal','GameMaker',"Ren'Py",'RPG Maker','아직 몰라요'];
var PLATFORMS = {steam:'스팀', itch:'itch.io', gplay:'구글 플레이', appstore:'앱스토어', web:'웹 브라우저', console:'콘솔', unknown:'아직 몰라요'};
var AIKEYS = {art:'그림', anim:'애니메이션', sound:'소리·음악', code:'코드', text:'글·대사'};

/* 코드 기능: 직접 짤 때 예상 시간(가정값) */
var SYSTEMS = {
  move:['이동·조작',6], jump:['점프·충돌',6], enemy:['적 행동',8], stage:['스테이지 진행',5], save:['저장·불러오기',5], menu:['메뉴·설정',4],
  combat:['공격·피격 판정',8], hp:['체력·피해',4], procgen:['무작위 맵 생성',14], items:['아이템·강화',8], dialog:['대화 표시',5], battle:['전투 규칙',12],
  inventory:['인벤토리',8], quest:['퀘스트',8], board:['판 규칙·판정',8], levels:['레벨 진행',4], branch:['선택지 분기',4], scene:['장면 전환·연출',4],
  economy:['자원·경제',10], time:['시간 흐름',4], build:['건설·배치',10], command:['유닛 명령',8], pathfind:['길찾기',8], enemyai:['적 AI',10], waves:['웨이브',4],
  judge:['박자 판정',8], chart:['노트 채보',6], score:['점수·랭킹',3], bullet:['탄막·충돌',6], interact:['조사·상호작용',5], puzzle:['퍼즐 장치',6],
  deck:['덱 관리',6], cardfx:['카드 효과',12], gather:['채집',5], craft:['제작',6], daynight:['낮과 밤',4], physics:['물리 조작',10], ai:['상대 AI',10],
  multi:['온라인 멀티플레이',30], local:['다국어 지원',6], achieve:['업적',3], tutorial:['튜토리얼',5], touch:['모바일 터치 조작',6]
};
var EXTRA_SYS = ['tutorial','achieve','local','touch','multi'];
/* 장르 틀: 기본 시점, 움직이는 오브젝트 묶음[이름, 개수, 동작 수], 배경 방식과 수, UI 개수, 일러스트 수, 배경음악 곡 수, 코드 기능 */
var GENRE = {
  plat:    {name:'플랫포머', view:'side', obj:[['주인공',1,6],['적',6,3],['보스',1,5],['움직이는 사물',4,1]], scene:['tile',4], ui:30, illus:4, bgm:4, sys:['move','jump','enemy','stage','save','menu']},
  action:  {name:'액션', view:'top', obj:[['주인공',1,7],['적',8,4],['보스',2,6]], scene:['tile',5], ui:40, illus:4, bgm:5, sys:['move','combat','enemy','hp','save','menu']},
  rogue:   {name:'로그라이크', view:'top', obj:[['주인공',1,6],['적',12,4],['보스',3,6]], scene:['tile',6], ui:60, illus:4, bgm:5, sys:['move','combat','enemy','procgen','items','save','menu']},
  rpg:     {name:'RPG', view:'top', obj:[['파티원',4,5],['적',15,3],['NPC',10,2]], scene:['tile',8], ui:80, illus:6, bgm:8, text:20, sys:['move','dialog','battle','inventory','quest','save','menu']},
  puzzle:  {name:'퍼즐', view:'fixed', obj:[['캐릭터',2,2],['움직이는 블록',6,1]], scene:['paint',3], ui:50, illus:4, bgm:3, sys:['board','levels','save','menu']},
  vn:      {name:'비주얼 노벨', view:'fixed', obj:[['등장인물',6,5]], scene:['paint',12], ui:20, illus:8, bgm:6, text:40, sys:['dialog','branch','scene','save','menu']},
  sim:     {name:'시뮬레이션·경영', view:'quarter', obj:[['손님·주민',8,3],['직원',3,3]], scene:['tile',4], ui:80, illus:4, bgm:4, sys:['economy','time','build','save','menu']},
  strategy:{name:'전략·디펜스', view:'top', obj:[['아군 유닛',6,4],['적 유닛',8,3]], scene:['tile',5], ui:60, illus:4, bgm:4, sys:['command','pathfind','enemyai','waves','save','menu']},
  rhythm:  {name:'리듬', view:'fixed', obj:[['캐릭터',2,4]], scene:['paint',4], ui:30, illus:4, bgm:12, sys:['judge','chart','score','menu']},
  shooter: {name:'슈팅', view:'top', obj:[['플레이어 기체',1,3],['적',10,2],['보스',3,4]], scene:['paint',5], ui:30, illus:4, bgm:5, sys:['move','bullet','enemy','stage','score','menu']},
  horror:  {name:'호러·어드벤처', view:'side', obj:[['주인공',1,5],['괴물',3,4],['NPC',4,2]], scene:['paint',10], ui:25, illus:6, bgm:5, text:15, sys:['move','interact','dialog','puzzle','save','menu']},
  card:    {name:'카드·덱빌딩', view:'fixed', obj:[['캐릭터',3,3],['적',10,2]], scene:['paint',3], ui:40, illus:30, bgm:4, sys:['deck','cardfx','battle','enemyai','save','menu']},
  survival:{name:'생존·크래프팅', view:'top', obj:[['주인공',1,7],['동물·적',10,3]], scene:['tile',6], ui:80, illus:4, bgm:5, sys:['move','gather','craft','inventory','daynight','save','menu']},
  sports:  {name:'스포츠·레이싱', view:'side', obj:[['선수·차량',6,4]], scene:['paint',4], ui:30, illus:4, bgm:4, sys:['physics','ai','score','menu']}
};
var SCENE_MODES = {tile:{name:'타일 조합', unit:'세트', hint:'지형 종류마다 1세트'}, paint:{name:'한 장 그림', unit:'장', hint:'장소마다 1장'}, space:{name:'3D 공간', unit:'구역', hint:'맵 구역마다 1개'}};

/* 큰 기능: 켜면 에셋 줄과 개수가 늘어난다 */
var FEATS = {tutorial:['튜토리얼', '안내 UI 8개와 대사 5장면을 더해요'], i18n:['다국어 지원', '번역 줄을 더해요'], mobile:['모바일 출시', '화면 크기별 UI를 30% 더 잡아요'], online:['온라인 멀티플레이', '서버 비용은 사용자 수에 따라 크게 달라서 견적에 넣지 않아요']};
var CUS_KIND = {art:'그림', sound:'소리', text:'글'};
