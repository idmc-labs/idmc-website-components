import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

function useSanitizedHtml(rawHtml: string) {
    const sanitizedHtml = React.useMemo(() => (
        sanitizeHtml(
            rawHtml,
            {
                allowedTags: ['b', 'h', 'p', 'bold', 'strong', 'li', 'ul', 'a'],
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
                        },
                    }),
                },
            },
        )
    ), [rawHtml]);

    return sanitizedHtml;
}

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'dangerouslySetInnerHTML'>{
    value: string;
}

function RichTextOutput(props: Props) {
    const {
        className,
        value,
        ...otherProps
    } = props;

    const sanitizedValue = useSanitizedHtml(value);

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
