import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoChevronForward,
    IoChevronBack,
    IoEllipseOutline,
} from 'react-icons/io5';

import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import TextOutput from '#components/TextOutput';
import Carousel from '#components/Carousel';
import CarouselItem from '#components/Carousel/CarouselItem';
import CarouselButton from '#components/Carousel/CarouselButton';

import grid2021CoverImage from '../../resources/img/grid2021-cover.png';
import { goodPractice } from './data';
import styles from './styles.css';

interface Props {
    className?: string;
    id: string | undefined;
}

function GoodPractice(props: Props) {
    const {
        className,
        id,
    } = props;

    console.info('good practice id', id);

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.headerSection}>
                <div
                    className={styles.basicInfo}
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1465917566611-efba2904dd8a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1476&q=80")',
                    }}
                >
                    <div className={styles.container}>
                        <div className={styles.breadcrumb}>
                            {/*
                            <SmartLink
                                route={route.home}
                            />
                            ›
                            <SmartLink
                                route={route.goodPractices}
                            />
                            ›
                            */}
                            <div>
                                {goodPractice.title}
                            </div>
                        </div>
                        <Header
                            headingSize="extraLarge"
                            heading={goodPractice.title}
                            darkMode
                        />
                    </div>
                </div>
            </div>
            <div className={styles.mainContent}>
                <section className={styles.details}>
                    <div className={styles.mainSection}>
                        <div className={styles.meta}>
                            <TextOutput
                                label="Region"
                                value={goodPractice.region}
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                label="Country"
                                value={goodPractice.country}
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                label="Timeframe"
                                value={goodPractice.timeframe}
                                strongValue
                                displayType="block"
                            />
                        </div>
                        <HTMLOutput
                            value={goodPractice.description}
                        />
                    </div>
                    <div className={styles.sidePane}>
                        <div className={styles.carouselContainer}>
                            <Header
                                heading="Best Practice"
                                headingSize="small"
                            />
                            <Carousel className={styles.carousel}>
                                <CarouselItem
                                    order={1}
                                    className={styles.carouselItem}
                                >
                                    <img
                                        className={styles.image}
                                        src="https://images.unsplash.com/photo-1653450283266-c788c2ca4ab2?crop=entropy&cs=tinysrgb&fm=jpg&ixlib=rb-1.2.1&q=80&raw_url=true&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=640"
                                        alt="GRID 2021"
                                    />
                                    <div className={styles.description}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                                        sed do eiusmod tempor incididunt ut labore et
                                    </div>
                                </CarouselItem>
                                <CarouselItem
                                    order={2}
                                    className={styles.carouselItem}
                                >
                                    <img
                                        className={styles.image}
                                        src="https://images.unsplash.com/photo-1653296744218-5aede802b57d?crop=entropy&cs=tinysrgb&fm=jpg&ixlib=rb-1.2.1&q=80&raw_url=true&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300"
                                        alt="GRID 2021"
                                    />
                                    <div className={styles.description}>
                                        Hey there! How&apos;re you doing? All good I hope!
                                        Anyway, all the best to you!
                                    </div>
                                </CarouselItem>
                                <CarouselItem
                                    order={3}
                                    className={styles.carouselItem}
                                >
                                    <img
                                        className={styles.image}
                                        src={grid2021CoverImage}
                                        alt="GRID 2021"
                                    />
                                    <div className={styles.description}>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                                        sed do eiusmod tempor incididunt ut labore et
                                    </div>
                                </CarouselItem>
                                <div className={styles.carouselActions}>
                                    <CarouselButton
                                        action="prev"
                                    >
                                        <IoChevronBack />
                                    </CarouselButton>
                                    <CarouselButton
                                        action="set"
                                        order={1}
                                    >
                                        <IoEllipseOutline />
                                    </CarouselButton>
                                    <CarouselButton
                                        action="set"
                                        order={2}
                                    >
                                        <IoEllipseOutline />
                                    </CarouselButton>
                                    <CarouselButton
                                        action="set"
                                        order={3}
                                    >
                                        <IoEllipseOutline />
                                    </CarouselButton>
                                    <CarouselButton
                                        action="next"
                                    >
                                        <IoChevronForward />
                                    </CarouselButton>
                                </div>
                            </Carousel>
                        </div>
                        <div className={styles.blockList}>
                            <div className={styles.block}>
                                <div>
                                    Do you have a Good Practice you would like us to review?
                                </div>
                                <Button
                                    name={undefined}
                                >
                                    Submit a Good Practice
                                </Button>
                            </div>
                            <div className={styles.block}>
                                <div>
                                    For more information please contact:
                                </div>
                                <div className={styles.contactLinks}>
                                    <a
                                        href={`mailto:${goodPractice.contactEmail}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Email
                                    </a>
                                    /
                                    <a
                                        href={goodPractice.contactFormLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Online Form
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractice;
