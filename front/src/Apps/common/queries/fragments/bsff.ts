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
        orgId
        name
      }
    }
    bsffTransporter: transporter {
      company {
        siret
        orgId
        name
      }
      transport {
        plates
        mode
      }
      customInfo
    }
    transporters {
      id
      company {
        name
        siret
        orgId
      }
      customInfo
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        plates
        mode
        signature {
          date
        }
      }
    }
    bsffDestination: destination {
      company {
        siret
        orgId
        name
      }
      plannedOperationCode
      cap
    }
    waste {
      code
      description
    }
    packagings {
      id
      numero
      operation {
        code
        noTraceability
        signature {
          date
        }
      }
    }
    bsffWeight: weight {
      value
    }
    bsffUpdatedAt: updatedAt
    bsffType: type
  }
`;

export const FicheInterventionFragment = gql`
  fragment FicheInterventionFragment on BsffFicheIntervention {
    id
    numero
    weight
    postalCode
    detenteur {
      isPrivateIndividual
      company {
        name
        siret
        orgId
      }
    }
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
      type
      other
      numero
      volume
      weight
      acceptation {
        date
        status
        refusalReason
        wasteCode
        wasteDescription
        weight
        signature {
          date
          author
        }
      }
      operation {
        code
        mode
        description
        noTraceability
        date
        signature {
          date
          author
        }
        nextDestination {
          plannedOperationCode
          company {
            ...CompanyFragment
          }
        }
      }
      nextBsffs {
        id
        destination {
          company {
            name
            siret
            orgId
          }
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
        isExempted
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
    transporters {
      id
      company {
        ...CompanyFragment
      }
      customInfo
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
            orgId
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
            orgId
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
            orgId
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
    type
    other
    weight
    volume
    bsffId
    acceptation {
      wasteCode
      wasteDescription
      weight
    }
    bsff {
      id
      emitter {
        company {
          name
          siret
          orgId
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
