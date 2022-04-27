import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

function useSanitizedHtml(rawHtml: string | null | undefined) {
    const sanitizedHtml = React.useMemo(() => {
        if (!rawHtml) {
            return undefined;
        }
        return sanitizeHtml(
            rawHtml,
            {
                allowedTags: ['b', 'h', 'p', 'bold', 'strong', 'li', 'ul', 'a', 'br'],
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
    }, [rawHtml]);

    return sanitizedHtml;
}

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'dangerouslySetInnerHTML' | 'value'>{
    value: string | null | undefined;
}

function RichTextOutput(props: Props) {
    const {
        className,
        value,
        ...otherProps
    } = props;

    const sanitizedValue = useSanitizedHtml(value);

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
