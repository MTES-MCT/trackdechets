import { FieldSwitch } from "common/components";
import RedErrorMessage from "common/components/RedErrorMessage";
import Tooltip from "common/components/Tooltip";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { connect, Field } from "formik";
import { isDangerous } from "generated/constants";
import React, { useEffect } from "react";
import Appendix2MultiSelect from "./components/appendix/Appendix2MultiSelect";
import AppendixInfo from "./components/appendix/AppendixInfo";
import Packagings from "./components/packagings/Packagings";
import { WasteCodeSelect, wasteCodeValidator } from "./components/waste-code";
import "./WasteInfo.scss";

type Values = {
  wasteDetails: { code: string; packagings: string[] };
  emitter: { company: { siret: string }; type: string };
};
export default connect<{}, Values>(function WasteInfo(props) {
  const { values, setFieldValue } = props.formik;

  if (!values.wasteDetails.packagings) {
    values.wasteDetails.packagings = [];
  }
  useEffect(() => {
    if (isDangerous(values.wasteDetails.code)) {
      setFieldValue("wasteDetails.isDangerous", true);
    }
  }, [values.wasteDetails.code, setFieldValue]);

  return (
    <>
      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <Field
          name="wasteDetails.code"
          component={WasteCodeSelect}
          validate={wasteCodeValidator}
        />
      </div>

      <div className="form__row">
        <label>
          Votre appellation du déchet (optionnel)
          <Tooltip
            msg="L'appellation du déchet est propre à votre entreprise pour vous aider
          à retrouver facilement le déchet concerné."
          />
          <Field type="text" name="wasteDetails.name" className="td-input" />
        </label>

        <RedErrorMessage name="wasteDetails.name" />
      </div>

      <div className="form__row" style={{ flexDirection: "row" }}>
        <Field
          type="checkbox"
          component={FieldSwitch}
          name="wasteDetails.isDangerous"
          disabled={isDangerous(values.wasteDetails.code)}
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

      {values.emitter.type === "APPENDIX1" && <AppendixInfo />}

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
            traitement de type D 13, D 14, D 15 ou R 13.
          </p>
          <Appendix2MultiSelect />
        </>
      )}

      <h4 className="form__section-heading">Conditionnement</h4>

      <Field name="wasteDetails.packagingInfos" component={Packagings} />

      <div className="form__row">
        <fieldset>
          <legend>Consistance</legend>
          <div className="tw-flex">
            <Field
              name="wasteDetails.consistence"
              id="SOLID"
              label="Solide"
              component={RadioButton}
            />
            <Field
              name="wasteDetails.consistence"
              id="LIQUID"
              label="Liquide"
              component={RadioButton}
            />
            <Field
              name="wasteDetails.consistence"
              id="GASEOUS"
              label="Gazeux"
              component={RadioButton}
            />
            <Field
              name="wasteDetails.consistence"
              id="DOUGHY"
              label="Pâteux"
              component={RadioButton}
            />
          </div>
        </fieldset>

        <RedErrorMessage name="wasteDetails.consistence" />
      </div>

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
          />
          <Field
            name="wasteDetails.quantityType"
            id="ESTIMATED"
            label="Estimée"
            component={RadioButton}
          />
        </fieldset>

        <RedErrorMessage name="wasteDetails.quantityType" />
      </div>
      <div className="form__row">
        <label>
          Mentions au titre des règlements ADR, RID, ADNR, IMDG{" "}
          {!isDangerous(values.wasteDetails.code) && "(optionnel)"}
          <Field type="text" name="wasteDetails.onuCode" className="td-input" />
        </label>

        <RedErrorMessage name="wasteDetails.onuCode" />
      </div>
    </>
  );
});
