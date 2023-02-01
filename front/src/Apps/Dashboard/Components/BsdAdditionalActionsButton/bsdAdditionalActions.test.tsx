import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import BsdAdditionalActionsButton from "./BsdAdditionalActionsButton";
import { BsdDisplay, BsdStatusCode } from "Apps/Common/types/bsdTypes";
import { BsdType } from "generated/graphql/types";

const bsd = { id: "1", readableid: "1" } as unknown as BsdDisplay;
const currentSiret = "12345678901234";

const onOverview = jest.fn();
const onDuplicate = jest.fn();
const onPdf = jest.fn();
const onDelete = jest.fn();
const onUpdate = jest.fn();
const onRevision = jest.fn();

describe("BsdAdditionalActionsButton", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );
  });

  it("opens and closes the dropdown menu on click", async () => {
    const { getByTestId, queryByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
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
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-overview-btn"));

    await waitFor(() => {
      expect(onOverview).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onDuplicate` function when the 'Dupliquer' button is clicked", async () => {
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-duplicate-btn"));

    await waitFor(() => {
      expect(onDuplicate).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onPdf` function when the 'PDF' button is clicked", async () => {
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsd}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-pdf-btn"));

    await waitFor(() => {
      expect(onPdf).toHaveBeenCalledWith(bsd);
    });
  });

  it("calls the `onDelete` function when the 'Supprimer' button is clicked", async () => {
    const bsdDelete = {
      ...bsd,
      status: BsdStatusCode.DRAFT,
      type: BsdType.Bsdd,
    };
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdDelete}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-delete-btn"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(bsdDelete);
    });
  });

  it("calls the `onUpdate` function when the 'Modifier' button is clicked", async () => {
    const bsdUpdate = {
      ...bsd,
      status: BsdStatusCode.DRAFT,
      type: BsdType.Bsdd,
    };
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdUpdate}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-update-btn"));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(bsdUpdate);
    });
  });

  it("calls the `onRevision` function when the 'Réviser' button is clicked", async () => {
    const bsdReview = {
      ...bsd,
      status: BsdStatusCode.PROCESSED,
      type: BsdType.Bsdd,
    };
    const { getByTestId } = render(
      <BsdAdditionalActionsButton
        bsd={bsdReview}
        currentSiret={currentSiret}
        onOverview={onOverview}
        onDuplicate={onDuplicate}
        onPdf={onPdf}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onRevision={onRevision}
      />
    );

    fireEvent.click(getByTestId("bsd-review-btn"));

    await waitFor(() => {
      expect(onRevision).toHaveBeenCalledWith(bsdReview);
    });
  });
});
