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
                    {heading && (
                        <Heading
                            size={headingSize}
                            className={styles.heading}
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
