import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor
} from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { MockedProvider } from "@apollo/client/testing";
import { CompanyType } from "@td/codegen-ui";
import Reconditionnement from "./Reconditionnement";
import MyBsffCompanySelector, { GET_ME } from "./MyBsffComapnySelector";
import { useReconditioningContainers } from "./useReconditioningContainers";
import { ZodBsff } from "../schema";
import initialState from "../utils/initial-state";
import { ReconditioningContainer } from "../utils/reconditionnement";

jest.mock("./useReconditioningContainers", () => ({
  useReconditioningContainers: jest.fn()
}));

const container: ReconditioningContainer = {
  id: "source",
  numero: "B1",
  type: "BOUTEILLE",
  volume: 10,
  bsffId: "BSFF-source",
  acceptation: { wasteCode: "14 06 02*", weight: 5 },
  bsff: { emitter: null }
};

function Form() {
  const methods = useForm<ZodBsff>({
    defaultValues: { ...initialState, repackaging: [] }
  });
  return (
    <FormProvider {...methods}>
      <Reconditionnement />
      <output aria-label="Sélection confirmée">
        {JSON.stringify(methods.watch("repackaging"))}
      </output>
    </FormProvider>
  );
}

it("filters companies before auto-selection and confirms the temporary selection in RHF", async () => {
  // The mocked hook is the data boundary; production continues to use Apollo.
  jest.mocked(useReconditioningContainers).mockReturnValue({
    containers: [container],
    total: 1,
    loading: false,
    error: undefined
  });
  const companies = [
    {
      id: "producer",
      name: "Producteur",
      orgId: "11111111111111",
      siret: "11111111111111",
      companyTypes: [CompanyType.Producer]
    },
    {
      id: "collector",
      name: "Installation TTR",
      orgId: "22222222222222",
      siret: "22222222222222",
      companyTypes: [CompanyType.Collector]
    }
  ].map(company => ({
    ...company,
    givenName: null,
    vatNumber: null,
    contact: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    transporterReceipt: null
  }));
  render(
    <MockedProvider
      mocks={[
        {
          request: { query: GET_ME },
          result: { data: { me: { id: "user", companies } } }
        }
      ]}
      addTypename={false}
    >
      <Form />
    </MockedProvider>
  );
  const select = await screen.findByRole("combobox", {
    name: "Établissement concerné"
  });
  expect(
    screen.queryByRole("option", { name: /Producteur/ })
  ).not.toBeInTheDocument();
  await waitFor(() => expect(select).toHaveValue("22222222222222"));
  expect(
    screen.getByText(
      "Seuls les établissements avec des contenants en attente de retraitement sont éligibles"
    )
  ).toBeInTheDocument();
  expect(screen.getAllByRole("table")).toHaveLength(2);
  expect(screen.getByLabelText("Sélection confirmée")).toHaveTextContent("[]");
  fireEvent.click(
    within(
      screen.getByRole("table", { name: "Contenants disponibles" })
    ).getByRole("button", { name: "Ajouter" })
  );
  expect(screen.getByLabelText("Sélection confirmée")).toHaveTextContent("[]");
  fireEvent.click(
    screen.getByRole("button", { name: "Ajouter les contenants" })
  );
  expect(screen.getByLabelText("Sélection confirmée")).toHaveTextContent(
    "source"
  );
});

it("preserves unfiltered company auto-selection for the other journeys", async () => {
  const onChange = jest.fn();
  const company = {
    id: "producer",
    name: "Producteur",
    givenName: null,
    orgId: "11111111111111",
    siret: "11111111111111",
    vatNumber: null,
    contact: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    companyTypes: [CompanyType.Producer],
    transporterReceipt: null
  };
  render(
    <MockedProvider
      mocks={[
        {
          request: { query: GET_ME },
          result: { data: { me: { id: "user", companies: [company] } } }
        }
      ]}
      addTypename={false}
    >
      <MyBsffCompanySelector
        value={null}
        disabled={false}
        onChange={onChange}
      />
    </MockedProvider>
  );
  await screen.findByRole("option", { name: /Producteur/ });
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ siret: company.siret })
  );
});
