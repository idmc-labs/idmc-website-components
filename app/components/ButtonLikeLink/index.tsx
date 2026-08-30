import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { useButtonFeatures } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type Props = {
    target?: string;
    rel?: string;
    href?: string;
    title?: string;
} & Parameters<typeof useButtonFeatures>[0]

function ButtonLikeLink(props: Props) {
    const {
        disabled,
        target,
        rel,
        href,
        ...otherProps
    } = props;

    const {
        className,
        children,
    } = useButtonFeatures({
        ...otherProps,
        disabled,
    });

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = useCallback((e) => {
        if (disabled) {
            e.preventDefault();
        }
    }, [disabled]);

    return (
        <a
            className={_cs(className, styles.button)}
            href={href}
            rel={rel}
            aria-disabled={disabled}
            target={target}
            onClick={handleClick}
            {...otherProps}
        >
            {children}
        </a>
    );
}

export default ButtonLikeLink;
