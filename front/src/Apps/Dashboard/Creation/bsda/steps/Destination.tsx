import { useLazyQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import {
  BsdaStatus,
  BsdaType,
  CompanySearchResult,
  CompanyType,
  FavoriteType,
  Query,
  QueryCompanyPrivateInfosArgs
} from "@td/codegen-ui";
import React, { useContext, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import { getInitialCompany } from "../../../../common/data/initialState";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../../../common/queries/company/query";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError } from "../../utils";
import { BsdaContext } from "../FormSteps";

const DestinationCAPModificationAlert = () => (
  <div className="fr-alert fr-alert--info fr-my-4v">
    <p>
      En cas de modification de la mention CAP de l'exutoire, le producteur en
      sera informé par courriel.
    </p>
  </div>
);

const showCAPModificationAlert = bsdaContext => {
  return (
    bsdaContext?.status !== BsdaStatus.Initial &&
    Boolean(bsdaContext?.worker?.company?.siret) &&
    Boolean(bsdaContext?.destination?.company?.siret)
  );
};

const showDestinationCAPModificationAlert = bsdaContext => {
  return (
    !bsdaContext?.nextDestination?.siret &&
    showCAPModificationAlert(bsdaContext)
  );
};

const showNextDestinationCAPModificationAlert = bsdaContext => {
  return (
    Boolean(bsdaContext?.nextDestination?.siret) &&
    showCAPModificationAlert(bsdaContext)
  );
};

const DestinationBsda = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const bsdaType = watch("type");
  const destination = watch("destination");

  const bsdaContext = useContext(BsdaContext);
  const hasNextDestination = Boolean(
    destination?.operation?.nextDestination?.company
  );
  const isDechetterie = bsdaType === BsdaType.Collection_2710;
  const sealedFields = useContext(SealedFieldsContext);

  const [getCompanyQuery, { data: dataCompany }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS);

  useEffect(() => {
    if (isDechetterie) {
      getCompanyQuery({
        variables: { clue: siret! }
      });

      if (
        dataCompany?.companyPrivateInfos?.companyTypes?.includes(
          CompanyType.WasteCenter
        )
      ) {
        const company = dataCompany?.companyPrivateInfos;
        setValue("destination.company", {
          orgId: company?.orgId,
          siret: company?.siret,
          name: company?.name,
          address: company?.address,
          contact: destination?.company?.contact || company?.contact,
          mail: destination?.company?.mail || company?.contactEmail,
          phone: destination?.company?.phone || company?.contactPhone,
          vatNumber: company?.vatNumber,
          country: company?.codePaysEtrangerEtablissement
        });
      }
    }
  }, [
    isDechetterie,
    setValue,
    dataCompany?.companyPrivateInfos,
    getCompanyQuery,
    siret,
    destination?.company?.contact,
    destination?.company?.mail,
    destination?.company?.phone
  ]);

  const destinationOrgId =
    destination?.company?.orgId ?? destination?.company?.siret ?? null;
  const nextDestinationOrgId =
    destination?.operation?.nextDestination?.company?.orgId ??
    destination?.operation?.nextDestination?.company?.siret ??
    null;

  function onNextDestinationToggle() {
    // When we toggle the next destination switch, we swap destination <-> nextDestination
    // That's because the final destination is always displayed first:
    // - when it's a "simple" bsda, `destination.company` is displayed at the top
    // - otherwise, `destination.operation.nextDestination` is displayed first
    if (hasNextDestination) {
      const { company, cap, plannedOperationCode } =
        destination?.operation?.nextDestination ?? {};
      setValue("destination", {
        company,
        cap,
        plannedOperationCode,
        operation: {
          ...destination?.operation,
          nextDestination: null
        }
      });
    } else {
      const { company, cap, plannedOperationCode } = destination ?? {};
      setValue("destination", {
        company: getInitialCompany(),
        cap: "",
        plannedOperationCode: "",
        operation: {
          ...destination?.operation,
          nextDestination: {
            company,
            cap,
            plannedOperationCode
          }
        }
      });
    }
  }

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // Le destinatiare doit être inscrit
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets, il ne peut pas être ajouté sur le bordereau.";
      } else if (
        !company.companyTypes?.filter(
          type =>
            type === CompanyType.Collector ||
            type === CompanyType.Wasteprocessor
        ).length
      ) {
        return `L'installation de destination ou d'entreposage ou de reconditionnement avec le SIRET ${company.siret} n'est pas inscrite
          sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc
          pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il
          modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`;
      } else if (formState.errors?.destination?.["company"]?.siret?.message) {
        return formState.errors?.destination?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  return (
    <div className="fr-col-md-10">
      {!!sealedFields.length && <DisabledParagraphStep />}
      {isDechetterie && !hasNextDestination ? (
        <div className="form__row">
          <Alert
            title=""
            description="Vous effectuez une collecte en déchèterie. Il n'y a pas de
            destination à saisir, votre entreprise a été automatiquement
            sélectionnée."
            severity="info"
          />
          <div className="form__row">
            <Input
              label="Personne à contacter"
              nativeInputProps={{
                ...register("destination.company.contact")
              }}
              disabled={sealedFields.includes(`destination.company.contact`)}
            />
          </div>
          <div className="form__row">
            <Input
              label="Téléphone"
              nativeInputProps={{
                ...register("destination.company.phone")
              }}
              disabled={sealedFields.includes(`destination.company.phone`)}
            />
          </div>
          <div className="form__row">
            <Input
              label="Courriel"
              nativeInputProps={{
                ...register("destination.company.mail")
              }}
              disabled={sealedFields.includes(`destination.company.mail`)}
            />
          </div>
        </div>
      ) : (
        <>
          <h4 className="fr-h4">Exutoire</h4>
          <CompanySelectorWrapper
            orgId={siret}
            favoriteType={
              hasNextDestination
                ? FavoriteType.NextDestination
                : FavoriteType.Destination
            }
            disabled={sealedFields.includes(
              `${
                hasNextDestination
                  ? "destination.operation.nextDestination.company"
                  : "destination.company.siret"
              }`
            )}
            selectedCompanyOrgId={
              hasNextDestination ? nextDestinationOrgId : destinationOrgId
            }
            selectedCompanyError={selectedCompanyError}
            onCompanySelected={company => {
              if (!company) {
                return;
              }
              // [tra-13734] don't override field with api data keep the user data value
              const currentCompany = hasNextDestination
                ? destination?.operation.nextDestination.company
                : destination?.company;
              const companyValuesToUse =
                company.siret === currentCompany?.siret ? currentCompany : null;

              const companyData = {
                orgId: company.orgId,
                siret: company.siret,
                vatNumber: company.vatNumber,
                name: companyValuesToUse?.name ?? company.name ?? "",
                address: companyValuesToUse?.address ?? company.address ?? "",
                contact: companyValuesToUse?.contact ?? company.contact ?? "",
                phone: companyValuesToUse?.phone ?? company.contactPhone ?? "",
                mail: companyValuesToUse?.mail ?? company.contactEmail ?? "",
                country: company.codePaysEtrangerEtablissement
              };

              const name = hasNextDestination
                ? "destination.operation.nextDestination.company"
                : "destination.company";
              if (errors?.length && company.siret !== currentCompany?.siret) {
                // server errors
                clearCompanyError(destination, name, clearErrors);
              }

              setValue(name, companyData);
            }}
          />

          {hasNextDestination
            ? !destination?.operation?.nextDestination?.company?.siret &&
              formState.errors?.destination?.["operation"]?.nextDestination?.[
                "company"
              ]?.siret && (
                <p className="fr-text--sm fr-error-text fr-mb-4v">
                  {
                    formState.errors?.destination?.["operation"]
                      ?.nextDestination?.["company"]?.siret?.message
                  }
                </p>
              )
            : !destination?.company?.siret &&
              formState.errors?.destination?.["company"]?.siret && (
                <p className="fr-text--sm fr-error-text fr-mb-4v">
                  {formState.errors?.destination?.["company"]?.siret?.message}
                </p>
              )}

          <CompanyContactInfo
            fieldName={
              hasNextDestination
                ? "destination.operation.nextDestination.company"
                : "destination.company"
            }
            errorObject={
              hasNextDestination
                ? formState.errors?.destination?.["operation"]
                    ?.nextDestination?.["company"]
                : formState.errors?.destination?.["company"]
            }
            disabled={sealedFields.includes(
              hasNextDestination
                ? "destination.operation.nextDestination.company"
                : "destination.company"
            )}
            key={destinationOrgId}
          />

          <div className="form__row">
            <Input
              label="CAP"
              nativeInputProps={{
                ...register(
                  hasNextDestination
                    ? "destination.operation.nextDestination.cap"
                    : "destination.cap"
                )
              }}
              disabled={
                hasNextDestination
                  ? false
                  : sealedFields.includes(
                      `destination.operation.nextDestination.cap`
                    )
              }
              state={
                hasNextDestination
                  ? formState.errors.destination?.["operation"]
                      ?.nextDestination?.["cap"]
                    ? "error"
                    : "default"
                  : formState.errors.destination?.["cap"]
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={
                hasNextDestination
                  ? formState.errors.destination?.["operation"]
                      ?.nextDestination?.["cap"]?.message
                  : formState.errors.destination?.["cap"]?.message
              }
            />
            {showDestinationCAPModificationAlert(bsdaContext) && (
              <DestinationCAPModificationAlert />
            )}
          </div>
        </>
      )}
      <div className="form__row">
        <Select
          className="fr-mt-1v fr-mb-1v"
          label="Opération d'élimination / valorisation prévue (code D/R)"
          state={
            !hasNextDestination
              ? formState.errors.destination?.["plannedOperationCode"]
                ? "error"
                : "default"
              : formState.errors.destination?.["operation"]?.nextDestination?.[
                  "plannedOperationCode"
                ]
              ? "error"
              : "default"
          }
          stateRelatedMessage={
            hasNextDestination
              ? formState.errors.destination?.["operation"]?.nextDestination?.[
                  "plannedOperationCode"
                ]?.message
              : formState.errors.destination?.["plannedOperationCode"]?.message
          }
          nativeSelectProps={{
            ...register(
              hasNextDestination
                ? "destination.operation.nextDestination.plannedOperationCode"
                : "destination.plannedOperationCode"
            )
          }}
          disabled={
            hasNextDestination
              ? false
              : sealedFields.includes(
                  "destination.operation.nextDestination.plannedOperationCode"
                )
          }
        >
          <option value="">Sélectionnez une valeur</option>
          {isDechetterie && !hasNextDestination ? (
            <>
              <option value="R 13">
                R 13 - Opérations de transit incluant le groupement sans
                transvasement préalable à R 5
              </option>
              <option value="D 15">
                D 15 - Transit incluant le groupement sans transvasement
              </option>
            </>
          ) : (
            <>
              <option value="R 5">
                R 5 - Recyclage ou récupération d'autres matières inorganiques
                (dont vitrification)
              </option>
              <option value="D 5">
                D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
              </option>
              <option value="D 9 F">
                D 9 F - Traitement chimique ou prétraitement (dont
                vitrification)
              </option>
            </>
          )}
        </Select>

        {((destination?.operation?.nextDestination
          ?.plannedOperationCode as string) === "D 9 F" ||
          (destination?.plannedOperationCode as string) === "D 9 F") && (
          <p className="fr-mb-0 fr-info-text">Pour un traitement final</p>
        )}
      </div>

      <div className="fr-mt-4w">
        {bsdaType !== BsdaType.Collection_2710 && (
          <div className="fr-mt-6w">
            <div className="form__row">
              <SingleCheckbox
                options={[
                  {
                    label:
                      "Je souhaite ajouter une installation intermédiaire de transit ou de groupement d'amiante",
                    nativeInputProps: {
                      onChange: onNextDestinationToggle,
                      checked: hasNextDestination
                    }
                  }
                ]}
                disabled={sealedFields.includes(
                  `destination.operation.nextDestination`
                )}
              />
            </div>

            {hasNextDestination && (
              <>
                <h4 className="fr-h4 fr-mt-2w">Installation intermédiaire</h4>
                <CompanySelectorWrapper
                  orgId={siret}
                  favoriteType={FavoriteType.NextDestination}
                  disabled={sealedFields.includes(`destination.company.siret`)}
                  selectedCompanyOrgId={destinationOrgId}
                  selectedCompanyError={selectedCompanyError}
                  onCompanySelected={company => {
                    if (company) {
                      // [tra-13734] don't override field with api data keep the user data value
                      const companyValuesToUse =
                        company.siret === destination?.company?.siret
                          ? destination?.company
                          : null;

                      const companyData = {
                        orgId: company.orgId,
                        siret: company.siret,
                        vatNumber: company.vatNumber,
                        name: companyValuesToUse?.name ?? company.name ?? "",
                        address:
                          companyValuesToUse?.address ?? company.address ?? "",
                        contact:
                          companyValuesToUse?.contact ?? company.contact ?? "",
                        phone:
                          companyValuesToUse?.phone ??
                          company.contactPhone ??
                          "",
                        mail:
                          companyValuesToUse?.mail ??
                          company.contactEmail ??
                          "",
                        country: company.codePaysEtrangerEtablissement
                      };

                      if (errors?.length) {
                        // server errors
                        clearCompanyError(
                          destination,
                          "destination",
                          clearErrors
                        );
                      }

                      setValue("destination.company", companyData);
                    }
                  }}
                />
                {!destination?.company?.siret &&
                  formState.errors?.destination?.["company"]?.siret && (
                    <p className="fr-text--sm fr-error-text fr-mb-4v">
                      {
                        formState.errors?.destination?.["company"]?.siret
                          ?.message
                      }
                    </p>
                  )}
                <CompanyContactInfo
                  fieldName={"destination.company"}
                  errorObject={formState.errors?.destination?.["company"]}
                  disabled={sealedFields.includes(`destination.company.siret`)}
                  key={destinationOrgId}
                />

                <div className="form__row">
                  <Input
                    label="CAP (optionnel)"
                    nativeInputProps={{
                      ...register("destination.cap")
                    }}
                    disabled={
                      hasNextDestination
                        ? false
                        : sealedFields.includes(`destination.cap`)
                    }
                  />

                  {showNextDestinationCAPModificationAlert(bsdaContext) && (
                    <DestinationCAPModificationAlert />
                  )}
                </div>

                <div className="form__row">
                  <Select
                    label="Opération d'élimination / valorisation prévue (code D/R)"
                    nativeSelectProps={{
                      ...register("destination.plannedOperationCode")
                    }}
                    disabled={sealedFields.includes(
                      "destination.plannedOperationCode"
                    )}
                    state={
                      formState.errors.destination?.["plannedOperationCode"]
                        ? "error"
                        : "default"
                    }
                    stateRelatedMessage={
                      formState.errors.destination?.["plannedOperationCode"]
                        ?.message
                    }
                  >
                    <option value="">Sélectionnez une valeur</option>
                    <option value="R 13">
                      R 13 - Opérations de transit incluant le groupement sans
                      transvasement préalable à R 5
                    </option>
                    <option value="D 15">
                      D 15 - Transit incluant le groupement sans transvasement
                    </option>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationBsda;
