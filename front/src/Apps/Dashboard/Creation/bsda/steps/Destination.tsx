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
import React, { useContext, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import { getInitialCompany } from "../../../../common/data/initialState";
import { COMPANY_SELECTOR_PRIVATE_INFOS } from "../../../../common/queries/company/query";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError, setFieldError } from "../../utils";
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
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext(); // retrieve all hook methods
  const actor = "destination";
  const destination = watch(actor) ?? {};
  const bsdaType = watch("type");

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
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.contact`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.mail`);
    register(`${actor}.transport.plates`);
  }, [register]);

  useEffect(() => {
    if (errors?.length) {
      setFieldError(
        errors,
        `${actor}.company.siret`,
        formState.errors?.[actor]?.["company"]?.siret,
        setError
      );
      if (!destination?.company?.contact) {
        setFieldError(
          errors,
          `${actor}.company.contact`,
          formState.errors?.[actor]?.["company"]?.contact,
          setError
        );
      }
      if (!destination?.company?.address) {
        setFieldError(
          errors,
          `${actor}.company.address`,
          formState.errors?.[actor]?.["company"]?.address,
          setError
        );
      }
      if (!destination?.company?.phone) {
        setFieldError(
          errors,
          `${actor}.company.phone`,
          formState.errors?.[actor]?.["company"]?.phone,
          setError
        );
      }
      if (!destination?.company?.mail) {
        setFieldError(
          errors,
          `${actor}.company.mail`,
          formState.errors?.[actor]?.["company"]?.mail,
          setError
        );
      }
      if (!destination?.company?.vatNumber) {
        setFieldError(
          errors,
          `${actor}.company.vatNumber`,
          formState.errors?.[actor]?.["company"]?.vatNumber,
          setError
        );
      }
      if (!destination?.cap) {
        setFieldError(
          errors,
          `${actor}.cap`,
          formState.errors?.[actor]?.["cap"],
          setError
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

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

  const orgId = useMemo(
    () => destination?.company?.orgId ?? destination?.company?.siret ?? null,
    [destination?.company?.orgId, destination?.company?.siret]
  );

  const orgIdNextDestination = useMemo(
    () =>
      destination?.operation?.nextDestination?.company?.orgId ??
      destination?.operation?.nextDestination?.company?.siret ??
      null,
    [
      destination?.operation?.nextDestination?.company?.orgId,
      destination?.operation?.nextDestination?.company?.siret
    ]
  );

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
              hasNextDestination ? orgIdNextDestination : orgId
            }
            selectedCompanyError={selectedCompanyError}
            onCompanySelected={company => {
              if (company) {
                let companyData = {
                  orgId: company.orgId,
                  siret: company.siret,
                  vatNumber: company.vatNumber,
                  name: company.name ?? "",
                  address: company.address ?? "",
                  contact: company.contact ?? "",
                  phone: company.contactPhone ?? "",
                  mail: company.contactEmail ?? "",
                  country: company.codePaysEtrangerEtablissement
                };

                // [tra-13734] don't override field with api data keep the user data value
                const currentCompanySiret = hasNextDestination
                  ? destination?.operation.nextDestination.company.siret
                  : destination?.company.siret;

                if (company.siret === currentCompanySiret) {
                  companyData = {
                    orgId: company.orgId,
                    siret: company.siret,
                    vatNumber: company.vatNumber,
                    name: (destination?.company?.name ||
                      company.name) as string,
                    address: (destination?.company?.address ||
                      company.address) as string,
                    contact: destination?.company?.contact,
                    phone: destination?.company?.phone,
                    mail: destination?.company?.mail,
                    country: company.codePaysEtrangerEtablissement
                  };
                }

                if (errors?.length) {
                  // server errors
                  clearCompanyError(destination, "destination", clearErrors);
                }

                if (!hasNextDestination) {
                  setValue("destination.company", {
                    ...destination.company,
                    ...companyData
                  });
                } else {
                  setValue("destination.operation", {
                    nextDestination: {
                      company: { ...destination.company, ...companyData }
                    }
                  });
                }
              }
            }}
          />

          {!destination?.company?.siret &&
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
            key={orgId}
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
                formState.errors.destination?.["cap"] ? "error" : "default"
              }
              stateRelatedMessage={
                formState.errors.destination?.["cap"]?.message
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

        {(destination?.operation?.nextDestination?.company as string) ===
          "D 9 F" ||
          ((destination?.plannedOperationCode as string) === "D 9 F" && (
            <p className="fr-mb-0 fr-info-text">Pour un traitement final</p>
          ))}
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
                  selectedCompanyOrgId={orgId}
                  selectedCompanyError={selectedCompanyError}
                  onCompanySelected={company => {
                    if (company) {
                      let companyData = {
                        orgId: company.orgId,
                        siret: company.siret,
                        vatNumber: company.vatNumber,
                        name: company.name ?? "",
                        address: company.address ?? "",
                        contact: company.contact ?? "",
                        phone: company.contactPhone ?? "",
                        mail: company.contactEmail ?? "",
                        country: company.codePaysEtrangerEtablissement
                      };

                      // [tra-13734] don't override field with api data keep the user data value
                      if (company.siret === destination?.company?.siret) {
                        companyData = {
                          orgId: company.orgId,
                          siret: company.siret,
                          vatNumber: company.vatNumber,
                          name: (destination?.company?.name ||
                            company.name) as string,
                          address: (destination?.company?.address ||
                            company.address) as string,
                          contact: destination?.company?.contact,
                          phone: destination?.company?.phone,
                          mail: destination?.company?.mail,
                          country: company.codePaysEtrangerEtablissement
                        };
                      }

                      if (errors?.length) {
                        // server errors
                        clearCompanyError(
                          destination,
                          "destination",
                          clearErrors
                        );
                      }

                      setValue("destination", {
                        ...destination,
                        company: {
                          ...destination.company,
                          ...companyData
                        }
                      });
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
                  key={orgId}
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
