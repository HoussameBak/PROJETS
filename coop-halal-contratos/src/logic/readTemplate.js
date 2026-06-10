import PizZip from "pizzip";

const STORAGE_KEY = "coophalal_template";
const STORAGE_NAME_KEY = "coophalal_template_name";

/**
 * Extrae la lista de placeholders {{...}} únicos de un .docx (ArrayBuffer).
 */
export function extractPlaceholders(arrayBuffer) {
  const zip = new PizZip(arrayBuffer);

  // Extraer texto plano del XML del documento
  const docXml = zip.files["word/document.xml"]?.asText() ?? "";

  // Los placeholders en docxtemplater a veces quedan divididos
  // entre nodos XML; limpiamos el XML para unirlos antes de buscar
  const cleanXml = docXml
    .replace(/<[^>]+>/g, " ") // quitar etiquetas XML
    .replace(/\s+/g, " ");    // colapsar espacios

  const matches = cleanXml.matchAll(/\{\{([^{}]+?)\}\}/g);
  return [...new Set([...matches].map((m) => m[1].trim()))];
}

/**
 * Lee un File .docx y extrae la lista de placeholders {{...}} únicos.
 * Devuelve { arrayBuffer, placeholders }.
 */
export function readTemplate(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const placeholders = extractPlaceholders(arrayBuffer);
        resolve({ arrayBuffer, placeholders });
      } catch (err) {
        reject(new Error(`Error al leer la plantilla: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer la plantilla."));
    reader.readAsArrayBuffer(file);
  });
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Guarda la plantilla cargada en localStorage para recuperarla en la
 * siguiente sesión. Si falla (p. ej. cuota excedida), avisa por consola
 * sin interrumpir la app.
 */
export function saveTemplateToCache(arrayBuffer, fileName) {
  try {
    localStorage.setItem(STORAGE_KEY, arrayBufferToBase64(arrayBuffer));
    localStorage.setItem(STORAGE_NAME_KEY, fileName);
  } catch (err) {
    console.warn(`No se pudo guardar la plantilla en caché: ${err.message}`);
  }
}

/**
 * Recupera la plantilla guardada en localStorage, si existe.
 * Devuelve { arrayBuffer, placeholders, fileName } o null.
 */
export function loadTemplateFromCache() {
  const base64 = localStorage.getItem(STORAGE_KEY);
  const fileName = localStorage.getItem(STORAGE_NAME_KEY);
  if (!base64 || !fileName) return null;

  try {
    const arrayBuffer = base64ToArrayBuffer(base64);
    const placeholders = extractPlaceholders(arrayBuffer);
    return { arrayBuffer, placeholders, fileName };
  } catch (err) {
    console.warn(`No se pudo cargar la plantilla guardada: ${err.message}`);
    return null;
  }
}

/**
 * Borra la plantilla guardada en localStorage.
 */
export function clearTemplateCache() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_NAME_KEY);
}
