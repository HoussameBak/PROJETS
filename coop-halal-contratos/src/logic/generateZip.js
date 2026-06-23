import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateDocxBlob } from "./generateDocx.js";
import { generateCardBlob } from "./generateCard.js";
import { resolveValues } from "./resolveValues.js";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

/**
 * Genera un ZIP con un .docx por cada cliente de la lista y lo descarga.
 * @param {ArrayBuffer} templateBuffer  Plantilla .docx original
 * @param {object[]}    clients         Filas del Excel (objetos con todas las columnas)
 * @param {string[]}    placeholders    Lista de placeholders de la plantilla
 */
export async function downloadZip(templateBuffer, clients, placeholders) {
  const zip = new JSZip();
  const errors = [];

  for (const client of clients) {
    const values = resolveValues(client, placeholders);
    const fileName = `${safeName(client.N_contrato)}_${safeName(client.Nombre)}.docx`;
    try {
      const blob = generateDocxBlob(templateBuffer, values);
      zip.file(fileName, blob);
    } catch (err) {
      errors.push(`${fileName}: ${err.message}`);
    }
  }

  if (errors.length) {
    throw new Error(
      `${errors.length} documento(s) con error:\n• ${errors.join("\n• ")}`
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `contratos_${today}.zip`);
}

/**
 * Genera un ZIP con una tarjeta .pdf por cada cliente de la lista y lo descarga.
 * @param {ArrayBuffer} cardPdfBuffer  PDF de fondo de la tarjeta
 * @param {object[]}    clients        Filas del Excel (objetos con todas las columnas)
 */
export async function downloadCardZip(cardPdfBuffer, clients) {
  const zip = new JSZip();
  const errors = [];

  for (const client of clients) {
    const numSocio = client.NumTarjeta ?? client.N_contrato ?? "";
    const fileName = `tarjeta_${safeName(numSocio)}_${safeName(client.Nombre)}.pdf`;
    try {
      const blob = await generateCardBlob(cardPdfBuffer, client);
      zip.file(fileName, blob);
    } catch (err) {
      errors.push(`${fileName}: ${err.message}`);
    }
  }

  if (errors.length) {
    throw new Error(
      `${errors.length} tarjeta(s) con error:\n• ${errors.join("\n• ")}`
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `tarjetas_${today}.zip`);
}
