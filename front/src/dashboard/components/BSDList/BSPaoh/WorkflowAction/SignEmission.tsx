import { useMutation } from "@apollo/client";
import routes from "../../../../../Apps/routes";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useForm } from "react-hook-form";
import {
  Mutation,
  MutationSignBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React from "react";
import { generatePath, Link } from "react-router-dom";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths } from "date-fns";
import { SIGN_BSPAOH } from "../../../../../form/bspaoh/utils/queries";
import { datetimeToDateString } from "../paohUtils";
import { SignatureInfo } from "./components/Signature";

const validationSchema = z.object({
  date: z.coerce
    .date({
      required_error: "La date d'émission est requise",
      invalid_type_error: "La date est invalide"
    })
    .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
    .max(new Date(), { message: "La date ne peut pas être dans le futur" }),
  author: z.coerce.string().min(1, "Le nom et prénom du signataire sont requis")
});

type SignEmissionProps = {
  siret: string;
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignEmission({
  siret,
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: SignEmissionProps) {
  return (
    <SignBspaoh
      title="Signer en tant que producteur"
      bspaohId={bspaohId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bspaoh, onClose }) => (
        <SignEmissionModal bspaoh={bspaoh} onCancel={onClose} />
      )}
    </SignBspaoh>
  );
}

interface SignEmissionModalProps {
  bspaoh: Bspaoh;
  onCancel: () => void;
}
function SignEmissionModal({ bspaoh, onCancel }: SignEmissionModalProps) {
  const [signBspaoh, { loading }] = useMutation<
    Pick<Mutation, "signBspaoh">,
    MutationSignBspaohArgs
  >(SIGN_BSPAOH);

  const onSubmit = async data => {
    await signBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          author: data.author,
          date: datetimeToDateString(data.date),
          type: BspaohSignatureType.Emission
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
    defaultValues: { date: datetimeToDateString(new Date()) },
    resolver: zodResolver(validationSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        En qualité <strong>de producteur du déchet</strong>, j'atteste que les
        informations ci-dessus sont correctes. En signant ce document,
        j'autorise le transporteur à prendre en charge le déchet.
      </p>
      <div className="form__row">
        <Input
          label="Date d'émission"
          className="fr-col-sm-4"
          state={errors?.date && "error"}
          stateRelatedMessage={(errors?.date?.message as string) ?? ""}
          nativeInputProps={{
            type: "date",
            defaultValue: datetimeToDateString(new Date()),

            ...register("date")
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

      <div className="dsfr-modal-actions">
        <SignatureInfo />
        <Button disabled={isSubmitting} priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={isSubmitting}>
          {loading ? "Signature en cours..." : "Signer en tant que producteur"}
        </Button>
      </div>
    </form>
  );
}
