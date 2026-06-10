export default function TemplateUploader({ onLoad, fileName, fromCache, onChangeTemplate }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onLoad(file);
  };

  return (
    <div className="uploader">
      <label className="uploader-label">2. Plantilla de contrato (.docx)</label>
      {fromCache && fileName ? (
        <div className="cached-template">
          <span className="file-ok">✓ Plantilla guardada · {fileName}</span>
          <button type="button" className="btn-link" onClick={onChangeTemplate}>
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input type="file" accept=".docx" onChange={handleChange} />
          {fileName && <span className="file-ok">✓ {fileName}</span>}
        </>
      )}
    </div>
  );
}
