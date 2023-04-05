import React from "react";
import ActBsdaValidation from "./ActBsdaValidation";
import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { SIGN_BSDA } from "dashboard/components/BSDList/BSDa/WorkflowAction/SignBsda";
import { BsdaSignatureType } from "generated/graphql/types";

describe("ActBsdaValidation", () => {
  const onClose = jest.fn();

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

  it("renders Initial modal same destination siret", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "INITIAL",
      destination: { company: { siret: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same transporter siret", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "INITIAL",
      emitter: { isPrivateIndividual: true },
      worker: { isDisabled: true },
      transporter: { company: { orgId: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same worker siret", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "INITIAL",
      emitter: { isPrivateIndividual: true },
      worker: { company: { siret: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Initial modal same emitter siret", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "INITIAL",
      emitter: { company: { siret: "12345678901234" } },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal bsda type GATHERING", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "SIGNED_BY_PRODUCER",
      bsdaType: "GATHERING",
      worker: { isDisabled: true },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal bsda type RESHIPMENT", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "SIGNED_BY_PRODUCER",
      bsdaType: "RESHIPMENT",
      worker: { isDisabled: true },
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal without bsda type and worker", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "SIGNED_BY_PRODUCER",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByWorker modal", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "SIGNED_BY_WORKER",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Sent modal", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsdaStatus: "SENT",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsdaValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });
});
