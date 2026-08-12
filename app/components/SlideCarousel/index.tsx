import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Carousel from '#components/Carousel';
import CarouselItem from '#components/Carousel/CarouselItem';
import CarouselButton from '#components/Carousel/CarouselButton';

import styles from './styles.css';

export interface Slide {
    key: string;
    content: React.ReactNode;
}

export interface Props {
    className?: string;
    slides: Slide[];
    autoPlay?: boolean;
    // Extra content rendered after a divider in the pager row (e.g. IduMap's
    // "Definitions" button). Omit for a plain prev/dots/next pager.
    pagerExtra?: React.ReactNode;
    // Stretch slides to fill the height of a flex parent, for carousels
    // living in a fixed-height pane (e.g. IduMap's side panel).
    fillHeight?: boolean;
}

function SlideCarousel(props: Props) {
    const {
        className,
        slides,
        autoPlay = false,
        pagerExtra,
        fillHeight,
    } = props;

    return (
        <Carousel className={_cs(styles.carousel, className)} autoPlay={autoPlay}>
            <div className={_cs(styles.slides, fillHeight && styles.slidesFill)}>
                {slides.map((slide, index) => (
                    <CarouselItem
                        key={slide.key}
                        order={index + 1}
                        className={_cs(styles.slide, fillHeight && styles.slideFill)}
                    >
                        {slide.content}
                    </CarouselItem>
                ))}
            </div>
            <div className={styles.carouselSelector}>
                <div className={styles.pager}>
                    <CarouselButton action="prev" className={styles.pagerButton} />
                    {slides.map((slide, index) => (
                        <CarouselButton
                            key={slide.key}
                            action="set"
                            order={index + 1}
                            className={styles.pagerButton}
                        />
                    ))}
                    <CarouselButton action="next" className={styles.pagerButton} />
                    {pagerExtra && (
                        <>
                            <div className={styles.pagerDivider} />
                            {pagerExtra}
                        </>
                    )}
                </div>
            </div>
        </Carousel>
    );
}

export default SlideCarousel;
