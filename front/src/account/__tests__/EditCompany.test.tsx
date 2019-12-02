import React from "react";
import EditCompany, { UPDATE_COMPANY } from "../EditCompany";
import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent, wait } from "@testing-library/react";
import { MockedProvider } from "@apollo/react-testing";

describe("<EditCompany />", () => {
  it("should renders without error", () => {
    const props = {
      siret: "85001946400013 ",
      companyTypes: ["PRODUCER"],
      onSubmit: jest.fn()
    };
    render(
      <MockedProvider mocks={[]}>
        <EditCompany {...props} />
      </MockedProvider>
    );
  });
  it("should initialize checkboxes correctly", () => {
    const props = {
      siret: "85001946400013 ",
      companyTypes: ["PRODUCER"],
      onSubmit: jest.fn()
    };
    const { getAllByRole } = render(
      <MockedProvider mocks={[]}>
        <EditCompany {...props} />
      </MockedProvider>
    );

    // get all checkboxes
    const checkboxes = getAllByRole("checkbox");

    expect(checkboxes.length).toBe(7);

    // get checkboxes that are initially checked
    const checked = checkboxes.filter(c => c.checked);

    expect(checked.length).toBe(1);

    expect(checked[0].value).toBe("PRODUCER");
  });
  it("should perform mutation and call onSubmit callback", async () => {
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <EditCompany {...props} />
      </MockedProvider>
    );

    // find the form and simulate a submit
    const form = getByRole("form");

    fireEvent.submit(form);

    await (() => {
      expect(updateMutationCalled).toBe(true);
      expect(props.onSubmit).toHaveBeenCalled();
    });
  });
  it("should render error message if the mutation failed", async () => {
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
      <MockedProvider mocks={mocks}>
        <EditCompany {...props} />
      </MockedProvider>
    );
    // find the form and simulate a submit
    const form = getByRole("form");

    fireEvent.submit(form);

    const errMessage = "Une erreur est survenue. Veuillez réessayer";
    await wait(() => getByText(errMessage));

    const err = getByText(errMessage);
    expect(err).toBeInTheDocument();
  });
});
