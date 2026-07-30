'use client';
import { useEffect, useRef } from 'react';

interface City {
  lat: number;
  lng: number;
  label: string;
  color: string;
  textColor: string;
}

const CITIES: City[] = [
  // Grand Slams — each unique pastel
  { lat: -37.8, lng: 144.9, label: 'AO',      color: 'rgba(96,165,250,0.75)',  textColor: '#1e3a5f' },
  { lat:  48.8, lng:   2.3, label: 'RG',      color: 'rgba(251,146,60,0.75)',  textColor: '#7c2d12' },
  { lat:  51.5, lng:  -0.1, label: 'WIM',     color: 'rgba(110,231,183,0.75)', textColor: '#064e3b' },
  { lat:  40.7, lng: -74.0, label: 'USO',     color: 'rgba(167,139,250,0.75)', textColor: '#3b0764' },
  // WTA 1000 — soft sage/green family
  { lat:  33.6, lng: -117.9, label: 'IW',     color: 'rgba(187,247,208,0.80)', textColor: '#14532d' },
  { lat:  25.8, lng:  -80.2, label: 'MIA',    color: 'rgba(153,246,228,0.80)', textColor: '#134e4a' },
  { lat:  40.4, lng:   -3.7, label: 'MAD',    color: 'rgba(254,215,170,0.80)', textColor: '#7c2d12' },
  { lat:  41.9, lng:   12.5, label: 'ROM',    color: 'rgba(252,165,165,0.80)', textColor: '#7f1d1d' },
  { lat:  45.5, lng:  -73.6, label: 'MTL',    color: 'rgba(196,181,253,0.80)', textColor: '#3b0764' },
  { lat:  39.1, lng:  -84.5, label: 'CIN',    color: 'rgba(147,197,253,0.80)', textColor: '#1e3a5f' },
  { lat:  39.9, lng:  116.4, label: 'BJG',    color: 'rgba(253,186,116,0.80)', textColor: '#7c2d12' },
  { lat:  30.6, lng:  114.3, label: 'WUH',    color: 'rgba(216,180,254,0.80)', textColor: '#3b0764' },
  { lat:  25.3, lng:   51.5, label: 'DOH',    color: 'rgba(134,239,172,0.80)', textColor: '#14532d' },
  { lat:  25.2, lng:   55.3, label: 'DXB',    color: 'rgba(125,211,252,0.80)', textColor: '#0c4a6e' },
];

function latLngTo3D(lat: number, lng: number, rotY: number, rotX: number) {
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  let x = -(Math.sin(phi) * Math.cos(theta));
  let y =   Math.cos(phi);
  let z =   Math.sin(phi) * Math.sin(theta);
  // rotY
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x2 = x * cosY + z * sinY;
  const z2 = -x * sinY + z * cosY;
  x = x2; z = z2;
  // rotX
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z * sinX;
  const z3 = y * sinX + z * cosX;
  return { x, y: y2, z: z3 };
}

