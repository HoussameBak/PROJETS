import { GENERO, PAREJA } from "../constants/generoMap.js";

// Claves que sabemos resolver mediante reglas de negocio (sin columna en Excel):
// las de concordancia de género + tratamiento + documento + segundo titular.
const RULE_KEYS = new Set([
  ...Object.keys(GENERO.hombre),
  ...Object.keys(PAREJA),
  "documento",
  "documento2",
  "tratamiento2",
  "y_segundo",
  "firma2",
  "documento2_firma",
  "y_documento2",
]);

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
  const esPareja = normalize(client.Tipo_cuenta) === "pareja";

  // --- segundo titular (solo aplica si Tipo_cuenta = Pareja) ---
  const genero2Norm = normalize(client.Genero2);
  const tipoDoc2Norm = normalize(client.Tipo_doc2);
  const genero2Rules = GENERO[genero2Norm] || null;
  const tratamiento2 = genero2Rules?.tratamiento ?? "";
  const documento2 = buildDocumento(tipoDoc2Norm, client.Num_documento2);
  const nombre2 = (client.Nombre2 ?? "").toString().trim();
  const segundoTitular = [tratamiento2, nombre2].filter(Boolean).join(" ");

  const values = {};

  for (const ph of placeholders) {
    // a.1) {{documento}} / {{documento2}} dependen de Tipo_doc + Num_documento
    if (ph === "documento") {
      values[ph] = buildDocumento(tipoDocNorm, client.Num_documento);
      continue;
    }
    if (ph === "documento2") {
      values[ph] = documento2;
      continue;
    }

    // a.2) {{tratamiento2}}: misma regla que {{tratamiento}} pero con Genero2
    if (ph === "tratamiento2") {
      values[ph] = tratamiento2;
      continue;
    }

    // a.3) Placeholders del segundo titular: solo se rellenan si es pareja
    if (ph === "y_segundo") {
      values[ph] = esPareja && segundoTitular ? ` y ${segundoTitular}` : "";
      continue;
    }
    if (ph === "firma2") {
      values[ph] = esPareja && segundoTitular ? `\n${segundoTitular}` : "";
      continue;
    }
    if (ph === "documento2_firma") {
      values[ph] = esPareja && documento2 ? `\n${documento2}` : "";
      continue;
    }
    if (ph === "y_documento2") {
      values[ph] = esPareja && documento2 ? ` y ${documento2}` : "";
      continue;
    }

    // a.4) {{provisto}}: "provistos" en pareja, según género en individual
    if (ph === "provisto") {
      values[ph] = esPareja ? "provistos" : generoRules?.provisto ?? "";
      continue;
    }

    // a.5) Concordancia de género en plural para pareja
    if (esPareja && Object.prototype.hasOwnProperty.call(PAREJA, ph)) {
      values[ph] = PAREJA[ph];
      continue;
    }

    // a.6) Concordancia de género (incluye {{tratamiento}})
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
