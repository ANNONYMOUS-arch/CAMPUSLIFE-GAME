import * as THREE from 'three';

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function hashNoise(index: number, seed: number): number {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function createGrassLateriteTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#4B7440';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle organic turf & warm Nigerian laterite soil speckles
  for (let i = 0; i < 1800; i++) {
    const x = Math.floor(hashNoise(i, 1.1) * 256);
    const y = Math.floor(hashNoise(i, 2.3) * 256);
    const shade = i % 5 === 0 ? '#5D874C' : i % 7 === 0 ? '#6F6143' : '#3E6536';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, 2, 2);
  }

  return configureTexture(canvas, 28, 28, maxAnisotropy);
}

export function createAsphaltRoadTexture(
  maxAnisotropy: number,
  repeatY = 10
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 512);
  ctx.fillStyle = '#33383C';
  ctx.fillRect(0, 0, 256, 512);

  // Fine isotropic asphalt grain
  for (let i = 0; i < 2400; i++) {
    const x = Math.floor(hashNoise(i, 3.7) * 256);
    const y = Math.floor(hashNoise(i, 5.9) * 512);
    ctx.fillStyle = i % 2 === 0 ? '#3B4146' : '#2C3135';
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp white edge lines
  ctx.fillStyle = '#EAE6DC';
  ctx.fillRect(10, 0, 6, 512);
  ctx.fillRect(240, 0, 6, 512);

  // Warm amber-yellow dashed center line
  ctx.fillStyle = '#E5B43B';
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(125, y, 6, 36);
  }

  return configureTexture(canvas, 1, repeatY, maxAnisotropy);
}

export function createPlainAsphaltTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#33383C';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1600; i++) {
    const x = Math.floor(hashNoise(i, 4.3) * 256);
    const y = Math.floor(hashNoise(i, 6.1) * 256);
    ctx.fillStyle = i % 2 === 0 ? '#3B4146' : '#2C3135';
    ctx.fillRect(x, y, 2, 2);
  }

  return configureTexture(canvas, 4, 4, maxAnisotropy);
}

export function createInterlockingPaverTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#C7BCB0';
  ctx.fillRect(0, 0, 256, 256);

  const brickW = 32;
  const brickH = 16;
  for (let row = 0; row < 16; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 9; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;
      const isTerracotta = (row + col) % 6 === 0;
      ctx.fillStyle = isTerracotta ? '#B87B5E' : (row + col) % 2 === 0 ? '#D3C9BD' : '#BEB3A6';
      ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
    }
  }

  return configureTexture(canvas, 14, 14, maxAnisotropy);
}

export function createCampusSignTexture(
  title: string,
  subtitle: string,
  bgHex = '#0D3B2E',
  accentHex = '#D4A024',
  textHex = '#F5F0E6',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(1024, 256);

  // Background
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 1024, 256);

  // Gold / accent inner trim border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 996, 228);

  // University emblem shield on left
  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.moveTo(76, 62);
  ctx.lineTo(136, 62);
  ctx.lineTo(136, 138);
  ctx.quadraticCurveTo(106, 188, 76, 138);
  ctx.closePath();
  ctx.fill();

  // Neutral open-book academic icon inside shield (no university initials)
  ctx.strokeStyle = bgHex;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(106, 94);
  ctx.lineTo(86, 86);
  ctx.lineTo(86, 126);
  ctx.lineTo(106, 134);
  ctx.lineTo(126, 126);
  ctx.lineTo(126, 86);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(106, 94);
  ctx.lineTo(106, 134);
  ctx.stroke();

  // Main sign title
  ctx.fillStyle = textHex;
  ctx.textAlign = 'left';
  ctx.font = '800 54px Outfit, sans-serif';
  ctx.fillText(title, 172, 108, 816);

  // Subtitle
  ctx.fillStyle = accentHex;
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, 172, 168, 816);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createDirectionSignTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 384);
  ctx.fillStyle = '#123A2E';
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = '#D4A024';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 364);

  ctx.fillStyle = '#D4A024';
  ctx.font = '800 28px Outfit, sans-serif';
  ctx.fillText('CAMPUS DIRECTORY', 34, 56);

  ctx.fillStyle = '#F5F0E6';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('↑  Academic Building & 5 Workshops', 34, 126);
  ctx.fillText('←  3-Storey Admin Block & Clinic', 34, 190);
  ctx.fillText('→  Security Building & University Hall', 34, 254);
  ctx.fillText('↖  Cafeteria, Field & Hostels', 34, 318);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createClockFaceTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  ctx.fillStyle = '#F6F1E6';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#142620';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 114, 0, Math.PI * 2);
  ctx.stroke();

  // Hour ticks
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 84 : 94;
    const r2 = 106;
    ctx.lineWidth = i % 3 === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * r1, 128 + Math.sin(angle) * r1);
    ctx.lineTo(128 + Math.cos(angle) * r2, 128 + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Clock hands (approx 10:10)
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0D3B2E';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(84, 96);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(182, 82);
  ctx.stroke();

  ctx.fillStyle = '#D4A024';
  ctx.beginPath();
  ctx.arc(128, 128, 8, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createTerrazzoTileTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256, 256);
  // Warm cream Nigerian university terrazzo base
  ctx.fillStyle = '#E8E0D1';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle marble & granite aggregate chips
  for (let i = 0; i < 950; i++) {
    const x = Math.floor(hashNoise(i, 4.1) * 252);
    const y = Math.floor(hashNoise(i, 7.3) * 252);
    const size = i % 6 === 0 ? 3 : 2;
    const pick = i % 5;
    ctx.fillStyle =
      pick === 0
        ? '#B7AEA0'
        : pick === 1
          ? '#8C8174'
          : pick === 2
            ? '#D2C5B2'
            : pick === 3
              ? '#5E584F'
              : '#F4EFE4';
    ctx.fillRect(x, y, size, size);
  }

  // Brass/grout 2x2 tile grid lines
  ctx.fillStyle = 'rgba(128, 118, 102, 0.42)';
  ctx.fillRect(0, 0, 256, 3);
  ctx.fillRect(0, 127, 256, 2);
  ctx.fillRect(0, 0, 3, 256);
  ctx.fillRect(127, 0, 2, 256);

  return configureTexture(canvas, 8, 8, maxAnisotropy);
}

export function createInteriorPlaqueTexture(
  title: string,
  subtitle = '',
  bgHex = '#0D3B2E',
  accentHex = '#D4A024',
  textHex = '#F5F0E6',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(512, 160);
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 140);

  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.font = '800 32px Outfit, sans-serif';
  ctx.fillText(title, 256, subtitle ? 76 : 92, 460);

  if (subtitle) {
    ctx.fillStyle = accentHex;
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, 256, 118, 460);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

