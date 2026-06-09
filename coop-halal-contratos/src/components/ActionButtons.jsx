export default function ActionButtons({ onPrint, onDownload, disabled }) {
  return (
    <div className="actions no-print">
      <button type="button" onClick={onPrint} disabled={disabled}>
        🖨️ Imprimir / Guardar PDF
      </button>
      <button type="button" onClick={onDownload} disabled={disabled}>
        📄 Descargar Word (.docx)
      </button>
    </div>
  );
}
