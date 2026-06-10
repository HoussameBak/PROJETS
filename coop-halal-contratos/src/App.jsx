import { useState, useMemo } from "react";
import ExcelUploader from "./components/ExcelUploader.jsx";
import TemplateUploader from "./components/TemplateUploader.jsx";
import ClientSelector from "./components/ClientSelector.jsx";
import MultiClientSelector from "./components/MultiClientSelector.jsx";
import PlaceholderStatus from "./components/PlaceholderStatus.jsx";
import ContractPreview from "./components/ContractPreview.jsx";
import { readExcel } from "./logic/readExcel.js";
import { readTemplate } from "./logic/readTemplate.js";
import { resolveValues, findUnresolvedPlaceholders } from "./logic/resolveValues.js";
import { downloadDocx, getContractPreview } from "./logic/generateDocx.js";
import { downloadZip } from "./logic/generateZip.js";
import "./App.css";

const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function App() {
  // --- datos cargados ---
  const [clients, setClients] = useState([]);
  const [columns, setColumns] = useState([]);
  const [excelName, setExcelName] = useState("");

  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [templateName, setTemplateName] = useState("");

  // --- modo de selección ---
  const [multiMode, setMultiMode] = useState(false);
  // modo individual
  const [selectedIndex, setSelectedIndex] = useState(0);
  // modo múltiple: Set de índices seleccionados
  const [selectedSet, setSelectedSet] = useState(new Set());

  const [error, setError] = useState("");
  const [zipLoading, setZipLoading] = useState(false);

  // --- carga Excel ---
  const handleExcel = async (file) => {
    setError("");
    try {
      const rows = await readExcel(file);
      if (!rows.length) throw new Error("El Excel no contiene filas de datos.");
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      setClients(rows);
      setColumns(cols);
      setExcelName(file.name);
      setSelectedIndex(0);
      setSelectedSet(new Set());
    } catch (err) {
      setClients([]);
      setColumns([]);
      setExcelName("");
      setError(err.message);
    }
  };

  // --- carga plantilla ---
  const handleTemplate = async (file) => {
    setError("");
    try {
      const { arrayBuffer, placeholders: phs } = await readTemplate(file);
      setTemplateBuffer(arrayBuffer);
      setPlaceholders(phs);
      setTemplateName(file.name);
    } catch (err) {
      setTemplateBuffer(null);
      setPlaceholders([]);
      setTemplateName("");
      setError(err.message);
    }
  };

  // --- toggle modo ---
  const handleToggleMode = () => {
    setMultiMode((v) => !v);
    setSelectedSet(new Set());
    setError("");
  };

  // --- acciones selección múltiple ---
  const handleToggleClient = (i) =>
    setSelectedSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleSelectAll = () =>
    setSelectedSet(new Set(clients.map((_, i) => i)));

  const handleDeselectAll = () => setSelectedSet(new Set());

  // --- cliente para la vista previa ---
  // En modo múltiple: primer seleccionado (orden de índice); en individual: el del desplegable
  const previewIndex = multiMode
    ? selectedSet.size > 0
      ? Math.min(...selectedSet)
      : -1
    : selectedIndex;

  const previewClient = clients[previewIndex] || null;

  const resolved = useMemo(() => {
    if (!previewClient || !placeholders.length) return null;
    return resolveValues(previewClient, placeholders);
  }, [previewClient, placeholders]);

  const unresolved = useMemo(
    () => findUnresolvedPlaceholders(placeholders, columns),
    [placeholders, columns]
  );

  const preview = useMemo(() => {
    if (!templateBuffer || !resolved) return { text: "", error: "" };
    try {
      return { text: getContractPreview(templateBuffer, resolved), error: "" };
    } catch (err) {
      return { text: "", error: err.message };
    }
  }, [templateBuffer, resolved]);

  // --- descarga individual ---
  const handleDownloadSingle = () => {
    const client = multiMode ? clients[Math.min(...selectedSet)] : clients[selectedIndex];
    if (!templateBuffer || !client) return;
    setError("");
    try {
      const values = resolveValues(client, placeholders);
      const fileName = `${safeName(client.N_contrato)}_${safeName(client.Nombre)}.docx`;
      downloadDocx(templateBuffer, values, fileName);
    } catch (err) {
      setError(err.message);
    }
  };

  // --- descarga ZIP ---
  const handleDownloadZip = async () => {
    if (!templateBuffer || selectedSet.size === 0) return;
    setError("");
    setZipLoading(true);
    try {
      const selectedClients = [...selectedSet].sort((a, b) => a - b).map((i) => clients[i]);
      await downloadZip(templateBuffer, selectedClients, placeholders);
    } catch (err) {
      setError(err.message);
    } finally {
      setZipLoading(false);
    }
  };

  const ready = clients.length > 0 && !!templateBuffer && placeholders.length > 0;

  // En modo múltiple: cuántos están seleccionados
  const multiCount = selectedSet.size;
  // El botón ZIP aparece si hay más de uno; si hay exactamente uno, descarga .docx directo
  const showZip = multiMode && multiCount > 1;
  const showSingleFromMulti = multiMode && multiCount === 1;

  const downloadDisabled =
    !ready ||
    !!preview.error ||
    (multiMode ? multiCount === 0 : false) ||
    zipLoading;

  return (
    <div className="app">
      <header className="no-print">
        <h1>Generador de contratos CoopHalal</h1>
        <p className="subtitle">
          Carga un Excel de clientes y una plantilla <code>.docx</code> con
          placeholders <code>{"{{...}}"}</code>. La app detecta los placeholders
          y los rellena automáticamente.
        </p>
      </header>

      <section className="loaders no-print">
        <ExcelUploader onLoad={handleExcel} fileName={excelName} />
        <TemplateUploader onLoad={handleTemplate} fileName={templateName} />
      </section>

      {error && (
        <pre className="error no-print" role="alert">
          {error}
        </pre>
      )}

      {templateName && (
        <section className="template-info no-print">
          <PlaceholderStatus placeholders={placeholders} unresolved={unresolved} />
        </section>
      )}

      {clients.length > 0 && (
        <section className="no-print">
          <div className="mode-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={multiMode}
                onChange={handleToggleMode}
              />
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
      )}

      {ready && (
        <div className="actions-wrapper no-print">
          <div className="actions">
            {/* ZIP: modo múltiple con > 1 seleccionados */}
            {showZip && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={downloadDisabled}
              >
                {zipLoading
                  ? `⏳ Generando ZIP (${multiCount})…`
                  : `📦 Descargar ZIP (${multiCount} contratos)`}
              </button>
            )}

            {/* Word individual: modo individual O exactamente 1 seleccionado en multi */}
            {(!multiMode || showSingleFromMulti) && (
              <button
                type="button"
                onClick={handleDownloadSingle}
                disabled={downloadDisabled}
              >
                📄 Descargar Word (.docx)
              </button>
            )}
          </div>
          <p className="help-text">
            Para obtener un PDF, descarga el Word y usa{" "}
            <strong>Archivo → Guardar como → PDF</strong> en Word o Google Docs.
          </p>
        </div>
      )}

      <section className="preview-section">
        {multiMode && multiCount > 1 && preview.text && (
          <p className="preview-note no-print">
            Vista previa del primer contrato seleccionado
          </p>
        )}
        <ContractPreview text={preview.text} error={preview.error} />
      </section>
    </div>
  );
}
