import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  OperationMode,
  Mutation,
  MutationMarkAsProcessedArgs,
  FormStatus,
  FavoriteType
} from "@td/codegen-ui";
import {
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  PROCESSING_AND_REUSE_OPERATIONS,
  isDangerous,
  isForeignVat,
  INCOMING_TEXS_WASTE_CODES
} from "@td/constants";
import { useMutation, gql } from "@apollo/client";
import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { statusChangeFragment } from "../../../../Apps/common/queries/fragments";
import { SignForm } from "./SignForm";
import { datetimeToYYYYMMDD } from "../../../../common/datetime";
import { subMonths } from "date-fns";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import RhfOperationModeSelect from "../../../common/Components/OperationModeSelect/RhfOperationModeSelect";
import Select from "@codegouvfr/react-dsfr/Select";
import { toCompanyInput } from "../bsff/SignBsffPackagingForm";
import Alert from "@codegouvfr/react-dsfr/Alert";
import RhfExtraEuropeanCompanyManualInput from "../../Components/RhfExtraEuropeanCompanyManualInput/RhfExtraEuropeanCompanyManualInput";
import CompanyContactInfo from "../../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import SingleCheckbox from "../../../common/Components/SingleCheckbox/SingleCheckbox";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { ParcelsVisualizer } from "../../../../form/registry/common/ParcelsVisualizer/ParcelsVisualizer";
import { fieldArray } from "../../../../form/registry/builder/validation";

const MARK_AS_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID!, $processedInfo: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $processedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const schema = z.object({
  processedBy: z
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
  processedAt: z.coerce
    .date({
      required_error: "La date de traitement est requise",
      invalid_type_error: "Format de date invalide."
    })
    .transform(v => v?.toISOString()),
  noTraceability: z.boolean().nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),
  processingOperationDescription: z.string().nullish(),
  processingOperationDone: z.string().nullish(),
  isUpcycled: z.boolean(),
  destinationParcelInseeCodes: fieldArray,
  destinationParcelNumbers: fieldArray,
  destinationParcelCoordinates: fieldArray,
  nextDestination: z
    .object({
      company: z
        .object({
          siret: z.string().nullish(),
          vatNumber: z.string().nullish(),
          extraEuropeanId: z.string().nullish(),
          name: z.string().nullish(),
          contact: z.string().nullish(),
          phone: z.string().nullish(),
          mail: z.string().nullish(),
          address: z.string().nullish(),
          city: z.string().nullish(),
          street: z.string().nullish(),
          postalCode: z.string().nullish(),
          country: z.string().nullish()
        })
        .nullish(),
      notificationNumber: z.string().nullish(),
      processingOperation: z.string().nullish()
    })
    .nullish()
});
export type ZodFormOperation = z.infer<typeof schema>;

interface SignOperationProps {
  formId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
  title: string;
}

