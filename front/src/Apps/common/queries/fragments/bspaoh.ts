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
