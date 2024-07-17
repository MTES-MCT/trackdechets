import React, { useState } from "react";
import WasteTree from "./WasteTree";
import styles from "./WasteTreeModal.module.scss";
import TdModal from "../Modal/Modal";
import { BSDD_WASTES_TREE, WasteNode } from "@td/constants";
import Button from "@codegouvfr/react-dsfr/Button";
type Props = {
  wasteTree?: WasteNode[];
  open: boolean;
  onClose?: () => void;
  onSelect?: (value: any) => void;
};

function WasteTreeModal({
  wasteTree = BSDD_WASTES_TREE,
  open = false,
  onClose = () => null,
  onSelect = () => null
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState([]);

  return (
    <TdModal
      isOpen={open}
      ariaLabel="Liste des déchets"
      onClose={onClose}
      size="XL"
    >
      <div className={styles.tree}>
        <WasteTree
          onSelect={keys => setSelectedKeys(keys)}
          wasteTree={wasteTree}
        />
      </div>
      <br />
      <p>Vous allez sélectionner le(s) code(s): {selectedKeys.join(", ")}</p>
      <div className="form__actions">
        <Button
          priority="secondary"
          nativeButtonProps={{ type: "button" }}
          onClick={() => onClose()}
        >
          Annuler
        </Button>

        <Button
          nativeButtonProps={{ type: "button" }}
          onClick={() => {
            onSelect(selectedKeys);
            onClose();
          }}
        >
          Valider
        </Button>
      </div>
    </TdModal>
  );
}

export default WasteTreeModal;
