import { useMutation, useQuery } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsvhuInput,
  Mutation,
  MutationSignBsvhuArgs,
  MutationUpdateBsvhuArgs,
  Query,
  QueryBsvhuArgs,
  SignatureTypeInput,
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
import {
  GET_VHU_FORM,
  SIGN_BSVHU,
  UPDATE_VHU_FORM
} from "../../../common/queries/bsvhu/queries";
import { BsvhuJourneySummary } from "./BsvhuJourneySummary";
import WasteVhuSummary from "./WasteVhuSummary";
import NonScrollableInput from "../../../common/Components/NonScrollableInput/NonScrollableInput";
import { multiplyByRounded } from "../../../../common/helper";
import SignVhuOperation from "./SignVhuOperation";

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
        weight: z.coerce.number().nonnegative().nullish(),
        refusalReason: z.string().nullish(),
        date: z.coerce
          .date({
            required_error: "La date de prise en charge est requise",
            invalid_type_error: "Format de date invalide."
          })
          .transform(v => v?.toISOString())
      })
      .nullish()
  })
});
export type ZodBsvhuReception = z.infer<typeof schema>;

const SignVhuReception = ({ bsvhuId, onClose }) => {
  const { data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsvhuId
      }
    }
  );

  const [updateBsvhu, { error: updateError, loading: loadingUpdate }] =
    useMutation<Pick<Mutation, "updateBsvhu">, MutationUpdateBsvhuArgs>(
      UPDATE_VHU_FORM
    );

  const [signBsvhu, { loading, error }] = useMutation<
    Pick<Mutation, "signBsvhu">,
    MutationSignBsvhuArgs
  >(SIGN_BSVHU);

  const title = "Signer la réception et le traitement";
  const TODAY = new Date();

  const initialState = {
    date: datetimeToYYYYMMDD(TODAY),
    author: "",
    destination: {}
  };

  const methods = useForm<ZodBsvhuReception>({
    values: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const { handleSubmit, reset, formState, register, watch, setValue } = methods;

  const onCancel = () => {
    reset();
    onClose();
  };

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

  const receivedWeight = watch("destination.reception.weight");
  const acceptationStatus = watch("destination.reception.acceptationStatus");

  useEffect(() => {
    if (acceptationStatus === "REFUSED") {
      setValue("destination.reception.weight", 0);
    }
  }, [acceptationStatus, setValue]);

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

  const { bsvhu } = data;

  return (
    <>
      <TdModal
        onClose={onClose}
        title={title}
        ariaLabel={title}
        isOpen
        size="L"
      >
        <WasteVhuSummary bsvhu={bsvhu} />
        <BsvhuJourneySummary bsvhu={bsvhu} />

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(async data => {
              const { author, date, ...update } = data;
              await updateBsvhu({
                variables: {
                  id: bsvhuId,
                  input: update as BsvhuInput
                }
              });
              await signBsvhu({
                variables: {
                  id: bsvhu.id,
                  input: {
                    author,
                    date: TODAY.toISOString(),
                    type: SignatureTypeInput.Reception
                  }
                }
              });
              handleClose();
            })}
          >
            <p className="fr-text fr-mb-2w">Je souhaite effectuer</p>
            <RadioButtons
              state={
                formState.errors?.destination?.reception?.acceptationStatus &&
                "error"
              }
              stateRelatedMessage={
                (formState.errors?.destination?.reception?.acceptationStatus
                  ?.message as string) ?? ""
              }
              options={acceptationRadioOptions}
            />

            <h4 className="fr-h4">
              <strong>Réception et acceptation</strong>
            </h4>
            <div className="fr-grid-row fr-grid-row--top">
              <div className="fr-col-12 fr-col-md-4">
                <NonScrollableInput
                  label="Poids total net en tonnes"
                  className="fr-col-12"
                  state={
                    formState.errors?.destination?.reception?.weight && "error"
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
                <p className="fr-text fr-text--xs" style={{ color: "#0063CB" }}>
                  <span className="fr-icon-info-fill fr-mr-1w"></span>Soit{" "}
                  {multiplyByRounded(receivedWeight)} kilos
                </p>
              </div>

              {[
                WasteAcceptationStatus.Refused,
                WasteAcceptationStatus.PartiallyRefused
              ].includes(acceptationStatus as WasteAcceptationStatus) && (
                <Input
                  label="Motif du refus"
                  textArea
                  className="fr-col-12"
                  state={
                    formState.errors?.destination?.reception?.refusalReason &&
                    "error"
                  }
                  stateRelatedMessage={
                    (formState.errors?.destination?.reception?.refusalReason
                      ?.message as string) ?? ""
                  }
                  nativeTextAreaProps={{
                    ...register("destination.reception.refusalReason")
                  }}
                />
              )}
            </div>

            <p className="fr-text fr-mb-2w">
              En qualité de <strong>destinataire du déchet</strong>, j'atteste
              que les informations ci-dessus sont correctes. En signant, je
              confirme le traitement des déchets pour la quantité indiquée dans
              ce bordereau.
            </p>

            <div className="fr-col-4 fr-mb-2w">
              <Input
                label="Date de prise en charge"
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
              <Button
                type="button"
                disabled={loading || loadingUpdate}
                onClick={onClickTwoStepSignature}
              >
                Signer et passer à l'étape traitement
              </Button>
              <Button disabled={loading || loadingUpdate}>Signer</Button>
            </div>
          </form>
        </FormProvider>
      </TdModal>
      {isOperationModalOpended && (
        <SignVhuOperation bsvhuId={bsvhuId} onClose={onClose} />
      )}
    </>
  );
};

export default SignVhuReception;
