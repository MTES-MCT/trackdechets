import React from "react";
import Link from "@docusaurus/Link";

const Card = ({ title, description, link }) => {
  return (
    <div class="card">
      <div class="card__header">
        <h3>{title}</h3>
      </div>
      <div class="card__body">
        <p>{description}</p>
      </div>
      <div class="card__footer">
        <Link to={link}>
          <button class="button button--primary">{title}</button>
        </Link>
      </div>
    </div>
  );
};

export default Card;
