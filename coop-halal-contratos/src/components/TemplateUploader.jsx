export default function TemplateUploader({ onLoad, fileName }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onLoad(file);
  };

  return (
    <div className="uploader">
      <label className="uploader-label">2. Plantilla de contrato (.docx)</label>
      <input type="file" accept=".docx" onChange={handleChange} />
      {fileName && <span className="file-ok">✓ {fileName}</span>}
    </div>
  );
}
