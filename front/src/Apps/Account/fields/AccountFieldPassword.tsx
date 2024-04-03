import React from "react";
import AccountField from "./AccountField";
import AccountFormChangePassword from "./forms/AccountFormChangePassword";

export default function AccountFieldPassword() {
  return (
    <AccountField
      name="password"
      label="Mot de passe"
      value="**********"
      renderForm={toggleEdition => (
        <AccountFormChangePassword toggleEdition={toggleEdition} />
      )}
    />
  );
}
