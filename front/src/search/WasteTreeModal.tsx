import React, { useState } from "react";
import WasteTree from "./WasteTree";
import styles from "./WasteTreeModal.module.scss";
import TdModal from "src/common/components/Modal";
type Props = {
  open: boolean;
  onClose?: () => void;
  onSelect?: (value: any) => void;
};

export default function({
  open = false,
  onClose = () => null,
  onSelect = () => null,
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState([]);

  return (
    <TdModal
      isOpen={open}
      ariaLabel="Liste des déchets"
      onClose={onClose}
      wide={true}
    >
      <div className={styles.tree}>
        <WasteTree onSelect={keys => setSelectedKeys(keys)} />
      </div>

      <p>Vous allez sélectionner le(s) code(s): {selectedKeys.join(", ")}</p>
      <div className="form__actions">
        <button
          className="btn btn--outline-primary"
          type="button"
          onClick={() => onClose()}
        >
          Annuler
        </button>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            onSelect(selectedKeys);
            onClose();
          }}
        >
          Valider
        </button>
      </div>
    </TdModal>
  );
}
