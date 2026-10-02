import React, { useState } from "react";
import Table from "@codegouvfr/react-dsfr/Table";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  ReconditioningContainer,
  addReconditioningContainer,
  canAddReconditioningContainer,
  getReconditioningWasteCode
} from "../utils/reconditionnement";

type Props = {
  containers: ReconditioningContainer[];
  confirmed: ReconditioningContainer[];
  disabled: boolean;
  onConfirm: (containers: ReconditioningContainer[]) => void;
};

export default function ReconditioningContainerPicker({
  containers,
  confirmed,
  disabled,
  onConfirm
}: Props) {
  const [selected, setSelected] = useState(confirmed);
  const [filters, setFilters] = useState({
    bsff: "",
    numero: "",
    emitter: "",
    wasteCode: ""
  });
  const filtered = containers.filter(container => {
    const company = container.bsff.emitter?.company;
    return (
      (container.bsffId ?? "").includes(filters.bsff) &&
      (container.numero ?? "").includes(filters.numero) &&
      `${company?.name ?? ""} ${company?.orgId ?? company?.siret ?? ""}`
        .toLowerCase()
        .includes(filters.emitter.toLowerCase()) &&
      (getReconditioningWasteCode(container) ?? "").includes(filters.wasteCode)
    );
  });
  const columns = (container: ReconditioningContainer) => [
    container.numero ?? "Non renseigné",
    container.bsff.emitter?.company?.name ?? "Non renseigné",
    container.bsffId ?? "Non renseigné",
    getReconditioningWasteCode(container) ?? "Non renseigné",
    container.volume == null ? "Non renseigné" : `${container.volume} L`,
    container.acceptation?.weight == null && container.weight == null
      ? "Non renseigné"
      : `${container.acceptation?.weight ?? container.weight} kg`
  ];
  const headers = [
    "N° contenant",
    "Émetteur du bordereau précédent",
    "Bordereau précédent",
    "Code déchet",
    "Volume",
    "Poids",
    "Action"
  ];
  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters">
        {(
          [
            ["bsff", "N° bordereau précédent"],
            ["numero", "N° contenant"],
            ["emitter", "Émetteur"],
            ["wasteCode", "Code déchet"]
          ] as const
        ).map(([key, label]) => (
          <div className="fr-col-12 fr-col-md-3" key={key}>
            <Input
              label={label}
              nativeInputProps={{
                value: filters[key],
                onChange: event =>
                  setFilters({ ...filters, [key]: event.target.value })
              }}
            />
          </div>
        ))}
      </div>
      <Table
        caption="Contenants disponibles"
        headers={headers}
        data={filtered.map(container => [
          ...columns(container),
          <Button
            type="button"
            size="small"
            disabled={
              disabled || !canAddReconditioningContainer(selected, container)
            }
            onClick={() =>
              setSelected(current =>
                addReconditioningContainer(current, container)
              )
            }
          >
            Ajouter
          </Button>
        ])}
      />
      <Table
        caption="Contenants sélectionnés"
        headers={headers}
        data={selected.map(container => [
          ...columns(container),
          <Button
            type="button"
            size="small"
            priority="secondary"
            disabled={disabled}
            onClick={() =>
              setSelected(current =>
                current.filter(item => item.id !== container.id)
              )
            }
          >
            Retirer
          </Button>
        ])}
      />
      <Button
        type="button"
        disabled={disabled || (!selected.length && !confirmed.length)}
        onClick={() => onConfirm(selected)}
      >
        Ajouter les contenants
      </Button>
    </>
  );
}
