import { useMutation } from "@apollo/client";

import {
  UPDATE_BSPAOH,
  SIGN_BSPAOH
} from "../../../../../Apps/common/queries/bspaoh/queries";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  Mutation,
  MutationSignBspaohArgs,
  MutationUpdateBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import { Select } from "@codegouvfr/react-dsfr/Select";

import React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths, addMinutes } from "date-fns";
import { useForm } from "react-hook-form";
import { datetimeToYYYYMMDDHHSS } from "../paohUtils";
import { SignatureTimestamp } from "./components/Signature";

const getSchema = () =>
  z.object({
    operationCode: z
      .string()
      .min(1, { message: "Le code opération est requis" }),
    operationDate: z.coerce
      .date({
        required_error: "La date de traitement est requise",
        invalid_type_error: "La date est invalide"
      })
      .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
      .max(addMinutes(new Date(), 1), {
        message: "La date ne peut pas être dans le futur"
      })
      .transform(val => val.toISOString()),
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

export function SignOperation({
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Readonly<Props>) {
  return (
    <SignBspaoh
      title="Signer le traitement"
      bspaohId={bspaohId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bspaoh, onClose }) => (
        <SignOperationModal bspaoh={bspaoh} onCancel={onClose} />
      )}
    </SignBspaoh>
  );
}

interface SignOperationModalProps {
  bspaoh: Bspaoh;
  onCancel: () => void;
}

function SignOperationModal({
  bspaoh,
  onCancel
}: Readonly<SignOperationModalProps>) {
  const [updateBspaoh, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH
    );

  const [signBspaoh, { loading: loadingSign, error: signatureError }] =
    useMutation<Pick<Mutation, "signBspaoh">, MutationSignBspaohArgs>(
      SIGN_BSPAOH
    );

  const onSubmit = async data => {
    const { operationDate, operationCode, ...sign } = data;

    await updateBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          destination: {
            operation: {
              code: operationCode,
              date: operationDate
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
          type: BspaohSignatureType.Operation
        }
      }
    });
    onCancel();
  };
  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: { operationDate: datetimeToYYYYMMDDHHSS(new Date()) },
    resolver: zodResolver(validationSchema)
  });

  const loading = loadingSign || loadingUpdate;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="fr-mt-5v">
      <p>
        En qualité de <strong>destinataire du déchet</strong>, j'atteste que les
        informations ci-dessus sont correctes. En signant ce document, je
        déclare réceptionner le déchet.
      </p>
      <div className="form__row">
        <Select
          label="Opération d’élimination / valorisation prévue (code D/R)"
          className="fr-col-sm-6"
          state={errors?.operationCode && "error"}
          stateRelatedMessage={(errors?.operationCode?.message as string) ?? ""}
          nativeSelectProps={{ ...register("operationCode") }}
        >
          <option value="">Selectionnez une opération</option>
          <option value="R 1">
            Incinération + valorisation énergétique (R 1)
          </option>
          <option value="D 10"> Incinération (D 10)</option>
        </Select>
      </div>

      <div className="form__row">
        <Input
          label="Date de l'opération"
          className="fr-col-sm-4"
          state={errors?.operationDate && "error"}
          stateRelatedMessage={(errors?.operationDate?.message as string) ?? ""}
          nativeInputProps={{
            type: "datetime-local",

            ...register("operationDate")
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
      <SignatureTimestamp />
      <div className="dsfr-modal-actions">
        <Button disabled={isSubmitting} priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button>
          {loading ? "Signature en cours..." : "Signer le traitement"}
        </Button>
      </div>
    </form>
  );
}
