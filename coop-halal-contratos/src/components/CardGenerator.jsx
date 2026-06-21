import { useState } from "react";
import ClientSelector from "./ClientSelector.jsx";
import { downloadCardPdf } from "../logic/generateCard.js";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function CardGenerator({ clients }) {
  const [cardPdfBuffer, setCardPdfBuffer] = useState(null);
  const [cardPdfName, setCardPdfName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(clients.length > 0 ? 0 : -1);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] || null : null;
  const ready = !!cardPdfBuffer && !!selectedClient;

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

  const handleDownload = async () => {
    if (!ready) return;
    setError("");
    setDownloading(true);
    try {
      const fileName = `tarjeta_${safeName(selectedClient.N_contrato)}_${safeName(selectedClient.Nombre)}.pdf`;
      await downloadCardPdf(cardPdfBuffer, selectedClient, fileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

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
          <ClientSelector
            clients={clients}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </section>
      ) : (
        <p className="muted">Carga un Excel de clientes para poder generar tarjetas.</p>
      )}

      {ready && (
        <div className="actions-wrapper no-print">
          <div className="actions">
            <button type="button" onClick={handleDownload} disabled={downloading}>
              {downloading ? "⏳ Generando…" : "🪪 Descargar tarjeta (PDF)"}
            </button>
          </div>
        </div>
      )}

      {!ready && (
        <div className="preview-empty">
          Carga el PDF de fondo de la tarjeta y selecciona un cliente para
          poder descargar la tarjeta.
        </div>
      )}
    </div>
  );
}
