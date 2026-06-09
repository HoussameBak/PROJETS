import * as XLSX from "xlsx";

/**
 * Lee un File de Excel y devuelve un array de objetos
 * con las columnas como claves. Todas las columnas disponibles
 * quedan accesibles, sin asumir un set fijo.
 */
export function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: false,
        });
        resolve(rows);
      } catch (err) {
        reject(new Error(`Error al leer el Excel: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsArrayBuffer(file);
  });
}
