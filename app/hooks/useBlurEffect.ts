import React from 'react';

function useBlurEffect(
    shouldWatch: boolean,
    callback: (clickedInside: boolean, e: MouseEvent) => void,
    elementRef: React.RefObject<HTMLElement>,
    parentRef: React.RefObject<HTMLElement>,
) {
    React.useEffect(() => {
        const handleDocumentClick = (e) => {
            const { current: element } = elementRef;
            const { current: parent } = parentRef;

            const isElementOrContainedInElement = element
                ? element === e.target || element.contains(e.target)
                : false;
            const isParentOrContainedInParent = parent
                ? parent === e.target || parent.contains(e.target)
                : false;

            const clickedInside = isElementOrContainedInElement || isParentOrContainedInParent;
            callback(clickedInside, e);
        };

        if (shouldWatch) {
            document.addEventListener('click', handleDocumentClick, true);
        } else {
            document.removeEventListener('click', handleDocumentClick, true);
        }

        return () => { document.removeEventListener('click', handleDocumentClick); };
    }, [shouldWatch, callback, elementRef, parentRef]);
}

export default useBlurEffect;
