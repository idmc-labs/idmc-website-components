export type DisplacementType = 'conflict' | 'disaster';

// The IDU feed sends capitalized displacement types ('Conflict' / 'Disaster');
// map them to the lowercase variant the presentational components expect.
export function getDisplacementVariant(
    displacementType: string | undefined | null,
): DisplacementType | null {
    if (displacementType === 'Conflict') {
        return 'conflict';
    }
    if (displacementType === 'Disaster') {
        return 'disaster';
    }
    return null;
}
