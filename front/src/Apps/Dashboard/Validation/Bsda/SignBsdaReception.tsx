import { useMutation, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsdaInput,
  BsdaSignatureType,
  Mutation,
  MutationSignBsdaArgs,
  MutationUpdateBsdaArgs,
  Query,
  QueryBsdaArgs,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { subMonths } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { Loader } from "../../../common/Components";
import { DsfrNotificationError } from "../../../common/Components/Error/Error";
import TdModal from "../../../common/Components/Modal/Modal";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import { isDefinedStrict, multiplyByRounded } from "../../../../common/helper";

import {
  GET_BSDA,
  SIGN_BsDA,
  UPDATE_BSDA
} from "../../../common/queries/bsda/queries";
import { generatePath, Link, useParams } from "react-router-dom";
import routes from "../../../routes";
import { getComputedState } from "../../Creation/getComputedState";
import SignBsdaOperation from "./SignBsdaOperation";
import { datetimeToYYYYMMDDHHSS } from "../BSPaoh/paohUtils";
import Decimal from "decimal.js";

const schema = z
  .object({
    author: z
      .string({
        required_error:
          "Le nom et prénom de l'auteur de la signature sont requis"
      })
      .refine(val => val.trim() !== "", {
        message: "Le nom et prénom de l'auteur de la signature sont requis"
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
      .date()
      .nullish()
      .transform(v => v?.toISOString()),
    destination: z.object({
      reception: z
        .object({
          acceptationStatus: z.enum(
            ["ACCEPTED", "PARTIALLY_REFUSED", "REFUSED"],
            {
              errorMap: () => ({
                message: "Le statut de l'acceptation est requis"
              })
            }
          ),
          weight: z.coerce.number().positive().nullish(),
          weightIsEstimate: z.boolean().nullish(),
          refusedWeight: z.coerce.number().nonnegative().nullish(),
          refusalReason: z.string().nullish(),
          date: z.coerce
            .date({
              required_error: "La date de réception est requise",
              invalid_type_error: "Format de date invalide."
            })
            .transform(v => v?.toISOString())
        })
        .nullish()
    })
  })
  .superRefine((val, ctx) => {
    if (
      ["PARTIALLY_REFUSED", "REFUSED"].includes(
        val?.destination?.reception?.acceptationStatus as string
      ) &&
      !val?.destination?.reception?.refusalReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination.reception.refusalReason"],

        message: `Vous devez préciser un motif de refus`
      });
    }

    if (
      (val?.destination?.reception?.refusedWeight ?? 0) >
      (val?.destination?.reception?.weight ?? 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination.reception.refusedWeight"],

        message: `Vous ne pouvez refuser un poids supérieur au poids reçu`
      });
    }

    if (
      val?.destination?.reception?.acceptationStatus === "PARTIALLY_REFUSED"
    ) {
      if (
        !val?.destination?.reception?.refusedWeight &&
        val?.destination?.reception?.weight
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destination.reception.refusedWeight"],

          message: `Vous devez préciser le poids refusé`
        });
      }
    }
  });
export type ZodBsdaReception = z.infer<typeof schema>;

