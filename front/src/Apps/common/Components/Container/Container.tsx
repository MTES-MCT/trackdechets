import React from "react";
import classNames from "classnames";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={classNames(["tw-flex-grow", "tw-p-6", "tw-w-full"])}>
      {children}
    </div>
  );
};

export default Container;
