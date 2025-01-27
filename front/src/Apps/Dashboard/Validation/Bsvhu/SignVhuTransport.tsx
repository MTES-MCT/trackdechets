import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mutation,
  MutationSignBsvhuArgs,
  Query,
  QueryBsvhuArgs,
  SignatureTypeInput,
  MutationUpdateBsvhuArgs,
  TransportMode
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { generatePath, Link, useLocation, useParams } from "react-router-dom";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import {
  GET_VHU_FORM,
  SIGN_BSVHU,
  UPDATE_VHU_FORM
} from "../../../common/queries/bsvhu/queries";
import routes from "../../../routes";
import { BsvhuJourneySummary } from "./BsvhuJourneySummary";
import WasteVhuSummary from "./WasteVhuSummary";
import { RhfTagsInputWrapper } from "../../../Forms/Components/TagsInput/TagsInputWrapper";
import { RhfTransportModeSelect } from "../../../Forms/Components/TransportMode/TransportMode";

const transportModes = [
  TransportMode.Road,
  TransportMode.Air,
  TransportMode.Rail,
  TransportMode.River,
  TransportMode.Sea
];

const schema = z
  .object({
    author: z
      .string({
        required_error:
          "Le nom et prénom de l'auteur de la signature est requis"
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
      .transform(v => v?.toISOString()),
    mode: z.string(),
    plates: z.preprocess(
      val => (Array.isArray(val) ? val : [val]).filter(Boolean),
      z
        .string()
        .array()

        .max(2, "2 plaques d'immatriculation maximum")
    )
  })
  .superRefine((val, ctx) => {
    if (val.mode === "ROAD" && !val.plates?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plates"],
        message: `Ce champ est requis pour le transport routier`
      });
    }
  });
export type ZodBsvhuTransport = z.infer<typeof schema>;

const SignVhuTransport = ({ bsvhuId, onClose }) => {
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

  const [updateBsvhu, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);
  const [signBsvhu, { loading, error: signError }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const title = "Signer l'enlèvement";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: "",
    mode:
      data?.bsvhu?.transporter?.transport?.mode &&
      transportModes.includes(data?.bsvhu?.transporter?.transport?.mode)
        ? data?.bsvhu?.transporter?.transport?.mode
        : TransportMode.Road,
    plates: data?.bsvhu?.transporter?.transport?.plates ?? []
  };

  const methods = useForm<ZodBsvhuTransport>({
    mode: "onTouched",
    values: initialState,
    resolver: async (data, context, options) =>
      zodResolver(schema)(data, context, options)
  });
  const { handleSubmit, reset, formState, register } = methods;
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

          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(async values => {
                const { author, date, mode, plates } = values;

                await updateBsvhu({
                  variables: {
                    id: bsvhuId,
                    input: {
                      transporter: {
                        transport: { mode: mode as TransportMode, plates }
                      }
                    }
                  }
                });
                await signBsvhu({
                  variables: {
                    id: bsvhu.id,
                    input: {
                      author,
                      date,
                      type: SignatureTypeInput.Transport
                    }
                  }
                });
                onClose();
              })}
            >
              <h5 className="fr-h5">Transport du déchet</h5>
              <div className="fr-col-6 fr-mb-5v">
                <RhfTransportModeSelect fieldPath={"mode"} />
              </div>
              <RhfTagsInputWrapper
                maxTags={2}
                label="Immatriculations"
                fieldName={"plates"}
                hintText="2 max : Véhicule, remorque"
              />

              <p className="fr-text fr-mt-2w fr-mb-2w">
                En qualité <strong>de transporteur du déchet</strong>, j'atteste
                que les informations ci-dessus sont correctes. En signant ce
                document, je déclare prendre en charge le déchet.
              </p>
              <div className="fr-col-4 fr-mb-2w">
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
                {updateError && (
                  <DsfrNotificationError apolloError={updateError} />
                )}
                {signError && <DsfrNotificationError apolloError={signError} />}
              </div>

              <hr className="fr-mt-2w" />
              <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                <Button type="button" priority="secondary" onClick={onCancel}>
                  Annuler
                </Button>
                <Button disabled={loading}>Signer</Button>
              </div>
            </form>
          </FormProvider>
        </>
      )}
    </TdModal>
  );
};

export default SignVhuTransport;