const SignBsdaReception = ({ bsdaId, onClose }) => {
  const { siret } = useParams<{ siret: string }>();

  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId
    },
    fetchPolicy: "network-only"
  });

  const [updateBsda, { loading: loadingUpdate, error: updateError }] =
    useMutation<Pick<Mutation, "updateBsda">, MutationUpdateBsdaArgs>(
      UPDATE_BSDA
    );
  const [signBsda, { loading, error }] = useMutation<
    Pick<Mutation, "signBsda">,
    MutationSignBsdaArgs
  >(SIGN_BsDA);

  const title = "Signer la réception et l'acceptation";
  const TODAY = React.useMemo(() => new Date(), []);

  const initialState = React.useMemo(() => {
    if (!data?.bsda) return undefined;

    return {
      date: datetimeToYYYYMMDDHHSS(TODAY),
      author: "",
      ...getComputedState(
        {
          destination: {
            plannedOperationCode: data.bsda.destination?.plannedOperationCode,
            reception: {
              date: datetimeToYYYYMMDD(TODAY),
              acceptationStatus: "",
              refusalReason: "",
              weight: data.bsda.weight?.value
            }
          }
        },
        data.bsda
      )
    } as ZodBsdaReception;
  }, [data, TODAY]);

  const methods = useForm<ZodBsdaReception>({
    defaultValues: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, formState, register, watch, setValue, trigger } =
    methods;

  const onCancel = () => {
    reset();
    onClose();
  };

  const acceptationStatus = watch("destination.reception.acceptationStatus");
  const acceptationRadioOptions = [
    {
      label: "La réception et l'acceptation",

      nativeInputProps: {
        ...register("destination.reception.acceptationStatus", {}),
        value: "ACCEPTED"
      }
    },
    {
      label: "La réception et un refus partiel",
      nativeInputProps: {
        ...register("destination.reception.acceptationStatus", {}),
        value: "PARTIALLY_REFUSED"
      }
    },
    {
      label: "La réception et un refus total",
      nativeInputProps: {
        ...register("destination.reception.acceptationStatus", {}),
        value: "REFUSED"
      }
    }
  ];

  const isEligibleToEstimateWeight = data?.bsda?.packagings?.some(
    p => p.type === "CONTENEUR_BAG"
  );
  const receivedWeight = watch("destination.reception.weight");
  const receivedWeightIsEstimate = watch(
    "destination.reception.weightIsEstimate"
  );
  const refusedWeight = watch("destination.reception.refusedWeight");
  const isFormValid = !Object.keys(formState.errors ?? {}).length;

  const refusedWeightDisabled =
    !receivedWeight || ["ACCEPTED", "REFUSED"].includes(acceptationStatus);

  const acceptedWeight = receivedWeight
    ? new Decimal(receivedWeight ?? 0)
        .minus(isDefinedStrict(refusedWeight) ? refusedWeight! : 0)
        .toDecimalPlaces(6)
        .toNumber()
    : 0;

  useEffect(() => {
    if (initialState) {
      reset(initialState);
      setValue("destination.reception.date", datetimeToYYYYMMDD(TODAY));
    }
  }, [initialState, reset, TODAY, setValue]);

  useEffect(() => {
    if (["ACCEPTED", "RECEIVED"].includes(acceptationStatus)) {
      setValue("destination.reception.refusedWeight", 0);
      setValue("destination.reception.refusalReason", "");
    }
    if (acceptationStatus === "REFUSED" && !!receivedWeight) {
      setValue("destination.reception.refusedWeight", receivedWeight);
    }

    if (acceptationStatus === "PARTIALLY_REFUSED" && !!receivedWeight) {
      setValue("destination.reception.refusedWeight", 0);
      return;
    }
    // manually set values do not trigger re-validation
    trigger("destination.reception.refusedWeight");
  }, [acceptationStatus, receivedWeight, setValue, trigger]);

  const [isOperationModalOpended, setIsOperationModalOpened] = useState(false);
  const isTwoStepSignature = useRef(false);

  const onClickTwoStepSignature = event => {
    isTwoStepSignature.current = true;
    event.target.form.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  };

  const handleClose = useCallback(() => {
    if (isTwoStepSignature.current) {
      if (!!formState.errors && !error && !updateError)
        setIsOperationModalOpened(true);
    } else {
      onClose();
    }
  }, [error, formState.errors, onClose, updateError]);

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  return (
    <>
      <TdModal
        onClose={onClose}
        title={title}
        ariaLabel={title}
        isOpen
        size="L"
      >
        {bsda.metadata?.errors?.some(
          error => error?.requiredFor === BsdaSignatureType.Emission
        ) ? (
          <>
            <p className="fr-mt-2w tw-text-red-700">
              Vous devez mettre à jour le bordereau et renseigner les champs
              obligatoires avant de le signer.
            </p>

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
        ) : (
          <>
            <BsdaWasteSummary bsda={bsda} />
            <BsdaJourneySummary bsda={bsda} />
            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(async data => {
                  const { author, date, ...update } = data;
                  await updateBsda({
                    variables: {
                      id: bsda.id,
                      input: update as BsdaInput
                    }
                  });
                  await signBsda({
                    variables: {
                      id: bsda.id,
                      input: {
                        date,
                        author,
                        type: BsdaSignatureType.Reception
                      }
                    }
                  });
                  handleClose();
                })}
              >
                <p className="fr-text fr-mt-1w fr-mb-2w">
                  Je souhaite effectuer
                </p>
                <RadioButtons
                  state={
                    formState.errors?.destination?.reception
                      ?.acceptationStatus && "error"
                  }
                  stateRelatedMessage={
                    (formState.errors?.destination?.reception?.acceptationStatus
                      ?.message as string) ?? ""
                  }
                  options={acceptationRadioOptions}
                  className="fr-mb-1w"
                />

                <h4 className="fr-h4">
                  <strong>Réception</strong>
                </h4>
                <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters fr-mb-0">
                  <div className="fr-col-4">
                    <NonScrollableInput
                      label="Poids total net en tonnes"
                      state={
                        formState.errors?.destination?.reception?.weight &&
                        "error"
                      }
                      stateRelatedMessage={
                        (formState.errors?.destination?.reception?.weight
                          ?.message as string) ?? ""
                      }
                      nativeInputProps={{
                        inputMode: "decimal",
                        step: "0.000001",
                        type: "number",
                        ...register("destination.reception.weight")
                      }}
                      disabled={
                        acceptationStatus === WasteAcceptationStatus.Refused
                      }
                    />
                    <p
                      className="fr-text fr-text--xs"
                      style={{ color: "#0063CB" }}
                    >
                      <span className="fr-icon-info-fill fr-mr-1w"></span>Soit{" "}
                      {multiplyByRounded(receivedWeight)} kilos
                    </p>
                  </div>
                  {isEligibleToEstimateWeight && (
                    <div className="fr-col-6">
                      <p className="fr-text fr-mt-1w fr-mb-2w">
                        Cette quantité est
                      </p>
                      <RadioButtons
                        state={
                          formState.errors?.destination?.reception
                            ?.weightIsEstimate && "error"
                        }
                        stateRelatedMessage={
                          (formState.errors?.destination?.reception
                            ?.weightIsEstimate?.message as string) ?? ""
                        }
                        options={[
                          {
                            label: "réelle",
                            nativeInputProps: {
                              onChange: () =>
                                setValue(
                                  "destination.reception.weightIsEstimate",
                                  false
                                ),

                              checked: receivedWeightIsEstimate == false
                            }
                          },
                          {
                            label: "estimée",
                            nativeInputProps: {
                              onChange: () =>
                                setValue(
                                  "destination.reception.weightIsEstimate",
                                  true
                                ),
                              checked: receivedWeightIsEstimate === true
                            }
                          }
                        ]}
                        className="fr-mb-1w"
                      />
                    </div>
                  )}
                </div>

                {receivedWeightIsEstimate && (
                  <div>
                    <Alert
                      severity="warning"
                      title="Code d'opération & poids receptionné estimé"
                      description={
                        <>
                          Il est permis de renseigner un poids estimé uniquement
                          dans le cas d'un conteneur-bag et d'une installation
                          intermédiaire. L'exutoire final devra renseigner un
                          poids réel.
                        </>
                      }
                    />
                  </div>
                )}

                {[
                  WasteAcceptationStatus.Accepted,
                  WasteAcceptationStatus.Refused,
                  WasteAcceptationStatus.PartiallyRefused
                ].includes(acceptationStatus as WasteAcceptationStatus) && (
                  <>
                    <h4 className="fr-h4">
                      <strong>Acceptation</strong>
                    </h4>
                    <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
                      <div className="fr-col-12 fr-col-md-4">
                        <h6 className="fr-text--lg">
                          <strong>Poids refusé</strong>
                        </h6>
                        <NonScrollableInput
                          label="Poids total net en tonnes"
                          disabled={refusedWeightDisabled}
                          className="fr-col-12"
                          state={
                            formState.errors?.destination?.reception
                              ?.refusedWeight && "error"
                          }
                          stateRelatedMessage={
                            (formState.errors?.destination?.reception
                              ?.refusedWeight?.message as string) ?? ""
                          }
                          nativeInputProps={{
                            inputMode: "decimal",
                            step: "0.000001",
                            type: "number",
                            ...register("destination.reception.refusedWeight")
                          }}
                        />
                        <p
                          className="fr-text fr-text--xs"
                          style={{ color: "#0063CB" }}
                        >
                          <span className="fr-icon-info-fill fr-mr-1w"></span>
                          Soit {multiplyByRounded(refusedWeight)} kilos
                        </p>
                      </div>
                      <div className="fr-col-12 fr-col-md-4">
                        <h6 className="fr-text--lg">
                          <strong>Poids accepté</strong>
                        </h6>
                        <NonScrollableInput
                          label="Poids total net en tonnes"
                          disabled
                          className="fr-col-12"
                          nativeInputProps={{
                            value: acceptedWeight,
                            inputMode: "decimal",
                            step: "0.000001",
                            type: "number"
                          }}
                        />
                        <p
                          className="fr-text fr-text--xs"
                          style={{ color: "#0063CB" }}
                        >
                          <span className="fr-icon-info-fill fr-mr-1w"></span>
                          Soit {multiplyByRounded(acceptedWeight)} kilos
                        </p>
                      </div>
                    </div>
                    {[
                      WasteAcceptationStatus.Refused,
                      WasteAcceptationStatus.PartiallyRefused
                    ].includes(acceptationStatus as WasteAcceptationStatus) && (
                      <Input
                        label="Motif de refus"
                        textArea
                        className="fr-col-12 fr-mb-2w"
                        state={
                          formState.errors?.destination?.reception
                            ?.refusalReason && "error"
                        }
                        stateRelatedMessage={
                          (formState.errors?.destination?.reception
                            ?.refusalReason?.message as string) ?? ""
                        }
                        nativeTextAreaProps={{
                          ...register("destination.reception.refusalReason")
                        }}
                      />
                    )}
                  </>
                )}

                <p className="fr-text fr-mb-2w">
                  En qualité de <strong>destinataire du déchet</strong>, je
                  confirme la réception des déchets pour la quantité indiquée
                  dans ce bordereau. En cas de refus partiel ou total
                  uniquement, un mail automatique Trackdéchets informera le
                  producteur de ce refus, accompagné du récépissé PDF.
                  L'inspection des ICPE et ma société en recevront également une
                  copie.
                </p>

                <div className="fr-col-8 fr-col-sm-4 fr-mb-2w">
                  <Input
                    label="Date de réception"
                    nativeInputProps={{
                      type: "date",
                      min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
                      max: datetimeToYYYYMMDD(TODAY),
                      ...register("destination.reception.date")
                    }}
                    state={
                      formState.errors.destination?.reception?.date
                        ? "error"
                        : "default"
                    }
                    stateRelatedMessage={
                      formState.errors.destination?.reception?.date?.message
                    }
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
                  {error && <DsfrNotificationError apolloError={error} />}
                </div>

                <hr className="fr-mt-2w" />
                <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                  <Button
                    type="button"
                    priority="secondary"
                    onClick={onCancel}
                    disabled={loading || loadingUpdate}
                  >
                    Annuler
                  </Button>
                  {acceptationStatus !== "REFUSED" && (
                    <Button
                      type="button"
                      disabled={
                        loading || formState.isSubmitting || !isFormValid
                      }
                      onClick={onClickTwoStepSignature}
                    >
                      Signer et passer à l'étape traitement
                    </Button>
                  )}
                  <Button
                    disabled={loading || formState.isSubmitting || !isFormValid}
                  >
                    Signer
                  </Button>
                </div>
              </form>
            </FormProvider>
          </>
        )}
      </TdModal>
      {isOperationModalOpended && (
        <SignBsdaOperation bsdaId={bsdaId} onClose={onClose} />
      )}
    </>
  );
};

export default SignBsdaReception;
