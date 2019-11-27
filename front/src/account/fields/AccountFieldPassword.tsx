import React from "react";
import gql from "graphql-tag";
import AccountField from "../AccountField";
import AccountSimpleFieldForm from "./forms/AccountSimpleFieldForm";
import { useMutation } from "@apollo/react-hooks";

export default function AccountFieldPassword() {
  return (
    <AccountField
      name="password"
      label="Mot de passe"
      value="**********"
      renderForm={() => <div>form</div>}
      modifier="Modifier"
    />
  );
}
