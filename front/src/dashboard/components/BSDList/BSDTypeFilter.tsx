import * as React from "react";
import { FilterProps } from "react-table";
import { Bsd, BsdType } from "generated/graphql/types";
import Select from "Apps/common/Components/Select/Select";
import "./BSDTypeFilter.scss";

const OPTIONS = [
  {
    value: BsdType.Bsdd,
    label: "Déchets Dangereux",
  },
  {
    value: BsdType.Bsdasri,
    label: "Déchets d'Activités de Soins à Risque Infectieux",
  },
  {
    value: BsdType.Bsvhu,
    label: "Véhicules Hors d'Usage",
  },
  {
    value: BsdType.Bsff,
    label: "Déchets de Fluides Frigorigènes",
  },
  {
    value: BsdType.Bsda,
    label: "Déchets d'Amiante",
  },
];

export function BSDTypeFilter({
  column: {
    // by default all types are returned so they're kinda "all checked"
    filterValue = OPTIONS,
    setFilter,
  },
}: FilterProps<Bsd>) {
  const [selected, setSelected] = React.useState(filterValue);

  const handleChange = selectedList => {
    setSelected(selectedList);
    setFilter(selectedList.map(({ value }) => value));
  };
  return (
    <div className="bsd-filter">
      <Select
        onChange={handleChange}
        isMultiple
        options={OPTIONS}
        selected={selected}
        placeholder="Filtrer"
        showRendererText={false}
        disableSearch
      />
    </div>
  );
}
