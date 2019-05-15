import React from "react";
import { FaCheckCircle, FaPenFancy, FaTasks } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Home.scss";
import { localAuthService } from "./login/auth.service";
import { trackEvent } from "./tracker";
import LazyLoad from "react-lazyload";

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

      <section className="section">
        <div className="container description">
          <div className="description-header">
            <h3>Editez et transmettez simplement vos bsd</h3>
            <p>
              Pour que la préparation des bordereaux ne soit plus d'une
              complexité inutile 💪.
            </p>
          </div>
          <div className="description-img">
            <LazyLoad height={448}>
              <img src="/onboarding/slide1.png" />
            </LazyLoad>
          </div>
          <div className="description-text">
            <h4>
              Editez vous-même un bsd ou co-editez le avec votre prestataire
            </h4>
            <ul>
              <li>
                Éditez un BSD en quelques clics grâce au système de favoris
                (codes déchets, coordonnées prestataires, etc.) et à la
                duplication de BSD
              </li>
              <li>Limitez les erreurs grâce aux contrôles de cohérence</li>
              <li>
                Signez un BSD : toutes les données sont transmises
                électroniquement à vos partenaires
              </li>
              <li>Editez le CERFA PDF complété (si nécessaire)</li>
            </ul>
            <h4>Générez automatiquement des annexes 2 (regroupement)</h4>
            En quelques clics sélectionnez les BSD concernés qui constitueront
            l’annexe 2, avec une prise en compte la perte de traçabilité lorsque
            nécessaire Les producteurs sont informés en temps réel du statut de
            leur déchet sans devoir les informer un par un
          </div>
        </div>

        <div className="container description">
          <div className="description-header">
            <h3>Suivez la vie de vos déchets en temps réel</h3>
            <p>
              Fini les relances multiples pour savoir si vos déchets ont été
              traités et le travail d'archivage des BSD.
            </p>
          </div>
          <div className="description-text">
            <h4>Tableau de bord</h4>
            <ul>
              <li>Suivez le statut de chaque BSD en temps réel</li>
            </ul>
            <h4>Alertes</h4>
            <ul>
              <li>
                Réalisez les actions nécessaires au bon moment (envoi du déchet,
                réception, traitement, etc.) : chaque acteur est informé de ce
                qui est attendu de lui
              </li>
              <li>Soyez informés des échéances à suivre</li>
            </ul>
          </div>
          <div className="description-img">
            <LazyLoad height={448}>
              <img src="/onboarding/slide2.png" />
            </LazyLoad>
          </div>
        </div>

        <div className="container description">
          <div className="description-header">
            <h3>Consultez et exportez votre registre déchets</h3>
          </div>
          <div className="description-img">
            <LazyLoad height={448}>
              <img src="/onboarding/slide3.png" />
            </LazyLoad>
          </div>
          <div className="description-text">
            <h4>Registre automatisé (fini la double saisie !)</h4>
            <ul>
              <li>
                Votre registre s’incrémente automatiquement à chaque fois qu’un
                BSD est parti chez le collecteur/traiteur
              </li>
              <li>
                Exportez le registre sous format CSV dans son intégralité ou
                sous format GEREP
              </li>
            </ul>
            <h4>Statistiques</h4>
            <ul>
              <li>
                Consultez des statistiques sur vos déchets dangereux (gestion,
                traitement, volumétrie, etc.)
              </li>
            </ul>
          </div>
        </div>

        <div className="container description">
          <div className="description-header">
            <h3>
              Vérifiez si une entreprise partenaire est autorisée à traiter vos
              déchets
            </h3>
          </div>

          <div className="description-text">
            <p>
              Un rapide questionnaire pour vous aider à vérifier qu’un
              prestataire peut collecter, recevoir et/ou traiter un type de
              déchet dangereux. On vous aide à y voir clair et à travailler avec
              des acteurs vertueux qui prendront soin de vos déchets. Un service
              qui reste manuel pour l’instant.
            </p>
          </div>
          <div className="description-img">
            <LazyLoad height={448}>
              <img src="/onboarding/slide4.png" />
            </LazyLoad>
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
