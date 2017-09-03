module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-console": 0,
        "prefer-const": ["error", {
            "destructuring": "all"
        }],
        "quotes": ["error", "backtick"],
        "no-param-reassign": 0,
        "comma-dangle": 0,
        "arrow-body-style": 0,
        "consistent-return": 0
    },
    "env": {
        "node": "true"
    }
};
