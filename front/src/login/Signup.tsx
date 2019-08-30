import ApolloClient from "apollo-client";
import { Field, FormikActions, FieldProps } from "formik";
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
import { Wizard } from "./Wizard";
import { FaEnvelope, FaLock, FaPhone, FaIdCard, FaEye } from "react-icons/fa";
import PasswordMeter from "./PasswordMeter";

type Values = {
  codeNaf: string;
  gerepId: string;
  email: string;
  emailConfirmation: string,
  name: string,
  phone: string,
  password: string,
  passwordConfirmation: string,
  siret: string,
  userType: any[],
  isAllowed: boolean,
  cgu: boolean
};

const handleSumbit = (
  payload: Values,
  props: FormikActions<Values> & { signup: MutationFn } & RouteComponentProps
) => {
  props
    .signup({ variables: { payload } })
    .then(_ => props.history.push("/signup/activation"))
    .catch(error => props.setStatus(error.message))
    .then(_ => props.setSubmitting(false));
};

export default withRouter(function Signup(routerProps: RouteComponentProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [passwordType, setPasswordType] = useState("password");
  const [isSearching, setIsSearching] = useState(false)

  const fetchCompany = async (
    client: ApolloClient<Company>,
    clue: string
  ) => {

    const { data } = await client
      .query<{ companyInfos: Company }>({
        query: COMPANY_INFOS,
        variables: { siret: clue }
      })

    return data.companyInfos
  };

  return (
    <section className="section section-white">
      <div className="container">
        <Mutation mutation={SIGNUP}>
          {signup => (
            <Wizard
              initialValues={{
                email: "",
                emailConfirmation: "",
                name: "",
                phone: "",
                password: "",
                passwordConfirmation: "",
                siret: "",
                userType: [],
                gerepId: "",
                codeNaf: "",
                isAllowed: false,
                cgu: false
              }}
              onSubmit={(values: any, formikActions: any) => {
                const {
                  passwordConfirmation,
                  emailConfirmation,
                  isAllowed,
                  cgu,
                  ...payload
                } = values;

                handleSumbit(
                  {
                    ...payload,
                    companyName: company ? company.name : ""
                  },
                  {
                    ...routerProps,
                    ...formikActions,
                    signup
                  }
                );
              }}
            >
              <Wizard.Page title="Bienvenue">
                <h1>Inscription à Trackdéchets</h1>
                <p>
                  Trackdéchets est un produit du Ministère de la Transition
                  Ecologique et Solidaire.
                </p>

                <p>
                  Son objectif : simplifier la gestion des déchets dangereux au
                  quotidien : 0 papier, traçabilité en temps réel, informations
                  regroupées sur un outil unique, vérification de vos
                  prestataires.
                </p>

                <p>
                  Il est libre d'utilisation et utilisable par tous les acteurs
                  de la filière déchets. Rejoignez-nous !
                </p>

                <p>
                  <strong>Vous avez déjà un compte ?</strong>{" "}
                  <Link to="/login">Connectez vous maintenant</Link>
                </p>
                <p>
                  <strong>Votre entreprise dispose déjà d'un compte ?</strong>{" "}
                  Vous ne pourrez pas créer un compte pour l'entreprise via ce
                  formulaire. Adressez vous à l'administrateur/trice de votre
                  entreprise, il/elle pourra vous inviter via la page "Mon compte".
                </p>
              </Wizard.Page>
              <Wizard.Page
                title="Informations utilisateur"
                validate={(values: any) => {
                  let errors: any = {};
                  if (values.password !== values.passwordConfirmation) {
                    errors.passwordConfirmation =
                      "Les deux mots de passe ne sont pas identiques.";
                  }

                  if (values.email !== values.emailConfirmation) {
                    errors.emailConfirmation =
                      "Les deux emails ne sont pas identiques.";
                  }

                  !values.email
                    ? (errors.email = "L'email est obligatoire")
                    : null;
                  !values.name
                    ? (errors.name = "Le nom et prénom sont obligatoires")
                    : null;

                  !values.password
                    ? (errors.password =
                        "Le mot de passe ne peut pas être vide")
                    : null;

                  return errors;
                }}
              >
                <h1>Informations utilisateur</h1>

                <div className="form__group">
                  <label>Nom et prénom*</label>
                  <div className="search__group">
                    <Field type="text" name="name" />
                    <button
                      type="button"
                      className="overlay-button"
                      aria-label="Recherche"
                    >
                      <FaIdCard />
                    </button>
                  </div>

                  <RedErrorMessage name="name" />
                </div>

                <div className="form__group">
                  <label>Email*</label>
                  <div className="search__group">
                    <Field type="text" name="email" />
                    <button
                      type="button"
                      className="overlay-button"
                      aria-label="Recherche"
                    >
                      <FaEnvelope />
                    </button>
                  </div>

                  <RedErrorMessage name="email" />
                </div>

                <div className="form__group">
                  <label>
                    Confirmation de l'email*
                    <Field type="text" name="emailConfirmation" />
                  </label>

                  <RedErrorMessage name="emailConfirmation" />
                </div>

                <div className="form__group">
                  <label>Téléphone</label>
                  <div className="search__group">
                    <Field type="text" name="phone" />
                    <button
                      type="button"
                      className="overlay-button"
                      aria-label="Recherche"
                    >
                      <FaPhone />
                    </button>
                  </div>
                </div>

                <div className="form__group">
                  <label>Mot de passe*</label>
                  <div className="search__group">
                    <Field type={passwordType} name="password" />
                    <button
                      type="button"
                      className="overlay-button"
                      aria-label="Recherche"
                    >
                      <FaLock />
                    </button>
                    <span
                      className="show-password"
                      onClick={() =>
                        setPasswordType(
                          passwordType === "password" ? "input" : "password"
                        )
                      }
                    >
                      <FaEye /> Afficher le mot de passe
                    </span>
                    <PasswordMeter />
                  </div>

                  <RedErrorMessage name="password" />
                </div>

                <div className="form__group">
                  <label>
                    Vérification du mot de passe*
                    <Field type="password" name="passwordConfirmation" />
                  </label>

                  <RedErrorMessage name="passwordConfirmation" />
                </div>
              </Wizard.Page>
              <Wizard.Page
                title="Informations entreprise"
                validate={(values: any) => {
                  let errors: any = {};
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
                <h1>Informations sur l'entreprise</h1>

                <div className="form__group">
                  <label>
                    Numéro SIRET de l'entreprise que vous administrez*
                    <ApolloConsumer>
                      {client => (
                        <Field
                          type="text"
                          name="siret"
                          validate={(value: any) => {
                            if (!company && !isSearching) {
                              return "Entreprise inconnue"
                            }
                          }}
                        >
                        {({field, form}: FieldProps<Values>) =>
                          <input
                            {...field}
                            onBlur={async (ev) => {

                              ev.persist()

                              const siret = ev.target.value;

                              if (siret.length == 14) {
                                // For some unkown reasons, the first Apollo call raises
                                // Error: "Store reset while query was in flight(not completed in link chain)"
                                // so we need to retry
                                let company_ = null;
                                setIsSearching(true);
                                for (let i=0; i<=3; ++i) {
                                  try {
                                    company_ = await fetchCompany(client, siret);
                                    break;
                                  } catch(err) {
                                    console.log(err);
                                  }
                                }
                                setIsSearching(false);
                                setCompany(company_);

                                field.onBlur(ev);

                                // auto-complete field gerepId
                                form.setFieldValue("gerepId", company_ ? company_.codeS3ic : "")

                                // auto-complete field codeNaf
                                form.setFieldValue("codeNaf", company_ ? company_.naf : "")

                                // auto-complete userType
                                if (company_ && company_.rubriques) {
                                  let categories = company_.rubriques.map(r => r.category)
                                  const userType = categories.filter((value, index, self) => {
                                    return self.indexOf(value) === index;
                                  });
                                  form.setFieldValue("userType", userType);
                                } else {
                                  form.setFieldValue("userType", []);
                                }
                              }
                            }}
                          />
                        }
                        </Field>
                      )}
                    </ApolloConsumer>
                  </label>

                  {isSearching && (
                    <p>
                      Recherche...
                    </p>
                  )}

                  {company && company.name != "" && (
                    <p>
                      Vous allez créer un compte pour l'entreprise{" "}
                      <strong className="text-green">{company.name}</strong>
                      {company && company.codeS3ic != "" && (
                        <span>
                          {" "}
                          (Installation classée{" "}
                          <a href={company.urlFiche as string} target="_blank">
                            n° {company.codeS3ic}
                          </a>)
                        </span>)}
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
                      Code NAF
                      <Field type="text" name="codeNaf" />
                    </label>
                </div>

                <div className="form__group">
                  <label>
                    Identifiant GEREP (recommandé)
                    <Field type="text" name="gerepId" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    <Field name="isAllowed" type="checkbox" />
                    Je certifie disposer du pouvoir pour créer un compte au nom
                    de mon entreprise*
                  </label>

                  <RedErrorMessage name="isAllowed" />

                  <label>
                    <Field name="cgu" type="checkbox" />
                    Je certifie avoir lu les{" "}
                    <Link to="cgu" target="_blank">
                      conditions générales d'utilisation
                    </Link>
                    *
                  </label>

                  <RedErrorMessage name="cgu" />
                </div>

                {status && <p className="form-error-message">{status}</p>}
              </Wizard.Page>
            </Wizard>
          )}
        </Mutation>
      </div>
    </section>
  );
});
