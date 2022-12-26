import React, { useCallback } from 'react';

interface DragHandler<T> {
    (e: React.DragEvent<T>): void;
}

function useDropHandler<T = HTMLDivElement>(
    dropHandler: DragHandler<T>,
    dragStartHandler?: DragHandler<T>,
) {
    const [dropping, setDropping] = React.useState(false);
    const dragEnterCount = React.useRef(0);

    const onDragOver = useCallback(
        (e: React.DragEvent<T>) => {
            e.preventDefault();
        },
        [],
    );

    const onDragEnter = useCallback(
        (e: React.DragEvent<T>) => {
            if (dragEnterCount.current === 0) {
                setDropping(true);

                if (dragStartHandler) {
                    dragStartHandler(e);
                }
            }
            dragEnterCount.current += 1;
        },
        [dragStartHandler],
    );

    const onDragLeave = useCallback(
        () => {
            dragEnterCount.current -= 1;
            if (dragEnterCount.current === 0) {
                setDropping(false);
            }
        },
        [],
    );

    const onDrop = useCallback(
        (e: React.DragEvent<T>) => {
            dragEnterCount.current = 0;
            setDropping(false);

            dropHandler(e);

            e.preventDefault();
        },
        [dropHandler],
    );

    return {
        dropping,

        onDragOver,
        onDragEnter,
        onDragLeave,
        onDrop,
    };
}

export default useDropHandler;
