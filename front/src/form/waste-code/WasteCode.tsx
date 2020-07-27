import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { WASTES } from "../../generated/constants";
import RedErrorMessage from "../../common/RedErrorMessage";
import WasteTreeModal from "../../search/WasteTreeModal";
import formatWasteCodeEffect from "./format-waste-code.effect";
import "./WasteCode.scss";

export default function WasteCode(props) {
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
    <div className="waste-code">
      <div className="text-quote">
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
        <div className="waste-code__widgets">
          <input
            type="text"
            name={field.name}
            value={wasteCode}
            className={`waste-code__input ${
              meta.touched && meta.error && "input-error"
            }`}
            onBlur={field.onBlur}
            onChange={e => setWasteCode(e.target.value)}
          />
          <button
            type="button"
            className="button-outline small primary"
            onClick={() => setOpenModal(true)}
          >
            liste des codes déchets
          </button>
        </div>
      </label>

      <RedErrorMessage name={field.name} />

      {wasteCodeDetail && (
        <div className="notification success">
          Vous avez sélectionné le code déchet{" "}
          <strong>{isDangerous ? "dangereux" : "non dangereux"}</strong>{" "}
          suivant: <em>{wasteCodeDetail.description}</em>
        </div>
      )}
    </div>
  );
}
