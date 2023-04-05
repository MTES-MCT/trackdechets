import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { SIGN_BSVHU } from "dashboard/components/BSDList/BSVhu/WorkflowAction/SignBsvhu";
import { SignatureTypeInput } from "generated/graphql/types";
import React from "react";
import ActBsvhuValidation from "./ActBsvhuValidation";

describe("ActBsvhuValidation", () => {
  const onClose = jest.fn();
  const values = {
    author: "",
  };
  const mocks = [
    {
      request: {
        query: SIGN_BSVHU,
        variables: {
          id: "1",
          input: { ...values, type: SignatureTypeInput.Emission },
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

  it("renders Initial modal", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsvhuStatus: "INITIAL",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsvhuValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByProducer modal", async () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      bsvhuStatus: "SIGNED_BY_PRODUCER",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsvhuValidation
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
      bsvhuStatus: "SENT",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsvhuValidation
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
