import { FieldProps, getIn } from "formik";
import React, { useEffect, useState } from "react";
import RedErrorMessage from "../RedErrorMessage";
import formatWasteCodeEffect from "./format-waste-code.effect";
import WasteCodeLookup from "./nomenclature-dechets.json";
import "./WasteCode.scss";
import WasteTreeModal from "../../search/WasteTreeModal";

type Bookmark = {
  code: string;
  description: string;
};

export default function WasteCode(props: FieldProps) {
  const [wasteCode, setWasteCode] = useState(props.field.value);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]); // TODO

  useEffect(() => {
    props.form.setFieldValue(props.field.name, wasteCode);
    formatWasteCodeEffect(wasteCode, setWasteCode);
  }, [wasteCode]);

  const wasteCodeDetail = WasteCodeLookup.find(l => l.code === wasteCode);
  const isDangerous = wasteCode.indexOf("*") > -1;
  const isTouched = getIn(props.form.touched, props.field.name);

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
          name={props.field.name}
          value={wasteCode}
          className={
            isTouched && getIn(props.form.errors, props.field.name)
              ? "input-error"
              : ""
          }
          onBlur={e => props.form.handleBlur(e)}
          onChange={e => setWasteCode(e.target.value)}
        />
      </label>

      <RedErrorMessage name={props.field.name} />

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
                <a>{bookmark.code}</a>
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
