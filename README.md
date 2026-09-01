# tree-sitter-whim

A small [Tree-sitter] grammar for [Whim].

This is not a full Whim parser. It recognizes Whim keywords and does not treat
text inside strings, comments, variables, or identifiers as keywords. Whim's
language server provides full semantic highlighting. This parser registers the
language and highlights keywords when semantic tokens are unavailable.

## Use

The repository includes C, Go, Node.js, Python, Rust, and Swift bindings.
Editors such as Zed can use the generated parser directly from this Git
repository.

## Develop

Install Node.js and a C compiler, then run:

\`\`\`sh
npm ci
npm run generate
npm test
\`\`\`

The generated files under \`src/\` form part of each release and must remain in
sync with \`grammar.js\`.

## License

tree-sitter-whim is available under the MIT License or the Apache License,
Version 2.0, at your option.

[Tree-sitter]: https://tree-sitter.github.io/tree-sitter/
[Whim]: https://github.com/carthage-software/whim
