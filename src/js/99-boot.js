$('sbScrim').addEventListener('click', closeSb);
window.addEventListener('resize', placeGuide);
$('sb').addEventListener('scroll', placeGuide);
/* 입력할 때마다 저장한다(도우미, 수량, 구매가처럼 화면을 다시 그리지 않는 변경 포함) */
document.addEventListener('input', function(){ persist(); });
document.addEventListener('change', function(){ persist(); });
initialState();
restore();
cloudBoot();
render();
