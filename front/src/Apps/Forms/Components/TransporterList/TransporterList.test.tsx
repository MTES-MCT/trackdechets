import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransporterList } from "./TransporterList";
import { Formik } from "formik";
import { MockedProvider } from "@apollo/client/testing";
import {
  CreateOrUpdateTransporterInput,
  initialFormTransporter
} from "../../../../form/bsdd/utils/initial-state";
import { TransportMode } from "@td/codegen-ui";

describe("<TransporterList />", () => {
  const mocks = [];

  const component = (transporters: CreateOrUpdateTransporterInput[]) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      <Formik initialValues={{ transporters }} onSubmit={jest.fn()}>
        <TransporterList fieldName="transporters" />
      </Formik>
    </MockedProvider>
  );

  test("component renders without errors", () => {
    const { container } = render(component([initialFormTransporter]));
    expect(container).toBeTruthy();
  });

  test("delete button is disabled when there is only one transporter", () => {
    render(component([initialFormTransporter]));
    const addButton = screen.getByTitle("Supprimer");
    expect(addButton).toBeDisabled();
  });

  test("up button is disabled when there is only one transporter", () => {
    render(component([initialFormTransporter]));
    const upButton = screen.getByTitle("Remonter");
    expect(upButton).toBeDisabled();
  });

  test("down button is disabled when there is only one transporter", () => {
    render(component([initialFormTransporter]));
    const downButton = screen.getByTitle("Descendre");
    expect(downButton).toBeDisabled();
  });

  test("new transporters can be added until 5", async () => {
    render(component([initialFormTransporter]));
    const addButton = screen.getByTitle("Ajouter");
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    const transporter1 = await screen.findByText("1 - Transporteur");
    const transporter2 = await screen.findByText("2 - Transporteur");
    const transporter3 = await screen.findByText("3 - Transporteur");
    const transporter4 = await screen.findByText("4 - Transporteur");
    const transporter5 = await screen.findByText("5 - Transporteur");
    expect(transporter1).toBeInTheDocument();
    expect(transporter2).toBeInTheDocument();
    expect(transporter3).toBeInTheDocument();
    expect(transporter4).toBeInTheDocument();
    expect(transporter5).toBeInTheDocument();
    fireEvent.click(addButton);
    await expect(() => screen.findByText("6 - Transporteur")).rejects.toThrow();
    const addButtons = screen.getAllByTitle("Ajouter");
    addButtons.forEach(b => expect(b).toBeDisabled());
  });

  test("transporters can be deleted with the delete button", async () => {
    render(component([initialFormTransporter, initialFormTransporter]));
    expect(await screen.findByText("1 - Transporteur")).toBeInTheDocument();
    expect(await screen.findByText("2 - Transporteur")).toBeInTheDocument();
    const deleteButtons = screen.getAllByTitle("Supprimer");
    fireEvent.click(deleteButtons[1]);
    expect(await screen.findByText("1 - Transporteur")).toBeInTheDocument();
    await expect(() => screen.findByText("2 - Transporteur")).rejects.toThrow();
  });

  test("up button is disabled for the first transporter", async () => {
    render(component([initialFormTransporter, initialFormTransporter]));
    const upButtons = screen.getAllByTitle("Remonter");
    expect(upButtons[0]).toBeDisabled();
    expect(upButtons[1]).not.toBeDisabled();
  });

  test("down button is disabled for the last transporter", async () => {
    render(component([initialFormTransporter, initialFormTransporter]));
    const upButtons = screen.getAllByTitle("Descendre");
    expect(upButtons[0]).not.toBeDisabled();
    expect(upButtons[1]).toBeDisabled();
  });

  test("accordions are folded by default when there is several transporters", () => {
    render(component([initialFormTransporter, initialFormTransporter]));
    const unfoldButtons = screen.getAllByTitle("Déplier");
    expect(unfoldButtons).toHaveLength(2);
  });

  test("accordion is expanded by default when there is only one transporter", () => {
    render(component([initialFormTransporter]));
    const foldButton = screen.getByTitle("Replier");
    expect(foldButton).toBeInTheDocument();
  });

  test("only one accordion can be expanded at once", async () => {
    render(component([initialFormTransporter, initialFormTransporter]));
    const expandButtons = screen.getAllByTitle("Déplier");
    expect(expandButtons).toHaveLength(2);
    fireEvent.click(expandButtons[0]);
    fireEvent.click(expandButtons[1]);
    const foldButtons = screen.getAllByTitle("Replier");
    expect(foldButtons).toHaveLength(1);
  });

  test("transporter detail is displayed when the transporter has already signed", () => {
    const transporter1: CreateOrUpdateTransporterInput = {
      id: "id",
      mode: TransportMode.Road,
      isExemptedOfReceipt: false,
      company: {
        siret: "11111111111111",
        name: "Transport qui roule",
        contact: "Mr T",
        phone: "01 01 01 01 01",
        mail: "contact@transportquiroule.fr",
        address: "Somewhere"
      },
      receipt: "Rec",
      department: "07",
      validityLimit: new Date().toISOString(),
      takenOverAt: new Date().toISOString(),
      numberPlate: "FOO"
    };

    render(
      component([
        transporter1,
        { ...initialFormTransporter },
        { ...initialFormTransporter }
      ])
    );

    expect(screen.getByText("Raison sociale")).toBeInTheDocument();
    expect(screen.getByText(transporter1.company!.name!)).toBeInTheDocument();

    expect(screen.getByText("SIRET")).toBeInTheDocument();
    expect(screen.getByText(transporter1.company!.siret!)).toBeInTheDocument();

    expect(screen.getByText("Adresse")).toBeInTheDocument();
    expect(
      screen.getByText(transporter1.company!.address!)
    ).toBeInTheDocument();

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(
      screen.getByText(transporter1.company!.contact!)
    ).toBeInTheDocument();

    expect(screen.getAllByText("Téléphone")).toHaveLength(3);
    expect(screen.getByText(transporter1.company!.phone!)).toBeInTheDocument();

    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText(transporter1.company!.mail!)).toBeInTheDocument();

    expect(screen.getByText("Récépissé n°")).toBeInTheDocument();
    expect(screen.getByText(transporter1.receipt!)).toBeInTheDocument();

    expect(screen.getByText("Récépissé département")).toBeInTheDocument();
    expect(screen.getByText(transporter1.department!)).toBeInTheDocument();

    expect(screen.getByText("Récépissé valide jusqu'au")).toBeInTheDocument();
    expect(screen.getAllByText("Mode de transport")).toHaveLength(3);
    expect(screen.getAllByText("Immatriculation")).toHaveLength(3);
    expect(screen.getByText(transporter1.numberPlate!)).toBeInTheDocument();

    expect(screen.getByText("Date de prise en charge")).toBeInTheDocument();
    const deleteButtons = screen.getAllByTitle("Supprimer");
    expect(deleteButtons[0]).toBeDisabled();
    const upButtons = screen.getAllByTitle("Remonter");
    expect(upButtons[0]).toBeDisabled();
    // on ne peut pas permuter un transporteur qui a déjà signé
    expect(upButtons[1]).toBeDisabled();
  });

  test("Add button is disabled when next transporter has already signed", async () => {
    const transporter1: CreateOrUpdateTransporterInput = {
      id: "id",
      mode: TransportMode.Road,
      isExemptedOfReceipt: false,
      company: {
        siret: "11111111111111",
        name: "Transporteur 1",
        contact: "Mr T1",
        phone: "01 01 01 01 01",
        mail: "contact@ttransporter1.fr",
        address: "Somewhere"
      },
      receipt: "Rec",
      department: "07",
      validityLimit: new Date().toISOString(),
      takenOverAt: new Date().toISOString(),
      numberPlate: "FOO"
    };

    const transporter2: CreateOrUpdateTransporterInput = {
      id: "id",
      mode: TransportMode.Road,
      isExemptedOfReceipt: false,
      company: {
        siret: "22222222222222",
        name: "Transporteur 2",
        contact: "Mr T2",
        phone: "01 01 01 01 01",
        mail: "contact@transporter2.fr",
        address: "Somewhere"
      },
      receipt: "Rec",
      department: "07",
      validityLimit: new Date().toISOString(),
      takenOverAt: new Date().toISOString(),
      numberPlate: "FOO"
    };

    render(component([transporter1, transporter2]));
    const addButtons = screen.getAllByTitle("Ajouter");
    expect(addButtons[0]).toBeDisabled();
    expect(addButtons[1]).not.toBeDisabled();
  });
});
