import { useMutation } from "@apollo/client";

import {
  UPDATE_BSPAOH,
  SIGN_BSPAOH
} from "../../../../../form/bspaoh/utils/queries";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";

import {
  Mutation,
  MutationSignBspaohArgs,
  MutationUpdateBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React, {useEffect} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { datetimeToDateString } from "../paohUtils";
import { PackagingAcceptationWidget } from "./components/PackagingAcceptationWidget";
import { SignatureInfo } from "./components/Signature";

const validationSchema = z
  .object({
    weight: z.coerce.number().nullish(),
    quantity: z.coerce.number().nullish(),
    isEstimate: z.preprocess(val => {
      if (val === "0") return false;
      if (val === "1") return true;
      return val;
    }, z.boolean().nullish()),

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
    // quantity or weight required
    if (!val.weight && !val.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight"],

        message: `Vous devez préciser la quantité ou le poids`
      });
    }
    // isEstimate required if weight filled
    if (
      val.weight &&
      (val.isEstimate === undefined || val.isEstimate === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isEstimate"],

        message: `Vous devez préciser si le poids est estimé`
      });
    }
    // isEstimate required if weight filled
    if ((val.isEstimate === true || val.isEstimate === false) && !val.weight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight"],

        message: `Vous devez préciser un poids`
      });
    }

    // isEstimate required if weight filled
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
}: SignReceptionProps) {
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

function SignReceptionModal({ bspaoh, onCancel }: SignReceptionModalProps) {
  const [updateBspaoh, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH
    );

  const [signBspaoh, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
      SIGN_BSPAOH
    );

  const onSubmit = async data => {
    const {
      receptionDate,
      weight,
      quantity,
      isEstimate,
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
                weight: { value: weight, isEstimate: isEstimate },
                quantity
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

  const {
    register,
    handleSubmit,
    setValue,

    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    mode: "onTouched",
    resolver: async (data, context, options) => {
      // you can debug your validation schema here

      const res = await zodResolver(validationSchema)(data, context, options);

      return zodResolver(validationSchema)(data, context, options);
    },

    defaultValues: {
      receptionDate: datetimeToDateString(new Date()),
      acceptationStatus: bspaoh?.destination?.reception?.acceptation?.status,
      weight:
        bspaoh?.destination?.reception?.detail?.weight?.value ||
        bspaoh?.emitter?.emission?.detail?.weight?.value,
      isEstimate: bspaoh?.destination?.reception?.detail?.weight?.isEstimate,
      quantity:0
    }
    // resolver: zodResolver(validationSchema)
  });
  const loading = loadingSign || loadingUpdate;
  const acceptationStatus = watch("acceptationStatus");
  const receivedPackagings = watch("packagings");

  // quantity is computed by counting accepted packagings, which are updated in PackagingAcceptationWidget
   useEffect(() => {
  const quantity = receivedPackagings?.filter(pack => pack.acceptation === "ACCEPTED")?.length ?? 0

    setValue("quantity", quantity);
  }, [receivedPackagings, setValue]);


  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        En qualité de <strong>destinataire du déchet</strong>, j'atteste que les
        informations ci-dessus sont correctes. En signant ce document, je
        déclare réceptionner le déchet.
      </p>

      <div className="form__row">
        <h3 className="fr-h3">Acceptation</h3>
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
        />

        {["REFUSED", "PARTIALLY_REFUSED"].includes(acceptationStatus) && (
          <Input
            label="Motif du refus"
            textArea
            className="fr-col-12"
            state={errors?.refusalReason && "error"}
            stateRelatedMessage={
              (errors?.refusalReason?.message as string) ?? ""
            }
            nativeTextAreaProps={{
              ...register("refusalReason")
            }}
          />
        )}
        <h3 className="fr-h3">Quantité réceptionnée</h3>
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-md-6">
            <Input
              label="En nombre"
              disabled
              className="fr-col-sm-4"
              state={errors?.quantity && "error"}
              stateRelatedMessage={(errors?.quantity?.message as string) ?? ""}
              nativeInputProps={{
                type: "number",

                   ...register("quantity")
              }}
            />
          </div>
     </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top  fr-mt-5v">
            <Input
              label="Poids total reçu (kg)"
              className="fr-col-sm-4"
              state={errors?.weight && "error"}
              stateRelatedMessage={(errors?.weight?.message as string) ?? ""}
              nativeInputProps={{
                type: "number",

                ...register("weight")
              }}
            />
       <div className="fr-col-12 fr-col-md-6">
          <RadioButtons
            state={errors?.isEstimate && "error"}
            stateRelatedMessage={(errors?.isEstimate?.message as string) ?? ""}
                   orientation="horizontal"
            legend="Cette pesée est :"
            options={[
              {
                label: "réelle",
                nativeInputProps: {
                  ...register("isEstimate", {}),
                  value: 0
                }
              },
              {
                label: "estimée",
                nativeInputProps: {
                  ...register("isEstimate", {}),
                  value: 1
                }
              }
            ]}
          />
          </div>
        </div>
        <Input
          label="Date de réception"
          className="fr-col-sm-4"
          state={errors?.receptionDate && "error"}
          stateRelatedMessage={(errors?.receptionDate?.message as string) ?? ""}
          nativeInputProps={{
            type: "date",

            ...register("receptionDate")
          }}
        />
      </div>

      <div className="form__row">
        <Input
          label="Nom du signataire"
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
      <div className="dsfr-modal-actions">
        <SignatureInfo />
        <Button disabled={isSubmitting} priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button>
          {loading ? "Signature en cours..." : "Signer la réception"}
        </Button>
      </div>
    </form>
  );
}
