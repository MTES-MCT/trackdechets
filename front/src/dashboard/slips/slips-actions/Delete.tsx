import React from "react";
import { FaTrash } from "react-icons/fa";
import { Mutation } from "react-apollo";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { Form } from "../../../form/model";

type Props = { formId: string };

export default function Delete({ formId }: Props) {
  return (
    <Mutation mutation={mutations.DELETE_FORM}>
      {(deleteForm, { error }) => (
        <a
          className="icon"
          onClick={() =>
            deleteForm({
              variables: { id: formId },
              update: (store, { data: { deleteForm } }) => {
                const data = store.readQuery<{ forms: Form[] }>({
                  query: GET_SLIPS
                });
                if (!data || !data.forms) {
                  return;
                }
                data.forms = data.forms.filter(f => f.id !== deleteForm.id);
                store.writeQuery({ query: GET_SLIPS, data });
              }
            })
          }
        >
          <FaTrash />
        </a>
      )}
    </Mutation>
  );
}
