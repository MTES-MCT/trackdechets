import * as React from "react";
import { Formik, Form, Field } from "formik";
import toast from "react-hot-toast";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationReindexBsdsArgs } from "@td/codegen-ui";
import { TOAST_DURATION } from "../../common/config";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

const REINDEX_BSDS = gql`
  mutation reindexBsds($ids: String!) {
    reindexBsds(ids: $ids) {
      accepted
      rejected
    }
  }
`;

const getSuccessMessage = ({
  accepted = [],
  rejected = []
}: {
  accepted?: string[];
  rejected?: string[];
}) => {
  let msg = "";

  if (accepted.length) {
    msg += `BSD ré-indexé(s) avec succès: \n${accepted.join("\n")}\n\n`;
  }

  if (rejected.length) {
    msg += `BSD non ré-indexé(s): \n${rejected.join("\n")}`;
  }

  return msg;
};

function Reindex() {
  const [reindexBsd, { loading, error }] = useMutation<
    Pick<Mutation, "reindexBsds">,
    MutationReindexBsdsArgs
  >(REINDEX_BSDS);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // https://codesandbox.io/s/autosize-textarea-owwtu?from-embed=&file=/src/App.tsx
  const resizeTextArea = () => {
    if (textAreaRef && textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + "px";
    }
  };

  return (
    <div className="fr-px-4w fr-py-2w">
      <Formik
        initialValues={{
          ids: ""
        }}
        onReset={resizeTextArea}
        onSubmit={async (values, { resetForm }) => {
          const res = await reindexBsd({ variables: { ids: values.ids } });

          if (!!res?.data?.reindexBsds) {
            toast.success(getSuccessMessage(res.data.reindexBsds), {
              duration: TOAST_DURATION
            });

            resetForm();
          }
        }}
      >
        {values => (
          <Form>
            <Field name="ids">
              {({ field }) => {
                return (
                  <Input
                    textArea
                    label="ID du ou des BSD à réindexer:"
                    state={error ? "error" : "default"}
                    stateRelatedMessage={<>{error?.message}</>}
                    disabled={loading}
                    nativeTextAreaProps={{
                      ...field,
                      ref: textAreaRef,
                      onEmptied: resizeTextArea,
                      onChange: e => {
                        resizeTextArea();
                        field.onChange(e);
                      }
                    }}
                  />
                );
              }}
            </Field>

            <Button
              size="medium"
              type="submit"
              disabled={loading || !values.values.ids}
            >
              Réindexer
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Reindex;
