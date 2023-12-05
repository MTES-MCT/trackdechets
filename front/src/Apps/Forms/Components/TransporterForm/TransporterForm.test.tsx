import React from "react";
import { render, screen } from "@testing-library/react";
import { TransporterForm } from "./TransporterForm";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import { Transporter } from "codegen-ui/src";
import { formatDate } from "../../../../common/datetime";
import { SEARCH_COMPANIES } from "../../../common/queries/company/query";

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

const mocks = (transporter: Transporter) => [
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

  const Component = (data: Transporter) => (
    <MockedProvider mocks={mocks(data)} addTypename={false}>
      <Formik initialValues={{ transporter: data }} onSubmit={jest.fn()}>
        <TransporterForm fieldName="transporter" orgId="38128881000033" />
      </Formik>
    </MockedProvider>
  );

  test("it renders correctly", () => {
    const { container } = render(Component(defaultTransporter));
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

  test("transporter receipt info is displayed", () => {
    render(Component(defaultTransporter));
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

  test("transporter receipt error is displayed if recepisse is not present", () => {
    render(
      Component({
        ...defaultTransporter,
        receipt: null,
        department: null,
        validityLimit: null
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

  test("transporter receipt is not displayed if company is foreign", () => {
    render(
      Component({
        ...defaultTransporter,
        company: {
          ...defaultTransporter.company,
          siret: null,
          orgId: "IT13029381004",
          vatNumber: "IT13029381004"
        }
      })
    );
    expect(
      screen.queryByText("Récépissé de déclaration de transport de déchets")
    ).not.toBeInTheDocument();
  });
});
