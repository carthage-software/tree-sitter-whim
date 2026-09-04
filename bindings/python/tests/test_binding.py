from unittest import TestCase

from tree_sitter import Language, Parser
import tree_sitter_whim


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            parser = Parser(Language(tree_sitter_whim.language()))
        except Exception:
            self.fail("Error loading Whim grammar")

        tree = parser.parse(
            b"final class Box<T> {}\n$box = new Box::<string>();"
        )
        self.assertFalse(tree.root_node.has_error)
