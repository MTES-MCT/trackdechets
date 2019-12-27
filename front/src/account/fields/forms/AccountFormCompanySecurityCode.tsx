import React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";

type Props = {
  toggleEdition: () => void;
  mutationArgs: object;
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
  const [renewSecurityCode, { loading }] = useMutation(RENEW_SECURITY_CODE, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const cautionMessage =
    "Attention, vous êtes sur le point de demander un nouveau code de sécurité qui \
    va vous être attribuer de façon aléatoire, vous veillerez à en informer les \
    personnes en charge de la validation du BSD auprès du transporteur";

  if (loading) {
    return <div>Renouvellement en cours...</div>;
  }

  return (
    <>
      <div className="notification warning">{cautionMessage}</div>
      <button
        className="button"
        type="submit"
        onClick={() => renewSecurityCode({ variables: mutationArgs })}
      >
        Renouveler
      </button>
    </>
  );
}
