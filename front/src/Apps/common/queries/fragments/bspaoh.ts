import { gql } from "@apollo/client";
import { dashboardCompanyFragment } from "./company";

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
      reception {
        detail {
          weight {
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
        ...DashboardCompanyFragment
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
        ...DashboardCompanyFragment
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
        ...DashboardCompanyFragment
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

          weight {
            value
            isEstimate
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
  }
  ${dashboardCompanyFragment}
`;
