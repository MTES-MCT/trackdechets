import { SimpleNotificationError } from "common/components/Error";
import React, { ReactElement } from "react";

interface ErrorProps {
  message: string | ReactElement;
  hideReloadPageCTA: boolean;
}
const Error = ({ message, hideReloadPageCTA }: ErrorProps) => {
  const onClick = () => window.location.reload();

  return (
    <>
      <SimpleNotificationError message={message} />

      {!hideReloadPageCTA && (
        <button type="button" className="fr-btn" onClick={onClick}>
          Raffraichir la page
        </button>
      )}
    </>
  );
};
export default Error;
