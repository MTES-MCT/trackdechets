import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Mutation, MutationRenewSecurityCodeArgs } from "codegen-ui";

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
  mutationArgs
}: Props) {
  const [renewSecurityCode, { loading }] = useMutation<
    Pick<Mutation, "renewSecurityCode">,
    MutationRenewSecurityCodeArgs
  >(RENEW_SECURITY_CODE, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const cautionMessage =
    "Attention, un nouveau code de signature va vous être attribué de façon aléatoire; vous veillerez à en informer les personnes en charge de la validation du BSD auprès du transporteur. Notez qu'il est prudent de le renouveler si vous pensez qu'il est connu d'un tiers et que le nombre de renouvellement par minute est limité.";

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
