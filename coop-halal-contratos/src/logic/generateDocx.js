import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Rellena la plantilla con los valores resueltos, conservando el formato
 * original (negritas, espaciado, tablas). Devuelve el objeto Docxtemplater.
 */
function renderDoc(arrayBuffer, values) {
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });
  doc.render(values);
  return doc;
}

/**
 * Traduce los errores de docxtemplater a un mensaje legible para el usuario.
 */
function formatDocxError(error) {
  if (error?.properties?.errors?.length) {
    const detail = error.properties.errors
      .map((e) => e.properties?.explanation || e.message)
      .join("\n• ");
    return `Error en la plantilla:\n• ${detail}`;
  }
  return `Error al generar el documento: ${error.message}`;
}

/**
 * Genera el blob .docx relleno sin descargarlo.
 * Útil para construir ZIPs o cualquier uso posterior.
 */
export function generateDocxBlob(arrayBuffer, values) {
  let doc;
  try {
    doc = renderDoc(arrayBuffer, values);
  } catch (error) {
    throw new Error(formatDocxError(error), { cause: error });
  }
  return doc.getZip().generate({ type: "blob", mimeType: DOCX_MIME });
}

/**
 * Genera y descarga el .docx relleno con el nombre indicado.
 */
export function downloadDocx(arrayBuffer, values, fileName) {
  const blob = generateDocxBlob(arrayBuffer, values);
  saveAs(blob, fileName);
}

/**
 * Devuelve una vista previa en texto plano del contrato relleno.
 */
export function getContractPreview(arrayBuffer, values) {
  let doc;
  try {
    doc = renderDoc(arrayBuffer, values);
  } catch (error) {
    throw new Error(formatDocxError(error), { cause: error });
  }
  const xml = doc.getZip().files["word/document.xml"].asText();
  return xmlToText(xml);
}

/**
 * Convierte el XML de Word a texto plano legible, respetando saltos de
 * párrafo, saltos de línea y tabulaciones.
 */
function xmlToText(xml) {
  return xml
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/?>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
