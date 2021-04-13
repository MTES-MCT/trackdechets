import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { WASTES } from "generated/constants";
import RedErrorMessage from "common/components/RedErrorMessage";
import WasteTreeModal from "search/WasteTreeModal";
import formatWasteCodeEffect from "./format-waste-code.effect";
import styles from "./WasteCode.module.scss";

export function WasteCode(props) {
  const [field, meta] = useField(props);
  const { setFieldValue } = useFormikContext();

  const [wasteCode, setWasteCode] = useState(field.value);

  useEffect(() => {
    setFieldValue(field.name, wasteCode);
    formatWasteCodeEffect(wasteCode, setWasteCode);
  }, [wasteCode, field.name, setFieldValue]);

  const wasteCodeDetail = WASTES.find(waste => waste.code === wasteCode);
  const isDangerous = wasteCode.indexOf("*") > -1;

  const [openModal, setOpenModal] = useState(false);
  return (
    <div>
      <div className={styles.textQuote}>
        <ul>
          <li>
            Vous hésitez sur le type de code déchet à choisir ? Sélectionnez un
            code via le bouton de liste des codes déchets
            <WasteTreeModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              onSelect={codes => setWasteCode(codes[0])}
            />
          </li>
          <li>Pour les codes déchets dangereux n'oubliez pas l'astérisque</li>
        </ul>
      </div>

      <label>
        Code déchet
        <div className={styles.wasteCodeWidgets}>
          <input
            type="text"
            name={field.name}
            value={wasteCode}
            className={`td-input ${styles.wasteCodeInput} ${
              meta.touched && meta.error && styles.inputError
            }`}
            onBlur={field.onBlur}
            onChange={e => setWasteCode(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--outline-primary"
            onClick={() => setOpenModal(true)}
          >
            Liste des codes déchets
          </button>
        </div>
      </label>

      <RedErrorMessage name={field.name} />

      {wasteCodeDetail && (
        <div className="notification success tw-mt-2">
          Vous avez sélectionné le code déchet{" "}
          <strong>{isDangerous ? "dangereux" : "non dangereux"}</strong>{" "}
          suivant: <em>{wasteCodeDetail.description}</em>
        </div>
      )}
    </div>
  );
}
