import { NotificationError } from "../../common/Components/Error/Error";
import {
  CompanyPrivate,
  Mutation,
  MutationUpdateCompanyArgs
} from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import React from "react";
import { isSiret } from "@td/constants";
import AccountFieldCompanyBrokerReceipt from "./AccountFieldCompanyBrokerReceipt";
import AccountFieldCompanyGerepId from "./AccountFieldCompanyGerepId";
import AccountFieldCompanyGivenName from "./AccountFieldCompanyGivenName";
import AccountFieldCompanyTraderReceipt from "./AccountFieldCompanyTraderReceipt";
import AccountFieldCompanyTransporterReceipt from "./AccountFieldCompanyTransporterReceipt";
import AccountFieldCompanyTypes from "./AccountFieldCompanyTypes";
import AccountFieldCompanyVerificationStatus from "./AccountFieldCompanyVerificationStatus";
import AccountFieldCompanyVhuAgrementBroyeur from "./AccountFieldCompanyVhuAgrementBroyeur";
import AccountFieldCompanyVhuAgrementDemolisseur from "./AccountFieldCompanyVhuAgrementDemolisseur";
import AccountFieldCompanyWorkerCertification from "./AccountFieldCompanyWorkerCertification";

AccountInfoAutoUpdate.fragments = {
  company: gql`
    fragment AccountInfoAutoUpdateFragment on CompanyPrivate {
      id
      orgId
      name
      siret
      vatNumber
      address
      naf
      libelleNaf
      userRole
      givenName
      ...AccountFieldCompanyTypesFragment
      ...AccountFieldCompanyGerepIdFragment
      ...AccountFieldCompanyGivenNameFragment
      ...AccountFieldCompanyTransporterReceiptFragment
      ...AccountFieldCompanyTraderReceiptFragment
      ...AccountFieldCompanyBrokerReceiptFragment
      ...AccountFieldCompanyVerificationStatusFragment
      ...AccountFieldCompanyVhuAgrementBroyeurFragment
      ...AccountFieldCompanyVhuAgrementDemolisseurFragment
      ...AccountFieldCompanyWorkerCertificationFragment
      installation {
        urlFiche
      }
    }
    ${AccountFieldCompanyTypes.fragments.company}
    ${AccountFieldCompanyGerepId.fragments.company}
    ${AccountFieldCompanyGivenName.fragments.company}
    ${AccountFieldCompanyTransporterReceipt.fragments.company}
    ${AccountFieldCompanyTraderReceipt.fragments.company}
    ${AccountFieldCompanyBrokerReceipt.fragments.company}
    ${AccountFieldCompanyVerificationStatus.fragments.company}
    ${AccountFieldCompanyVhuAgrementBroyeur.fragments.company}
    ${AccountFieldCompanyVhuAgrementDemolisseur.fragments.company}
    ${AccountFieldCompanyWorkerCertification.fragments.company}
  `
};

type Props = { company: CompanyPrivate };

export default function AccountInfoAutoUpdate({ company }: Props) {
  const UPDATE_COMPANY_NAME_ADRESS = gql`
    mutation UpdateCompany($id: String!) {
      updateCompany(id: $id) {
        ...AccountInfoAutoUpdateFragment
      }
    }
    ${AccountInfoAutoUpdate.fragments.company}
  `;

  const [update, { loading, error }] = useMutation<
    Pick<Mutation, "updateCompany">,
    MutationUpdateCompanyArgs
  >(UPDATE_COMPANY_NAME_ADRESS, { variables: { id: company.id } });

  return (
    <>
      <button
        onClick={() => update()}
        className="btn btn--primary"
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Requête en cours..."
          : isSiret(
              company.siret!,
              import.meta.env.VITE_ALLOW_TEST_COMPANY === "true"
            )
          ? "Synchroniser avec l'INSEE"
          : "Synchroniser avec le registre européen"}
      </button>
      {error && <NotificationError apolloError={error} />}
    </>
  );
}
