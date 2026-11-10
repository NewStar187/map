/* ============================== 도트 그림 ============================== */
function px(rows, pal, w){
  var H = rows.length, W = rows[0].length, s = '';
  for(var y = 0; y < H; y++) for(var x = 0; x < W; x++){ var c = rows[y][x]; if(c !== '.' && pal[c]) s += '<rect x="'+x+'" y="'+y+'" width="1.03" height="1.03" fill="'+pal[c]+'"/>'; }
  return '<svg viewBox="0 0 '+W+' '+H+'" width="'+w+'" height="'+Math.round(w * H / W)+'" shape-rendering="crispEdges" aria-hidden="true">'+s+'</svg>';
}
var ICON = {
  sprite:['..XXXX..','.XXXXXX.','.X.XX.X.','.XXXXXX.','..XXXX..','.XXXXXX.','XXXXXXXX','XX.XX.XX'],
  anim:['XXXXXXXX','X.X..X.X','XXXXXXXX','X......X','X......X','XXXXXXXX','X.X..X.X','XXXXXXXX'],
  tile:['XXX.XXXX','X.X.X..X','XXX.XXXX','........','XXXX.XXX','X..X.X.X','XXXX.XXX','........'],
  ui:['.XX..XX.','XXXXXXXX','XXXXXXXX','XXXXXXXX','.XXXXXX.','..XXXX..','...XX...','........'],
  sfx:['...X....','..XX..X.','XXXX.X.X','XXXX.X.X','XXXX.X.X','..XX..X.','...X....','........'],
  bgm:['...XXXXX','...X...X','...X...X','...X...X','.XXX.XXX','XXXXXXXX','.XX..XX.','........'],
  store:['XXXXXXXX','X......X','X.X....X','X...X..X','X..XXX.X','X.XXXXXX','XXXXXXXX','........'],
  code:['..X..X..','.X....X.','X..XX..X','X..XX..X','.X....X.','..X..X..','........','........'],
  doc:['XXXXXX..','X....XX.','X.XX..X.','X.....X.','X.XXX.X.','X.....X.','X.XX..X.','XXXXXXX.'],
  home:['...XX...','..XXXX..','.XXXXXX.','XXXXXXXX','.X....X.','.X.XX.X.','.X.XX.X.','.XXXXXX.'],
  coin:['..XXXX..','.XYYYYX.','XYYXXYYX','XYXYYYYX','XYXYYYYX','XYYXXYYX','.XYYYYX.','..XXXX..'],
  spark:['...X....','...X....','..XXX...','XXXXXXX.','..XXX...','...X....','...X....','........'],
  lock:['..XXXX..','.X....X.','.X....X.','XXXXXXXX','XXX..XXX','XXX..XXX','XXXXXXXX','........']
};
/* 에셋 아이콘은 무채색으로 둔다. 빨강·노랑·초록은 상태 표시에만 쓴다 */
var ICOL = {sprite:'#c6cad3',anim:'#c6cad3',tile:'#c6cad3',ui:'#c6cad3',sfx:'#c6cad3',bgm:'#c6cad3',store:'#c6cad3',code:'#c6cad3',doc:'#a99bff',home:'#c6cad3',spark:'#a99bff',lock:'#c6cad3'};
function icon(id, w, col){ if(id === 'coin') return px(ICON.coin, {X:'#e5a54b', Y:'#f9e2af'}, w || 16); return px(ICON[id], {X:col || ICOL[id]}, w || 18); }
var HERO = ['....AAAA....','...AAAAAA...','...ADDDDA...','...AEAAEA...','....AAAA....','..BBBBBBBB..','.SBBBCCBBBS.','.S.BBBBBB.S.','...BBBBBB...','...BB..BB...','...DD..DD...','..DDD..DDD..'];
var HERO_BAD = ['...AAAA.....','..AAAAAAA...','...ADD.DA...','...AE..EA...','....AAAA....','.BBBBBBBBB..','SBBBCCBBBBS.','S..BBBBB..S.','...BBBBBBB..','..BB...BB...','..DD....DD..','.DDD....DDD.'];
var LEGS2 = ['...BB...BB..','...DD...DD..','..DDD...DDD.'];
var PALS = [{A:'#cdd6f4',D:'#45475a',E:'#89b4fa',B:'#cba6f7',C:'#f9e2af',S:'#f9e2af'},{A:'#bac2de',D:'#585b70',E:'#89b4fa',B:'#b4befe',C:'#fab387',S:'#fab387'},{A:'#cdd6f4',D:'#45475a',E:'#a6e3a1',B:'#f5c2e7',C:'#f9e2af',S:'#f9e2af'}];
var TILE = ['GGGGGGGGGGGG','GgGGGgGGGGgG','DDGDDDDDGDDD','DDDDdDDDDDDD','DdDDDDDDDdDD','DDDDDDdDDDDD','DDdDDDDDDDDD','DDDDDDDDdDDD'];
var TILE_BAD = ['GGGGGG.GGGGG','GgGGGgGGG.gG','DDG.DDDDGDDD','DDDDdDD.DDDD','DdDD.DDDDdDD','DD.DDDdDDDDD','DDdDDDD.DDDD','DDDDD.DDdDDD'];
var TPAL = {G:'#a6e3a1',g:'#94e2d5',D:'#fab387',d:'#45475a'};
function sample(cat, w, bad, v, engine, genre){
  w = w || 60; var pal = PALS[(v || 0) % PALS.length];
  cat = {obj:'sprite', scene:'tile', illus:'store'}[cat] || cat;
  if(cat === 'text') return '<div style="display:flex;flex-direction:column;gap:3px;width:'+Math.round(w * 1.2)+'px">' + [1, 0.8, 0.95, 0.6].map(function(x){ return '<i style="display:block;height:'+Math.max(3, Math.round(w / 12))+'px;width:'+Math.round(x * 100)+'%;border-radius:2px;background:'+(bad ? '#6b7280' : '#c6cad3')+'"></i>'; }).join('') + '</div>';
  if(cat === 'sprite') return px(bad ? HERO_BAD : HERO, pal, w);
  if(cat === 'anim'){ var f2 = HERO.slice(0, 9).concat(LEGS2), s = Math.round(w * 0.42); return '<div style="display:flex;gap:3px">' + px(HERO, pal, s) + px(bad ? HERO_BAD : f2, pal, s) + px(HERO, pal, s) + '</div>'; }
  if(cat === 'tile'){ var t = px(bad ? TILE_BAD : TILE, TPAL, Math.round(w * 0.45)); return '<div style="display:grid;grid-template-columns:auto auto">' + t + t + t + t + '</div>'; }
  if(cat === 'sfx' || cat === 'bgm'){
    var hs = bad ? [9,9,8,9,9,8,9,9,9,8,9,9,9] : (cat === 'bgm' ? [4,6,5,7,9,8,6,7,9,10,8,6,5] : [2,5,9,12,8,6,10,4,7,3,5,2,1]);
    var r = ''; hs.forEach(function(h, i){ r += '<rect x="'+(i * 3)+'" y="'+(12 - h)+'" width="2" height="'+h+'" fill="#89b4fa"/>'; });
    return '<svg viewBox="0 0 39 12" width="'+Math.round(w * 1.3)+'" height="'+Math.round(w * 0.4)+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
  }
  if(cat === 'code'){
    var fs = w >= 90 ? 12 : w >= 60 ? 8.5 : 7, unity = engine !== 'Godot' && engine !== "Ren'Py", K = function(t){ return '<span style="color:#cba6f7">'+t+'</span>'; }, E = function(t){ return '<span style="color:#f38ba8">'+t+'</span>'; };
    genre = genre || (CTX ? ((CTX.view === 'top' || CTX.view === 'quarter') ? 'top' : g0(CTX) === 'puzzle' ? 'puzzle' : 'plat') : 'plat');
    var L = engine === "Ren'Py" ? [K('menu') + ':', '&nbsp;&nbsp;"교실로 간다":', bad ? E('&nbsp;&nbsp;&nbsp;&nbsp;jump clasroom') : '&nbsp;&nbsp;&nbsp;&nbsp;jump classroom']
      : genre === 'top' ? (unity ? [K('void') + ' Update() {', '&nbsp;&nbsp;rb.velocity = input.normalized * speed;', bad ? E('&nbsp;&nbsp;// hitbox not following facing') : '&nbsp;&nbsp;hitbox.transform.right = facing;'] : [K('func') + ' _physics_process(d):', '&nbsp;&nbsp;velocity = Input.get_vector(...) * SPEED', bad ? E('&nbsp;&nbsp;Error: hitbox.rotation') : '&nbsp;&nbsp;move_and_slide()'])
      : genre === 'puzzle' ? (unity ? [K('void') + ' Swap(Cell a, Cell b) {', '&nbsp;&nbsp;if (FindMatches().Count > 0) Clear();', bad ? E('&nbsp;&nbsp;// IndexOutOfRange') : '&nbsp;&nbsp;else SwapBack(a, b);'] : [K('func') + ' swap(a, b):', '&nbsp;&nbsp;if find_matches().size() > 0: clear()', bad ? E('&nbsp;&nbsp;Error: index out of range') : '&nbsp;&nbsp;else: swap_back(a, b)'])
      : unity ? ['<span style="color:#cba6f7">void</span> Update() {','&nbsp;&nbsp;rb.velocity = new Vector2(x * speed, rb.velocity.y);', bad ? '<span style="color:#f38ba8">&nbsp;&nbsp;// NullReferenceException</span>' : '&nbsp;&nbsp;if (jump) rb.AddForce(Vector2.up * force);']
                  : ['<span style="color:#cba6f7">func</span> _physics_process(d):','&nbsp;&nbsp;velocity.x = dir * SPEED', bad ? '<span style="color:#f38ba8">&nbsp;&nbsp;Error: is_on_wall()</span>' : '&nbsp;&nbsp;move_and_slide()'];
    return '<div style="display:flex;flex-direction:column;font:600 '+fs+'px/1.5 JetBrains Mono,monospace;color:#94e2d5;text-align:left;white-space:nowrap;overflow:hidden;max-width:100%;padding:0 6px">' + L.map(function(l){ return '<span>'+l+'</span>'; }).join('') + '</div>';
  }
  if(cat === 'store') return '<div style="display:flex;align-items:flex-end;gap:2px">' + px(bad ? HERO_BAD : HERO, pal, Math.round(w * 0.5)) + px(TILE, TPAL, Math.round(w * 0.5)) + '</div>';
  return icon('ui', Math.round(w * 0.6));
}
function av(t, size){ var T = TOOLS[t] || {name:'?', av:'#a6adc8'}; size = size || 28; return '<span class="tool-av" aria-hidden="true" style="background:'+T.av+';width:'+size+'px;height:'+size+'px">'+esc(T.name.charAt(0))+'</span>'; }
function rowIcon(r, w){ return icon(({obj:'sprite', scene:'tile', illus:'store', text:'doc'})[r.cat] || r.cat, w || 18); }

/* ============================== 화면 공통 아이콘 ============================== */
var UI = {
  play:'<path d="M8 5v14l11-7z"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>', chev:'<path d="M6 9l6 6 6-6"/>', chevUp:'<path d="M6 15l6-6 6 6"/>', left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', send:'<path d="M5 12h12M13 6l6 6-6 6"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.5"/>',
  lock:'<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 016 0v3"/>', flag:'<path d="M6 20V5M6 5h10l-2 3.5 2 3.5H6"/>', plus:'<path d="M12 6v12M6 12h12"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', more:'<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>'
};
function ui(name, size){ size = size || 20; return '<svg class="ui" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+UI[name]+'</svg>'; }
function closeBtn(label){ return '<button type="button" class="iconbtn sm" data-act="close-layer" aria-label="'+(label || '닫기')+'">'+ui('close', 18)+'</button>'; }

