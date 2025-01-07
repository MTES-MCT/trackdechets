import React from "react";
import { render, screen } from "@testing-library/react";

import { FormProvider, useForm } from "react-hook-form";
import { RhfTransportModeSelect } from "./TransportMode";

function FormWrapper({ children, defaultValues = {} }) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("<TransportMode />", () => {
  const renderComponent = (props = {}) => {
    return render(
      <FormWrapper>
        <RhfTransportModeSelect fieldPath="transport.mode" {...props} />
      </FormWrapper>
    );
  };
  it("renders all transport mode options", () => {
    renderComponent();

    const expected = [
      ["ROAD", "Route"],
      ["AIR", "Voie aérienne"],
      ["RAIL", "Voie ferrée"],
      ["RIVER", "Voie fluviale"],
      ["SEA", "Voie maritime"]
    ];

    expect(screen.getAllByRole("option").length).toBe(5);

    expected.forEach(([key, value]) => {
      expect(screen.getByRole("option", { name: value })).toHaveValue(key);
    });
  });

  it("handles disabled state correctly", () => {
    renderComponent({ disabled: true });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("integrates with react-hook-form", async () => {
    const defaultValues = {
      transport: { mode: "RAIL" }
    };

    render(
      <FormWrapper defaultValues={defaultValues}>
        <RhfTransportModeSelect fieldPath="transport.mode" />
      </FormWrapper>
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("RAIL");
  });
});
