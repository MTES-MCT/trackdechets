import { gql } from "@apollo/client";
import { companyFragment } from "./company";

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention to sub resolvers which
// might make unwanted db queries
export const dashboardBsffFragment = gql`
  fragment DashboardBsffFragment on Bsff {
    id
    isDraft
    bsffStatus: status
    bsffEmitter: emitter {
      company {
        siret
        name
      }
    }
    bsffTransporter: transporter {
      company {
        siret
        name
      }
      transport {
        plates
      }
      customInfo
    }
    bsffDestination: destination {
      company {
        siret
        name
      }
    }
    waste {
      code
      description
    }
    packagings {
      numero
    }
  }
`;

export const FicheInterventionFragment = gql`
  fragment FicheInterventionFragment on BsffFicheIntervention {
    id
    numero
    weight
    postalCode
  }
`;

export const FullBsffFragment = gql`
  fragment FullBsff on Bsff {
    id
    type
    status
    isDraft
    emitter {
      company {
        ...CompanyFragment
      }
      emission {
        signature {
          author
          date
        }
      }
    }
    packagings {
      id
      name
      numero
      volume
      weight
      acceptation {
        date
        status
        signature {
          date
        }
      }
      operation {
        code
        noTraceability
        date
        signature {
          date
        }
      }
    }
    waste {
      code
      description
      adr
    }
    weight {
      value
      isEstimate
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
        mode
        signature {
          author
          date
        }
        plates
      }
      customInfo
    }
    destination {
      company {
        ...CompanyFragment
      }
      reception {
        date
        signature {
          author
          date
        }
      }
      plannedOperationCode
      cap
    }
    ficheInterventions {
      ...FicheInterventionFragment
    }
    forwarding {
      id
      numero
      weight
      volume
      name
      bsffId
      bsff {
        id
        emitter {
          company {
            name
            siret
          }
        }
        waste {
          code
        }
      }
    }
    repackaging {
      id
      numero
      weight
      volume
      name
      bsffId
      bsff {
        id
        emitter {
          company {
            name
            siret
          }
        }
        waste {
          code
        }
      }
    }
    grouping {
      id
      numero
      weight
      volume
      name
      bsffId
      bsff {
        id
        emitter {
          company {
            name
            siret
          }
        }
        waste {
          code
        }
      }
    }
  }
  ${companyFragment}
  ${FicheInterventionFragment}
`;

export const PreviousBsffPackagingFragment = gql`
  fragment PreviousBsffPackaging on BsffPackaging {
    id
    numero
    weight
    volume
    name
    bsffId
    acceptation {
      wasteCode
      wasteDescription
    }
    bsff {
      id
      emitter {
        company {
          name
          siret
        }
      }
      waste {
        code
        description
      }
    }
    nextBsff {
      id
    }
  }
`;
