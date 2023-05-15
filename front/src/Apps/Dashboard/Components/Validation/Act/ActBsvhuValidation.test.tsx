import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { SIGN_BSVHU } from "dashboard/components/BSDList/BSVhu/WorkflowAction/SignBsvhu";
import { Bsvhu, SignatureTypeInput } from "generated/graphql/types";
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
  const bsd = {
    id: "1",
    bsvhuStatus: "INITIAL",
  } as unknown as Bsvhu;

  it("renders Initial modal", async () => {
    const currentSiret = "12345678901234";
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
    const signedByProducerBsvhu = {
      ...bsd,
      bsvhuStatus: "SIGNED_BY_PRODUCER",
    } as Bsvhu;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsvhuValidation
          bsd={signedByProducerBsvhu}
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
    const sentBsvhu = { ...bsd, bsvhuStatus: "SENT" } as Bsvhu;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsvhuValidation
          bsd={sentBsvhu}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });
});
