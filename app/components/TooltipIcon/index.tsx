import React from 'react';
import { useBooleanState } from '@the-deep/deep-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import Portal from '#components/Portal';
import HTMLOutput from '#components/HTMLOutput';

import useFloatPlacement from '../../hooks/useFloatPlacement';

import styles from './styles.css';

interface TooltipIconProps {
    className?: string;
    infoLabel?: React.ReactNode;
    children?: string;
}

function TooltipIcon(props: TooltipIconProps) {
    const {
        className,
        infoLabel = <IoInformationCircleOutline />,
        children,
    } = props;

    const [
        showTooltip,
        setShowTooltipTrue,
        setShowTooltipFalse,
    ] = useBooleanState(false);

    const labelRef = React.useRef<HTMLDivElement>(null);
    const placement = useFloatPlacement(labelRef);

    if (!children) {
        return null;
    }

    return (
        <>
            <span
                className={className}
                ref={labelRef}
                onMouseOver={setShowTooltipTrue}
                onFocus={setShowTooltipTrue}
                onMouseLeave={setShowTooltipFalse}
                onBlur={setShowTooltipFalse}
            >
                {infoLabel}
            </span>
            {showTooltip && (
                <Portal>
                    <div
                        className={styles.tooltip}
                        style={placement}
                    >
                        <HTMLOutput
                            value={children}
                        />
                    </div>
                </Portal>
            )}
        </>
    );
}

export default TooltipIcon;
