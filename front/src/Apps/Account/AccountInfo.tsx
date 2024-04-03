import React from "react";
import { gql } from "@apollo/client";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import AccountFieldName from "./fields/AccountFieldName";
import AccountFieldPhone from "./fields/AccountFieldPhone";
import AccountFieldPassword from "./fields/AccountFieldPassword";
import { User } from "@td/codegen-ui";

type Props = {
  me: User;
};

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      email
      ...AccountFieldPhoneFragment
      ...AccountFieldNameFragment
    }
    ${AccountFieldPhone.fragments.me},
    ${AccountFieldName.fragments.me}
  `
};

export default function AccountInfo({ me }: Props) {
  return (
    <>
      <AccountFieldNotEditable name="email" label="Email" value={me.email} />
      <AccountFieldName me={me} />
      <AccountFieldPhone me={me} />
      <AccountFieldPassword />
    </>
  );
}
