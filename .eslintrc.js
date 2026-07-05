module.exports = {
  root: true,
  extends: ["expo", "eslint:recommended"],
  env: {
    node: true,
    es2021: true
  },
  ignorePatterns: ["dist/", "web-build/", "coverage/", ".expo/"]
};
