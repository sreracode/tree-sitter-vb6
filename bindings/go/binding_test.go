package tree_sitter_vb6_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_vb6 "github.com/tree-sitter/tree-sitter-vb6/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_vb6.Language())
	if language == nil {
		t.Errorf("Error loading TreeSitterVb6 grammar")
	}
}
