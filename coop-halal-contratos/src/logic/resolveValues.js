import { GENERO } from "../constants/generoMap.js";

// Claves que sabemos resolver mediante reglas de negocio (sin columna en Excel):
// las de concordancia de género + tratamiento + documento.
const RULE_KEYS = new Set([...Object.keys(GENERO.hombre), "documento"]);

/**
 * Normaliza un valor para comparar: minúsculas, sin espacios sobrantes,
 * sin tildes. Un valor vacío/nulo se convierte en "".
 */
export function normalize(str) {
  if (str == null) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Construye el texto de {{documento}} según Tipo_doc + Num_documento.
 * Si el tipo no se reconoce, devuelve "".
 */
function buildDocumento(tipoDocNorm, numDocumento) {
  const num = numDocumento == null ? "" : String(numDocumento).trim();
  switch (tipoDocNorm) {
    case "dni":
      return `DNI. Número ${num}`;
    case "nie":
      return `NIE. Número ${num}`;
    case "pasaporte":
      return `Pasaporte Número ${num}`;
    default:
      return "";
  }
}

/**
 * Devuelve los placeholders de la plantilla que NO se pueden resolver
 * de forma estructural: ni son una regla de negocio conocida ni existe
 * una columna con ese nombre en el Excel. Estos saldrán siempre en blanco
 * y deben avisarse al usuario.
 */
export function findUnresolvedPlaceholders(placeholders, columns) {
  const colSet = new Set(columns);
  return placeholders.filter((ph) => !RULE_KEYS.has(ph) && !colSet.has(ph));
}

/**
 * Construye el objeto de valores para un cliente, resolviendo cada
 * placeholder en orden de prioridad:
 *   a) Reglas fijas de negocio (género / tipo de documento)
 *   b) Cruce directo con columnas del Excel
 *   c) Fallback: en blanco + console.warn
 */
export function resolveValues(client, placeholders) {
  const generoNorm = normalize(client.Genero);
  const tipoDocNorm = normalize(client.Tipo_doc);
  const generoRules = GENERO[generoNorm] || null;

  const values = {};

  for (const ph of placeholders) {
    // a.1) {{documento}} depende de Tipo_doc + Num_documento
    if (ph === "documento") {
      values[ph] = buildDocumento(tipoDocNorm, client.Num_documento);
      continue;
    }

    // a.2) Concordancia de género (incluye {{tratamiento}})
    if (generoRules && Object.prototype.hasOwnProperty.call(generoRules, ph)) {
      values[ph] = generoRules[ph];
      continue;
    }

    // b) Cruce directo con una columna del Excel del mismo nombre
    if (Object.prototype.hasOwnProperty.call(client, ph)) {
      const v = client[ph];
      values[ph] = v == null ? "" : v;
      continue;
    }

    // c) Fallback: sin dato disponible
    values[ph] = "";
    console.warn(`Placeholder sin dato disponible: {{${ph}}} → se deja en blanco.`);
  }

  return values;
}
