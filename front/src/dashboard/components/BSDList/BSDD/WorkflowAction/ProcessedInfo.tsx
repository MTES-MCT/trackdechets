import React, { useEffect, useMemo, useState } from "react";
import { Field, Form, useFormikContext } from "formik";
import {
  PROCESSING_AND_REUSE_OPERATIONS,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
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
      /**
       * Hack the API requirement for "any" value in nextDestination.company.extraEuropeanId
       * in order to require notificationNumber
       * Soon notificationNumber will be required for intra-european companies too
       */
      setFieldValue("nextDestination.company", initNextDestination.company);
      setFieldValue("nextDestination.company.country", "");
      setFieldValue(
        "nextDestination.company.extraEuropeanId",
        !extraEuropeanCompany
          ? "UNIDENTIFIED_EXTRA_EUROPEAN_COMPANY"
          : extraEuropeanCompany
      );
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
  const showNotificationNumber =
    (!isFRCompany && noTraceability) || isExtraEuropeanCompany;

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
            {showNotificationNumber && (
              <>
                <label>
                  Numéro de notification ou de document{" "}
                  {!isExtraEuropeanCompany ? "(optionnel)" : ""}{" "}
                  <Tooltip msg="En cas d'export, indiquer ici le N° du document prévu ou le numéro de notification prévue à l'annexe I-B du règlement N°1013/2006 - Format PPNNNN (PP: code pays NNNN: numéro d'ordre)" />
                </label>
                <Field
                  type="text"
                  name="nextDestination.notificationNumber"
                  className="td-input"
                  placeholder="PPNNNN (PP: code pays, NNNN: numéro d'ordre)"
                  required={isExtraEuropeanCompany}
                />
              </>
            )}
            {isExtraEuropeanCompany && (
              <ExtraEuropeanCompanyManualInput
                name="nextDestination.company"
                optional={noTraceability === true}
                extraEuropeanCompanyId={extraEuropeanCompany}
                onExtraEuropeanCompanyId={setExtraEuropeanCompany}
              />
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
