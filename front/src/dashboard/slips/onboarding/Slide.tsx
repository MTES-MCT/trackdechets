import React from "react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import "./Slide.scss";

type Props = { children: any; image: string; title: string };
export default function Slide({ children, image, title }: Props) {
  return (
    <div className="slide">
      <h1>{title}</h1>
      <div className="content">
        <div className="image">
          <img src={image} />
        </div>
        <div className="text">{children}</div>
      </div>
    </div>
  );
}
