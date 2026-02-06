import React from "react";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationRenewSecurityCodeArgs
} from "@td/codegen-ui";
import "./companySignature.scss";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { RENEW_SECURITY_CODE } from "../common/queries";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { InlineLoader } from "../../common/Components/Loader/Loaders";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

interface CompanySignatureCodeProps {
  company: CompanyPrivate;
}

const confirmModal = createModal({
  id: "signature-renew-modal",
  isOpenedByDefault: false
});

const CompanySignatureCode = ({ company }: CompanySignatureCodeProps) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [renewSecurityCode, { loading }] = useMutation<
    Pick<Mutation, "renewSecurityCode">,
    MutationRenewSecurityCodeArgs
  >(RENEW_SECURITY_CODE, {
    onCompleted: () => {
      toast.success("Code signature renouvelé", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "Une erreur s'est produite. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
    }
  });

  const onClickRenewCode = () => {
    confirmModal.open();
  };

  if (company.userRole === UserRole.Driver) {
    return null;
  }

  return (
    <div className="company-signature__code">
      <h3 className="fr-h4">Code signature</h3>
      {isAdmin && (
        <p className="fr-text--sm">
          Ce code sécurisé de signature vous permet de signer un BSD au départ
          de vos déchets sur l'outil (smartphone / tablette) du transporteur. Ce
          numéro est unique et confidentiel.
        </p>
      )}
      <p className="fr-text fr-mb-2w" data-testid="company-security-code">
        {isAdmin ? <b>{company.securityCode}</b> : company.securityCode}
      </p>
      {isAdmin && (
        <p>
          <Button
            priority="primary"
            size="small"
            nativeButtonProps={{
              type: "button",
              "data-testid": "company-signature-renew"
            }}
            disabled={loading}
            onClick={onClickRenewCode}
          >
            Renouveler
          </Button>
        </p>
      )}
      {loading && <InlineLoader data-testId="company-security-code-loader" />}
      {isAdmin && (
        <confirmModal.Component
          title={`Renouveler la signature`}
          iconId="fr-icon-warning-line"
          buttons={[
            {
              children: "Ne pas renouveler"
            },
            {
              iconId: "ri-check-line",
              nativeButtonProps: {
                "data-testid": "signature-renew-modal-button"
              },
              onClick: () => {
                renewSecurityCode({
                  variables: {
                    siret: company.orgId!
                  }
                });
              },
              children: "Renouveler"
            }
          ]}
        >
          Attention, un nouveau code de signature va vous être attribué de façon
          aléatoire. Vous veillerez à en informer les personnes en charge de la
          validation du BSD auprès du transporteur. Il est prudent de le
          renouveler si vous pensez qu'il est connu d'un tiers. Le nombre de
          renouvellement par minute est limité.
        </confirmModal.Component>
      )}
      <br />
      <hr />
    </div>
  );
};

export default CompanySignatureCode;
