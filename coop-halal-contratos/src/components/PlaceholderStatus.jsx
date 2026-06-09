export default function PlaceholderStatus({ placeholders, unresolved }) {
  if (!placeholders.length) {
    return (
      <p className="muted">La plantilla no contiene placeholders {"{{...}}"}.</p>
    );
  }

  const unresolvedSet = new Set(unresolved);

  return (
    <div className="placeholder-status">
      <p>
        <strong>Placeholders detectados ({placeholders.length}):</strong>
      </p>
      <div className="chips">
        {placeholders.map((p) => (
          <span
            key={p}
            className={unresolvedSet.has(p) ? "chip chip-warn" : "chip"}
            title={unresolvedSet.has(p) ? "Sin dato disponible" : "Se rellenará"}
          >
            {`{{${p}}}`}
          </span>
        ))}
      </div>

      {unresolved.length > 0 && (
        <div className="warning">
          ⚠️ Estos placeholders no tienen dato disponible (ni columna en el
          Excel ni regla de negocio) y saldrán <strong>en blanco</strong>:{" "}
          {unresolved.map((p) => `{{${p}}}`).join(", ")}
        </div>
      )}
    </div>
  );
}
