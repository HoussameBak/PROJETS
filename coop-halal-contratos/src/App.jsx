import { useState, useMemo } from "react";
import ExcelUploader from "./components/ExcelUploader.jsx";
import TemplateUploader from "./components/TemplateUploader.jsx";
import ClientSelector from "./components/ClientSelector.jsx";
import PlaceholderStatus from "./components/PlaceholderStatus.jsx";
import ContractPreview from "./components/ContractPreview.jsx";
import ActionButtons from "./components/ActionButtons.jsx";
import { readExcel } from "./logic/readExcel.js";
import { readTemplate } from "./logic/readTemplate.js";
import { resolveValues, findUnresolvedPlaceholders } from "./logic/resolveValues.js";
import { downloadDocx, getContractPreview } from "./logic/generateDocx.js";
import "./App.css";

// Limpia un texto para usarlo como nombre de archivo.
const safeName = (s) =>
  String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "sin_dato";

export default function App() {
  const [clients, setClients] = useState([]);
  const [columns, setColumns] = useState([]);
  const [excelName, setExcelName] = useState("");

  const [templateBuffer, setTemplateBuffer] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [templateName, setTemplateName] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");

  const handleExcel = async (file) => {
    setError("");
    try {
      const rows = await readExcel(file);
      if (!rows.length) throw new Error("El Excel no contiene filas de datos.");
      // Unión de todas las columnas presentes en cualquier fila.
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      setClients(rows);
      setColumns(cols);
      setExcelName(file.name);
      setSelectedIndex(0);
    } catch (err) {
      setClients([]);
      setColumns([]);
      setExcelName("");
      setError(err.message);
    }
  };

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

  const selectedClient = clients[selectedIndex] || null;

  // Valores resueltos para el cliente seleccionado.
  const resolved = useMemo(() => {
    if (!selectedClient || !placeholders.length) return null;
    return resolveValues(selectedClient, placeholders);
  }, [selectedClient, placeholders]);

  // Placeholders que saldrán en blanco (aviso al usuario), independiente del cliente.
  const unresolved = useMemo(
    () => findUnresolvedPlaceholders(placeholders, columns),
    [placeholders, columns]
  );

  // Vista previa en texto del contrato relleno.
  const preview = useMemo(() => {
    if (!templateBuffer || !resolved) return { text: "", error: "" };
    try {
      return { text: getContractPreview(templateBuffer, resolved), error: "" };
    } catch (err) {
      return { text: "", error: err.message };
    }
  }, [templateBuffer, resolved]);

  const handleDownload = () => {
    if (!templateBuffer || !resolved || !selectedClient) return;
    setError("");
    try {
      const fileName = `${safeName(selectedClient.N_contrato)}_${safeName(
        selectedClient.Nombre
      )}.docx`;
      downloadDocx(templateBuffer, resolved, fileName);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrint = () => window.print();

  const ready = clients.length > 0 && !!templateBuffer && placeholders.length > 0;

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
          <ClientSelector
            clients={clients}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </section>
      )}

      {ready && (
        <ActionButtons
          onPrint={handlePrint}
          onDownload={handleDownload}
          disabled={!resolved || !!preview.error}
        />
      )}

      <section className="preview-section">
        <ContractPreview text={preview.text} error={preview.error} />
      </section>
    </div>
  );
}
