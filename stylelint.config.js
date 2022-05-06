const config = {
    plugins: [],
    extends: [
        'stylelint-config-recommended',
        'stylelint-config-concentric',
    ],
    rules: {
        indentation: 4,
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
        'no-descending-specificity': false,
    },
};

module.exports = config;
