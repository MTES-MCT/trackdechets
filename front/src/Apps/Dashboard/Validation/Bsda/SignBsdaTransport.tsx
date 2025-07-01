import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaSignatureType,
  FormCompany,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaTransporterArgs,
  Query,
  QueryBsdaArgs,
  TransportMode
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React, { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { generatePath, Link, useParams } from "react-router-dom";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import routes from "../../../routes";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import { GET_BSDA, SIGN_BsDA } from "../../../common/queries/bsda/queries";
import { InitialBsdas } from "./InitialBsdas";
import { UPDATE_BSDA_TRANSPORTER } from "../../../Forms/Components/query";
import { RhfTransportModeSelect } from "../../../Forms/Components/TransportMode/TransportMode";
import { RhfTagsInputWrapper } from "../../../Forms/Components/TagsInput/TagsInputWrapper";
import TransporterRecepisseWrapper from "../../../../form/common/components/company/TransporterRecepisseWrapper";
import Alert from "@codegouvfr/react-dsfr/Alert";

const schema = z.object({
  signature: z.object({
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
      .transform(v => v?.toISOString())
  }),
  company: z.object({
    contact: z.string().nullish(),
    phone: z.string().nullish(),
    mail: z.string().nullish()
  }),
  transport: z
    .object({
      takenOverAt: z.coerce
        .date()
        .nullish()
        .transform(v => v?.toISOString()),
      mode: z.string().nullish(),
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
    }),
  recepisse: z
    .object({
      isExempted: z.boolean().nullish()
    })
    .nullish()
});

export type ZodBdsaTransport = z.infer<typeof schema>;

const SignBsdaTransport = ({ bsdaId, onClose }) => {
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
  >(SIGN_BsDA, {});

  const [updateBsdaTransporter, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsdaTransporter">,
    MutationUpdateBsdaTransporterArgs
  >(UPDATE_BSDA_TRANSPORTER);

  const title = "Signer l'enlèvement";
  const TODAY = useMemo(() => new Date(), []);

  const signingTransporter = useMemo(
    () => data?.bsda?.transporters?.find(t => !t.transport?.signature?.date),
    [data?.bsda]
  );

  const initialState = {
    company: signingTransporter?.company as FormCompany,
    transport: {
      mode: signingTransporter?.transport?.mode ?? TransportMode.Road,
      plates: signingTransporter?.transport?.plates ?? [],
      takenOverAt: signingTransporter?.transport?.takenOverAt
        ? datetimeToYYYYMMDD(new Date(signingTransporter.transport.takenOverAt))
        : new Date().toISOString()
    },
    signature: {
      author: "",
      date: datetimeToYYYYMMDD(TODAY)
    }
  };

  const methods = useForm<ZodBdsaTransport>({
    defaultValues: initialState, // on garde defaultValues pour eviter une boucle infinie sur signingTransporter
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, register, formState } = methods;

  // mettre à jour les valeurs quand signingTransporter est dispo
  useEffect(() => {
    if (!signingTransporter) return;

    reset({
      company: signingTransporter.company as FormCompany,
      transport: {
        mode: signingTransporter.transport?.mode ?? TransportMode.Road,
        plates: signingTransporter.transport?.plates ?? [],
        takenOverAt: signingTransporter?.transport?.takenOverAt
          ? datetimeToYYYYMMDD(
              new Date(signingTransporter.transport.takenOverAt)
            )
          : new Date().toISOString()
      },
      signature: {
        author: "",
        date: datetimeToYYYYMMDD(TODAY)
      }
    });
  }, [signingTransporter, reset, TODAY]);

  const onCancel = () => {
    reset();
    onClose();
  };

  if (data == null) {
    return <Loader />;
  }
  const { bsda } = data;
  const initialBsdas = bsda.forwarding ? [bsda.forwarding] : bsda.grouping;

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      {(bsda.metadata?.errors ?? []).some(
        error =>
          error &&
          error.requiredFor === BsdaSignatureType.Transport &&
          // Transporter Receipt will be auto-completed by the transporter
          !error.path.startsWith("transporterRecepisse") &&
          error.path !== "transporterTransportPlates"
      ) ? (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            obligatoires avant de le signer.
          </p>
          <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
            {bsda.metadata?.errors?.map((error, idx) => (
              <li key={idx}>{error?.message}</li>
            ))}
          </ul>
          <Link
            to={generatePath(routes.dashboard.bsdas.edit, {
              siret,
              id: bsda.id
            })}
            className="fr-btn fr-btn--primary"
          >
            Mettre le bordereau à jour pour le signer
          </Link>
        </>
      ) : !signingTransporter ? (
        <div>Tous les transporteurs ont déjà signé</div>
      ) : (
        <>
          <BsdaWasteSummary bsda={bsda} />
          <BsdaJourneySummary bsda={bsda} />
          {!!initialBsdas?.length && (
            <div className="tw-pb-4">
              <h4 className="fr-text fr-text--bold">BSDAs associés</h4>
              <InitialBsdas bsdas={initialBsdas} />
            </div>
          )}
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(async data => {
                const { transport, signature } = data;
                await updateBsdaTransporter({
                  variables: {
                    id: signingTransporter.id,
                    //@ts-ignore
                    input: { transport: transport }
                  }
                });
                await signBsda({
                  variables: {
                    id: bsda.id,
                    input: {
                      date: signature.date,
                      author: signature.author,
                      type: BsdaSignatureType.Transport
                    }
                  }
                });
                onClose();
              })}
            >
              <h4 className="fr-h4">Transport du déchet</h4>
              <div className="fr-col-12 fr-col-md-6 fr-mb-2w">
                <Input
                  label="Personne à contacter"
                  nativeInputProps={{
                    value: bsda.transporter?.company?.contact ?? "",
                    ...register("company.contact")
                  }}
                />
              </div>
              <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
                <div className="fr-col-12 fr-col-md-4">
                  <Input
                    label="Téléphone"
                    nativeInputProps={{
                      value: bsda.transporter?.company?.phone ?? "",
                      ...register("company.phone")
                    }}
                  />
                </div>
                <div className="fr-col-12 fr-col-md-6">
                  <Input
                    label="Mail"
                    nativeInputProps={{
                      value: bsda.transporter?.company?.mail ?? "",
                      ...register("company.mail")
                    }}
                  />
                </div>
              </div>
              <div className="fr-col-4 fr-mb-5v">
                <RhfTransportModeSelect fieldPath={"transport.mode"} />
              </div>
              <div className="fr-col-8">
                <RhfTagsInputWrapper
                  maxTags={2}
                  label="Immatriculations"
                  fieldName={"transport.plates"}
                  hintText="2 max : Véhicule, remorque"
                />
              </div>

              <TransporterRecepisseWrapper
                transporter={signingTransporter}
                customClass="fr-col-md-11 fr-mb-2w fr-mt-2w"
              />

              {bsda.waste?.adr && (
                <div className="fr-col-md-11 fr-mb-2w fr-mt-2w">
                  <Alert
                    title="Mentions RID et ADR"
                    severity="info"
                    description={
                      <>
                        <p className="fr-mb-1w">ADR : {bsda.waste.adr}</p>
                        {bsda.waste.nonRoadRegulationMention && (
                          <p>RID : {bsda.waste.nonRoadRegulationMention}</p>
                        )}
                      </>
                    }
                  />
                </div>
              )}

              <p className="fr-text fr-mb-2w">
                En qualité de <strong>transporteur du déchet</strong>, j'atteste
                que les informations ci-dessus sont correctes. En signant ce
                document, je déclare prendre en charge le déchet.
              </p>

              <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
                <Input
                  label="Date de prise en charge"
                  nativeInputProps={{
                    type: "date",
                    min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
                    max: datetimeToYYYYMMDD(TODAY),
                    ...register("transport.takenOverAt")
                  }}
                />
              </div>
              <div className="fr-col-8 fr-mb-2w">
                <Input
                  label="Nom et prénom"
                  state={
                    formState.errors.signature?.author ? "error" : "default"
                  }
                  nativeInputProps={{
                    ...register("signature.author")
                  }}
                  stateRelatedMessage={
                    formState.errors.signature?.author?.message
                  }
                />
              </div>
              <div className="fr-mb-8w">
                {updateError && (
                  <DsfrNotificationError apolloError={updateError} />
                )}
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
          </FormProvider>
        </>
      )}
    </TdModal>
  );
};

export default SignBsdaTransport;
