import React from "react";
import EditCompany, { UPDATE_COMPANY } from "../EditCompany";
import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent, getByRole } from "@testing-library/react";

// import { MockedProvider } from "@apollo/react-testing";

/**
 * These tests are skipped for time being waiting an
 * upgrade to apollo-client@2.6 to install @apollo/react-testing
 *
 * See https://www.apollographql.com/docs/react/development-testing/testing/
 */

describe.skip("<EditCompany />", () => {
  it("should renders without error", () => {
    const props = {
      siret: "85001946400013 ",
      companyTypes: ["PRODUCER"],
      onSubmit: jest.fn()
    };
    render(
      // <MockedProvider mocks={[]}>
      <EditCompany {...props} />
      // </MockedProvider>
    );
  });
  it("should perform mutation and call onSubmit callback", () => {
    const props = {
      siret: "85001946400013",
      companyTypes: ["PRODUCER"],
      onSubmit: jest.fn()
    };

    const newCompanyTypes = ["PRODUCER", "WASTEPROCESSOR"];
    let updateMutationCalled = false;
    const mocks = [
      {
        request: {
          query: UPDATE_COMPANY,
          variables: {
            siret: props.siret,
            companyTypes: newCompanyTypes
          }
        },
        result: () => {
          updateMutationCalled = true;
          return {
            data: {
              id: "id",
              siret: props.siret,
              companyTypes: newCompanyTypes
            }
          };
        }
      }
    ];
    const { getByRole } = render(
      // <MockedProvider mocks={mocks}>
      <EditCompany {...props} />
      // </MockedProvider>
    );
    // find the button and simulate a click
    const button = getByRole("button");

    fireEvent.click(button);

    setTimeout(() => {
      expect(updateMutationCalled).toBe(true);
      expect(props.onSubmit).toHaveBeenCalled();
    }, 1);
  });
  it("should render error message if the mutation failed", () => {
    const props = {
      siret: "85001946400013",
      companyTypes: ["PRODUCER"],
      onSubmit: jest.fn()
    };
    const newCompanyTypes = ["PRODUCER", "WASTEPROCESSOR"];

    const mocks = [
      {
        request: {
          query: UPDATE_COMPANY,
          variables: {
            siret: props.siret,
            companyTypes: newCompanyTypes
          }
        },
        error: new Error("Bang")
      }
    ];

    const { getByRole, getByText } = render(
      // <MockedProvider mocks={mocks}>
      <EditCompany {...props} />
      // </MockedProvider>
    );
    // find the button and simulate a click
    const button = getByRole("button");

    fireEvent.click(button);

    setTimeout(() => {
      const err = getByText("Une erreur est survenue. Veuillez réessayer");
      expect(err).toBeInTheDocument();
    }, 1);
  });
});
