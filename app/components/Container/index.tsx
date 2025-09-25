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
    footerClassName?: string;
    footerContainerClassName?: string;
    footerActionsClassName?: string;
    children?: React.ReactNode;
    filters?: React.ReactNode;
    filtersClassName?: string;
    childrenClassName?: string;
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
        footerClassName,
        footerContainerClassName,
        footerActionsClassName,
        children,
        filters,
        filtersClassName,
        childrenClassName,
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
            <div className={childrenClassName}>
                {children}
            </div>
            {(footerActions || footer) && (
                <div className={_cs(styles.footerContainer, footerContainerClassName)}>
                    <div className={_cs(styles.footer, footerClassName)}>
                        {footer}
                    </div>
                    {footerActions && (
                        <div className={_cs(styles.footerActions, footerActionsClassName)}>
                            {footerActions}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Container;
