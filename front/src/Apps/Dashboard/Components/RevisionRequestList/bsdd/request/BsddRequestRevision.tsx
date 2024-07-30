import { useMutation } from "@apollo/client";
import {
  Form as Bsdd,
  FavoriteType,
  Mutation,
  MutationCreateFormRevisionRequestArgs
} from "@td/codegen-ui";
import { PROCESSING_AND_REUSE_OPERATIONS } from "@td/constants";
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { removeEmptyKeys } from "../../../../../../common/helper";
import { CREATE_FORM_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsddReviewsQuery";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import WasteCodeSelector from "../../../../../common/Components/WasteCodeSelector/WasteCodeSelector";
import { getPackagingInfosSummary } from "../../../../../common/utils/packagingsBsddSummary";
import RhfCompanyContactInfo from "../../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import RhfCompanySelectorWrapper from "../../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import RhfOperationModeSelect from "../../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import { BsdTypename } from "../../../../../common/types/bsdTypes";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import { BsdPackagings } from "../../common/Components/Packagings/RhfPackagings";
import {
  initialBsddReview,
  validationBsddSchema
} from "../../common/utils/schema";
import { BsddRequestRevisionCancelationInput } from "../BsddRequestRevisionCancelationInput";
import Appendix1ProducerRequestRevision from "./Appendix1ProducerRequestRevision";
import styles from "./BsddRequestRevision.module.scss";
import Loader from "../../../../../common/Components/Loader/Loaders";
import { disableAddPackagingCta } from "../../common/utils/rules";

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

  type ValidationSchema = z.infer<typeof validationBsddSchema>;

  const methods = useForm<ValidationSchema>({
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

  const onSubmitForm = async data => {
    const { comment, ...content } = data;
    const cleanedContent = removeEmptyKeys(content);

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

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await onSubmitForm(data);
    resetAndClose();
  };

  // live form values
  const formValues = watch();

  const areModificationsDisabled = formValues.isCanceled;

  const wasteDetailsCodeInput = register("wasteDetails.code");

  const orgId = useMemo(
    () => bsdd?.broker?.company?.orgId ?? bsdd?.broker?.company?.siret ?? null,
    [bsdd?.broker?.company?.orgId, bsdd?.broker?.company?.siret]
  );

  const setSelectedCompany = (company, field: "trader" | "broker") => {
    setValue(`${field}.company.orgId`, company.orgId);
    setValue(`${field}.company.siret`, company.siret);
    setValue(`${field}.company.name`, company.name);
    setValue(`${field}.company.vatNumber`, company.vatNumber);
    setValue(`${field}.company.address`, company.address);
    setValue(
      `${field}.company.contact`,
      company.contact || bsdd.broker?.company?.contact
    );
    setValue(
      `${field}.company.phone`,
      company.contactPhone || bsdd.broker?.company?.phone
    );

    setValue(
      `${field}.company.mail`,
      company.contactEmail || bsdd.broker?.company?.mail
    );
  };

  const setBrokerOrTraderReceipt = (receipt, field: "trader" | "broker") => {
    if (receipt) {
      setValue(`${field}.receipt`, receipt.receiptNumber);
      setValue(`${field}.validityLimit`, receipt.validityLimit);
      setValue(`${field}.department`, receipt.department);
    } else {
      setValue(`${field}.receipt`, "");
      setValue(`${field}.validityLimit`, null);
      setValue(`${field}.department`, "");
    }
  };

  const onCompanyBrokerSeleted = company => {
    const field = "broker";
    if (company) {
      setSelectedCompany(company, field);
    }
    setBrokerOrTraderReceipt(company?.brokerReceipt, field);
  };

  const onCompanyTraderSeleted = company => {
    const field = "trader";
    if (company) {
      setSelectedCompany(company, field);
    }
    setBrokerOrTraderReceipt(company?.traderReceipt, field);
  };

  const quantityReceivedFormValue = !isTempStorage
    ? formValues?.quantityReceived || undefined
    : formValues?.temporaryStorageDetail?.temporaryStorer?.quantityReceived ||
      undefined;

  const quantityReceivedDefaultValue = !isTempStorage
    ? initialBsddReview?.quantityReceived
    : initialBsddReview.temporaryStorageDetail?.temporaryStorer
        ?.quantityReceived;
  const quantityReceivedValue = !isTempStorage
    ? bsdd.quantityReceived
    : bsdd.temporaryStorageDetail?.temporaryStorer?.quantityReceived;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Demander une révision du bordereau {bsdd.readableId}
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
                <hr />

                <RhfReviewableField
                  title="Code déchet"
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
                  title="Nom usuel du déchet"
                  path="wasteDetails.name"
                  value={bsdd.wasteDetails?.name}
                  defaultValue={initialBsddReview.wasteDetails.name}
                >
                  <Input
                    label="Nom usuel du déchet"
                    nativeInputProps={{
                      ...register("wasteDetails.name")
                    }}
                  />
                </RhfReviewableField>

                <RhfReviewableField
                  title="Contient des polluants organique persistant"
                  path="wasteDetails.pop"
                  value={Boolean(bsdd.wasteDetails?.pop) ? "Oui" : "Non"}
                  defaultValue={initialBsddReview.wasteDetails.pop}
                >
                  <ToggleSwitch
                    label="Le déchet contient des polluants organiques persistants"
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
                  <BsdPackagings
                    path="wasteDetails.packagingInfos"
                    bsdType={BsdTypename.Bsdd}
                    disabledAddCta={disableAddPackagingCta(
                      formValues.wasteDetails?.packagingInfos
                    )}
                  />
                </RhfReviewableField>

                <RhfReviewableField
                  title={
                    !isTempStorage
                      ? "Quantité reçue"
                      : "Quantité reçue sur l'installation d'entreposage provisoire ou reconditionnement (tonnes)"
                  }
                  path="quantityReceived"
                  value={quantityReceivedValue}
                  defaultValue={quantityReceivedDefaultValue}
                >
                  <Input
                    label="Poids en tonnes"
                    className="fr-col-2"
                    state={
                      !isTempStorage
                        ? errors.quantityReceived && "error"
                        : errors.temporaryStorageDetail?.temporaryStorer
                            ?.quantityReceived && "error"
                    }
                    stateRelatedMessage={
                      !isTempStorage
                        ? errors.quantityReceived?.message ?? ""
                        : errors.temporaryStorageDetail?.temporaryStorer
                            ?.quantityReceived?.message ?? ""
                    }
                    nativeInputProps={{
                      ...register(
                        `${
                          !isTempStorage
                            ? "quantityReceived"
                            : "temporaryStorageDetail.temporaryStorer.quantityReceived"
                        }`,
                        { valueAsNumber: true }
                      ),
                      type: "number"
                    }}
                  />
                  {quantityReceivedFormValue && (
                    <p className="fr-info-text">
                      Soit {Number(quantityReceivedFormValue) * 1000} kg
                    </p>
                  )}
                </RhfReviewableField>

                <RhfReviewableField
                  title="Code de l'opération D/R"
                  path="processingOperationDone"
                  value={bsdd.processingOperationDone}
                  defaultValue={initialBsddReview.processingOperationDone}
                >
                  <div className={styles.processingOperationTextQuote}>
                    <p>
                      Vous hésitez sur le type d'opération à choisir ? Vous
                      pouvez consulter la liste de traitement des déchets sur{" "}
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
                    label="Code de l'opération"
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
                  title="Description de l'opération D/R"
                  path="processingOperationDescription"
                  value={bsdd.processingOperationDescription}
                  defaultValue={
                    initialBsddReview.processingOperationDescription
                  }
                >
                  <Input
                    label="Description de l'opération D/R"
                    nativeInputProps={{
                      ...register("processingOperationDescription")
                    }}
                    className="fr-col-8"
                  />
                </RhfReviewableField>

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
                        ? "Numéro de CAP destination finale"
                        : "Numéro de CAP (Optionnel pour les déchets non dangereux)"
                    }`}
                    className="fr-col-6"
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
                      label="Numéro de CAP entreposage provisoire ou reconditionnement"
                      className="fr-col-3"
                      nativeInputProps={{
                        ...register("recipient.cap")
                      }}
                    />
                  </RhfReviewableField>
                )}

                <RhfReviewableField
                  title="Courtier"
                  path="broker"
                  value={
                    bsdd.broker?.company?.name
                      ? bsdd.broker.company.name
                      : "Aucun"
                  }
                  defaultValue={initialBsddReview.broker}
                >
                  <RhfCompanySelectorWrapper
                    orgId={siret}
                    favoriteType={FavoriteType.Broker}
                    onCompanySelected={onCompanyBrokerSeleted}
                  />
                  <RhfCompanyContactInfo
                    fieldName={"broker.company"}
                    key={orgId}
                  />
                  <Input
                    label="Numéro de récépissé"
                    nativeInputProps={{
                      ...register("broker.receipt")
                    }}
                    className="fr-col-6"
                  />
                  <Input
                    label="Département"
                    nativeInputProps={{
                      ...register("broker.department")
                    }}
                    className="fr-col-6"
                  />
                  <Input
                    label="Limite de validité"
                    nativeInputProps={{
                      type: "date",
                      ...register("broker.validityLimit")
                    }}
                  />
                </RhfReviewableField>

                <RhfReviewableField
                  title="Négociant"
                  path="trader"
                  value={
                    bsdd.trader?.company?.name
                      ? bsdd.trader.company.name
                      : "Aucun"
                  }
                  defaultValue={initialBsddReview.trader}
                >
                  <RhfCompanySelectorWrapper
                    orgId={siret}
                    favoriteType={FavoriteType.Trader}
                    onCompanySelected={onCompanyTraderSeleted}
                  />
                  <RhfCompanyContactInfo
                    fieldName={"trader.company"}
                    key={orgId}
                  />
                  <Input
                    label="Numéro de récépissé"
                    nativeInputProps={{
                      ...register("trader.receipt")
                    }}
                    className="fr-col-6"
                  />
                  <Input
                    label="Département"
                    nativeInputProps={{
                      ...register("trader.department")
                    }}
                    className="fr-col-6"
                  />
                  <Input
                    label="Limite de validité"
                    nativeInputProps={{
                      type: "date",
                      ...register("trader.validityLimit")
                    }}
                  />
                </RhfReviewableField>
              </div>
            </>
          )}

          {areModificationsDisabled && <hr />}
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
