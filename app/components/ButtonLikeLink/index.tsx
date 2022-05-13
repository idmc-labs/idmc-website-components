import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { useButtonFeatures } from '../Button';

interface Props extends React.HTMLProps<HTMLAnchorElement> {
    variant?: 'primary' | 'secondary';
    actions?: React.ReactNode;
    icons?: React.ReactNode;
}

function ButtonLikeLink(props: Props) {
    const {
        className,
        variant = 'primary',
        icons,
        actions,
        children,
        ...otherProps
    } = props;

    const {
        buttonClassName,
        children: childrenFromButtonFeatures,
    } = useButtonFeatures({
        variant,
        icons,
        actions,
        children,
    });

    return (
        <a
            className={_cs(className, buttonClassName)}
            {...otherProps}
        >
            {childrenFromButtonFeatures}
        </a>
    );
}

export default ButtonLikeLink;
