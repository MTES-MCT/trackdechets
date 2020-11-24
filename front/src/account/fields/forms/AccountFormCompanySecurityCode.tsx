import React from "react";
import { useMutation, gql } from "@apollo/client";
import {
  Mutation,
  MutationRenewSecurityCodeArgs,
} from "generated/graphql/types";

type Props = {
  toggleEdition: () => void;
  mutationArgs: MutationRenewSecurityCodeArgs;
};

const RENEW_SECURITY_CODE = gql`
  mutation RenewSecurityCode($siret: String!) {
    renewSecurityCode(siret: $siret) {
      id
      securityCode
    }
  }
`;

export default function AccountFormCompanySecurityCode({
  toggleEdition,
  mutationArgs,
}: Props) {
  const [renewSecurityCode, { loading }] = useMutation<
    Pick<Mutation, "renewSecurityCode">,
    MutationRenewSecurityCodeArgs
  >(RENEW_SECURITY_CODE, {
    onCompleted: () => {
      toggleEdition();
    },
  });

  const cautionMessage =
    "Attention, vous êtes sur le point de demander un nouveau code de sécurité qui va vous être attribuer de façon aléatoire, vous veillerez à en informer les personnes en charge de la validation du BSD auprès du transporteur";

  if (loading) {
    return <div>Renouvellement en cours...</div>;
  }

  return (
    <>
      <div className="notification warning">{cautionMessage}</div>
      <button
        className="btn btn--primary"
        type="submit"
        onClick={() => renewSecurityCode({ variables: mutationArgs })}
      >
        Renouveler
      </button>
    </>
  );
}
