import { useMutation } from "@apollo/client";

import { SIGN_BSPAOH } from "../../../../../Apps/common/queries/bspaoh/queries";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  Mutation,
  MutationSignBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "@td/validation";
import { SignBspaoh } from "./SignBspaoh";

import { useForm } from "react-hook-form";
import { datetimeToYYYYMMDDHHSS } from "../paohUtils";
import { SignatureTimestamp } from "./components/Signature";

const validationSchema = z.object({
  author: z.coerce.string().min(1, "Le nom et prénom du signataire sont requis")
});

type Props = {
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignDelivery({
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Readonly<Props>) {
  return (
    <SignBspaoh
      title="Signer le dépot"
      bspaohId={bspaohId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bspaoh, onClose }) => (
        <SignDeliveryModal bspaoh={bspaoh} onCancel={onClose} />
      )}
    </SignBspaoh>
  );
}

interface SignDeliveryModalProps {
  bspaoh: Bspaoh;
  onCancel: () => void;
}

function SignDeliveryModal({
  bspaoh,
  onCancel
}: Readonly<SignDeliveryModalProps>) {
  const [signBspaoh, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
      SIGN_BSPAOH
    );

  const onSubmit = async data => {
    const { handedOverToDestinationDate, ...sign } = data;

    await signBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          ...sign,
          type: BspaohSignatureType.Delivery
        }
      }
    });
    onCancel();
  };

  const {
    register,
    handleSubmit,

    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    mode: "onTouched",

    resolver: zodResolver(validationSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        En tant que <strong>transporteur du déchet</strong>, je souhaite
        déclarer le dépôt des déchets désignés ci-avant, à l'entreprise
        indiquée.
      </p>
      <div className="form__row">
        <Input
          label="Date de dépôt"
          className="fr-col-sm-5"
          disabled
          nativeInputProps={{
            type: "datetime-local",

            defaultValue: datetimeToYYYYMMDDHHSS(new Date())
          }}
        />
      </div>

      <div className="form__row">
        <Input
          label="Nom et prénom du signataire"
          state={errors?.author && "error"}
          stateRelatedMessage={(errors?.author?.message as string) ?? ""}
          nativeInputProps={{
            ...register("author")
          }}
        />
      </div>

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
        <Button disabled={isSubmitting}>
          {loadingSign ? "Signature en cours..." : "Signer"}
        </Button>
      </div>
    </form>
  );
}
