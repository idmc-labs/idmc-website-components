import { useEffect } from 'react';

// A page past the end of a shrunken result set renders neither rows nor a pager,
// so nothing on screen can bring the user back.
function useClampedPage(
    activePage: number,
    itemsCount: number | null | undefined,
    maxItemsPerPage: number,
    onActivePageChange: (page: number) => void,
) {
    useEffect(() => {
        if (!itemsCount) {
            return;
        }
        const lastPage = Math.ceil(itemsCount / maxItemsPerPage);
        if (activePage > lastPage) {
            onActivePageChange(lastPage);
        }
    }, [activePage, itemsCount, maxItemsPerPage, onActivePageChange]);
}

export default useClampedPage;
