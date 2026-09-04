package tree_sitter_whim_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_whim "github.com/carthage-software/tree-sitter-whim/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_whim.Language())
	parser := tree_sitter.NewParser()
	defer parser.Close()
	if err := parser.SetLanguage(language); err != nil {
		t.Fatalf("Error loading Whim grammar: %v", err)
	}

	tree := parser.Parse([]byte("final class Box<T> {}\n$box = new Box::<string>();"), nil)
	defer tree.Close()
	if tree.RootNode().HasError() {
		t.Error("Error parsing Whim syntax")
	}
}
