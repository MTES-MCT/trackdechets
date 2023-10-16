import React, { useCallback } from "react";

const CancelButton = ({ handleReset, onClose }) => {
  const onClick = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);
  return (
    <button
      type="button"
      className="btn btn--outline-primary"
      onClick={onClick}
    >
      Annuler
    </button>
  );
};

export default React.memo(CancelButton);
