import * as React from "react";
import styles from "./Blankslate.module.scss";

interface BlankslateProps {
  children: React.ReactNode;
}

export function Blankslate({ children }: BlankslateProps) {
  return <div className={styles.Blankslate}>{children}</div>;
}

interface BlankslateImgProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function BlankslateImg(props: BlankslateImgProps) {
  return <img alt="" {...props} className={styles.BlankslateImg} />;
}

interface BlankslateTitleProps {
  children: React.ReactNode;
}

export function BlankslateTitle({ children }: BlankslateTitleProps) {
  return <div className={styles.BlankslateTitle}>{children}</div>;
}

interface BlankslateDescriptionProps {
  children: React.ReactNode;
}

export function BlankslateDescription({
  children,
}: BlankslateDescriptionProps) {
  return <div className={styles.BlankslateDescription}>{children}</div>;
}
