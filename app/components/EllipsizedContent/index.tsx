import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoArrowDown,
    IoArrowUp,
} from 'react-icons/io5';

import Button from '#components/Button';

import styles from './styles.css';

interface Props {
    className?: string;
    footerClassName?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    darkMode?: boolean;
    expandDisabled?: boolean;
}

function EllipsizedContent(props: Props) {
    const {
        className,
        footerClassName,
        children,
        footer,
        darkMode,
        expandDisabled = false,
    } = props;

    const [isEllipsized, setIsEllipsized] = React.useState(false);
    const [shouldEllipsize, setShouldEllipsize] = React.useState(true);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const checkAndSetEllipsize = () => {
            const el = containerRef.current;
            if (el) {
                if (el.offsetHeight < el.scrollHeight) {
                    setIsEllipsized(true);
                } else {
                    setIsEllipsized(false);
                }

                // TODO: The logic in this component breaks when
                // you expand the content and then resize it to
                // the point where it is not ellipsized.
                // After that, it will no longer will be ellipsized
                // even if the lines extend its limit,
                // Hence, we set should ellipsize true after resize
                setShouldEllipsize(true);
            }
        };

        checkAndSetEllipsize();
        window.addEventListener('resize', checkAndSetEllipsize);

        return () => {
            window.removeEventListener('resize', checkAndSetEllipsize);
        };
    }, []);

    React.useEffect(() => {
        const el = containerRef.current;
        if (el && el.offsetHeight < el.scrollHeight) {
            setIsEllipsized(true);
        }
    }, [shouldEllipsize]);

    if (!children) {
        return null;
    }

    return (
        <div className={_cs(styles.ellipsizedContent, className)}>
            <div
                ref={containerRef}
                className={_cs(
                    styles.container,
                    shouldEllipsize && styles.ellipsized,
                )}
            >
                {children}
            </div>
            {footer && (
                <div className={_cs(styles.footer, footerClassName)}>
                    {footer}
                </div>
            )}
            {isEllipsized && !expandDisabled && (
                <Button
                    className={_cs(
                        styles.ellipsizeToggleButton,
                        darkMode && styles.darkButton,
                    )}
                    name={!shouldEllipsize}
                    onClick={setShouldEllipsize}
                    actions={shouldEllipsize ? <IoArrowDown /> : <IoArrowUp />}
                    variant="secondary"
                >
                    {shouldEllipsize ? 'Read More' : 'See Less'}
                </Button>
            )}
        </div>
    );
}

export default EllipsizedContent;
