import React from "react";
import styles from "./Slide.module.scss";

type Props = { children: any; image: string; title: string };
export default function Slide({ children, image, title }: Props) {
  return (
    <div className={styles.slide}>
      <h1 className={styles.slideTitle}>{title}</h1>
      <div className={styles.slideContent}>
        <div className={styles.slideImage}>
          <img src={image} alt="" />
        </div>
        <div className={styles.slideText}>{children}</div>
      </div>
    </div>
  );
}
