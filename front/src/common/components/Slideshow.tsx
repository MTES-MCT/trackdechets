import * as React from "react";
import classNames from "classnames";
import {
  IconArrowLeft1,
  IconArrowRight1,
} from "Apps/common/Components/Icons/Icons";
import { List, ListItem } from "./List";
import styles from "./Slideshow.module.scss";

interface SlideshowProps {
  children: React.ReactNode;
}

export function Slideshow({ children }: SlideshowProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const slides = React.Children.toArray(children);
  const currentSlide = slides[currentSlideIndex];

  return (
    <>
      <div className={styles.Slideshow}>
        <button
          type="button"
          className={classNames(styles.SlideshowArrowLeft, {
            [styles.SlideshowArrowDisabled]: currentSlideIndex <= 0,
          })}
          onClick={() =>
            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
          }
        >
          <IconArrowLeft1 />
        </button>
        {currentSlide}
        <button
          type="button"
          className={classNames(styles.SlideshowArrowRight, {
            [styles.SlideshowArrowDisabled]:
              currentSlideIndex >= slides.length - 1,
          })}
          onClick={() =>
            setCurrentSlideIndex(
              Math.min(slides.length - 1, currentSlideIndex + 1)
            )
          }
        >
          <IconArrowRight1 />
        </button>
      </div>

      <List variant="inline" className={styles.SlideshowDots}>
        {Array.from({ length: slides.length }).map((_, index) => (
          <ListItem key={index}>
            <button
              type="button"
              className={classNames(styles.SlideshowDotsItem, {
                [styles.SlideshowDotsItemActive]: currentSlideIndex === index,
              })}
              onClick={() => setCurrentSlideIndex(index)}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}
