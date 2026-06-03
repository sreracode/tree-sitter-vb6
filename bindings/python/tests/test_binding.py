from unittest import TestCase

import tree_sitter
import tree_sitter_vb6


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_vb6.language())
        except Exception:
            self.fail("Error loading TreeSitterVb6 grammar")
