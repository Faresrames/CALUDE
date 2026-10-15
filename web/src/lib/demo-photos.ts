// Fotos de demonstração: degradês SVG gerados aqui (nenhuma imagem de terceiros).
const palettes = [
  ["#d9c7b0", "#8c6f56"], ["#c9d3cf", "#55706a"], ["#e8d6cf", "#a3685c"], ["#d4cfe0", "#6b628a"],
  ["#efe3c8", "#b08a3c"], ["#cfd8e3", "#4f6a8a"], ["#e2d4d9", "#8a5268"], ["#d7dcc8", "#6c7a45"],
];

export function demoPhoto(i: number, w = 1200, h = 800) {
  const [a, b] = palettes[i % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<circle cx="${w * (0.3 + (i % 3) * 0.2)}" cy="${h * 0.45}" r="${h * 0.22}" fill="#fff" fill-opacity=".18"/>
<text x="50%" y="92%" text-anchor="middle" font-family="sans-serif" font-size="${h * 0.05}" fill="#fff" fill-opacity=".55">PRÉVIA · IMG_${String(4100 + i)}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
