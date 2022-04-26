import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { genericMemo } from '../../utils/common';

import styles from './styles.css';

export interface Props<N extends string | number | undefined> extends Omit<React.HTMLProps<HTMLButtonElement>, 'ref' | 'onClick' | 'name'>{
    className?: string;
    name: N;
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    elementRef?: React.Ref<HTMLButtonElement>;
    focused?: boolean;
}

function RawButton<N extends number | string | undefined>(props: Props<N>) {
    const {
        className,
        onClick,
        children,
        disabled,
        elementRef,
        name,
        focused,
        ...otherProps
    } = props;

    const handleClick = React.useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onClick) {
                onClick(name, e);
            }
        },
        [onClick, name],
    );

    return (
        <button
            ref={elementRef}
            type="button"
            className={_cs(
                styles.rawButton,
                focused && styles.focused,
                className,
            )}
            disabled={disabled}
            onClick={onClick ? handleClick : undefined}
            name={name as string}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            { children }
        </button>
    );
}

export default genericMemo(RawButton);
