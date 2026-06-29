// Persistencia de plantillas de tarjeta en localStorage. A diferencia de la
// plantilla de contrato (una sola), aquí guardamos una LISTA de plantillas
// (p. ej. "CoopHalal" y "Takaful") y cuál fue la última usada.

const STORAGE_KEY = "coophalal_card_templates";
const LAST_USED_KEY = "coophalal_card_last_used";

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Recupera la lista de plantillas guardadas. Devuelve [] si no hay ninguna
 * o si el contenido está corrupto.
 */
export function loadCardTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn(`No se pudieron cargar las plantillas de tarjeta: ${err.message}`);
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn(`No se pudieron guardar las plantillas de tarjeta: ${err.message}`);
  }
}

/**
 * Añade una plantilla a la lista guardada. Si ya existe una con el mismo
 * nombre, la sustituye (conservando su id). Devuelve { list, entry }.
 */
export function addCardTemplate(arrayBuffer, name) {
  const list = loadCardTemplates();
  const dataBase64 = arrayBufferToBase64(arrayBuffer);
  const existing = list.find((t) => t.name === name);
  let entry;
  let next;
  if (existing) {
    entry = { ...existing, dataBase64 };
    next = list.map((t) => (t.id === existing.id ? entry : t));
  } else {
    entry = { id: `${Date.now()}_${name}`, name, dataBase64 };
    next = [...list, entry];
  }
  persist(next);
  return { list: next, entry };
}

/**
 * Elimina una plantilla por id y devuelve la lista resultante.
 */
export function removeCardTemplate(id) {
  const next = loadCardTemplates().filter((t) => t.id !== id);
  persist(next);
  if (getLastUsedId() === id) localStorage.removeItem(LAST_USED_KEY);
  return next;
}

export function getLastUsedId() {
  return localStorage.getItem(LAST_USED_KEY);
}

export function setLastUsedId(id) {
  try {
    localStorage.setItem(LAST_USED_KEY, id);
  } catch {
    // sin efecto si localStorage no está disponible
  }
}
