import * as React from "react";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import { WorkflowActionProps } from "../WorkflowAction";
import { SignedByTransporterModal } from "./SignedByTransporterModal";
import { ActionButton, Loader } from "common/components";
import { GET_FORM } from "form/bsdd/utils/queries";
import { useLazyQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { NotificationError } from "common/components/Error";

export function SignedByTransporter({ bsd }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [getBsdd, { error, data, loading }] = useLazyQuery<
    Pick<Query, "form">,
    QueryFormArgs
  >(GET_FORM, {
    variables: {
      id: bsd.id,
      readableId: null,
    },

    fetchPolicy: "network-only",
  });

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => {
          getBsdd();
          setIsOpen(true);
        }}
      >
        Signer l'enlèvement
      </ActionButton>
      {isOpen && loading && <Loader />}
      {isOpen && error && (
        <NotificationError className="action-error" apolloError={error} />
      )}
      {isOpen && !!data?.form && (
        <SignedByTransporterModal
          form={data.form}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
