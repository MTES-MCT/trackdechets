import { useMutation } from "@apollo/client";
import {
  Form as Bsdd,
  Mutation,
  MutationCreateFormRevisionRequestArgs,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import { PROCESSING_AND_REUSE_OPERATIONS } from "@td/constants";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isDefined, removeEmptyKeys } from "../../../../../../common/helper";
import { CREATE_FORM_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsddReviewsQuery";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import WasteCodeSelector from "../../../../../common/Components/WasteCodeSelector/WasteCodeSelector";
import { getPackagingInfosSummary } from "../../../../../common/utils/packagingsBsddSummary";
import RhfOperationModeSelect from "../../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import {
  BsddRevisionRequestValidationSchema,
  initialBsddReview,
  validationBsddSchema
} from "../../common/utils/schema";
import { BsddRequestRevisionCancelationInput } from "../BsddRequestRevisionCancelationInput";
import Appendix1ProducerRequestRevision from "./Appendix1ProducerRequestRevision";
import styles from "./BsddRequestRevision.module.scss";
import Loader from "../../../../../common/Components/Loader/Loaders";
import NonScrollableInput from "../../../../../common/Components/NonScrollableInput/NonScrollableInput";
import RhfPackagingList from "../../../../../Forms/Components/PackagingList/RhfPackagingList";
import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  CODE_DECHET,
  CODE_TRAITEMENT,
  DENOMINATION_USUELLE,
  DESCRIPTION_TRAITEMENT,
  NOUVEAU_CODE_TRAITEMENT,
  NOUVEAU_POIDS_EN_TONNES,
  NOUVEAU_POP,
  NOUVELLE_DENOMINATION_USUELLE,
  NOUVELLE_DESC_TRAITEMENT,
  POP,
  TITLE_REQUEST_LIST
} from "../../../Revision/wordingsRevision";

type Props = {
  bsdd: Bsdd;
};

