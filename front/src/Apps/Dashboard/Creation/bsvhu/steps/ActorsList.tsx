import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { useFormContext, useFieldArray } from "react-hook-form";
import { ZodBsvhu } from "../schema";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { formatDate } from "../../../../../common/datetime";

const ActorsList = () => {
  const { siret } = useParams<{ siret: string }>();

  const { watch, setValue } = useFormContext<ZodBsvhu>();

  const { fields, append, remove } = useFieldArray({
    name: "intermediaries"
  });

  const broker = watch("broker");
  const trader = watch("trader");
  const intermediaries = watch("intermediaries") ?? [];

  const [hasBroker, setHasBroker] = useState(!!broker?.company.siret);
  const [hasTrader, setHasTrader] = useState(!!trader?.company.siret);
  const [hasIntermediaries, setHasIntermediaries] = useState<boolean>(
    !!(intermediaries && intermediaries.length > 0)
  );

  const sealedFields = useContext(SealedFieldsContext);

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // L'émetteur est en situation irrégulière mais il a un SIRET et n'est pas inscrit sur Trackdéchets
    if (company) {
      if (!company.isRegistered) {
        return "L'entreprise n'est pas inscrite sur Trackdéchets.";
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

  const recepisseAlert = (title, actor) => (
    <Alert
      title={title}
      severity="info"
      description={
        <>
          Numéro: {actor.recepisse.number}
          <br />
          Département : {actor.recepisse.department}
          <br />
          Date limite de validité:{" "}
          {formatDate(actor.recepisse.validityLimit ?? "")}
        </>
      }
      closable={false}
    />
  );

  return (
    <>
      <h4 className="fr-h4 fr-mt-3w">Courtier</h4>

      <ToggleSwitch
        label="Présence d'un courtier"
        checked={hasBroker}
        showCheckedHint={false}
        onChange={value => {
          setHasBroker(value);
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
        }}
        disabled={sealedFields.includes(`broker.company.siret`)}
      />

      {hasBroker && (
        <div className="fr-pt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={broker?.company.siret ?? null}
            favoriteType={FavoriteType.Broker}
            selectedCompanyError={selectedCompanyError}
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

          <CompanyContactInfo
            fieldName={`broker.company`}
            name="broker"
            disabled={sealedFields.includes(`broker.company.siret`)}
            key={`broker-company-${siret}`}
          />

          {broker?.recepisse?.number &&
            recepisseAlert("Récépissé de courtage", broker)}
        </div>
      )}

      <h4 className="fr-h4 fr-mt-3w">Négociant</h4>

      <ToggleSwitch
        label="Présence d'un négociant"
        checked={hasTrader}
        showCheckedHint={false}
        onChange={value => {
          setHasTrader(value);
          setValue("trader", {
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
        }}
        disabled={sealedFields.includes(`trader.company.siret`)}
      />

      {hasTrader && (
        <div className="fr-pt-2w">
          <CompanySelectorWrapper
            orgId={siret}
            selectedCompanyOrgId={trader?.company.siret ?? null}
            favoriteType={FavoriteType.Trader}
            selectedCompanyError={selectedCompanyError}
            disabled={sealedFields.includes(`trader.company.siret`)}
            onCompanySelected={company => {
              if (company) {
                const companyData = onCompanySelected(company, trader?.company);

                setValue("trader", {
                  ...trader,
                  company: {
                    ...trader?.company,
                    ...companyData
                  },
                  recepisse: {
                    number: company.traderReceipt?.receiptNumber ?? null,
                    department: company.traderReceipt?.department ?? null,
                    validityLimit: company.traderReceipt?.validityLimit ?? null
                  }
                });
              }
            }}
          />

          <CompanyContactInfo
            fieldName={`trader.company`}
            name="trader"
            disabled={sealedFields.includes(`trader.company.siret`)}
            key={`trader-company-${siret}`}
          />

          {trader?.recepisse?.number &&
            recepisseAlert("Récépissé de négoce", trader)}
        </div>
      )}

      <h4 className="fr-h4 fr-mt-3w">Intermédiaires</h4>

      <ToggleSwitch
        label="Présence d'intermédiaires"
        checked={hasIntermediaries}
        showCheckedHint={false}
        onChange={value => {
          setHasIntermediaries(value);
          remove();
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
                  (intermediaries && intermediaries[index].siret) ?? null
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

              <CompanyContactInfo
                fieldName={`intermediaries.${index}`}
                name={`intermediaries.${index}`}
                disabled={sealedFields.includes(`intermediaries`)}
                key={`intermediaries-${index}-company-${siret}`}
              />

              <button
                className="fr-btn fr-btn--tertiary fr-mb-2w"
                onClick={() => remove(index)}
              >
                Supprimer l'intermédiaire {index + 1}
              </button>
              <hr />
            </div>
          ))}
          {fields.length < 3 && (
            <div className="fr-grid-row fr-grid-row--right">
              <button className="fr-btn fr-btn--secondary" onClick={append}>
                Ajouter un intermédiaire
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ActorsList;
