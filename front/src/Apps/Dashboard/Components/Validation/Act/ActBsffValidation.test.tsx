import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { GET_BSFF_FORM } from "../../../../../form/bsff/utils/queries";
import React from "react";
import ActBsffValidation from "./ActBsffValidation";
import { Bsff } from "codegen-ui";

describe("ActBsffValidation", () => {
  const onClose = jest.fn();

  const mocks = [
    {
      request: {
        query: GET_BSFF_FORM,
        variables: {
          id: "1"
        }
      },
      result: {
        data: {
          form: {
            id: "1",
            readableId: "FORM-1",
            status: "INITIAL"
          }
        }
      }
    }
  ];

  const bsd = {
    id: "1",
    bsffStatus: "INITIAL"
  } as unknown as Bsff;

  it("renders Initial modal", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByEmitter modal", async () => {
    const signedByEmitterBsff = {
      ...bsd,
      bsffStatus: "SIGNED_BY_EMITTER"
    } as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={signedByEmitterBsff} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Sent modal", async () => {
    const sentBsff = { ...bsd, bsffStatus: "SENT" } as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={sentBsff} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Received modal one packaging", async () => {
    const receivedBsff = {
      ...bsd,
      bsffStatus: "RECEIVED",
      packagings: [
        {
          numero: "F55",
          __typename: "BsffPackaging"
        }
      ]
    } as unknown as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={receivedBsff} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Received modal multiple packaging", async () => {
    const receivedBsffMultiplePackaging = {
      ...bsd,
      bsffStatus: "RECEIVED",
      packagings: [
        {
          numero: "F55",
          __typename: "BsffPackaging"
        },
        {
          numero: "4",
          __typename: "BsffPackaging"
        }
      ]
    } as unknown as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation
          bsd={receivedBsffMultiplePackaging}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Accepted modal", async () => {
    const acceptedBsff = { ...bsd, bsffStatus: "ACCEPTED" } as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={acceptedBsff} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders PartiallyRefused modal", async () => {
    const partiallyRefusedBsff = {
      ...bsd,
      bsffStatus: "PARTIALLY_REFUSED"
    } as Bsff;
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation
          bsd={partiallyRefusedBsff}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });
});
