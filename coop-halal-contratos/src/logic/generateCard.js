import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

// Perfiles de tarjeta soportados. Cada perfil define el tamaño de página de
// referencia (sobre el que se midieron las coordenadas), la fuente, y los
// rectángulos de cada campo. yTop/yBottom miden desde el borde SUPERIOR de la
// página (como en un PDF leído visualmente) y se convierten más abajo al
// sistema de coordenadas de pdf-lib, que mide desde el borde inferior.
const CARD_PROFILES = [
  {
    name: "coophalal",
    refWidth: 2400.75,
    refHeight: 1920.75,
    font: "Helvetica",
    fields: {
      numSocio: { x: 860, yTop: 1136.8, yBottom: 1253.1, fontSize: 100 },
      titular: { x: 680, yTop: 1261.3, yBottom: 1377.6, fontSize: 100 },
    },
  },
  {
    name: "takaful",
    refWidth: 252,
    refHeight: 144,
    font: "TimesRoman",
    fields: {
      titular: { x: 73, yTop: 76.5, yBottom: 88.0, fontSize: 9 },
      numSocio: { x: 73, yTop: 91.5, yBottom: 102.5, fontSize: 9 },
    },
  },
];

// Perfil por defecto si el PDF cargado no coincide con ninguno conocido.
const DEFAULT_PROFILE = CARD_PROFILES[0];

const RATIO_TOLERANCE = 0.15; // ±15%

const TEXT_COLOR = rgb(0.1, 0.1, 0.1);

/**
 * Número de socio/a: usa la columna NumTarjeta si existe en el Excel,
 * y si no, recurre a N_contrato.
 */
function getNumSocio(client) {
  const v = client.NumTarjeta ?? client.N_contrato ?? "";
  return String(v).trim();
}

/**
 * Detecta el perfil de tarjeta a partir del ratio ancho/alto del PDF cargado.
 * Si ninguno coincide dentro de la tolerancia, devuelve el perfil por defecto.
 */
function detectProfile(pageWidth, pageHeight) {
  const ratio = pageWidth / pageHeight;
  for (const profile of CARD_PROFILES) {
    const refRatio = profile.refWidth / profile.refHeight;
    if (Math.abs(ratio - refRatio) / refRatio <= RATIO_TOLERANCE) {
      return profile;
    }
  }
  return DEFAULT_PROFILE;
}

/**
 * Dibuja un campo de texto centrado verticalmente entre yTop y yBottom,
 * comenzando en x. Las coordenadas y el tamaño de fuente se escalan
 * proporcionalmente si la página cargada difiere del tamaño de referencia.
 */
function drawField(page, font, text, field, scaleX, scaleY, pageHeight, label) {
  const textX = field.x * scaleX;
  const fontSize = field.fontSize * scaleY;

  // pdf-lib mide "y" desde abajo: y_pdf_lib = pageHeight - y_desde_arriba.
  const yBottom = pageHeight - field.yBottom * scaleY;
  const yTop = pageHeight - field.yTop * scaleY;
  // drawText posiciona la línea base de la fuente; restamos una fracción del
  // tamaño de fuente para que el texto quede centrado visualmente.
  const textY = (yBottom + yTop) / 2 - fontSize * 0.32;

  console.log(
    `[generateCard] ${label}: y = (${yBottom.toFixed(1)} - ${yTop.toFixed(1)}); ` +
      `texto en (${textX.toFixed(1)}, ${textY.toFixed(1)}); fontSize = ${fontSize.toFixed(1)}pt`
  );

  page.drawText(text, { x: textX, y: textY, size: fontSize, font, color: TEXT_COLOR });
}

/**
 * Carga el PDF de fondo, detecta el perfil de tarjeta, dibuja el Nº de socio/a
 * y el nombre del titular en la primera página, y devuelve el blob PDF.
 */
export async function generateCardPdfBlob(pdfArrayBuffer, client) {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
  const page = pdfDoc.getPages()[0];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  const profile = detectProfile(pageWidth, pageHeight);

  console.log(
    `[generateCard] Página de fondo: ${pageWidth.toFixed(1)} x ${pageHeight.toFixed(1)} pt; ` +
      `perfil = ${profile.name}`
  );

  const scaleX = pageWidth / profile.refWidth;
  const scaleY = pageHeight / profile.refHeight;
  const font = await pdfDoc.embedFont(StandardFonts[profile.font]);

  drawField(page, font, getNumSocio(client), profile.fields.numSocio, scaleX, scaleY, pageHeight, "Nº socio/a");
  drawField(page, font, (client.Nombre ?? "").trim(), profile.fields.titular, scaleX, scaleY, pageHeight, "Titular");

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

// Alias usado por la generación de ZIP, en paralelo a generateDocxBlob.
export const generateCardBlob = generateCardPdfBlob;

/**
 * Genera y descarga la tarjeta en PDF con el nombre indicado.
 */
export async function downloadCardPdf(pdfArrayBuffer, client, fileName) {
  const blob = await generateCardPdfBlob(pdfArrayBuffer, client);
  saveAs(blob, fileName);
}
