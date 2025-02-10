import Button from "@codegouvfr/react-dsfr/Button";
import React from "react";

import "./accountInfoActionBar.scss";

interface AccountInfoActionBarProps {
  title?: string;
  isEditing: boolean;
  onEditInfo: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onReset: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isDisabled?: boolean;
}
const AccountInfoActionBar = ({
  title,
  isEditing,
  onEditInfo,
  onReset,
  isDisabled
}: AccountInfoActionBarProps) => (
  <div className="account-info">
    {title && <h3 className="fr-h3 fr-mr-1w">{title}</h3>}
    <div className="account-info__bar">
      {!isEditing && (
        <div>
          <Button
            size="small"
            type="button"
            onClick={onEditInfo}
            nativeButtonProps={{ "data-testid": "modify-info-cta" }}
          >
            Modifier
          </Button>
        </div>
      )}
      {isEditing && (
        <>
          <div>
            <Button
              priority="secondary"
              size="small"
              type="button"
              onClick={onReset}
              disabled={isDisabled}
            >
              Annuler
            </Button>
          </div>
          <div>
            <Button
              priority="primary"
              size="small"
              disabled={isDisabled}
              nativeButtonProps={{ "data-testid": "submit-info-cta" }}
            >
              Valider
            </Button>
          </div>
        </>
      )}
    </div>
  </div>
);

export default AccountInfoActionBar;
