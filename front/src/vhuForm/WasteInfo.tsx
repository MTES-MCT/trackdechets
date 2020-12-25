import { RedErrorMessage } from "common/components";
import NumberInput from "form/custom-inputs/NumberInput";
import { RadioButton } from "form/custom-inputs/RadioButton";
import { Field } from "formik";
import React from "react";
import Tooltip from "../common/components/Tooltip";
import TagsInput from "./tags-input/TagsInput";

import "./WasteInfo.scss";

export default function WasteInfo() {
  return (
    <>
      <h4 className="form__section-heading">Description des VHUs</h4>

      <div className="form__row">
        <fieldset>
          <legend>Conditionnement</legend>
          <div className="tw-flex">
            <Field
              name="wasteDetails.packagingType"
              id="UNIT"
              label="en unités"
              component={RadioButton}
            />
            <Field
              name="wasteDetails.packagingType"
              id="BUNDLE"
              label="en lots"
              component={RadioButton}
            />
          </div>
        </fieldset>

        <RedErrorMessage name="wasteDetails.packagingType" />
      </div>

      <div className="form__row">
        <fieldset>
          <legend>Identification par N° d'ordre</legend>
          <div className="tw-flex">
            <Field
              name="wasteDetails.identificationType"
              id="VHU_NUMBER"
              label="tels qu'ils figurent dans le registre de police"
              component={RadioButton}
            />
            <Field
              name="wasteDetails.identificationType"
              id="BUNDLE_NUMBER"
              label="des lots sortants"
              component={RadioButton}
            />
          </div>
        </fieldset>

        <RedErrorMessage name="wasteDetails.identificationType" />
      </div>

      <div className="form__row">
        <label>
          Détail des identifications
          <Tooltip msg="Saisissez les indentifications une par une. Appuyez sur la touche <Entrée> pour valider chacune" />
          <TagsInput name="wasteDetails.identificationNumbers" />
        </label>
      </div>

      <h4 className="form__section-heading">Quantité</h4>

      <div className="form__row">
        <label>
          <Field
            component={NumberInput}
            name="wasteDetails.quantity"
            className="td-input waste-details__quantity"
            placeholder="2"
            min="0"
            step="1"
          />
          <span className="tw-ml-2">en</span>
          <Field
            as="select"
            name="wasteDetails.quantityUnit"
            className="td-input waste-details__quantityUnit"
          >
            <option value="NUMBER">nombre</option>
            <option value="TON">tonnes</option>
          </Field>
        </label>

        <RedErrorMessage name="wasteDetails.quantity" />
      </div>
    </>
  );
}
