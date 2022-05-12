import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header, {
    Props as HeaderProps,
} from '#components/Header';

import styles from './styles.css';

interface Props {
    className?: string;
    heading?: React.ReactNode;
    headingSize?: HeaderProps['headingSize'];
    headingActions?: React.ReactNode;
    headingInfo?: React.ReactNode;
    headerDescription?: React.ReactNode;
    footerActions?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    filters?: React.ReactNode;
}

function Container(props: Props) {
    const {
        className,
        heading,
        headingSize,
        headingInfo,
        headingActions,
        headerDescription,
        footer,
        footerActions,
        children,
        filters,
    } = props;

    return (
        <div className={_cs(styles.container, className)}>
            {heading && (
                <Header
                    className={styles.header}
                    heading={heading}
                    headingSize={headingSize}
                    headingInfo={headingInfo}
                    actions={headingActions}
                    description={headerDescription}
                />
            )}
            {filters && (
                <div className={styles.filters}>
                    {filters}
                </div>
            )}
            <div className={styles.content}>
                {children}
            </div>
            {(footerActions || footer) && (
                <div className={styles.footerContainer}>
                    <div className={styles.footer}>
                        {footer}
                    </div>
                    {footerActions && (
                        <div className={styles.footerActions}>
                            {footerActions}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Container;
