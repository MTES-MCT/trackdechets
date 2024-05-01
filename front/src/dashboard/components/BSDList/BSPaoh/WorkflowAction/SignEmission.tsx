import { useMutation } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useForm } from "react-hook-form";
import {
  Mutation,
  MutationSignBspaohArgs,
  BspaohSignatureType,
  Bspaoh
} from "@td/codegen-ui";
import React from "react";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignBspaoh } from "./SignBspaoh";
import { subMonths } from "date-fns";
import { SIGN_BSPAOH } from "../../../../../form/bspaoh/utils/queries";
import { datetimeToYYYYMMDDHHSS } from "../paohUtils";
import { SignatureTimestamp } from "./components/Signature";

// instanciate schema in component to have an up-to-date max datetime validaton

const getSchema = () =>
  z.object({
    date: z.coerce
      .date({
        required_error: "La date d'émission est requise",
        invalid_type_error: "La date est invalide"
      })
      .min(subMonths(new Date(), 2), { message: "La date est trop ancienne" })
      .max(new Date(), { message: "La date ne peut pas être dans le futur" })
      .transform(val => val.toISOString()),
    author: z.coerce
      .string()
      .min(1, "Le nom et prénom du signataire sont requis")
  });

type SignEmissionProps = {
  bspaohId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignEmission({
  bspaohId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: Readonly<SignEmissionProps>) {
  return (
    <SignBspaoh
      title="Signer le bordereau"
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
function SignEmissionModal({
  bspaoh,
  onCancel
}: Readonly<SignEmissionModalProps>) {
  const [signBspaoh, { loading, error: signatureError }] = useMutation<
    Pick<Mutation, "signBspaoh">,
    MutationSignBspaohArgs
  >(SIGN_BSPAOH);

  const onSubmit = async sign => {
    await signBspaoh({
      variables: {
        id: bspaoh.id,
        input: {
          ...sign,
          type: BspaohSignatureType.Emission
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
    defaultValues: { date: datetimeToYYYYMMDDHHSS(new Date()) },
    resolver: zodResolver(validationSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        En tant qu’ <strong>établissement producteur du déchets</strong>, je
        certifie que les informations relatives aux déchets ci-dessus sont
        exactes et que les déchets:{" "}
      </p>
      <ul className="bullets--outside">
        <li>
          ne contiennent pas de prothèses renfermant des radios-éléments
          artificiels et notamment les prothèses fonctionnant au moyen d’une
          pile au lithium. « Art R 363-16 du code de la santé publique»
        </li>
        <li>
          répondent aux dispositions du §4.3 de la Circulaire interministérielle
          DGCL/DACS/DHOS/DGS du 19 juin 2009 relative à l'enregistrement à
          l'état civil des enfants décédés avant la déclaration de naissance et
          de ceux pouvant donner lieu à un acte d'enfant sans vie, à la
          délivrance du livret de famille, à la prise en charge des corps des
          enfants décédés, des enfants sans vie et des foetus. En signant ce
          document, j'autorise l'entreprise de transport désignée à prendre en
          charge les déchets pour qu'ils soient déposés au crématorium indiqué.
        </li>
      </ul>

      <div className="form__row">
        <Input
          label="Date et heure de prise en charge"
          className="fr-col-sm-4"
          state={errors?.date && "error"}
          stateRelatedMessage={(errors?.date?.message as string) ?? ""}
          nativeInputProps={{
            type: "datetime-local",

            ...register("date")
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
          {loading ? "Signature en cours..." : "Signer"}
        </Button>
      </div>
    </form>
  );
}
