import gql from "graphql-tag";

const bsffPackagingFragment = gql`
  fragment BsffPackagingFragment on BsffPackaging {
    id
    bsffId
    numero
    weight
    acceptation {
      date
      status
      weight
      wasteCode
      wasteDescription
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
      waste {
        code
        description
      }
    }
  }
`;

export const GET_BSFF_PACKAGING = gql`
  query BsffPackaging($id: ID!) {
    bsffPackaging(id: $id) {
      ...BsffPackagingFragment
    }
  }
  ${bsffPackagingFragment}
`;

export const UPDATE_BSFF_PACKAGING = gql`
  mutation UpdateBsffPackaging($id: ID!, $input: UpdateBsffPackagingInput!) {
    updateBsffPackaging(id: $id, input: $input) {
      id
      ...BsffPackagingFragment
    }
  }
  ${bsffPackagingFragment}
`;