export default function GlobeWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotYRef   = useRef(0);
  const rotXRef   = useRef(0.3);
  const velYRef   = useRef(0.003);
  const velXRef   = useRef(0);
  const dragging  = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const r  = Math.min(W, H) * 0.42;

      const rotY = rotYRef.current;
      const rotX = rotXRef.current;

      // === 球体背景 ===
      // 玻璃感底色：极淡，大面积近透明
      const bg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
      bg.addColorStop(0,   'rgba(255,255,255,0.92)');
      bg.addColorStop(0.5, 'rgba(236,250,243,0.78)');
      bg.addColorStop(1,   'rgba(210,240,225,0.65)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // 玻璃边缘：更轻的阴影
      const edge = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
      edge.addColorStop(0,   'rgba(0,0,0,0)');
      edge.addColorStop(0.7, 'rgba(30,70,50,0.04)');
      edge.addColorStop(1,   'rgba(20,50,35,0.14)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = edge;
      ctx.fill();

      // === 经纬线网格 ===
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = 'rgba(45,106,79,0.22)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]);

      // 纬线
      for (let lat = -75; lat <= 75; lat += 15) {
        const phi = (90 - lat) * Math.PI / 180;
        const yFlat = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = latLngTo3D(lat, lng, rotY, rotX);
          if (p.z < 0) { first = true; continue; }
          const sx = cx + p.x * r;
          const sy = cy - p.y * r;
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      // 经线
      for (let lng = -180; lng < 180; lng += 20) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = latLngTo3D(lat, lng, rotY, rotX);
          if (p.z < 0) { first = true; continue; }
          const sx = cx + p.x * r;
          const sy = cy - p.y * r;
          if (first) { ctx.moveTo(sx, sy); first = false; }
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();



      // === 城市标记 ===
      const pts = CITIES.map(city => {
        const p = latLngTo3D(city.lat, city.lng, rotY, rotX);
        return { ...city, sx: cx + p.x * r, sy: cy - p.y * r, z: p.z };
      });

      for (const city of pts) {
        if (city.z < -0.05) continue;
        const alpha = Math.min(1, (city.z + 0.1) / 0.4);
        ctx.globalAlpha = alpha;

        // 圆点
        ctx.beginPath();
        ctx.arc(city.sx, city.sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = city.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 胶囊标签
        const label = city.label;
        ctx.font = `bold 10px -apple-system, "SF Pro Text", sans-serif`;
        const tw = ctx.measureText(label).width;
        const pw = tw + 14, ph = 18;
        const px = city.sx + 10, py = city.sy - ph / 2;

        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, ph / 2);
        ctx.fillStyle = city.color;
        ctx.fill();
        // subtle border
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = city.textColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px + 7, py + ph / 2);
        ctx.textBaseline = 'alphabetic';

        ctx.globalAlpha = 1;
      }

      // 白色缝合虚线（网球弧线感）
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 5]);
      // 缝合线1
      ctx.beginPath();
      let fs1 = true;
      for (let t = 0; t <= 360; t += 2) {
        const lat = 38 * Math.sin(t * Math.PI / 180);
        const lng = t - 180;
        const p = latLngTo3D(lat, lng, rotY, rotX);
        if (p.z < 0) { fs1 = true; continue; }
        const sx = cx + p.x * r, sy = cy - p.y * r;
        if (fs1) { ctx.moveTo(sx, sy); fs1 = false; } else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      // 缝合线2（垂直方向）
      ctx.beginPath();
      let fs2 = true;
      for (let t = 0; t <= 360; t += 2) {
        const lat = 38 * Math.sin(t * Math.PI / 180);
        const lng = t - 180;
        const p = latLngTo3D(lng, lat + 90, rotY, rotX);
        if (p.z < 0) { fs2 = true; continue; }
        const sx = cx + p.x * r, sy = cy - p.y * r;
        if (fs2) { ctx.moveTo(sx, sy); fs2 = false; } else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 玻璃高光：两层，强高光+大范围柔光
      const shine = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.38, 0, cx - r * 0.1, cy - r * 0.1, r * 0.75);
      shine.addColorStop(0,   'rgba(255,255,255,0.55)');
      shine.addColorStop(0.25,'rgba(255,255,255,0.20)');
      shine.addColorStop(0.6, 'rgba(255,255,255,0.04)');
      shine.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();

      // 玻璃轮廓：细白边
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 内圈深色描边（玻璃厚度感）
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,106,79,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth  || 420 : 420;
      const h = parent ? parent.clientHeight || 420 : 420;
      canvas.width  = w;
      canvas.height = h;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();

    const loop = () => {
      if (!dragging.current) {
        rotYRef.current += velYRef.current;
        rotXRef.current += velXRef.current;
        velXRef.current *= 0.97;
        const drift = 0.003;
        velYRef.current = velYRef.current * 0.98 + drift * 0.02;
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging.current = true;
      const pos = 'touches' in e ? e.touches[0] : e;
      lastPos.current = { x: pos.clientX, y: pos.clientY };
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const pos = 'touches' in e ? e.touches[0] : e;
      const dx = pos.clientX - lastPos.current.x;
      const dy = pos.clientY - lastPos.current.y;
      velYRef.current = dx * 0.008;
      velXRef.current = -dy * 0.008;
      rotYRef.current += dx * 0.008;
      rotXRef.current -= dy * 0.008;
      lastPos.current = { x: pos.clientX, y: pos.clientY };
    };
    const onUp = () => { dragging.current = false; };

    canvas.addEventListener('mousedown',  onDown);
    canvas.addEventListener('mousemove',  onMove);
    canvas.addEventListener('mouseup',    onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove',  onMove, { passive: true });
    canvas.addEventListener('touchend',   onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousedown',  onDown);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onUp);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: 'grab' }}
      />
      <p style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, letterSpacing: '0.15em', color: 'rgba(45,106,79,0.4)',
        whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none'
      }}>DRAG TO SPIN</p>
    </div>
  );
}
