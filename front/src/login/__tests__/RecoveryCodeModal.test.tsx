import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecoveryCodeModal from "../RecoveryCodeModal";

function renderModal(
  props: Partial<React.ComponentProps<typeof RecoveryCodeModal>> = {}
) {
  return render(<RecoveryCodeModal onClose={jest.fn()} {...props} />);
}

describe("<RecoveryCodeModal />", () => {
  it("displays the two radio options", () => {
    renderModal();

    expect(
      screen.getByLabelText(/Soit réinitialiser votre authentification/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Soit utiliser ce code pour vous connecter/)
    ).toBeInTheDocument();
  });

  it("blocks submission and shows a message when no option is selected", () => {
    renderModal();

    const codeInput = screen.getByLabelText("Clé de récupération");
    fireEvent.change(codeInput, {
      target: { value: "ABCDE-FGHIJ-KLMNO-PQRST" }
    });

    fireEvent.click(screen.getByText("Se connecter"));

    expect(
      screen.getByText("Merci de sélectionner une option pour poursuivre.")
    ).toBeInTheDocument();
  });

  it("clears the selection error once an option is picked", () => {
    renderModal();

    const codeInput = screen.getByLabelText("Clé de récupération");
    fireEvent.change(codeInput, {
      target: { value: "ABCDE-FGHIJ-KLMNO-PQRST" }
    });
    fireEvent.click(screen.getByText("Se connecter"));
    expect(
      screen.getByText("Merci de sélectionner une option pour poursuivre.")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(/Soit réinitialiser votre authentification/)
    );

    expect(
      screen.queryByText("Merci de sélectionner une option pour poursuivre.")
    ).not.toBeInTheDocument();
  });

  it("reflects the RESET selection in the hidden recoveryAction field", () => {
    renderModal();

    fireEvent.click(
      screen.getByLabelText(/Soit réinitialiser votre authentification/)
    );

    const hiddenInput = document.querySelector(
      'input[name="recoveryAction"]'
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe("RESET");
  });

  it("reflects the TEMPORARY selection in the hidden recoveryAction field", () => {
    renderModal();

    fireEvent.click(
      screen.getByLabelText(/Soit utiliser ce code pour vous connecter/)
    );

    const hiddenInput = document.querySelector(
      'input[name="recoveryAction"]'
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe("TEMPORARY");
  });

  it("displays the 2 remaining attempts counter", () => {
    renderModal({ errorCode: "INVALID_RECOVERY_CODE", attemptsRemaining: 2 });

    expect(
      screen.getByText(/Il vous reste 2 tentatives\./)
    ).toBeInTheDocument();
  });

  it("displays the 1 remaining attempt counter with singular wording", () => {
    renderModal({ errorCode: "INVALID_RECOVERY_CODE", attemptsRemaining: 1 });

    expect(screen.getByText(/Il vous reste 1 tentative\./)).toBeInTheDocument();
    expect(
      screen.queryByText(/Il vous reste 1 tentatives\./)
    ).not.toBeInTheDocument();
  });

  it("displays the 1h suspension message on lockout", () => {
    renderModal({ errorCode: "RECOVERY_LOCKOUT" });

    expect(
      screen.getByText(/temporairement suspendue pendant 1h/)
    ).toBeInTheDocument();
  });

  it("masks the recovery code field by default", () => {
    renderModal();

    const codeInput = screen.getByLabelText(
      "Clé de récupération"
    ) as HTMLInputElement;
    expect(codeInput.type).toBe("password");
  });
});
