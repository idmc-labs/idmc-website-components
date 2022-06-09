import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoArrowDown,
    IoArrowUp,
} from 'react-icons/io5';
import ellipsize from 'html-ellipsis';

import Button from '#components/Button';

import styles from './styles.css';

interface Props {
    className?: string;
    footerClassName?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    darkMode?: boolean;
    expandDisabled?: boolean;
    maxCharacters?: number;
}

function EllipsizedContent(props: Props) {
    const {
        className,
        footerClassName,
        children,
        footer,
        darkMode,
        expandDisabled = false,
        maxCharacters = 400,
    } = props;

    const [shouldEllipsize, setShouldEllipsize] = React.useState(false);
    const [isEllipsized, setIsEllipsized] = React.useState(true);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dummyContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const dummyEl = dummyContainerRef.current;
        const containerEl = containerRef.current;

        if (dummyEl && containerEl) {
            const originalContent = dummyEl.innerHTML;
            const ellipsized = ellipsize(originalContent, maxCharacters, true);
            containerEl.innerHTML = ellipsized;

            if (ellipsized === originalContent) {
                setShouldEllipsize(false);
                setIsEllipsized(false);
            } else {
                setShouldEllipsize(true);
                setIsEllipsized(true);
            }
        }
    }, [children, maxCharacters]);

    React.useEffect(() => {
        const dummyEl = dummyContainerRef.current;
        const containerEl = containerRef.current;

        if (dummyEl && containerEl) {
            const originalContent = dummyEl.innerHTML;

            if (isEllipsized) {
                const ellipsized = ellipsize(originalContent, maxCharacters);
                containerEl.innerHTML = ellipsized;
            } else {
                containerEl.innerHTML = originalContent;
            }
        }
    }, [children, maxCharacters, isEllipsized]);

    return (
        <div
            className={_cs(
                styles.ellipsizedContent,
                darkMode && styles.darkMode,
                className,
            )}
        >
            <div
                ref={dummyContainerRef}
                style={{ display: 'none' }}
            >
                {children}
            </div>
            <div
                ref={containerRef}
            />
            {footer && (
                <div className={_cs(styles.footer, footerClassName)}>
                    {footer}
                </div>
            )}
            {!expandDisabled && shouldEllipsize && (
                <Button
                    className={styles.ellipsizeToggleButton}
                    name={!isEllipsized}
                    onClick={setIsEllipsized}
                    actions={isEllipsized ? <IoArrowDown /> : <IoArrowUp />}
                    variant="action"
                    darkMode={darkMode}
                >
                    {isEllipsized ? 'Read More' : 'See Less'}
                </Button>
            )}
        </div>
    );
}

export default EllipsizedContent;
