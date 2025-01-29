import React from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import { FieldArray, useField } from "formik";
import PackagingForm from "./PackagingForm";

type PackagingListProps = {
  fieldName: string;
};

function PackagingList({ fieldName }: PackagingListProps) {
  const [field] = useField<PackagingInfoInput[]>(fieldName);

  const packagings = field.value;

  return (
    <FieldArray
      name={fieldName}
      render={({ push, remove, replace }) => (
        <>
          {packagings.map((p, idx) => (
            <>
              <PackagingForm
                packaging={p}
                setPackaging={p => replace(idx, p)}
              />
              {idx > 0 && (
                <button
                  type="button"
                  className="fr-btn fr-btn--tertiary fr-mb-2w"
                  onClick={() => remove(idx)}
                >
                  Supprimer
                </button>
              )}
              <hr />
            </>
          ))}
          <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
            <button
              type="button"
              className="fr-btn fr-btn--secondary"
              onClick={() => {
                push({ type: null, quantity: null });
              }}
            >
              Ajouter un conditionnement
            </button>
          </div>
        </>
      )}
    />
  );
}

export default PackagingList;
