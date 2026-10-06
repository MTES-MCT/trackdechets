import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import {
  BsffPackagingInput,
  BsffPackagingType,
  BsffType
} from "@td/codegen-ui";
import BsffPackagingList from "./BsffPackagingList";
import { emptyBsffPackaging } from "../../../../Forms/Components/PackagingList/helpers";

const packaging: BsffPackagingInput = {
  type: BsffPackagingType.Bouteille,
  numero: "NEW",
  volume: 250,
  weight: 250
};

function renderPackagingList(
  type: BsffType,
  packagingInfos: BsffPackagingInput[] = [packaging]
) {
  const push = jest.fn();
  const remove = jest.fn();

  function FormWrapper() {
    const methods = useForm({ defaultValues: { type } });

    return (
      <FormProvider {...methods}>
        <BsffPackagingList
          fieldName="packagings"
          packagingTypes={[BsffPackagingType.Bouteille]}
          packagingInfos={packagingInfos}
          push={push}
          remove={remove}
        >
          {({ idx }) => <div>{`packaging-${idx}`}</div>}
        </BsffPackagingList>
      </FormProvider>
    );
  }

  render(<FormWrapper />);
  return { push, remove };
}

describe("<BsffPackagingList />", () => {
  it("displays exactly the final packaging controls for a repackaging BSFF", () => {
    renderPackagingList(BsffType.Reconditionnement);

    expect(screen.getAllByText("packaging-0")).toHaveLength(1);
    expect(
      screen.getByText(/Un seul contenant est autorisé/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ajouter un conditionnement" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Supprimer" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retirer" })
    ).not.toBeInTheDocument();
  });

  it("keeps the add action for regular BSFF types", () => {
    const { push } = renderPackagingList(BsffType.TracerFluide);

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter un conditionnement" })
    );

    expect(push).toHaveBeenCalledWith(emptyBsffPackaging);
  });

  it.each([BsffType.Groupement, BsffType.Reexpedition])(
    "does not change packaging actions for %s BSFFs",
    type => {
      renderPackagingList(type);

      expect(
        screen.queryByRole("button", { name: "Ajouter un conditionnement" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Supprimer" })
      ).not.toBeInTheDocument();
    }
  );

  it("allows an existing invalid repackaging BSFF to be reduced to one packaging", () => {
    renderPackagingList(BsffType.Reconditionnement, [
      packaging,
      { ...packaging, numero: "SECOND" }
    ]);

    expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
      2
    );
    expect(
      screen.queryByRole("button", { name: "Ajouter un conditionnement" })
    ).not.toBeInTheDocument();
  });
});
