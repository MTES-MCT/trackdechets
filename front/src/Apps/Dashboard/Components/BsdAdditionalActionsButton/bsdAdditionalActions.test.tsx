import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import BsdAdditionalActionsButton from "./BsdAdditionalActionsButton";
import { BsdDisplay, BsdStatusCode } from "Apps/common/types/bsdTypes";
import { BsdType, EmitterType, UserPermission } from "generated/graphql/types";
import { MemoryRouter } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";

const bsd = {
  id: "1",
  readableid: "1",
  type: BsdType.Bsdd,
} as BsdDisplay;
const currentSiret = "12345678901234";

const onAppendix1 = jest.fn();
const onBsdSuite = jest.fn();
const route = "/dashboard/12345678901235";

describe("BsdAdditionalActionsButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const permissions = [];

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsd}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );
  });

  it("opens and closes the dropdown menu on click", async () => {
    const permissions = [];

    const { getByTestId, queryByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsd}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />{" "}
        </MemoryRouter>
      </MockedProvider>
    );

    expect(queryByTestId("bsd-actions-dropdown_1")).not.toHaveClass(
      "bsd-actions-kebab-menu__dropdown--active"
    );

    fireEvent.click(getByTestId("bsd-actions-secondary-btn"));

    await waitFor(() => {
      expect(getByTestId("bsd-actions-dropdown_1")).toHaveClass(
        "bsd-actions-kebab-menu__dropdown--active"
      );
    });

    fireEvent.click(getByTestId("bsd-actions-secondary-btn"));

    await waitFor(() => {
      expect(queryByTestId("bsd-actions-dropdown_1")).not.toHaveClass(
        "bsd-actions-kebab-menu__dropdown--active"
      );
    });
  });

  it("calls the `onOverview` function when the 'Vue détaillée' button is clicked", async () => {
    const permissions = [];

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsd}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-overview-btn")).toBeInTheDocument();
  });

  it("calls the `onDuplicate` function when the 'Dupliquer' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanCreate];

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsd}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-duplicate-btn")).toBeInTheDocument();
  });

  it("calls the `onPdf` function when the 'PDF' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanRead];

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsd}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-pdf-btn")).toBeInTheDocument();
  });

  it("calls the `onDelete` function when the 'Supprimer' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanDelete];
    const bsdDelete = {
      ...bsd,
      status: BsdStatusCode.Draft,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdDelete}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-delete-btn")).toBeInTheDocument();
  });

  it("calls the `onUpdate` function when the 'Modifier' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanUpdate];
    const bsdUpdate = {
      ...bsd,
      status: BsdStatusCode.Draft,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdUpdate}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-update-btn")).toBeInTheDocument();
  });

  it("calls the `onRevision` function when the 'Réviser' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanRevise];
    const bsdReview = {
      ...bsd,
      status: BsdStatusCode.Processed,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdReview}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-review-btn")).toBeInTheDocument();
  });

  it("calls the `onBsdSuite` function when the 'Compléter le bsd suite' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanSignOperation];
    const bsdSuite = {
      ...bsd,
      emitterType: EmitterType.Producer,
      status: BsdStatusCode.Accepted,
      destination: { company: { siret: currentSiret } },
      isTempStorage: false,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdSuite}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("bsd-suite-btn")).toBeInTheDocument();
  });
  it("calls the `onBsdSuite` function when the 'Valider le traitement' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanSignOperation];
    const bsdSuite = {
      ...bsd,
      emitterType: EmitterType.Producer,
      status: BsdStatusCode.TempStorerAccepted,
      destination: { company: { siret: currentSiret } },
      temporaryStorageDetail: {
        transporter: { company: { siret: "1234567890" } },
      },
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdSuite}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(getByTestId("valider-traitement-btn")).toBeInTheDocument();
  });

  it("calls the `onAppendix1` function when the 'Annexe 1' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanUpdate];
    const bsdAppendix1 = {
      ...bsd,
      emitterType: EmitterType.Appendix1,
      status: BsdStatusCode.Sent,
      type: BsdType.Bsdd,
    } as BsdDisplay;
    const { getByTestId } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[route]}>
          <BsdAdditionalActionsButton
            bsd={bsdAppendix1}
            permissions={permissions}
            currentSiret={currentSiret}
            actionList={{
              onAppendix1,
              onBsdSuite,
            }}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    fireEvent.click(getByTestId("appendix1-btn"));

    await waitFor(() => {
      expect(onAppendix1).toHaveBeenCalledWith(bsdAppendix1);
    });
  });
});
