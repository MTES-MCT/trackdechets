import React from "react";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import { FieldArray, useField } from "formik";
import PackagingForm from "./PackagingForm";

type PackagingListProps = {
  fieldName: string;
};

const packagingTypeOptions = [
  { value: Packagings.Benne, label: "Benne" },
  { value: Packagings.Citerne, label: "Citerne" },
  { value: Packagings.Fut, label: "Fût" },
  { value: Packagings.Grv, label: "Grand Récipient Vrac (GRV)" },
  { value: Packagings.Autre, label: "Autre" }
];

function PackagingList({ fieldName }: PackagingListProps) {
  const [field] = useField<PackagingInfoInput[]>(fieldName);

  const packagings = field.value;

  const options =
    packagings.length > 1
      ? packagingTypeOptions.filter(
          o => o.value !== Packagings.Citerne && o.value !== Packagings.Benne
        )
      : packagingTypeOptions;

  const showAddButton = packagings.every(
    p =>
      p.type !== Packagings.Citerne &&
      p.type !== Packagings.Benne &&
      p.type !== Packagings.Pipeline
  );

  return (
    <FieldArray
      name={fieldName}
      render={({ push, remove, replace }) => (
        <>
          {packagings
            .filter(p => p.type !== Packagings.Pipeline)
            .map((p, idx) => (
              <div key={idx}>
                <PackagingForm
                  packaging={p}
                  setPackaging={p => replace(idx, p)}
                  packagingTypeOptions={options}
                />
                {packagings.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="fr-btn fr-btn--tertiary fr-mb-2w"
                      onClick={() => remove(idx)}
                    >
                      Supprimer
                    </button>
                    <hr />
                  </>
                )}
              </div>
            ))}
          {showAddButton && (
            <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                onClick={() => {
                  push({ type: "", quantity: "" });
                }}
              >
                Ajouter un conditionnement
              </button>
            </div>
          )}
        </>
      )}
    />
  );
}

export default PackagingList;
