import { gql } from "apollo-server-express";

export const companyFragment = gql`
  fragment CompanyFragment on FormCompany {
    name
    siret
    address
    contact
    country
    phone
    mail
  }
`;

export const initialBsdasriFragment = gql`
  fragment InitialBsdasriFragment on InitialBsdasri {
    id
    quantity
    volume
    weight
    takenOverAt
    postalCode
  }
`;
export const fullBsdasriFragment = gql`
  ${companyFragment}

  fragment FullBsdasriFragment on Bsdasri {
    id
    isDraft
    status
    type
    createdAt
    updatedAt
    waste {
      code
      adr
    }
    emitter {
      company {
        ...CompanyFragment
      }
      pickupSite {
        name
        address
        postalCode
        infos
      }
      emission {
        packagingInfos {
          type
          other
          quantity
          volume
        }
        weight {
          value
          isEstimate
        }
        signature {
          author
          date
        }
      }
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }
      transport {
        handedOverAt
        takenOverAt

        volume
        weight {
          value
          isEstimate
        }
        packagingInfos {
          type
          other
          quantity
          volume
        }

        wasteAcceptation {
          status
          refusalReason

          refusedWeight
        }
        signature {
          author
          date
        }
      }
    }
    destination {
      company {
        ...CompanyFragment
      }
      reception {
        date
        volume
        wasteAcceptation {
          status
          refusalReason
          refusedWeight
        }
        signature {
          author
          date
        }
      }
      operation {
        date
        code
        signature {
          author
          date
        }
      }
    }
  }
`;
export const fullGroupingBsdasriFragment = gql`
  ${fullBsdasriFragment}
  ${initialBsdasriFragment}

  fragment FullGroupingBsdasriFragment on Bsdasri {
    ...FullBsdasriFragment
    grouping {
      ...InitialBsdasriFragment
    }
  }
`;
