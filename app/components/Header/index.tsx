import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Heading, { HeadingSizeType } from '#components/Heading';

import styles from './styles.css';

export interface Props {
    className?: string;
    headingClassName?: string;
    heading?: React.ReactNode;
    headingInfo?: React.ReactNode;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    description?: React.ReactNode;
    headingDescription?: React.ReactNode;
    headingSize?: HeadingSizeType,
    inlineHeadingDescription?: boolean,
    headingTitle?: React.ReactNode;
}

function Header(props: Props) {
    const {
        className,
        headingClassName,
        heading,
        icons,
        actions,
        description,
        headingDescription,
        headingSize,
        headingInfo,
        inlineHeadingDescription,
        headingTitle,
    } = props;

    return (
        <header className={_cs(styles.header, className)}>
            <div className={styles.headingSection}>
                {icons && (
                    <div>
                        {icons}
                    </div>
                )}
                <div
                    className={_cs(
                        styles.headingContainer,
                        inlineHeadingDescription && styles.inlineHeadingDescription,
                    )}
                >
                    {headingTitle && (
                        <div className={styles.headingTitle}>
                            {headingTitle}
                        </div>
                    )}
                    {heading && (
                        <Heading
                            size={headingSize}
                            className={_cs(styles.heading, headingClassName)}
                        >
                            {heading}
                            {headingInfo && (
                                <span className={styles.headingInfo}>
                                    {headingInfo}
                                </span>
                            )}
                        </Heading>
                    )}
                    {headingDescription && (
                        <div className={styles.headingDescription}>
                            {headingDescription}
                        </div>
                    )}
                </div>
                {actions && (
                    <div>
                        {actions}
                    </div>
                )}
            </div>
            {description && (
                <div>
                    {description}
                </div>
            )}
        </header>
    );
}

export default Header;
