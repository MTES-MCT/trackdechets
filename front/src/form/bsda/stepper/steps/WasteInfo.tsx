import React from "react";
import { Field, useFormikContext } from "formik";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import Packagings from "form/bsda/components/packagings/Packagings";
import Tooltip from "common/components/Tooltip";
import { Bsda, BsdaConsistence } from "generated/graphql/types";
import TagsInput from "common/components/tags-input/TagsInput";

export function WasteInfo({ disabled }) {
  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <label>Code déchet</label>
        <Field as="select" name="waste.code" className="td-select">
          <option />
          <option value="08 01 17*">
            08 01 17* - déchets provenant du décapage de peintures ou vernis
            contenant des solvants organiques ou autres substances dangereuses
          </option>
          <option value="10 13 09*">
            10 13 09* - déchets provenant de la fabrication d'amiante-ciment
            contenant de l'amiante
          </option>
          <option value="15 01 11*">
            15 01 11* - emballages métalliques contenant une matrice poreuse
            solide dangereuse (par exemple amiante), y compris des conteneurs à
            pression vides
          </option>
          <option value="15 02 02*">
            15 02 02* - absorbants, matériaux filtrants (y compris les filtres à
            huile non spécifiés ailleurs), chiffons d'essuyage et vêtements de
            protection contaminés par des substances dangereuses
          </option>
          <option value="16 01 11*">
            16 01 11* - patins de freins contenant de l'amiante
          </option>
          <option value="16 02 12*">
            16 02 12* - équipements mis au rebut contenant de l'amiante libre
          </option>
          <option value="16 02 13*">
            16 02 13* - équipements mis au rebut contenant des composants
            dangereux (3) autres que ceux visés aux rubriques 16 02 09 à 16 02
            12
          </option>
          <option value="16 03 03*">
            16 03 03* - déchets d'origine minérale contenant des substances
            dangereuses
          </option>
          <option value="17 01 06*">
            17 01 06* - mélanges ou fractions séparées de béton, briques, tuiles
            et céramiques contenant des substances dangereuses
          </option>
          <option value="17 02 04*">
            17 02 04* - bois, verre et matières plastiques contenant des
            substances dangereuses ou contaminés par de telles substances
          </option>
          <option value="17 03 01*">
            17 03 01* - mélanges bitumineux contenant du goudron
          </option>
          <option value="17 05 05*">
            17 05 05* - boues de dragage contenant des substances dangereuses
          </option>
          <option value="17 05 07*">
            17 05 07* - ballast de voie contenant des substances dangereuses
          </option>
          <option value="17 06 01*">
            17 06 01* - matériaux d'isolation contenant de l'amiante
          </option>
          <option value="17 06 03*">
            17 06 03* - autres matériaux d'isolation à base de ou contenant des
            substances dangereuses
          </option>
          <option value="17 06 05*">
            17 06 05* - matériaux de construction contenant de l'amiante
          </option>
          <option value="17 08 01*">
            17 08 01* - matériaux de construction à base de gypse contaminés par
            des substances dangereuses
          </option>
          <option value="17 09 03*">
            17 09 03* - autres déchets de construction et de démolition (y
            compris en mélange) contenant des substances dangereuses
          </option>
        </Field>
      </div>

      <div className="form__row">
        <label>
          Dénomination du déchet
          <Field
            disabled={disabled}
            type="text"
            name="waste.name"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <WasteInfoWorker disabled={disabled} />
    </>
  );
}

export function WasteInfoWorker({ disabled }) {
  const { values } = useFormikContext<Bsda>();

  return (
    <>
      <div className="form__row">
        <label>
          Code famille
          <Field
            disabled={disabled}
            type="text"
            name="waste.familyCode"
            className="td-input td-input--small"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Nom du matériau
          <Field
            disabled={disabled}
            type="text"
            name="waste.materialName"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Mention au titre des règlements ADR/RID/ADN/IMDG (Optionnel):
          <Field
            disabled={disabled}
            type="text"
            name="waste.adr"
            className="td-input"
          />
        </label>
      </div>

      <h4 className="form__section-heading">Conditionnement</h4>
      <Field disabled={disabled} name="packagings" component={Packagings} />

      <div className="form__row">
        <label>
          Consistance
          <Field
            as="select"
            name="waste.consistence"
            id="id_mode"
            className="td-select td-input--small"
            disabled={disabled}
          >
            <option value={BsdaConsistence.Solide}>Solide</option>
            <option value={BsdaConsistence.Pulverulent}>Pulvérulents</option>
            <option value={BsdaConsistence.Other}>Autre</option>
          </Field>
        </label>
      </div>

      <h4 className="form__section-heading">Quantité</h4>
      <div className="form__row">
        <label>
          Quantité (en tonnes)
          <Field
            disabled={disabled}
            component={NumberInput}
            name="weight.value"
            className="td-input td-input--small"
            min="0"
            step="0.001"
          />
        </label>

        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="weight.isEstimate"
              className="td-checkbox"
            />
            Ce poids est estimé
          </label>
        </div>
      </div>

      <h4 className="form__section-heading">Numéros de scellés</h4>
      <div className="form__row">
        <label>
          Numéros de scellés
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> pour valider chacun" />
          <TagsInput name="waste.sealNumbers" disabled={disabled} />
        </label>
      </div>
      <p>
        Vous avez saisi {values.waste?.sealNumbers?.length ?? 0} scellé(s) et{" "}
        {values.packagings?.reduce((prev, cur) => prev + cur.quantity, 0) ?? 0}{" "}
        conditionnement(s).
      </p>
    </>
  );
}
