import { MockedProvider } from "@apollo/client/testing";
import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { GET_BSFF_FORM } from "form/bsff/utils/queries";
import React from "react";
import ActBsffValidation from "./ActBsffValidation";

describe("ActBsffValidation", () => {
  const onClose = jest.fn();

  const mocks = [
    {
      request: {
        query: GET_BSFF_FORM,
        variables: {
          id: "1",
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
    const bsd = {
      id: "1",
      bsffStatus: "INITIAL",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders SignedByEmitter modal", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "SIGNED_BY_EMITTER",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Sent modal", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "SENT",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Received modal one packaging", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "RECEIVED",
      packagings: [
        {
          numero: "F55",
          __typename: "BsffPackaging",
        },
      ],
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Received modal multiple packaging", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "RECEIVED",
      packagings: [
        {
          numero: "F55",
          __typename: "BsffPackaging",
        },
        {
          numero: "4",
          __typename: "BsffPackaging",
        },
      ],
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders Accepted modal", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "ACCEPTED",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders PartiallyRefused modal", async () => {
    const bsd = {
      id: "1",
      bsffStatus: "PARTIALLY_REFUSED",
    };
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ActBsffValidation bsd={bsd} isOpen onClose={onClose} />
      </MockedProvider>
    );

    expect(await screen.getByTestId("loader")).toBeInTheDocument();
  });
});
