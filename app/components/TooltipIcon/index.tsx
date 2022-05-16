import React from 'react';
import { useBooleanState } from '@the-deep/deep-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import useFloatPlacement from '../../hooks/useFloatPlacement';

import styles from './styles.css';

interface TooltipIconProps {
    className?: string;
    infoLabel?: React.ReactNode;
    children?: React.ReactNode;
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
                <div
                    className={styles.tooltip}
                    style={placement}
                >
                    {children }
                </div>
            )}
        </>
    );
}

export default TooltipIcon;
