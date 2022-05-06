import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Heading, { HeadingSizeType } from '#components/Heading';

import styles from './styles.css';

interface Props {
    className?: string;
    heading?: React.ReactNode;
    headingInfo?: React.ReactNode;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    description?: React.ReactNode;
    headingDescription?: React.ReactNode;
    headingSize?: HeadingSizeType,
    inlineHeadingDescription?: boolean,
}

function Header(props: Props) {
    const {
        className,
        heading,
        icons,
        actions,
        description,
        headingDescription,
        headingSize,
        headingInfo,
        inlineHeadingDescription,
    } = props;

    return (
        <header className={_cs(styles.header, className)}>
            <div className={styles.headingSection}>
                {icons && (
                    <div className={styles.icons}>
                        {icons}
                    </div>
                )}
                <div
                    className={_cs(
                        styles.headingContainer,
                        inlineHeadingDescription && styles.inlineHeadingDescription,
                    )}
                >
                    {heading && (
                        <Heading
                            size={headingSize}
                            className={styles.heading}
                        >
                            {heading}
                            {headingInfo}
                        </Heading>
                    )}
                    {headingDescription && (
                        <div className={styles.headingDescription}>
                            {headingDescription}
                        </div>
                    )}
                </div>
                {actions && (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                )}
            </div>
            {description && (
                <div className={styles.description}>
                    {description}
                </div>
            )}
        </header>
    );
}

export default Header;
