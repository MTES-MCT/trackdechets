import React, { useState } from "react";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";
import "./Slider.scss";

export default function Slider({ children }: any) {
  const [page, setPage] = useState(0);

  const numberOfPages = React.Children.count(children) - 1;
  const activePage = React.Children.toArray(children)[page];

  return (
    <div className="slider">
      <div
        className={`navigation ${page === 0 && "hidden"}`}
        onClick={() => setPage(Math.max(page - 1, 0))}
      >
        <FaArrowAltCircleLeft />
      </div>
      <div className="content">{activePage}</div>
      <div
        className={`navigation ${page === numberOfPages && "hidden"}`}
        onClick={() => setPage(Math.min(page + 1, numberOfPages))}
      >
        <FaArrowAltCircleRight />
      </div>
    </div>
  );
}
