import React from "react";
import { MockedProvider } from "@apollo/client/testing";

import { render, screen, waitFor } from "@testing-library/react";
import ActBsddValidation from "./ActBsddValidation";
import { GET_FORM } from "form/bsdd/utils/queries";
import ActBsdSuiteValidation from "./ActBsdSuiteValidation";
import { MemoryRouter } from "react-router-dom";

describe("ActBsddValidation", () => {
  const onClose = jest.fn();
  const mocks = [
    {
      request: {
        query: GET_FORM,
        variables: { id: "1", readableId: null },
      },
      result: {
        data: {
          form: {
            readableId: "FORM-1",
            wasteDetails: { code: "01 01 01*" },
            recipient: { company: { siret: "111111111" } },
          },
        },
      },
    },
  ];

  it("renders with expected text when status is Resealed and user is emitter", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "RESEALED",
      recipient: { company: { siret: "12345678901235" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(
      screen.getByText("Faire signer l'entreposage provisoire")
    ).toBeInTheDocument();
  });

  it("renders with expected text when status is Sealed and user is emitter and emitter type is Appendix1", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SEALED",
      emitter: { company: { siret: "12345678901234" }, type: "APPENDIX1" },
    };

    const mocksSealed = [
      {
        request: {
          query: GET_FORM,
          variables: { id: "1", readableId: null },
        },
        result: {
          data: {
            form: {
              readableId: "FORM-1",
              status: "SEALED",
              wasteDetails: { code: "01 01 01*" },
              emitter: {
                company: { siret: "12345678901234" },
                type: "APPENDIX1",
              },

              recipient: {
                company: { siret: "111111111" },
              },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocksSealed} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(async () => {
      expect(
        await screen.getByText("Valider la réception")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sealed and user is emitter and emitter type is Appendix1Producer and there is no ecoOrganisme", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SEALED",
      emitter: {
        company: { siret: "12345678901234" },
        type: "APPENDIX1_PRODUCER",
      },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Signer en tant qu'émetteur")).toBeInTheDocument();
  });

  it("renders with expected text when status is Sealed and user is emitter and emitter type is Appendix1Producer and there is an ecoOrganisme", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SEALED",
      ecoOrganisme: { siret: "12345678901234" },
      emitter: {
        company: { siret: "12345678901234" },
        type: "APPENDIX1_PRODUCER",
      },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Signature transporteur")).toBeInTheDocument();
  });

  it("renders with expected text when status is Resent", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "RESENT",
    };

    const mocksResent = [
      {
        request: {
          query: GET_FORM,
          variables: { id: "1", readableId: null },
        },
        result: {
          data: {
            form: {
              readableId: "FORM-1",
              status: "RESENT",
              wasteDetails: { code: "01 01 01*" },
              recipient: {
                company: { siret: "111111111" },
                isTempStrorage: true,
              },
              quantityType: "REAL",
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocksResent} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();
    await waitFor(async () => {
      expect(
        await screen.getByText("Valider la réception")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is SignedByProducer", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SIGNED_BY_PRODUCER",
      transporter: { company: { orgId: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(async () => {
      expect(
        await screen.getByText("Signature transporteur")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is TempStored", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "TEMP_STORED",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(async () => {
      expect(
        await screen.getByText(
          "Valider l'acceptation de l'entreposage provisoire"
        )
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sent", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SENT",
      recipient: { company: { siret: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(async () => {
      expect(
        await screen.getByText("Valider la réception")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sent with temp storage", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SENT",
      recipient: { company: { siret: "12345678901234" }, isTempStorage: true },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    expect(await screen.getByTestId("loader")).toBeInTheDocument();

    await waitFor(async () => {
      expect(
        await screen.getByText("Valider l'entreposage provisoire")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sent with segments still a draft", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SENT",
      currentTransporterOrgId: "12345678901234",
      transportSegments: [
        {
          id: "ckyef9g3a2924349syhsqc1wa",
          readyToTakeOver: false,
          previousTransporterCompanyOrgId: "12345678901234",
          takenOverAt: null,
          __typename: "TransportSegment",
        },
      ],
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    await waitFor(async () => {
      expect(
        await screen.getByText("Finaliser pour transférer")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sent with segments taken over at", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SENT",
      currentTransporterOrgId: "12345678901234",
      transportSegments: [
        {
          id: "ckyef9g3a2924349syhsqc1wa",
          previousTransporterCompanyOrgId: "12345678901234",
          takenOverAt: "2023-03-17",
          __typename: "TransportSegment",
        },
      ],
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    await waitFor(async () => {
      expect(
        await screen.getByText(
          "Préparer le transfert à un autre transporteur (multimodal)"
        )
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Sent with segments ready to take over", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SENT",
      currentTransporterOrgId: "12345678901234",
      nextTransporterOrgId: "12345678901234",
      transportSegments: [
        {
          id: "ckyef9g3a2924349syhsqc1wa",
          previousTransporterCompanyOrgId: "12345678901234",
          takenOverAt: null,
          readyToTakeOver: true,
          __typename: "TransportSegment",
        },
      ],
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    await waitFor(async () => {
      expect(
        await screen.getByText("Prendre en charge le déchet")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is TempStorerAccepted", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "TEMP_STORER_ACCEPTED",
      recipient: { company: { siret: "12345678901235" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Valider le traitement")).toBeInTheDocument();
  });

  it("renders with expected text when status is SignedByTempStorer", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "SIGNED_BY_TEMP_STORER",
      recipient: { company: { siret: "12345678901235" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Signature transporteur")).toBeInTheDocument();
  });

  it("renders with expected text when status is Received", async () => {
    const currentSiret = "12345678901234";

    const bsd = {
      id: "1",
      status: "RECEIVED",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    await waitFor(async () => {
      expect(
        await screen.getByText("Valider l'acceptation")
      ).toBeInTheDocument();
    });
  });

  it("renders with expected text when status is Accepted", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      status: "ACCEPTED",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsddValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Valider le traitement")).toBeInTheDocument();
  });

  it("renders bsd suite modal", () => {
    const bsd = {
      id: "1",
      status: "TEMP_STORER_ACCEPTED",
      destination: { company: { siret: "12345678901235" } },
    };
    const route = "/dashboard/12345678901235";

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <ActBsdSuiteValidation bsd={bsd} isOpen onClose={onClose} />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByText("Compléter le BSD suite")).toBeInTheDocument();
  });
});
