import { useMutation } from "@apollo/client";

import {
  UPDATE_BSPAOH,
  SIGN_BSPAOH
} from "../../../../../Apps/common/queries/bspaoh/queries";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";

import {
  Mutation,
  MutationSignBspaohArgs,
  MutationUpdateBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React, { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { datetimeToYYYYMMDDHHSS } from "../paohUtils";
import { PackagingAcceptationWidget } from "./components/PackagingAcceptationWidget";
import { SignatureTimestamp } from "./components/Signature";

// instanciate schema in component to have an up-to-date max datetime validaton

const getSchema = () =>
  z
    .object({
      receivedWeight: z.coerce.number().nonnegative().nullish(),
      receivedQuantity: z.coerce.number().nonnegative().nullish(),

      refusedWeight: z.coerce.number().nonnegative().nullish(),
      acceptedWeight: z.coerce.number().nonnegative().nullish(),

      acceptationStatus: z.enum(["ACCEPTED", "PARTIALLY_REFUSED", "REFUSED"], {
        invalid_type_error: "Vous devez préciser si le déchet est accepté"
      }),
      refusalReason: z.coerce.string(),

      receptionDate: z.coerce
        .date({
          required_error: "La date de réception est requise",
          invalid_type_error: "La date est invalide"
        })
        .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
        .max(new Date(), { message: "La date ne peut pas être dans le futur" })
        .transform(val => val.toISOString()),

      author: z.coerce
        .string()
        .min(1, "Le nom et prénom du signataire sont requis"),
      packagings: z.array(
        z.object({
          id: z.string(),
          acceptation: z.enum(["ACCEPTED", "PENDING", "REFUSED"])
        })
      )
    })

    .superRefine((val, ctx) => {
      // receivedQuantity or weight required
      if (!val.receivedWeight && !val.receivedQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["receivedWeight"],

          message: `Vous devez préciser la quantité ou le poids`
        });
      }

      if ((val.refusedWeight ?? 0) > (val.receivedWeight ?? 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refusedWeight"],

          message: `Vous ne pouvez refuser un poids supérieur au poids reçu`
        });
      }

      if (
        ["PARTIALLY_REFUSED", "REFUSED"].includes(val.acceptationStatus) &&
        !val.refusalReason
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["refusalReason"],

          message: `Vous devez préciser un motif de refus`
        });
      }

      if (val.acceptationStatus === "PARTIALLY_REFUSED") {
        if (!val.refusedWeight && val.receivedWeight) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["refusedWeight"],

            message: `Vous devez préciser le poids refusé`
          });
        }

        if (
          val.packagings.every(p => p.acceptation === "ACCEPTED") ||
          val.packagings.every(p => p.acceptation === "REFUSED")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packagings"],

            message: `Vous devez selectionner une partie des contenants en cas de refus partiel`
          });
        }
      }
    });

interface SignReceptionProps {
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

export function SignReception({
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Readonly<SignReceptionProps>) {
  return (
    <SignBspaoh
      title="Signer la réception et l'acceptation"
      bspaohId={bspaohId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
      size="L"
    >
      {({ bspaoh, onClose }) => (
        <SignReceptionModal bspaoh={bspaoh} onCancel={onClose} />
      )}
    </SignBspaoh>
  );
}

interface SignReceptionModalProps {
  bspaoh: Bspaoh;
  onCancel: () => void;
}

function SignReceptionModal({
  bspaoh,
  onCancel
}: Readonly<SignReceptionModalProps>) {
  const [updateBspaoh, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH
    );

  const [signBspaoh, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
      SIGN_BSPAOH
    );
  const hasManyPackagings = (bspaoh?.waste?.packagings?.length ?? 0) > 1;

  const onSubmit = async data => {
    const {
      receptionDate,
      weight,
      acceptedWeight,
      refusedWeight,
      receivedWeight,
      receivedQuantity,

      acceptationStatus,
      refusalReason,
      packagings,
      ...sign
    } = data;
    const packagingAcceptation = packagings.map(p => ({
      id: p.id,
      acceptation: p.acceptation ?? false
    }));

    await updateBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          destination: {
            reception: {
              date: receptionDate,
              acceptation: {
                status: acceptationStatus,
                packagings: packagingAcceptation,
                refusalReason
              },
              detail: {
                receivedWeight: { value: receivedWeight },
                refusedWeight: { value: refusedWeight },
                quantity: receivedQuantity
              }
            }
          }
        }
      }
    });

