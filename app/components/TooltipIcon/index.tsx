import React, { useEffect, useRef } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoInformationCircleOutline,
    IoCloseOutline,
} from 'react-icons/io5';

import Portal from '#components/Portal';
import HTMLOutput from '#components/HTMLOutput';
import useBooleanState from '#hooks/useBooleanState';

import useFloatPlacement from '../../hooks/useFloatPlacement';

import styles from './styles.css';

interface TooltipIconProps {
    className?: string;
    tooltipClassName?: string;
    infoLabel?: React.ReactNode;
    // plain HTML string (legacy usage via HTMLOutput)
    children?: string;
    // rich JSX content rendered directly
    content?: React.ReactNode;
    trigger?: 'hover' | 'click';
    // shown on the left of the close button row (click-trigger only)
    title?: React.ReactNode;
    // accessible name for the trigger. A text `infoLabel` names itself, so the name is only
    // applied when the trigger renders as an icon -- including the default one.
    label?: string;
}

function TooltipIcon(props: TooltipIconProps) {
    const {
        className,
        tooltipClassName,
        infoLabel,
        children,
        content,
        trigger = 'hover',
        title,
        label = 'More information',
    } = props;

    const boolState = useBooleanState(false);
    const showTooltip = boolState[0];
    const setShowTooltipTrue = boolState[1];
    const setShowTooltipFalse = boolState[2];
    const toggleTooltip = boolState[4];

    const labelRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const placement = useFloatPlacement(labelRef);

    useEffect(() => {
        if (trigger !== 'click' || !showTooltip) {
            return undefined;
        }
        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                !tooltipRef.current?.contains(target)
                && !labelRef.current?.contains(target)
            ) {
                setShowTooltipFalse();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [trigger, showTooltip, setShowTooltipFalse]);

    if (!children && !content) {
        return null;
    }

    // The hover trigger toggles on click too, so the button role it announces is one it
    // honours -- and so a touch device, where hover never fires, can open it at all.
    const triggerProps = trigger === 'click'
        ? {}
        : {
            onMouseOver: setShowTooltipTrue,
            onFocus: setShowTooltipTrue,
            onMouseLeave: setShowTooltipFalse,
            onBlur: setShowTooltipFalse,
        };

    // WCAG 1.4.13: content shown on hover must also be dismissable from the keyboard.
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowTooltipFalse();
        } else if (e.key === 'Enter' || e.key === ' ') {
            toggleTooltip();
        }
    };

    return (
        <>
            <span
                className={_cs(className, trigger === 'click' && styles.clickTrigger)}
                ref={labelRef}
                role="button"
                tabIndex={0}
                aria-expanded={showTooltip}
                // A text `infoLabel` names the trigger itself; an icon carries no text, so
                // the name has to come from here -- including for the default icon.
                aria-label={typeof infoLabel === 'string' ? undefined : label}
                onClick={toggleTooltip}
                onKeyDown={handleKeyDown}
                {...triggerProps}
            >
                {infoLabel ?? <IoInformationCircleOutline />}
            </span>
            {showTooltip && (
                <Portal>
                    <div
                        ref={tooltipRef}
                        className={_cs(styles.tooltip, tooltipClassName)}
                        style={placement}
                    >
                        {trigger === 'click' && (
                            <div className={styles.closeRow}>
                                {title && (
                                    <div className={styles.closeRowTitle}>
                                        {title}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className={styles.closeButton}
                                    onClick={setShowTooltipFalse}
                                    aria-label="Close"
                                >
                                    <IoCloseOutline />
                                </button>
                            </div>
                        )}
                        {content ?? <HTMLOutput value={children ?? ''} />}
                    </div>
                </Portal>
            )}
        </>
    );
}

export default TooltipIcon;
