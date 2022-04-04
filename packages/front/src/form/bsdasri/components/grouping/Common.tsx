import React from "react";

export const RefreshButton = ({ onClick }) => (
  <button
    type="button"
    className="btn btn--small  btn--primary tw-mb-2"
    onClick={() => onClick()}
  >
    Rafraîchir
  </button>
);
