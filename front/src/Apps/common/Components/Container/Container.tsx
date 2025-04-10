import React from "react";
import classNames from "classnames";
import styles from "./Container.module.scss";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={classNames([
        "tw-flex-grow",
        "tw-px-6",
        "tw-py-6",
        styles.container
      ])}
    >
      {children}
    </div>
  );
};

export default Container;
