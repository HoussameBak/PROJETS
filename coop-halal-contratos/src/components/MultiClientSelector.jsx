export default function MultiClientSelector({
  clients,
  selected,
  clientErrorsList,
  selectedSetWarnings,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) {
  const allSelected = selected.size === clients.length && clients.length > 0;

  return (
    <div className="multi-selector">
      <div className="multi-selector-header">
        <span className="multi-count">
          {selected.size === 0
            ? "Ningún cliente seleccionado"
            : selected.size === 1
            ? "1 cliente seleccionado"
            : `${selected.size} clientes seleccionados`}
          {selectedSetWarnings > 0 && ` (${selectedSetWarnings} con advertencias)`}
        </span>
        <button
          type="button"
          className="btn-link"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </button>
      </div>

      <ul className="client-list">
        {clients.map((c, i) => {
          const checked = selected.has(i);
          const label = [
            c.N_contrato?.trim(),
            c.Nombre?.trim() || `(sin nombre)`,
          ]
            .filter(Boolean)
            .join(" — ");
          const hasErrors = clientErrorsList?.[i]?.length > 0;

          return (
            <li key={i} className={`client-item${checked ? " client-item-checked" : ""}`}>
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(i)}
                />
                {hasErrors && (
                  <span className="warn-icon" title="Datos incompletos o no reconocidos">
                    ⚠️
                  </span>
                )}
                {label}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
