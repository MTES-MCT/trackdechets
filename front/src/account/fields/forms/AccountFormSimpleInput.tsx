import React from "react";
import { Formik, Form, Field } from "formik";
import { useMutation } from "@apollo/react-hooks";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "./AccountForm.module.scss";
import * as Yup from "yup";

type Props = {
  name: string;
  type: string;
  value: string | null | undefined;
  placeHolder: string;
  mutation: any;
  yupSchema?: object;
  toggleEdition: () => void;
};

export default function AccountFormSimpleInput<Variables>({
  name,
  type,
  value,
  placeHolder,
  mutation,
  mutationArgs,
  yupSchema = Yup.object(),
  toggleEdition,
}: Props & { mutationArgs?: Variables }) {
  const [update, { loading }] = useMutation<any, Variables>(mutation, {
    onCompleted: () => {
      toggleEdition();
    },
  });

  const initialValues = {} as Variables;
  initialValues[name] = value;

  return (
    <Formik<Variables>
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        const variables = { ...values, ...mutationArgs };
        update({ variables }).catch(() => {
          setFieldError(name, "Erreur serveur");
          setSubmitting(false);
        });
      }}
      validateOnChange={false}
      validationSchema={yupSchema}
    >
      {props => (
        <Form>
          <div className="form__row">
            <Field
              className={`td-input ${styles.input}`}
              type={type}
              name={name}
              placeholder={placeHolder}
            />
          </div>
          {loading && <div>Envoi en cours...</div>}

          <RedErrorMessage name={name}>{props.errors[name]}</RedErrorMessage>

          <button
            className="btn btn--primary tw-mt-4"
            type="submit"
            disabled={props.isSubmitting}
          >
            Valider
          </button>
        </Form>
      )}
    </Formik>
  );
}
