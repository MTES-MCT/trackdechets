import React from "react";
import { render, screen } from "@testing-library/react";
import { fireEvent, waitFor, within } from "@testing-library/dom";
import BsdCard from "./BsdCard";
import {
  Bsda,
  Bsdasri,
  Bsff,
  Bsvhu,
  Form,
  UserPermission
} from "@td/codegen-ui";
import { BsdCurrentTab } from "../../../common/types/commonTypes";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import { PermissionsProvider } from "../../../../common/contexts/PermissionsContext";

describe("Bsd card primary action label", () => {
  const siretEmmiter = "53230142100022";
  const siretTransporter = "13001045700013";
  const functionMock = jest.fn();
  const bsdCurrentTab: BsdCurrentTab = "draftTab";
  const mocks = [];
  const route = "/dashboard/12345678901235";

  describe("case: INITITAL(draft=true)", () => {
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
            __typename: "PackagingInfo"
          },
          {
            type: "AUTRE",
            other: "sac",
            quantity: 2,
            __typename: "PackagingInfo"
          }
        ],
        __typename: "WasteDetails"
      },
      emitter: {
        type: "OTHER",
        isPrivateIndividual: false,
        company: {
          siret: "81232991000010",
          name: "BOULANGERIE AU 148",
          omiNumber: null,
          __typename: "FormCompany"
        },
        isForeignShip: false,
        __typename: "Emitter"
      },
      recipient: {
        company: {
          siret: "13001045700013",
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          __typename: "FormCompany"
        },
        isTempStorage: true,
        __typename: "Recipient"
      },
      transporter: {
        company: {
          siret: "13001045700013",
          __typename: "FormCompany"
        },
        numberPlate: null,
        customInfo: null,
        __typename: "Transporter"
      },
      ecoOrganisme: {
        siret: "42248908800035",
        __typename: "FormEcoOrganisme"
      },
      stateSummary: {
        transporterCustomInfo: null,
        transporterNumberPlate: null,
        transporter: {
          siret: "13001045700013",
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          __typename: "FormCompany"
        },
        recipient: {
          siret: "13001045700013",
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          __typename: "FormCompany"
        },
        emitter: {
          siret: "81232991000010",
          name: "BOULANGERIE AU 148",
          __typename: "FormCompany"
        },
        __typename: "StateSummary"
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
            __typename: "FormCompany"
          },
          cap: "CAP2",
          processingOperation: "D 1",
          __typename: "Destination"
        },
        transporter: null,
        wasteDetails: {
          packagingInfos: [
            {
              type: "GRV",
              other: "",
              quantity: 5,
              __typename: "PackagingInfo"
            },
            {
              type: "AUTRE",
              other: "sac",
              quantity: 2,
              __typename: "PackagingInfo"
            }
          ],
          quantity: 19,
          quantityType: "ESTIMATED",
          __typename: "WasteDetails"
        },
        __typename: "TemporaryStorageDetail"
      },
      currentTransporterSiret: null,
      nextTransporterSiret: null,
      __typename: "Form"
    } as unknown as Form;

    test("Bsdd", async () => {
      const onValidate = functionMock;

      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[
            UserPermission.BsdCanUpdate,
            UserPermission.BsdCanDelete,
            UserPermission.BsdCanCreate
          ]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                currentSiret={siretEmmiter}
                posInSet={0}
                setSize={1}
                bsd={bsdd}
                onValidate={onValidate}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const primaryActionBtn = screen.getByTestId(
        `bsd-card-btn-primary-${bsdd.readableId}`
      );
      expect(
        screen.getByTestId(`bsd-card-btn-primary-${bsdd.readableId}`)
      ).toHaveTextContent("Publier");
      fireEvent.click(primaryActionBtn);
      await waitFor(() => expect(onValidate).toHaveBeenCalled());

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);
      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-delete-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-review-btn")).toBeFalsy();
      expect(screen.getByTestId("bsd-duplicate-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-update-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-pdf-btn")).toBeFalsy();
    });

    test("Bsdd emitterType appendix1_producer", async () => {
      const onValidate = functionMock;

      const { queryByTestId } = render(
        <PermissionsProvider defaultPermissions={[UserPermission.BsdCanList]}>
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={
                  { ...bsdd, emitter: { type: "APPENDIX1_PRODUCER" } } as Form
                }
                onValidate={onValidate}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);
      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-delete-btn")).toBeFalsy();
      expect(queryByTestId("bsd-review-btn")).toBeFalsy();
      expect(queryByTestId("bsd-duplicate-btn")).toBeFalsy();
      expect(queryByTestId("bsd-update-btn")).toBeFalsy();
      expect(queryByTestId("bsd-pdf-btn")).toBeFalsy();
    });

    test("other than Bsdd (bsda example)", async () => {
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
            __typename: "FormCompany"
          },
          __typename: "BsdaEmitter"
        },
        destination: {
          company: {
            name: "L'ATELIER DE CELINE",
            siret: "53230142100022",
            __typename: "FormCompany"
          },
          __typename: "BsdaDestination"
        },
        worker: {
          isDisabled: false,
          company: {
            name: "L'ATELIER DE CELINE",
            siret: "53230142100022",
            __typename: "FormCompany"
          },
          __typename: "BsdaWorker"
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany"
          },
          customInfo: null,
          transport: {
            plates: [],
            __typename: "BsdaTransport"
          },
          __typename: "BsdaTransporter"
        },
        waste: {
          materialName: "amiante",
          bsdaCode: "08 01 17*",
          __typename: "BsdaWaste"
        },
        forwardedIn: null,
        groupedIn: null,
        __typename: "Bsda"
      } as unknown as Bsda;
      const onValidate = functionMock;
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[
            UserPermission.BsdCanSignEmission,
            UserPermission.BsdCanDelete,
            UserPermission.BsdCanUpdate,
            UserPermission.BsdCanCreate
          ]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsda}
                onValidate={onValidate}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const primaryActionBtn = screen.getByTestId(
        `bsd-card-btn-primary-${bsda.id}`
      );
      expect(primaryActionBtn).toHaveTextContent("Publier");
      fireEvent.click(primaryActionBtn);
      await waitFor(() => expect(onValidate).toHaveBeenCalled());

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);
      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-delete-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-review-btn")).toBeFalsy();
      expect(screen.getByTestId("bsd-duplicate-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-update-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-pdf-btn")).toBeFalsy();
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
          __typename: "FormCompany"
        },
        __typename: "BsvhuEmitter"
      },
      transporter: {
        company: {
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          orgId: "13001045700013",
          siret: "13001045700013",
          vatNumber: "",
          omiNumber: null,
          __typename: "FormCompany"
        },
        __typename: "BsvhuTransporter"
      },
      destination: {
        type: "DEMOLISSEUR",
        company: {
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          orgId: "13001045700013",
          siret: "13001045700013",
          vatNumber: null,
          omiNumber: null,
          __typename: "FormCompany"
        },
        __typename: "BsvhuDestination"
      },
      wasteCode: "16 01 06",
      __typename: "Bsvhu"
    } as unknown as Bsvhu;

    const bsvhuProcessed = { ...bsvhu, bsvhuStatus: "PROCESSED" };

    const bsff = {
      id: "FF-20220831-F7VSQ1FDA",
      isDraft: false,
      bsffStatus: "INITIAL",
      bsffEmitter: {
        company: {
          siret: "53230142100022",
          name: "L'ATELIER DE CELINE",
          __typename: "FormCompany"
        },
        __typename: "BsffEmitter"
      },
      bsffTransporter: {
        company: {
          siret: "13001045700013",
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          __typename: "FormCompany"
        },
        transport: {
          plates: [],
          __typename: "BsffTransport"
        },
        customInfo: null,
        __typename: "BsffTransporter"
      },
      transporters: [
        {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          transport: {
            plates: [],
            __typename: "BsffTransport"
          },
          customInfo: null,
          __typename: "BsffTransporter"
        }
      ],
      bsffDestination: {
        company: {
          siret: "13001045700013",
          name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
          __typename: "FormCompany"
        },
        __typename: "BsffDestination"
      },
      waste: {
        code: "14 06 01*",
        description: "DÉNO",
        __typename: "BsffWaste"
      },
      packagings: [
        {
          numero: "888",
          __typename: "BsffPackaging"
        },
        {
          numero: "889",
          __typename: "BsffPackaging"
        },
        {
          numero: "34",
          __typename: "BsffPackaging"
        }
      ],
      __typename: "Bsff"
    } as unknown as Bsff;

    const bsffDifferentSiret = {
      ...bsff,
      bsffDestination: { company: { siret: "53230142100025" } },
      bsffEmitter: { company: { siret: "53230142100028" } },
      bsffTransporter: { company: { siret: "53230142100128" } }
    };

    test("Bsvhu same siret", async () => {
      const onValidate = functionMock;
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[
            UserPermission.BsdCanUpdate,
            UserPermission.BsdCanDelete,
            UserPermission.BsdCanRead,
            UserPermission.BsdCanSignEmission,
            UserPermission.BsdCanCreate
          ]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsvhu}
                onValidate={onValidate}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
                bsdCurrentTab="actTab"
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const primaryActionBtn = screen.getByTestId(
        `bsd-card-btn-primary-${bsvhu.id}`
      );
      expect(primaryActionBtn).toHaveTextContent("Signer");
      fireEvent.click(primaryActionBtn);
      await waitFor(() => expect(onValidate).toHaveBeenCalled());

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);
      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-delete-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-review-btn")).toBeFalsy();
      expect(screen.getByTestId("bsd-duplicate-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-update-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-pdf-btn")).toBeInTheDocument();
    });

    test("Bsvhu same siret (status processed)", () => {
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignOperation]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsvhuProcessed}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);
      expect(queryByTestId("bsd-update-btn")).toBeFalsy();
    });

    test("Bsvhu different siret", () => {
      const { queryByTestId } = render(
        <PermissionsProvider defaultPermissions={[]}>
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretTransporter}
                bsd={bsvhu}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      expect(queryByTestId(`bsd-card-btn-primary-${bsvhu.id}`)).toBeFalsy();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
    });

    test("Bsff same siret", async () => {
      const onValidate = functionMock;
      render(
        <PermissionsProvider
          defaultPermissions={[
            UserPermission.BsdCanSignEmission,
            UserPermission.BsdCanRead,
            UserPermission.BsdCanDelete,
            UserPermission.BsdCanCreate,
            UserPermission.BsdCanUpdate
          ]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsff}
                bsdCurrentTab="actTab"
                onValidate={onValidate}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      const primaryActionBtn = screen.getByTestId(
        `bsd-card-btn-primary-${bsff.id}`
      );
      const { getByText } = within(primaryActionBtn);
      expect(getByText("Signer")).toBeInTheDocument();

      fireEvent.click(primaryActionBtn);
      await waitFor(() => expect(onValidate).toHaveBeenCalled());

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);

      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-delete-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-duplicate-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-update-btn")).toBeInTheDocument();
      expect(screen.getByTestId("bsd-pdf-btn")).toBeInTheDocument();
    });

    test("Bsff different siret", () => {
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[
            UserPermission.BsdCanSignEmission,
            UserPermission.BsdCanRead
          ]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsffDifferentSiret}
                bsdCurrentTab={bsdCurrentTab}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      expect(
        queryByTestId(`bsd-card-btn-primary-${bsffDifferentSiret.id}`)
      ).toBeFalsy();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      fireEvent.click(buttonActions);

      expect(screen.getByTestId("bsd-overview-btn")).toBeInTheDocument();
      expect(queryByTestId("bsd-delete-btn")).toBeFalsy();

      expect(queryByTestId("bsd-duplicate-btn")).toBeFalsy();
      expect(queryByTestId("bsd-update-btn")).toBeFalsy();
      expect(screen.getByTestId("bsd-pdf-btn")).toBeInTheDocument();
    });

    test("Bsda same siret", () => {
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
            __typename: "FormCompany"
          },
          __typename: "BsdaEmitter"
        },
        destination: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany"
          },
          __typename: "BsdaDestination"
        },
        worker: {
          isDisabled: false,
          company: null,
          __typename: "BsdaWorker"
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            siret: "13001045700013",
            __typename: "FormCompany"
          },
          customInfo: null,
          transport: {
            plates: [],
            __typename: "BsdaTransport"
          },
          __typename: "BsdaTransporter"
        },
        waste: {
          materialName: "qsdoo",
          bsdaCode: "08 01 17*",
          __typename: "BsdaWaste"
        },
        forwardedIn: null,
        groupedIn: null,
        __typename: "Bsda"
      } as unknown as Bsda;

      render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignEmission]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsda}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
                bsdCurrentTab="actTab"
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsda.id}`)
      );
      expect(getByText("Signer")).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
    });
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
              __typename: "PackagingInfo"
            }
          ],
          __typename: "WasteDetails"
        },
        emitter: {
          type: "APPENDIX2",
          isPrivateIndividual: false,
          company: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            omiNumber: "",
            __typename: "FormCompany"
          },
          isForeignShip: false,
          __typename: "Emitter"
        },
        recipient: {
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          isTempStorage: false,
          __typename: "Recipient"
        },
        transporter: {
          company: {
            siret: "13001045700013",
            __typename: "FormCompany"
          },
          numberPlate: "",
          customInfo: null,
          __typename: "Transporter"
        },
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: "",
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          recipient: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          emitter: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          __typename: "StateSummary"
        },
        temporaryStorageDetail: null,
        currentTransporterSiret: null,
        nextTransporterSiret: null,
        __typename: "Form"
      } as unknown as Form;
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignEmission]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdd}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsdd.readableId}`)
      );
      expect(getByText("Signer")).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      expect(queryByTestId("bsd-review-btn")).toBeFalsy();
    });
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
              __typename: "PackagingInfo"
            },
            {
              type: "GRV",
              other: "",
              quantity: 1,
              __typename: "PackagingInfo"
            },
            {
              type: "AUTRE",
              other: "CAISSE 30 litres",
              quantity: 50,
              __typename: "PackagingInfo"
            }
          ],
          __typename: "WasteDetails"
        },
        emitter: {
          type: "PRODUCER",
          isPrivateIndividual: false,
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            omiNumber: null,
            __typename: "FormCompany"
          },
          isForeignShip: false,
          __typename: "Emitter"
        },
        recipient: {
          company: {
            siret: "53230142100022",
            orgId: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          isTempStorage: false,
          __typename: "Recipient"
        },
        transporter: {
          company: {
            siret: "13001045700013",
            orgId: "13001045700013",
            __typename: "FormCompany"
          },
          numberPlate: null,
          customInfo: null,
          __typename: "Transporter"
        },
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: null,
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          recipient: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          emitter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          __typename: "StateSummary"
        },
        temporaryStorageDetail: null,
        currentTransporterSiret: "13001045700013",
        nextTransporterSiret: "13001045700013",
        __typename: "Form"
      } as unknown as Form;
      render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignAcceptation]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdd}
                bsdCurrentTab="actTab"
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsdd.readableId}`)
      );
      expect(getByText("Valider la réception")).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
    });

    test("Bsdd multi-modal - Signature par un transporteur N > 1", () => {
      const siretNextTransporter = "85001946400021";

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
              __typename: "PackagingInfo"
            },
            {
              type: "GRV",
              other: "",
              quantity: 1,
              __typename: "PackagingInfo"
            },
            {
              type: "AUTRE",
              other: "CAISSE 30 litres",
              quantity: 50,
              __typename: "PackagingInfo"
            }
          ],
          __typename: "WasteDetails"
        },
        emitter: {
          type: "PRODUCER",
          isPrivateIndividual: false,
          company: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            omiNumber: null,
            __typename: "FormCompany"
          },
          isForeignShip: false,
          __typename: "Emitter"
        },
        recipient: {
          company: {
            siret: "53230142100022",
            orgId: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          isTempStorage: false,
          __typename: "Recipient"
        },
        transporter: {
          company: {
            siret: "13001045700013",
            orgId: "13001045700013",
            __typename: "FormCompany"
          },
          numberPlate: null,
          customInfo: null,
          __typename: "Transporter"
        },
        transporters: [
          {
            company: {
              orgId: "13001045700013",
              __typename: "FormCompany"
            },
            takenOverAt: "2021-07-09T08:50:17.494Z",
            __typename: "Transporter"
          },
          {
            company: {
              orgId: siretNextTransporter,
              __typename: "FormCompany"
            },
            takenOverAt: null,
            __typename: "Transporter"
          }
        ],
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: null,
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          recipient: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          emitter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          __typename: "StateSummary"
        },
        temporaryStorageDetail: null,
        currentTransporterSiret: "13001045700013",
        nextTransporterSiret: "13001045700013",
        __typename: "Form"
      } as unknown as Form;

      render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignTransport]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretNextTransporter}
                bsd={bsdd}
                bsdCurrentTab="toCollectTab"
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsdd.readableId}`)
      );

      const signerBtn = getByText("Signer");

      expect(signerBtn).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
    });

    test("Bsdasri synthetized in", () => {
      const bsdari = {
        id: "DASRI-20220603-CFZ337QCS",
        bsdasriStatus: "SENT",
        type: "SIMPLE",
        isDraft: false,
        bsdasriWaste: {
          code: "18 01 03*",
          __typename: "BsdasriWaste"
        },
        emitter: {
          company: {
            name: "BOULANGERIE AU 148",
            orgId: "81232991000010",
            siret: "81232991000010",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          emission: {
            isTakenOverWithoutEmitterSignature: false,
            isTakenOverWithSecretCode: false,
            __typename: "BsdasriEmission"
          },
          __typename: "BsdasriEmitter"
        },
        ecoOrganisme: {
          siret: "79250555400032",
          emittedByEcoOrganisme: true,
          __typename: "BsdasriEcoOrganisme"
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            orgId: "13001045700013",
            siret: "13001045700013",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          customInfo: "houlalalal",
          transport: {
            plates: ["obligé"],
            __typename: "BsdasriTransport"
          },
          __typename: "BsdasriTransporter"
        },
        destination: {
          company: {
            name: "L'ATELIER DE CELINE",
            orgId: "53230142100022",
            siret: "53230142100022",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          __typename: "BsdasriDestination"
        },
        grouping: [],
        synthesizing: [],
        createdAt: "2022-06-03T07:12:29.490Z",
        updatedAt: "2022-06-03T07:16:40.015Z",
        allowDirectTakeOver: false,
        synthesizedIn: {
          id: "DASRI-20220603-V61NMBREF",
          __typename: "Bsdasri"
        },
        __typename: "Bsdasri"
      } as unknown as Bsdasri;
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignAcceptation]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdari}
                bsdCurrentTab="actTab"
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      expect(queryByTestId(`bsd-card-btn-primary-${bsdari.id}`)).toBeFalsy();
      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      expect(queryByTestId("bsd-delete-btn")).toBeFalsy();
    });

    test("Bsdasri simple", () => {
      const bsdari = {
        id: "DASRI-20220603-CFZ337QCS",
        bsdasriStatus: "SENT",
        type: "SIMPLE",
        isDraft: false,
        bsdasriWaste: {
          code: "18 01 03*",
          __typename: "BsdasriWaste"
        },
        emitter: {
          company: {
            name: "BOULANGERIE AU 148",
            orgId: "81232991000010",
            siret: "81232991000010",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          emission: {
            isTakenOverWithoutEmitterSignature: false,
            isTakenOverWithSecretCode: false,
            __typename: "BsdasriEmission"
          },
          __typename: "BsdasriEmitter"
        },
        ecoOrganisme: {
          siret: "79250555400032",
          emittedByEcoOrganisme: true,
          __typename: "BsdasriEcoOrganisme"
        },
        transporter: {
          company: {
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            orgId: "13001045700013",
            siret: "13001045700013",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          customInfo: "houlalalal",
          transport: {
            plates: ["obligé"],
            __typename: "BsdasriTransport"
          },
          __typename: "BsdasriTransporter"
        },
        destination: {
          company: {
            name: "L'ATELIER DE CELINE",
            orgId: "53230142100022",
            siret: "53230142100022",
            vatNumber: null,
            omiNumber: null,
            __typename: "FormCompany"
          },
          __typename: "BsdasriDestination"
        },
        grouping: [],
        synthesizing: [],
        createdAt: "2022-06-03T07:12:29.490Z",
        updatedAt: "2022-06-03T07:16:40.015Z",
        allowDirectTakeOver: false,
        __typename: "Bsdasri"
      } as unknown as Bsdasri;
      const { queryByTestId } = render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignAcceptation]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdari}
                bsdCurrentTab="actTab"
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsdari.id}`)
      );
      expect(getByText("Valider la réception")).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      expect(queryByTestId("bsd-delete-btn")).toBeFalsy();
    });
  });

  describe("case: Bsd Suite", () => {
    test("Bsdd", () => {
      const bsdd = {
        id: "cl32r54js30083339sw9nabhn0",
        readableId: "BSD-20220512-6609ESJPV",
        customId: null,
        sentAt: "2022-05-12T08:32:24.592Z",
        emittedAt: "2022-05-12T08:32:12.820Z",
        emittedBy: "producteur",
        emittedByEcoOrganisme: false,
        takenOverAt: "2022-05-12T08:32:24.592Z",
        status: "ACCEPTED",
        wasteDetails: {
          code: "14 06 01*",
          name: "HFC",
          packagingInfos: [
            {
              type: "AUTRE",
              other: "bouteilles",
              quantity: 3,
              __typename: "PackagingInfo"
            }
          ],
          __typename: "WasteDetails"
        },
        emitter: {
          type: "PRODUCER",
          isPrivateIndividual: false,
          company: {
            siret: "81232991000010",
            name: "BOULANGERIE AU 148",
            omiNumber: null,
            __typename: "FormCompany"
          },
          isForeignShip: false,
          __typename: "Emitter"
        },
        recipient: {
          company: {
            siret: "53230142100022",
            orgId: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          isTempStorage: false,
          __typename: "Recipient"
        },
        transporter: {
          company: {
            siret: "13001045700013",
            orgId: "13001045700013",
            __typename: "FormCompany"
          },
          numberPlate: "",
          customInfo: null,
          __typename: "Transporter"
        },
        ecoOrganisme: null,
        stateSummary: {
          transporterCustomInfo: null,
          transporterNumberPlate: "",
          transporter: {
            siret: "13001045700013",
            name: "DIRECTION REGIONALE DE L'ENVIRONNEMENT DE L'AMENAGEMENT ET DU LOGEMENT NOUVELLE-AQUITAINE",
            __typename: "FormCompany"
          },
          recipient: {
            siret: "53230142100022",
            name: "L'ATELIER DE CELINE",
            __typename: "FormCompany"
          },
          emitter: {
            siret: "81232991000010",
            name: "BOULANGERIE AU 148",
            __typename: "FormCompany"
          },
          __typename: "StateSummary"
        },
        temporaryStorageDetail: null,
        currentTransporterSiret: "",
        nextTransporterSiret: null,
        __typename: "Form"
      } as unknown as Form;

      render(
        <PermissionsProvider
          defaultPermissions={[UserPermission.BsdCanSignOperation]}
        >
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdd}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );
      const { getByText } = within(
        screen.getByTestId(`bsd-card-btn-primary-${bsdd.readableId}`)
      );
      expect(getByText("Valider le traitement")).toBeInTheDocument();

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      expect(screen.getByTestId("bsd-suite-btn")).toBeInTheDocument();
    });
  });

  describe("case: Appendix 1", () => {
    test("Bsdd", () => {
      const bsdd = {
        id: "cl32r54js30083339sw9nabhn0",
        readableId: "BSD-20220512-6609ESJPV",
        status: "SEALED",
        emitter: {
          type: "APPENDIX1"
        },

        __typename: "Form"
      } as unknown as Form;

      render(
        <PermissionsProvider defaultPermissions={[UserPermission.BsdCanUpdate]}>
          <MockedProvider mocks={mocks} addTypename={false}>
            <MemoryRouter initialEntries={[route]}>
              <BsdCard
                posInSet={0}
                setSize={1}
                currentSiret={siretEmmiter}
                bsd={bsdd}
                onValidate={functionMock}
                secondaryActions={{
                  onUpdate: functionMock,
                  onOverview: functionMock
                }}
              />
            </MemoryRouter>
          </MockedProvider>
        </PermissionsProvider>
      );

      const buttonActions = screen.getByTestId("bsd-actions-secondary-btn");
      expect(buttonActions).toBeInTheDocument();
      expect(screen.getByTestId("appendix1-btn")).toBeInTheDocument();
    });
  });
});
