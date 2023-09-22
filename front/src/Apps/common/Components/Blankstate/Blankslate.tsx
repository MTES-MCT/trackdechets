import * as React from "react";
import styles from "./Blankslate.module.scss";

interface BlankslateProps {
  children: React.ReactNode;
}

// This component is used to display information
// when a page is empty because there's nothing to be shown.
//
// It's composed of two things:
// 1. An illustration
// 2. A message indicating why the page is empty and how to change that
//
// Example:
// <Blankslate>
//   <BlankslateImg src="/path/to/img" />
//   <BlankslateTitle>
//     This page is empty
//   </BlankslateTitle>
//   <BlankslateDescription>
//     This page is empty because you have not created something yet.
//     You can create something by clicking the "create something" button.
//   </BlankslateDescription>
// </Blankslate>
export function Blankslate({ children }: BlankslateProps) {
  return <div className={styles.Blankslate}>{children}</div>;
}

type BlankslateImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

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
  children
}: BlankslateDescriptionProps) {
  return <div className={styles.BlankslateDescription}>{children}</div>;
}
