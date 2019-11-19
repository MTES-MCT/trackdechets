import React from "react";
import gql from "graphql-tag";

type Props = {
  me: {
    email: string;
  };
};

export default function AccountInfo({ me }: Props) {
  return <p>email: {me.email}</p>;
}

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      email
    }
  `
};
