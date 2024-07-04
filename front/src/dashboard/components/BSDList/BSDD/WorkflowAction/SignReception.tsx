import React, { useEffect } from "react";
import { useMutation } from "@apollo/client";
import {
  Form,
  FormStatus,
  Mutation,
  MutationMarkAsAcceptedArgs,
  MutationMarkAsReceivedArgs,
  MutationMarkAsTempStoredArgs,
  MutationMarkAsTempStorerAcceptedArgs,
  QuantityType
} from "@td/codegen-ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignForm } from "./SignForm";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Input from "@codegouvfr/react-dsfr/Input";
import { datetimeToYYYYMMDD } from "../../BSPaoh/paohUtils";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  MARK_AS_RECEIVED,
  MARK_AS_ACCEPTED,
  MARK_AS_TEMP_STORED,
  MARK_TEMP_STORER_ACCEPTED
} from "../../../../../form/bsdd/utils/queries";
import { useParams } from "react-router-dom";
import { multiplyByRounded } from "../../../../../common/helper";
import Decimal from "decimal.js";

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

      receivedWeight: z.coerce.number().nonnegative().nullish(),
      refusedWeight: z.coerce.number().nonnegative().nullish(),
      acceptedWeight: z.coerce.number().nonnegative().nullish(),

      quantityType: z.coerce.string().nullish(),

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
  const { siret } = useParams<{ siret: string }>();

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

  const isReception = [
    FormStatus.Sent,
    FormStatus.Resent,
    FormStatus.TempStored
  ].includes(form.status);
  const isTempStorage = form.recipient?.isTempStorage;
  const isFinalDestination =
    (isTempStorage &&
      siret === form.temporaryStorageDetail?.destination?.company?.siret) ||
    (!isTempStorage && siret === form.recipient?.company?.siret);

  const onSubmit = async data => {
    const {
      wasteAcceptationStatus,
      wasteRefusalReason,
      receivedWeight,
      signedAt,
      signedBy,
      quantityType,
      refusedWeight
    } = data;

    if (isReception) {
      isTempStorage
        ? await markAsTempStored({
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
          })
        : await markAsReceived({
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
    }

    if (
      ["ACCEPTED", "REFUSED", "PARTIALLY_REFUSED"].includes(acceptationStatus)
    ) {
      isTempStorage
        ? await markAsTempStorerAccepted({
            variables: {
              id: form.id,
              tempStorerAcceptedInfo: {
                quantityReceived: receivedWeight,
                quantityType: quantityType,
                signedAt: signedAt,
                signedBy: signedBy,
                wasteAcceptationStatus: wasteAcceptationStatus,
                wasteRefusalReason: wasteRefusalReason
              }
            }
          })
        : await markAsAccepted({
            variables: {
              id: form.id,
              acceptedInfo: {
                quantityReceived: receivedWeight,
                quantityRefused: refusedWeight,
                signedAt: signedAt,
                signedBy: signedBy,
                wasteAcceptationStatus: wasteAcceptationStatus,
                wasteRefusalReason: wasteRefusalReason
              }
            }
          });
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

  const refusedWeightDisabled =
    !receivedWeight || ["ACCEPTED", "REFUSED"].includes(acceptationStatus);

  const acceptedWeight = receivedWeight
    ? new Decimal(receivedWeight)
        .minus(refusedWeight ?? 0)
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

    // manually set values do not trigger re-validation
    trigger("refusedWeight");
  }, [acceptationStatus, receivedWeight, setValue, trigger]);

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

      {isReception && (
        <>
          <h4 className="fr-h4">
            <strong>Réception</strong>
          </h4>
          <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-4">
              <Input
                label="Poids total net en tonnes"
                className="fr-col-12"
                state={errors?.receivedWeight && "error"}
                stateRelatedMessage={
                  (errors?.receivedWeight?.message as string) ?? ""
                }
                nativeInputProps={{
                  inputMode: "decimal",
                  step: "0.1",
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
          {!isFinalDestination && (
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
              <Input
                label="Poids total net en tonnes"
                disabled={refusedWeightDisabled}
                className="fr-col-12"
                state={errors?.refusedWeight && "error"}
                stateRelatedMessage={
                  (errors?.refusedWeight?.message as string) ?? ""
                }
                nativeInputProps={{
                  inputMode: "decimal",
                  step: "0.1",
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
              <Input
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
                  step: "0.1",
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

      <hr />
      <p className="fr-text fr-text--md fr-mb-2w">
        En qualité de <strong>destinataire du déchet</strong>, je confirme la
        réception des déchets pour la quantité indiquée dans ce bordereau. Un
        mail automatique Trackdéchets informera le producteur de ce refus
        partiel, accompagné du récépisséPDF. L’inspection des ICPE et ma société
        en recevront une copie.
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
