import React from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

const ContactFormCtaFragment = ({ handleReset, handleSubmit, disabled }) => (
  <div className="contactForm__topActions__formCTA">
    <Button
      priority="secondary"
      size="small"
      nativeButtonProps={{ type: "button" }}
      onClick={handleReset}
    >
      Annuler
    </Button>
    <Button
      priority="primary"
      size="small"
      nativeButtonProps={{
        type: "button",
        "data-testid": "company-contact-submit"
      }}
      onClick={handleSubmit}
      disabled={disabled}
    >
      Valider
    </Button>
  </div>
);
export default ContactFormCtaFragment;
