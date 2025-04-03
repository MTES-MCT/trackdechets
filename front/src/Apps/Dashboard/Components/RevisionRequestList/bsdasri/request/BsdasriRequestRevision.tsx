import { useMutation } from "@apollo/client";

import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import RhfOperationModeSelect from "../../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";

import { getDasriPackagingInfosSummary } from "../../../../../common/utils/packagingsDasriSummary";

import DsfrfWorkSiteAddress from "../../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import {
  Bsdasri,
  BsdasriType,
  Mutation,
  MutationCreateBsdasriRevisionRequestArgs,
  BsdasriStatus
} from "@td/codegen-ui";
import { removeEmptyKeys } from "../../../../../../common/helper";

import { CREATE_BSDASRI_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsdasriReviewQuery";
import styles from "./BsdasriRequestRevision.module.scss";

import {
  BsdasriRequestRevisionCancelationInput,
  CANCELLABLE_BSDASRI_STATUSES
} from "../BsdasriRequestRevisionCancelationInput";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@codegouvfr/react-dsfr/Input";

import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";

import { getDasriSchema, initialDasriReview } from "../../common/utils/schema";
import {
  dasriNeverAvailableFields,
  revisionDasriRules
} from "../../common/utils/rules";
import { BsdPackagings } from "../../common/Components/Packagings/RhfPackagings";
import { BsdTypename } from "../../../../../common/types/bsdTypes";
import NonScrollableInput from "../../../../../common/Components/NonScrollableInput/NonScrollableInput";
import { TITLE_REQUEST_LIST } from "../../../Revision/wordingsRevision";
import { resetPackagingIfUnchanged } from "../../common/Components/Packagings/packagings";

type Props = {
  readonly bsdasri: Bsdasri;
};

const showField = (path: string, type: BsdasriType) =>
  !(dasriNeverAvailableFields[type] ?? []).includes(path);

const isDisabled = (path: string, status: BsdasriStatus) =>
  !(revisionDasriRules?.[path] ?? [])?.revisable?.includes(status);

export function BsdasriRequestRevision({ bsdasri }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const [createBsdasriRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createBsdasriRevisionRequest">,
    MutationCreateBsdasriRevisionRequestArgs
  >(CREATE_BSDASRI_REVISION_REQUEST);

  const zodValidationSchema = getDasriSchema();

  type ValidationSchema = z.infer<typeof zodValidationSchema>;

  const methods = useForm<ValidationSchema>({
    mode: "onTouched",
    values: initialDasriReview,

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

  const checkIfInitialObjectValueChanged = data => {
    const newData = resetPackagingIfUnchanged(
      data,
      bsdasri.destination?.reception?.packagings,
      data.destination.reception.packagings,
      () => delete data.destination.reception.packagings
    );
    return newData;
  };

  const onSubmitForm = async data => {
    const { comment, ...content } = data;
    const cleanedContent = removeEmptyKeys(
      checkIfInitialObjectValueChanged(content)
    );

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
  const canBeCancelled = CANCELLABLE_BSDASRI_STATUSES.includes(
    bsdasri["bsdasriStatus"]
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {TITLE_REQUEST_LIST} {bsdasri.id}
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
              defaultValue={initialDasriReview?.emitter?.pickupSite}
              disabled={isDisabled("emitter.pickupSite", status)}
            >
              <Input
                label="Nom du site d'enlèvement"
                className="fr-col-10"
                nativeInputProps={{
                  ...register("emitter.pickupSite.name"),
                  value: formValues?.emitter?.pickupSite?.name || ""
                }}
              />
              <DsfrfWorkSiteAddress
                address={initialDasriReview?.emitter?.pickupSite?.address}
                city={initialDasriReview?.emitter?.pickupSite?.city}
                postalCode={initialDasriReview?.emitter?.pickupSite?.postalCode}
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
              defaultValue={
                initialDasriReview?.destination?.reception?.packagings
              }
              initialValue={bsdasri?.destination?.reception?.packagings}
              disabled={isDisabled("destination.reception.packagings", status)}
            >
              <BsdPackagings
                bsdType={BsdTypename.Bsdasri}
                path="destination.reception.packagings"
              />
            </RhfReviewableField>
          )}
          {showField("waste.code", bsdasriType) && (
            <RhfReviewableField
              title="Code déchet"
              path="waste.code"
              value={bsdasri?.waste?.code}
              defaultValue={initialDasriReview?.waste?.code}
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
            title="Quantité traitée"
            suffix="kg"
            path="destination.operation.weight"
            value={bsdasri?.destination?.operation?.weight?.value}
            defaultValue={initialDasriReview?.destination?.operation?.weight}
            disabled={isDisabled("destination.operation.weight", status)}
          >
            <NonScrollableInput
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
            title="Code de l'opération réalisée"
            path="destination.operation.code"
            value={bsdasri?.destination?.operation?.code}
            defaultValue={initialDasriReview?.destination?.operation?.code}
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

          {!canBeCancelled && <hr />}

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
