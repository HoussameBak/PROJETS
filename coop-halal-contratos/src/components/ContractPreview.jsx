export default function ContractPreview({ text, error }) {
  if (error) {
    return <pre className="error preview-error">{error}</pre>;
  }
  if (!text) {
    return (
      <p className="muted preview-empty">
        La vista previa del contrato aparecerá aquí cuando cargues el Excel y la
        plantilla.
      </p>
    );
  }
  return <pre className="preview">{text}</pre>;
}
