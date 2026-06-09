export default function ClientSelector({ clients, selectedIndex, onSelect }) {
  return (
    <div className="selector">
      <label className="selector-label" htmlFor="client-select">
        Cliente
      </label>
      <select
        id="client-select"
        value={selectedIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {clients.map((c, i) => (
          <option key={i} value={i}>
            {c.Nombre?.trim() ? c.Nombre : `(sin nombre) — fila ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
}
