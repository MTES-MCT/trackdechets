import { ErrorMessage, FieldProps, getIn } from "formik";
import React, { useEffect, useState } from "react";
import WasteCodeLookup from "./nomenclature-dechets.json";
import formatWasteCodeEffect from "./format-waste-code.effect";
import "./WasteCode.scss";

const tempBookmarks = [
  {
    code: "01 01 02",
    description:
      "déchets provenant de l'extraction des minéraux non métallifères"
  },
  {
    code: "01 03 04*",
    description: "stériles acidogènes provenant de la transformation du sulfure"
  },
  {
    code: "01 03 05*",
    description: "autres stériles contenant des substances dangereuses"
  }
];

type Bookmark = {
  code: string;
  description: string;
};

export default function WasteCode(props: FieldProps) {
  const [wasteCode, setWasteCode] = useState(props.field.value);
  const [bookmarks, setBookmarks] = useState(tempBookmarks); // TODO

  useEffect(
    () => {
      props.form.setFieldValue(props.field.name, wasteCode);
      formatWasteCodeEffect(wasteCode, setWasteCode);
    },
    [wasteCode]
  );

  const wasteCodeDetail = WasteCodeLookup.find(l => l.code === wasteCode);
  const isDangerous = wasteCode.indexOf("*") > -1;
  const isTouched = getIn(props.form.touched, props.field.name);

  return (
    <div className="WasteCode">
      <div className="text-quote">
        <p>
          Vous hésitez sur le type de code déchet à choisir ? Vous pouvez
          consulter la liste de codification des déchets sur{" "}
          <a href="https://aida.ineris.fr/consultation_document/10327">
            le site de l'Aida.
          </a>
        </p>
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

      <ErrorMessage
        name={props.field.name}
        render={msg => <div className="input-error-message">{msg}</div>}
      />

      {bookmarks.length && (
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
};
