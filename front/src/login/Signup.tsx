import { ErrorMessage, Field, Form, Formik, FormikActions } from "formik";
import React from "react";
import { Mutation, MutationFn } from "react-apollo";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import { SIGNUP } from "./mutations";
import { localAuthService } from "./auth.service";

type Values = {};
const handleSumbit = (
  payload: Values,
  props: FormikActions<Values> & { signup: MutationFn } & RouteComponentProps
) => {
  props.signup({ variables: { payload } }).then(response => {
    response && localAuthService.locallyAutheticate(response.data.signup.token);
    props.history.push("/signup/details");
  });
};

export default withRouter(function Signup(routerProps: RouteComponentProps) {
  return (
    <Mutation mutation={SIGNUP}>
      {signup => (
        <Formik
          initialValues={{
            email: "",
            name: "",
            phone: "",
            password: "",
            passwordConfirmation: "",
            siret: ""
          }}
          onSubmit={(values, formikActions) => {
            const { passwordConfirmation, ...payload } = values;
            handleSumbit(payload, { ...routerProps, ...formikActions, signup });
          }}
          validate={values => {
            let errors: any = {};
            if (values.password !== values.passwordConfirmation) {
              errors.passwordConfirmation =
                "Les deux mots de passe ne sont pas identiques.";
            }

            !values.email ? (errors.email = "L'email est obligatoire") : null;
            !values.name
              ? (errors.name = "Le nom et prénom sont obligatoires")
              : null;

            values.siret.replace(/\s/g, "").length !== 14
              ? (errors.siret = "Le SIRET doit faire 14 caractères")
              : null;

            return errors;
          }}
        >
          {({ isSubmitting }) => (
            <div className="container">
              <Form>
                <h1>Inscription à Trackdéchets</h1>
                <p>
                  Trackdéchets est destiné à simplifier l'édition d'un bordereau
                  de déchet et à transmettre les informations dématérialisée
                  pour validation.
                </p>

                <p>
                  Il va dans un premier temps être utilisé
                  entre un producteur et un collecteur et/ou un producteur et
                  une installation de traitement.
                </p>

                <p>
                  C'est un produit libre d'utilisation et utilisable
                  par tous les acteurs de la filière déchets.
                </p>

                <p>
                  Trackdéchets permet également de s'assurer qu'une entreprise
                  est bien autorisée pour effectuer la collecte ou le traitement
                  d'un déchet (dangereux)
                </p>
                <div className="form__group">
                  <label>
                    Email*
                    <Field type="text" name="email" />
                  </label>

                  <ErrorMessage name="email" component="div" />
                </div>

                <div className="form__group">
                  <label>
                    Nom et prénom*
                    <Field type="text" name="name" />
                  </label>

                  <ErrorMessage name="name" component="div" />
                </div>

                <div className="form__group">
                  <label>
                    Téléphone
                    <Field type="text" name="phone" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Mot de passe
                    <Field type="password" name="password" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Vérification du mot de passe
                    <Field type="password" name="passwordConfirmation" />
                  </label>
                </div>

                <ErrorMessage name="passwordConfirmation" component="div" />

                <div className="form__group">
                  <label>
                    Numéro SIRET de l'entreprise que vous administrez
                    <Field type="text" name="siret" />
                  </label>

                  <ErrorMessage name="siret" component="div" />
                </div>

                <button
                  className="button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  S'inscrire
                </button>

                <p>
                  Vous avez déjà un compte ?{" "}
                  <Link to="/login">Connectez vous maintenant</Link>
                </p>
              </Form>
            </div>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
