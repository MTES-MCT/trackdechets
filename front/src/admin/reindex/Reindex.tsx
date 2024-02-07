import * as React from "react";
import { Formik, Form, Field } from "formik";
import toast from "react-hot-toast";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationReindexBsdsArgs } from "@td/codegen-ui";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { TOAST_DURATION } from "../../common/config";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";

const REINDEX_BSDS = gql`
  mutation reindexBsds($ids: String!) {
    reindexBsds(ids: $ids)
  }
`;
function Reindex() {
  const [reindexBsd, { loading, error }] = useMutation<
    Pick<Mutation, "reindexBsds">,
    MutationReindexBsdsArgs
  >(REINDEX_BSDS);

  // TODO: bigger input!

  return (
    <div className="fr-m-4w">
      <Formik
        initialValues={{
          ids: ""
        }}
        onSubmit={async (values, { resetForm }) => {
          const res = await reindexBsd({ variables: { ids: values.ids } });
          resetForm();
          !!res?.data?.reindexBsds
            ? toast.success(
                `Réindexation effectuée: ${res.data.reindexBsds.join(", ")}`,
                {
                  duration: TOAST_DURATION
                }
              )
            : toast.error(`Cet identifiant ne correspond pas à un bordereau`, {
                duration: TOAST_DURATION
              });
        }}
      >
        {() => (
          <Form>
            <Field name="ids">
              {({ field }) => {
                return (
                  <Input
                    textArea
                    label="ID du ou des BSD à réindexer:"
                    state={error ? "error" : "default"}
                    stateRelatedMessage={<>{error}</>}
                    disabled={loading}
                    nativeTextAreaProps={field}
                  />
                );
              }}
            </Field>

            <Button size="medium" type="submit" disabled={loading}>
              Réindexer
            </Button>

            {/* <div className="form__row">
              <label>
                ID du bsd à réindexer
                <Field
                  name="bsdid"
                  placeholder="BSD-20211215-12GH0E6TR"
                  className="td-input"
                />
              </label>
            </div>
            {error && <InlineError apolloError={error} />}
            <button
              type="submit"
              className="btn btn--primary tw-mt-1"
              disabled={loading}
            >
              {loading ? "Réindexation..." : "Réindexer"}
            </button> */}
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Reindex;
