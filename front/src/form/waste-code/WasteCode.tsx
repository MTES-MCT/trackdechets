import React, { useEffect, useRef, useState } from "react";
import "./WasteCode.scss";
import { wasteCodeValidator, WasteCodeStatus } from "./waste-code.validator";
import wasteCodeDisplayEffect from "./waste-code-display.effect";
import WasteCodeLookup from "./nomenclature-dechets.json";

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

interface IProps {
  value: string;
  onChange?: (wasteCode: string) => void;
}

export default function WasteCode(props: IProps) {
  const [wasteCode, setWasteCode] = useState(props.value);
  const [error, setError] = useState("");
  const [isPristine, setIsPristine] = useState(true);
  const [bookmarks, setBookmarks] = useState(tempBookmarks); // TODO

  useEffect(() => wasteCodeDisplayEffect(wasteCode, setWasteCode), [wasteCode]);

  useEffect(
    () => {
      switch (wasteCodeValidator(wasteCode)) {
        case WasteCodeStatus.Ok:
          props.onChange && props.onChange(wasteCode);
          return setError("");
        default:
          return setError("Le code déchet saisi n'existe pas.");
      }
    },
    [wasteCode]
  );

  const wasteCodeDetail = WasteCodeLookup.find(l => l.code === wasteCode);

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
        Code déchet:
        <input
          type="text"
          list="wasteCodes"
          value={wasteCode}
          className={!isPristine && error.length > 0 ? "input-error" : ""}
          onBlur={() => setIsPristine(false)}
          onChange={e => setWasteCode(e.target.value)}
        />
      </label>
      {!isPristine && error.length > 0 && (
        <div className="input-error-message">{error}</div>
      )}

      <span>Codes favoris:</span>
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

      {wasteCodeDetail != null && (
        <div className="notification success">
          Vous avez sélectionné le code déchet suivant:{" "}
          <em>{wasteCodeDetail.description}</em>
        </div>
      )}
    </div>
  );
}
