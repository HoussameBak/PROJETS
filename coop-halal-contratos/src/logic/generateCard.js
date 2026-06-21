import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

// Tamaño de página de referencia (en puntos PDF) sobre el que se midieron
// los rectángulos de los campos.
const REF_PAGE_WIDTH = 2400.75;
const REF_PAGE_HEIGHT = 1920.75;

// Rectángulos de los campos en puntos PDF, medidos sobre la página de
// referencia. startX es donde empieza el texto a rellenar (justo después
// de la etiqueta impresa); yTop1/yTop2 miden desde el borde SUPERIOR de la
// página (como en un PDF leído visualmente) y se convierten más abajo al
// sistema de coordenadas de pdf-lib, que mide desde el borde inferior.
const FIELDS = {
  numSocio: { startX: 860, yTop1: 1136.8, yTop2: 1253.1 },
  titular: { startX: 680, yTop1: 1261.3, yTop2: 1377.6 },
};

const FONT_SIZE_REF = 100; // pt, sobre la página de referencia
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
 * Dibuja un campo de texto centrado verticalmente dentro de su rectángulo,
 * con padding horizontal desde el borde izquierdo. Si la página de fondo
 * tiene un tamaño distinto al de referencia, las coordenadas se escalan
 * proporcionalmente (scaleX/scaleY).
 */
function drawField(page, font, text, field, scaleX, scaleY, pageHeight, label) {
  const textX = field.startX * scaleX;
  const yTop1 = field.yTop1 * scaleY;
  const yTop2 = field.yTop2 * scaleY;
  const fontSize = FONT_SIZE_REF * scaleY;

  // pdf-lib mide "y" desde abajo: y_pdf_lib = pageHeight - y_desde_arriba.
  const yBottom1 = pageHeight - yTop2;
  const yBottom2 = pageHeight - yTop1;
  // drawText posiciona la línea base de la fuente; restamos una fracción
  // del tamaño de fuente para que el texto quede centrado visualmente.
  const textY = (yBottom1 + yBottom2) / 2 - fontSize * 0.32;

  console.log(
    `[generateCard] ${label}: y = (${yBottom1.toFixed(1)} - ${yBottom2.toFixed(1)}); ` +
      `texto en (${textX.toFixed(1)}, ${textY.toFixed(1)}); fontSize = ${fontSize.toFixed(1)}pt`
  );

  page.drawText(text, { x: textX, y: textY, size: fontSize, font, color: TEXT_COLOR });
}

/**
 * Carga el PDF de fondo, dibuja el Nº de socio/a y el nombre del titular
 * en la primera página, y devuelve el blob PDF resultante.
 */
export async function generateCardPdfBlob(pdfArrayBuffer, client) {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
  const page = pdfDoc.getPages()[0];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  console.log(
    `[generateCard] Página de fondo: ${pageWidth.toFixed(1)} x ${pageHeight.toFixed(1)} pt`
  );

  const scaleX = pageWidth / REF_PAGE_WIDTH;
  const scaleY = pageHeight / REF_PAGE_HEIGHT;
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  drawField(page, font, getNumSocio(client), FIELDS.numSocio, scaleX, scaleY, pageHeight, "Nº socio/a");
  drawField(page, font, (client.Nombre ?? "").trim(), FIELDS.titular, scaleX, scaleY, pageHeight, "Titular");

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Genera y descarga la tarjeta en PDF con el nombre indicado.
 */
export async function downloadCardPdf(pdfArrayBuffer, client, fileName) {
  const blob = await generateCardPdfBlob(pdfArrayBuffer, client);
  saveAs(blob, fileName);
}
