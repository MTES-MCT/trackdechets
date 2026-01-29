import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaSignatureType,
  BsdaType,
  Mutation,
  MutationSignBsdaArgs,
  Query,
  QueryBsdaArgs
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import { GET_BSDA, SIGN_BsDA } from "../../../common/queries/bsda/queries";
import { InitialBsdas } from "./InitialBsdas";

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
  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId
    },
    fetchPolicy: "network-only"
  });

  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BsDA, {});

  const title = "Signer le bordereau";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: ""
  };

  const { handleSubmit, reset, formState, register } = useForm<ZodBdsaEmission>(
    {
      defaultValues: initialState,
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

  const initialBsdas = bsda.forwarding ? [bsda.forwarding] : bsda.grouping;

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <>
        <BsdaWasteSummary
          bsda={bsda}
          showScelles={
            bsda.status === "INITIAL" &&
            (bsda.type === BsdaType.Gathering ||
              bsda.type === BsdaType.Reshipment)
          }
        />
        <BsdaJourneySummary bsda={bsda} />
        {!!initialBsdas?.length && (
          <div className="tw-pb-4">
            <h4 className="fr-text fr-text--bold">BSDAs associés</h4>
            <InitialBsdas bsdas={initialBsdas} />
          </div>
        )}

        <p className="fr-text fr-mb-2w">
          En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
          informations ci-dessus sont correctes. En signant ce document,
          j'autorise les établissements désignés à prendre en charge le déchet.
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
              label="Date d'émission"
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
    </TdModal>
  );
};

export default SignBsdaEmission;
