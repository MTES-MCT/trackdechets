import React from "react";
import Link from "@docusaurus/Link";

const Card = ({ title, description, link }) => {
  return (
    <div className="card">
      <div className="card__header">
        <h3>{title}</h3>
      </div>
      <div className="card__body">
        <p>{description}</p>
      </div>
      <div className="card__footer">
        <Link to={link}>
          <button className="button button--primary">{title}</button>
        </Link>
      </div>
    </div>
  );
};

export default Card;
