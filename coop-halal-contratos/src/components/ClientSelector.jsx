import { useMemo, useState } from "react";

const clientLabel = (c) =>
  [String(c.N_contrato ?? "").trim(), c.Nombre?.trim() || "(sin nombre)"]
    .filter(Boolean)
    .join(" — ");

export default function ClientSelector({ clients, selectedIndex, onSelect }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(selectedIndex < 0);

  // Si la selección pasa a ser válida desde fuera (p. ej. al cargar el
  // Excel), salimos del modo búsqueda para mostrar el cliente elegido.
  const [prevSelectedIndex, setPrevSelectedIndex] = useState(selectedIndex);
  if (selectedIndex !== prevSelectedIndex) {
    setPrevSelectedIndex(selectedIndex);
    if (selectedIndex >= 0 && searching) setSearching(false);
  }

  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .map((client, index) => ({ client, index }))
      .filter(({ client }) => {
        if (!q) return true;
        const nombre = (client.Nombre || "").toLowerCase();
        const contrato = String(client.N_contrato ?? "").toLowerCase();
        return nombre.includes(q) || contrato.includes(q);
      });
  }, [clients, query]);

  const handlePick = (index) => {
    onSelect(index);
    setQuery("");
    setSearching(false);
  };

  const handleClear = () => {
    onSelect(-1);
    setQuery("");
    setSearching(true);
  };

  return (
    <div className="selector">
      <label className="selector-label" htmlFor="client-search">
        Cliente
      </label>

      {selectedClient && !searching ? (
        <div className="selected-client">
          <input
            id="client-search"
            type="text"
            value={clientLabel(selectedClient)}
            readOnly
            onFocus={() => setSearching(true)}
          />
          <button
            type="button"
            className="clear-btn"
            onClick={handleClear}
            aria-label="Limpiar selección"
            title="Limpiar selección"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <input
            id="client-search"
            type="text"
            placeholder="Buscar por nombre o Nº contrato..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="search-results">
            {results.length === 0 ? (
              <li className="no-results">Sin resultados</li>
            ) : (
              results.map(({ client, index }) => (
                <li key={index}>
                  <button type="button" onClick={() => handlePick(index)}>
                    {clientLabel(client)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
