module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-console": 0,
        "prefer-const": ["error", {
            "destructuring": "all"
        }],
        "quotes": ["error", "single", { "allowTemplateLiterals": true }],
        "no-param-reassign": 0,
        "comma-dangle": 0,
        "arrow-body-style": 0,
        "consistent-return": 0,
        "no-mixed-operators": 0,
        "array-callback-return": 0
    },
    "env": {
        "node": "true"
    }
};
