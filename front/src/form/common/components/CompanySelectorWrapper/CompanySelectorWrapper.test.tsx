import React from "react";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import CompanySelectorWrapper from "./CompanySelectorWrapper";
import { SEARCH_COMPANIES } from "../../../../Apps/common/queries/company/query";

describe("CompanySelectorWrapper", () => {
  const testSiret = "85001946400021";
  const formOrgId = "38128881000033";

  const mocks = [
    {
      request: {
        query: SEARCH_COMPANIES,
        variables: {
          clue: formOrgId
        }
      },
      result: () => {
        return {
          data: {
            searchCompanies: [
              {
                __typename: "CompanySearchResult",
                orgId: formOrgId,
                siret: formOrgId,
                vatNumber: null,
                name: "TRANS MASSILIA",
                address: "69 RUE DU ROUET 13008 MARSEILLE 8",
                etatAdministratif: "A",
                codePaysEtrangerEtablissement: null,
                isRegistered: true,
                trackdechetsId: "cloo373tc000gljph1c11vtan",
                contact: "BG",
                contactPhone: "00 00 00 00 00",
                contactEmail: "hello+transporteur3@benoitguigal.fr",
                companyTypes: ["TRANSPORTER"],
                traderReceipt: null,
                brokerReceipt: null,
                transporterReceipt: {
                  receiptNumber: "receipt",
                  validityLimit: "2024-09-03T14:00:17.000Z",
                  department: "07"
                },
                vhuAgrementDemolisseur: null,
                vhuAgrementBroyeur: null,
                workerCertification: null
              }
            ]
          }
        };
      }
    }
  ];

  it("renders without errors", async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <CompanySelectorWrapper orgId={testSiret} />
      </MockedProvider>
    );
    expect(container).toBeTruthy();
  });

  it("should set selectedCompany at render if `formOrgId` is specified", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CompanySelectorWrapper orgId={testSiret} formOrgId={formOrgId} />
      </MockedProvider>
    );

    const companyLink = await screen.findByText("Lien vers la page entreprise");
    expect(companyLink).toBeInTheDocument();
    expect(companyLink).toHaveAttribute("href", `/company/${formOrgId}`);
  });
});
