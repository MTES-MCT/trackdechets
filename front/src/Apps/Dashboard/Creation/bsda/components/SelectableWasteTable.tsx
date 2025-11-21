import React, { useMemo, useState } from "react";
import { Bsda, BsdaType } from "@td/codegen-ui";
import Table from "@codegouvfr/react-dsfr/Table";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";

type SelectableWasteTableProps = {
  bsdas: Bsda[];
  onClick: (bsda: Bsda) => void;
  isSelected: (bsda: Bsda) => boolean;
  pickerType: BsdaType.Reshipment | BsdaType.Gathering;
  selected: string | string[] | undefined | null;
};

export default function SelectableWasteTable({
  bsdas,
  onClick,
  isSelected,
  pickerType,
  selected
}: SelectableWasteTableProps) {
  const [idFilter, setIdFilter] = useState("");
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const [finalDestinationSiretFilter, setFinalDestinationSiretFilter] =
    useState("");

  const filteredBsdas = useMemo(() => {
    return bsdas.filter(bsda => {
      if (idFilter.length > 0 && !bsda.id.includes(idFilter)) {
        return false;
      }

      if (
        wasteCodeFilter.length > 0 &&
        !bsda.waste?.code?.includes(wasteCodeFilter)
      ) {
        return false;
      }

      if (
        finalDestinationSiretFilter.length > 0 &&
        !bsda.destination?.operation?.nextDestination?.company?.orgId?.includes(
          finalDestinationSiretFilter
        ) &&
        !bsda.destination?.operation?.nextDestination?.company?.name?.includes(
          finalDestinationSiretFilter
        )
      ) {
        return false;
      }
      return true;
    });
  }, [bsdas, idFilter, wasteCodeFilter, finalDestinationSiretFilter]);

  const rowsData = useMemo(
    () =>
      filteredBsdas.map(bsda => {
        const checked = isSelected(bsda);
        return {
          bsda,
          checked
        };
      }),
    [filteredBsdas, isSelected]
  );

  const renderTable = () => {
    const rows = rowsData.map(({ bsda, checked }) => {
      const firstSelectedBsda =
        Array.isArray(selected) &&
        selected.length > 0 &&
        bsdas.find(b => b.id === selected[0]);

      const isDisabled =
        firstSelectedBsda &&
        bsda.waste?.code !== firstSelectedBsda?.waste?.code;

      return pickerType === BsdaType.Reshipment
        ? [
            <SingleCheckbox
              options={[
                {
                  label: "",
                  nativeInputProps: {
                    checked,
                    onChange: _ => {
                      onClick(bsda);
                    },
                    disabled: isDisabled
                  }
                }
              ]}
            />,
            <div style={{ wordBreak: "break-word", wordWrap: "break-word" }}>
              {bsda.id}
            </div>,
            bsda.waste?.code,
            <div>
              <div
                style={{
                  maxHeight: "25px",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                aria-describedby={bsda.id}
              >
                {bsda.waste?.materialName}
              </div>
              <span
                className="fr-tooltip fr-placement"
                id={bsda.id}
                role="tooltip"
              >
                {bsda.waste?.materialName}
              </span>
            </div>,
            bsda.destination?.reception?.acceptedWeight ?? "Non renseigné",
            bsda.emitter?.company?.name ?? "Non renseigné",
            bsda.destination?.operation?.nextDestination?.cap ??
              "Non renseigné",
            bsda.destination?.operation?.nextDestination
              ? `${bsda.destination.operation.nextDestination.company?.name} (${bsda.destination.operation.nextDestination.company?.orgId})`
              : "Non renseigné"
          ]
        : [
            <SingleCheckbox
              options={[
                {
                  label: "",
                  nativeInputProps: {
                    checked,
                    onChange: _ => {
                      onClick(bsda);
                    },
                    disabled: isDisabled
                  }
                }
              ]}
            />,
            <div style={{ wordBreak: "break-word", wordWrap: "break-word" }}>
              {bsda.id}
            </div>,
            bsda.waste?.code,
            <div>
              <div
                style={{
                  maxHeight: "25px",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
                aria-describedby={bsda.id}
              >
                {bsda.waste?.materialName}
              </div>
              <span
                className="fr-tooltip fr-placement"
                id={bsda.id}
                role="tooltip"
              >
                {bsda.waste?.materialName}
              </span>
            </div>,
            bsda.destination?.reception?.acceptedWeight ?? "Non renseigné",
            bsda.destination?.operation?.nextDestination?.cap ??
              "Non renseigné",
            bsda.destination?.operation?.nextDestination
              ? `${bsda.destination.operation.nextDestination.company?.name} (${bsda.destination.operation.nextDestination.company?.orgId})`
              : "Non renseigné"
          ];
    });

    // En tête du tableau
    const headers =
      pickerType === BsdaType.Reshipment
        ? [
            "",
            "N° bordereau",
            "Code déchet",
            "Dénomination usuelle",
            "Quantité acceptée (en t)",
            "Émetteur",
            "CAP final",
            "Exutoire prévu, si renseigné"
          ]
        : [
            "",
            "N° bordereau",
            "Code déchet",
            "Dénomination usuelle",
            "Quantité acceptée (en t)",
            "CAP final",
            "Exutoire prévu, si renseigné"
          ];

    return (
      <Table
        caption="Sélection des bordereaux à ajouter" // accessibilité
        noCaption
        headers={headers}
        data={rows}
      />
    );
  };

  if (bsdas.length > 0) {
    return (
      <>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="Numéro de bordereau"
              nativeInputProps={{
                value: idFilter,
                onChange: v => setIdFilter(v.target.value)
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="Code déchet"
              nativeInputProps={{
                value: wasteCodeFilter,
                onChange: v => setWasteCodeFilter(v.target.value)
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="Exutoire"
              nativeInputProps={{
                value: finalDestinationSiretFilter,
                onChange: v => setFinalDestinationSiretFilter(v.target.value)
              }}
            />
          </div>
        </div>
        {renderTable()}
      </>
    );
  }

  return (
    <Alert
      severity="warning"
      title="Aucun bordereau éligible au regroupement"
      description="Vérifiez que vous avez bien sélectionné le bon émetteur"
      small
    />
  );
}
