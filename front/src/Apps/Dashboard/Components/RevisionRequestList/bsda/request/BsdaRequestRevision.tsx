import { useMutation } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bsda,
  BsdType,
  Mutation,
  MutationCreateBsdaRevisionRequestArgs
} from "@td/codegen-ui";
import { BSDA_WASTES } from "@td/constants";
import React, { useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { isDefined, removeEmptyKeys } from "../../../../../../common/helper";
import DsfrfWorkSiteAddress from "../../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import { Loader } from "../../../../../common/Components";
import RhfOperationModeSelect from "../../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import { CREATE_BSDA_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsdaReviewQuery";
import { resetPackagingIfUnchanged } from "../../common/Components/Packagings/packagings";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import {
  initialBsdaReview,
  validationBsdaSchema
} from "../../common/utils/schema";
import { BsdaRequestRevisionCancelationInput } from "../BsdaRequestRevisionCancelationInput";
import TagsInput from "../../../../../Forms/Components/TagsInput/TagsInput";
import styles from "./BsdaRequestRevision.module.scss";
import NonScrollableInput from "../../../../../common/Components/NonScrollableInput/NonScrollableInput";
import RhfBroker from "../../../../../Forms/Components/Broker/RhfBroker";
import {
  CODE_DECHET,
  CODE_TRAITEMENT,
  DENOMINATION_USUELLE,
  DESCRIPTION_TRAITEMENT,
  NOUVEAU_CODE_DECHET,
  NOUVEAU_CODE_TRAITEMENT,
  NOUVEAU_POIDS_EN_TONNES,
  NOUVEAU_POP,
  NOUVELLE_DENOMINATION_USUELLE,
  NOUVELLE_DESC_TRAITEMENT,
  POP,
  TITLE_REQUEST_LIST
} from "../../../Revision/wordingsRevision";
import { bsdaPackagingTypes } from "../../../../../Forms/Components/PackagingList/helpers";
import RhfPackagingList from "../../../../../Forms/Components/PackagingList/RhfPackagingList";
import { getPackagingInfosSummary } from "../../../../../common/utils/packagingsBsddSummary";
import Alert from "@codegouvfr/react-dsfr/Alert";
type Props = {
  bsda: Bsda;
};

export function BsdaRequestRevision({ bsda }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const navigate = useNavigate();
  const [createBsdaRevisionRequest, { loading, error }] = useMutation<
    Pick<Mutation, "createBsdaRevisionRequest">,
    MutationCreateBsdaRevisionRequestArgs
  >(CREATE_BSDA_REVISION_REQUEST);
  const [sealNumbersTags, setSealNumbersTags] = useState<string[]>([]);

  type ValidationSchema = z.infer<typeof validationBsdaSchema>;

  const methods = useForm<ValidationSchema>({
    mode: "onTouched",
    defaultValues: initialBsdaReview,
    resolver: zodResolver(validationBsdaSchema)
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

  useEffect(() => {
    if (bsda?.waste?.sealNumbers) {
      setSealNumbersTags([...bsda.waste.sealNumbers]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hacky fonction implémentée en hotfix dans tra-15573
  // La bonne solution à mon sens (benoît) serait d'initialiser
  // le formulaire de révision avec les valeurs du BSDA
  // puis de n'envoyer que les champs "dirty" dans onSubmit
  const resetPopIfUnchanged = (data: Pick<ValidationSchema, "waste">) => {
    const pop = data?.waste?.pop;
    if (pop !== null && pop !== undefined && pop === bsda?.waste?.pop) {
      // aucun changement n'a eu lieu sur le champ pop
      // on le réinitialise à la valeur par défaut du formulaire
      data.waste.pop = null;
    }
    return data;
  };

  const checkIfInitialObjectValueChanged = data => {
    let newData = resetPopIfUnchanged(data);
    newData = resetPackagingIfUnchanged(
      data,
      bsda.packagings,
      data.packagings,
      () => delete data.packagings
    );
    return newData;
  };

  const onSubmitForm = async (data: ValidationSchema) => {
    const { comment, ...content } = data;
    console.log(content);
    const cleanedContent = removeEmptyKeys(
      checkIfInitialObjectValueChanged(content)
    );
    await createBsdaRevisionRequest({
      variables: {
        input: {
          bsdaId: bsda.id,
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

  const hasBeenReceived = isDefined(bsda.destination?.reception?.date);
  const hasBeenAccepted = isDefined(
    bsda.destination?.reception?.acceptationStatus
  );

  const handleAddSealNumbers = value => {
    if (value && ![...sealNumbersTags]?.includes(value)) {
      setSealNumbersTags([...sealNumbersTags, value]);
      setValue("waste.sealNumbers", [...sealNumbersTags, value]);
    }
  };

  const dismissTag = plateTagIdx => {
    const newPlates = sealNumbersTags.filter(
      p => p !== sealNumbersTags[plateTagIdx]
    );
    setSealNumbersTags(newPlates);
    setValue("waste.sealNumbers", newPlates);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {TITLE_REQUEST_LIST} {bsda.id}
      </h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.fields}>
            <BsdaRequestRevisionCancelationInput
              bsda={bsda}
              onChange={value => setValue("isCanceled", value)}
            />

            <div
              style={{
                display: areModificationsDisabled ? "none" : "inline"
              }}
            >
              <RhfReviewableField
                title={CODE_DECHET}
                path="waste.code"
                value={bsda.waste?.code}
                defaultValue={initialBsdaReview.waste.code}
              >
                <Select
                  label={NOUVEAU_CODE_DECHET}
                  className="fr-col-8"
                  nativeSelectProps={{
                    ...register("waste.code")
                  }}
                >
                  <option />
                  {BSDA_WASTES.map(item => (
                    <option value={item.code} key={item.code}>
                      {item.code} - {item.description}
                    </option>
                  ))}
                </Select>
              </RhfReviewableField>

              <RhfReviewableField
                title={DENOMINATION_USUELLE}
                path="waste.materialName"
                value={bsda.waste?.materialName}
                defaultValue={initialBsdaReview.waste.materialName}
              >
                <Input
                  label={NOUVELLE_DENOMINATION_USUELLE}
                  className="fr-col-8"
                  nativeInputProps={{
                    ...register("waste.materialName")
                  }}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Numéros de scellés"
                path="waste.sealNumbers"
                value={bsda.waste?.sealNumbers?.join(", ")}
                defaultValue={initialBsdaReview.waste.sealNumbers}
              >
                <div className="fr-col-8">
                  <TagsInput
                    label="Nouveaux numéros de scellés"
                    onAddTag={handleAddSealNumbers}
                    onDeleteTag={dismissTag}
                    tags={sealNumbersTags}
                  />
                </div>
              </RhfReviewableField>

              <RhfReviewableField
                title={POP}
                path="waste.pop"
                value={Boolean(bsda.waste?.pop) ? "Oui" : "Non"}
                defaultValue={initialBsdaReview.waste.pop}
                initialValue={bsda?.waste?.pop}
              >
                <ToggleSwitch
                  label={NOUVEAU_POP}
                  checked={Boolean(formValues.waste?.pop)}
                  showCheckedHint={false}
                  onChange={checked => {
                    return setValue("waste.pop", checked, {
                      shouldDirty: true
                    });
                  }}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="CAP de l'exutoire"
                value={
                  bsda.destination?.operation?.nextDestination?.cap ??
                  bsda.destination?.cap
                }
                path="destination.cap"
                defaultValue={initialBsdaReview.destination.cap}
              >
                <Input
                  label="Nouveau CAP"
                  className="fr-col-8"
                  nativeInputProps={{
                    ...register("destination.cap")
                  }}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Conditionnement"
                path="packagings"
                value={
                  bsda.packagings
                    ? getPackagingInfosSummary(bsda.packagings)
                    : ""
                }
                defaultValue={initialBsdaReview.packagings}
                initialValue={bsda.packagings}
              >
                <p className="fr-text fr-mb-2w">Nouveaux conditionnements</p>
                <RhfPackagingList
                  fieldName="packagings"
                  packagingTypes={bsdaPackagingTypes}
                />
              </RhfReviewableField>

              {hasBeenReceived && (
                <RhfReviewableField
                  title="Quantité reçue"
                  path="destination.reception.weight"
                  value={bsda.destination?.reception?.weight}
                  defaultValue={
                    initialBsdaReview?.destination?.reception?.weight
                  }
                >
                  {bsda.destination?.reception?.acceptationStatus ===
                    "PARTIALLY_REFUSED" && (
                    <Alert
                      className="fr-my-2w"
                      small
                      description="En cas de refus partiel, la quantité reçue et refusée peuvent être révisées, impactant la quantité traitée : quantité acceptée = quantité reçue - quantité refusée."
                      severity="info"
                    />
                  )}
                  {bsda.destination?.reception?.acceptationStatus ===
                    "ACCEPTED" && (
                    <Alert
                      className="fr-my-2w"
                      small
                      description="L'acceptation étant totale, la quantité acceptée et traitée correspondra à la quantité reçue."
                      severity="info"
                    />
                  )}

                  <NonScrollableInput
                    label={NOUVEAU_POIDS_EN_TONNES}
                    className="fr-col-4"
                    state={errors.destination?.reception?.weight && "error"}
                    stateRelatedMessage={
                      errors.destination?.reception?.weight?.message ?? ""
                    }
                    nativeInputProps={{
                      ...register("destination.reception.weight", {
                        valueAsNumber: true
                      }),
                      type: "number",
                      inputMode: "decimal",
                      step: "0.000001",
                      min: 0
                    }}
                  />
                  {isDefined(formValues?.destination?.reception?.weight) && (
                    <p className="fr-info-text">
                      Soit{" "}
                      {Number(formValues.destination?.reception?.weight) * 1000}{" "}
                      kg
                    </p>
                  )}
                </RhfReviewableField>
              )}

              {hasBeenAccepted &&
                bsda.destination?.reception?.acceptationStatus ===
                  "PARTIALLY_REFUSED" && (
                  <RhfReviewableField
                    title="Quantité refusée"
                    path="destination.reception.refusedWeight"
                    value={bsda.destination?.reception?.refusedWeight}
                    defaultValue={
                      initialBsdaReview?.destination?.reception?.refusedWeight
                    }
                  >
                    <NonScrollableInput
                      label={NOUVEAU_POIDS_EN_TONNES}
                      className="fr-col-4"
                      state={
                        errors.destination?.reception?.refusedWeight && "error"
                      }
                      stateRelatedMessage={
                        errors.destination?.reception?.refusedWeight?.message ??
                        ""
                      }
                      nativeInputProps={{
                        ...register("destination.reception.refusedWeight", {
                          valueAsNumber: true
                        }),
                        type: "number",
                        inputMode: "decimal",
                        step: "0.000001",
                        min: 0
                      }}
                    />
                    {isDefined(
                      formValues?.destination?.reception?.refusedWeight
                    ) && (
                      <p className="fr-info-text">
                        Soit{" "}
                        {Number(
                          formValues.destination?.reception?.refusedWeight
                        ) * 1000}{" "}
                        kg
                      </p>
                    )}
                  </RhfReviewableField>
                )}
              <RhfReviewableField
                title={CODE_TRAITEMENT}
                path="destination.operation.code"
                value={bsda.destination?.operation?.code}
                defaultValue={initialBsdaReview.destination?.operation?.code}
              >
                <Select
                  label={NOUVEAU_CODE_TRAITEMENT}
                  className="fr-col-8"
                  nativeSelectProps={{
                    ...register("destination.operation.code")
                  }}
                >
                  <option value="...">Sélectionnez une valeur...</option>
                  <option value="R 5">
                    R 5 - Recyclage ou récupération d'autres matières
                    inorganiques (dont vitrification)
                  </option>
                  <option value="D 5">
                    D 5 - Mise en décharge aménagée et autorisée en ISDD ou
                    ISDND
                  </option>
                  <option value="D 9">
                    D 9 - Traitement chimique ou prétraitement (dont
                    vitrification)
                  </option>
                  <option value="R 13">
                    R 13 - Opérations de transit incluant le groupement sans
                    transvasement préalable à R 5
                  </option>
                  <option value="D 15">
                    D 15 - Transit incluant le groupement sans transvasement
                  </option>
                </Select>
                <RhfOperationModeSelect
                  operationCode={formValues?.destination?.operation?.code}
                  path={"destination.operation.mode"}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title={DESCRIPTION_TRAITEMENT}
                path="destination.operation.description"
                value={bsda.destination?.operation?.description}
                defaultValue={
                  initialBsdaReview.destination?.operation?.description
                }
              >
                <Input
                  label={NOUVELLE_DESC_TRAITEMENT}
                  nativeInputProps={{
                    ...register("destination.operation.description")
                  }}
                  className="fr-col-8"
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Courtier"
                path="broker"
                value={
                  bsda.broker?.company?.name ? (
                    <div>{bsda.broker.company.name}</div>
                  ) : (
                    "Aucun"
                  )
                }
                defaultValue={initialBsdaReview.broker}
              >
                <RhfBroker
                  bsdType={BsdType.Bsda}
                  siret={siret}
                  showSwitch={false}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Nom de chantier ou de collecte"
                value={bsda.emitter?.pickupSite?.name}
                path="emitter.pickupSite"
                defaultValue={initialBsdaReview.emitter?.pickupSite?.name}
              >
                <Input
                  label="Nom de chantier ou de collecte"
                  className="fr-col-8"
                  nativeInputProps={{
                    ...register("emitter.pickupSite.name")
                  }}
                />
              </RhfReviewableField>
              <RhfReviewableField
                title="Adresse de chantier ou de collecte"
                value={[
                  bsda.emitter?.pickupSite?.address,
                  bsda.emitter?.pickupSite?.postalCode,
                  bsda.emitter?.pickupSite?.city
                ]
                  .filter(Boolean)
                  .join(" ")}
                path="emitter.pickupSite"
                defaultValue={initialBsdaReview.emitter?.pickupSite}
              >
                <div className="form__row">
                  <DsfrfWorkSiteAddress
                    address={formValues?.emitter?.pickupSite?.address}
                    city={formValues?.emitter?.pickupSite?.city}
                    postalCode={formValues?.emitter?.pickupSite?.postalCode}
                    onAddressSelection={details => {
                      // `address` is passed as `name` because of adresse api return fields
                      setValue("emitter.pickupSite.address", details.name);
                      setValue("emitter.pickupSite.city", details.city);
                      setValue(
                        "emitter.pickupSite.postalCode",
                        details.postcode
                      );
                    }}
                    designation="du chantier ou lieu de collecte"
                    titleForRevision="Nouvelle adresse du chantier ou lieu de collecte"
                  />
                </div>

                <Input
                  textArea
                  label="Informations complémentaires (optionnel)"
                  nativeTextAreaProps={{
                    placeholder: "Champ libre pour préciser...",
                    ...register("emitter.pickupSite.infos")
                  }}
                  className="fr-mt-2w"
                />
              </RhfReviewableField>
            </div>
          </div>
          {!areModificationsDisabled && <hr />}
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
