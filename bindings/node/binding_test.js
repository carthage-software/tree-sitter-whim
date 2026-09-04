import assert from "node:assert";
import { test } from "node:test";
import Parser from "tree-sitter";
import language from "./index.js";

test("can load grammar", () => {
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(language));
});

test("can parse Whim syntax", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(`
    final class Box<T> {
      public function __construct(public T $value) {}
    }

    $box = new Box::<string>('whim');
  `);

  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.namedChild(0).type, "class_declaration");
  assert.equal(tree.rootNode.namedChild(1).type, "expression_statement");
});
