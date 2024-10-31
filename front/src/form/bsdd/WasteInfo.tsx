import { FieldSwitch } from "../../common/components";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import Tooltip from "../../common/components/Tooltip";
import NumberInput from "../common/components/custom-inputs/NumberInput";
import { RadioButton } from "../common/components/custom-inputs/RadioButton";
import { connect, Field } from "formik";
import {
  isDangerous,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "@td/constants";
import React, { useEffect } from "react";
import Appendix2MultiSelect from "./components/appendix/Appendix2MultiSelect";
import Packagings from "./components/packagings/Packagings";
import { ParcelNumbersSelector } from "./components/parcel-number/ParcelNumber";
import {
  WasteCodeSelect,
  bsddWasteCodeValidator
} from "./components/waste-code";
import "./WasteInfo.scss";
import EstimatedQuantityTooltip from "../../common/components/EstimatedQuantityTooltip";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";

type Values = {
  wasteDetails: {
    isSubjectToADR: boolean | null;
    code: string;
    packagings: string[];
    parcelNumbers: any[];
    landIdentifiers: string[];
    analysisReferences: string[];
  };
  emitter: { company: { siret: string }; type: string };
};

const SOIL_CODES = [
  "17 05 03*",
  "17 05 04",
  "17 05 05*",
  "17 05 06",
  "01 03 99",
  "01 05 04",
  "01 05 05*",
  "01 05 06*",
  "01 05 07",
  "01 05 08",
  "01 05 99",
  "02 01 01",
  "02 01 99",
  "20 02 02"
];

export default connect<{ disabled }, Values>(function WasteInfo({
  formik,
  disabled
}) {
  const { values, setFieldValue } = formik;

  if (!values.wasteDetails.packagings) {
    values.wasteDetails.packagings = [];
  }
  useEffect(() => {
    if (isDangerous(values.wasteDetails.code)) {
      setFieldValue("wasteDetails.isDangerous", true);
      setFieldValue("wasteDetails.isSubjectToADR", true);
    }
  }, [values.wasteDetails.code, setFieldValue]);

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}
      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <Field
          name="wasteDetails.code"
          component={WasteCodeSelect}
          validate={bsddWasteCodeValidator}
          disabled={disabled}
        />
      </div>

      <div className="form__row">
        <label>
          Votre appellation du déchet
          <Tooltip
            msg="L'appellation du déchet est propre à votre entreprise pour vous aider
          à retrouver facilement le déchet concerné."
          />
          <Field
            type="text"
            name="wasteDetails.name"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="wasteDetails.name" />
      </div>

      <div className="form__row" style={{ flexDirection: "row" }}>
        <Field
          type="checkbox"
          component={FieldSwitch}
          name="wasteDetails.isDangerous"
          disabled={disabled || isDangerous(values.wasteDetails.code)}
          label={
            <span>
              Le déchet est{" "}
              <a
                className="tw-underline"
                href="https://www.ecologie.gouv.fr/dechets-dangereux"
                target="_blank"
                rel="noopener noreferrer"
              >
                dangereux
              </a>
            </span>
          }
        />
        <div className="tw-ml-1">
          <Tooltip msg="Certains déchets avec un code sans astérisque peuvent, selon les cas, être dangereux ou non dangereux." />
        </div>
      </div>

      <div className="form__row" style={{ flexDirection: "row" }}>
        <Field
          type="checkbox"
          component={FieldSwitch}
          name="wasteDetails.pop"
          disabled={disabled}
          label={
            <span>
              Le déchet contient des{" "}
              <a
                className="tw-underline"
                href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
                target="_blank"
                rel="noopener noreferrer"
              >
                polluants organiques persistants
              </a>
            </span>
          }
        />
        <div className="tw-ml-1">
          <Tooltip
            msg="Le terme POP recouvre un ensemble de substances organiques qui
        possèdent 4 propriétés : persistantes, bioaccumulables, toxiques et mobiles."
          />
        </div>
      </div>

      {values.emitter.type === "APPENDIX1" && (
        <div>
          <h4 className="form__section-heading">Bordereau de tournée dédiée</h4>
          <div className="notification warning">
            <span>
              Vous créez un bordereau de tournée dédiée. Vous pourrez ensuite
              rattacher des bordereaux d'annexe 1 à cette tournée. Ce
              rattachement sera à faire dans un second temps, après la création
              de ce bordereau de tournée.
            </span>
          </div>
        </div>
      )}

      {values.emitter.type === "APPENDIX2" && (
        <>
          <h4 className="form__section-heading">Annexe 2</h4>
          <p className="tw-my-2">
            Vous êtes en train de créer un bordereau de regroupement. Veuillez
            sélectionner ci-dessous les bordereaux à regrouper.
          </p>
          <p className="tw-my-2">
            Tous les bordereaux présentés ci-dessous correspondent à des
            bordereaux pour lesquels vous avez effectué une opération de
            traitement de type{" "}
            {PROCESSING_OPERATIONS_GROUPEMENT_CODES.join(", ")}.
          </p>
          <Appendix2MultiSelect />
        </>
      )}

      <h4 className="form__section-heading">Conditionnement</h4>

      {values.emitter.type !== "APPENDIX1" && (
        <Field
          name="wasteDetails.packagingInfos"
          component={Packagings}
          disabled={disabled}
        />
      )}

      <div className="form__row">
        <fieldset>
          <legend>Consistance</legend>
          <div className="tw-flex">
            <Field
              name="wasteDetails.consistence"
              id="SOLID"
              label="Solide"
              component={RadioButton}
              disabled={disabled}
            />
            <Field
              name="wasteDetails.consistence"
              id="LIQUID"
              label="Liquide"
              component={RadioButton}
              disabled={disabled}
            />
            <Field
              name="wasteDetails.consistence"
              id="GASEOUS"
              label="Gazeux"
              component={RadioButton}
              disabled={disabled}
            />
            <Field
              name="wasteDetails.consistence"
              id="DOUGHY"
              label="Pâteux"
              component={RadioButton}
              disabled={disabled}
            />
          </div>
        </fieldset>

        <RedErrorMessage name="wasteDetails.consistence" />
      </div>

      {values.emitter.type !== "APPENDIX1" && (
        <>
          <h4 className="form__section-heading">Quantité en tonnes</h4>
          <div className="form__row">
            <label>
              <Field
                component={NumberInput}
                name="wasteDetails.quantity"
                className="td-input waste-details__quantity"
                placeholder="En tonnes"
                min="0"
                step="0.001"
                disabled={disabled}
              />
              <span className="tw-ml-2">Tonnes</span>
            </label>
            <RedErrorMessage name="wasteDetails.quantity" />

            <fieldset className="tw-mt-3">
              <legend>Cette quantité est</legend>
              <Field
                name="wasteDetails.quantityType"
                id="REAL"
                label="Réelle"
                component={RadioButton}
                disabled={disabled}
              />
              <Field
                name="wasteDetails.quantityType"
                id="ESTIMATED"
                label={
                  <>
                    Estimée <EstimatedQuantityTooltip />
                  </>
                }
                component={RadioButton}
                disabled={disabled}
              />
            </fieldset>

            <RedErrorMessage name="wasteDetails.quantityType" />
          </div>
        </>
      )}

      <div className="form__row fr-mt-8v">
        <ToggleSwitch
          onChange={e => {
            setFieldValue("wasteDetails.isSubjectToADR", e);
            if (!e) {
              setFieldValue("wasteDetails.onuCode", null);
            }
          }}
          inputTitle={"Test"}
          label="Le déchet est soumis à l'ADR"
          checked={values.wasteDetails.isSubjectToADR ?? false}
        />

        {values.wasteDetails.isSubjectToADR && (
          <div className="fr-ml-18v">
            <label>
              Mentions au titre des règlements ADR, RID, ADNR, IMDG{" "}
              <Field
                type="text"
                name="wasteDetails.onuCode"
                className="td-input"
                disabled={disabled}
              />
            </label>

            <RedErrorMessage name="wasteDetails.onuCode" />
          </div>
        )}
      </div>

      {SOIL_CODES.includes(values.wasteDetails.code) ||
      values.wasteDetails.parcelNumbers?.length ||
      values.wasteDetails.landIdentifiers?.length ||
      values.wasteDetails.analysisReferences?.length ? (
        <>
          <h4 className="form__section-heading">Terres et sédiments</h4>

          <div className="form__row">
            <Field
              component={ParcelNumbersSelector}
              name="wasteDetails.parcelNumbers"
            />
          </div>
        </>
      ) : null}
    </>
  );
});
