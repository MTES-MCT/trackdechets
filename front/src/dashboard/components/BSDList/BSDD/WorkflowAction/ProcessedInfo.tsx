import React, { useEffect, useMemo, useState } from "react";
import { Field, Form, useFormikContext } from "formik";
import {
  PROCESSING_AND_REUSE_OPERATIONS,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  isDangerous
} from "@td/constants";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import CompanySelector from "../../../../../form/common/components/company/CompanySelector";
import ExtraEuropeanCompanyManualInput from "../../../../../form/common/components/company/ExtraEuropeanCompanyManualInput";
import {
  Form as TdForm,
  FormStatus,
  MutationMarkAsProcessedArgs
} from "@td/codegen-ui";
import Tooltip from "../../../../../common/components/Tooltip";
import { subMonths } from "date-fns";
import OperationModeSelect from "../../../../../common/components/OperationModeSelect";

function ProcessedInfo({ form, close }: { form: TdForm; close: () => void }) {
  const {
    values: { processingOperationDone, noTraceability, nextDestination },
    setFieldValue
  } = useFormikContext<MutationMarkAsProcessedArgs["processedInfo"]>();
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
        phone: ""
      }
    }),
    []
  );

  const [isExtraEuropeanCompany, setIsExtraEuropeanCompany] = useState(
    nextDestination?.company?.extraEuropeanId ? true : false
  );
  const [extraEuropeanCompany, setExtraEuropeanCompany] = useState(
    nextDestination?.company?.extraEuropeanId
  );

  /**
   * Hack the API requirement for any value in nextDestination.company.extraEuropeanId
   */
  useEffect(() => {
    if (isExtraEuropeanCompany) {
      setFieldValue("nextDestination.company", initNextDestination.company);
      setFieldValue("nextDestination.company.country", "");
      setFieldValue(
        "nextDestination.company.extraEuropeanId",
        !extraEuropeanCompany ? "" : extraEuropeanCompany
      );
    } else {
      setIsExtraEuropeanCompany(false);
      setFieldValue("nextDestination.company.extraEuropeanId", "");
      setExtraEuropeanCompany("");
    }
  }, [
    isExtraEuropeanCompany,
    setFieldValue,
    extraEuropeanCompany,
    initNextDestination.company
  ]);

  const isGroupement =
    processingOperationDone &&
    PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(processingOperationDone);

  useEffect(() => {
    if (isGroupement) {
      if (nextDestination == null) {
        setFieldValue("nextDestination", initNextDestination);
      }
      if (noTraceability == null) {
        setFieldValue("noTraceability", false);
      }
    } else {
      setFieldValue("nextDestination", null);
      setFieldValue("noTraceability", null);
    }
  }, [
    initNextDestination,
    isGroupement,
    nextDestination,
    noTraceability,
    setFieldValue
  ]);

  const TODAY = new Date();
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
    ? "PP AAAA DDDRRR"
    : "A7E AAAA DDDRRR";
  const notificationNumberLabel = isDangerousOrPop
    ? `Numéro de notification ${
        notificationNumberIsOptional ? "(Optionnel)" : ""
      }`
    : "Numéro de déclaration Annexe 7 (optionnel)";
  const notificationNumberTooltip = isDangerousOrPop
    ? "En cas d'export, indiquer ici le N° de notification prévu à l'annexe 1-B du règlement N°1013/2006, au format PP AAAA DDDRRR avec PP pour le code pays, AAAA pour l'année du dossier, DDD pour le département de départ et RRR pour le numéro d'ordre."
    : "En cas d'export, indiquer ici le N° de déclaration Annexe 7 (optionnel) prévu à l'annexe 1-B du règlement N°1013/2006, au format A7E AAAA DDDRRR avec A7E pour Annexe 7 Export (ou A7I pour Annexe 7 Import), AAAA pour l'année du dossier, DDD pour le département de départ et RRR pour le numéro d'ordre. ";

  return (
    <Form>
      {form.status === FormStatus.TempStorerAccepted && (
        <div className="notification notification--warning">
          Attention, vous vous apprêtez à valider un traitement ou un
          regroupement sur lequel votre établissement était identifié en tant
          qu'installation d'entreposage provisoire et/ou de reconditionnement.
          Votre entreprise sera désormais uniquement destinataire du bordereau
          et l'étape d'entreposage provisoire va disparaitre.
        </div>
      )}
      <div className="form__row">
        <label>
          Nom du responsable
          <Field
            type="text"
            name="processedBy"
            placeholder="NOM Prénom"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Date de traitement
          <Field
            component={DateInput}
            minDate={subMonths(TODAY, 2)}
            maxDate={TODAY}
            name="processedAt"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>Opération d’élimination / valorisation effectuée</label>
        <Field
          component="select"
          name="processingOperationDone"
          className="td-select"
        >
          <option value="">Choisissez...</option>
          {PROCESSING_AND_REUSE_OPERATIONS.map(operation => (
            <option key={operation.code} value={operation.code}>
              {operation.code} - {operation.description.substr(0, 50)}
              {operation.description.length > 50 ? "..." : ""}
            </option>
          ))}
        </Field>
        <div>
          Code de traitement prévu :{" "}
          {form.temporaryStorageDetail?.destination?.processingOperation ??
            form.recipient?.processingOperation}
        </div>
      </div>
      <OperationModeSelect
        operationCode={processingOperationDone}
        name="destinationOperationMode"
      />
      <div className="form__row">
        <label>
          Description de l'Opération
          <Field
            component="textarea"
            name="processingOperationDescription"
            className="td-textarea"
          />
        </label>
      </div>
      {isGroupement && noTraceability !== null && (
        <>
          <div className="form__row form__row--inline">
            <Field
              type="checkbox"
              name="noTraceability"
              id="id_noTraceability"
              className="td-checkbox"
            />

            <label htmlFor="id_noTraceability">
              {" "}
              Rupture de traçabilité autorisée par arrêté préfectoral pour ce
              déchet - la responsabilité du producteur du déchet est transférée
            </label>
          </div>
          {noTraceability && (
            <div className="notification">
              La destination ultérieure prévue est optionnelle si les déchets
              sont envoyés vers des destinations différentes et que vous n'êtes
              pas en mesure de déterminer l'exutoire final à ce stade. Le code
              de traitement final prévu reste obligatoire.
            </div>
          )}
        </>
      )}

      {nextDestination && (
        <div className="form__row">
          <h4 className="h4">Destination ultérieure prévue</h4>
          <div className="form__row">
            <label>Opération d’élimination / valorisation (code D/R)</label>
            <Field
              component="select"
              name="nextDestination.processingOperation"
              className="td-select"
            >
              <option value="">Choisissez...</option>
              {PROCESSING_AND_REUSE_OPERATIONS.map(operation => (
                <option key={operation.code} value={operation.code}>
                  {operation.code} - {operation.description.substr(0, 50)}
                  {operation.description.length > 50 ? "..." : ""}
                </option>
              ))}
            </Field>
          </div>
          <div className="form__row form__row--inline">
            <Field
              type="checkbox"
              name="isExtraEuropeanCompany"
              id="id_isExtraEuropeanId"
              className="td-checkbox"
              checked={isExtraEuropeanCompany}
              onChange={e => setIsExtraEuropeanCompany(e.target.checked)}
            />
            <label htmlFor="id_isExtraEuropeanId">
              {" "}
              Destinataire hors Union Européenne
              <Tooltip msg="Si le numéro de TVA n'est pas reconnu, veuillez aussi cocher ce champ et indiquer manuellement le numéro" />
            </label>
          </div>
          {!isExtraEuropeanCompany && (
            <CompanySelector
              name="nextDestination.company"
              allowForeignCompanies={true}
              skipFavorite={noTraceability === true}
              optional={noTraceability === true}
            />
          )}
          <div className="form__row">
            {isExtraEuropeanCompany && (
              <ExtraEuropeanCompanyManualInput
                name="nextDestination.company"
                optional={noTraceability === true}
                extraEuropeanCompanyId={extraEuropeanCompany}
                onExtraEuropeanCompanyId={setExtraEuropeanCompany}
              />
            )}
            {showNotificationNumber && (
              <>
                <label>
                  {notificationNumberLabel}
                  <Tooltip msg={notificationNumberTooltip} />
                </label>
                <Field
                  type="text"
                  name="nextDestination.notificationNumber"
                  className="td-input"
                  placeholder={notificationNumberPlaceHolder}
                />
              </>
            )}
          </div>
        </div>
      )}
      <div className="form__actions">
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={close}
        >
          Annuler
        </button>
        <button type="submit" className="btn btn--primary">
          Je valide
        </button>
      </div>
    </Form>
  );
}

export default ProcessedInfo;
