import React from "react";
import { SurveyBannerProps } from "./surveyBannerTypes";

import { Button } from "@codegouvfr/react-dsfr/Button";

import "./surveyBanner.scss";

const iconSurvey = (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_4106_639644)">
      <path
        d="M19.5 1.5C18.7044 1.5 17.9413 1.81607 17.3787 2.37868C16.8161 2.94128 16.5 3.70436 16.5 4.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.5 1.5H19.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46.5 4.5C46.5 3.70436 46.184 2.94128 45.6214 2.37868C45.0588 1.81607 44.2956 1.5 43.5 1.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46.5 28.5V4.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.5 31.5C44.2956 31.5 45.0588 31.184 45.6214 30.6214C46.184 30.0588 46.5 29.2956 46.5 28.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37.5 31.5H43.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 40.5L37.5 31.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 31.5V40.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.5 31.5H28.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 19.5C12.3137 19.5 15 16.8137 15 13.5C15 10.1863 12.3137 7.5 9 7.5C5.6863 7.5 3 10.1863 3 13.5C3 16.8137 5.6863 19.5 9 19.5Z"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 34.5V30C16.5 28.0108 15.7098 26.1032 14.3033 24.6966C12.8968 23.2902 10.9891 22.5 9 22.5C7.01088 22.5 5.10322 23.2902 3.6967 24.6966C2.29018 26.1032 1.5 28.0108 1.5 30V34.5H4.5L6 46.5H12L13.5 34.5H16.5Z"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37.5 18V10.5"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 14.25C24 13.5083 24.22 12.7833 24.632 12.1666C25.044 11.5499 25.6298 11.0693 26.315 10.7855C27.0002 10.5016 27.7542 10.4274 28.4816 10.5721C29.209 10.7168 29.8772 11.0739 30.4016 11.5984C30.926 12.1228 31.2832 12.791 31.428 13.5184C31.5726 14.2458 31.4984 14.9998 31.2146 15.6851C30.9308 16.3703 30.45 16.956 29.8334 17.368C29.2168 17.7801 28.4916 18 27.75 18"
        stroke="black"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.75 24C27.3358 24 27 23.6642 27 23.25C27 22.8358 27.3358 22.5 27.75 22.5"
        stroke="black"
        strokeWidth="3"
      />
      <path
        d="M27.75 24C28.1642 24 28.5 23.6642 28.5 23.25C28.5 22.8358 28.1642 22.5 27.75 22.5"
        stroke="black"
        strokeWidth="3"
      />
      <path
        d="M37.5 24C37.0858 24 36.75 23.6642 36.75 23.25C36.75 22.8358 37.0858 22.5 37.5 22.5"
        stroke="black"
        strokeWidth="3"
      />
      <path
        d="M37.5 24C37.9142 24 38.25 23.6642 38.25 23.25C38.25 22.8358 37.9142 22.5 37.5 22.5"
        stroke="black"
        strokeWidth="3"
      />
    </g>
    <defs>
      <clipPath id="clip0_4106_639644">
        <rect width="48" height="48" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const SurveyBanner = ({ message, button, onClickClose }: SurveyBannerProps) => {
  return (
    <div className="survey-banner">
      <div className="survey-banner__container">
        <div className="survey-banner__group">
          <div className="survey-banner__subgroup">
            <div className="survey-banner__icon">{iconSurvey}</div>
            <div className="survey-banner__message">{message}</div>
          </div>
          <div className="survey-banner__link">
            <Button
              iconId={"ri-questionnaire-fill"}
              iconPosition="right"
              linkProps={{
                target: "_blank",
                href: button.href,
              }}
              className="survey-banner__link__a"
              priority="tertiary"
            >
              {button.title}
            </Button>
          </div>
        </div>
        {onClickClose && (
          <div className="survey-banner__group">
            <div className="survey-banner__close">
              <Button
                priority="tertiary"
                iconId={"ri-close-line"}
                iconPosition="right"
                onClick={onClickClose}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyBanner;
