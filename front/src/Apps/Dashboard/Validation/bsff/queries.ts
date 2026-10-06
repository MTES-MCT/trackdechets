import gql from "graphql-tag";
import { companyFragment } from "../../../common/queries/fragments/company";

const bsffPackagingFragment = gql`
  fragment BsffPackagingFragment on BsffPackaging {
    id
    bsffId
    type
    numero
    weight

    detenteurs {
      isPrivateIndividual
      company {
        ...CompanyFragment
      }
    }

    acceptation {
      date
      status
      weight
      wasteCode
      wasteDescription
      refusalReason
      signature {
        date
      }
    }

    operation {
      date
      code
      mode
      description
      noTraceability
      nextDestination {
        plannedOperationCode
        cap
        company {
          siret
        }
      }
      signature {
        date
      }
    }

    bsff {
      id
      status
      waste {
        code
        description
      }
      weight {
        value
      }
      destination {
        plannedOperationCode
      }
      packagings {
        id
      }
    }

    nextBsff {
      id
    }
  }
`;

export const GET_BSFF = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      id
      status
      waste {
        code
        description
      }
      weight {
        value
        isEstimate
      }
      packagings {
        ...BsffPackagingFragment
      }
    }
  }
  ${bsffPackagingFragment}
  ${companyFragment}
`;

export const GET_BSFF_PACKAGING = gql`
  query BsffPackaging($id: ID!) {
    bsffPackaging(id: $id) {
      ...BsffPackagingFragment
    }
  }
  ${bsffPackagingFragment}
  ${companyFragment}
`;

export const UPDATE_BSFF_PACKAGING = gql`
  mutation UpdateBsffPackaging($id: ID!, $input: UpdateBsffPackagingInput!) {
    updateBsffPackaging(id: $id, input: $input) {
      ...BsffPackagingFragment
    }
  }
  ${bsffPackagingFragment}
  ${companyFragment}
`;
export const bsffPackagingForReconditioningFragment = gql`
  fragment BsffPackagingForReconditioningFragment on BsffPackaging {
    ...BsffPackagingFragment
    volume
    bsff {
      emitter {
        company {
          name
          siret
          orgId
          address
          contact
          phone
          mail
        }
      }
      ficheInterventions {
        id
        numero
        detenteur {
          isPrivateIndividual
          company {
            name
            siret
            orgId
            vatNumber
            address
            contact
            phone
            mail
          }
        }
      }
    }
  }
  ${bsffPackagingFragment}
  ${companyFragment}
`;
