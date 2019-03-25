import React from "react";
import { FaCheckCircle, FaPenFancy, FaTasks } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Home.scss";
import { localAuthService } from "./login/auth.service";
import { trackEvent } from "./tracker";

export default function Home() {
  return (
    <React.Fragment>
      <div className="hero">
        <div className="hero__container">
          <h1 className="hero__white-background">
            Gérer la traçabilité des déchets en toute sécurité
          </h1>
          {localAuthService.isAuthenticated ? (
            <p>
              <Link to="/dashboard/slips" className="button large">
                Accéder à mon espace
              </Link>
            </p>
          ) : (
            <p>
              <Link
                to="/signup"
                className="button large warning"
                onClick={() => trackEvent("home", "cta-test")}
              >
                Tester Trackdéchets
              </Link>
              <Link
                to="/login"
                className="button large"
                onClick={() => trackEvent("home", "cta-login")}
              >
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>

      <section className="section section-white">
        <div className="container">
          <h2 className="section__title">
            Trackdéchets a vocation à simplifier la gestion de vos déchets
            dangereux au quotidien : 0 papier, traçabilité en temps réel,
            informations regroupées sur un outil unique, vérification des
            prestataires
          </h2>

          <div className="row">
            <div>
              <div className="feature-icon">
                <FaPenFancy />
              </div>
              <h3>Éditez et transmettez simplement vos bordereaux</h3>
              <p>
                Pour que la préparation des bordereaux ne soit plus d'une
                complexité inutile
              </p>
            </div>
            <div>
              <div className="feature-icon">
                <FaTasks />
              </div>
              <h3>Suivez la vie de vos déchets en temps réel</h3>
              <p>
                Fini les relances multiples pour savoir si vos déchets ont été
                traités et le travail d'archivage des BSD
              </p>
            </div>
            <div>
              <div className="feature-icon">
                <FaCheckCircle />
              </div>
              <h3>Vérifiez les autorisations</h3>
              <p>
                Vérifiez si une entreprise partenaire est bien autorisée à
                traiter vos déchets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="section section-color">
        <div className="container">
          <p className="section__subtitle">
            Ce produit est actuellement en version béta et intégrera
            prochainement de nouvelles fonctionnalités (BSD numérique de
            regroupement annexe 2, automatisation du reporting, visualisation de
            données, préparation GEREP, annexe 1, autres déchets dangereux)
          </p>
        </div>
      </section> */}

      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer__logo">
            <img src="/logo-mtes-mef.svg" />
            <div className="footer__logo-text">
              <img src="/logo-fabnum.svg" />
              <small>
                Trackdéchets est un service numérique de l'Etat incubé à la
                Fabrique Numérique du Ministère de la Transition écologique et
                solidaire, membre du réseau d’incubateurs{" "}
                <a href="https://beta.gouv.fr">beta.gouv.fr</a>
              </small>
            </div>
          </div>
          <ul className="footer__links">
            <li>
              <h3>Trackdéchets</h3>
            </li>
            <li>
              <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
                Nous contacter
              </a>
            </li>
            <li>
              <Link to="/faq">Foire aux questions</Link>
            </li>
            <li>
              <Link to="/cgu">Conditions générales d'utilisation</Link>
            </li>
            <li>
              <a href="/Politique de confidentialité.pdf" target="_blank">
                Politique de confidentialité
              </a>
            </li>
            <li>
              <a href="http://api.trackdechets.beta.gouv.fr">API</a>
            </li>
          </ul>
        </div>
      </footer>
    </React.Fragment>
  );
}
