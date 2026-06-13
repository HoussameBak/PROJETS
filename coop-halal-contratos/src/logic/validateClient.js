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

  if (normalize(client.Tipo_cuenta) === "pareja") {
    if (!normalize(client.Nombre2)) {
      errors.push("Nombre del segundo titular vacío");
    }
    if (!GENEROS_VALIDOS.has(normalize(client.Genero2))) {
      errors.push("Género del segundo titular no reconocido");
    }
    if (!TIPOS_DOC_VALIDOS.has(normalize(client.Tipo_doc2))) {
      errors.push("Tipo de documento del segundo titular no reconocido");
    }
    if (!normalize(client.Num_documento2)) {
      errors.push("Número de documento del segundo titular vacío");
    }
  }

  return errors;
}
