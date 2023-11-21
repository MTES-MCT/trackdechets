import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import React from "react";
import DraftValidation from "./DraftValidation";

describe("DraftBsdsValidation", () => {
  it("renders with expected text when bsd typename is Form", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      __typename: "Form"
    };
    const onClose = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DraftValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );

    expect(screen.getByText("Valider le bordereau")).toBeInTheDocument();
  });

  it("renders with expected text when bsd typename is Bsda", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      __typename: "Bsda"
    };
    const onClose = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DraftValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    const title = screen.getAllByText(/Publier le bordereau/i);

    expect(title[0]).toBeInTheDocument();
  });

  it("renders with expected text when bsd typename is Bsff", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      __typename: "Bsff"
    };
    const onClose = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DraftValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    const title = screen.getAllByText(/Publier le bordereau/i);

    expect(title[0]).toBeInTheDocument();
  });

  it("renders with expected text when bsd typename is Bsvhu", () => {
    const currentSiret = "12345678901234";
    const bsd = {
      id: "1",
      __typename: "Bsvhu"
    };
    const onClose = jest.fn();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DraftValidation
          bsd={bsd}
          currentSiret={currentSiret}
          isOpen
          onClose={onClose}
        />
      </MockedProvider>
    );
    const title = screen.getAllByText(/Publier le bordereau/i);

    expect(title[0]).toBeInTheDocument();
  });
});
