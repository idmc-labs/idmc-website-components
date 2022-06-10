import React, { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const baseTags = [
    'blockquote',
    'div',
    'hr',
    'li',
    'ol',
    'p',
    'pre',
    'ul',

    'a',
    'abbr',
    'b',
    'br',
    'em',
    'i',
    'q',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'u',
];

const headingTags = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
];

function useSanitizedHtml(rawHtml: string | null | undefined, hideHeading?: boolean) {
    const allowedTags = useMemo(
        () => {
            if (hideHeading) {
                return baseTags;
            }
            return [...baseTags, ...headingTags];
        },
        [hideHeading],
    );

    const sanitizedHtml = useMemo(() => {
        if (!rawHtml) {
            return undefined;
        }
        return sanitizeHtml(
            rawHtml,
            {
                allowedTags,
                // TODO: create comprehensive list of the attributes used
                // to improve security
                // allowedAttributes: {
                //   a: ['href'],
                // },
                transformTags: {
                    a: (tagName, attribs) => ({
                        tagName,
                        attribs: {
                            ...attribs,
                            target: '_blank',
                            ref: 'noreferrer',
                        },
                    }),
                },
            },
        );
    }, [rawHtml, allowedTags]);

    return sanitizedHtml;
}

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'dangerouslySetInnerHTML' | 'value'>{
    value: string | null | undefined;
    hideHeadings?: boolean;
}

function RichTextOutput(props: Props) {
    const {
        className,
        value,
        hideHeadings,
        ...otherProps
    } = props;

    const sanitizedValue = useSanitizedHtml(value, hideHeadings);

    if (!sanitizedValue) {
        return null;
    }

    return (
        <div
            {...otherProps}
            className={_cs(styles.richTextOutput, className)}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
                __html: sanitizedValue,
            }}
        />
    );
}

export default RichTextOutput;
