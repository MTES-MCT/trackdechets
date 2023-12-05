import React from "react";
import { render, screen } from "@testing-library/react";
import { TransporterForm } from "./TransporterForm";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import { Transporter } from "codegen-ui/src";

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

describe("TransporterForm", () => {
  afterEach(jest.resetAllMocks);

  const Component = (data: Transporter) => (
    <MockedProvider mocks={[]} addTypename={false}>
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
});
