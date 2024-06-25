import { useMutation } from "@apollo/client";

import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import RhfOperationModeSelect from "../../../../../common/components/RhfOperationModeSelect";

import { getDasriPackagingInfosSummary } from "../../../../../form/bsdasri/utils/packagings";

import DsfrfWorkSiteAddress from "../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import {
  Bsdasri,
  BsdasriType,
  Mutation,
  MutationCreateBsdasriRevisionRequestArgs,
  BsdasriStatus
} from "@td/codegen-ui";
import { removeEmptyKeys } from "../../../../../common/helper";

import { CREATE_BSDASRI_REVISION_REQUEST } from "../../../../../Apps/common/queries/reviews/BsdasriReviewQuery";
import styles from "./BsdasriRequestRevision.module.scss";

import { BsdasriRequestRevisionCancelationInput } from "../BsdasriRequestRevisionCancelationInput";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { RhfReviewableField } from "../RhfReviewableField";

import { BsdasriPackagings } from "../../../../../form/bsdasri/components/packagings/RhfPackagings";

type Props = {
  readonly bsdasri: Bsdasri;
};

const bsdasriPackagingSchema = z
  .object({
    type: z.enum(
      [
        "BOITE_CARTON",
        "FUT",
        "BOITE_PERFORANTS",
        "GRAND_EMBALLAGE",
        "GRV",
        "AUTRE"
      ],
      {
        required_error: "Ce champ est requis",
        invalid_type_error: "Ce champ est requis"
      }
    ),
    other: z.string(),
    volume: z.coerce
      .number()
      .positive("Ce champ est requis est doit être supérieur à 0"),

    quantity: z.coerce
      .number()
      .positive("Ce champ est requis est doit être supérieur à 0")
  })
  .superRefine((values, context) => {
    if (values.type === "AUTRE" && !values.other) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        message: "Veuillez préciser le conditionnement",

        path: ["other"]
      });
    }
  });

const getSchema = () =>
  z.object({
    emitter: z
      .object({
        pickupSite: z.object({
          name: z.string().nullish(),
          address: z.string().nullish(),
          city: z.string().nullish(),
          postalCode: z.string().nullish(),
          infos: z.string().nullish()
        })
      })
      .nullish(),
    destination: z
      .object({
        reception: z.object({
          packagings: z.array(bsdasriPackagingSchema).nullish()
        }),
        operation: z.object({
          weight: z.coerce.number().nonnegative().nullish(),

          code: z.string().nullish(),
          mode: z.string().nullish()
        })
      })
      .nullish(),
    waste: z.object({ code: z.string().nullish() }),
    isCanceled: z.boolean().nullish(),
    comment: z
      .string()
      .min(3, "Le commentaire doit faire au moins 3 caractères")
  });

const revisionRules = {
  "emitter.pickupSite": {
    revisable: [
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
      BsdasriStatus.Processed
    ]
  },

  "waste.code": {
    revisable: [
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
      BsdasriStatus.Processed
    ]
  },

  "destination.reception.packagings": {
    revisable: [BsdasriStatus.Received, BsdasriStatus.Processed]
  },
  "destination.operation.code": {
    revisable: [BsdasriStatus.Processed]
  },

  "destination.operation.weight": {
    revisable: [BsdasriStatus.Processed]
  }
};

const neverAvailableFields: Record<BsdasriType, string[]> = {
  [BsdasriType.Simple]: [],
  [BsdasriType.Grouping]: ["emitter.pickupSite"],
  [BsdasriType.Synthesis]: [
    "emitter.pickupSite",
    "waste.code",
    "destination.reception.packagings"
  ]
};

const showField = (path: string, type: BsdasriType) =>
  !(neverAvailableFields[type] ?? []).includes(path);

const isDisabled = (path: string, status: BsdasriStatus) =>
  !(revisionRules?.[path] ?? [])?.revisable?.includes(status);

