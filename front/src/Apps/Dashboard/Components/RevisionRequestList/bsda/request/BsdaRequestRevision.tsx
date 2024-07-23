import { useMutation } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bsda,
  FavoriteType,
  Mutation,
  MutationCreateBsdaRevisionRequestArgs
} from "@td/codegen-ui";
import { BSDA_WASTES } from "@td/constants";
import React, { useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { removeEmptyKeys } from "../../../../../../common/helper";
import WorkSiteAddress from "../../../../../../form/common/components/work-site/WorkSiteAddress";
import RhfCompanyContactInfo from "../../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { Loader } from "../../../../../common/Components";
import RhfCompanySelectorWrapper from "../../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import RhfOperationModeSelect from "../../../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import { CREATE_BSDA_REVISION_REQUEST } from "../../../../../common/queries/reviews/BsdaReviewQuery";
import { BsdTypename } from "../../../../../common/types/bsdTypes";
import { BsdPackagings } from "../../common/Components/Packagings/RhfPackagings";
import { PACKAGINGS_BSD_NAMES } from "../../common/Components/Packagings/packagings";
import RhfReviewableField from "../../common/Components/ReviewableField/RhfReviewableField";
import {
  initialBsdaReview,
  validationBsdaSchema
} from "../../common/utils/schema";
import { BsdaRequestRevisionCancelationInput } from "../BsdaRequestRevisionCancelationInput";
import TagsInput from "../../../../../Forms/Components/TagsInput/TagsInput";
import styles from "./BsdaRequestRevision.module.scss";
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

  const onSubmitForm = async data => {
    const { comment, ...content } = data;
    const cleanedContent = removeEmptyKeys(content);

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
    navigate(-1);
  };

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await onSubmitForm(data);
    resetAndClose();
  };

  // live form values
  const formValues = watch();

  const areModificationsDisabled = formValues.isCanceled;

  const orgId = useMemo(
    () => bsda?.broker?.company?.orgId ?? bsda?.broker?.company?.siret ?? null,
    [bsda?.broker?.company?.orgId, bsda?.broker?.company?.siret]
  );

  const onCompanyBrokerSeleted = company => {
    const field = "broker";
    if (company) {
      setValue(`${field}.company.orgId`, company.orgId);
      setValue(`${field}.company.siret`, company.siret);
      setValue(`${field}.company.name`, company.name);
      setValue(`${field}.company.vatNumber`, company.vatNumber);
      setValue(`${field}.company.address`, company.address);
      setValue(
        `${field}.company.contact`,
        company.contact || bsda.broker?.company?.contact
      );
      setValue(
        `${field}.company.phone`,
        company.contactPhone || bsda.broker?.company?.phone
      );

      setValue(
        `${field}.company.mail`,
        company.contactEmail || bsda.broker?.company?.mail
      );
    }
    const receipt = company?.brokerReceipt;
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

  const handleAddSealNumbers = value => {
    if (value && !bsda.waste?.sealNumbers?.includes(value)) {
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
        Demander une révision du bordereau {bsda.id}
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
              <hr />
              <RhfReviewableField
                title="Code déchet"
                path="waste.code"
                value={bsda.waste?.code}
                defaultValue={initialBsdaReview.waste.code}
              >
                <Select
                  label="Code déchet"
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
                title="Nom usuel du déchet"
                path="waste.sealNumbers"
                value={bsda.waste?.sealNumbers}
                defaultValue={initialBsdaReview.waste.sealNumbers}
              >
                <Input
                  label="Nom usuel du déchet"
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
                    label="Numéros de scellés"
                    onAddTag={handleAddSealNumbers}
                    onDeleteTag={dismissTag}
                    tags={sealNumbersTags}
                  />
                </div>
              </RhfReviewableField>

              <RhfReviewableField
                title="Contient des polluants organique persistant"
                path="waste.pop"
                value={Boolean(bsda.waste?.pop) ? "Oui" : "Non"}
                defaultValue={initialBsdaReview.waste.pop}
              >
                <ToggleSwitch
                  label="Le déchet contient des polluants organiques persistants"
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
                title="CAP"
                value={bsda.destination?.cap}
                path="destination.cap"
                defaultValue={initialBsdaReview.destination.cap}
              >
                <Input
                  label="Numéro de CAP"
                  className="fr-col-6"
                  nativeInputProps={{
                    ...register("destination.cap")
                  }}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Conditionnement"
                path="packagings"
                value={bsda.packagings
                  ?.map(
                    p =>
                      `${p.quantity} ${
                        PACKAGINGS_BSD_NAMES[BsdTypename.Bsda][p.type]
                      }`
                  )
                  .join(", ")}
                defaultValue={initialBsdaReview.packagings}
                initialValue={bsda.packagings}
              >
                <BsdPackagings path="packagings" bsdType={BsdTypename.Bsda} />
              </RhfReviewableField>

              <RhfReviewableField
                title="Quantité traitée (en tonnes)"
                path="destination.reception.weight"
                value={bsda.destination?.reception?.weight}
                defaultValue={initialBsdaReview.destination?.reception?.weight}
              >
                <Input
                  label="Poids en tonnes"
                  className="fr-col-2"
                  state={errors.destination?.reception?.weight && "error"}
                  stateRelatedMessage={
                    errors.destination?.reception?.weight?.message ?? ""
                  }
                  nativeInputProps={{
                    ...register("destination.reception.weight", {
                      valueAsNumber: true
                    }),
                    type: "number"
                  }}
                />
                {Boolean(formValues.destination?.reception?.weight) && (
                  <p className="fr-info-text">
                    Soit{" "}
                    {Number(formValues.destination?.reception?.weight) * 1000}
                    kg
                  </p>
                )}
              </RhfReviewableField>

              <RhfReviewableField
                title="Code de l'opération D/R"
                path="destination.operation.code"
                value={bsda.destination?.operation?.code}
                defaultValue={initialBsdaReview.destination?.operation?.code}
              >
                <Select
                  label="Code de l'opération"
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
                  path={"destination.operation.code"}
                />
              </RhfReviewableField>

              <RhfReviewableField
                title="Description de l'opération D/R"
                path="destination.operation.description"
                value={bsda.destination?.operation?.description}
                defaultValue={
                  initialBsdaReview.destination?.operation?.description
                }
              >
                <Input
                  label="Description de l'opération D/R"
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
                  <WorkSiteAddress
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
                  />
                </div>

                <Input
                  textArea
                  label="Informations complémentaires (optionnel)"
                  nativeTextAreaProps={{
                    placeholder: "Champ libre pour préciser...",
                    ...register("emitter.pickupSite.infos")
                  }}
                />
              </RhfReviewableField>
            </div>
          </div>
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
