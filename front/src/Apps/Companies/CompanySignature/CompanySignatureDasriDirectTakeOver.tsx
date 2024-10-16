import React, { useState } from "react";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationUpdateCompanyArgs
} from "@td/codegen-ui";
import { useMutation } from "@apollo/client";
import { UPDATE_DASRI_DIRECT_TAKEOVER } from "../common/queries";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { InlineLoader } from "../../common/Components/Loader/Loaders";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

import "./companySignature.scss";

interface CompanySignatureDasriDirectTakeOverProps {
  company: CompanyPrivate;
}
const CompanySignatureDasriDirectTakeOver = ({
  company
}: CompanySignatureDasriDirectTakeOverProps) => {
  const [allowDirectTakeOver, setAllowDirectTakeOver] = useState(
    company.allowBsdasriTakeOverWithoutSignature
  );
  const isAdmin = company.userRole === UserRole.Admin;

  const [updateDirectTakeOver, { loading }] = useMutation<
    Pick<Mutation, "updateCompany">,
    MutationUpdateCompanyArgs
  >(UPDATE_DASRI_DIRECT_TAKEOVER, {
    onCompleted: () => {
      toast.success("Paramètre enregistré", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "Une erreur s'est produite. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
      setAllowDirectTakeOver(allowDirectTakeOver => !allowDirectTakeOver);
    }
  });

  const onChangeSwitch = checked => {
    setAllowDirectTakeOver(checked);
    updateDirectTakeOver({
      variables: {
        id: company.id,
        allowBsdasriTakeOverWithoutSignature: checked
      }
    });
  };

  return (
    <div className="company-signature__takeover">
      <h3 className="fr-h4">Emport direct de DASRI</h3>
      {isAdmin ? (
        <ToggleSwitch
          label="Mon établissement produit des DASRI. Je dispose d’une convention avec un collecteur et j’accepte que ce collecteur prenne en charge mes DASRI sans ma signature lors de la collecte si je ne suis pas disponible."
          checked={allowDirectTakeOver}
          onChange={checked => onChangeSwitch(checked)}
        />
      ) : (
        <p className="fr-text">
          {company.allowBsdasriTakeOverWithoutSignature
            ? "Autorisé"
            : "Non autorisé"}
        </p>
      )}
      {loading && <InlineLoader />}
      <br />
      <hr />
    </div>
  );
};

export default CompanySignatureDasriDirectTakeOver;
