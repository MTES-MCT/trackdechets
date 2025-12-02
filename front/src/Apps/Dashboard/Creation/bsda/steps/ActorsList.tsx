import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { useFormContext, useFieldArray } from "react-hook-form";
import { ZodBsda } from "../schema";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { CompanySearchResult, CompanyType, FavoriteType } from "@td/codegen-ui";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { getInitialCompany } from "../../../../common/data/initialState";
import Recepisse from "../../../Components/Recepisse/Recepisse";

const ActorsList = () => {
  const { siret } = useParams<{ siret: string }>();

  const {
    watch,
    setValue,
    formState: { errors },
    clearErrors
  } = useFormContext<ZodBsda>();

  const { fields, append, remove } = useFieldArray({
    name: "intermediaries"
  });

  const hasBroker = watch("hasBroker");
  const hasIntermediaries = watch("hasIntermediaries");

  const broker = watch("broker");
  const intermediaries = watch("intermediaries") ?? [];

  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    if (broker?.company?.siret && !hasBroker) {
      setValue("hasBroker", true);
    }

    if (
      intermediaries?.length &&
      intermediaries[0]?.siret &&
      !hasIntermediaries
    ) {
      setValue("hasIntermediaries", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCompanyError = (
    company?: CompanySearchResult,
    type?: CompanyType
  ) => {
    // L'émetteur est en situation irrégulière mais il a un SIRET et n'est pas inscrit sur Trackdéchets
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets.";
      }
    }

    if (company && type) {
      if (!company.companyTypes?.includes(type)) {
        return `Cet établissement n'a pas le profil ${
          type === CompanyType.Broker ? "Courtier" : "requis"
        }.`;
      }
    }

    return null;
  };

  const onCompanySelected = (company: CompanySearchResult, actorCompany) => {
    let companyData = {
      siret: company.siret,
      name: company.name ?? "",
      contact: company.contact ?? "",
      phone: company.contactPhone ?? "",
      mail: company.contactEmail ?? "",
      address: company.address ?? ""
    };

    // [tra-13734] don't override field with api data keep the user data value
    if (company.siret === actorCompany?.siret) {
      companyData = {
        siret: company.siret,
        name: (actorCompany?.name || company.name) as string,
        contact: (actorCompany?.contact || company.contact) as string,
        phone: (actorCompany?.phone || company.contactPhone) as string,
        mail: (actorCompany?.mail || company.contactEmail) as string,
        address: (actorCompany?.address || company.address) as string
      };
    }

    return companyData;
  };

  return (
    <div className="fr-col-md-10">
      <h4 className="fr-h4">Courtier</h4>

      <ToggleSwitch
        label="Présence d'un courtier"
        checked={!!hasBroker}
        showCheckedHint={false}
        onChange={value => {
          setValue("hasBroker", value);
          setValue("broker", {
            company: {
              siret: null,
              name: "",
              contact: null,
              phone: null,
              mail: null,
              address: null
            },
            recepisse: {
              number: null,
              department: null,
              validityLimit: null
            }
          });
          clearErrors(["hasBroker", "broker"]);
        }}
        disabled={sealedFields.includes(`broker.company.siret`)}
      />

      {hasBroker && (
        <div className="fr-pt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={broker?.company?.siret ?? null}
            favoriteType={FavoriteType.Broker}
            selectedCompanyError={company =>
              selectedCompanyError(company, CompanyType.Broker)
            }
            disabled={sealedFields.includes(`broker.company.siret`)}
            onCompanySelected={company => {
              if (company) {
                const companyData = onCompanySelected(company, broker?.company);

                setValue("broker", {
                  ...broker,
                  company: {
                    ...broker?.company,
                    ...companyData
                  },
                  recepisse: {
                    number: company.brokerReceipt?.receiptNumber ?? null,
                    department: company.brokerReceipt?.department ?? null,
                    validityLimit: company.brokerReceipt?.validityLimit ?? null
                  }
                });
              }
            }}
          />
          {errors.hasBroker && errors.hasBroker.message && (
            <p className="fr-text--sm fr-error-text fr-mb-4v">
              {errors?.hasBroker.message}
            </p>
          )}

          <CompanyContactInfo
            fieldName={`broker.company`}
            errorObject={errors.broker?.company}
            disabled={sealedFields.includes(`broker.company.siret`)}
            key={`broker-company-${siret}`}
          />

          {broker?.recepisse?.number && (
            <Recepisse
              title="Récépissé de courtage"
              numero={broker.recepisse?.number}
              departement={broker.recepisse?.department}
              validityLimit={broker.recepisse?.validityLimit}
            />
          )}
        </div>
      )}

      <h4 className="fr-h4 fr-mt-3w">Intermédiaires</h4>

      <ToggleSwitch
        label="Présence d'intermédiaires"
        checked={!!hasIntermediaries}
        showCheckedHint={false}
        onChange={value => {
          setValue("hasIntermediaries", value);
          remove();
          setValue("intermediaries", [getInitialCompany()]);
          clearErrors(["hasIntermediaries", "intermediaries"]);
        }}
        disabled={sealedFields.includes(`intermediaries`)}
      />

      {hasIntermediaries && (
        <>
          {fields.map((field, index) => (
            <div className={`${index === 0 ? "fr-pt-2w" : ""}`} key={field.id}>
              <h5 className="fr-h6">Intermédiaire {index + 1}</h5>

              <CompanySelectorWrapper
                orgId={siret}
                selectedCompanyOrgId={
                  (intermediaries && intermediaries[index]?.siret) ?? null
                }
                selectedCompanyError={selectedCompanyError}
                disabled={sealedFields.includes(`intermediaries`)}
                onCompanySelected={company => {
                  if (company) {
                    const companyData = onCompanySelected(
                      company,
                      intermediaries[index]
                    );

                    setValue(`intermediaries.${index}`, {
                      ...companyData
                    });
                  }
                }}
              />
              {errors.hasIntermediaries && errors.hasIntermediaries.message && (
                <p className="fr-text--sm fr-error-text fr-mb-4v">
                  {errors.hasIntermediaries.message}
                </p>
              )}

              <CompanyContactInfo
                fieldName={`intermediaries.${index}`}
                errorObject={errors.intermediaries?.[index]}
                disabled={sealedFields.includes(`intermediaries`)}
                key={`intermediaries-${index}-company-${siret}`}
              />

              {fields.length > 1 && (
                <button
                  type="button"
                  className="fr-btn fr-btn--tertiary fr-mb-2w"
                  onClick={() => remove(index)}
                >
                  Supprimer l'intermédiaire {index + 1}
                </button>
              )}
              <hr />
            </div>
          ))}
          {fields.length < 3 && (
            <div className="fr-grid-row fr-grid-row--right">
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                onClick={() => {
                  append(getInitialCompany());
                }}
              >
                Ajouter un intermédiaire
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActorsList;
