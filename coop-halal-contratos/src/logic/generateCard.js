// Coordenadas de los campos en puntos PDF (tarjeta a 2400.75 x 1920.75 pt).
const SCALE = 300 / 72; // PDF (72dpi) → imagen (300dpi)

const FIELDS = {
  numSocio: { x1: 855, y1: 1144.7, x2: 2090, y2: 1261.1 },
  titular: { x1: 795, y1: 1269.2, x2: 2090, y2: 1385.6 },
};

const FONT_SIZE_PDF = 70;
const PADDING_PDF = 20;
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

function drawFieldText(ctx, text, rect) {
  const x1 = rect.x1 * SCALE;
  const y1 = rect.y1 * SCALE;
  const y2 = rect.y2 * SCALE;
  const padding = PADDING_PDF * SCALE;
  const fontSize = FONT_SIZE_PDF * SCALE;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x1 + padding, (y1 + y2) / 2);
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

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  drawFieldText(ctx, getNumSocio(client), FIELDS.numSocio);
  drawFieldText(ctx, (client.Nombre ?? "").trim(), FIELDS.titular);

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
