import React from "react";
import ActBsdaValidation from "./ActBsdaValidation";
import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { SIGN_BSDA } from "dashboard/components/BSDList/BSDa/WorkflowAction/SignBsda";
import { Bsda, BsdaSignatureType } from "generated/graphql/types";
import { MemoryRouter } from "react-router-dom";

describe("ActBsdaValidation", () => {
  const onClose = jest.fn();
  const v2Route = "v2/dashboard";

  const mocks = [
    {
      request: {
        query: SIGN_BSDA,
        variables: {
          id: "1",
          input: {
            author: "",
            type: BsdaSignatureType.Operation,
          },
        },
      },
      result: {
        data: {
          form: {
            id: "1",
            readableId: "FORM-1",
            status: "INITIAL",
          },
        },
      },
    },
  ];
  const bsd = {
    id: "1",
    bsdaStatus: "INITIAL",
  } as unknown as Bsda;

  it("renders Initial modal same destination siret", async () => {
    const currentSiret = "12345678901234";
    const initialCollection2710Bsda = {
      ...bsd,
      bsdaType: "COLLECTION_2710",
      destination: { company: { siret: "12345678901234" } },
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={initialCollection2710Bsda}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same transporter siret", async () => {
    const currentSiret = "12345678901234";
    const initialBsdaSameTransporter = {
      ...bsd,
      emitter: { isPrivateIndividual: true },
      worker: { isDisabled: true },
      transporter: { company: { orgId: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={initialBsdaSameTransporter}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same worker siret", async () => {
    const currentSiret = "12345678901234";
    const initialBsdaSameWorker = {
      ...bsd,
      emitter: { isPrivateIndividual: true },
      worker: { company: { siret: "12345678901234" } },
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={initialBsdaSameWorker}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same emitter siret", async () => {
    const currentSiret = "12345678901234";
    const initialBsdaSameEmitter = {
      ...bsd,
      emitter: { company: { siret: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={initialBsdaSameEmitter}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal bsda type GATHERING", async () => {
    const currentSiret = "12345678901234";
    const signedByProducerBsda = {
      ...bsd,
      bsdaStatus: "SIGNED_BY_PRODUCER",
      bsdaType: "GATHERING",
      worker: { isDisabled: true },
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={signedByProducerBsda}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal bsda type RESHIPMENT", async () => {
    const currentSiret = "12345678901234";
    const signedByProducerBsdaReshipment = {
      ...bsd,
      bsdaStatus: "SIGNED_BY_PRODUCER",
      bsdaType: "RESHIPMENT",
      worker: { isDisabled: true },
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={signedByProducerBsdaReshipment}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal without bsda type and worker", async () => {
    const currentSiret = "12345678901234";
    const signedByProducerBsdaNoWorker = {
      ...bsd,
      bsdaStatus: "SIGNED_BY_PRODUCER",
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={signedByProducerBsdaNoWorker}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByWorker modal", async () => {
    const currentSiret = "12345678901234";
    const signedByWorkerBsda = {
      ...bsd,
      bsdaStatus: "SIGNED_BY_WORKER",
    } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={signedByWorkerBsda}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Sent modal", async () => {
    const currentSiret = "12345678901234";
    const sentBsda = { ...bsd, bsdaStatus: "SENT" } as Bsda;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={[v2Route]}>
          <ActBsdaValidation
            bsd={sentBsda}
            currentSiret={currentSiret}
            isOpen
            onClose={onClose}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });
});
