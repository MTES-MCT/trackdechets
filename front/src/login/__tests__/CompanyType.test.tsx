import CompanyType from "../CompanyType";
import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import { Field, Formik } from "formik";

describe("<CompanyType />", () => {
  it("CompanyType renders correctly", () => {
    const { container, debug, queryByText } = render(
      <Formik
        initialValues={{
          companyTypes: []
        }}
        onSubmit={() => {}}
      >
        <Field name="companyTypes" component={CompanyType} />
      </Formik>
    );

    expect(queryByText("Producteur de déchets")).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });
});
