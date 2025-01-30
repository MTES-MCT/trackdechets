import React from "react";
import { FieldArray, useFormikContext } from "formik";
import { CompanyInput } from "@td/codegen-ui";
import { getInitialCompany } from "../../../common/data/initialState";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import CompanySelectorWrapper, {
  selectedCompanyError
} from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import CompanyContactInfo from "../CompanyContactInfo/CompanyContactInfo";

type FormikIntermediaryListProps = {
  // N°SIRET de l'établissement courant
  siret?: string;
  disabled: boolean;
};

function FormikIntermediaryList({
  siret,
  disabled
}: FormikIntermediaryListProps) {
  const { values, setFieldValue } = useFormikContext<{
    intermediaries: CompanyInput[];
  }>();

  const intermediaries = values.intermediaries;

  const hasIntermediaries = !!intermediaries?.length;

  return (
    <>
      <ToggleSwitch
        label="Présence d'intermédiaires"
        checked={hasIntermediaries}
        showCheckedHint={false}
        onChange={hasIntermediary => {
          if (!hasIntermediary) {
            setFieldValue("intermediaries", []);
          } else {
            setFieldValue("intermediaries", [getInitialCompany()]);
          }
        }}
        disabled={disabled}
      />
      {hasIntermediaries && (
        <FieldArray
          name="intermediaries"
          render={({ push, remove }) => (
            <>
              {intermediaries.map((i, idx) => (
                <div className="fr-mt-2w" key={idx}>
                  <h6 className="fr-h6">Intermédiaire {idx + 1}</h6>
                  <CompanySelectorWrapper
                    orgId={siret}
                    selectedCompanyOrgId={intermediaries[idx]?.siret ?? null}
                    selectedCompanyError={selectedCompanyError}
                    disabled={disabled}
                    onCompanySelected={company => {
                      const prevIntermediary = intermediaries[idx];

                      if (company) {
                        setFieldValue(`intermediaries.${idx}`, {
                          ...prevIntermediary,
                          siret: company?.siret,
                          orgId: company.orgId,
                          address: company.address,
                          name: company.name,
                          ...(prevIntermediary?.siret !== company.siret
                            ? {
                                // auto-completion des infos de contact uniquement
                                // s'il y a un changement d'établissement pour
                                // éviter d'écraser les infos de contact spécifiées par l'utilisateur
                                // lors d'une modification de bordereau
                                contact: company.contact ?? "",
                                phone: company.contactPhone ?? "",
                                mail: company.contactEmail ?? ""
                              }
                            : {})
                        });
                      }
                    }}
                  />
                  <CompanyContactInfo fieldName={`intermediaries.${idx}`} />
                  {values.intermediaries.length > 1 && (
                    <button
                      type="button"
                      className="fr-btn fr-btn--tertiary fr-mb-2w"
                      onClick={() => remove(idx)}
                    >
                      Supprimer l'intermédiaire {idx + 1}
                    </button>
                  )}
                  <hr />
                </div>
              ))}
              {values.intermediaries.length < 3 && (
                // Pas plus de trois intermédiaires
                <div className="fr-grid-row fr-grid-row--right fr-mb-4w">
                  <button
                    type="button"
                    className="fr-btn fr-btn--secondary"
                    onClick={() => {
                      push(getInitialCompany());
                    }}
                  >
                    Ajouter un intermédiaire
                  </button>
                </div>
              )}
            </>
          )}
        ></FieldArray>
      )}
    </>
  );
}

export default FormikIntermediaryList;
