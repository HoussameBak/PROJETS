export default function ExcelUploader({ onLoad, fileName }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onLoad(file);
  };

  return (
    <div className="uploader">
      <label className="uploader-label">1. Excel de datos (clientes)</label>
      <input type="file" accept=".xlsx,.xls" onChange={handleChange} />
      {fileName && <span className="file-ok">✓ {fileName}</span>}
    </div>
  );
}
