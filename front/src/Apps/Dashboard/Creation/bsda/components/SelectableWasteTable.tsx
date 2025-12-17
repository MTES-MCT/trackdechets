import React, { useMemo } from "react";
import { Bsda, BsdaType } from "@td/codegen-ui";
import Table from "@codegouvfr/react-dsfr/Table";
import Input from "@codegouvfr/react-dsfr/Input";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Decimal from "decimal.js";
import { ZodBsdaGroupingOrForwarding } from "../schema";

export const MAX_BSDA_COUNT_TABLE_DISPLAY = 5;

type SelectableWasteTableProps = {
  bsdas: Bsda[];
  total?: number;
  onClick: (bsda: Bsda) => void;
  pickerType: BsdaType.Reshipment | BsdaType.Gathering;
  selected: ZodBsdaGroupingOrForwarding[];
  idFilter: string;
  wasteCodeFilter: string;
  finalDestinationSiretFilter: string;
  setIdFilter: (id: string) => void;
  setWasteCodeFilter: (wasteCode: string) => void;
  setFinalDestinationSiretFilter: (finalDestinationSiret: string) => void;
};

export default function SelectableWasteTable({
  bsdas,
  total = 0,
  onClick,
  pickerType,
  selected,
  idFilter,
  wasteCodeFilter,
  finalDestinationSiretFilter,
  setIdFilter,
  setWasteCodeFilter,
  setFinalDestinationSiretFilter
}: SelectableWasteTableProps) {
  const hasMore = bsdas.length > 0 && total > bsdas.length;
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

  const renderTable = () => {
    const rows = filteredBsdas.map(bsda => {
      const checked = selected?.some(
        selectedBsda => selectedBsda.id === bsda.id
      );
      const firstSelectedBsda = selected && selected.length > 0 && selected[0];
      let isDisabled = false;
      if (firstSelectedBsda) {
        if (pickerType === BsdaType.Gathering) {
          isDisabled =
            bsda.id !== firstSelectedBsda.id &&
            bsda.waste?.code !== firstSelectedBsda.waste?.code;
        } else {
          isDisabled = firstSelectedBsda?.id !== bsda.id;
        }
      }

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
      {(hasMore || (selected && selected.length > 0)) && (
        <div className="fr-grid-row fr-grid-row--gutters">
          {hasMore && (
            <div className="fr-col-12">
              <Alert
                severity="warning"
                small
                description={
                  <div>
                    Pour des raisons de performance, le tableau ci-dessous
                    n'affiche que les {MAX_BSDA_COUNT_TABLE_DISPLAY} derniers
                    bordereaux sur un total de {total} bordereaux. Vous pouvez
                    sélectionner des bordereaux individuellement en utilisant le
                    filtre par numéro de bordereau.
                  </div>
                }
              />
            </div>
          )}
          {selected && selected.length > 0 && (
            <div className="fr-col-12">
              <Accordion label="Afficher la liste des bordereaux annexés">
                {selected.map(selectedBsda => (
                  <div>
                    {selectedBsda.id}- {selectedBsda.waste?.code}
                    {selectedBsda.destination?.reception?.acceptedWeight ||
                    selectedBsda.destination?.reception?.weight
                      ? ` - ${new Decimal(
                          (selectedBsda.destination?.reception
                            ?.acceptedWeight ||
                            selectedBsda.destination?.reception?.weight) ??
                            0
                        ).toFixed(6)} T`
                      : ""}
                  </div>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      )}
      {renderTable()}
    </>
  );
}
