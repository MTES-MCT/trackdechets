import React from "react";
import { FaClone } from "react-icons/fa";
import { Mutation } from "@apollo/react-components";
import mutations from "./slip-actions.mutations";
import { GET_SLIPS } from "../query";
import { currentSiretService } from "../../CompanySelector";

type Props = { formId: string };

export default function Duplicate({ formId }: Props) {
  return (
    <Mutation mutation={mutations.DUPLICATE_FORM}>
      {(duplicate, { error }) => (
        <a
          className="icon"
          title="Dupliquer en brouillon"
          onClick={() =>
            duplicate({
              variables: { id: formId },
              update: (store, { data: { duplicateForm } }) => {

                const data = store.readQuery({
                  query: GET_SLIPS,
                  variables: { siret: currentSiretService.getSiret() }
                });
                if (!data || !data.forms) {
                  return;
                }
                store.writeQuery({
                  query: GET_SLIPS,
                  variables: { siret: currentSiretService.getSiret()},
                  data : {
                    forms: [...data.forms, duplicateForm]
                  }
                });
              }
            })
          }
        >
          <FaClone />
        </a>
      )}
    </Mutation>
  );
}
