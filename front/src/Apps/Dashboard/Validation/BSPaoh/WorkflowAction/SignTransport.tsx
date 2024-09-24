import { useMutation } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

import {
  UPDATE_BSPAOH,
  SIGN_BSPAOH
} from "../../../Creation/bspaoh/utils/queries";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
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
import { useForm, FormProvider } from "react-hook-form";
import { datetimeToYYYYMMDDHHSS } from "../paohUtils";
import { SignatureTimestamp } from "./components/Signature";

import { RhfTagsInputWrapper } from "../../../../../Apps/Forms/Components/TagsInput/TagsInputWrapper";

// instanciate schema in component to have an up-to-date max datetime validaton
const getSchema = () =>
  z.object({
    takenOverAt: z.coerce
      .date({
        required_error: "La date d'émission est requise",
        invalid_type_error: "La date est invalide"
      })
      .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
      .max(new Date(), {
        message: "La date ne peut pas être dans le futur"
      })
      .transform(val => val.toISOString()),
    plates: z.preprocess(
      val => (Array.isArray(val) ? val : [val]).filter(Boolean),
      z.string().array().min(1, "La plaque d'immatriculation est requise")
    ),

    author: z.coerce
      .string()
      .min(1, "Le nom et prénom du signataire sont requis")
  });

type Props = {
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignTransport({
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Readonly<Props>) {
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

function SignTransportModal({
  bspaoh,
  onCancel
}: Readonly<SignTransportModalProps>) {
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
  const validationSchema = getSchema();
  const methods = useForm<z.infer<typeof validationSchema>>({
    mode: "onTouched",
    defaultValues: {
      takenOverAt: datetimeToYYYYMMDDHHSS(new Date()),

      plates: bspaoh?.transporter?.transport?.plates ?? []
    },
    resolver: zodResolver(validationSchema)
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = methods;

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("plates");
  }, [register]);

  const loading = loadingSign || loadingUpdate;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="fr-grid-row">
        <div className="fr-col-6 fr-mb-5v">
          <FormProvider {...methods}>
            <RhfTagsInputWrapper
              maxTags={2}
              label="Immatriculations"
              fieldName={"plates"}
            />
          </FormProvider>
        </div>
      </div>

      <p>
        En qualité de <strong>transporteur du déchet</strong>, j'atteste que les
        informations ci-dessus sont correctes. En signant ce document, je
        déclare prendre en charge le déchet.
      </p>
      <div className="form__row">
        <Input
          label="Date et heure de prise en charge"
          className="fr-col-sm-5"
          state={errors?.takenOverAt && "error"}
          stateRelatedMessage={(errors?.takenOverAt?.message as string) ?? ""}
          nativeInputProps={{
            type: "datetime-local",

            ...register("takenOverAt")
          }}
        />
      </div>

      <div className="form__row">
        <Input
          label="Nom et prénom"
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
        <Button disabled={isSubmitting}>
          {loading ? "Signature en cours..." : "Signer l'enlèvement"}
        </Button>
      </div>
    </form>
  );
}
