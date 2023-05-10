import React, { useState, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { InputContainer } from '@togglecorp/toggle-ui';
import { Editor } from '@tinymce/tinymce-react';

import useTranslation from '#hooks/useTranslation';
import {
    goodPracticesDashboard,
} from '#base/configs/lang';
import {
    TINY_MCE_KEY,
} from '#base/configs/tinyMceEditor';

import styles from './styles.css';

interface Props<N extends string> {
    name: N;
    className?: string;
    value: string | undefined | null;
    onChange: (newVal: string | undefined, name: N) => void;
    error?: string;
    label?: string;
    labelContainerClassName?: string;
    textLimit?: number;
}

function TinyMceEditorInput<N extends string>(props: Props<N>) {
    const {
        className,
        label,
        error,
        value,
        name,
        onChange,
        textLimit,
        labelContainerClassName,
    } = props;

    const strings = useTranslation(goodPracticesDashboard);

    const sizeLimit = textLimit ?? 2000;
    const [length, setLength] = useState(0);
    const lengthExceeded = length >= sizeLimit;

    const handleChange = useCallback((newText: string | undefined, editor) => {
        const textLength = editor.getContent({ format: 'text' }).length;
        if (textLength <= sizeLimit) {
            onChange(newText, name);
            setLength(textLength);
        }
    }, [
        onChange,
        name,
        sizeLimit,
    ]);

    return (
        <InputContainer
            label={label}
            labelContainerClassName={labelContainerClassName}
            inputSectionClassName={styles.inputSection}
            className={_cs(styles.tinyMceEditorInput, className)}
            error={error}
            inputContainerClassName={styles.input}
            input={(
                <>
                    <Editor
                        apiKey={TINY_MCE_KEY}
                        value={value ?? ''}
                        plugins="link"
                        onEditorChange={handleChange}
                        init={{ menubar: 'edit insert format' }}
                        toolbar="undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link"
                    />
                    {value && (
                        <div className={styles.textLengthSection}>
                            {lengthExceeded && (
                                <span className={styles.textLimit}>
                                    {strings.textLimitExceeded}
                                </span>
                            )}
                            <span>
                                {sizeLimit - length}
                                /
                                {sizeLimit}
                            </span>
                        </div>
                    )}
                </>
            )}
        />
    );
}

export default TinyMceEditorInput;
