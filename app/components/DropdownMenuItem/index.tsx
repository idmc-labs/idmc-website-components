import React from 'react';
import {
    _cs,
    isValidUrl,
} from '@togglecorp/fujs';
import {
    Link,
    LinkProps,
} from 'react-router-dom';

import ElementFragments, {
    Props as ElementFragmentProps,
} from '../ElementFragments';

import RawButton, {
    Props as RawButtonProps,
} from '../RawButton';

import { genericMemo } from '../../utils';

import styles from './styles.css';

interface BaseProps extends ElementFragmentProps {
    className?: string;
}

export type Props<N extends string | number | undefined> = BaseProps & ({
    href?: undefined;
    name: N;
    onClick: RawButtonProps<N>['onClick'];
} | {
    href: string;
    linkProps?: LinkProps;
})

function DropdownMenuItem<N extends string | number | undefined>(props: Props<N>) {
    const {
        className: classNameFromProps,
        icons,
        actions,
        children,
        iconsContainerClassName,
        childrenContainerClassName,
        actionsContainerClassName,
        href,
    } = props;

    const className = _cs(
        styles.dropdownMenuItem,
        classNameFromProps,
    );

    const content = (
        <ElementFragments
            icons={icons}
            actions={actions}
            iconsContainerClassName={iconsContainerClassName}
            childrenContainerClassName={childrenContainerClassName}
            actionsContainerClassName={actionsContainerClassName}
        >
            {children}
        </ElementFragments>
    );

    if (href !== undefined) {
        const isExternalLink = href
            && typeof href === 'string'
            && (isValidUrl(href) || href.startsWith('mailto:'));

        if (isExternalLink) {
            return (
                <a
                    className={className}
                    href={href}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link
                className={className}
                to={href}
            >
                {children}
            </Link>
        );
    }

    return (
        <RawButton
            className={className}
            // eslint-disable-next-line react/destructuring-assignment
            name={props.name}
            // eslint-disable-next-line react/destructuring-assignment
            onClick={props.onClick}
        >
            {content}
        </RawButton>
    );
}

export default genericMemo(DropdownMenuItem);
