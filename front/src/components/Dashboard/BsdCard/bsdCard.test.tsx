import React from "react";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import BsdCard from "./BsdCard";
import { Bsda, Bsdasri, Bsff, Bsvhu, Form } from "generated/graphql/types";

describe("Bsd card primary action label", () => {
  const siretEmmiter = "53230142100022";
  const siretTransporter = "13001045700013";
  const functionMock = jest.fn();

  describe("case: INITITAL(draft=true)", () => {
    test("Bsdd", () => {
      const bsdd = {
        id: "cktcnn4ul7181x79soidq7c3i",
        readableId: "BSD-20210909-0FPXX37GW",
        customId: null,
        sentAt: null,
        emittedAt: null,
        emittedBy: null,
        emittedByEcoOrganisme: null,
        takenOverAt: null,
        status: "DRAFT",
        wasteDetails: {
          code: "15 01 11*",
          name: "emballages amiante",
          packagingInfos: [
            {
              type: "GRV",
              other: "",
              quantity: 5,
              __typename: "PackagingInfo",
            },
            {
              type: "AUTRE",
              other: "sac",
              quantity: 2,
              __typename: "PackagingInfo",
            },
          ],
          __typename: "WasteDetails",
        },
        emitter: {
          type: "OTHER",
          isPrivateIndividual: false,
          company: {
            siret: "81232991000010",
            name: "BOULANGERIE AU 148",
            omiNumber: null,
            __typename: "FormCompany",
          },
          isForeignShip: false,
          __typename: "Emitter",
        },
        recipient: {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          isTempStorage: true,
          __typename: "Recipient",
        },
        transporter: {
          company: {
            siret: "13001045700013",
            __typename: "FormCompany",
          },
          numberPlate: null,
          customInfo: null,
          __typename: "Transporter",
        },
        ecoOrganisme: {
          siret: "42248908800035",
          __typename: "FormEcoOrganisme",
        },
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: null,
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          recipient: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          emitter: {
            siret: "81232991000010",
            name: "BOULANGERIE AU 148",
            __typename: "FormCompany",
          },
          __typename: "StateSummary",
        },
        temporaryStorageDetail: {
          destination: {
            company: {
              siret: "53230142100022",
              address: "14 Rue des Marchands 17540 Vérines",
              name: "L'ATELIER DE CELINE",
              contact: "Céline",
              phone: "0145454545",
              mail: "hello@trackdechets.beta.gouv.fr",
              __typename: "FormCompany",
            },
            cap: "CAP2",
            processingOperation: "D 1",
            __typename: "Destination",
          },
          transporter: null,
          wasteDetails: {
            packagingInfos: [
              {
                type: "GRV",
                other: "",
                quantity: 5,
                __typename: "PackagingInfo",
              },
              {
                type: "AUTRE",
                other: "sac",
                quantity: 2,
                __typename: "PackagingInfo",
              },
            ],
            quantity: 19,
            quantityType: "ESTIMATED",
            __typename: "WasteDetails",
          },
          __typename: "TemporaryStorageDetail",
        },
        transportSegments: [],
        currentTransporterSiret: null,
        nextTransporterSiret: null,
        __typename: "Form",
      } as unknown as Form;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsdd}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      expect(screen.getByTestId("bsd-card-btn-primary")).toHaveTextContent(
        "Valider"
      );
    });
    test("other than Bsdd", () => {
      const bsda = {
        id: "BSDA-20220805-WZD4GYBT1",
        bsdaType: "OTHER_COLLECTIONS",
        isDraft: true,
        bsdaStatus: "INITIAL",
        emitter: {
          isPrivateIndividual: true,
          company: {
            name: "Emmanuel Flahaut",
            siret: null,
            __typename: "FormCompany",
          },
          __typename: "BsdaEmitter",
        },
        destination: {
          company: {
            name: "L'ATELIER DE CELINE",
            siret: "53230142100022",
            __typename: "FormCompany",
          },
          __typename: "BsdaDestination",
        },
        worker: {
          isDisabled: false,
          company: {
            name: "L'ATELIER DE CELINE",
            siret: "53230142100022",
            __typename: "FormCompany",
          },
          __typename: "BsdaWorker",
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany",
          },
          customInfo: null,
          transport: {
            plates: [],
            __typename: "BsdaTransport",
          },
          __typename: "BsdaTransporter",
        },
        waste: {
          materialName: "amiante",
          bsdaCode: "08 01 17*",
          __typename: "BsdaWaste",
        },
        forwardedIn: null,
        groupedIn: null,
        __typename: "Bsda",
      } as unknown as Bsda;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsda}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      expect(screen.getByTestId("bsd-card-btn-primary")).toHaveTextContent(
        "Publier"
      );
    });
  });

  describe("case: INITITAL(draft=false)", () => {
    const bsvhu = {
      id: "VHU-20210805-5C03D3KCT",
      bsvhuStatus: "INITIAL",
      isDraft: false,
      emitter: {
        agrementNumber: "123",
        company: {
          name: "L'ATELIER DE CELINE",
          orgId: "53230142100022",
          siret: "53230142100022",
          vatNumber: null,
          omiNumber: null,
          __typename: "FormCompany",
        },
        __typename: "BsvhuEmitter",
      },
      transporter: {
        company: {
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          orgId: "13001045700013",
          siret: "13001045700013",
          vatNumber: "",
          omiNumber: null,
          __typename: "FormCompany",
        },
        __typename: "BsvhuTransporter",
      },
      destination: {
        type: "DEMOLISSEUR",
        company: {
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          orgId: "13001045700013",
          siret: "13001045700013",
          vatNumber: null,
          omiNumber: null,
          __typename: "FormCompany",
        },
        __typename: "BsvhuDestination",
      },
      wasteCode: "16 01 06",
      __typename: "Bsvhu",
    } as unknown as Bsvhu;
    test("Bsvhu same emitter", () => {
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsvhu}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      expect(screen.getByTestId("bsd-card-btn-primary")).toHaveTextContent(
        "Signer"
      );
    });
    test("Bsvhu different emitter", () => {
      const { queryByTestId } = render(
        <BsdCard
          currentSiret={siretTransporter}
          bsd={bsvhu}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      expect(queryByTestId("bsd-card-btn-primary")).toBeFalsy();
    });

    test("Bsff same emitter", () => {
      const bsff = {
        id: "FF-20220831-F7VSQ1FDA",
        isDraft: false,
        bsffStatus: "INITIAL",
        bsffEmitter: {
          company: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany",
          },
          __typename: "BsffEmitter",
        },
        bsffTransporter: {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          transport: {
            plates: [],
            __typename: "BsffTransport",
          },
          customInfo: null,
          __typename: "BsffTransporter",
        },
        bsffDestination: {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          __typename: "BsffDestination",
        },
        waste: {
          code: "14 06 01*",
          description: "DÉNO",
          __typename: "BsffWaste",
        },
        packagings: [
          {
            numero: "888",
            __typename: "BsffPackaging",
          },
          {
            numero: "889",
            __typename: "BsffPackaging",
          },
          {
            numero: "34",
            __typename: "BsffPackaging",
          },
        ],
        __typename: "Bsff",
      } as unknown as Bsff;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsff}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      const { getByText } = within(screen.getByTestId("bsd-card-btn-primary"));
      expect(getByText("Signer")).toBeInTheDocument();
    });

    test("Bsda same emmiter", () => {
      const bsda = {
        id: "BSDA-20220706-NAS1E8MET",
        bsdaType: "RESHIPMENT",
        isDraft: false,
        bsdaStatus: "INITIAL",
        emitter: {
          isPrivateIndividual: false,
          company: {
            name: "L'ATELIER DE CELINE",
            siret: "53230142100022",
            __typename: "FormCompany",
          },
          __typename: "BsdaEmitter",
        },
        destination: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany",
          },
          __typename: "BsdaDestination",
        },
        worker: {
          isDisabled: false,
          company: null,
          __typename: "BsdaWorker",
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany",
          },
          customInfo: null,
          transport: {
            plates: [],
            __typename: "BsdaTransport",
          },
          __typename: "BsdaTransporter",
        },
        waste: {
          materialName: "qsdoo",
          bsdaCode: "08 01 17*",
          __typename: "BsdaWaste",
        },
        forwardedIn: null,
        groupedIn: null,
        __typename: "Bsda",
      } as unknown as Bsda;

      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsda}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      const { getByText } = within(screen.getByTestId("bsd-card-btn-primary"));
      expect(getByText("Signer en tant qu'émetteur")).toBeInTheDocument();
    });

    // TODO bsdasri eco org / bsdari transporter /bsdari emmiter | bsda Collection_2710 / bsda isPrivateIndividual && worker isDisabled
  });

  describe("case: SEALED", () => {
    test("Bsdd same emmiter", () => {
      const bsdd = {
        id: "cl6aspea41164399s1y46n2h9",
        readableId: "BSD-20220801-PGFCKB28G",
        customId: "",
        sentAt: null,
        emittedAt: null,
        emittedBy: null,
        emittedByEcoOrganisme: null,
        takenOverAt: null,
        status: "SEALED",
        wasteDetails: {
          code: "17 05 03*",
          name: "terre en vue",
          packagingInfos: [
            {
              type: "GRV",
              other: "",
              quantity: 50,
              __typename: "PackagingInfo",
            },
          ],
          __typename: "WasteDetails",
        },
        emitter: {
          type: "APPENDIX2",
          isPrivateIndividual: false,
          company: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            omiNumber: "",
            __typename: "FormCompany",
          },
          isForeignShip: false,
          __typename: "Emitter",
        },
        recipient: {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          isTempStorage: false,
          __typename: "Recipient",
        },
        transporter: {
          company: {
            siret: "13001045700013",
            __typename: "FormCompany",
          },
          numberPlate: "",
          customInfo: null,
          __typename: "Transporter",
        },
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: "",
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          recipient: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          emitter: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany",
          },
          __typename: "StateSummary",
        },
        temporaryStorageDetail: null,
        transportSegments: [],
        currentTransporterSiret: null,
        nextTransporterSiret: null,
        __typename: "Form",
      } as unknown as Form;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsdd}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      const { getByText } = within(screen.getByTestId("bsd-card-btn-primary"));
      expect(getByText("Signer en tant qu'émetteur")).toBeInTheDocument();
    });
    // TODO bsvhu
  });

  describe("case: SENT", () => {
    test("Bsdd sans entreposage provisoire", () => {
      const bsdd = {
        id: "ckou9ctpn073534ozmk0mreuu",
        readableId: "BSD-20210518-DRX5BG957",
        customId: null,
        sentAt: "2021-07-09T08:50:17.494Z",
        emittedAt: "2021-07-09T08:50:17.494Z",
        emittedBy: "EF",
        emittedByEcoOrganisme: false,
        takenOverAt: "2021-07-09T08:50:17.494Z",
        status: "SENT",
        wasteDetails: {
          code: "16 04 01*",
          name: "Munitions",
          packagingInfos: [
            {
              type: "FUT",
              other: "",
              quantity: 6,
              __typename: "PackagingInfo",
            },
            {
              type: "GRV",
              other: "",
              quantity: 1,
              __typename: "PackagingInfo",
            },
            {
              type: "AUTRE",
              other: "CAISSE 30 litres",
              quantity: 50,
              __typename: "PackagingInfo",
            },
          ],
          __typename: "WasteDetails",
        },
        emitter: {
          type: "PRODUCER",
          isPrivateIndividual: false,
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            omiNumber: null,
            __typename: "FormCompany",
          },
          isForeignShip: false,
          __typename: "Emitter",
        },
        recipient: {
          company: {
            siret: "53230142100022",
            orgId: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany",
          },
          isTempStorage: false,
          __typename: "Recipient",
        },
        transporter: {
          company: {
            siret: "13001045700013",
            orgId: "13001045700013",
            __typename: "FormCompany",
          },
          numberPlate: null,
          customInfo: null,
          __typename: "Transporter",
        },
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: null,
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          recipient: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany",
          },
          emitter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany",
          },
          __typename: "StateSummary",
        },
        temporaryStorageDetail: null,
        transportSegments: [
          {
            id: "ckyef9g3a2924349syhsqc1wa",
            readyToTakeOver: false,
            previousTransporterCompanySiret: "13001045700013",
            takenOverAt: null,
            __typename: "TransportSegment",
          },
        ],
        currentTransporterSiret: "13001045700013",
        nextTransporterSiret: "13001045700013",
        __typename: "Form",
      } as unknown as Form;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsdd}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      const { getByText } = within(screen.getByTestId("bsd-card-btn-primary"));
      expect(getByText("Valider la réception")).toBeInTheDocument();
    });

    test("Bsdasri", () => {
      const bsdari = {
        id: "DASRI-20220603-CFZ337QCS",
        bsdasriStatus: "SENT",
        type: "SIMPLE",
        isDraft: false,
        bsdasriWaste: {
          code: "18 01 03*",
          __typename: "BsdasriWaste",
        },
        emitter: {
          company: {
            name: "BOULANGERIE AU 148",
            orgId: "81232991000010",
            siret: "81232991000010",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany",
          },
          emission: {
            isTakenOverWithoutEmitterSignature: false,
            isTakenOverWithSecretCode: false,
            __typename: "BsdasriEmission",
          },
          __typename: "BsdasriEmitter",
        },
        ecoOrganisme: {
          siret: "79250555400032",
          emittedByEcoOrganisme: true,
          __typename: "BsdasriEcoOrganisme",
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            orgId: "13001045700013",
            siret: "13001045700013",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany",
          },
          customInfo: "houlalalal",
          transport: {
            plates: ["obligé"],
            __typename: "BsdasriTransport",
          },
          __typename: "BsdasriTransporter",
        },
        destination: {
          company: {
            name: "L'ATELIER DE CELINE",
            orgId: "53230142100022",
            siret: "53230142100022",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany",
          },
          __typename: "BsdasriDestination",
        },
        grouping: [],
        synthesizing: [],
        createdAt: "2022-06-03T07:12:29.490Z",
        updatedAt: "2022-06-03T07:16:40.015Z",
        allowDirectTakeOver: false,
        synthesizedIn: {
          id: "DASRI-20220603-V61NMBREF",
          __typename: "Bsdasri",
        },
        __typename: "Bsdasri",
      } as unknown as Bsdasri;
      render(
        <BsdCard
          currentSiret={siretEmmiter}
          bsd={bsdari}
          onValidate={functionMock}
          onDelete={functionMock}
          onDuplicate={functionMock}
          onUpdate={functionMock}
          onPdf={functionMock}
          onOverview={functionMock}
        />
      );
      const { getByText } = within(screen.getByTestId("bsd-card-btn-primary"));
      expect(getByText("Signer la réception")).toBeInTheDocument();
    });

    // TODO bsvhu
  });

  // TODO received signByProducer Accepted
});
