import PizZip from "pizzip";

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
        const zip = new PizZip(arrayBuffer);

        // Extraer texto plano del XML del documento
        const docXml = zip.files["word/document.xml"]?.asText() ?? "";

        // Los placeholders en docxtemplater a veces quedan divididos
        // entre nodos XML; limpiamos el XML para unirlos antes de buscar
        const cleanXml = docXml
          .replace(/<[^>]+>/g, " ") // quitar etiquetas XML
          .replace(/\s+/g, " ");    // colapsar espacios

        const matches = cleanXml.matchAll(/\{\{([^{}]+?)\}\}/g);
        const placeholders = [...new Set([...matches].map((m) => m[1].trim()))];

        resolve({ arrayBuffer, placeholders });
      } catch (err) {
        reject(new Error(`Error al leer la plantilla: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer la plantilla."));
    reader.readAsArrayBuffer(file);
  });
}
