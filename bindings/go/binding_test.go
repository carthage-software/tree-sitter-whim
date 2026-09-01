package tree_sitter_whim_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_whim "github.com/carthage-software/tree-sitter-whim/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_whim.Language())
	if language == nil {
		t.Errorf("Error loading Whim grammar")
	}
}
