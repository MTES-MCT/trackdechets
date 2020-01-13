import React from "react";
import LazyLoad from "react-lazyload";
import { Link } from "react-router-dom";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__logo">
          <LazyLoad>
            <img className={styles["full-width"]} src="/logo-mtes-mef.svg" />
          </LazyLoad>
          <div className={styles["logo-text"]}>
            <LazyLoad>
              <img src="/logo-fabnum.svg" />
            </LazyLoad>
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
            <h4>À propos de Trackdéchets</h4>
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
            <Link to="/stats">Statistiques</Link>
          </li>
          <li>
            <a href="https://drive.google.com/open?id=1To5yrG6jO3-bh9jRqyi334mXT1LqGCjE">
              Boite à outils communication
            </a>
          </li>
        </ul>
        <ul className="footer__links">
          <li>
            <h4>Développeurs</h4>
          </li>
          <li>
            <a href={process.env.REACT_APP_DOC_ENDPOINT}>Documentation API</a>
          </li>
          <li>
            <a href={process.env.REACT_APP_API_ENDPOINT}>API Playground</a>
          </li>
          <li>
            <a href="https://forum.trackdechets.beta.gouv.fr/">
              Forum technique
            </a>
          </li>
          <li>
            <a href="http://status.trackdechets.beta.gouv.fr/">
              Statut des applications
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
