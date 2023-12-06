import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransporterForm } from "./TransporterForm";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import { FavoriteType, Transporter } from "codegen-ui";
import { formatDate } from "../../../../common/datetime";
import {
  FAVORITES,
  SEARCH_COMPANIES
} from "../../../common/queries/company/query";

const defaultTransporter: Transporter = {
  id: "clpju9r3c000dljj5gcpkvlgu",
  isExemptedOfReceipt: false,
  company: {
    siret: "38128881000033",
    orgId: "38128881000033",
    vatNumber: null,
    name: "TRANS EXPRESS",
    address: "QUELQUE PART",
    contact: "BG",
    country: "FR",
    mail: "hello+transporteur@trackdechets.fr",
    phone: "00 00 00 00 00"
  },
  receipt: "0101010101",
  department: "13",
  validityLimit: "2023-12-31T23:00:00.000Z"
};

const mocksFactory = (transporter: Transporter) => [
  {
    request: {
      query: SEARCH_COMPANIES,
      variables: {
        clue: transporter.company?.orgId
      }
    },
    result: () => {
      return {
        data: {
          searchCompanies: [
            {
              __typename: "CompanySearchResult",
              orgId: transporter?.company?.orgId,
              siret: transporter?.company?.siret,
              vatNumber: transporter?.company?.vatNumber,
              name: transporter?.company?.name,
              address: transporter?.company?.address,
              etatAdministratif: "A",
              codePaysEtrangerEtablissement: null,
              isRegistered: true,
              trackdechetsId: "cloo373tc000gljph1c11vtan",
              contact: transporter?.company?.contact,
              contactPhone: transporter?.company?.phone,
              contactEmail: transporter?.company?.mail,
              companyTypes: ["TRANSPORTER"],
              traderReceipt: null,
              brokerReceipt: null,
              transporterReceipt: {
                receiptNumber: transporter?.receipt,
                validityLimit: transporter?.validityLimit,
                department: transporter?.department
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

describe("TransporterForm", () => {
  afterEach(jest.resetAllMocks);

  type ComponentProps = {
    data: Transporter;
    mocks?: any;
  };

  const Component = ({ data, mocks }: ComponentProps) => (
    <MockedProvider mocks={mocks ?? mocksFactory(data)} addTypename={false}>
      <Formik initialValues={{ transporter: data }} onSubmit={jest.fn()}>
        <TransporterForm fieldName="transporter" orgId="88792840600024" />
      </Formik>
    </MockedProvider>
  );

  test("it renders correctly", () => {
    const { container } = render(Component({ data: defaultTransporter }));
    expect(container).toBeTruthy();
    const isExemptedOfReceiptInput = screen.getByText(
      "Le transporteur déclare être exempté de récépissé conformément aux dispositions de l'"
    );
    expect(isExemptedOfReceiptInput).toBeInTheDocument();
    const transportModeInput = screen.getByLabelText("Mode de transport");
    expect(transportModeInput).toBeInTheDocument();
    const plateInput = screen.getByLabelText("Immatriculation");
    expect(plateInput).toBeInTheDocument();
  });

  test("transporter recepisse info is displayed", () => {
    render(Component({ data: defaultTransporter }));
    expect(
      screen.getByText("Récépissé de déclaration de transport de déchets")
    ).toBeInTheDocument();
    const expected = `Numéro: ${defaultTransporter.receipt}, département: ${
      defaultTransporter?.department
    }, date limite de validité: ${formatDate(
      defaultTransporter.validityLimit!
    )}`;
    expect(screen.getByText(expected, { exact: false })).toBeInTheDocument();
  });

  test("transporter recepisse error is displayed if recepisse is not present", () => {
    render(
      Component({
        data: {
          ...defaultTransporter,
          receipt: null,
          department: null,
          validityLimit: null
        }
      })
    );
    expect(
      screen.getByText("Récépissé de déclaration de transport de déchets")
    ).toBeInTheDocument();
    const expected =
      "L'entreprise de transport n'a pas complété ces informations dans" +
      " son profil Trackdéchets. Nous ne pouvons pas les afficher. Il lui" +
      " appartient de les compléter.";
    expect(screen.getByText(expected, { exact: false })).toBeInTheDocument();
  });

  test("transporter recepisse is not displayed if company is foreign", () => {
    render(
      Component({
        data: {
          ...defaultTransporter,
          company: {
            ...defaultTransporter.company,
            siret: null,
            orgId: "IT13029381004",
            vatNumber: "IT13029381004"
          }
        }
      })
    );
    expect(
      screen.queryByText("Récépissé de déclaration de transport de déchets")
    ).not.toBeInTheDocument();
  });

  test("transporter recepisse is updated based on searchCompanies result", async () => {
    render(
      Component({
        data: defaultTransporter,
        mocks: mocksFactory({
          ...defaultTransporter,
          receipt: "NOUVEAU-RECEPISSE",
          department: "NOUVEAU-DEPARTEMENT",
          validityLimit: "2024-10-11"
        })
      })
    );
    const expected = `Numéro: NOUVEAU-RECEPISSE, département: NOUVEAU-DEPARTEMENT, date limite de validité: ${formatDate(
      "2024-10-11"
    )}`;

    expect(
      await screen.findByText(expected, { exact: false })
    ).toBeInTheDocument();
  });

  test("transporter contact info is NOT updated based on searchCompanies result", async () => {
    render(
      Component({
        data: defaultTransporter,
        mocks: mocksFactory({
          ...defaultTransporter,
          company: {
            ...defaultTransporter.company,
            contact: "NOUVEAU-CONTACT",
            phone: "NOUVEAU-TELEPHONE",
            mail: "NOUVEL-EMAIL"
          }
        })
      })
    );

    await expect(() =>
      screen.findByDisplayValue("NOUVEAU-CONTACT", { exact: false })
    ).rejects.toThrow();
    await expect(() =>
      screen.findByDisplayValue("NOUVEAU-TELEPHONE", { exact: false })
    ).rejects.toThrow();
    await expect(() =>
      screen.findByDisplayValue("NOUVEL-EMAIL", { exact: false })
    ).rejects.toThrow();
  });

  test("contact info and transporter receipt should be auto-completed when another company is selected", async () => {
    const mocks = [
      ...mocksFactory(defaultTransporter),
      {
        request: {
          query: SEARCH_COMPANIES,
          variables: {
            clue: "CODE EN STOCK"
          }
        },
        result: () => {
          return {
            data: {
              searchCompanies: [
                {
                  __typename: "CompanySearchResult",
                  orgId: "85001946400021",
                  siret: "85001946400021",
                  vatNumber: null,
                  name: "CODE EN STOCK",
                  address: "quelque part",
                  etatAdministratif: "A",
                  codePaysEtrangerEtablissement: null,
                  isRegistered: true,
                  trackdechetsId: "clpibhy5y0002lj9ar30nilpl",
                  contact: "NOUVEAU-CONTACT",
                  contactPhone: "NOUVEAU-TELEPHONE",
                  contactEmail: "NOUVEAU-EMAIL",
                  companyTypes: ["PRODUCER"],
                  traderReceipt: null,
                  brokerReceipt: null,
                  transporterReceipt: {
                    receiptNumber: "NOUVEAU-RECEPISSE",
                    validityLimit: "2024-10-11",
                    department: "NOUVEAU-DEPARTEMENT"
                  },
                  vhuAgrementDemolisseur: null,
                  vhuAgrementBroyeur: null,
                  workerCertification: null
                }
              ]
            }
          };
        }
      },
      {
        request: {
          query: FAVORITES(FavoriteType.Transporter),
          variables: {
            orgId: "88792840600024",
            type: "TRANSPORTER",
            allowForeignCompanies: true
          }
        },
        result: () => ({
          data: { __typename: "CompanySearchResult", favorites: [] }
        })
      }
    ];
    render(
      Component({
        data: defaultTransporter,
        mocks
      })
    );
    const searchInput = screen.getByLabelText(
      "N°SIRET ou n°TVA intracom ou raison sociale"
    );

    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "CODE EN STOCK" } });

    const searchResult = await screen.findByText("85001946400021", {});
    expect(searchResult).toBeInTheDocument();

    fireEvent.click(searchResult);

    const newRecepisse = await screen.findByText(
      `Numéro: NOUVEAU-RECEPISSE, département: NOUVEAU-DEPARTEMENT, date limite de validité: ${formatDate(
        "2024-10-11"
      )}`,
      { exact: false }
    );

    expect(newRecepisse).toBeInTheDocument();

    expect(
      await screen.findByDisplayValue("NOUVEAU-CONTACT", { exact: false })
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue("NOUVEAU-TELEPHONE", { exact: false })
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue("NOUVEAU-EMAIL", { exact: false })
    ).toBeInTheDocument();
  });
});
