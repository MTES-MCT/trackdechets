import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import BsdAdditionalActionsButton from "./BsdAdditionalActionsButton";
import { BsdDisplay, BsdStatusCode } from "Apps/common/types/bsdTypes";
import { BsdType, EmitterType, UserPermission } from "generated/graphql/types";

const bsd = {
  id: "1",
  readableid: "1",
  type: BsdType.Bsdd,
} as BsdDisplay;
const currentSiret = "12345678901234";

const onOverview = jest.fn();
const onDuplicate = jest.fn();
const onPdf = jest.fn();
const onDelete = jest.fn();
const onUpdate = jest.fn();
const onRevision = jest.fn();
const onAppendix1 = jest.fn();
const onBsdSuite = jest.fn();

describe("BsdAdditionalActionsButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const permissions = [];

    render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );
  });

  it("opens and closes the dropdown menu on click", async () => {
    const permissions = [];

    const { getByTestId, queryByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
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
      <BsdAdditionalActionsButton
        bsd={bsd}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-overview-btn"));

    await waitFor(() => {
      expect(onOverview).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onDuplicate` function when the 'Dupliquer' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanCreate];

    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-duplicate-btn"));

    await waitFor(() => {
      expect(onDuplicate).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onPdf` function when the 'PDF' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanRead];

    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-pdf-btn"));

    await waitFor(() => {
      expect(onPdf).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onDelete` function when the 'Supprimer' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanDelete];
    const bsdDelete = {
      ...bsd,
      status: BsdStatusCode.Draft,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdDelete}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-delete-btn"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(bsdDelete);
    });
  });

  it("calls the `onUpdate` function when the 'Modifier' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanUpdate];
    const bsdUpdate = {
      ...bsd,
      status: BsdStatusCode.Draft,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdUpdate}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-update-btn"));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(bsdUpdate);
    });
  });

  it("calls the `onRevision` function when the 'Réviser' button is clicked", async () => {
    const permissions = [UserPermission.BsdCanRevise];
    const bsdReview = {
      ...bsd,
      status: BsdStatusCode.Processed,
      type: BsdType.Bsdd,
    } as BsdDisplay;

    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdReview}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-review-btn"));

    await waitFor(() => {
      expect(onRevision).toHaveBeenCalledWith(bsdReview);
    });
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
      <BsdAdditionalActionsButton
        bsd={bsdSuite}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("bsd-suite-btn"));

    await waitFor(() => {
      expect(onBsdSuite).toHaveBeenCalledWith(bsdSuite);
    });
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
      <BsdAdditionalActionsButton
        bsd={bsdSuite}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("valider-traitement-btn"));

    await waitFor(() => {
      expect(onBsdSuite).toHaveBeenCalledWith(bsdSuite);
    });
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
      <BsdAdditionalActionsButton
        bsd={bsdAppendix1}
        permissions={permissions}
        currentSiret={currentSiret}
        actionList={{
          onOverview,
          onDelete,
          onDuplicate,
          onUpdate,
          onRevision,
          onPdf,
          onAppendix1,
          onBsdSuite,
        }}
      />
    );

    fireEvent.click(getByTestId("appendix1-btn"));

    await waitFor(() => {
      expect(onAppendix1).toHaveBeenCalledWith(bsdAppendix1);
    });
  });
});
