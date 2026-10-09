import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ReconditioningContainerPicker from "./ReconditioningContainerPicker";
import {
  ReconditioningContainer,
  addReconditioningContainer
} from "../utils/reconditionnement";

export const containers: ReconditioningContainer[] = ["A", "B", "C"].map(
  (id, index) => ({
    id,
    numero: id,
    bsffId: `BSFF-${id}`,
    type: "BOUTEILLE",
    volume: 10,
    acceptation: {
      wasteCode: index === 2 ? "14 06 01*" : "14 06 02*",
      weight: 5
    },
    bsff: { emitter: null }
  })
);

const available = () =>
  within(screen.getByRole("table", { name: "Contenants disponibles" }));
const selected = () =>
  within(screen.getByRole("table", { name: "Contenants sélectionnés" }));
const addAvailable = (id: string) =>
  within(available().getByText(`BSFF-${id}`).closest("tr")!).getByRole(
    "button",
    { name: "Ajouter" }
  );

describe("ReconditioningContainerPicker", () => {
  it("stages, locks, removes and confirms containers without pagination", () => {
    const onConfirm = jest.fn();
    render(
      <ReconditioningContainerPicker
        containers={containers}
        confirmed={[]}
        disabled={false}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter les contenants" })
    ).toBeDisabled();
    expect(available().getAllByText("10 L")).toHaveLength(3);
    fireEvent.click(available().getAllByRole("button", { name: "Ajouter" })[0]);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(selected().getByText("A")).toBeInTheDocument();
    expect(addAvailable("C")).toBeDisabled();
    fireEvent.click(addAvailable("B"));
    expect(selected().getAllByRole("button", { name: "Retirer" })).toHaveLength(
      2
    );
    fireEvent.click(selected().getAllByRole("button", { name: "Retirer" })[0]);
    expect(addAvailable("C")).toBeDisabled();
    fireEvent.click(selected().getByRole("button", { name: "Retirer" }));
    expect(addAvailable("C")).toBeEnabled();
    fireEvent.click(addAvailable("C"));
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter les contenants" })
    );
    expect(onConfirm).toHaveBeenCalledWith([containers[2]]);
  });

  it("protects direct addition against duplicates and incompatible waste codes", () => {
    const selection = [containers[0]];
    expect(addReconditioningContainer(selection, containers[2])).toBe(
      selection
    );
    expect(addReconditioningContainer(selection, containers[0])).toBe(
      selection
    );
    expect(addReconditioningContainer(selection, containers[1])).toEqual(
      containers.slice(0, 2)
    );
  });

  it("preserves confirmed containers missing from the search and can confirm their removal", () => {
    const onConfirm = jest.fn();
    render(
      <ReconditioningContainerPicker
        containers={[]}
        confirmed={[containers[0]]}
        disabled={false}
        onConfirm={onConfirm}
      />
    );
    expect(selected().getByText("A")).toBeInTheDocument();
    fireEvent.click(selected().getByRole("button", { name: "Retirer" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter les contenants" })
    );
    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it("applies the container number filter", () => {
    render(
      <ReconditioningContainerPicker
        containers={containers}
        confirmed={[]}
        disabled={false}
        onConfirm={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("N° contenant"), {
      target: { value: "B" }
    });
    expect(
      available().getAllByRole("button", { name: "Ajouter" })
    ).toHaveLength(1);
    expect(available().getByText("B")).toBeInTheDocument();
  });

  it("prevents changes to sealed selections", () => {
    render(
      <ReconditioningContainerPicker
        containers={containers}
        confirmed={[containers[0]]}
        disabled
        onConfirm={jest.fn()}
      />
    );
    screen
      .getAllByRole("button")
      .forEach(button => expect(button).toBeDisabled());
  });
});
