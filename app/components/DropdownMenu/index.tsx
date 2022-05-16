import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Portal from '#components/Portal';

import useBlurEffect from '../../hooks/useBlurEffect';
import useFloatPlacement from '../../hooks/useFloatPlacement';

import styles from './styles.css';

function DropdownContainer(props) {
    const {
        parentRef,
        elementRef,
        children,
        className,
    } = props;

    const placement = useFloatPlacement(parentRef);

    return (
        <div
            ref={elementRef}
            style={placement}
            className={_cs(styles.dropdownContainer, className)}
        >
            { children }
        </div>
    );
}

function DropdownMenu(props) {
    const {
        className,
        dropdownContainerClassName,
        children,
        label,
        activeClassName,
        persistant,
    } = props;

    const buttonRef = React.useRef(null);
    const dropdownRef = React.useRef(null);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const handleMenuClick = React.useCallback(() => {
        setShowDropdown(true);
    }, [setShowDropdown]);

    const handleBlurCallback = React.useCallback((insideClick) => {
        if (persistant && insideClick) {
            return;
        }
        setShowDropdown(false);
    }, [setShowDropdown, persistant]);

    useBlurEffect(showDropdown, handleBlurCallback, dropdownRef, buttonRef);

    return (
        <>
            <button
                type="button"
                className={_cs(className, styles.dropdownMenu, showDropdown && activeClassName)}
                ref={buttonRef}
                onClick={handleMenuClick}
            >
                { label }
            </button>
            { showDropdown && (
                <Portal>
                    <DropdownContainer
                        elementRef={dropdownRef}
                        className={dropdownContainerClassName}
                        parentRef={buttonRef}
                    >
                        { children }
                    </DropdownContainer>
                </Portal>
            )}
        </>
    );
}

export default DropdownMenu;
