import React from "react";
import Company from "../Company";
import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent } from "@testing-library/react";

// mock actual implementation of <EditCompany />
type Props = {
  siret: string;
  companyTypes: string[];
  onSubmit: () => void;
};
function MockEditCompany({ siret, companyTypes, onSubmit }: Props) {
  return <div className="editCompany">Edit company</div>;
}

jest.mock("../EditCompany", () => MockEditCompany);

describe("<Company />", () => {
  it("should not display edit button if not admin", () => {
    const company = {
      id: "id",
      address: "1 chemin de l'olivier",
      companyTypes: ["PRODUCER"],
      isAdmin: false,
      name: "ACME Inc",
      securityCode: "3274",
      siret: "85001946400013"
    };
    const { queryByText } = render(<Company company={company} />);

    const editButtonText = "Éditer les informations de l'entreprise";
    const companyEditButton = queryByText(editButtonText);

    expect(companyEditButton).not.toBeInTheDocument();
  });

  it("should display edit button if admin", () => {
    const company = {
      id: "id",
      address: "1 chemin de l'olivier",
      companyTypes: ["PRODUCER"],
      isAdmin: true,
      name: "ACME Inc",
      securityCode: "3274",
      siret: "85001946400013"
    };
    const { queryByText } = render(<Company company={company} />);

    const editButtonText = "Éditer les informations de l'entreprise";
    const companyEditButton = queryByText(editButtonText);

    expect(companyEditButton).toBeInTheDocument();
  });

  it("should display edit form when edit button is clicked", () => {
    const company = {
      id: "id",
      address: "1 chemin de l'olivier",
      companyTypes: ["PRODUCER"],
      isAdmin: true,
      name: "ACME Inc",
      securityCode: "3274",
      siret: "85001946400013"
    };
    const { container, getByText } = render(<Company company={company} />);

    const editButtonText = "Éditer les informations de l'entreprise";
    const companyEditButton = getByText(editButtonText);

    // the form should not be present initially
    expect(
      container.querySelector("[class=editCompany]")
    ).not.toBeInTheDocument();

    // click the button and the form should appear
    fireEvent.click(companyEditButton);

    expect(container.querySelector("[class=editCompany]")).toBeInTheDocument();

    // click the button again and the form should disappear
    fireEvent.click(companyEditButton);

    expect(
      container.querySelector("[class=editCompany]")
    ).not.toBeInTheDocument();
  });
});
