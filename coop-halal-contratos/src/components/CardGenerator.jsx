import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import ClientSelector from "./ClientSelector.jsx";
import { loadCardImage, renderCard, generateCardBlob } from "../logic/generateCard.js";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function CardGenerator({ clients }) {
  const [cardImage, setCardImage] = useState(null);
  const [cardImageName, setCardImageName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(clients.length > 0 ? 0 : -1);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] || null : null;
  const ready = !!cardImage && !!selectedClient;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const img = await loadCardImage(file);
      setCardImage(img);
      setCardImageName(file.name);
    } catch (err) {
      setCardImage(null);
      setCardImageName("");
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const rendered = renderCard(cardImage, selectedClient);
    const canvas = canvasRef.current;
    canvas.width = rendered.width;
    canvas.height = rendered.height;
    canvas.getContext("2d").drawImage(rendered, 0, 0);
  }, [ready, cardImage, selectedClient]);

  const handleDownload = async () => {
    if (!ready) return;
    setError("");
    try {
      const blob = await generateCardBlob(cardImage, selectedClient);
      const fileName = `tarjeta_${safeName(selectedClient.N_contrato)}_${safeName(selectedClient.Nombre)}.png`;
      saveAs(blob, fileName);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card-generator">
      <section className="loaders no-print">
        <div className="uploader">
          <label className="uploader-label">Imagen de fondo de la tarjeta (.png)</label>
          <input type="file" accept=".png" onChange={handleImageChange} />
          {cardImageName && <span className="file-ok">✓ {cardImageName}</span>}
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
            <button type="button" onClick={handleDownload}>
              🪪 Descargar tarjeta (PNG)
            </button>
          </div>
        </div>
      )}

      <section className="preview-section">
        {ready ? (
          <canvas ref={canvasRef} className="card-preview" />
        ) : (
          <div className="preview-empty">
            Carga la imagen de fondo de la tarjeta y selecciona un cliente para
            ver la vista previa.
          </div>
        )}
      </section>
    </div>
  );
}
