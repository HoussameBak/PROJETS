// Rectángulos de los campos como porcentaje del ancho/alto de la imagen,
// calculados sobre la imagen de referencia (2400.75 x 1920.75 pt a 300dpi
// = 10004 x 8004 px). Al usar porcentajes en vez de píxeles absolutos, el
// resultado es correcto sea cual sea la resolución de la imagen cargada.
const FIELDS_PCT = {
  numSocio: { x1: 0.356, y1: 0.637, x2: 0.87, y2: 0.701 },
  titular: { x1: 0.331, y1: 0.705, x2: 0.87, y2: 0.769 },
};

// Padding y tamaño de fuente también como porcentaje, relativos al ancho
// de la imagen de referencia (20pt y 70pt en PDF, a 300/72 dpi, sobre 10004px).
const PADDING_PCT = (20 * (300 / 72)) / 10004;
const FONT_SIZE_PCT = (70 * (300 / 72)) / 10004;

const TEXT_COLOR = "rgb(60, 60, 60)";

/**
 * Carga un File de imagen como HTMLImageElement, listo para dibujarse
 * en un <canvas> a su resolución original.
 */
export function loadCardImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen de fondo de la tarjeta."));
    };
    img.src = url;
  });
}

/**
 * Número de socio/a: usa la columna NumTarjeta si existe en el Excel,
 * y si no, recurre a N_contrato.
 */
function getNumSocio(client) {
  const v = client.NumTarjeta ?? client.N_contrato ?? "";
  return String(v).trim();
}

function drawFieldText(ctx, text, rectPct, canvasWidth, canvasHeight, label) {
  const x1 = rectPct.x1 * canvasWidth;
  const y1 = rectPct.y1 * canvasHeight;
  const y2 = rectPct.y2 * canvasHeight;
  const padding = PADDING_PCT * canvasWidth;
  const fontSize = FONT_SIZE_PCT * canvasWidth;
  const textX = x1 + padding;
  const textY = (y1 + y2) / 2;

  console.log(
    `[generateCard] ${label}: rect px = (${x1.toFixed(1)}, ${y1.toFixed(1)}) - ` +
      `(${(rectPct.x2 * canvasWidth).toFixed(1)}, ${y2.toFixed(1)}); ` +
      `texto en (${textX.toFixed(1)}, ${textY.toFixed(1)}); fontSize = ${fontSize.toFixed(1)}px`
  );

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, textX, textY);
}

/**
 * Dibuja la imagen de fondo a su resolución original y superpone el
 * Nº de socio/a y el nombre del titular en sus rectángulos. Devuelve
 * el <canvas> resultante.
 */
export function renderCard(image, client) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  console.log(
    `[generateCard] Imagen cargada: ${image.naturalWidth} x ${image.naturalHeight} px`
  );

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  drawFieldText(ctx, getNumSocio(client), FIELDS_PCT.numSocio, canvas.width, canvas.height, "Nº socio/a");
  drawFieldText(ctx, (client.Nombre ?? "").trim(), FIELDS_PCT.titular, canvas.width, canvas.height, "Titular");

  return canvas;
}

/**
 * Genera el blob PNG de la tarjeta rellena, sin descargarlo.
 */
export function generateCardBlob(image, client) {
  const canvas = renderCard(image, client);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen de la tarjeta."));
    }, "image/png");
  });
}
