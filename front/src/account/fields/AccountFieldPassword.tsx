import React from "react";
import AccountField from "./AccountField";
import AccountChangePasswordForm from "./forms/AccountChangePasswordForm";

export default function AccountFieldPassword() {
  return (
    <AccountField
      name="password"
      label="Mot de passe"
      value="**********"
      renderForm={toggleEdition => (
        <AccountChangePasswordForm toggleEdition={toggleEdition} />
      )}
      modifier="Modifier"
    />
  );
}
