import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import RedErrorMessage from "../../common/RedErrorMessage";
import WasteTreeModal from "../../search/WasteTreeModal";
import formatWasteCodeEffect from "./format-waste-code.effect";
import WasteCodeLookup from "./nomenclature-dechets.json";
import "./WasteCode.scss";

type Bookmark = {
  code: string;
  description: string;
};

export default function WasteCode(props) {
  const [field, meta] = useField(props);
  const { setFieldValue } = useFormikContext();

  const [wasteCode, setWasteCode] = useState(field.value);
  const [bookmarks] = useState<Bookmark[]>([]); // TODO

  useEffect(() => {
    setFieldValue(field.name, wasteCode);
    formatWasteCodeEffect(wasteCode, setWasteCode);
  }, [wasteCode, field.name, setFieldValue]);

  const wasteCodeDetail = WasteCodeLookup.find(l => l.code === wasteCode);
  const isDangerous = wasteCode.indexOf("*") > -1;

  const [openModal, setOpenModal] = useState(false);
  return (
    <div className="WasteCode">
      <div className="text-quote">
        <ul>
          <li>
            Vous hésitez sur le type de code déchet à choisir ? Sélectionnez un
            code via la{" "}
            <button
              type="button"
              className="button-outline small primary"
              onClick={() => setOpenModal(true)}
            >
              liste des codes déchets
            </button>
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
        <input
          type="text"
          name={field.name}
          value={wasteCode}
          className={meta.touched && meta.error ? "input-error" : ""}
          onBlur={field.onBlur}
          onChange={e => setWasteCode(e.target.value)}
        />
      </label>

      <RedErrorMessage name={field.name} />

      {bookmarks.length > 0 && (
        <React.Fragment>
          <span>Codes récents:</span>
          <ul className="label-list list-inline">
            {bookmarks.map(bookmark => (
              <li
                className="label"
                key={bookmark.code}
                onClick={() => setWasteCode(bookmark.code)}
              >
                <span>{bookmark.code}</span>
              </li>
            ))}
          </ul>
        </React.Fragment>
      )}

      {wasteCodeDetail != null && (
        <div className="notification success">
          Vous avez sélectionné le code déchet{" "}
          <strong>{isDangerous ? "dangereux" : "non dangereux"}</strong>{" "}
          suivant: <em>{wasteCodeDetail.description}</em>
        </div>
      )}
    </div>
  );
}