export function BsddRequestRevision({ bsdd }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const [createFormRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createFormRevisionRequest">,
    MutationCreateFormRevisionRequestArgs
  >(CREATE_FORM_REVISION_REQUEST);

  const isTempStorage = !!bsdd.temporaryStorageDetail;
  const isAppendix1Producer = bsdd.emitter?.type === "APPENDIX1_PRODUCER";

  const methods = useForm<BsddRevisionRequestValidationSchema>({
    mode: "onTouched",
    defaultValues: initialBsddReview,
    resolver: zodResolver(validationBsddSchema)
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

  // Hacky fonction implémentée en hotfix dans tra-15573
  // La bonne solution à mon sens (benoît) serait d'initialiser
  // le formulaire de révision avec les valeurs du BSDD
  // puis de n'envoyer que les champs "dirty" dans onSubmit
  const resetPopIfUnchanged = (
    data: Pick<BsddRevisionRequestValidationSchema, "wasteDetails">
  ) => {
    const pop = data?.wasteDetails?.pop;
    if (pop !== null && pop !== undefined && pop === bsdd?.wasteDetails?.pop) {
      // aucun changement n'a eu lieu sur le champ pop
      // on le réinitialise à la valeur par défaut du formulaire
      data.wasteDetails.pop = null;
    }

    return data;
  };

  const onSubmitForm = async (data: BsddRevisionRequestValidationSchema) => {
    const { comment, ...content } = data;

    const cleanedContent = removeEmptyKeys(resetPopIfUnchanged(content));

    await createFormRevisionRequest({
      variables: {
        input: {
          formId: bsdd.id,
          content: cleanedContent ?? {},
          comment,
          authoringCompanySiret: siret!
        }
      }
    });
  };

  const onSubmit: SubmitHandler<
    BsddRevisionRequestValidationSchema
  > = async data => {
    await onSubmitForm(data);

    resetAndClose();
  };

  // live form values
  const formValues = watch();

  const areModificationsDisabled = formValues.isCanceled;

  const wasteDetailsCodeInput = register("wasteDetails.code");

  const hasBeenReceived = isDefined(bsdd.receivedAt);
  const hasBeenAccepted = isDefined(bsdd.wasteAcceptationStatus);

  const hasBeenTempStoredReceived = isDefined(
    bsdd.temporaryStorageDetail?.temporaryStorer?.receivedAt
  );
  const hasBeenTempStoredAccepted = isDefined(
    bsdd.temporaryStorageDetail?.temporaryStorer?.wasteAcceptationStatus
  );
  const hasBeenProcessed = isDefined(bsdd.processedAt);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {TITLE_REQUEST_LIST} {bsdd.readableId}
      </h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {isAppendix1Producer && (
            <Appendix1ProducerRequestRevision
              bsdd={bsdd}
              initialBsddReview={initialBsddReview}
              areModificationsDisabled={areModificationsDisabled}
            />
          )}
          {!isAppendix1Producer && (
            <>
              <BsddRequestRevisionCancelationInput
                bsdd={bsdd}
                onChange={value => setValue("isCanceled", value)}
              />
              <div
                style={{
                  display: areModificationsDisabled ? "none" : "inline"
                }}
              >
                <RhfReviewableField
                  title={CODE_DECHET}
                  path="wasteDetails.code"
                  value={bsdd?.wasteDetails?.code}
                  defaultValue={initialBsddReview.wasteDetails.code}
                >
                  <WasteCodeSelector
                    // @ts-ignore
                    formValues={formValues}
                    onSelect={setValue}
                    onChange={setValue}
                    ref={wasteDetailsCodeInput.ref}
                  />
                  {errors?.wasteDetails?.code?.message && (
                    <p className="error-message">
                      {errors?.wasteDetails?.code?.message}
                    </p>
                  )}
                </RhfReviewableField>

                <RhfReviewableField
                  title={DENOMINATION_USUELLE}
                  path="wasteDetails.name"
                  value={bsdd.wasteDetails?.name}
                  defaultValue={initialBsddReview.wasteDetails.name}
                >
                  <Input
                    label={NOUVELLE_DENOMINATION_USUELLE}
                    nativeInputProps={{
                      ...register("wasteDetails.name")
                    }}
                  />
                </RhfReviewableField>

                <RhfReviewableField
                  title={POP}
                  path="wasteDetails.pop"
                  value={Boolean(bsdd.wasteDetails?.pop) ? "Oui" : "Non"}
                  defaultValue={initialBsddReview.wasteDetails.pop}
                  initialValue={bsdd.wasteDetails?.pop}
                >
                  <ToggleSwitch
                    label={NOUVEAU_POP}
                    checked={Boolean(formValues.wasteDetails?.pop)}
                    showCheckedHint={false}
                    onChange={checked => {
                      return setValue("wasteDetails.pop", checked, {
                        shouldDirty: true
                      });
                    }}
                  />
                </RhfReviewableField>

                <RhfReviewableField
                  title="Conditionnement"
                  path="wasteDetails.packagingInfos"
                  value={
                    bsdd.wasteDetails?.packagingInfos
                      ? getPackagingInfosSummary(
                          bsdd.wasteDetails.packagingInfos
                        )
                      : ""
                  }
                  defaultValue={initialBsddReview.wasteDetails.packagingInfos}
                  initialValue={bsdd.wasteDetails?.packagingInfos}
                >
                  <p className="fr-text fr-mb-2w">Nouveaux conditionnements</p>
                  <RhfPackagingList fieldName="wasteDetails.packagingInfos" />
                </RhfReviewableField>

                {hasBeenReceived && (
                  <RhfReviewableField
                    title={
                      !isTempStorage
                        ? "Quantité reçue"
                        : "Quantité reçue sur l'installation de destination"
                    }
                    path="quantityReceived"
                    value={bsdd.quantityReceived}
                    defaultValue={initialBsddReview?.quantityReceived}
                  >
                    {bsdd.wasteAcceptationStatus ===
                      WasteAcceptationStatus.PartiallyRefused && (
                      <Alert
                        className="fr-my-2w"
                        small
                        description="En cas de refus partiel, la quantité reçue et refusée peuvent être révisées, impactant la quantité traitée: quantité acceptée = quantité reçue - quantité refusée."
                        severity="info"
                      />
                    )}
                    <NonScrollableInput
                      label={NOUVEAU_POIDS_EN_TONNES}
                      className="fr-col-4"
                      state={errors.quantityReceived && "error"}
                      stateRelatedMessage={
                        errors.quantityReceived?.message ?? ""
                      }
                      nativeInputProps={{
                        ...register("quantityReceived", {
                          valueAsNumber: true
                        }),
                        type: "number",
                        inputMode: "decimal",
                        step: "0.000001",
                        min: 0
                      }}
                    />
                    {isDefined(formValues?.quantityReceived) && (
                      <p className="fr-info-text">
                        Soit {Number(formValues.quantityReceived) * 1000} kg
                      </p>
                    )}
                  </RhfReviewableField>
                )}

                {hasBeenAccepted &&
                  bsdd.wasteAcceptationStatus ===
                    WasteAcceptationStatus.PartiallyRefused && (
                    <RhfReviewableField
                      title={
                        !isTempStorage
                          ? "Quantité refusée"
                          : "Quantité refusée sur l'installation de destination"
                      }
                      path="quantityRefused"
                      value={bsdd.quantityRefused}
                      defaultValue={initialBsddReview?.quantityRefused}
                    >
                      <NonScrollableInput
                        label={NOUVEAU_POIDS_EN_TONNES}
                        className="fr-col-4"
                        state={errors.quantityRefused && "error"}
                        stateRelatedMessage={
                          errors.quantityRefused?.message ?? ""
                        }
                        nativeInputProps={{
                          ...register("quantityRefused", {
                            valueAsNumber: true
                          }),
                          type: "number",
                          inputMode: "decimal",
                          step: "0.000001",
                          min: 0
                        }}
                      />
                      {isDefined(formValues?.quantityRefused) && (
                        <p className="fr-info-text">
                          Soit {Number(formValues.quantityRefused) * 1000} kg
                        </p>
                      )}
                    </RhfReviewableField>
                  )}

                {isTempStorage && hasBeenTempStoredReceived && (
                  <RhfReviewableField
                    title={
                      "Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)"
                    }
                    path="quantityReceived"
                    value={
                      bsdd.temporaryStorageDetail?.temporaryStorer
                        ?.quantityReceived
                    }
                    defaultValue={
                      initialBsddReview.temporaryStorageDetail?.temporaryStorer
                        ?.quantityReceived
                    }
                  >
                    {bsdd.temporaryStorageDetail?.temporaryStorer
                      ?.wasteAcceptationStatus ===
                      WasteAcceptationStatus.PartiallyRefused && (
                      <Alert
                        className="fr-my-2w"
                        small
                        description="En cas de refus partiel, la quantité reçue et refusée peuvent être révisées, impactant la quantité traitée: quantité acceptée = quantité reçue - quantité refusée."
                        severity="info"
                      />
                    )}
                    <NonScrollableInput
                      label={NOUVEAU_POIDS_EN_TONNES}
                      className="fr-col-4"
                      state={
                        errors.temporaryStorageDetail?.temporaryStorer
                          ?.quantityReceived && "error"
                      }
                      stateRelatedMessage={
                        errors.temporaryStorageDetail?.temporaryStorer
                          ?.quantityReceived?.message ?? ""
                      }
                      nativeInputProps={{
                        ...register(
                          "temporaryStorageDetail.temporaryStorer.quantityReceived",
                          { valueAsNumber: true }
                        ),
                        type: "number",
                        inputMode: "decimal",
                        step: "0.000001",
                        min: 0
                      }}
                    />
                    {isDefined(
                      formValues?.temporaryStorageDetail?.temporaryStorer
                        ?.quantityReceived
                    ) && (
                      <p className="fr-info-text">
                        Soit{" "}
                        {Number(
                          formValues.temporaryStorageDetail.temporaryStorer
                            .quantityReceived
                        ) * 1000}{" "}
                        kg
                      </p>
                    )}
                  </RhfReviewableField>
                )}

                {isTempStorage &&
                  hasBeenTempStoredAccepted &&
                  bsdd.temporaryStorageDetail?.temporaryStorer
                    ?.wasteAcceptationStatus ===
                    WasteAcceptationStatus.PartiallyRefused && (
                    <RhfReviewableField
                      title={
                        "Quantité refusée sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)"
                      }
                      path="quantityRefused"
                      value={
                        bsdd.temporaryStorageDetail?.temporaryStorer
                          ?.quantityRefused
                      }
                      defaultValue={
                        initialBsddReview.temporaryStorageDetail
                          ?.temporaryStorer?.quantityRefused
                      }
                    >
                      <NonScrollableInput
                        label={NOUVEAU_POIDS_EN_TONNES}
                        className="fr-col-4"
                        state={
                          errors.temporaryStorageDetail?.temporaryStorer
                            ?.quantityRefused && "error"
                        }
                        stateRelatedMessage={
                          errors.temporaryStorageDetail?.temporaryStorer
                            ?.quantityRefused?.message ?? ""
                        }
                        nativeInputProps={{
                          ...register(
                            "temporaryStorageDetail.temporaryStorer.quantityRefused",
                            { valueAsNumber: true }
                          ),
                          type: "number",
                          inputMode: "decimal",
                          step: "0.000001",
                          min: 0
                        }}
                      />
                      {isDefined(
                        formValues?.temporaryStorageDetail?.temporaryStorer
                          ?.quantityRefused
                      ) && (
                        <p className="fr-info-text">
                          Soit{" "}
                          {Number(
                            formValues.temporaryStorageDetail.temporaryStorer
                              .quantityRefused
                          ) * 1000}{" "}
                          kg
                        </p>
                      )}
                    </RhfReviewableField>
                  )}

                {hasBeenProcessed && (
                  <>
                    <RhfReviewableField
                      title={CODE_TRAITEMENT}
                      path="processingOperationDone"
                      value={bsdd.processingOperationDone}
                      defaultValue={initialBsddReview.processingOperationDone}
                    >
                      <div className={styles.processingOperationTextQuote}>
                        <p>
                          Vous hésitez sur le type d'opération à choisir ? Vous
                          pouvez consulter la liste de traitement des déchets
                          sur{" "}
                          <a
                            href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000026902174/"
                            target="_blank"
                            className="link"
                            rel="noopener noreferrer"
                          >
                            le site legifrance.
                          </a>
                        </p>
                      </div>
                      <Select
                        label={NOUVEAU_CODE_TRAITEMENT}
                        className="fr-col-8"
                        nativeSelectProps={{
                          ...register("processingOperationDone")
                        }}
                      >
                        <option value="">Choisissez...</option>
                        {PROCESSING_AND_REUSE_OPERATIONS.map(operation => (
                          <option key={operation.code} value={operation.code}>
                            {operation.code} - {operation.description}
                          </option>
                        ))}
                      </Select>
                      <RhfOperationModeSelect
                        operationCode={formValues?.processingOperationDone}
                        path={"destinationOperationMode"}
                      />
                    </RhfReviewableField>

                    <RhfReviewableField
                      title={DESCRIPTION_TRAITEMENT}
                      path="processingOperationDescription"
                      value={bsdd.processingOperationDescription}
                      defaultValue={
                        initialBsddReview.processingOperationDescription
                      }
                    >
                      <Input
                        label={NOUVELLE_DESC_TRAITEMENT}
                        nativeInputProps={{
                          ...register("processingOperationDescription")
                        }}
                        className="fr-col-8"
                      />
                    </RhfReviewableField>
                  </>
                )}

                <RhfReviewableField
                  title={isTempStorage ? "CAP destination finale" : "CAP"}
                  path={
                    isTempStorage
                      ? "temporaryStorageDetail.destination.cap"
                      : "recipient.cap"
                  }
                  value={
                    isTempStorage
                      ? bsdd.temporaryStorageDetail?.destination?.cap
                      : bsdd.recipient?.cap
                  }
                  defaultValue={
                    isTempStorage
                      ? initialBsddReview.temporaryStorageDetail?.destination
                          ?.cap
                      : initialBsddReview.recipient.cap
                  }
                >
                  <Input
                    label={`${
                      isTempStorage
                        ? "Nouveau CAP destination finale"
                        : "Nouveau CAP (optionnel pour les déchets non dangereux)"
                    }`}
                    className="fr-col-8"
                    nativeInputProps={{
                      ...register(
                        `${
                          isTempStorage
                            ? "temporaryStorageDetail.destination.cap"
                            : "recipient.cap"
                        }`
                      )
                    }}
                  />
                </RhfReviewableField>

                {isTempStorage && (
                  <RhfReviewableField
                    title="Numéro de CAP entreposage provisoire ou reconditionnement"
                    path="recipient.cap"
                    value={bsdd.recipient?.cap}
                    defaultValue={initialBsddReview.recipient.cap}
                  >
                    <Input
                      label="Nouveau CAP entreposage provisoire ou reconditionnement"
                      className="fr-col-8"
                      nativeInputProps={{
                        ...register("recipient.cap")
                      }}
                    />
                  </RhfReviewableField>
                )}
              </div>
            </>
          )}

          {!areModificationsDisabled && <hr />}
          <Input
            textArea
            label="Commentaire à propos de la révision"
            state={errors?.comment && "error"}
            stateRelatedMessage={(errors?.comment?.message as string) ?? ""}
            nativeTextAreaProps={{
              ...register("comment")
            }}
            className="fr-mb-4w"
          />

          {error && (
            <div className="notification notification--warning">
              {error.message}
            </div>
          )}
          <div className={styles.cta}>
            <Button
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={resetAndClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || loading || isSubmitting}
            >
              Demander
            </Button>
            {(loading || isSubmitting) && <Loader />}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
