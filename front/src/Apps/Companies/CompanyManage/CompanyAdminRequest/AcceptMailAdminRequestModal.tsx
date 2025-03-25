import React, { useEffect } from "react";
import TdModal from "../../../common/Components/Modal/Modal";
import {
  QueryAdminRequestArgs,
  Query,
  Mutation,
  MutationAcceptAdminRequestArgs
} from "@td/codegen-ui";
import { useMutation, useQuery } from "@apollo/client";
import {
  ACCEPT_ADMIN_REQUEST,
  ADMIN_REQUEST
} from "../../../common/queries/adminRequest/adminRequest";
import { useForm } from "react-hook-form";
import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { isDefined } from "../../../../common/helper";
import toast from "react-hot-toast";
import Alert from "@codegouvfr/react-dsfr/Alert";

interface AcceptMailAdminRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AcceptAdminRequestFormInputs {
  orgId: string | undefined;
  code: string | undefined;
}

export const AcceptMailAdminRequestModal = ({
  isOpen,
  onClose
}: AcceptMailAdminRequestModalProps) => {
  const { refetch } = useQuery<
    Pick<Query, "adminRequest">,
    QueryAdminRequestArgs
  >(ADMIN_REQUEST, { skip: true });

  const [acceptAdminRequest, { loading: loadingAccept, error: errorAccept }] =
    useMutation<
      Pick<Mutation, "acceptAdminRequest">,
      MutationAcceptAdminRequestArgs
    >(ACCEPT_ADMIN_REQUEST);

  const { register, setValue, watch } = useForm<AcceptAdminRequestFormInputs>({
    defaultValues: {
      orgId: undefined,
      code: undefined
    }
  });

  const orgId = watch("orgId");
  const code = watch("code");

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`orgId`);
  }, [register]);

  const onSubmit = async () => {
    await acceptAdminRequest({
      variables: {
        input: {
          orgId,
          code
        }
      },
      onCompleted: data => {
        toast.success("Demande validée!");
        refetch({ adminRequestId: data.acceptAdminRequest.id });
        onClose();
      }
    });
  };

  return (
    <TdModal
      onClose={onClose}
      title="Attribuer les droits administrateur"
      ariaLabel="Attribuer les droits administrateur"
      size="L"
      isOpen={isOpen}
    >
      <div className="fr-mb-4w">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </div>

      <div>
        <CompanySelectorWrapper
          orgId={orgId}
          selectedCompanyOrgId={orgId}
          onCompanySelected={company => {
            if (company) {
              setValue(`orgId`, company.orgId);
            } else {
              setValue(`orgId`, undefined);
            }
          }}
        />
      </div>

      <div className="fr-mb-4w">
        <Input
          label="Code d'activation"
          nativeInputProps={{
            required: true,
            minLength: 8,
            maxLength: 8,
            ...register("code")
          }}
        />
      </div>

      {errorAccept && (
        <div>
          <Alert
            className="fr-mt-3w"
            small
            description={errorAccept.message}
            severity="error"
          />
        </div>
      )}

      <div className="td-modal-actions">
        <Button priority="secondary" onClick={onClose}>
          Annuler
        </Button>

        <Button
          priority="primary"
          onClick={onSubmit}
          iconId="fr-icon-check-line"
          iconPosition="right"
          disabled={loadingAccept || !isDefined(orgId) || !isDefined(code)}
          type="submit"
        >
          Valider
        </Button>
      </div>
    </TdModal>
  );
};
