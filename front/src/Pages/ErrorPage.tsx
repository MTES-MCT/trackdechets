import { SimpleNotificationError } from "../Apps/common/Components/Error/Error";
import React, { ReactElement } from "react";

interface ErrorProps {
  message: string | ReactElement;
  hideReloadPageCTA: boolean;
}
const ErrorPage = ({ message, hideReloadPageCTA }: ErrorProps) => {
  const onClick = () => window.location.reload();

  return (
    <>
      <SimpleNotificationError message={message} />

      {!hideReloadPageCTA && (
        <button type="button" className="fr-btn" onClick={onClick}>
          Rafraîchir la page
        </button>
      )}
    </>
  );
};
export default ErrorPage;
