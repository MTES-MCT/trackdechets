import CompanyType from "../CompanyType";
import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";

describe("<CompanyType />", () => {
  const props = { field: { name: "my-field", value: [true] } };
  it("CompanyType renders correctly", () => {
    const { container, debug, queryByText } = render(
      <CompanyType {...props} />
    );

    expect(queryByText("Producteur de déchets")).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });
});
