import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mutation,
  MutationSignBsvhuArgs,
  Query,
  QueryBsvhuArgs,
  SignatureTypeInput
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React from "react";
import { useForm } from "react-hook-form";
import { generatePath, Link, useLocation, useParams } from "react-router-dom";
import { z } from "@td/validation";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import {
  GET_VHU_FORM,
  SIGN_BSVHU
} from "../../../common/queries/bsvhu/queries";
import routes from "../../../routes";
import { BsvhuJourneySummary } from "./BsvhuJourneySummary";
import WasteVhuSummary from "./WasteVhuSummary";

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
export type ZodBsvhuEmission = z.infer<typeof schema>;

const SignVhuEmission = ({ bsvhuId, onClose }) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const { data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsvhuId
      }
    }
  );

  const [signBsvhu, { loading, error }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const title = "Signer le bordereau";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: ""
  };

  const { handleSubmit, reset, formState, register } =
    useForm<ZodBsvhuEmission>({
      values: initialState,
      resolver: async (data, context, options) => {
        return zodResolver(schema)(data, context, options);
      }
    });

  if (data == null) {
    return <Loader />;
  }

  const { bsvhu } = data;

  const onCancel = () => {
    reset();
    onClose();
  };

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      {bsvhu.metadata?.errors?.some(
        error => error.requiredFor === SignatureTypeInput.Emission
      ) ? (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            obligatoires avant de le signer.
          </p>
          <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
            {bsvhu.metadata?.errors.map((error, idx) => (
              <li key={idx}>{error.message}</li>
            ))}
          </ul>
          <Link
            to={generatePath(routes.dashboard.bsvhus.edit, {
              siret,
              id: bsvhu.id
            })}
            className="btn btn--primary"
            state={{ background: location }}
          >
            Mettre le bordereau à jour pour le signer
          </Link>
        </>
      ) : (
        <>
          <WasteVhuSummary bsvhu={bsvhu} />
          <BsvhuJourneySummary bsvhu={bsvhu} />

          <p className="fr-text fr-mb-2w">
            En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
            informations ci-dessus sont correctes. En signant ce document,
            j'autorise le transporteur à prendre en charge le déchet.
          </p>

          <form
            onSubmit={handleSubmit(async data => {
              await signBsvhu({
                variables: {
                  id: bsvhu.id,
                  input: {
                    ...data,
                    type: SignatureTypeInput.Emission
                  }
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

export default SignVhuEmission;
