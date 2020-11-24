import React from "react";
import { gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import AccountFieldName from "./fields/AccountFieldName";
import AccountFieldPhone from "./fields/AccountFieldPhone";
import AccountFieldPassword from "./fields/AccountFieldPassword";
import { User } from "generated/graphql/types";

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
  `,
};

export default function AccountInfo({ me }: Props) {
  return (
    <>
      <AccountFieldNotEditable name="email" label="Email" value={me.email} />
      <AccountFieldName me={filter(AccountFieldName.fragments.me, me)} />
      <AccountFieldPhone me={filter(AccountFieldPhone.fragments.me, me)} />
      <AccountFieldPassword />
    </>
  );
}
