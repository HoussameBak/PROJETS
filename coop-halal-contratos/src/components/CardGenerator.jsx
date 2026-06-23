import { useState } from "react";
import ClientSelector from "./ClientSelector.jsx";
import MultiClientSelector from "./MultiClientSelector.jsx";
import { downloadCardPdf } from "../logic/generateCard.js";
import { downloadCardZip } from "../logic/generateZip.js";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function CardGenerator({ clients }) {
  const [cardPdfBuffer, setCardPdfBuffer] = useState(null);
  const [cardPdfName, setCardPdfName] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(clients.length > 0 ? 0 : -1);
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] || null : null;

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      setCardPdfBuffer(arrayBuffer);
      setCardPdfName(file.name);
    } catch (err) {
      setCardPdfBuffer(null);
      setCardPdfName("");
      setError(err.message);
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
          <label className="uploader-label">PDF de fondo de la tarjeta (.pdf)</label>
          <input type="file" accept=".pdf" onChange={handlePdfChange} />
          {cardPdfName && <span className="file-ok">✓ {cardPdfName}</span>}
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
          Carga el PDF de fondo de la tarjeta y selecciona uno o más clientes
          para poder descargar la(s) tarjeta(s).
        </div>
      )}
    </div>
  );
}
