import React, { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  EmptyReturnAdr,
  CiterneNotWashedOutReason,
  Form,
  FormStatus,
  Mutation,
  MutationMarkAsAcceptedArgs,
  MutationMarkAsReceivedArgs,
  MutationMarkAsTempStoredArgs,
  MutationMarkAsTempStorerAcceptedArgs,
  Packagings,
  QuantityType,
  TransportMode
} from "@td/codegen-ui";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignForm } from "./SignForm";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { isDefinedStrict, multiplyByRounded } from "../../../../common/helper";
import Decimal from "decimal.js";
import { datetimeToYYYYMMDD } from "../BSPaoh/paohUtils";
import {
  MARK_AS_RECEIVED,
  MARK_AS_ACCEPTED,
  MARK_AS_TEMP_STORED,
  MARK_TEMP_STORER_ACCEPTED
} from "../../../common/queries/bsdd/queries";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { EMPTY_RETURN_ADR_REASON } from "../../../common/utils/adrBsddSummary";
import { CITERNE_NOT_WASHED_OUT_REASON } from "../../../common/utils/citerneBsddSummary";
import { isDangerous } from "@td/constants";

const getSchema = () =>
  z
    .object({
      wasteAcceptationStatus: z.enum(
        ["RECEIVED", "ACCEPTED", "PARTIALLY_REFUSED", "REFUSED"],
        {
          invalid_type_error: "Vous devez préciser si le déchet est accepté"
        }
      ),
      wasteRefusalReason: z.coerce.string(),

      receivedWeight: z.coerce.number().positive().nullish(),
      refusedWeight: z.coerce.number().nonnegative().nullish(),
      acceptedWeight: z.coerce.number().nonnegative().nullish(),

      quantityType: z.coerce.string().nullish(),

      emptyReturnADR: z.nativeEnum(EmptyReturnAdr).nullish(),

      hasCiterneBeenWashedOut: z.boolean().nullish(),
      citerneNotWashedOutReason: z
        .nativeEnum(CiterneNotWashedOutReason, {
          invalid_type_error: "Vous devez préciser le motif"
        })
        .nullish(),

      signedAt: z.coerce
        .date({
          required_error: "La date d'acceptation est requise",
          invalid_type_error: "La date est invalide"
        })
        .max(new Date(), { message: "La date ne peut pas être dans le futur" })
        .transform(val => val.toISOString())
        .nullish(),

      signedBy: z.coerce
        .string()
        .min(1, "Le nom et prénom du signataire sont requis")
        .nullish()
    })
    .superRefine((val, ctx) => {
      if (
        ["PARTIALLY_REFUSED", "REFUSED"].includes(val.wasteAcceptationStatus) &&
        !val.wasteRefusalReason
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["wasteRefusalReason"],

          message: `Vous devez préciser un motif de refus`
        });
      }

      if ((val.refusedWeight ?? 0) > (val.receivedWeight ?? 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refusedWeight"],

          message: `Vous ne pouvez refuser un poids supérieur au poids reçu`
        });
      }

      if (val.wasteAcceptationStatus === "PARTIALLY_REFUSED") {
        if (!val.refusedWeight && val.receivedWeight) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["refusedWeight"],

            message: `Vous devez préciser le poids refusé`
          });
        }
      }
    });

interface SignReceptionProps {
  formId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
  title: string;
}

