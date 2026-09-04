# tree-sitter-whim

A complete [Tree-sitter] grammar for [Whim]. It covers Whim 0.3 syntax,
including declarations, types, patterns, expressions, language constructs,
string interpolation, and comments.

## Use

The repository includes C, Go, Node.js, Python, Rust, and Swift bindings. It
also includes a syntax highlight query for editors that use Tree-sitter.

## Develop

Install Node.js and a C compiler, then run:

```sh
npm ci
npm run generate
npm test
```

The test corpus covers every named syntax node. The Rust tests also check
invalid syntax and the highlight query. The generated files under `src/` form
part of each release and must remain in sync with `grammar.js`.

## License

tree-sitter-whim is available under the MIT License or the Apache License,
Version 2.0, at your option.

[Tree-sitter]: https://tree-sitter.github.io/tree-sitter/
[Whim]: https://github.com/carthage-software/whim
