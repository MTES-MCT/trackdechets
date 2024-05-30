import { gql } from "@apollo/client";
import { dashboardCompanyFragment, companyFragment } from "./company";

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention sub resolvers which
// might make unwanted db queries
export const dashboardBspaohFragment = gql`
  fragment DashboardBspaohFragment on Bspaoh {
    id
    bspaohStatus: status
    isDraft
    bspaohWaste: waste {
      code
      type
    }
    emitter {
      company {
        ...DashboardCompanyFragment
      }
      pickupSite {
        name
      }
    }

    transporter {
      company {
        ...DashboardCompanyFragment
      }
      customInfo
      transport {
        plates
        mode
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
    }
    destination {
      company {
        ...DashboardCompanyFragment
      }
      handedOverToDestination {
        signature {
          author
        }
      }
      reception {
        detail {
          receivedWeight {
            value
          }
          refusedWeight {
            value
          }
          acceptedWeight {
            value
          }
        }
      }
      operation {
        code
      }
    }
  }
  ${dashboardCompanyFragment}
`;

const metadataFragment = gql`
  fragment MetadataFragment on Bspaoh {
    metadata {
      errors {
        message
        path
        requiredFor
      }
      fields {
        sealed {
          name
        }
      }
    }
  }
`;

export const fullBspaohFragment = gql`
  fragment BspaohFragment on Bspaoh {
    createdAt
    updatedAt
    id
    bspaohStatus: status
    isDraft
    waste {
      code
      adr
      type
      packagings {
        id
        type
        volume
        containerNumber
        identificationCodes
        consistence
        quantity
        acceptation
      }
    }
    emitter {
      company {
        ...CompanyFragment
      }
      pickupSite {
        name
        address
        postalCode
        city
      }
      customInfo
      emission {
        detail {
          quantity
          weight {
            value
            isEstimate
          }
        }
        signature {
          date
          author
        }
      }
    }

    transporter {
      company {
        ...CompanyFragment
      }
      customInfo
      transport {
        plates
      }
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        mode
        plates
        takenOverAt
        signature {
          date
          author
        }
      }
    }
    destination {
      company {
        ...CompanyFragment
      }
      customInfo
      cap
      handedOverToDestination {
        date
        signature {
          date
          author
        }
      }
      reception {
        detail {
          quantity

          receivedWeight {
            value
          }
          refusedWeight {
            value
          }
          acceptedWeight {
            value
          }
        }
        acceptation {
          status
          refusalReason
        }
        signature {
          date
          author
        }
      }
      operation {
        code
        date
        signature {
          date
          author
        }
      }
    }
    ...MetadataFragment
  }
  ${companyFragment}
  ${metadataFragment}
`;
