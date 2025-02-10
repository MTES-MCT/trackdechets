import React, { useMemo } from "react";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";
import { FieldArray, FormikErrors, useField, useFormikContext } from "formik";
import PackagingForm from "./PackagingForm";

type PackagingListProps = {
  fieldName: string;
  disabled?: boolean;
};

const packagingTypeOptions = [
  { value: Packagings.Benne, label: "Benne" },
  { value: Packagings.Citerne, label: "Citerne" },
  { value: Packagings.Fut, label: "Fût" },
  { value: Packagings.Grv, label: "Grand Récipient Vrac (GRV)" },
  { value: Packagings.Autre, label: "Autre" }
];

function PackagingList({ fieldName, disabled = false }: PackagingListProps) {
  const [field, { error }] = useField<PackagingInfoInput[]>(fieldName);

  const { getFieldProps, touched } = useFormikContext();

  // Le type des erreurs et de touched n'est pas correctement inféré par Formik ici
  // Peut-être en lien avec https://github.com/jaredpalmer/formik/issues/2347
  const typedErrors = error as any as
    | FormikErrors<PackagingInfoInput[]>
    | undefined;

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

  const packagingsTouched = useMemo(() => {
    return fieldName.split(".").reduce((acc, path) => {
      return acc?.[path];
    }, touched);
  }, [touched, fieldName]);

  return (
    <FieldArray
      name={fieldName}
      render={({ push: pushPackaging, remove: removePackaging }) => (
        <>
          {packagings
            .filter(p => p.type !== Packagings.Pipeline)
            .map((p, idx) => (
              <FieldArray
                name={`${fieldName}.${idx}.identificationNumbers`}
                render={({
                  push: pushIdentificationNumber,
                  remove: removeIdentificationNumber
                }) => (
                  <div key={idx}>
                    <PackagingForm
                      packaging={p}
                      inputProps={{
                        type: getFieldProps(`${fieldName}.${idx}.type`),
                        volume: getFieldProps(`${fieldName}.${idx}.volume`),
                        quantity: getFieldProps(`${fieldName}.${idx}.quantity`),
                        other: getFieldProps(`${fieldName}.${idx}.other`),
                        identificationNumbers: {
                          push: pushIdentificationNumber,
                          remove: removeIdentificationNumber
                        }
                      }}
                      packagingTypeOptions={options}
                      disabled={disabled}
                      errors={typedErrors?.[idx]}
                      touched={packagingsTouched?.[idx]}
                    />
                    {packagings.length > 1 && (
                      <>
                        <button
                          type="button"
                          disabled={disabled}
                          className="fr-btn fr-btn--tertiary fr-mb-2w"
                          onClick={() => {
                            removePackaging(idx);
                          }}
                        >
                          Supprimer
                        </button>
                        <hr />
                      </>
                    )}
                  </div>
                )}
              />
            ))}
          {showAddButton && (
            <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
              <button
                type="button"
                disabled={disabled}
                className="fr-btn fr-btn--secondary"
                onClick={() => {
                  pushPackaging({ type: "", quantity: "" });
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