export function SignReception({
  formId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
  title
}: Readonly<SignReceptionProps>) {
  return (
    <SignForm
      title={title}
      formId={formId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
      size="L"
    >
      {({ form, onClose }) => (
        <SignReceptionModal form={form} onCancel={onClose} />
      )}
    </SignForm>
  );
}

interface SignReceptionModalProps {
  form: Form;
  onCancel: () => void;
}

function SignReceptionModal({
  form,
  onCancel
}: Readonly<SignReceptionModalProps>) {
  const [emptyReturnStatus, setEmptyReturnStatus] = useState(false);
  const [citerneWashedOutStatus, setCiterneWashedOutStatus] = useState(false);

  const [
    markAsReceived,
    { loading: loadingMarkAsReceived, error: errorMarkAsReceived }
  ] = useMutation<Pick<Mutation, "markAsReceived">, MutationMarkAsReceivedArgs>(
    MARK_AS_RECEIVED
  );

  const [
    markAsAccepted,
    { loading: loadingMarkAsAccepted, error: errorMarkAsAccepted }
  ] = useMutation<Pick<Mutation, "markAsAccepted">, MutationMarkAsAcceptedArgs>(
    MARK_AS_ACCEPTED
  );

  const [
    markAsTempStored,
    { loading: loadingMarkAsTempStored, error: errorMarkAsTempStored }
  ] = useMutation<
    Pick<Mutation, "markAsTempStored">,
    MutationMarkAsTempStoredArgs
  >(MARK_AS_TEMP_STORED);

  const [
    markAsTempStorerAccepted,
    {
      loading: loadingMarkAsTempStorerAccepted,
      error: errorMarkAsTempStorerAccepted
    }
  ] = useMutation<
    Pick<Mutation, "markAsTempStorerAccepted">,
    MutationMarkAsTempStorerAcceptedArgs
  >(MARK_TEMP_STORER_ACCEPTED);

  const isReception = [FormStatus.Sent, FormStatus.Resent].includes(
    form.status
  );
  const isTempStorage = form.recipient?.isTempStorage;

  const onSubmit = async data => {
    const {
      wasteAcceptationStatus,
      wasteRefusalReason,
      receivedWeight,
      signedAt,
      signedBy,
      quantityType,
      refusedWeight,
      emptyReturnADR,
      hasCiterneBeenWashedOut,
      citerneNotWashedOutReason
    } = data;

    let formStatus: FormStatus | undefined = form.status;
    if (isReception) {
      if (isTempStorage && form.status === FormStatus.Sent) {
        const res = await markAsTempStored({
          variables: {
            id: form.id,
            tempStoredInfos: {
              quantityReceived: receivedWeight,
              quantityType: quantityType,
              receivedAt: signedAt,
              receivedBy: signedBy,
              signedAt: signedAt
            }
          }
        });

        formStatus = res.data?.markAsTempStored.status;
      } else {
        const res = await markAsReceived({
          variables: {
            id: form.id,
            receivedInfo: {
              quantityReceived: receivedWeight,
              receivedAt: signedAt,
              receivedBy: signedBy,
              signedAt: signedAt
            }
          }
        });

        formStatus = res.data?.markAsReceived.status;
      }
    }

    if (
      ["ACCEPTED", "REFUSED", "PARTIALLY_REFUSED"].includes(acceptationStatus)
    ) {
      if (isTempStorage && formStatus === FormStatus.TempStored) {
        await markAsTempStorerAccepted({
          variables: {
            id: form.id,
            tempStorerAcceptedInfo: {
              quantityReceived: receivedWeight,
              quantityRefused: refusedWeight,
              quantityType: quantityType,
              signedAt: signedAt,
              signedBy: signedBy,
              wasteAcceptationStatus: wasteAcceptationStatus,
              wasteRefusalReason: wasteRefusalReason
            }
          }
        });
      } else {
        await markAsAccepted({
          variables: {
            id: form.id,
            acceptedInfo: {
              quantityReceived: receivedWeight,
              quantityRefused: refusedWeight,
              signedAt: signedAt,
              signedBy: signedBy,
              wasteAcceptationStatus: wasteAcceptationStatus,
              wasteRefusalReason: wasteRefusalReason,
              ...(emptyReturnStatus
                ? {
                    emptyReturnADR: emptyReturnADR
                  }
                : {}),
              ...(citerneWashedOutStatus
                ? {
                    hasCiterneBeenWashedOut: hasCiterneBeenWashedOut,
                    citerneNotWashedOutReason: citerneNotWashedOutReason
                  }
                : {})
            }
          }
        });
      }
    }

    onCancel();
  };

  const validationSchema = getSchema();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    control,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    mode: "onTouched",
    resolver: zodResolver(validationSchema),

    defaultValues: {
      signedAt: datetimeToYYYYMMDD(new Date()),
      receivedWeight: form.stateSummary?.quantity,
      wasteAcceptationStatus: isReception ? "RECEIVED" : "ACCEPTED",
      quantityType: form.wasteDetails?.quantityType ?? QuantityType.Real
    }
  });

  const isFormValid = !Object.keys(errors ?? {}).length;

  const loading =
    loadingMarkAsReceived ||
    loadingMarkAsTempStored ||
    loadingMarkAsAccepted ||
    loadingMarkAsTempStorerAccepted;

  const acceptationStatus = watch("wasteAcceptationStatus");
  const receivedWeight = watch("receivedWeight");
  const refusedWeight = watch("refusedWeight");
  const hasCiterneBeenWashedOut = watch("hasCiterneBeenWashedOut");

  const refusedWeightDisabled =
    !receivedWeight || ["ACCEPTED", "REFUSED"].includes(acceptationStatus);

  const acceptedWeight = receivedWeight
    ? new Decimal(receivedWeight ?? 0)
        .minus(isDefinedStrict(refusedWeight) ? refusedWeight! : 0)
        .toDecimalPlaces(6)
        .toNumber()
    : 0;

  const today = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setDate(today.getDate() - 60);
  const maxDate = datetimeToYYYYMMDD(today);
  const takenOverAt = form.takenOverAt
    ? datetimeToYYYYMMDD(new Date(form.takenOverAt))
    : undefined;
  const receivedAt = form.receivedAt
    ? datetimeToYYYYMMDD(new Date(form.receivedAt))
    : undefined;
  const minDate = isReception
    ? takenOverAt
    : receivedAt ?? datetimeToYYYYMMDD(twoMonthsAgo);

  useEffect(() => {
    if (["ACCEPTED", "RECEIVED"].includes(acceptationStatus)) {
      setValue("refusedWeight", 0);
      setValue("wasteRefusalReason", "");
    }
    if (acceptationStatus === "REFUSED" && !!receivedWeight) {
      setValue("refusedWeight", receivedWeight);
    }

    if (acceptationStatus === "PARTIALLY_REFUSED" && !!receivedWeight) {
      setValue("refusedWeight", 0);
      return;
    }

    if (!emptyReturnStatus) {
      setValue("emptyReturnADR", undefined);
    }

    if (!citerneWashedOutStatus) {
      setValue("hasCiterneBeenWashedOut", undefined);
      setValue("citerneNotWashedOutReason", undefined);
    }

    if (!hasCiterneBeenWashedOut) {
      setValue("citerneNotWashedOutReason", undefined);
    }

    // manually set values do not trigger re-validation
    trigger("refusedWeight");
  }, [
    acceptationStatus,
    receivedWeight,
    citerneWashedOutStatus,
    hasCiterneBeenWashedOut,
    emptyReturnStatus,
    setValue,
    trigger
  ]);

  const receptionRadioOption = [
    {
      label: "La réception seule",
      nativeInputProps: {
        ...register("wasteAcceptationStatus", {}),
        value: "RECEIVED",
        defaultChecked: acceptationStatus === "RECEIVED"
      }
    }
  ];

  const acceptationRadioOptions = [
    ...(isReception ? receptionRadioOption : []),
    {
      label: isReception ? "La réception et l'acceptation" : "L'acceptation",

      nativeInputProps: {
        ...register("wasteAcceptationStatus", {}),
        value: "ACCEPTED",
        defaultChecked: acceptationStatus === "ACCEPTED"
      }
    },
    {
      label: isReception
        ? "La réception et un refus partiel"
        : "Le refus partiel",
      nativeInputProps: {
        ...register("wasteAcceptationStatus", {}),
        value: "PARTIALLY_REFUSED",
        defaultChecked: acceptationStatus === "PARTIALLY_REFUSED"
      }
    },
    {
      label: isReception ? "La réception et un refus total" : "Le refus total",
      nativeInputProps: {
        ...register("wasteAcceptationStatus", {}),
        value: "REFUSED",
        defaultChecked: acceptationStatus === "REFUSED"
      }
    }
  ];

  const shouldDisplayCiterneStatus =
    !(
      isTempStorage &&
      [FormStatus.TempStored, FormStatus.Sent].includes(form.status)
    ) &&
    ["ACCEPTED"].includes(acceptationStatus) &&
    form.stateSummary?.packagingInfos.some(p => p.type === Packagings.Citerne);

  const wasteIsDangerous =
    Boolean(form.wasteDetails?.isDangerous) ||
    isDangerous(form.wasteDetails?.code) ||
    Boolean(form.wasteDetails?.pop);

  const shouldDisplayAdrStatus =
    !(
      isTempStorage &&
      [FormStatus.TempStored, FormStatus.Sent].includes(form.status)
    ) &&
    ["ACCEPTED"].includes(acceptationStatus) &&
    form.stateSummary?.packagingInfos.some(
      p => p.type === Packagings.Citerne || p.type === Packagings.Benne
    ) &&
    [TransportMode.Road, undefined].includes(
      form.transporters.find(
        t => t.company?.orgId === form.currentTransporterSiret
      )?.mode as TransportMode
    ) &&
    wasteIsDangerous;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p className="fr-text fr-mb-2w">Je souhaite effectuer</p>
      <RadioButtons
        state={errors?.wasteAcceptationStatus && "error"}
        stateRelatedMessage={
          (errors?.wasteAcceptationStatus?.message as string) ?? ""
        }
        options={acceptationRadioOptions}
      />

      <h4 className="fr-h4">
        <strong>Réception</strong>
      </h4>
      <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <NonScrollableInput
            label="Poids total net en tonnes"
            className="fr-col-12"
            state={errors?.receivedWeight && "error"}
            stateRelatedMessage={
              (errors?.receivedWeight?.message as string) ?? ""
            }
            nativeInputProps={{
              inputMode: "decimal",
              step: "0.000001",
              type: "number",
              ...register("receivedWeight")
            }}
          />
          <p className="fr-text fr-text--xs" style={{ color: "#0063CB" }}>
            <span className="fr-icon-info-fill fr-mr-1w"></span>Soit{" "}
            {multiplyByRounded(receivedWeight)} kilos
          </p>
        </div>
      </div>
      {isTempStorage && form.status === FormStatus.Sent && (
        <>
          <p className="fr-text fr-mb-2w">Cette quantité est</p>
          <RadioButtons
            state={errors?.quantityType && "error"}
            stateRelatedMessage={
              (errors?.quantityType?.message as string) ?? ""
            }
            options={[
              {
                label: "Réelle",
                nativeInputProps: {
                  ...register("quantityType", {}),
                  value: "REAL",
                  defaultChecked: true
                }
              },
              {
                label: "Estimée",
                nativeInputProps: {
                  ...register("quantityType", {}),
                  value: "ESTIMATED"
                }
              }
            ]}
          />
        </>
      )}

      {["ACCEPTED", "REFUSED", "PARTIALLY_REFUSED"].includes(
        acceptationStatus
      ) && (
        <>
          <h4 className="fr-h4">
            <strong>Acceptation</strong>
          </h4>
          <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-4">
              <h6 className="fr-text--lg">
                <strong>Poids refusé</strong>
              </h6>
              <NonScrollableInput
                label="Poids total net en tonnes"
                disabled={refusedWeightDisabled}
                className="fr-col-12"
                state={errors?.refusedWeight && "error"}
                stateRelatedMessage={
                  (errors?.refusedWeight?.message as string) ?? ""
                }
                nativeInputProps={{
                  inputMode: "decimal",
                  step: "0.000001",
                  type: "number",
                  ...register("refusedWeight")
                }}
              />
              <p className="fr-text fr-text--xs" style={{ color: "#0063CB" }}>
                <span className="fr-icon-info-fill fr-mr-1w"></span>Soit{" "}
                {multiplyByRounded(refusedWeight)} kilos
              </p>
            </div>
            <div className="fr-col-12 fr-col-md-4">
              <h6 className="fr-text--lg">
                <strong>Poids accepté</strong>
              </h6>
              <NonScrollableInput
                label="Poids total net en tonnes"
                disabled
                className="fr-col-12"
                state={errors?.acceptedWeight && "error"}
                stateRelatedMessage={
                  (errors?.acceptedWeight?.message as string) ?? ""
                }
                nativeInputProps={{
                  value: acceptedWeight,
                  inputMode: "decimal",
                  step: "0.000001",
                  type: "number",
                  ...register("acceptedWeight")
                }}
              />
              <p className="fr-text fr-text--xs" style={{ color: "#0063CB" }}>
                <span className="fr-icon-info-fill fr-mr-1w"></span>Soit{" "}
                {multiplyByRounded(acceptedWeight)} kilos
              </p>
            </div>
          </div>
          {["REFUSED", "PARTIALLY_REFUSED"].includes(acceptationStatus) && (
            <Input
              label="Motif du refus"
              textArea
              className="fr-col-12"
              state={errors?.wasteRefusalReason && "error"}
              stateRelatedMessage={
                (errors?.wasteRefusalReason?.message as string) ?? ""
              }
              nativeTextAreaProps={{
                ...register("wasteRefusalReason")
              }}
            />
          )}
        </>
      )}

      {shouldDisplayCiterneStatus && (
        <>
          <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
            <div className="fr-col-12">
              <ToggleSwitch
                inputTitle="citerneWashedOutStatus"
                label={`Je décide de renseigner les informations de la Charte "Rinçage des citernes"`}
                labelPosition="right"
                showCheckedHint={false}
                checked={citerneWashedOutStatus}
                onChange={checked => setCiterneWashedOutStatus(checked)}
              />
            </div>
          </div>

          {citerneWashedOutStatus && (
            <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
              <div className="fr-col-12 fr-pl-4w">
                <Controller
                  control={control}
                  name={"hasCiterneBeenWashedOut"}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <RadioButtons
                      state={errors?.hasCiterneBeenWashedOut && "error"}
                      stateRelatedMessage={
                        (errors?.hasCiterneBeenWashedOut?.message as string) ??
                        ""
                      }
                      ref={ref}
                      options={[
                        {
                          label:
                            "Le chauffeur a indiqué avoir rincé la citerne",
                          nativeInputProps: {
                            ...register("hasCiterneBeenWashedOut", {}),
                            checked: value === true,
                            onBlur: onBlur,
                            onChange: () => onChange(true)
                          }
                        },

                        {
                          label:
                            "Le chauffeur a indiqué ne pas avoir rincé la citerne",
                          nativeInputProps: {
                            ...register("hasCiterneBeenWashedOut", {}),
                            checked: value === false,
                            onBlur: onBlur,
                            onChange: () => onChange(false)
                          }
                        }
                      ]}
                    />
                  )}
                />

                {hasCiterneBeenWashedOut === false && (
                  <RadioButtons
                    style={{ marginTop: "-16px" }}
                    className="fr-pl-4w"
                    state={errors?.citerneNotWashedOutReason && "error"}
                    stateRelatedMessage={
                      (errors?.citerneNotWashedOutReason?.message as string) ??
                      ""
                    }
                    options={[
                      {
                        label:
                          CITERNE_NOT_WASHED_OUT_REASON[
                            CiterneNotWashedOutReason.Exempted
                          ],
                        nativeInputProps: {
                          ...register("citerneNotWashedOutReason", {}),
                          value: CiterneNotWashedOutReason.Exempted,
                          defaultChecked: false
                        }
                      },
                      {
                        label:
                          CITERNE_NOT_WASHED_OUT_REASON[
                            CiterneNotWashedOutReason.Incompatible
                          ],
                        nativeInputProps: {
                          ...register("citerneNotWashedOutReason", {}),
                          value: CiterneNotWashedOutReason.Incompatible,
                          defaultChecked: false
                        }
                      },
                      {
                        label:
                          CITERNE_NOT_WASHED_OUT_REASON[
                            CiterneNotWashedOutReason.Unavailable
                          ],
                        nativeInputProps: {
                          ...register("citerneNotWashedOutReason", {}),
                          value: CiterneNotWashedOutReason.Unavailable,
                          defaultChecked: false
                        }
                      },
                      {
                        label:
                          CITERNE_NOT_WASHED_OUT_REASON[
                            CiterneNotWashedOutReason.NotByDriver
                          ],
                        nativeInputProps: {
                          ...register("citerneNotWashedOutReason", {}),
                          value: CiterneNotWashedOutReason.NotByDriver,
                          defaultChecked: false
                        }
                      }
                    ]}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {shouldDisplayAdrStatus && shouldDisplayCiterneStatus && <hr />}

      {shouldDisplayAdrStatus && (
        <>
          <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
            <div className="fr-col-12">
              <ToggleSwitch
                inputTitle="emptyReturnStatus"
                label={`Je décide de renseigner les informations en lien avec le Retour à vide ADR`}
                labelPosition="right"
                showCheckedHint={false}
                checked={emptyReturnStatus}
                onChange={checked => setEmptyReturnStatus(checked)}
              />
            </div>
          </div>

          {emptyReturnStatus && (
            <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
              <div className="fr-col-12 fr-pl-4w">
                <RadioButtons
                  state={errors?.emptyReturnADR && "error"}
                  stateRelatedMessage={
                    (errors?.emptyReturnADR?.message as string) ?? ""
                  }
                  options={[
                    {
                      label:
                        EMPTY_RETURN_ADR_REASON[
                          EmptyReturnAdr.EmptyReturnNotWashed
                        ],
                      nativeInputProps: {
                        ...register("emptyReturnADR", {}),
                        value: EmptyReturnAdr.EmptyReturnNotWashed,
                        defaultChecked: false
                      }
                    },
                    {
                      label:
                        EMPTY_RETURN_ADR_REASON[EmptyReturnAdr.EmptyVehicle],
                      nativeInputProps: {
                        ...register("emptyReturnADR", {}),
                        value: EmptyReturnAdr.EmptyVehicle,
                        defaultChecked: false
                      }
                    },
                    {
                      label:
                        EMPTY_RETURN_ADR_REASON[EmptyReturnAdr.EmptyCiterne],
                      nativeInputProps: {
                        ...register("emptyReturnADR", {}),
                        value: EmptyReturnAdr.EmptyCiterne,
                        defaultChecked: false
                      }
                    },
                    {
                      label:
                        EMPTY_RETURN_ADR_REASON[EmptyReturnAdr.EmptyContainer],
                      nativeInputProps: {
                        ...register("emptyReturnADR", {}),
                        value: EmptyReturnAdr.EmptyContainer,
                        defaultChecked: false
                      }
                    },
                    {
                      label:
                        EMPTY_RETURN_ADR_REASON[
                          EmptyReturnAdr.EmptyCiterneContainer
                        ],
                      nativeInputProps: {
                        ...register("emptyReturnADR", {}),
                        value: EmptyReturnAdr.EmptyCiterneContainer,
                        defaultChecked: false
                      }
                    }
                  ]}
                />
              </div>
            </div>
          )}
        </>
      )}

      <hr />
      <p className="fr-text fr-text--md fr-mb-2w">
        En qualité de <strong>destinataire du déchet</strong>, je confirme la
        réception des déchets pour la quantité indiquée dans ce bordereau. En
        cas de refus partiel ou total uniquement, un mail automatique
        Trackdéchets informera le producteur de ce refus, accompagné du
        récépissé PDF. L’inspection des ICPE et ma société en recevront
        également une copie.
      </p>

      <Input
        label="Date de prise en charge"
        className="fr-col-sm-6 fr-col-lg-4 "
        state={errors?.signedAt && "error"}
        stateRelatedMessage={(errors?.signedAt?.message as string) ?? ""}
        nativeInputProps={{
          type: "date",
          min: minDate,
          max: maxDate,
          ...register("signedAt")
        }}
      />

      <div className="form__row">
        <Input
          label="Nom et prénom"
          className="fr-col-sm-6"
          state={errors?.signedBy && "error"}
          stateRelatedMessage={(errors?.signedBy?.message as string) ?? ""}
          nativeInputProps={{
            ...register("signedBy")
          }}
        />
      </div>

      {errorMarkAsTempStored && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={errorMarkAsTempStored.message}
        />
      )}
      {errorMarkAsReceived && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={errorMarkAsReceived.message}
        />
      )}
      {errorMarkAsAccepted && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={errorMarkAsAccepted.message}
        />
      )}
      {errorMarkAsTempStorerAccepted && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={errorMarkAsTempStorerAccepted.message}
        />
      )}

      <div className="dsfr-modal-actions fr-mt-3w">
        <Button
          disabled={isSubmitting || loading}
          priority="secondary"
          onClick={onCancel}
          type="button"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || loading || !isFormValid}
        >
          {loading ? "Signature en cours..." : "Valider"}
        </Button>
      </div>
    </form>
  );
}