export function BsdasriRequestRevision({ bsdasri }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const [createBsdasriRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createBsdasriRevisionRequest">,
    MutationCreateBsdasriRevisionRequestArgs
  >(CREATE_BSDASRI_REVISION_REQUEST);

  const initialReview = {
    emitter: {
      pickupSite: {
        name: null,
        address: null,
        city: null,
        postalCode: null,
        infos: null
      }
    },
    destination: {
      reception: { packagings: null },
      operation: {
        weight: null,
        code: null,
        mode: null
      }
    },
    waste: { code: null },
    comment: ""
  };

  const zodValidationSchema = getSchema();

  type ValidationSchema = z.infer<typeof zodValidationSchema>;

  const methods = useForm<ValidationSchema>({
    mode: "onTouched",
    values: initialReview,

    resolver: zodResolver(zodValidationSchema)
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = methods;

  const resetAndClose = () => {
    reset();
    navigate(-1);
  };

  const onSubmitForm = async data => {
    const { comment, ...content } = data;
    const cleanedContent = removeEmptyKeys(content);

    await createBsdasriRevisionRequest({
      variables: {
        input: {
          bsdasriId: bsdasri.id,
          content: cleanedContent ?? {},
          comment,
          authoringCompanySiret: siret!
        }
      }
    });
    navigate(-1);
  };

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await onSubmitForm(data);
    resetAndClose();
  };

  // live form values
  const formValues = watch();

  const packagingsSummary = getDasriPackagingInfosSummary(
    bsdasri?.destination?.reception?.packagings || []
  );

  const pickuSiteSummary =
    [
      bsdasri.emitter?.pickupSite?.address,
      bsdasri.emitter?.pickupSite?.postalCode,
      bsdasri.emitter?.pickupSite?.city
    ]
      .filter(Boolean)
      .join(" ") || "Non renseigné";

  const status = bsdasri["bsdasriStatus"];
  const bsdasriType = bsdasri.type;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Demander une révision du bordereau {bsdasri.id}
      </h2>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <BsdasriRequestRevisionCancelationInput
            bsdasri={bsdasri}
            onChange={value => setValue("isCanceled", value)}
          />
          {showField("emitter.pickupSite", bsdasriType) && (
            <RhfReviewableField
              title="Adresse d'enlèvement"
              path="emitter.pickupSite"
              value={pickuSiteSummary}
              defaultValue={initialReview?.emitter?.pickupSite}
              disabled={isDisabled("emitter.pickupSite", status)}
            >
              <Input
                label="Nom du site d'enlèvement"
                className="fr-col-9"
                nativeInputProps={{
                  ...register("emitter.pickupSite.name"),
                  value: formValues?.emitter?.pickupSite?.name || ""
                }}
              />
              <DsfrfWorkSiteAddress
                address={initialReview?.emitter?.pickupSite?.address}
                city={initialReview?.emitter?.pickupSite?.city}
                postalCode={initialReview?.emitter?.pickupSite?.postalCode}
                designation="du site d'enlèvement"
                onAddressSelection={details => {
                  // `address` is passed as `name` because of adresse api return fields
                  setValue(`emitter.pickupSite.address`, details.name);
                  setValue(`emitter.pickupSite.city`, details.city);
                  setValue(`emitter.pickupSite.postalCode`, details.postcode);
                }}
              />

              <div className="form__row">
                <Input
                  label="Informations complémentaires (optionnel)"
                  textArea
                  nativeTextAreaProps={{
                    placeholder: "Champ libre pour préciser…",
                    ...register("emitter.pickupSite.infos"),
                    value: formValues?.emitter?.pickupSite?.infos || ""
                  }}
                />
              </div>
            </RhfReviewableField>
          )}
          {showField("destination.reception.packagings", bsdasriType) && (
            <RhfReviewableField
              title="Conditionnement"
              path="destination.reception.packagings"
              value={packagingsSummary}
              defaultValue={initialReview?.destination?.reception?.packagings}
              initialValue={bsdasri?.destination?.reception?.packagings}
              disabled={isDisabled("destination.reception.packagings", status)}
            >
              <BsdasriPackagings />
            </RhfReviewableField>
          )}
          {showField("waste.code", bsdasriType) && (
            <RhfReviewableField
              title="Code déchet"
              path="waste.code"
              value={bsdasri?.waste?.code}
              defaultValue={initialReview?.waste?.code}
              initialValue={null}
              disabled={isDisabled("waste.code", status)}
            >
              <RadioButtons
                options={[
                  {
                    label: "18 01 03* DASRI d'origine humaine",
                    nativeInputProps: {
                      onChange: () => setValue("waste.code", "18 01 03*"),
                      disabled: bsdasri?.waste?.code === "18 01 03*",
                      checked: formValues?.waste?.code === "18 01 03*"
                    }
                  },
                  {
                    label: "18 02 02* DASRI d'origine animale",
                    nativeInputProps: {
                      onChange: () => setValue("waste.code", "18 02 02*"),
                      disabled: bsdasri?.waste?.code === "18 02 02*",
                      checked: formValues?.waste?.code === "18 02 02*"
                    }
                  }
                ]}
              />
            </RhfReviewableField>
          )}

          <RhfReviewableField
            title="Quantité reçue"
            suffix="kg"
            path="destination.operation.weight"
            value={bsdasri?.destination?.operation?.weight?.value}
            defaultValue={initialReview?.destination?.operation?.weight}
            disabled={isDisabled("destination.operation.weight", status)}
          >
            <Input
              label="Poids en kilos"
              className="fr-col-2"
              state={errors?.destination?.operation?.weight && "error"}
              stateRelatedMessage={
                (errors?.destination?.operation?.weight?.message as string) ??
                ""
              }
              nativeInputProps={{
                type: "number",
                ...register("destination.operation.weight"),
                value: formValues?.destination?.operation?.weight ?? undefined,
                inputMode: "decimal",
                step: "1"
              }}
            />
            <p className="fr-info-text">
              {formValues?.destination?.operation?.weight
                ? `Soit ${
                    formValues?.destination?.operation?.weight / 1000
                  } tonnes`
                : "Poids en tonnes"}{" "}
            </p>
          </RhfReviewableField>
          <RhfReviewableField
            title="Code de l’opération D/R"
            path="destination.operation.code"
            value={bsdasri?.destination?.operation?.code}
            defaultValue={initialReview?.destination?.operation?.code}
            disabled={isDisabled("destination.operation.code", status)}
          >
            <Select
              label="Code de l'opération"
              className="fr-col-8"
              nativeSelectProps={{ ...register("destination.operation.code") }}
            >
              <option value="D9">
                D9 - Prétraitement par désinfection - Banaliseur
              </option>
              <option value="D10">D10 - Incinération</option>
              <option value="R1">
                R1 - Incinération + valorisation énergétique
              </option>
            </Select>
            <RhfOperationModeSelect
              operationCode={formValues?.destination?.operation?.code}
              path={"destination.operation.mode"}
            />
          </RhfReviewableField>

          <Input
            textArea
            label="Commentaire à propos de la révision"
            state={errors?.comment && "error"}
            stateRelatedMessage={(errors?.comment?.message as string) ?? ""}
            nativeTextAreaProps={{
              ...register("comment")
            }}
          />
          {error && (
            <Alert
              description={error.message}
              severity="error"
              title="Erreur"
            />
          )}

          <div className="transporterInfoEditForm__cta">
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={resetAndClose}
            >
              Annuler
            </Button>
            <Button
              nativeButtonProps={{ type: "submit" }}
              disabled={!isDirty || loading || isSubmitting}
            >
              Demander
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
