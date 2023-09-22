import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Packagings from "./Packagings";
import { Field, Formik, FormikConfig, FormikProps } from "formik";

const noop = () => {};
const initialValues = { foo: "bar", packagingInfos: [] };
type Values = typeof initialValues;

function renderForm(
  ui?: React.ReactNode,
  props?: Partial<FormikConfig<Values>>
) {
  let injected: FormikProps<Values>;
  const { rerender, ...rest } = render(
    <Formik onSubmit={noop} initialValues={initialValues} {...props}>
      {(formikProps: FormikProps<Values>) =>
        (injected = formikProps) && ui ? ui : null
      }
    </Formik>
  );

  return {
    getFormProps(): FormikProps<Values> {
      return injected;
    },
    ...rest,
    rerender: () =>
      rerender(
        <Formik onSubmit={noop} initialValues={initialValues} {...props}>
          {(formikProps: FormikProps<Values>) =>
            (injected = formikProps) && ui ? ui : null
          }
        </Formik>
      )
  };
}

describe("<Packagings />", () => {
  describe("when empty", () => {
    beforeEach(() => {
      renderForm(<Field name="packagingInfos" component={Packagings} />);
    });

    it("should state that there is no packagings yet", () => {
      expect(
        screen.getAllByText(
          "Aucun conditionnement n'est encore défini sur ce bordereau."
        ).length
      ).toBe(1);
    });

    it("should add 1 packaging when clicking 'Ajouter un conditionnement'", async () => {
      expect(screen.queryAllByLabelText(/Type/).length).toBe(0);

      await fireEvent.click(screen.getByText("Ajouter un conditionnement"));

      expect(screen.queryAllByLabelText(/Type/).length).toBe(1);
    });

    it("should remove the packaging when clicking the close icon", async () => {
      // Setup
      fireEvent.click(screen.getByText("Ajouter un conditionnement"));
      screen.getAllByRole("combobox")[0].setAttribute("value", "BENNE");

      fireEvent.click(screen.getByText("Ajouter un conditionnement"));
      await screen.getAllByRole("combobox")[1].setAttribute("value", "FUT");

      expect(screen.queryAllByLabelText(/Type/).length).toBe(2);

      // Click second close icon => remove "FUT"
      await fireEvent.click(screen.getAllByRole("button")[1]);

      expect(screen.queryAllByLabelText(/Type/).length).toBe(1);
      expect(screen.getByRole("combobox").getAttribute("value")).toBe("BENNE");
    });
  });
});
