/* ============================== 도구 커뮤니티 예시 데이터 ==============================
   작업물(WORKS): 작성자가 매긴 별점(star)과 만족감(sat), 고친 방식(how), 다시 뽑은 횟수(tries), 들어간 돈(cost, 종량제일 때)
   how: as(AI 결과 그대로) · aiedit(AI에게 다시 고치게 함) · human(사람이 직접 손봄) · both(둘 다)
   다른 사용자의 평가는 별점이 아니라 helpful(도움돼요)과 same/diff(나도 비슷했어요/나는 달랐어요)로 받는다.
   에셋별 별점은 이 작업물들의 작성자 별점 평균이고, 도구 총 별점은 TOOL_REV(도구 자체에 남긴 종합 평가)의 평균이다. 둘은 서로 계산하지 않는다. */
var WORKS = [
  {id:'w01', t:'pixellab', cat:'obj', cls:'pixel', engine:'Unity', who:'도트하는곰', when:'3일 전', ago:3, title:'32px 기사 대기·걷기·공격', star:4.5, sat:'over', how:'human', tries:3, prompt:'32x32 pixel art knight, side view, idle, walk, attack', note:'갑옷 무늬가 프레임마다 조금씩 달라서 직접 맞췄어요. 팔레트를 고정하면 덜 흔들려요.', helpful:24, same:9, diff:2,
   comments:[{id:'c1', who:'픽셀초보', when:'2일 전', text:'팔레트 고정은 어디서 해요?', replies:[{id:'c1r1', who:'도트하는곰', when:'2일 전', text:'생성 옵션의 색상 제한에서 8색으로 잡았어요.'}]}, {id:'c2', who:'인디하는중', when:'1일 전', text:'공격 모션이 생각보다 자연스럽네요.', replies:[]}]},
  {id:'w02', t:'pixellab', cat:'obj', cls:'pixel', engine:'Godot', who:'슬라임공장', when:'1주 전', ago:7, title:'슬라임 4종 튀는 동작', star:4.5, sat:'over', how:'as', tries:2, prompt:'32x32 pixel slime, bounce animation, 6 frames', note:'단순한 몬스터는 거의 그대로 썼어요.', helpful:18, same:7, diff:1, comments:[]},
  {id:'w03', t:'pixellab', cat:'obj', cls:'pixel', engine:'Unity', who:'밤샘개발', when:'2주 전', ago:14, title:'탑다운 NPC 8방향', star:3.5, sat:'meet', how:'both', tries:6, prompt:'top-down villager, 8 directions, walk cycle', note:'8방향은 방향마다 얼굴이 달라져서 다시 뽑고 직접도 손봤어요.', helpful:15, same:4, diff:3,
   comments:[{id:'c3', who:'쿼터뷰장인', when:'1주 전', text:'방향 맞추는 데 얼마나 걸렸어요?', replies:[{id:'c3r1', who:'밤샘개발', when:'1주 전', text:'한 캐릭터에 저녁 한 번 정도요.'}, {id:'c3r2', who:'쿼터뷰장인', when:'6일 전', text:'참고할게요, 고마워요.'}]}]},
  {id:'w04', t:'pixellab', cat:'obj', cls:'pixel', engine:'Unity', who:'점프킹', when:'3주 전', ago:21, title:'보스 64px 공격 패턴', star:4.0, sat:'meet', how:'aiedit', tries:5, prompt:'64x64 pixel boss, heavy slam attack', note:'큰 캐릭터는 몇 번 다시 고치게 하니 괜찮아졌어요.', helpful:11, same:5, diff:1, comments:[]},
  {id:'w05', t:'pixellab', cat:'scene', cls:'pixel', engine:'Godot', who:'타일러', when:'5일 전', ago:5, title:'숲 타일셋 한 세트', star:3.5, sat:'meet', how:'human', tries:4, prompt:'forest tileset, 16x16, seamless', note:'이음새가 안 맞는 타일은 직접 고쳤어요.', helpful:9, same:3, diff:2, comments:[]},
  {id:'w06', t:'pixellab', cat:'scene', cls:'pixel', engine:'Unity', who:'던전메이커', when:'2주 전', ago:14, title:'던전 벽·바닥 타일', star:3.5, sat:'under', how:'both', tries:7, prompt:'dungeon wall and floor tiles, 32x32', note:'바닥은 좋았는데 벽 모서리는 결국 손으로 그렸어요.', helpful:7, same:2, diff:2, comments:[]},
  {id:'w07', t:'pixellab', cat:'ui', cls:'pixel', engine:'Unity', who:'버튼장인', when:'4일 전', ago:4, title:'아이템 아이콘 30개', star:4.0, sat:'over', how:'as', tries:2, prompt:'pixel item icons, potion, sword, shield, 16x16', note:'아이콘은 거의 그대로 쓸 만했어요.', helpful:20, same:8, diff:1, comments:[]},
  {id:'w08', t:'retro', cat:'obj', cls:'pixel', engine:'Godot', who:'레트로덕후', when:'1주 전', ago:7, title:'Aseprite 안에서 바로 뽑은 기사', star:4.0, sat:'meet', how:'human', tries:3, prompt:'knight, 32x32, side view', note:'Aseprite에서 바로 고칠 수 있어서 편했어요. 동작은 직접 그렸어요.', helpful:12, same:5, diff:1, comments:[]},
  {id:'w09', t:'retro', cat:'obj', cls:'pixel', engine:'Unity', who:'도트연습생', when:'3주 전', ago:21, title:'몬스터 정지 그림 6종', star:3.5, sat:'meet', how:'human', tries:4, prompt:'pixel monster sprites, idle pose', note:'정지 그림은 좋았는데 동작은 따로 그려야 해요.', helpful:6, same:2, diff:1, comments:[]},
  {id:'w10', t:'retro', cat:'scene', cls:'pixel', engine:'Godot', who:'타일러', when:'1주 전', ago:7, title:'마을 타일셋', star:4.5, sat:'over', how:'as', tries:2, prompt:'village tileset, seamless, 16x16', note:'타일 이음새가 PixelLab보다 잘 맞았어요.', helpful:14, same:6, diff:0, comments:[{id:'c4', who:'던전메이커', when:'6일 전', text:'던전 타일도 잘 되나요?', replies:[{id:'c4r1', who:'타일러', when:'6일 전', text:'벽 모서리는 비슷하게 손이 갔어요.'}]}]},
  {id:'w11', t:'zimage', cat:'obj', cls:'pixel', engine:'Unity', who:'로컬파', when:'2주 전', ago:14, title:'내 PC로 뽑은 도트 캐릭터', star:3.0, sat:'under', how:'both', tries:9, prompt:'pixel art character, 32x32, side view', note:'도트 크기가 일정하지 않아서 정리하는 데 손이 많이 갔어요.', helpful:8, same:4, diff:1, comments:[]},
  {id:'w12', t:'zimage', cat:'illus', cls:'2d', engine:'', who:'로컬파', when:'1주 전', ago:7, title:'컷신 일러스트 4장', star:4.0, sat:'over', how:'aiedit', tries:6, prompt:'fantasy forest at dusk, painterly', note:'일러스트는 무료치고 괜찮아요. 처음 설치가 오래 걸려요.', helpful:10, same:4, diff:1, comments:[]},
  {id:'w13', t:'zimage', cat:'scene', cls:'pixel', engine:'Godot', who:'무료만씀', when:'3주 전', ago:21, title:'배경 한 장', star:3.0, sat:'meet', how:'human', tries:5, prompt:'pixel art background, mountains', note:'도트 느낌을 살리려면 축소 후 다듬어야 해요.', helpful:4, same:2, diff:1, comments:[]},
  {id:'w14', t:'zimage', cat:'ui', cls:'any', engine:'', who:'무료만씀', when:'2주 전', ago:14, title:'메뉴 버튼 세트', star:3.5, sat:'meet', how:'human', tries:4, prompt:'game menu buttons, flat', note:'글자는 직접 넣었어요.', helpful:3, same:1, diff:0, comments:[]},
  {id:'w15', t:'unityai', cat:'obj', cls:'pixel', engine:'Unity', who:'유니티러', when:'4일 전', ago:4, title:'에디터 안에서 만든 스프라이트', star:3.5, sat:'meet', how:'aiedit', tries:5, prompt:'pixel art enemy sprite', cost:{krw:2400, note:'크레딧 약 40개'}, note:'에디터를 벗어나지 않아서 편했지만 크레딧이 금방 줄어요.', helpful:9, same:3, diff:2, comments:[]},
  {id:'w16', t:'unityai', cat:'sfx', cls:'any', engine:'Unity', who:'유니티러', when:'1주 전', ago:7, title:'점프·착지 효과음', star:3.0, sat:'under', how:'aiedit', tries:6, prompt:'retro jump sound', cost:{krw:900, note:'크레딧 약 15개'}, note:'도트 게임용 소리는 jsfxr이 더 잘 맞았어요.', helpful:5, same:2, diff:1, comments:[]},
  {id:'w17', t:'midjourney', cat:'illus', cls:'2d', engine:'', who:'일러하는개발자', when:'2일 전', ago:2, title:'스토어 대표 이미지', star:5.0, sat:'over', how:'human', tries:4, prompt:'game key art, hero standing on cliff, dramatic light', note:'로고 자리만 비워서 뽑고 글자는 직접 넣었어요. Basic이라 만든 그림이 공개돼요.', helpful:31, same:12, diff:1,
   comments:[{id:'c5', who:'스토어준비중', when:'1일 전', text:'캡슐 크기별로 다시 뽑았어요?', replies:[{id:'c5r1', who:'일러하는개발자', when:'1일 전', text:'큰 것 하나 뽑고 잘라서 썼어요.'}]}]},
  {id:'w18', t:'midjourney', cat:'illus', cls:'2d', engine:'', who:'카드게임러', when:'1주 전', ago:7, title:'카드 그림 12장', star:4.5, sat:'over', how:'aiedit', tries:3, prompt:'tarot style card illustration, flat colors', note:'같은 그림체로 맞추는 게 일이었지만 결과는 만족해요.', helpful:17, same:6, diff:2, comments:[]},
  {id:'w19', t:'midjourney', cat:'obj', cls:'2d', engine:'Unity', who:'카툰러', when:'2주 전', ago:14, title:'카툰 캐릭터 정면 그림', star:3.5, sat:'meet', how:'human', tries:5, prompt:'cartoon character sheet, front view', note:'동작용으로 쪼개려면 다시 그려야 해요.', helpful:6, same:2, diff:1, comments:[]},
  {id:'w20', t:'midjourney', cat:'ui', cls:'2d', engine:'', who:'카툰러', when:'3주 전', ago:21, title:'카툰 UI 프레임', star:3.5, sat:'meet', how:'human', tries:4, prompt:'cartoon game UI frame', note:'틀은 좋았고 9분할은 직접 나눴어요.', helpful:4, same:1, diff:1, comments:[]},
  {id:'w21', t:'meshy', cat:'obj', cls:'3d', engine:'Unity', who:'로우폴리', when:'5일 전', ago:5, title:'로우폴리 몬스터 3종', star:4.0, sat:'meet', how:'human', tries:4, prompt:'low poly goblin, game ready', note:'면 수 정리를 Blender에서 했어요. 동작은 Mixamo로 붙였어요.', helpful:13, same:5, diff:1, comments:[]},
  {id:'w22', t:'meshy', cat:'obj', cls:'3d', engine:'Godot', who:'3D입문', when:'2주 전', ago:14, title:'소품 10개', star:3.5, sat:'meet', how:'as', tries:2, prompt:'low poly barrel, crate, lantern', note:'소품은 그대로 쓸 만했어요.', helpful:8, same:3, diff:0, comments:[]},
  {id:'w23', t:'eleven', cat:'sfx', cls:'any', engine:'', who:'사운드러', when:'3일 전', ago:3, title:'타격음 20개', star:4.5, sat:'over', how:'as', tries:2, prompt:'sword hit, short, punchy', note:'설명만 잘 쓰면 거의 그대로 써요.', helpful:22, same:8, diff:1, comments:[{id:'c6', who:'jsfxr파', when:'2일 전', text:'도트 게임에도 어울려요?', replies:[{id:'c6r1', who:'사운드러', when:'2일 전', text:'8비트 느낌은 jsfxr이 더 나아요. 타격음은 이쪽이 좋았어요.'}]}]},
  {id:'w24', t:'eleven', cat:'sfx', cls:'any', engine:'', who:'호러개발', when:'2주 전', ago:14, title:'공포 분위기 효과음', star:4.0, sat:'meet', how:'aiedit', tries:4, prompt:'creaking door, distant footsteps', note:'길이를 맞추려고 몇 번 다시 뽑았어요.', helpful:9, same:3, diff:1, comments:[]},
  {id:'w25', t:'jsfxr', cat:'sfx', cls:'any', engine:'', who:'jsfxr파', when:'1주 전', ago:7, title:'점프·코인·피격 8비트 소리', star:4.0, sat:'over', how:'human', tries:1, note:'무료고 도트 게임에 잘 맞아요. 만드는 건 직접 해야 해요.', helpful:14, same:6, diff:0, comments:[]},
  {id:'w26', t:'cc0sound', cat:'sfx', cls:'any', engine:'', who:'무료만씀', when:'2주 전', ago:14, title:'무료 팩으로 채운 효과음', star:3.5, sat:'meet', how:'human', tries:1, note:'팩마다 라이선스가 달라서 정리하는 게 일이었어요.', helpful:5, same:2, diff:1, comments:[]},
  {id:'w27', t:'suno', cat:'bgm', cls:'any', engine:'', who:'루프장인', when:'4일 전', ago:4, title:'스테이지 음악 다섯 곡', star:4.5, sat:'over', how:'human', tries:3, prompt:'chiptune stage theme, loopable, no vocals', note:'반복 구간을 자르는 데 시간이 더 걸렸어요. 유료 플랜일 때 내려받았어요.', helpful:26, same:10, diff:1, comments:[{id:'c7', who:'음악몰라요', when:'3일 전', text:'루프는 어떤 프로그램으로 잘랐어요?', replies:[{id:'c7r1', who:'루프장인', when:'3일 전', text:'무료 오디오 편집기로 잘랐어요.'}]}]},
  {id:'w28', t:'suno', cat:'bgm', cls:'any', engine:'', who:'퍼즐러', when:'1주 전', ago:7, title:'메뉴 음악', star:4.5, sat:'over', how:'as', tries:2, prompt:'calm puzzle menu music, lo-fi', note:'그대로 썼어요.', helpful:12, same:5, diff:0, comments:[]},
  {id:'w29', t:'suno', cat:'bgm', cls:'any', engine:'', who:'RPG꿈나무', when:'3주 전', ago:21, title:'보스전 음악', star:4.0, sat:'meet', how:'aiedit', tries:6, prompt:'epic boss battle, orchestral, no vocals', note:'가사 없는 곡으로 지정하는 걸 잊으면 안 돼요.', helpful:10, same:4, diff:1, comments:[]},
  {id:'w30', t:'cc0music', cat:'bgm', cls:'any', engine:'', who:'무료만씀', when:'3주 전', ago:21, title:'무료 음원으로 채운 배경음악', star:3.5, sat:'meet', how:'as', tries:1, note:'분위기에 맞는 곡 찾는 게 오래 걸려요.', helpful:6, same:2, diff:1, comments:[]},
  {id:'w31', t:'claude', cat:'code', cls:'any', engine:'Unity', who:'점프킹', when:'2일 전', ago:2, title:'플랫포머 이동과 점프', star:4.5, sat:'over', how:'human', tries:3, note:'코요테 타임까지 넣어 달라고 하니 바로 됐어요. 구조는 제가 손봤어요.', helpful:19, same:7, diff:1, comments:[]},
  {id:'w32', t:'claude', cat:'code', cls:'any', engine:'Godot', who:'퍼즐러', when:'1주 전', ago:7, title:'퍼즐 판정 로직', star:4.5, sat:'over', how:'aiedit', tries:4, note:'테스트 케이스를 같이 달라고 하면 고치기 쉬워요.', helpful:11, same:4, diff:0, comments:[]},
  {id:'w33', t:'claude', cat:'text', cls:'any', engine:'', who:'비주얼노벨러', when:'2주 전', ago:14, title:'NPC 대사 초안', star:4.0, sat:'meet', how:'human', tries:3, note:'말투는 직접 다듬어야 해요.', helpful:8, same:3, diff:1, comments:[]},
  {id:'w34', t:'copilot', cat:'code', cls:'any', engine:'Unity', who:'유니티러', when:'2주 전', ago:14, title:'인벤토리 저장', star:4.0, sat:'meet', how:'human', tries:2, note:'자동 완성 위주로 썼어요.', helpful:7, same:3, diff:1, comments:[]},
  {id:'w35', t:'kenney', cat:'ui', cls:'pixel', engine:'', who:'프로토타이퍼', when:'1주 전', ago:7, title:'프로토타입용 UI', star:4.0, sat:'over', how:'as', tries:1, note:'프로토타입엔 충분해요. 정식 그림체와는 달라요.', helpful:9, same:4, diff:1, comments:[]},
  {id:'w36', t:'midjourney', cat:'scene', cls:'2d', engine:'', who:'일러하는개발자', when:'1주 전', ago:7, title:'카툰 배경 3장', star:4.0, sat:'meet', how:'human', tries:4, prompt:'cartoon forest background, side scroller', note:'층을 나누려면 직접 잘라야 해요.', helpful:7, same:2, diff:1, comments:[]}
];
/* 도구 자체에 남긴 종합 평가(사용자당 하나): 도구 총 별점의 근거 */
var TOOL_REV = {
  pixellab:[{who:'도트하는곰', star:4.5, text:'도트 캐릭터 동작은 이만한 게 없어요.'}, {who:'던전메이커', star:3.5, text:'타일은 아쉬워요.'}, {who:'슬라임공장', star:4.5, text:'가격 대비 좋아요.'}, {who:'밤샘개발', star:4.0, text:'8방향은 손이 가요.'}],
  retro:[{who:'레트로덕후', star:4.5, text:'Aseprite 쓰는 사람에게 딱이에요.'}, {who:'도트연습생', star:3.5, text:'동작은 따로 그려야 해요.'}],
  zimage:[{who:'로컬파', star:3.5, text:'무료지만 설치와 사양이 걸려요.'}, {who:'무료만씀', star:3.0, text:'도트엔 잘 안 맞아요.'}],
  unityai:[{who:'유니티러', star:3.5, text:'에디터 안에서 끝나는 게 장점, 크레딧은 아쉬워요.'}],
  midjourney:[{who:'일러하는개발자', star:5.0, text:'일러스트 품질은 최고예요.'}, {who:'카툰러', star:3.5, text:'게임 에셋으로 쪼개기는 어려워요.'}, {who:'카드게임러', star:4.5, text:'그림체 맞추는 법만 익히면 좋아요.'}],
  meshy:[{who:'로우폴리', star:4.0, text:'초안 모델로 좋아요.'}, {who:'3D입문', star:3.5, text:'소품은 그대로 써요.'}],
  eleven:[{who:'사운드러', star:4.5, text:'효과음 품질이 좋아요.'}, {who:'호러개발', star:4.0, text:'길이 조절이 아쉬워요.'}],
  suno:[{who:'루프장인', star:4.5, text:'게임 음악 초안으로 충분해요.'}, {who:'퍼즐러', star:4.5, text:'메뉴 음악은 그대로 썼어요.'}, {who:'RPG꿈나무', star:4.0, text:'내려받기 한도를 챙기세요.'}],
  claude:[{who:'점프킹', star:4.5, text:'게임 코드 초안은 빨라요.'}, {who:'퍼즐러', star:4.5, text:'테스트까지 같이 짜 줘요.'}, {who:'비주얼노벨러', star:4.0, text:'대사 초안에도 써요.'}],
  copilot:[{who:'유니티러', star:4.0, text:'자동 완성이 편해요.'}],
  jsfxr:[{who:'jsfxr파', star:4.5, text:'8비트 소리는 이거면 돼요.'}],
  kenney:[{who:'프로토타이퍼', star:4.5, text:'프로토타입엔 최고예요.'}],
  aseprite:[{who:'도트하는곰', star:5.0, text:'도트 작업의 기본 도구예요.'}, {who:'레트로덕후', star:4.5, text:'확장 기능이 많아요.'}]
};
/* 결제 방식: 도구 카드에 보이는 짧은 설명 */
var BILLING = {pixellab:'구독', retro:'한 번 구매', zimage:'무료 · 내 PC', unityai:'구독 + 크레딧(종량제)', midjourney:'구독', meshy:'구독', eleven:'구독', suno:'구독', claude:'구독', copilot:'구독', jsfxr:'무료', kenney:'무료', aseprite:'한 번 구매'};
var METERED = {unityai:true};
var SAT = {over:'기대 이상', meet:'기대만큼', under:'기대 이하'};
var HOWW = {as:'AI 결과 그대로', aiedit:'AI에게 다시 고치게 함', human:'사람이 직접 손봄', both:'AI 수정 + 직접 손봄'};

