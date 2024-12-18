import React, { useEffect, useMemo } from "react";
import {
  Bsff,
  BsffOperationCode,
  BsffPackaging,
  BsffSignatureInput,
  BsffSignatureType,
  BsffType,
  CompanyInput,
  CompanySearchResult,
  FavoriteType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffPackagingArgs,
  OperationMode,
  UpdateBsffPackagingInput,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import {
  useForm,
  SubmitHandler,
  Controller,
  FormProvider
} from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { UPDATE_BSFF_PACKAGING } from "./queries";
import { SIGN_BSFF } from "../../../common/queries/bsff/queries";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
import { BSFF_WASTES } from "@td/constants";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import Decimal from "decimal.js";
import { OPERATION } from "../../../../form/bsff/utils/constants";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import RhfOperationModeSelect from "../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";

type SignBsffPackagingFormProps = {
  packaging: BsffPackaging & { bsff?: Bsff };
  onCancel: () => void;
  onSuccess: () => void;
};

type FormValues = UpdateBsffPackagingInput & { signature: BsffSignatureInput };

function getDefaultFormValues(
  packaging: BsffPackaging & { bsff?: Bsff }
): FormValues {
  return {
    acceptation: {
      weight: packaging?.acceptation?.weight ?? 0,
      status: packaging?.acceptation?.status ?? WasteAcceptationStatus.Accepted,
      date: packaging?.acceptation?.date
        ? datetimeToYYYYMMDD(new Date(packaging.acceptation.date))
        : "",
      wasteCode:
        packaging?.acceptation?.wasteCode ?? packaging.bsff?.waste?.code ?? "",
      wasteDescription:
        packaging?.acceptation?.wasteDescription ??
        packaging.bsff?.waste?.description ??
        "",
      refusalReason: null
    },
    operation: {
      date: packaging?.operation?.date
        ? datetimeToYYYYMMDD(new Date(packaging.operation.date))
        : "",
      code: packaging?.operation?.code ?? BsffOperationCode.R1,
      mode: packaging?.operation?.mode ?? OperationMode.Elimination,
      description: packaging?.operation?.description ?? "",
      noTraceability: packaging?.operation?.noTraceability ?? false,
      nextDestination: packaging?.operation?.nextDestination ?? null
    },
    numero: packaging.numero,
    signature: {
      packagingId: packaging.id,
      author: "",
      type: BsffSignatureType.Acceptation
    }
  };
}

function getSignatureType(packaging: BsffPackaging): BsffSignatureType | null {
  if (packaging?.operation?.signature?.date) {
    return null;
  }
  if (packaging?.acceptation?.signature?.date) {
    return BsffSignatureType.Operation;
  }
  return BsffSignatureType.Acceptation;
}

function isGroupementFn(operationCode: BsffOperationCode) {
  return OPERATION[operationCode]?.successors.includes(BsffType.Groupement);
}

function hasNextDestinationFn(
  operationCode: BsffOperationCode,
  noTraceability: boolean
) {
  return OPERATION[operationCode]?.successors?.length > 0 && !noTraceability;
}

// Permet de convertir le résultat d'une recherche obtenue
// dans le CompanySelect vers un input GraphQL
function toCompanyInput(company: CompanySearchResult): CompanyInput {
  return {
    siret: company.siret,
    vatNumber: company.vatNumber,
    name: company.name,
    address: company.address,
    contact: company.contact,
    mail: company.contactEmail,
    phone: company.contactPhone
  };
}

function SignBsffPackagingForm({
  packaging,
  onCancel,
  onSuccess
}: SignBsffPackagingFormProps) {
  const { siret } = useParams<{ siret: string }>();

  const [updateBsffPackaging, updateBsffPackagingResult] = useMutation<
    Pick<Mutation, "updateBsffPackaging">,
    MutationUpdateBsffPackagingArgs
  >(UPDATE_BSFF_PACKAGING);

  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const loading = updateBsffPackagingResult.loading || signBsffResult.loading;
  const error = updateBsffPackagingResult.error ?? signBsffResult.error;

  const defaultValues = useMemo(
    () => getDefaultFormValues(packaging),
    [packaging]
  );

  const signatureType = useMemo(() => getSignatureType(packaging), [packaging]);
  const actionBtnLabel = useMemo(() => {
    if (!!signatureType) {
      return "Signer";
    }
    return "Corriger";
  }, [signatureType]);

  const methods = useForm<FormValues>({
    defaultValues
  });

  const {
    register,
    unregister,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitted }
  } = methods;

  const wasteAcceptationStatus = watch("acceptation.status");
  const isRefused = wasteAcceptationStatus === WasteAcceptationStatus.Refused;
  const isAccepted = !isRefused;

  useEffect(() => {
    if (isSubmitted) {
      // Les messages d'erreur de ces deux champs
      // dépendent de la valeur du statut d'acceptation
      trigger("acceptation.weight");
      trigger("acceptation.refusalReason");
    }
  }, [wasteAcceptationStatus, trigger, isSubmitted]);

  const acceptationWeight = watch("acceptation.weight");

  const operationCode = watch("operation.code");
  const noTraceability = watch("operation.noTraceability");
  const nextDestination = watch("operation.nextDestination");

  const isGroupement = useMemo(
    () => isGroupementFn(operationCode),
    [operationCode]
  );
  const hasNextDestination = useMemo(
    () => hasNextDestinationFn(operationCode, noTraceability ?? false),
    [operationCode, noTraceability]
  );

  useEffect(() => {
    if (!isGroupement && noTraceability) {
      // La rupture de traçabilité n'a de sens qu'en cas de groupement
      setValue("operation.noTraceability", false);
      unregister("operation.noTraceability");
    }
  }, [isGroupement, noTraceability, setValue, unregister]);

  useEffect(() => {
    if (!hasNextDestination && nextDestination) {
      setValue("operation.nextDestination", null);
      unregister("operation.nextDestination");
    }
    if (hasNextDestination) {
      register("operation.nextDestination.company.siret", {
        required: "Vous devez choisir une destination ultérieure"
      });
    }
  }, [hasNextDestination, nextDestination, setValue, unregister, register]);

  const onSubmit: SubmitHandler<FormValues> = async data => {
    const { signature, acceptation, operation, ...rest } = data;
    await updateBsffPackaging({
      variables: {
        id: packaging.id,
        input: {
          acceptation,
          // On exclut les données de l'opération lors de la signature de l'acceptation
          ...(signatureType === BsffSignatureType.Acceptation
            ? {}
            : { operation }),
          ...rest
        }
      }
    });
    if (signatureType) {
      await signBsff({
        variables: {
          id: packaging.bsff.id,
          input: {
            ...signature,
            type: signatureType,
            date: new Date().toISOString()
          }
        }
      });
    }
    onSuccess();
  };

  const acceptationDateLabel =
    wasteAcceptationStatus === WasteAcceptationStatus.Accepted
      ? "Date de l'acceptation"
      : "Date du refus";

  const maxDate = datetimeToYYYYMMDD(new Date());

  return (
    <FormProvider {...methods}>
      {/* Permet d'utiliser `useFormContext` dans RhfOperationModeSelect */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Select
              label="Code déchet"
              nativeSelectProps={register("acceptation.wasteCode", {
                required: "Champ requis"
              })}
              state={errors.acceptation?.wasteCode ? "error" : "default"}
              stateRelatedMessage={errors.acceptation?.wasteCode?.message}
            >
              {BSFF_WASTES.map(item => (
                <option value={item.code} key={item.code}>
                  {item.code} - {item.description}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Input
              label="Description du fluide"
              nativeInputProps={register("acceptation.wasteDescription", {
                required: "Champ requis"
              })}
              state={errors.acceptation?.wasteDescription ? "error" : "default"}
              stateRelatedMessage={
                errors.acceptation?.wasteDescription?.message
              }
            />
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <Input
              label="Numéro du contenant"
              nativeInputProps={register("numero", {
                required: "Champ requis"
              })}
              state={errors.numero ? "error" : "default"}
              stateRelatedMessage={errors.numero?.message}
            />
          </div>
        </div>

        {signatureType === BsffSignatureType.Acceptation && (
          <>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <Controller
                  control={control}
                  name="acceptation.status"
                  render={({ field }) => (
                    <ToggleSwitch
                      label="Refuser le contenant"
                      inputTitle="Refuser le contenant"
                      showCheckedHint={false}
                      checked={field.value === WasteAcceptationStatus.Refused}
                      onChange={checked => {
                        const status = checked
                          ? WasteAcceptationStatus.Refused
                          : WasteAcceptationStatus.Accepted;
                        field.onChange(status);
                        if (!checked) {
                          setValue("acceptation.refusalReason", null);
                          unregister("acceptation.refusalReason");
                        } else {
                          setValue("acceptation.weight", 0);
                        }
                      }}
                    />
                  )}
                />
              </div>
            </div>
            {isRefused && (
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <Input
                    label="Motif du refus"
                    nativeTextAreaProps={{
                      ...register("acceptation.refusalReason", {
                        required: "Champ requis"
                      })
                    }}
                    textArea
                    state={
                      errors.acceptation?.refusalReason ? "error" : "default"
                    }
                    stateRelatedMessage={
                      errors.acceptation?.refusalReason?.message
                    }
                  />
                </div>
              </div>
            )}
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-4">
                <Input
                  label={acceptationDateLabel}
                  nativeInputProps={{
                    max: maxDate,
                    type: "date",
                    ...register("acceptation.date", {
                      required: "Champ requis"
                    })
                  }}
                  state={errors.acceptation?.date ? "error" : "default"}
                  stateRelatedMessage={errors.acceptation?.date?.message}
                />
              </div>
            </div>
          </>
        )}

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <NonScrollableInput
              label="Quantité de fluide présentée en kg"
              hintText="pour les installations d'entreposage ou de reconditionnement, la quantité peut être estimée"
              disabled={isRefused}
              nativeInputProps={{
                ...register("acceptation.weight", {
                  required: "Champ requis",
                  valueAsNumber: true,
                  validate: v => {
                    if (isAccepted && v <= 0) {
                      return "La quantité doit être supérieure à 0";
                    }
                    if (isRefused && v !== 0) {
                      return "La quantité doit être à 0 en cas de refus";
                    }
                  }
                }),
                type: "number",
                inputMode: "decimal",
                step: "1"
              }}
              state={errors.acceptation?.weight ? "error" : "default"}
              stateRelatedMessage={errors.acceptation?.weight?.message}
            />
            {acceptationWeight > 0 && (
              <p className="fr-info-text fr-mt-5v">
                Soit {new Decimal(acceptationWeight).dividedBy(1000).toFixed(4)}{" "}
                t
              </p>
            )}
          </div>
        </div>

        {
          // signature traitement
          (signatureType === BsffSignatureType.Operation ||
            // ou correction
            signatureType === null) && (
            <>
              <h6 className="fr-h6">Traitement</h6>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12 fr-col-md-4">
                  <Input
                    label="Date du traitement"
                    nativeInputProps={{
                      max: maxDate,
                      type: "date",
                      ...register("operation.date", {
                        required: "Champ requis"
                      })
                    }}
                    state={errors.operation?.date ? "error" : "default"}
                    stateRelatedMessage={errors.operation?.date?.message}
                  />
                </div>
              </div>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <Select
                    label="Code de l'opération de traitement"
                    nativeSelectProps={register("operation.code", {
                      required: "Champ requis"
                    })}
                    state={errors.operation?.code ? "error" : "default"}
                    stateRelatedMessage={errors.operation?.code?.message}
                  >
                    {Object.values(OPERATION).map(operation => (
                      <option key={operation.code} value={operation.code}>
                        {operation.code} - {operation.description}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <RhfOperationModeSelect
                operationCode={operationCode}
                path={"operation.mode"}
              />
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <Input
                    label="Description de l'opération réalisée"
                    nativeInputProps={register("operation.description", {
                      required: "Champ requis"
                    })}
                    state={errors.operation?.description ? "error" : "default"}
                    stateRelatedMessage={errors.operation?.description?.message}
                  />
                </div>
              </div>
              {isGroupement && (
                <div className="fr-grid-row fr-grid-row--gutters">
                  <div className="fr-col-12">
                    <Checkbox
                      options={[
                        {
                          label: (
                            <div>
                              Rupture de traçabilité autorisée par arrêté
                              préfectoral pour ce déchet. La responsabilité du
                              producteur du déchet est transférée.
                            </div>
                          ),
                          nativeInputProps: {
                            ...register("operation.noTraceability")
                          }
                        }
                      ]}
                    />
                  </div>
                </div>
              )}
              {hasNextDestination && (
                <>
                  <h6 className="fr-h6">Destination ultérieure prévue</h6>
                  <CompanySelectorWrapper
                    selectedCompanyOrgId={nextDestination?.company?.siret}
                    favoriteType={FavoriteType.NextDestination}
                    orgId={siret}
                    onCompanySelected={company => {
                      if (company) {
                        setValue(
                          "operation.nextDestination.company",
                          toCompanyInput(company),
                          { shouldValidate: isSubmitted }
                        );
                      }
                    }}
                  />
                  {errors?.operation?.nextDestination?.company?.siret && (
                    <p className="fr-text--sm fr-error-text fr-mb-4v">
                      {
                        errors?.operation?.nextDestination?.company?.siret
                          ?.message
                      }
                    </p>
                  )}
                  <CompanyContactInfo
                    fieldName="operation.nextDestination.company"
                    errorObject={errors.operation?.nextDestination?.company}
                    required={true}
                  />

                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12">
                      <Select
                        label="Code de l'opération de traitement prévu"
                        nativeSelectProps={register(
                          "operation.nextDestination.plannedOperationCode",
                          {
                            required: "Champ requis"
                          }
                        )}
                        state={
                          errors.operation?.nextDestination
                            ?.plannedOperationCode
                            ? "error"
                            : "default"
                        }
                        stateRelatedMessage={
                          errors.operation?.nextDestination
                            ?.plannedOperationCode?.message
                        }
                      >
                        {Object.values(OPERATION).map(operation => (
                          <option key={operation.code} value={operation.code}>
                            {operation.code} - {operation.description}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12">
                      <Input
                        label="CAP (optionnel)"
                        nativeInputProps={{
                          ...register("operation.nextDestination.cap")
                        }}
                      ></Input>
                    </div>
                  </div>
                </>
              )}
            </>
          )
        }

        {!!signatureType && (
          <>
            <div className="fr-mb-2w">
              En qualité de <b>destinataire du déchet</b>, j'atteste que les
              informations renseignées ci-dessus sont correctes. En signant ce
              document, je déclare{" "}
              {signatureType === BsffSignatureType.Acceptation
                ? "accpter "
                : "avoir traité "}
              le contenant.
            </div>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Nom et prénom du signataire"
                  nativeInputProps={register("signature.author", {
                    required: "Champ requis"
                  })}
                  state={errors.signature?.author ? "error" : "default"}
                  stateRelatedMessage={errors.signature?.author?.message}
                />
              </div>
            </div>
          </>
        )}

        {error && (
          <Alert
            severity="error"
            title="Erreur"
            className="fr-mt-5v"
            description={error.message}
          />
        )}
        <div className="dsfr-modal-actions">
          <Button
            disabled={isSubmitting}
            priority="secondary"
            onClick={() => {
              reset();
              onCancel();
            }}
          >
            Annuler
          </Button>
          <Button disabled={isSubmitting}>
            {loading ? "Signature en cours..." : actionBtnLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export default SignBsffPackagingForm;
