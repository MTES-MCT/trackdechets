import React, { useState, forwardRef } from "react";
import {
  BSDD_WASTES,
  BSDD_APPENDIX1_WASTE_TREE,
  BSDD_WASTES_TREE
} from "@td/constants";
import WasteTreeModal from "../search/WasteTreeModal";
import styles from "./wasteCode.module.scss";
import Button from "@codegouvfr/react-dsfr/Button";

function formatWasteCode(wasteCode: string) {
  if (!wasteCode) {
    return wasteCode;
  }
  const trimmed = wasteCode.trim();
  const stringLength = trimmed.length;
  if (
    [3, 6].indexOf(stringLength) > -1 &&
    wasteCode[stringLength - 1] !== " "
  ) {
    return `${wasteCode.substr(0, stringLength - 1)} ${wasteCode.substr(
      stringLength - 1,
      1
    )}`;
  }
  return trimmed;
}

const WasteCodeSelector = forwardRef(function WasteCodeSelector(
  //@ts-ignore
  { formValues, onSelect, onChange },
  ref
) {
  const [openModal, setOpenModal] = useState(false);
  const waste = BSDD_WASTES.find(
    waste => waste.code === formValues.wasteDetails.code
  );
  return (
    <>
      <div className={styles.textQuote}>
        <ul>
          <li>
            Vous hésitez sur le type de code déchet à choisir ? Sélectionnez un
            code via le bouton de liste des codes déchets
            <WasteTreeModal
              wasteTree={
                formValues?.emitter?.type === "APPENDIX1"
                  ? BSDD_APPENDIX1_WASTE_TREE
                  : BSDD_WASTES_TREE
              }
              open={openModal}
              onClose={() => setOpenModal(false)}
              onSelect={codes => {
                onSelect("wasteDetails.code", codes[0], {
                  shouldDirty: true
                });
              }}
            />
          </li>
          <li>Pour les codes déchets dangereux n'oubliez pas l'astérisque</li>
        </ul>
      </div>

      <label>
        Code déchet
        <div className={styles.wasteCodeWidgets}>
          <input
            //@ts-ignore
            ref={ref}
            type="text"
            className={`td-input ${styles.wasteCodeInput}`}
            onChange={e => {
              const newValue = formatWasteCode(e.target.value);
              onChange("wasteDetails.code", newValue, {
                shouldDirty: Boolean(formValues.wasteDetails.code)
              });
            }}
          />
          <Button
            priority="secondary"
            nativeButtonProps={{ type: "button" }}
            onClick={() => setOpenModal(true)}
          >
            Liste des codes déchets
          </Button>
        </div>
      </label>
      {formValues.wasteDetails.code && waste?.description && (
        <div className="notification success tw-mt-2">
          Vous avez sélectionné le code déchet suivant :{" "}
          <em>{waste?.description}</em>
        </div>
      )}
    </>
  );
});

export default WasteCodeSelector;
