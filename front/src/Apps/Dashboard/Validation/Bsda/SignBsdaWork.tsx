import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaConsistence,
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
  Query,
  QueryBsdaArgs
} from "@td/codegen-ui";
import { subMonths } from "date-fns";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import {
  GET_BSDA,
  SIGN_BsDA,
  UPDATE_BSDA
} from "../../../common/queries/bsda/queries";
import { InitialBsdas } from "./InitialBsdas";
import {
  bsdaPackagingTypes,
  cleanPackagings
} from "../../../Forms/Components/PackagingList/helpers";
import RhfPackagingList from "../../../Forms/Components/PackagingList/RhfPackagingList";
import Select from "@codegouvfr/react-dsfr/Select";
import { WASTE_NAME_LABEL } from "../../../common/wordings/wordingsCommon";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import { RhfTagsInputWrapper } from "../../../Forms/Components/TagsInput/TagsInputWrapper";
import { getComputedState } from "../../Creation/getComputedState";

const schema = z.object({
  waste: z.object({
    familyCode: z.string().nullish(),
    materialName: z.string().nullish(),
    consistence: z.string().nullish(),
    adr: z.string().nullish(),
    nonRoadRegulationMention: z.string().nullish(),
    pop: z.boolean().nullish(),
    isSubjectToADR: z.boolean().nullish(),
    sealNumbers: z.array(z.string()).nullish()
  }),
  weight: z.object({
    value: z.coerce
      .number()
      .nonnegative()
      .nullish()
      .transform(v => {
        return !v ? null : v;
      }),

    isEstimate: z.boolean().nullish()
  }),
  packagings: z
    .array(
      z
        .object({
          type: z.enum(
            [
              "BIG_BAG",
              "CONTENEUR_BAG",
              "DEPOT_BAG",
              "OTHER",
              "PALETTE_FILME",
              "SAC_RENFORCE"
            ],
            {
              required_error: "Ce champ est requis",
              invalid_type_error: "Ce champ est requis"
            }
          ),
          volume: z
            .union([z.string(), z.number(), z.null()])
            .nullish()
            .transform(val =>
              val === "" || val === null || val === undefined
                ? null
                : Number(val)
            )
            .refine(
              v => v === null || v > 0,
              "Le volume doit être supérieur à 0"
            ),
          other: z.string().nullish(),
          quantity: z.coerce
            .number()
            .positive("Ce champ est requis est doit être supérieur à 0"),
          identificationNumbers: z.array(z.string()).nullish()
        })
        .superRefine((values, context) => {
          if (values.type === "OTHER" && !values.other) {
            context.addIssue({
              code: z.ZodIssueCode.custom,

              message: "Veuillez préciser le conditionnement",

              path: ["other"]
            });
          }
        })
    )
    .nullish(),
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
export type ZodBdsaWork = z.infer<typeof schema>;

const SignBsdaWork = ({ bsdaId, onClose }) => {
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

  const [updateBsda, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);

  const title = "Signer le bordereau";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: "",
    ...getComputedState(
      {
        waste: {
          familyCode: "",
          materialName: "",
          adr: "",
          isSubjectToADR: null,
          nonRoadRegulationMention: "",
          consistence: BsdaConsistence.Solide,
          sealNumbers: []
        },
        weight: {
          value: null,
          isEstimate: false
        },
        packagings: []
      },
      data?.bsda
    )
  };

  const methods = useForm<ZodBdsaWork>({
    values: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, formState, register, setValue, watch } = methods;

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  const onCancel = () => {
    reset();
    onClose();
  };

  const initialBsdas = bsda.forwarding ? [bsda.forwarding] : bsda.grouping;
  const weight = watch("weight.value");
  const isEstimate = watch("weight.isEstimate");
  const pop = watch("waste.pop");
  const isSubjectToADR = watch("waste.isSubjectToADR");

  const isDechetterie = bsda?.type === "COLLECTION_2710";

  return (
    <TdModal onClose={onClose} title={title} ariaLabel={title} isOpen size="L">
      <>
        <BsdaWasteSummary bsda={bsda} showCap />
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
              const { author, date, ...update } = data;
              await updateBsda({
                variables: {
                  id: bsda.id,
                  input: {
                    ...update,
                    //@ts-ignore
                    packagings: cleanPackagings(update.packagings)
                  }
                }
              });
              await signBsda({
                variables: {
                  id: bsda.id,
                  input: {
                    author,
                    date,
                    type: BsdaSignatureType.Work
                  }
                }
              });
              onClose();
            })}
          >
            <Select
              label="Code famille"
              nativeSelectProps={{
                ...register("waste.familyCode")
              }}
            >
              <option value="">Sélectionnez une valeur...</option>
              <option value="1">
                1 - amiante pur utilisé en bourrage ou en sac
              </option>
              <option value="2">
                2 - amiante mélangé dans des poudres ou des produits minéraux
                sans liaison forte
              </option>
              <option value="3">
                3 - amiante intégré dans des liquides ou des solutions
                visqueuses
              </option>
              <option value="4">4 - amiante tissé ou tressé</option>
              <option value="5">5 - amiante en feuilles ou en plaques</option>
              <option value="6">6 - amiante lié à des matériaux inertes</option>
              <option value="7">
                7 - amiante noyé dans une résine ou une matière plastique
              </option>
              <option value="8">
                8 - amiante dans des matériels et équipements
              </option>
              <option value="9">
                9 - tous les matériaux contaminés susceptibles d'émettre des
                fibres
              </option>
            </Select>

            <Input
              label={WASTE_NAME_LABEL}
              nativeInputProps={{
                ...register("waste.materialName")
              }}
            />

            <ToggleSwitch
              label="Le déchet est soumis à l'ADR"
              checked={Boolean(isSubjectToADR)}
              onChange={(checked: boolean) => {
                setValue("waste.isSubjectToADR", checked);
              }}
              className="fr-mt-4w"
            />

            {isSubjectToADR && (
              <Input
                label="Mention au titre du règlement ADR"
                className="fr-mt-2w"
                nativeInputProps={{
                  ...register("waste.adr")
                }}
              />
            )}
            <hr className="fr-mt-2w" />

            <Input
              label="Mentions au titre des règlements RID, ADNR, IMDG (optionnel)"
              nativeInputProps={{
                ...register("waste.nonRoadRegulationMention")
              }}
            />

            <ToggleSwitch
              label={
                <span>
                  Le déchet contient des{" "}
                  <a
                    className="fr-link force-external-link-content force-underline-link"
                    href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    polluants organiques persistants
                  </a>
                </span>
              }
              checked={Boolean(pop)}
              onChange={(checked: boolean) => {
                setValue("waste.pop", checked);
              }}
              className="fr-mt-4w"
            />
            <hr className="fr-mt-2w" />

            <h4 className="fr-h4">Conditionnement</h4>
            <RhfPackagingList
              fieldName="packagings"
              packagingTypes={bsdaPackagingTypes}
            />

            <h4 className="fr-h4">Consistance</h4>
            <RadioButtons
              orientation="horizontal"
              options={[
                {
                  label: "Solide",
                  nativeInputProps: {
                    ...register("waste.consistence"),
                    value: BsdaConsistence.Solide
                  }
                },
                {
                  label: "Pulvérulent",
                  nativeInputProps: {
                    ...register("waste.consistence"),
                    value: BsdaConsistence.Pulverulent
                  }
                },
                {
                  label: "Pâteux",
                  nativeInputProps: {
                    ...register("waste.consistence"),
                    value: BsdaConsistence.Pateux
                  }
                },
                {
                  label: "Autre",
                  nativeInputProps: {
                    ...register("waste.consistence"),
                    value: BsdaConsistence.Other
                  }
                }
              ]}
            />

            <h4 className="fr-h4 fr-mt-4w">Quantité remise</h4>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
              <div className="fr-col-12 fr-col-md-6">
                <NonScrollableInput
                  label="Poids total en tonnes"
                  nativeInputProps={{
                    inputMode: "decimal",
                    step: "0.001",
                    type: "number",
                    ...register("weight.value")
                  }}
                />

                <p className="fr-info-text fr-mt-5v">
                  Soit {(weight || 0) * 1000} kg
                </p>
              </div>

              <div className="fr-col-12 fr-col-md-6">
                <RadioButtons
                  legend="Cette quantité est"
                  orientation="horizontal"
                  options={[
                    {
                      label: "réelle",
                      nativeInputProps: {
                        onChange: () => setValue("weight.isEstimate", false),

                        checked: isEstimate === false
                      }
                    },
                    {
                      label: "estimée",
                      nativeInputProps: {
                        onChange: () => setValue("weight.isEstimate", true),
                        checked: isEstimate === true
                      }
                    }
                  ]}
                />
              </div>
            </div>

            {!isDechetterie && (
              <>
                <h4 className="fr-h4 fr-mt-4w">Numéros de scellés</h4>
                <RhfTagsInputWrapper
                  label="Numéros"
                  fieldName={"waste.sealNumbers"}
                />
              </>
            )}
            <p className="fr-text fr-mt-2w fr-mb-2w">
              En qualité <strong>d'entreprise de travaux</strong>, j'atteste que
              les informations ci-dessus sont correctes. En signant ce document,
              j'autorise le transporteur à prendre en charge le déchet.
            </p>
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
              {updateError && (
                <DsfrNotificationError apolloError={updateError} />
              )}
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
    </TdModal>
  );
};

export default SignBsdaWork;
