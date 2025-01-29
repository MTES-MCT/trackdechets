import Select from "@codegouvfr/react-dsfr/Select";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import React from "react";
import NonScrollableInput from "../../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";
import Input from "@codegouvfr/react-dsfr/Input";

type PackagingFormProps = {
  packaging: PackagingInfoInput;
  setPackaging: (packaging: PackagingInfoInput) => void;
};

const packagingTypeOptions = [
  { value: Packagings.Benne, label: "Benne" },
  { value: Packagings.Citerne, label: "Citerne" },
  { value: Packagings.Fut, label: "Fût" },
  { value: Packagings.Grv, label: "Grand Récipient Vrac (GRV)" },
  { value: Packagings.Pipeline, label: "Conditionné pour pipeline" },
  { value: Packagings.Autre, label: "Autre" }
];

function PackagingForm({ packaging, setPackaging }: PackagingFormProps) {
  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-12">
          <Select
            label="Type"
            nativeSelectProps={{
              value: packaging.type,
              onChange: event => {
                const packagingType = event.target.value as Packagings;
                setPackaging({
                  ...packaging,
                  type: packagingType,
                  other: packagingType === Packagings.Autre ? "" : null
                });
              }
            }}
          >
            <option value="">...</option>
            {packagingTypeOptions.map(({ value, label }) => (
              <option value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="fr-col-md-4 fr-col-12">
          <NonScrollableInput
            label="Volume en litres (optionnel)"
            className="fr-mb-2w"
            nativeInputProps={{
              type: "number",
              inputMode: "decimal",
              step: "0.001" // mili-litres
            }}
          />
          <p className="fr-info-text">Soit X m3</p>
        </div>
        <div className="fr-col-md-2 fr-col-12">
          <NonScrollableInput
            label="Nombre"
            className="fr-mb-2w"
            nativeInputProps={{
              type: "number",
              inputMode: "numeric",
              step: "1", // mili-litres
              value: packaging.quantity,
              onChange: event => {
                const quantity = event.target.value;
                setPackaging({
                  ...packaging,
                  quantity:
                    quantity === "" ? (quantity as any) : Number(quantity)
                });
              }
            }}
          />
        </div>
      </div>
      {packaging.type === Packagings.Autre && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Input
              label="Nom du type de contenant"
              nativeInputProps={{
                value: packaging.other ?? "",
                onChange: event =>
                  setPackaging({ ...packaging, other: event.target.value })
              }}
            />
          </div>
        </div>
      )}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <Input label="N° de contenant (optionnel)" />
        </div>
      </div>
    </>
  );
}

export default PackagingForm;
