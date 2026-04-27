import React, { useMemo } from "react";
import { BsffPackaging, BsffType } from "@td/codegen-ui";
import Table from "@codegouvfr/react-dsfr/Table";
import Input from "@codegouvfr/react-dsfr/Input";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Decimal from "decimal.js";
import { ZodBsffGroupingOrForwarding } from "../schema";

export const MAX_BSFF_COUNT_TABLE_DISPLAY = 50;

type SelectableWasteTableProps = {
  bsffPackagings: BsffPackaging[];
  total?: number;
  onClick: (bsffPackaging: BsffPackaging) => void;
  pickerType:
    | BsffType.Groupement
    | BsffType.Reexpedition
    | BsffType.Reconditionnement;
  selected: ZodBsffGroupingOrForwarding[];
  idFilter: string;
  wasteCodeFilter: string;
  numeroFilter: string;
  emetteurSiretFilter: string;

  setIdFilter: (id: string) => void;
  setWasteCodeFilter: (wasteCode: string) => void;
  setEmetteurSiretFilter: (emetteurSiretFilter: string) => void;
  setNumeroFilter: (numero: string) => void;
};

export default function BsffSelectableWasteTable({
  bsffPackagings,
  total = 0,
  onClick,
  pickerType,
  selected,
  idFilter,
  numeroFilter,
  wasteCodeFilter,
  emetteurSiretFilter,
  setIdFilter,
  setNumeroFilter,
  setWasteCodeFilter,
  setEmetteurSiretFilter
}: SelectableWasteTableProps) {
  const hasMore = bsffPackagings.length > 0 && total > bsffPackagings.length;

  const filteredBsffs = useMemo(() => {
    return bsffPackagings.filter(bsffPackaging => {
      if (idFilter.length > 0 && !bsffPackaging.bsffId.includes(idFilter)) {
        return false;
      }

      const packagingWasteCode =
        bsffPackaging?.acceptation?.wasteCode ??
        bsffPackaging.bsff?.waste?.code ??
        "";

      if (
        wasteCodeFilter.length > 0 &&
        !packagingWasteCode.includes(wasteCodeFilter)
      ) {
        return false;
      }

      if (
        emetteurSiretFilter.length > 0 &&
        !bsffPackaging.bsff.emitter?.company?.orgId?.includes(
          emetteurSiretFilter
        ) &&
        !bsffPackaging.bsff.emitter?.company?.name?.includes(
          emetteurSiretFilter
        )
      ) {
        return false;
      }

      return true;
    });
  }, [bsffPackagings, idFilter, wasteCodeFilter, emetteurSiretFilter]);

  const renderTable = () => {
    const rows = filteredBsffs.map(bsffPackaging => {
      const checked = selected?.some(
        selectedBsff => selectedBsff.id === bsffPackaging.id // ← id au lieu de bsffId
      );
      const firstSelected =
        selected && selected.length > 0 ? selected[0] : null;

      const selectedWasteCode =
        firstSelected?.acceptation?.wasteCode ?? firstSelected?.waste?.code;

      const currentWasteCode =
        bsffPackaging?.acceptation?.wasteCode ??
        bsffPackaging?.bsff?.waste?.code;

      let isDisabled = false;

      if (pickerType === BsffType.Reexpedition) {
        if (selected.length > 0) {
          isDisabled = !selected.some(s => s.id === bsffPackaging.id);
        }
      } else if (pickerType === BsffType.Groupement) {
        if (selectedWasteCode) {
          isDisabled = currentWasteCode !== selectedWasteCode;
        }
      }
      const wasteCode = currentWasteCode;

      return [
        <SingleCheckbox
          options={[
            {
              label: "",
              nativeInputProps: {
                checked,
                onChange: () => onClick(bsffPackaging),
                disabled: isDisabled
              }
            }
          ]}
        />,
        <div style={{ wordBreak: "break-word" }}>{bsffPackaging.bsffId}</div>,
        wasteCode,

        <div></div>,
        <div></div>,
        <div></div>,
        <div></div>,
        <div></div>,
        <div></div>,

        bsffPackaging.numero,

        bsffPackaging.bsff.emitter?.company?.name
          ? `${bsffPackaging.bsff.emitter.company.name} - ${bsffPackaging.bsff.emitter.company.orgId}`
          : "Non renseigné"
      ];
    });

    const headers = [
      "",
      "N° bordereau",
      "Code déchet",
      "",
      "",
      "",
      "",
      "",
      "",
      "N° contenant",
      "Émetteur initial"
    ];

    return (
      <Table
        caption="Sélection des bordereaux à ajouter"
        noCaption
        headers={headers}
        data={rows}
      />
    );
  };

  return (
    <>
      {/* FILTRES */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
          <Input
            label="N° bordereau"
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
            label="N° contenant"
            nativeInputProps={{
              value: numeroFilter,
              onChange: v => setNumeroFilter(v.target.value)
            }}
          />
        </div>

        <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
          <Input
            label="Émetteur initial"
            nativeInputProps={{
              value: emetteurSiretFilter,
              onChange: v => setEmetteurSiretFilter(v.target.value)
            }}
          />
        </div>
      </div>

      {/* ALERT + ACCORDION */}
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
                    n'affiche que les {MAX_BSFF_COUNT_TABLE_DISPLAY} derniers
                    bordereaux sur un total de {total} bordereaux.
                  </div>
                }
              />
            </div>
          )}

          {selected && selected.length > 0 && (
            <div className="fr-col-12">
              <Accordion label="Afficher la liste des bordereaux annexés">
                {selected.map(selectedBsff => (
                  <div key={selectedBsff.bsffId}>
                    {selectedBsff.bsffId} -{" "}
                    {selectedBsff.acceptation?.wasteCode ??
                      selectedBsff.waste?.code}
                    {selectedBsff.acceptation?.weight
                      ? ` - ${new Decimal(
                          selectedBsff.acceptation?.weight
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
