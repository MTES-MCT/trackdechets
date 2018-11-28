import React from "react";
import Header from "./Header";

export default function Home() {
  return (
    <React.Fragment>
      <Header />

      <div className="hero__container">
        <h1 className="hero__white-background">Titre chili con carne</h1>
        <p className="hero__white-background">
          Tagline libérer les données sans effort et sur data.gouv.fr
        </p>
      </div>
    </React.Fragment>
  );
}
