import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Heading, { HeadingSizeType } from '#components/Heading';

import styles from './styles.css';

// FIXME: do the styling

interface Props {
    className?: string;
    heading?: React.ReactNode;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    description?: React.ReactNode;
    headingDescription?: React.ReactNode;
    headingSize?: HeadingSizeType,
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
    } = props;

    return (
        <header className={_cs(styles.header, className)}>
            <div className={styles.headingSection}>
                {icons && (
                    <div className={styles.icons}>
                        {icons}
                    </div>
                )}
                <div className={styles.headingContainer}>
                    {heading && (
                        <Heading size={headingSize}>
                            {heading}
                        </Heading>
                    )}
                    {headingDescription && (
                        <div className={styles.headingDescription}>
                            {headingDescription}
                        </div>
                    )}
                </div>
                {actions && (
                    <div className={styles.icons}>
                        {icons}
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
