import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { subMonths } from "date-fns";
import { useForm } from "react-hook-form";

import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  Query,
  QueryBsffArgs
} from "@td/codegen-ui";

import { GET_BSFF_FORM, SIGN_BSFF } from "../../../common/queries/bsff/queries";
import { Loader } from "../../../common/Components";
import { NotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";

import { BsffJourneySummary } from "./BsffJourneySummary";
import { BsffWasteSummary } from "./BsffWasteSummary";

import { datetimeToYYYYMMDD } from "../../../../common/datetime";

const schema = z.object({
  author: z
    .string({
      required_error: "Le nom et prénom de l'auteur de la signature est requis"
    })
    .refine(val => val.trim() !== "", {
      message: "Le nom et prénom de l'auteur de la signature est requis"
    })
    .pipe(
      z
        .string()
        .min(
          2,
          "Le nom et prénom de l'auteur de la signature doit comporter au moins 2 caractères"
        )
    ),

  date: z.coerce
    .date({
      required_error: "La date d'émission est requise",
      invalid_type_error: "Format de date invalide"
    })
    .transform(v => v.toISOString())
});

type FormData = z.infer<typeof schema>;

interface Props {
  bsffId: string;
  onClose: () => void;
}

export default function SignBsffEmission({ bsffId, onClose }: Props) {
  const TODAY = new Date();

  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: { id: bsffId },
    fetchPolicy: "network-only"
  });

  const [signBsff, { loading, error }] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const initialState: FormData = {
    author: "",
    date: datetimeToYYYYMMDD(TODAY)
  };

  const { handleSubmit, register, reset, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialState
  });

  if (!data) return <Loader />;

  const { bsff } = data;
  const title = "Signer le bordereau";

  const onCancel = () => {
    reset();
    onClose();
  };

  const onSubmit = async (formData: FormData) => {
    await signBsff({
      variables: {
        id: bsff.id,
        input: {
          type: BsffSignatureType.Emission,
          author: formData.author,
          date: formData.date
        }
      }
    });

    reset();
    onClose();
  };

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <>
        {/* SUMMARIES */}
        <BsffWasteSummary bsff={bsff} />
        <BsffJourneySummary bsff={bsff} />

        <p className="fr-text fr-mb-2w">
          En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
          informations ci-dessus sont correctes. En signant ce document,
          j'autorise le transporteur à prendre en charge le déchet.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* DATE */}
          <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
            <Input
              label="Date d'émission"
              nativeInputProps={{
                type: "date",
                min: subMonths(TODAY, 2).toISOString().split("T")[0],
                max: TODAY.toISOString().split("T")[0],
                ...register("date")
              }}
              state={formState.errors.date ? "error" : "default"}
              stateRelatedMessage={formState.errors.date?.message}
            />
          </div>

          {/* AUTHOR */}
          <div className="fr-col-8 fr-mb-2w">
            <Input
              label="Nom et prénom"
              nativeInputProps={{
                placeholder: "NOM Prénom",
                ...register("author")
              }}
              state={formState.errors.author ? "error" : "default"}
              stateRelatedMessage={formState.errors.author?.message}
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
            <Button type="button" priority="secondary" onClick={onCancel}>
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