    await signBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          ...sign,
          type: BspaohSignatureType.Reception
        }
      }
    });
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
      receptionDate: datetimeToYYYYMMDDHHSS(new Date()),
      acceptationStatus:
        bspaoh?.destination?.reception?.acceptation?.status ?? "ACCEPTED",
      receivedWeight:
        bspaoh?.destination?.reception?.detail?.receivedWeight?.value ||
        bspaoh?.emitter?.emission?.detail?.weight?.value,
      receivedQuantity: 0
    }
  });

  // we dont rely on rhf isValid, manually set errors do not change its state
  const isFormValid = !Object.keys(errors ?? {}).length;

  const loading = loadingSign || loadingUpdate;
  const acceptationStatus = watch("acceptationStatus");
  const receivedPackagings = watch("packagings");
  const refusedWeight = watch("refusedWeight");
  const receivedWeight = watch("receivedWeight");

  const refusedWeightDisabled =
    !receivedWeight || ["ACCEPTED", "REFUSED"].includes(acceptationStatus);

  const acceptedWeight = receivedWeight
    ? receivedWeight - (refusedWeight ?? 0)
    : 0;

  // quantity is computed by counting all packagings
  useEffect(() => {
    const receivedQuantity = receivedPackagings?.length ?? 0;

    setValue("receivedQuantity", receivedQuantity);
  }, [receivedPackagings, setValue, trigger]);

  useEffect(() => {
    if (acceptationStatus === "ACCEPTED") {
      setValue("refusedWeight", 0);
      setValue("refusalReason", "");
    }
    if (acceptationStatus === "REFUSED" && !!receivedWeight) {
      setValue("refusedWeight", receivedWeight);
    }
    // manually set values do not trigger re-validation
    trigger("refusedWeight");
  }, [acceptationStatus, receivedWeight, setValue, trigger]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="fr-grid-row  fr-grid-row--bottom ">
        <h4 className="fr-h4 fr-mb-0">Réception</h4>
        <span className="fr-ml-1w">(optionnel)</span>
      </div>
      <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="En nombre"
            disabled
            state={errors?.receivedQuantity && "error"}
            stateRelatedMessage={
              (errors?.receivedQuantity?.message as string) ?? ""
            }
            nativeInputProps={{
              type: "number",

              ...register("receivedQuantity")
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <NonScrollableInput
            label="Poids total en kg"
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
          <p className="fr-info-text fr-mt-5v">
            Soit {(receivedWeight || 0) / 1000} t
          </p>
        </div>
      </div>

      <h3 className="fr-h4">Acceptation</h3>
      <RadioButtons
        state={errors?.acceptationStatus && "error"}
        stateRelatedMessage={
          (errors?.acceptationStatus?.message as string) ?? ""
        }
        options={[
          {
            label: "Acceptation de tous les contenants",
            nativeInputProps: {
              ...register("acceptationStatus", {}),
              value: "ACCEPTED",
              defaultChecked: acceptationStatus === "ACCEPTED"
            }
          },
          {
            label: "Refus partiel",

            nativeInputProps: {
              ...register("acceptationStatus", {}),
              value: "PARTIALLY_REFUSED",
              disabled: !hasManyPackagings,
              defaultChecked: acceptationStatus === "PARTIALLY_REFUSED"
            }
          },
          {
            label: "Refus total",
            nativeInputProps: {
              ...register("acceptationStatus", {}),
              value: "REFUSED",
              defaultChecked: acceptationStatus === "REFUSED"
            }
          }
        ]}
      />

      <PackagingAcceptationWidget
        acceptationStatus={acceptationStatus}
        initialPackagings={bspaoh?.waste?.packagings}
        setValue={setValue}
        trigger={trigger}
        error={errors?.packagings}
      />

      {["REFUSED", "PARTIALLY_REFUSED"].includes(acceptationStatus) && (
        <Input
          label="Motif du refus"
          textArea
          className="fr-col-12"
          state={errors?.refusalReason && "error"}
          stateRelatedMessage={(errors?.refusalReason?.message as string) ?? ""}
          nativeTextAreaProps={{
            ...register("refusalReason")
          }}
        />
      )}

      <div className="fr-grid-row   fr-grid-row--top  fr-grid-row--gutters fr-mt-5v">
        <div className="fr-col-12 fr-col-md-4">
          <h6 className="fr-text--lg">
            <strong>Poids refusé</strong>
          </h6>
          <Input
            label="Poids total en kg"
            disabled={refusedWeightDisabled}
            state={errors?.refusedWeight && "error"}
            stateRelatedMessage={
              (errors?.refusedWeight?.message as string) ?? ""
            }
            nativeInputProps={{
              ...register("refusedWeight"),
              inputMode: "decimal",
              step: "0.1",
              type: "number"
            }}
          />
          <p className="fr-info-text fr-mt-5v">
            Soit {(refusedWeight || 0) / 1000} t
          </p>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <h6 className="fr-text--lg">
            <strong>Poids accepté</strong>
          </h6>
          <Input
            label="Poids total en kg"
            disabled
            nativeInputProps={{
              value: acceptedWeight,
              inputMode: "decimal",
              step: "0.1",
              type: "number"
            }}
          />
          <p className="fr-info-text fr-mt-5v">
            Soit {(acceptedWeight || 0) / 1000} t
          </p>
        </div>
      </div>
      <Input
        label="Date de prise en charge"
        className="fr-col-sm-6 fr-col-lg-4 "
        state={errors?.receptionDate && "error"}
        stateRelatedMessage={(errors?.receptionDate?.message as string) ?? ""}
        nativeInputProps={{
          type: "datetime-local",

          ...register("receptionDate")
        }}
      />

      <div className="form__row">
        <Input
          label="Nom et prénom"
          className="fr-col-sm-6"
          state={errors?.author && "error"}
          stateRelatedMessage={(errors?.author?.message as string) ?? ""}
          nativeInputProps={{
            ...register("author")
          }}
        />
      </div>
      {updateError && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={updateError.message}
        />
      )}
      {signatureError && (
        <Alert
          severity="error"
          title="Erreur"
          className="fr-mt-5v"
          description={signatureError.message}
        />
      )}
      <SignatureTimestamp />
      <div className="dsfr-modal-actions">
        <Button disabled={isSubmitting} priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={isSubmitting || !isFormValid}>
          {loading ? "Signature en cours..." : "Signer la réception"}
        </Button>
      </div>
    </form>
  );
}
