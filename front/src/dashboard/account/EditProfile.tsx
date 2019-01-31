import { Field, Form, Formik } from "formik";
import React from "react";
import { Me } from "../../login/model";
import "./EditProfile.scss";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";

const EDIT_PROFILE = gql`
  mutation EditProfile($name: String!, $phone: String!, $email: String!) {
    editProfile(name: $name, phone: $phone, email: $email) {
      id
    }
  }
`;

type Props = { me: Me; onSubmit: () => void };
export default function EditProfile({ me, onSubmit }: Props) {
  return (
    <div className="EditProfile">
      <Mutation mutation={EDIT_PROFILE}>
        {(editProfile, { data }) => (
          <Formik
            initialValues={{ name: me.name, email: me.email, phone: me.phone }}
            onSubmit={(values, { setSubmitting }) => {
              editProfile({ variables: values }).then(_ => {
                setSubmitting(false);
                onSubmit();
              });
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form__group">
                  <label>
                    Nom
                    <Field type="text" name="name" />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Email
                    <Field type="email" name="email" disabled />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Téléphone
                    <Field type="text" name="phone" />
                  </label>
                </div>
                <button
                  type="submit"
                  className="button"
                  disabled={isSubmitting}
                >
                  Enregistrer
                </button>
              </Form>
            )}
          </Formik>
        )}
      </Mutation>
    </div>
  );
}
