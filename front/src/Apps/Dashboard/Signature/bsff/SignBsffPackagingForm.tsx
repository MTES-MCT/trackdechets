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
import { subMonths } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type SignBsffPackagingFormProps = {
  packaging: BsffPackaging & { bsff: Bsff };
  onCancel: () => void;
  onSuccess: () => void;
};

type FormValues = UpdateBsffPackagingInput & { signature: BsffSignatureInput };

function getDefaultWeight(packaging: BsffPackaging & { bsff?: Bsff }) {
  if (packaging.bsff.packagings.length === 1 && packaging.bsff.weight?.value) {
    // Lorsqu'un seul contenant est présent sur le BSFF
    // on prend la valeur du poids total renseigné sur le BSFF lors de l'émission
    // comme valeur par défaut pour le contenant
    return packaging.bsff.weight.value;
  }
  return 0;
}

function getDefaultFormValues(
  packaging: BsffPackaging & { bsff?: Bsff }
): FormValues {
  const today = new Date();

  return {
    acceptation: {
      weight: packaging?.acceptation?.weight ?? getDefaultWeight(packaging),
      status: packaging?.acceptation?.status ?? WasteAcceptationStatus.Accepted,
      date: packaging?.acceptation?.date
        ? datetimeToYYYYMMDD(new Date(packaging.acceptation.date))
        : datetimeToYYYYMMDD(today),
      wasteCode:
        packaging?.acceptation?.wasteCode ?? packaging.bsff?.waste?.code ?? "",
      wasteDescription:
        packaging?.acceptation?.wasteDescription ??
        packaging.bsff?.waste?.description ??
        "",
      refusalReason: packaging?.acceptation?.refusalReason ?? null
    },
    operation: {
      date: packaging?.operation?.date
        ? datetimeToYYYYMMDD(new Date(packaging.operation.date))
        : datetimeToYYYYMMDD(today),
      code:
        packaging?.operation?.code ??
        packaging.bsff.destination?.plannedOperationCode ??
        BsffOperationCode.R1,
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

const acceptationSchema = z.object({
  numero: z.string({ required_error: "Champ requis" }).min(1, "Champ requis"),
  acceptation: z.object({
    weight: z
      .number({
        required_error: "Champ requis",
        invalid_type_error: "Champ requis"
      })
      .min(0),
    status: z.nativeEnum(WasteAcceptationStatus, {
      required_error: "Champ requis"
    }),
    date: z.string({ required_error: "Champ requis" }).min(1, "Champ requis"),
    wasteCode: z
      .string({ required_error: "Champ requis" })
      .min(1, "Champ requis"),
    wasteDescription: z
      .string({ required_error: "Champ requis" })
      .min(1, "Champ requis"),
    refusalReason: z.string().nullable()
  })
});

const acceptationRefinement: z.Refinement<z.infer<typeof acceptationSchema>> = (
  data,
  { addIssue }
) => {
  if (
    data.acceptation.status === WasteAcceptationStatus.Accepted &&
    data.acceptation.weight <= 0
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: "La quantité doit être supérieure à 0",
      path: ["acceptation", "weight"]
    });
  }

  if (
    data.acceptation.status === WasteAcceptationStatus.Refused &&
    data.acceptation.weight !== 0
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: "La quantité doit être à 0 en cas de refus",
      path: ["acceptation", "weight"]
    });
  }

  if (
    data.acceptation.status === WasteAcceptationStatus.Refused &&
    !data.acceptation.refusalReason
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: "Champ requis",
      path: ["acceptation", "refusalReason"]
    });
  }
};

const operationSchema = z.object({
  operation: z.object({
    date: z.string({ required_error: "Champ requis" }).min(1, "Champ requis"),
    code: z.string({ required_error: "Champ requis" }).min(1, "Champ requis"),
    mode: z.nativeEnum(OperationMode).nullable(),
    description: z
      .string({ required_error: "Champ requis" })
      .min(1, "Champ requis"),
    noTraceability: z.boolean(),
    nextDestination: z
      .object({
        plannedOperationCode: z
          .string({
            required_error: "Champ requis",
            invalid_type_error: "Champ requis"
          })
          .min(1, "Champ requis"),
        cap: z.string().nullable(),
        company: z.object({
          siret: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .length(14, "Champ requis"),
          name: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .min(1, "Champ requis"),
          address: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .min(1, "Champ requis"),
          contact: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .min(1, "Champ requis"),
          mail: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .email(),
          phone: z
            .string({
              required_error: "Champ requis",
              invalid_type_error: "Champ requis"
            })
            .min(10)
        })
      })
      .nullable()
  })
});

const signatureSchema = z.object({
  signature: z.object({
    packagingId: z
      .string({ required_error: "Champ requis" })
      .min(1, "Champ requis"),
    author: z.string({ required_error: "Champ requis" }).min(1, "Champ requis"),
    type: z.nativeEnum(BsffSignatureType, { required_error: "Champ requis" })
  })
});

