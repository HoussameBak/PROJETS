import { normalize } from "./resolveValues.js";

const GENEROS_VALIDOS = new Set(["hombre", "mujer"]);
const TIPOS_DOC_VALIDOS = new Set(["dni", "nie", "pasaporte"]);

/**
 * Devuelve la lista de errores de validación de un cliente.
 * Un cliente sin errores generará un contrato sin campos en blanco
 * relacionados con estos datos.
 */
export function validateClient(client) {
  const errors = [];

  const genero = client.Genero;
  if (!GENEROS_VALIDOS.has(normalize(genero))) {
    errors.push(`Género no reconocido: '${genero ?? ""}'`);
  }

  const tipoDoc = client.Tipo_doc;
  if (!TIPOS_DOC_VALIDOS.has(normalize(tipoDoc))) {
    errors.push(`Tipo de documento no reconocido: '${tipoDoc ?? ""}'`);
  }

  if (!normalize(client.Nombre)) {
    errors.push("Nombre vacío");
  }

  if (!normalize(client.Num_documento)) {
    errors.push("Número de documento vacío");
  }

  if (!normalize(client.Fecha)) {
    errors.push("Fecha vacía");
  }

  return errors;
}
