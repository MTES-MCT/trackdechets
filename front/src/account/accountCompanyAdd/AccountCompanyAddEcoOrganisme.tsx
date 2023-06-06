import React from "react";
import { Field, FieldArray, useField } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

export default function AccountCompanyAddEcoOrganisme() {
  const fieldProps = { name: "ecoOrganismeAgreements" };
  const [field] = useField<string[]>(fieldProps);

  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Agréments éco-organisme</p>
          <RedErrorMessage name="ecoOrganismeAgreements" />
        </div>
      </div>
      <FieldArray {...fieldProps}>
        {({ push, remove }) => (
          <>
            {field.value.map((url, index) => (
              <div className="fr-grid-row fr-grid-row--gutters" key="index">
                <div className="fr-col-1">
                  <span className="fr-text">URL</span>
                </div>
                <div className="fr-col-8">
                  <Field name={`ecoOrganismeAgreements.${index}`}>
                    {({ field }) => {
                      return (
                        <Input
                          label=""
                          nativeInputProps={{
                            type: "text",
                            placeholder: "https://",
                            ...field,
                          }}
                        ></Input>
                      );
                    }}
                  </Field>
                </div>
                <div className="fr-col-3">
                  <Button
                    iconId="ri-delete-bin-line"
                    onClick={() => remove(index)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            <div className="fr-grid-row fr-pt-1w">
              <div className="fr-col-12">
                <Button iconId="ri-add-line" onClick={() => push("")}>
                  Ajouter un agrément
                </Button>
              </div>
            </div>
          </>
        )}
      </FieldArray>
    </div>
  );
}
