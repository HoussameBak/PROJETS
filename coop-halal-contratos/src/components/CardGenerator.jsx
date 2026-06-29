import { useMemo, useRef, useState } from "react";
import ClientSelector from "./ClientSelector.jsx";
import MultiClientSelector from "./MultiClientSelector.jsx";
import { downloadCardPdf, detectCardProfileName } from "../logic/generateCard.js";
import { downloadCardZip } from "../logic/generateZip.js";
import {
  loadCardTemplates,
  addCardTemplate,
  removeCardTemplate,
  getLastUsedId,
  setLastUsedId,
  base64ToArrayBuffer,
} from "../logic/cardTemplates.js";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function CardGenerator({ clients }) {
  const fileInputRef = useRef(null);

  const [templates, setTemplates] = useState(() => loadCardTemplates());
  const [selectedId, setSelectedId] = useState(() => {
    const list = loadCardTemplates();
    const last = getLastUsedId();
    if (last && list.some((t) => t.id === last)) return last;
    return list.length > 0 ? list[0].id : null;
  });

  const [multiMode, setMultiMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(clients.length > 0 ? 0 : -1);
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedId) || null;
  // El ArrayBuffer del PDF de fondo actualmente seleccionado.
  const cardPdfBuffer = useMemo(
    () => (selectedTemplate ? base64ToArrayBuffer(selectedTemplate.dataBase64) : null),
    [selectedTemplate]
  );

  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] || null : null;

  const handleSelectTemplate = (id) => {
    setSelectedId(id);
    setLastUsedId(id);
  };

  const handleAddClick = () => fileInputRef.current?.click();

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permitir recargar el mismo archivo
    if (!file) return;
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const name = await detectCardProfileName(arrayBuffer);
      const { list, entry } = addCardTemplate(arrayBuffer, name);
      setTemplates(list);
      handleSelectTemplate(entry.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveTemplate = (id) => {
    const next = removeCardTemplate(id);
    setTemplates(next);
    if (selectedId === id) {
      setSelectedId(next.length > 0 ? next[0].id : null);
    }
  };

  const handleToggleMode = () => {
    setMultiMode((v) => !v);
    setSelectedSet(new Set());
    setError("");
  };

  const handleToggleClient = (i) =>
    setSelectedSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleSelectAll = () => setSelectedSet(new Set(clients.map((_, i) => i)));
  const handleDeselectAll = () => setSelectedSet(new Set());

  const multiCount = selectedSet.size;
  const showZip = multiMode && multiCount > 1;

  const ready = !!cardPdfBuffer && (multiMode ? multiCount > 0 : !!selectedClient);

  const handleDownload = async () => {
    const client = multiMode ? clients[Math.min(...selectedSet)] : selectedClient;
    if (!cardPdfBuffer || !client) return;
    setError("");
    setDownloading(true);
    try {
      const numSocio = client.NumTarjeta ?? client.N_contrato ?? "";
      const fileName = `tarjeta_${safeName(numSocio)}_${safeName(client.Nombre)}.pdf`;
      await downloadCardPdf(cardPdfBuffer, client, fileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!cardPdfBuffer || selectedSet.size === 0) return;
    setError("");
    setZipLoading(true);
    try {
      const selectedClients = [...selectedSet].sort((a, b) => a - b).map((i) => clients[i]);
      await downloadCardZip(cardPdfBuffer, selectedClients);
    } catch (err) {
      setError(err.message);
    } finally {
      setZipLoading(false);
    }
  };

  const downloadDisabled = !ready || downloading || zipLoading;

  return (
    <div className="card-generator">
      <section className="loaders no-print">
        <div className="uploader">
          <label className="uploader-label">Plantilla de fondo de la tarjeta</label>

          {templates.length > 0 ? (
            <ul className="card-template-list">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className={`card-template-item${t.id === selectedId ? " card-template-item-active" : ""}`}
                >
                  <button
                    type="button"
                    className="card-template-pick"
                    onClick={() => handleSelectTemplate(t.id)}
                  >
                    {t.id === selectedId ? "● " : "○ "}
                    {t.name}
                  </button>
                  <button
                    type="button"
                    className="card-template-del"
                    onClick={() => handleRemoveTemplate(t.id)}
                    aria-label={`Eliminar plantilla ${t.name}`}
                    title="Eliminar plantilla"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No hay plantillas guardadas todavía.</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfChange}
            style={{ display: "none" }}
          />
          <button type="button" className="btn-link" onClick={handleAddClick}>
            + Añadir nueva plantilla
          </button>
        </div>
      </section>

      {error && (
        <pre className="error no-print" role="alert">
          {error}
        </pre>
      )}

      {clients.length > 0 ? (
        <section className="no-print">
          <div className="mode-toggle">
            <label className="toggle-label">
              <input type="checkbox" checked={multiMode} onChange={handleToggleMode} />
              Selección múltiple
            </label>
          </div>

          {multiMode ? (
            <MultiClientSelector
              clients={clients}
              selected={selectedSet}
              onToggle={handleToggleClient}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          ) : (
            <ClientSelector
              clients={clients}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          )}
        </section>
      ) : (
        <p className="muted">Carga un Excel de clientes para poder generar tarjetas.</p>
      )}

      {cardPdfBuffer && (
        <div className="actions-wrapper no-print">
          <div className="actions">
            {showZip ? (
              <button type="button" onClick={handleDownloadZip} disabled={downloadDisabled}>
                {zipLoading
                  ? `⏳ Generando ZIP (${multiCount})…`
                  : `📦 Descargar ZIP (${multiCount} tarjetas)`}
              </button>
            ) : (
              <button type="button" onClick={handleDownload} disabled={downloadDisabled}>
                {downloading ? "⏳ Generando…" : "🪪 Descargar tarjeta (PDF)"}
              </button>
            )}
          </div>
        </div>
      )}

      {!ready && (
        <div className="preview-empty">
          Elige (o añade) una plantilla de fondo y selecciona uno o más clientes
          para poder descargar la(s) tarjeta(s).
        </div>
      )}
    </div>
  );
}
