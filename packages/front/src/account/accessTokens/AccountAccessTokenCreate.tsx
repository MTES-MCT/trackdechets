import * as React from "react";
import { Modal, RedErrorMessage } from "common/components";
import { NewAccessToken } from "@trackdechets/codegen/src/front.gen";
import { useMutation } from "@apollo/client";
import { CREATE_ACCESS_TOKEN } from "./queries";
import { NotificationError } from "common/components/Error";
import { Field, Form, Formik } from "formik";
import styles from "../fields/AccountField.module.scss";
import TdTooltip from "common/components/Tooltip";
import * as yup from "yup";

type AccountAccessTokenCreateProps = {
  onClose: (token: NewAccessToken | null) => void;
};

export default function AccountAccessTokenCreate({
  onClose
}: AccountAccessTokenCreateProps) {
  const [createAccessToken, { loading, error }] = useMutation(
    CREATE_ACCESS_TOKEN,
    {
      onCompleted: data => {
        onClose(data.createAccessToken);
      }
    }
  );

  function onSubmit({ description }) {
    return createAccessToken({ variables: { input: { description } } });
  }

  const validationSchema = yup.object({ description: yup.string().required() });

  return (
    <Modal
      ariaLabel="Générer un jeton d'accès"
      onClose={() => onClose(null)}
      isOpen
    >
      <div>Créer un jeton d'accès</div>
      <Formik
        initialValues={{ description: "" }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        <Form>
          <div className={styles.field}>
            <label className={`text-right`}>
              <span>Description</span>{" "}
              <TdTooltip msg="À quoi ce token va t-il servir (test, script, etc) ?" />
            </label>
            <div className={styles.field__value}>
              <Field name="description" type="text" className="td-input" />
              <RedErrorMessage name="description" />
            </div>
          </div>
          <div className="td-modal-actions">
            <button
              className="btn btn--outline-primary"
              onClick={() => onClose(null)}
            >
              Annuler
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Création..." : "Générer un jeton d'accès"}
            </button>
          </div>
        </Form>
      </Formik>
      {error && <NotificationError apolloError={error} />}
    </Modal>
  );
}
