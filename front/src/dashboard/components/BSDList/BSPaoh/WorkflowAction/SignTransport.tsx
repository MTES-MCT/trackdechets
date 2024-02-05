import { useMutation } from "@apollo/client";
import routes from "../../../../../Apps/routes";
import {
  UPDATE_BSPAOH,
  SIGN_BSPAOH
} from "../../../../../form/bspaoh/utils/queries";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  Mutation,
  MutationSignBspaohArgs,
  MutationUpdateBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { datetimeToDateString } from "../paohUtils";
import { SignatureInfo } from "./components/Signature";
import { PlatesWidget2 } from "../../../../../form/bspaoh/components/TransporterPlates";

const validationSchema = z.object({
  takenOverAt: z.coerce
    .date({
      required_error: "La date d'émission est requise",
      invalid_type_error: "La date est invalide"
    })
    .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
    .max(new Date(), { message: "La date ne peut pas être dans le futur" })
    .transform(val => val.toISOString()),
  plates: z.preprocess(
    val => (Array.isArray(val) ? val : [val]).filter(Boolean),
    z.string().array().min(1, "La plaque d'immatriculation est requise")
  ),

  author: z.coerce.string().min(1, "Le nom et prénom du signataire sont requis")
});

type Props = {
  siret: string;
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignTransport({
  siret,
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Props) {
  return (
    <SignBspaoh
      title="Signer l'enlèvement"
      bspaohId={bspaohId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bspaoh, onClose }) => (
        <SignTransportModal bspaoh={bspaoh} onCancel={onClose} />
      )}
    </SignBspaoh>
  );
}

interface SignTransportModalProps {
  bspaoh: Bspaoh;
  onCancel: () => void;
}

function SignTransportModal({ bspaoh, onCancel }: SignTransportModalProps) {
  const [updateBspaoh, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH
    );

  const [signBspaoh, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
      SIGN_BSPAOH
    );

  const onSubmit = async data => {
    const { takenOverAt, plates, ...sign } = data;

    await updateBspaoh({
      variables: {
        id: bspaoh.id,
        input: { transporter: { transport: { takenOverAt, plates } } }
      }
    });

    await signBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          ...sign,
          type: BspaohSignatureType.Transport
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
    defaultValues: {
      takenOverAt: datetimeToDateString(new Date()),
      plates: bspaoh?.transporter?.transport?.plates ?? []
    },
    resolver: zodResolver(validationSchema)
  });
  const loading = loadingSign || loadingUpdate;
  register("plates");
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        En qualité de <strong>transporteur du déchet</strong>, j'atteste que les
        informations ci-dessus sont correctes. En signant ce document, je
        déclare prendre en charge le déchet.
      </p>
      <TransporterRecepisseWrapper transporter={bspaoh.transporter!} />

      <PlatesWidget2
        maxPlates={2}
        fieldName="plates"
        setValue={setValue}
        watch={watch}
      />

      <div className="form__row">
        <Input
          label="Date de prise en charge"
          className="fr-col-sm-4"
          state={errors?.takenOverAt && "error"}
          stateRelatedMessage={(errors?.takenOverAt?.message as string) ?? ""}
          nativeInputProps={{
            type: "date",

            ...register("takenOverAt")
          }}
        />
      </div>

      <div className="form__row">
        <Input
          label="Nom du signataire"
          state={errors?.author && "error"}
          stateRelatedMessage={(errors?.author?.message as string) ?? ""}
          nativeInputProps={{
            ...register("author")
          }}
        />
      </div>
      {updateError && (
        <div className="notification notification--error">
          {updateError.message}
        </div>
      )}
      {signatureError && (
        <div className="notification notification--error">
          {signatureError.message}
        </div>
      )}
      <div className="dsfr-modal-actions">
        <SignatureInfo />
        <Button disabled={isSubmitting} priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={isSubmitting}>
          {loading ? "Signature en cours..." : "Signer l'enlèvement"}
        </Button>
      </div>
    </form>
  );
}
