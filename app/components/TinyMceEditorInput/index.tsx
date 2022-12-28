import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { InputContainer } from '@togglecorp/toggle-ui';

import { Editor } from '@tinymce/tinymce-react';

import styles from './styles.css';

const TINY_MCE_KEY = process.env.REACT_APP_TINY_MCE_KEY as string;

interface Props<N extends string> {
    name: N;
    className?: string;
    value: string | undefined | null;
    onChange: (newVal: string | undefined, name: N) => void;
    error?: string;
    label?: string;
}

function TinyMceEditorInput<N extends string>(props: Props<N>) {
    const {
        className,
        label,
        error,
        value,
        name,
        onChange,
    } = props;

    const handleChange = useCallback((newText: string | undefined) => {
        onChange(newText, name);
    }, [onChange, name]);

    return (
        <InputContainer
            label={label}
            inputSectionClassName={styles.inputSection}
            className={_cs(styles.tinyMceEditorInput, className)}
            error={error}
            inputContainerClassName={styles.input}
            input={(
                <Editor
                    apiKey={TINY_MCE_KEY}
                    value={value ?? ''}
                    plugins="link"
                    onEditorChange={handleChange}
                    init={{ menubar: 'edit insert format' }}
                    toolbar="undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link"
                />
            )}
        />
    );
}

export default TinyMceEditorInput;