function getSchema(packaging: BsffPackaging) {
  if (packaging?.operation?.signature?.date) {
    // Correction post traitement
    return acceptationSchema
      .merge(operationSchema)
      .superRefine(acceptationRefinement);
  }

  if (packaging?.acceptation?.signature?.date) {
    if (packaging?.acceptation?.status === WasteAcceptationStatus.Refused) {
      // Correction d'un refus
      return acceptationSchema.superRefine(acceptationRefinement);
    } else {
      // Signature de l'opération
      return acceptationSchema
        .merge(operationSchema)
        .merge(signatureSchema)
        .superRefine(acceptationRefinement);
    }
  }

  // Signature de l'acceptation
  return acceptationSchema
    .merge(signatureSchema)
    .superRefine(acceptationRefinement);
}

function getSignatureType(packaging: BsffPackaging): BsffSignatureType | null {
  if (
    packaging?.operation?.signature?.date ||
    packaging?.acceptation?.status === WasteAcceptationStatus.Refused
  ) {
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

  // Permet d'afficher ou non les champs du formulaire relatifs à l'opération
  const showOperation =
    packaging.acceptation?.signature?.date &&
    packaging.acceptation.status === WasteAcceptationStatus.Accepted;

  const actionBtnLabel = useMemo(() => {
    if (!!signatureType) {
      return loading ? "Signature en cours" : "Signer";
    } else {
      return loading ? "Correction en cours" : "Corriger";
    }
  }, [signatureType, loading]);

  const schema = useMemo(() => getSchema(packaging), [packaging]);

  const methods = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(schema)
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
      // Re-valide le poids et le message de refus
      // lorsque le statut d'acceptation change
      trigger("acceptation.weight");
      trigger("acceptation.refusalReason");
    }
  }, [wasteAcceptationStatus, trigger, isSubmitted]);

  const actionDescription = useMemo(() => {
    if (signatureType === BsffSignatureType.Acceptation) {
      return isAccepted ? "accepter" : "refuser";
    }
    if (signatureType === BsffSignatureType.Operation) {
      return "avoir traité";
    }
    return "";
  }, [signatureType, isAccepted]);

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
    }
  }, [isGroupement, noTraceability, setValue, unregister]);

  useEffect(() => {
    if (!hasNextDestination) {
      setValue("operation.nextDestination", null);
    }
  }, [hasNextDestination, setValue, unregister, register]);

  const onSubmit: SubmitHandler<FormValues> = async data => {
    const { signature, acceptation, operation, ...rest } = data;
    await updateBsffPackaging({
      variables: {
        id: packaging.id,
        input: {
          acceptation,
          ...(showOperation ? { operation } : {}),
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

  const today = new Date();
  const maxDate = datetimeToYYYYMMDD(today);
  const minDate = datetimeToYYYYMMDD(subMonths(today, 2));

  return (
    <FormProvider {...methods}>
      {/* Permet d'utiliser `useFormContext` dans RhfOperationModeSelect */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Select
              label="Code déchet"
              nativeSelectProps={register("acceptation.wasteCode")}
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
              nativeInputProps={register("acceptation.wasteDescription")}
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
              nativeInputProps={register("numero")}
              state={errors.numero ? "error" : "default"}
              stateRelatedMessage={errors.numero?.message}
            />
          </div>
        </div>

        {(signatureType === BsffSignatureType.Acceptation ||
          (signatureType === null &&
            packaging.acceptation?.status ===
              WasteAcceptationStatus.Refused)) && (
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
                          setValue(
                            "acceptation.weight",
                            getDefaultWeight(packaging)
                          );
                        } else {
                          setValue("acceptation.weight", 0);
                        }
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-4">
                <Input
                  label={acceptationDateLabel}
                  nativeInputProps={{
                    max: maxDate,
                    min: minDate,
                    type: "date",
                    ...register("acceptation.date")
                  }}
                  state={errors.acceptation?.date ? "error" : "default"}
                  stateRelatedMessage={errors.acceptation?.date?.message}
                />
              </div>
            </div>
            {isRefused && (
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <Input
                    label="Motif du refus"
                    nativeTextAreaProps={{
                      ...register("acceptation.refusalReason")
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
          </>
        )}
        {isAccepted && (
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-4">
              <NonScrollableInput
                label="Quantité de fluide présentée en kg"
                hintText="pour les installations d'entreposage ou de reconditionnement, la quantité peut être estimée"
                disabled={isRefused}
                nativeInputProps={{
                  ...register("acceptation.weight", {
                    valueAsNumber: true
                  }),
                  type: "number",
                  inputMode: "decimal",
                  step: "0.001" // grammes
                }}
                state={errors.acceptation?.weight ? "error" : "default"}
                stateRelatedMessage={errors.acceptation?.weight?.message}
              />
              {acceptationWeight > 0 && (
                <p className="fr-info-text fr-mt-5v">
                  Soit{" "}
                  {new Decimal(acceptationWeight).dividedBy(1000).toFixed(4)} t
                </p>
              )}
            </div>
          </div>
        )}

        {
          // signature du traitement ou correction
          showOperation && (
            <>
              <h6 className="fr-h6">Traitement</h6>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12 fr-col-md-4">
                  <Input
                    label="Date du traitement"
                    nativeInputProps={{
                      max: maxDate,
                      min: minDate,
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
              document, je déclare {actionDescription} le contenant.
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
