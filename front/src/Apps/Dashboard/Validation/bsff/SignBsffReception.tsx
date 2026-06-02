import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { subMonths } from "date-fns";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs,
  Query,
  QueryBsffArgs
} from "@td/codegen-ui";

import TdModal from "../../../common/Components/Modal/Modal";
import { NotificationError } from "../../../common/Components/Error/Error";

import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_FORM
} from "../../../common/queries/bsff/queries";

import { BsffWasteSummary } from "./BsffWasteSummary";
import { BsffJourneySummary } from "./BsffJourneySummary";
import { Loader } from "../../../common/Components";

const schema = z.object({
  receptionDate: z.coerce
    .date({
      required_error: "La date de réception est requise",
      invalid_type_error: "Format de date invalide"
    })
    .transform(v => v.toISOString()),

  signatureAuthor: z
    .string({
      required_error: "Le nom et prénom de l'auteur de la signature est requis"
    })
    .min(1, "Le nom et prénom de l'auteur de la signature est requis")
});

type FormData = z.infer<typeof schema>;

interface Props {
  bsffId: string;
  onClose: () => void;
}

export function SignBsffReception({ bsffId, onClose }: Props) {
  const TODAY = new Date();

  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: { id: bsffId },
    fetchPolicy: "network-only"
  });

  const [updateBsff] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  const [signBsff, { loading, error }] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      receptionDate: datetimeToYYYYMMDD(TODAY),
      signatureAuthor: ""
    }
  });

  const { handleSubmit, register, reset, formState } = methods;

  if (!data) return <Loader />;

  const { bsff } = data;
  const title = "Signer la réception";

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (form: FormData) => {
    await updateBsff({
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: form.receptionDate
            }
          }
        }
      }
    });

    await signBsff({
      variables: {
        id: bsff.id,
        input: {
          type: BsffSignatureType.Reception,
          author: form.signatureAuthor,
          date: form.receptionDate
        }
      }
    });

    reset();
    onClose();
  };

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <>
        <BsffWasteSummary bsff={bsff} />
        <BsffJourneySummary bsff={bsff} />

        <p className="fr-text fr-mb-2w">
          En qualité de <strong>destinataire du déchet</strong>, j'atteste que
          les informations ci-dessus sont correctes. En signant ce document, je
          déclare réceptionner le déchet.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* DATE */}
          <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
            <Input
              label="Date de réception"
              nativeInputProps={{
                type: "date",
                min: subMonths(TODAY, 2).toISOString().split("T")[0],
                max: TODAY.toISOString().split("T")[0],
                ...register("receptionDate")
              }}
              state={formState.errors.receptionDate ? "error" : "default"}
              stateRelatedMessage={formState.errors.receptionDate?.message}
            />
          </div>

          {/* AUTHOR */}
          <div className="fr-col-8 fr-mb-2w">
            <Input
              label="Nom et prénom"
              nativeInputProps={{
                placeholder: "NOM Prénom",
                ...register("signatureAuthor")
              }}
              state={formState.errors.signatureAuthor ? "error" : "default"}
              stateRelatedMessage={formState.errors.signatureAuthor?.message}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="fr-mb-4w">
              <NotificationError apolloError={error} />
            </div>
          )}

          <hr className="fr-mt-2w" />

          {/* ACTIONS */}
          <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
            <Button type="button" priority="secondary" onClick={handleClose}>
              Annuler
            </Button>

            <Button disabled={loading} type="submit">
              {loading ? "Signature en cours..." : "Signer"}
            </Button>
          </div>
        </form>
      </>
    </TdModal>
  );
}
