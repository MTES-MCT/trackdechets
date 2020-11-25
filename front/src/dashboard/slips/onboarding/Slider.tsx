import React, { useState, Children } from "react";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";
import styles from "./Slider.module.scss";
import { NextButton, PreviousButton } from "common/components/Buttons";
export default function Slider({ children, onClose }: any) {
  const [page, setPage] = useState(0);

  const numberOfPages = Children.count(children) - 1;
  const activePage = Children.toArray(children)[page];

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.slider}>
        <div
          className={`${styles.sliderNavigation} ${
            page === 0 && styles.sliderNavigationHidden
          }`}
          onClick={() => setPage(Math.max(page - 1, 0))}
        >
          <FaArrowAltCircleLeft />
        </div>
        <div className="content">{activePage}</div>
        <div
          className={`${styles.sliderNavigation} ${
            page === numberOfPages && styles.sliderNavigationHidden
          }`}
          onClick={() => setPage(Math.min(page + 1, numberOfPages))}
        >
          <FaArrowAltCircleRight />
        </div>
      </div>

      <div className={styles.sliderButtons}>
        {page !== 0 && (
          <PreviousButton onClick={() => setPage(Math.max(page - 1, 0))} />
        )}
        {page === numberOfPages ? (
          <button className="btn btn--primary" onClick={() => onClose()}>
            Terminer
          </button>
        ) : (
          <button
            className="btn btn--outline-secondary"
            onClick={() => onClose()}
          >
            Passer
          </button>
        )}
        {page < numberOfPages && (
          <NextButton
            onClick={() => setPage(Math.min(page + 1, numberOfPages))}
          />
        )}
      </div>
    </div>
  );
}
