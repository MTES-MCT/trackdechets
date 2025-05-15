import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  Query,
  QueryBsdaArgs
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React from "react";
import { useForm } from "react-hook-form";
import { generatePath, Link, useParams } from "react-router-dom";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import routes from "../../../routes";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import {
  GET_BSDA,
  SIGN_BSDA_EMISSION
} from "../../../common/queries/bsda/queries";

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
      invalid_type_error: "Format de date invalide."
    })
    .transform(v => v?.toISOString())
});
export type ZodBdsaEmission = z.infer<typeof schema>;

const SignBsdaEmission = ({ bsdaId, onClose }) => {
  const { siret } = useParams<{ siret: string }>();

  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId
    },
    fetchPolicy: "network-only"
  });

  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BSDA_EMISSION, {});

  const title = "Signer le bordereau";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: ""
  };

  const { handleSubmit, reset, formState, register } = useForm<ZodBdsaEmission>(
    {
      values: initialState,
      resolver: async (data, context, options) => {
        return zodResolver(schema)(data, context, options);
      }
    }
  );

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      {bsda.metadata?.errors?.some(
        error => error?.requiredFor === BsdaSignatureType.Emission
      ) ? (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            obligatoires avant de le signer.
          </p>
          <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
            {bsda.metadata?.errors.map((error, idx) => (
              <li key={idx}>{error?.message}</li>
            ))}
          </ul>
          <Link
            to={generatePath(routes.dashboard.bsdas.edit, {
              siret,
              id: bsda.id
            })}
            className="btn btn--primary"
          >
            Mettre le bordereau à jour pour le signer
          </Link>
        </>
      ) : (
        <>
          <BsdaWasteSummary bsda={bsda} />
          <BsdaJourneySummary bsda={bsda} />

          <p className="fr-text fr-mb-2w">
            En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
            informations ci-dessus sont correctes. En signant ce document,
            j'autorise le transporteur à prendre en charge le déchet.
          </p>

          <form
            onSubmit={handleSubmit(async data => {
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: { ...data, type: BsdaSignatureType.Emission }
                }
              });
              onClose();
            })}
          >
            <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
              <Input
                label="Date de prise en charge"
                nativeInputProps={{
                  type: "date",
                  min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
                  max: datetimeToYYYYMMDD(TODAY),
                  ...register("date")
                }}
                state={formState.errors.date ? "error" : "default"}
                stateRelatedMessage={formState.errors.date?.message}
              />
            </div>
            <div className="fr-col-8 fr-mb-2w">
              <Input
                label="Nom et prénom"
                state={formState.errors.author ? "error" : "default"}
                nativeInputProps={{
                  ...register("author")
                }}
                stateRelatedMessage={formState.errors.author?.message}
              />
            </div>
            <div className="fr-mb-8w">
              {error && <DsfrNotificationError apolloError={error} />}
            </div>

            <hr className="fr-mt-2w" />
            <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
              <Button type="button" priority="secondary" onClick={onCancel}>
                Annuler
              </Button>
              <Button disabled={loading}>Signer</Button>
            </div>
          </form>
        </>
      )}
    </TdModal>
  );
};

export default SignBsdaEmission;
