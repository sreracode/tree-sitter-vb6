import XCTest
import SwiftTreeSitter
import TreeSitterVb6

final class TreeSitterVb6Tests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_vb6())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading TreeSitterVb6 grammar")
    }
}
