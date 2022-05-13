import React from 'react';
import ReactTooltip from 'react-tooltip';
import {
    IoInformationCircleOutline,
} from 'react-icons/io5';

import useId from '../../hooks/useId';

import styles from './styles.css';

interface TooltipIconProps {
    children?: React.ReactNode;
}
function TooltipIcon(props: TooltipIconProps) {
    const {
        children,
    } = props;
    const id = useId();

    if (!children) {
        return null;
    }
    return (
        <>
            <span
                data-tip
                data-for={id}
            >
                <IoInformationCircleOutline />
            </span>
            <ReactTooltip
                id={id}
                place="top"
                type="dark"
                effect="solid"
                className={styles.tooltip}
            >
                {children}
            </ReactTooltip>
        </>
    );
}

export default TooltipIcon;
