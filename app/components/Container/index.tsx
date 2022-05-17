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
    headerClassName?: string;
    headingClassName?: string;
    headingActions?: React.ReactNode;
    headingInfo?: React.ReactNode;
    headerDescription?: React.ReactNode;
    footerActions?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    filters?: React.ReactNode;
    filtersClassName?: string;
}

function Container(props: Props) {
    const {
        className,
        heading,
        headingSize,
        headerClassName,
        headingClassName,
        headingInfo,
        headingActions,
        headerDescription,
        footer,
        footerActions,
        children,
        filters,
        filtersClassName,
    } = props;

    return (
        <div className={_cs(styles.container, className)}>
            {heading && (
                <Header
                    className={_cs(styles.header, headerClassName)}
                    heading={heading}
                    headingClassName={headingClassName}
                    headingSize={headingSize}
                    headingInfo={headingInfo}
                    actions={headingActions}
                    description={headerDescription}
                />
            )}
            {filters && (
                <div className={_cs(styles.filters, filtersClassName)}>
                    {filters}
                </div>
            )}
            <div>
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
