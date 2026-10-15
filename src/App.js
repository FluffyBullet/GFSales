import { useMemo, useState } from "react";
import { machines } from "./machine.js";
import "./App.css";

export default function App() {
  const [selectedFusion, setSelectedFusion] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);

  // Build filter options from the revised compatibility list.
  const fusionStyles = useMemo(
    () => [...new Set(machines.flatMap((machine) => machine.fusionStyles))].sort(),
    []
  );

  const materials = useMemo(() => {
    const relevantMachines = machines.filter(
      (machine) => !selectedFusion || machine.fusionStyles.includes(selectedFusion)
    );
    return [
      ...new Set(
        relevantMachines.flatMap((machine) =>
          machine.materials.map((material) => material.name)
        )
      ),
    ].sort();
  }, [selectedFusion]);

  // Only offer sizes that are compatible with the selected fusion/material filters.
  const sizes = useMemo(() => {
    const relevantMachines = machines.filter((machine) => {
      const fusionMatch =
        !selectedFusion || machine.fusionStyles.includes(selectedFusion);
      const materialMatch =
        !selectedMaterial ||
        machine.materials.some((material) => material.name === selectedMaterial);
      return fusionMatch && materialMatch;
    });

    return [
      ...new Set(
        relevantMachines.flatMap((machine) =>
          machine.materials
            .filter(
              (material) =>
                !selectedMaterial || material.name === selectedMaterial
            )
            .flatMap((material) => material.sizes)
        )
      ),
    ].sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  }, [selectedFusion, selectedMaterial]);

  const filteredMachines = machines.filter((machine) => {
    const fusionMatch =
      !selectedFusion || machine.fusionStyles.includes(selectedFusion);

    const matchingMaterials = machine.materials.filter((material) => {
      const materialMatch =
        !selectedMaterial || material.name === selectedMaterial;
      const sizeMatch =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => material.sizes.includes(size));
      return materialMatch && sizeMatch;
    });

    return fusionMatch && matchingMaterials.length > 0;
  });

  const toggleSize = (size, checked) => {
    setSelectedSizes((current) =>
      checked
        ? [...current, size]
        : current.filter((selected) => selected !== size)
    );
  };

  const clearFilters = () => {
    setSelectedFusion("");
    setSelectedMaterial("");
    setSelectedSizes([]);
  };

  return (
    <main className="App">
      <h1>Machine Compatibility</h1>

      <section className="filters" aria-label="Machine filters">
        <label>
          Fusion style
          <select
            value={selectedFusion}
            onChange={(event) => {
              setSelectedFusion(event.target.value);
              setSelectedSizes([]);
            }}
          >
            <option value="">All fusion styles</option>
            {fusionStyles.map((fusion) => (
              <option key={fusion} value={fusion}>
                {fusion}
              </option>
            ))}
          </select>
        </label>

        <label>
          Material
          <select
            value={selectedMaterial}
            onChange={(event) => {
              setSelectedMaterial(event.target.value);
              setSelectedSizes([]);
            }}
          >
            <option value="">All materials</option>
            {materials.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>Compatible sizes</legend>
          <div className="size-options">
            {sizes.map((size) => (
              <label key={String(size)} className="size-option">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={(event) => toggleSize(size, event.target.checked)}
                />
                {typeof size === "number" ? `${size}mm` : size}
              </label>
            ))}
          </div>
          {sizes.length === 0 && <p>No sizes available for these filters.</p>}
        </fieldset>

        <button type="button" onClick={clearFilters}>
          Clear filters
        </button>
      </section>

      <p aria-live="polite">
        {filteredMachines.length} machine
        {filteredMachines.length === 1 ? "" : "s"} found
      </p>

      {filteredMachines.length === 0 ? (
        <p>No machines match the selected filters.</p>
      ) : (
        <ul className="machine-list">
          {filteredMachines.map((machine) => {
            const compatibleMaterials = machine.materials
              .filter(
                (material) =>
                  !selectedMaterial || material.name === selectedMaterial
              )
              .map((material) => {
                const compatibleSizes =
                  selectedSizes.length > 0
                    ? material.sizes.filter((size) =>
                        selectedSizes.includes(size)
                      )
                    : material.sizes;
                return { ...material, sizes: compatibleSizes };
              })
              .filter((material) => material.sizes.length > 0);

            return (
              <li key={machine.title} className="machine-card">
                <h2>{machine.title}</h2>
                <p>
                  <strong>Fusion style:</strong>{" "}
                  {machine.fusionStyles
                    .filter(
                      (fusion) => !selectedFusion || fusion === selectedFusion
                    )
                    .join(", ")}
                </p>
                <strong>Compatible materials and sizes:</strong>
                <ul className="MachineList">
                  {compatibleMaterials.map((material) => (
                    <li key={material.name}>
                      <strong>{material.name}:{" "}</strong> <br></br>
                      {material.sizes
                        .map((size) =>
                          typeof size === "number" ? `${size}` : size
                        )
                        .join(", ")}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}