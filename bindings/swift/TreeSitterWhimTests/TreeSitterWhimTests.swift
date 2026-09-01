import XCTest
import SwiftTreeSitter
import TreeSitterWhim

final class TreeSitterWhimTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_whim())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Whim grammar")
    }
}
