import React from "react";

const ErrorBsdaSignOperation = ({ message }) => (
  <div className="notification notification--error">{message}</div>
);

export default React.memo(ErrorBsdaSignOperation);
