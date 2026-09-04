import React from "react";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { BsffType } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../context";
import BsffTypeRadioGroup from "./BsffTypeRadioGroup";

type FormValues = {
  id?: string;
  isDraft?: boolean;
  type: BsffType;
};

function renderBsffTypeRadioGroup(defaultValues: FormValues) {
  function Component() {
    const methods = useForm<FormValues>({ defaultValues });

    return (
      <SealedFieldsContext.Provider value={[]}>
        <FormProvider {...methods}>
          <BsffTypeRadioGroup />
        </FormProvider>
      </SealedFieldsContext.Provider>
    );
  }

  render(<Component />);
  return screen.getAllByRole("radio");
}

describe("<BsffTypeRadioGroup />", () => {
  it("keeps every BSFF type selectable when creating a new BSFF", () => {
    const radios = renderBsffTypeRadioGroup({
      type: BsffType.CollectePetitesQuantites
    });

    expect(radios).toHaveLength(5);
    radios.forEach(radio => expect(radio).toBeEnabled());
  });

  it.each([
    ["draft", true],
    ["published", false]
  ])("disables every BSFF type when editing a %s BSFF", (_, isDraft) => {
    const radios = renderBsffTypeRadioGroup({
      id: "existing-bsff-id",
      isDraft,
      type: BsffType.CollectePetitesQuantites
    });

    expect(radios).toHaveLength(5);
    radios.forEach(radio => expect(radio).toBeDisabled());
  });
});
