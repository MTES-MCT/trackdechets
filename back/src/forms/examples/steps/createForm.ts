import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createForm(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `Les informations du BSDD sont remplies. Cette action peut être effectuée
  par n'importe quel établissement apparaissant sur le BSDD. À ce stade il est toujours possible
  d'effectuer des modifications grâce à la mutation updateForm.`,
    mutation: mutations.createForm,
    variables: ({ producteur, transporteur, traiteur }) => ({
      createFormInput: {
        emitter: fixtures.emitterInput(producteur.siret),
        recipient: fixtures.recipientInput(traiteur.siret),
        transporter: fixtures.transporterInput(
          transporteur.siret?.length
            ? transporteur.siret
            : transporteur.vatNumber
        ),
        wasteDetails: fixtures.wasteDetailsInput
      }
    }),
    expected: { status: "DRAFT" },
    data: response => response.createForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}

export function createFormMultiModal(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    variables: ({ transporteur1, producteur, traiteur }) =>
      createForm(company, fixtures).variables({
        transporteur: transporteur1,
        producteur,
        traiteur
      })
  };
}

export function createFormWithTransporters(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    description:
      "Crée un bordereau en associant une liste de transporteurs dans un ordre donné",
    variables: ({ producteur, traiteur, formTransporters }) => ({
      createFormInput: {
        emitter: fixtures.emitterInput(producteur.siret),
        recipient: fixtures.recipientInput(traiteur.siret),
        wasteDetails: fixtures.wasteDetailsInput,
        transporters: formTransporters
      }
    })
  };
}

/** Creates a form that will be grouped */
export function createInitialForm(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    variables: ({ producteur, transporteur, ttr }) => ({
      createFormInput: {
        emitter: fixtures.emitterInput(producteur.siret),
        recipient: fixtures.ttrInput(ttr.siret),
        transporter: fixtures.transporterInput(
          transporteur.siret?.length
            ? transporteur.siret
            : transporteur.vatNumber
        ),
        wasteDetails: fixtures.wasteDetailsInput
      }
    })
  };
}

export function createGroupementForm(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    description:
      "Le BSDD de regroupement est crée en annexant le borderau initial et en affectant la totalité de la quantité disponible" +
      " Pour faire simple dans cet exemple, un seul bordereau initial est annexé mais dans la majorité des cas il y en aura plusieurs." +
      " Pour fractionner le BSDD initial dans plusieurs annexes 2 il est possible de spécificier une quantité inférieure à la quantité disponible." +
      " La quantité restante pourra être utilisée dans d'autres annexes 2." +
      " Le bordereau initial passera de l'état AWAITING_GROUP à l'état GROUPED lorsque tous ses bordereaux de regroupement seront SEALED." +
      " Le bordereau initial passera de l'état GROUPED à l'état PROCESSED lorsque tous ses bordereaux de regroupement seront PROCESSED",
    variables: ({ transporteur2, ttr, traiteur, initialBsd }) => {
      return {
        createFormInput: {
          emitter: {
            type: "APPENDIX2",
            company: fixtures.ttrCompanyInput(ttr.siret)
          },
          recipient: fixtures.recipientInput(traiteur.siret),
          transporter: fixtures.transporterInput(
            transporteur2.siret?.length
              ? transporteur2.siret
              : transporteur2.vatNumber
          ),
          wasteDetails: fixtures.wasteDetailsInput,
          grouping: [
            {
              form: { id: initialBsd.id },
              quantity: initialBsd.quantityReceived
            }
          ]
        }
      };
    }
  };
}

export function createFormTempStorage(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    variables: ({ producteur, ttr, transporteur1, traiteur }) => ({
      createFormInput: {
        emitter: fixtures.emitterInput(producteur.siret),
        recipient: fixtures.recipientIsTempStorageInput(ttr.siret),
        transporter: fixtures.transporterInput(
          transporteur1.siret?.length
            ? transporteur1.siret
            : transporteur1.vatNumber
        ),
        wasteDetails: fixtures.wasteDetailsInput,
        temporaryStorageDetail: {
          destination: fixtures.recipientInput(traiteur.siret)
        }
      }
    })
  };
}

export function createAppendix1Form(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    description: `Le BSD chapeau est un bordereau simplifié, qui précise un émetteur, un transporteur, un destinataire et des informations de base sur le déchet (code et dénomination).
    A noter que tous les codes déchets ne sont pas éligibles à bordereau chapeau.`,
    variables: ({ collecteur, traiteur }) => {
      return {
        createFormInput: {
          emitter: {
            type: "APPENDIX1",
            company: fixtures.emitterCompanyInput(collecteur.siret)
          },
          recipient: fixtures.recipientInput(traiteur.siret),
          transporter: fixtures.transporterInput(collecteur.siret),
          wasteDetails: {
            code: "13 05 02*",
            isSubjectToADR: false,
            onuCode: null,
            name: "Huiles",
            consistence: "LIQUID"
          }
        }
      };
    },
    setContext: (ctx, data) => ({
      ...ctx,
      bsd: data,
      chapeau: data
    })
  };
}

export function createAppendix1ProducerForm(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createForm(company),
    description: `On crée un bordereau d'annexe 1 en précisant uniquement l'émetteur et le type de bordereau.
    Lors du rattachement au chapeau, les autres informations seront automatiquement renseignées: destinataire et code déchet notamment.`,
    variables: ({ producteur }) => {
      return {
        createFormInput: {
          emitter: {
            type: "APPENDIX1_PRODUCER",
            company: fixtures.emitterCompanyInput(producteur.siret)
          },
          wasteDetails: {
            packagingInfos: [{ type: "CITERNE", quantity: 1 }],
            quantity: 1
          }
        }
      };
    },
    setContext: (ctx, data) => ({
      ...ctx,
      bsd: data,
      appendix1Items: [data]
    })
  };
}
