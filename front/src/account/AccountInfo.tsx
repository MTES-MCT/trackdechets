import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";

type Props = {
  me: {
    email: string;
  };
};

export default function AccountInfo({ me }: Props) {
  return (
    <>
      <AccountField>
        <div>Email</div>
        <div>{me.email}</div>
        <div>Modifier</div>
      </AccountField>
    </>
  );
}

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      email
    }
  `
};