export function SignOperation({
  formId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
  title
}: Readonly<SignOperationProps>) {
  return (
    <SignForm
      title={title}
      formId={formId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
      size="L"
    >
      {({ form, onClose }) => (
        <SignOperationModal form={form} onClose={onClose} />
      )}
    </SignForm>
  );
}

interface SignOperationModalProps {
  form: Form;
  onClose: () => void;
}

function SignOperationModal({
  form,
  onClose
}: Readonly<SignOperationModalProps>) {
  const { siret } = useParams<{ siret: string }>();

  const [markAsProcessed, { loading, error }] = useMutation<
    Pick<Mutation, "markAsProcessed">,
    MutationMarkAsProcessedArgs
  >(MARK_AS_PROCESSED);

  const TODAY = new Date();

  const initialState = {
    processedAt: datetimeToYYYYMMDD(TODAY),
    processedBy: "",
    processingOperationDone: "",
    destinationOperationMode: undefined,
    processingOperationDescription: "",
    isUpcycled: false,
    destinationParcelInseeCodes: [],
    destinationParcelNumbers: [],
    destinationParcelCoordinates: [],
    nextDestination: null,
    noTraceability: null
  } as ZodFormOperation;

  const methods = useForm<ZodFormOperation>({
    values: initialState,
    resolver: async (data, context, options) => {
      return zodResolver(schema)(data, context, options);
    }
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    watch,
    setValue
  } = methods;

  const isFormValid = !Object.keys(errors ?? {}).length;

  const onSubmit = async data => {
    const { nextDestination, ...values } = data;

    await markAsProcessed({
      variables: {
        id: form.id,
        processedInfo: {
          ...values,
          nextDestination
        }
      }
    });
    onClose();
  };

  const initNextDestination = useMemo(
    () => ({
      processingOperation: "",
      destinationOperationMode: undefined,
      notificationNumber: "",
      company: {
        siret: "",
        name: "",
        address: "",
        contact: "",
        mail: "",
        phone: "",
        vatNumber: ""
      }
    }),
    []
  );

  const processingOperationDone = watch("processingOperationDone");
  const nextDestination = watch("nextDestination");
  const noTraceability = watch("noTraceability");
  const vatNumber = watch("nextDestination.company.vatNumber");

  const showIsUpcycled =
    form.wasteDetails?.code &&
    INCOMING_TEXS_WASTE_CODES.includes(form.wasteDetails.code) &&
    processingOperationDone?.startsWith("R");
  const isUpcycled = watch("isUpcycled");

  console.log(watch("destinationParcelNumbers"));

  const [isExtraEuropeanCompany, setIsExtraEuropeanCompany] = useState(
    nextDestination?.company?.extraEuropeanId ? true : false
  );
  const [extraEuropeanCompany, setExtraEuropeanCompany] = useState(
    nextDestination?.company?.extraEuropeanId
  );

  const [isForeignCompany, setIsForeignCompany] = useState(false);
  const [isForeignCompanyNameDisabled, setIsForeignCompanyNameDisabled] =
    useState(false);
  const [isForeignCompanyAddressDisabled, setIsForeignCompanyAddressDisabled] =
    useState(false);

  /**
   * Hack the API requirement for any value in nextDestination.company.extraEuropeanId
   */
  useEffect(() => {
    if (isExtraEuropeanCompany) {
      setValue("nextDestination.company", initNextDestination.company);
      setValue("nextDestination.company.country", "");
      setValue(
        "nextDestination.company.extraEuropeanId",
        !extraEuropeanCompany ? "" : extraEuropeanCompany
      );
      setValue("nextDestination.company.vatNumber", vatNumber);
    } else {
      setIsExtraEuropeanCompany(false);
      setValue("nextDestination.company.extraEuropeanId", "");
      setExtraEuropeanCompany("");
    }
  }, [
    isExtraEuropeanCompany,
    extraEuropeanCompany,
    initNextDestination.company,
    setValue,
    vatNumber
  ]);

  const isGroupement =
    processingOperationDone &&
    PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(processingOperationDone);

  useEffect(() => {
    if (isGroupement) {
      if (nextDestination == null) {
        setValue("nextDestination", initNextDestination);
      }
      if (noTraceability == null) {
        setValue("noTraceability", false);
      }
    } else {
      setValue("nextDestination", null);
      setValue("noTraceability", null);
    }
  }, [
    isGroupement,
    nextDestination,
    noTraceability,
    initNextDestination,
    setValue
  ]);

  const isFRCompany = Boolean(nextDestination?.company?.siret);
  const hasVatNumber = Boolean(nextDestination?.company?.vatNumber);

  const isDangerousWaste =
    isDangerous(form.wasteDetails?.code ?? "") ||
    (form.wasteDetails?.isDangerous && " (dangereux)");
  const isPop = form?.wasteDetails?.pop;

  // le déchet: comporte un code * || est marqué comme dangereux || est marqué POP
  const isDangerousOrPop = isDangerousWaste || isPop;

  // Notification number
  const showNotificationNumber =
    isExtraEuropeanCompany || (!isFRCompany && noTraceability) || hasVatNumber;

  // Le numéro de notif est obligatoire quand:
  // - le code de traitement est non final
  // - que le déchet est DD, pop ou marqué comme dangereux
  // Si  sansrupture de traçabilité:
  // - entreprise (destination ultérieure) non française
  // Si avec rupture de traçabilité:
  // - entreprise (destination ultérieure) UE non française renseignée (via TVA ou n° d'identifiant)

  const hasNextDestinationCompany = !!(
    nextDestination?.company?.extraEuropeanId ||
    nextDestination?.company?.siret ||
    nextDestination?.company?.vatNumber
  );

  const notificationNumberIsMandatory =
    isDangerousOrPop && nextDestination && noTraceability
      ? hasNextDestinationCompany
      : isExtraEuropeanCompany || hasVatNumber;

  const notificationNumberIsOptional = !notificationNumberIsMandatory;
  // nextDestination + hasVatNumber + isDangerousOrPop
  const notificationNumberPlaceHolder = isDangerousOrPop
    ? "PPAAAADDDRRR"
    : "A7E AAAA DDDRRR";
  const notificationNumberLabel = isDangerousOrPop
    ? `Numéro de notification ${
        notificationNumberIsOptional ? "(Optionnel)" : ""
      }`
    : "Numéro de déclaration Annexe 7 (optionnel)";
  const notificationNumberTooltip = isDangerousOrPop
    ? "En cas d'export, indiquer ici le N° de notification prévu à l'annexe 1-B du règlement N°1013/2006, au format PPAAAADDDRRR avec PP pour le code pays, AAAA pour l'année du dossier, DDD pour le département de départ et RRR pour le numéro d'ordre."
    : "En cas d'export, indiquer ici le N° de déclaration Annexe 7 (optionnel) prévu à l'annexe 1-B du règlement N°1013/2006, au format A7E AAAA DDDRRR avec A7E pour Annexe 7 Export (ou A7I pour Annexe 7 Import), AAAA pour l'année du dossier, DDD pour le département de départ et RRR pour le numéro d'ordre. ";

  const isOperationCodeNeedComment = ["D 3", "D 4", "D 12", "D 9 F"].includes(
    processingOperationDone as string
  );
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {form.status === FormStatus.TempStorerAccepted && (
          <div className="notification notification--warning">
            Attention, vous vous apprêtez à valider un traitement ou un
            regroupement sur lequel votre établissement était identifié en tant
            qu'installation d'entreposage provisoire et/ou de reconditionnement.
            Votre entreprise sera désormais uniquement destinataire du bordereau
            et l'étape d'entreposage provisoire va disparaitre.
          </div>
        )}

        <div className="fr-grid-row fr-grid-row--top fr-grid-row--gutters">
          <p className="fr-text fr-text--md fr-col-12 fr-mb-0">
            Vous hésitez sur le type d'opération à choisir ? Vous pouvez
            consulter la liste de traitement des déchets sur{" "}
            <a
              className="fr-link force-external-link-content force-underline-link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000026902174"
            >
              Légifrance
            </a>
            . Le type d'opération figure sur le CAP qui a été émis par le
            destinataire.
          </p>
          <div className="fr-col-12">
            <Select
              label="Traitement d’élimination / valorisation effectuée (code D/R)"
              nativeSelectProps={register("processingOperationDone")}
              state={errors.processingOperationDone ? "error" : "default"}
              stateRelatedMessage={errors.processingOperationDone?.message}
              className="fr-mb-2w"
              hint={`Code de traitement prévu : ${
                form.temporaryStorageDetail?.destination?.processingOperation ??
                form.recipient?.processingOperation
              }`}
            >
              {PROCESSING_AND_REUSE_OPERATIONS.map(operation => (
                <option value={operation.code} key={operation.code}>
                  {operation.code} - {operation.description}
                </option>
              ))}
            </Select>

            {isOperationCodeNeedComment && (
              <p className="fr-info-text">
                {processingOperationDone === "D 9 F"
                  ? "Pour un traitement final"
                  : "Non utilisable en France, sauf situation exceptionnelle"}
              </p>
            )}
          </div>
        </div>
        <RhfOperationModeSelect
          operationCode={processingOperationDone}
          path={"destinationOperationMode"}
        />
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12">
            <Input
              label="Description du traitement réalisé (optionnel)"
              textArea
              className="fr-col-12"
              state={errors?.processingOperationDescription && "error"}
              stateRelatedMessage={
                (errors?.processingOperationDescription?.message as string) ??
                ""
              }
              nativeTextAreaProps={{
                ...register("processingOperationDescription")
              }}
            />
          </div>
        </div>
        {showIsUpcycled && (
          <div>
            <p className="fr-mb-2w">
              La terre est valorisée en remblayage (optionnel)
            </p>
            <RadioButtons
              orientation="horizontal"
              options={[
                {
                  label: "Oui",
                  nativeInputProps: {
                    onChange: () => {
                      setValue("isUpcycled", true);
                    },
                    checked: isUpcycled === true
                  }
                },
                {
                  label: "Non",
                  nativeInputProps: {
                    onChange: () => {
                      setValue("isUpcycled", false);
                    },
                    checked: !isUpcycled
                  }
                }
              ]}
            />
          </div>
        )}
        {isUpcycled && (
          <ParcelsVisualizer
            methods={methods}
            prefix="destinationParcel"
            title=""
          />
        )}
        {isGroupement && noTraceability !== null && (
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-pb-0">
              <SingleCheckbox
                options={[
                  {
                    label:
                      "Rupture de traçabilité autorisée par arrêté préfectoral pour ce déchet - la responsabilité du producteur du déchet est transférée",
                    nativeInputProps: {
                      ...register("noTraceability")
                    }
                  }
                ]}
              />
            </div>
            {noTraceability && (
              <div className="fr-col-12 fr-pt-0">
                <Alert
                  small={true}
                  severity="info"
                  description={
                    "La destination ultérieure prévue est optionnelle si les déchets sont envoyés vers des destinations différentes et que vous n'êtes pas en mesure de déterminer l'exutoire final à ce stade. Le code de traitement final prévu reste obligatoire."
                  }
                />
              </div>
            )}
          </div>
        )}

        {nextDestination && (
          <>
            <h6 className="fr-h6">Destination ultérieure prévue</h6>
            <div className="fr-grid-row fr-grid-row--gutters">
              <p className="fr-text fr-text--md fr-col-12 fr-mb-0">
                Vous hésitez sur le type d'opération à choisir ? Vous pouvez
                consulter la liste de traitement des déchets sur{" "}
                <a
                  className="fr-link force-external-link-content force-underline-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000026902174"
                >
                  Légifrance
                </a>
                . Le type d'opération figure sur le CAP qui a été émis par le
                destinataire.
              </p>
              <div className="fr-col-12">
                <Select
                  label="Opération d’élimination / valorisation prévue (code D/R)"
                  nativeSelectProps={register(
                    "nextDestination.processingOperation"
                  )}
                  state={
                    errors.nextDestination?.processingOperation
                      ? "error"
                      : "default"
                  }
                  stateRelatedMessage={
                    errors.nextDestination?.processingOperation?.message
                  }
                >
                  {PROCESSING_AND_REUSE_OPERATIONS.map(operation => (
                    <option value={operation.code} key={operation.code}>
                      {operation.code} - {operation.description}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <SingleCheckbox
                  options={[
                    {
                      label: "L'entreprise est située hors UE",
                      hintText:
                        "Si le numéro de TVA n'est pas reconnu, veuillez aussi cocher ce champ et indiquer manuellement le numéro",
                      nativeInputProps: {
                        checked: isExtraEuropeanCompany,
                        onChange: e =>
                          setIsExtraEuropeanCompany(e.target.checked)
                      }
                    }
                  ]}
                />
              </div>
            </div>
            {!isExtraEuropeanCompany && (
              <>
                <CompanySelectorWrapper
                  favoriteType={FavoriteType.NextDestination}
                  orgId={siret}
                  selectedCompanyOrgId={
                    nextDestination?.company?.siret ??
                    nextDestination.company?.vatNumber
                  }
                  allowForeignCompanies={true}
                  onCompanySelected={company => {
                    setValue("nextDestination.company", company);
                    if (company) {
                      setValue(
                        "nextDestination.company",
                        toCompanyInput(company)
                      );

                      if (company.codePaysEtrangerEtablissement) {
                        setValue(
                          "nextDestination.company.country",
                          company.codePaysEtrangerEtablissement
                        );

                        setIsForeignCompanyNameDisabled(!!company.name);
                        setIsForeignCompanyAddressDisabled(!!company.address);
                      }

                      setIsForeignCompany(isForeignVat(company.vatNumber!));
                    }
                  }}
                />

                {isForeignCompany && (
                  <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Nom de l'entreprise"
                        state={
                          errors?.nextDestination?.company?.name && "error"
                        }
                        stateRelatedMessage={
                          (errors?.nextDestination?.company?.name
                            ?.message as string) ?? ""
                        }
                        disabled={isForeignCompanyNameDisabled}
                        nativeInputProps={{
                          ...register("nextDestination.company.name")
                        }}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Adresse de l'entreprise"
                        state={
                          errors?.nextDestination?.company?.address && "error"
                        }
                        stateRelatedMessage={
                          (errors?.nextDestination?.company?.address
                            ?.message as string) ?? ""
                        }
                        disabled={isForeignCompanyAddressDisabled}
                        nativeInputProps={{
                          ...register("nextDestination.company.address")
                        }}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Pays de l'entreprise"
                        state={
                          errors?.nextDestination?.company?.country && "error"
                        }
                        stateRelatedMessage={
                          (errors?.nextDestination?.company?.country
                            ?.message as string) ?? ""
                        }
                        disabled={true}
                        nativeInputProps={{
                          ...register("nextDestination.company.country")
                        }}
                      />
                    </div>
                  </div>
                )}

                <CompanyContactInfo
                  fieldName={"nextDestination.company"}
                  errorObject={errors?.nextDestination?.company}
                />
              </>
            )}

            <div className="fr-grid-row fr-grid-row--gutters">
              {isExtraEuropeanCompany && (
                <div className="fr-col-12">
                  <RhfExtraEuropeanCompanyManualInput
                    fieldName="nextDestination.company"
                    optional={noTraceability === true}
                    extraEuropeanCompanyId={extraEuropeanCompany}
                    onExtraEuropeanCompanyId={setExtraEuropeanCompany}
                  />
                </div>
              )}
              {showNotificationNumber && (
                <div className="fr-col-12">
                  <Input
                    label={notificationNumberLabel}
                    hintText={notificationNumberTooltip}
                    className="fr-col-12"
                    state={
                      errors?.nextDestination?.notificationNumber && "error"
                    }
                    stateRelatedMessage={
                      (errors?.nextDestination?.notificationNumber
                        ?.message as string) ?? ""
                    }
                    nativeInputProps={{
                      ...register("nextDestination.notificationNumber"),
                      placeholder: notificationNumberPlaceHolder
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <hr />
        <p className="fr-text fr-text--md fr-mb-2w">
          En qualité de <strong>destinataire du déchet</strong>, j'atteste que
          les informations ci-dessus sont correctes et certifie que le
          traitement indiqué ci-contre a bien été réalisé pour la quantité de
          déchets renseignée.
        </p>

        <Input
          label="Date du traitement"
          className="fr-col-sm-6 fr-col-lg-4 "
          state={errors?.processedAt && "error"}
          stateRelatedMessage={(errors?.processedAt?.message as string) ?? ""}
          nativeInputProps={{
            type: "date",
            min: datetimeToYYYYMMDD(subMonths(TODAY, 2)),
            max: datetimeToYYYYMMDD(TODAY),
            ...register("processedAt")
          }}
        />

        <div className="fr-grid-row fr-grid-row--gutters">
          <Input
            label="Nom et prénom"
            className="fr-col-sm-6"
            state={errors?.processedBy && "error"}
            stateRelatedMessage={(errors?.processedBy?.message as string) ?? ""}
            nativeInputProps={{
              ...register("processedBy")
            }}
          />
        </div>

        {error && (
          <Alert
            severity="error"
            title="Erreur"
            className="fr-mt-5v"
            description={error.message}
          />
        )}

        <div className="dsfr-modal-actions fr-mt-3w">
          <Button
            disabled={isSubmitting || loading}
            priority="secondary"
            onClick={onClose}
            type="button"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || loading || !isFormValid}
          >
            {loading ? "Signature en cours..." : "Valider"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
