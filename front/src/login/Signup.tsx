import ApolloClient from "apollo-client";
import { Field, Form, Formik, FormikActions } from "formik";
import React, { useState } from "react";
import { ApolloConsumer, Mutation, MutationFn } from "react-apollo";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";
import { Company } from "../form/company/CompanySelector";
import { COMPANY_INFOS } from "../form/company/query";
import RedErrorMessage from "../form/RedErrorMessage";
import { SIGNUP } from "./mutations";
import "./Signup.scss";
import UserType from "./UserType";

type Values = {};
const handleSumbit = (
  payload: Values,
  props: FormikActions<Values> & { signup: MutationFn } & RouteComponentProps
) => {
  props
    .signup({ variables: { payload } })
    .then(_ => props.history.push("/signup/details"))
    .catch(error => props.setStatus(error.message))
    .then(_ => props.setSubmitting(false));
};

export default withRouter(function Signup(routerProps: RouteComponentProps) {
  const [searchResult, setSearchResult] = useState<Company | null>(null);
  const searchCompanies = async (
    client: ApolloClient<Company>,
    clue: string
  ) => {
    if (clue.length < 14) {
      return;
    }

    const { data } = await client.query<{ companyInfos: Company }>({
      query: COMPANY_INFOS,
      variables: { siret: clue }
    });

    setSearchResult(data.companyInfos);

    return data.companyInfos.name === "" ? "Entreprise inconnue" : null;
  };

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
            siret: "",
            userType: [],
            isAllowed: false,
            cgu: false
          }}
          onSubmit={(values, formikActions) => {
            const { passwordConfirmation, isAllowed, cgu, ...payload } = values;
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

            !values.cgu
              ? (errors.cgu =
                  "Vous devez avoir lu les conditions générales d'utilisation")
              : null;
            !values.isAllowed
              ? (errors.isAllowed =
                  "Vous devez certifier être autorisé à créer ce compte pour votre entreprise")
              : null;

            return errors;
          }}
        >
          {({ isSubmitting, status }) => (
            <section className="section section-white">
              <div className="container">
                <Form>
                  <h1>Inscription à Trackdéchets</h1>
                  <p>
                    Trackdéchets est destiné à simplifier l'édition d'un
                    bordereau de déchet et à transmettre les informations
                    dématérialisée pour validation.
                  </p>

                  <p>
                    Il va dans un premier temps être utilisé entre un producteur
                    et un collecteur et/ou un producteur et une installation de
                    traitement.
                  </p>

                  <p>
                    C'est un produit libre d'utilisation et utilisable par tous
                    les acteurs de la filière déchets.
                  </p>

                  <p>
                    Trackdéchets permet également de s'assurer qu'une entreprise
                    est bien autorisée pour effectuer la collecte ou le
                    traitement d'un déchet (dangereux)
                  </p>
                  <div className="form__group">
                    <label>
                      Email*
                      <Field type="text" name="email" />
                    </label>

                    <RedErrorMessage name="email" />
                  </div>

                  <div className="form__group">
                    <label>
                      Nom et prénom*
                      <Field type="text" name="name" />
                    </label>

                    <RedErrorMessage name="name" />
                  </div>

                  <div className="form__group">
                    <label>
                      Téléphone
                      <Field type="text" name="phone" />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      Mot de passe*
                      <Field type="password" name="password" />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      Vérification du mot de passe*
                      <Field type="password" name="passwordConfirmation" />
                    </label>
                  </div>

                  <RedErrorMessage name="passwordConfirmation" />

                  <div className="form__group">
                    <label>
                      Numéro SIRET de l'entreprise que vous administrez*
                      <ApolloConsumer>
                        {client => (
                          <Field
                            type="text"
                            name="siret"
                            validate={(value: any) =>
                              searchCompanies(client, value)
                            }
                          />
                        )}
                      </ApolloConsumer>
                    </label>

                    {searchResult && searchResult.name != "" && (
                      <p>
                        Vous allez créer un compte pour l'entreprise{" "}
                        <strong>{searchResult.name}</strong>.
                      </p>
                    )}

                    <RedErrorMessage name="siret" />
                  </div>

                  <div className="form__group">
                    <label>
                      Vous êtes*
                      <Field name="userType" component={UserType} />
                    </label>
                  </div>

                  <div className="form__group">
                    <label>
                      <Field name="isAllowed" type="checkbox" />
                      Je certifie disposer du pouvoir pour créer un compte au
                      nom de mon entreprise*
                    </label>

                    <RedErrorMessage name="isAllowed" />

                    <label>
                      <Field name="cgu" type="checkbox" />
                      Je certifie avoir lu les conditions générales
                      d'utilisations*
                    </label>

                    <RedErrorMessage name="cgu" />
                  </div>

                  <button
                    className="button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    S'inscrire
                  </button>

                  {status && <p className="form-error-message">{status}</p>}

                  <p>
                    Vous avez déjà un compte ?{" "}
                    <Link to="/login">Connectez vous maintenant</Link>
                  </p>
                </Form>
              </div>
            </section>
          )}
        </Formik>
      )}
    </Mutation>
  );
});
