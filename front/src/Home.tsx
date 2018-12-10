import React from "react";
import Header from "./Header";
import "./Home.scss";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <React.Fragment>
      <Header />

      <div className="hero">
        <div className="hero__container">
          <h1 className="hero__white-background">
            Gérez la traçabilité de vos déchets en toute sérénité
          </h1>
          <p className="hero__white-background">
            Trackdéchets a vocation à simplifier la gestion de vos déchets
            dangereux au quotidien : 0 papier, traçabilité en temps reél,
            informations regroupées sur un seul outil gratuit
          </p>
          <p>
            <Link to="/signup" className="button large warning">
              Tester Trackdéchets
            </Link>
            <Link to="/login" className="button large">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      <section className="section section-white">
        <div className="container">
          <h2 className="section__title">
            Un produit là pour vous simplifier la vie
          </h2>

          <div className="row">
            <div>
              <h3>Éditez simplement vos bordereaux</h3>
              <p>
                Pour que la préparation des bordereaux ne soit plus d'une
                complexité inutile
              </p>
            </div>
            <div>
              <h3>Suivez la vie de vos déchets en temps réel</h3>
              <p>
                Fini les relances multiples pour savoir si vos déchets ont été
                traités et le travail d'archivage des BSD
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-color">
        <div className="container">
          <p className="section__subtitle">
            Ce produit est actuellement en version béta et intégrera
            prochainement de nouvelles fonctionnalités (BSD numérique de
            regroupement annexe 2, automatisation du reporting, visualisation de
            données, préparation GEREP, annexe 1, autres déchets dangereux)
          </p>
        </div>
      </section>

      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer__logo" />
          <ul className="footer__links">
            <li>
              <h2>trackdechets.beta.gouv.fr</h2>
            </li>
            <li>
              <a href="#">Nous contacter</a>
            </li>
            <li>
              <a href="#">Conditions générales d'utilisation</a>
            </li>
            <li>
              <a href="#">API</a>
            </li>
          </ul>
          <ul className="footer__links" />
        </div>
      </footer>
    </React.Fragment>
  );
}
