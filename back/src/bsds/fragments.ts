import { gql } from "apollo-server-express";

export const fullBsdFragment = gql`
  fragment FullBsdFragment on CommonBsd {
    id
    readableId
    status
    isDraft
    type
    emitter {
      company {
        name
        siret
      }
    }
    destination {
      company {
        name
        siret
      }
    }
    waste {
      code
      description
    }

    transporter {
      company {
        name
        siret
      }
      numberPlate
      customInfo
    }
    bsda {
      type

      worker {
        company {
          siret
          name
        }
      }
    }

    bsdasri {
      type
      groupingCount
      emitterAllowDirectTakeOver
    }
    bsdd {
      currentTransporterSiret
      nextTransporterSiret
      lastSegment {
        id
        takenOver
        readyToTakeOver
        previousTransporterCompanySiret
      }
      temporaryStorage {
        recipientIsTempStorage
        transporterCompanySiret
        destinationCompanySiret
      }
    }
  }
`;
// export const fullBsdFragment = gql`
//   fragment FullBsdFragment on CommonBsd {
//     id

//   }
// `;
