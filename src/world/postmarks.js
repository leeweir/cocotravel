// The same ink drawing appears on the street sign, location badge and passport.
const landmarks = {
  usa: [
    'M24 81h51v4H24zm7-5h37v4H31zm5-11h27v11H36zm5-4h19v4H41z',
    'M40 59l4-16 1-8-6-9-4-12 4-1 5 11 7 5 4 1 5 6 6-3 4 7-8 4-3-3-2 18z',
    'M49 28l-1-6 2-4 5-1 4 4-1 6-4 4z M47 21l-5-4 6 2-1-6 4 5 2-7 1 7 6-5-3 7 6-1-5 4z',
    'M35 15l-3-4h8l-1 4zm-1-5c-3-5 3-7 3-11 4 5 4 9 0 11z',
  ],
  france: [
    'M24 81q14-11 20-32 4-17 5-37h2q1 20 5 37 6 21 20 32h-8q-10-15-18-15T32 81z',
    'M35 61h30v3H35zm6-16h18v3H41zm5-23h8v3h-8zM49 6h2v9h-2z',
    'M23 81h12v3H23zm42 0h12v3H65z',
  ],
  japan: [
    'M12 38q18 2 27-7 6-7 10-15l1-5 2 5q7 16 20 20 8 3 16 2-8 9-36 8-29 0-40-8z',
    'M19 47h62v5H19zm5 5h6v21h-6zm11 0h4v21h-4zm26 0h4v21h-4zm9 0h6v21h-6zM20 73h60v4H20zm-4 6h68v4H16z',
    'M48 51h4v3c9 0 8 15 0 16h-4c-8-2-8-14 0-16z',
  ],
};
export const cityInk = {usa:'#28584e', france:'#38516f', japan:'#89463f'};

export function drawPostmark(ctx, city, x, y, size, ink) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(size/100,size/100);
  ctx.strokeStyle = ctx.fillStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(50,50,47,0,2*Math.PI); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(50,50,42.5,.10*Math.PI,.90*Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(50,50,42.5,1.10*Math.PI,1.90*Math.PI); ctx.stroke();
  ctx.translate(7,10); ctx.scale(.86,.86);
  for (const path of landmarks[city]) ctx.fill(new Path2D(path));
  ctx.restore();
}

export function citySeal(city, ink = cityInk[city]) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  canvas.setAttribute('aria-hidden','true');
  drawPostmark(canvas.getContext('2d'),city,0,0,128,ink);
  return canvas;
}
