// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterVb6",
    products: [
        .library(name: "TreeSitterVb6", targets: ["TreeSitterVb6"]),
    ],
    dependencies: [
        .package(name: "SwiftTreeSitter", url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterVb6",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterVb6Tests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterVb6",
            ],
            path: "bindings/swift/TreeSitterVb6Tests"
        )
    ],
    cLanguageStandard: .c11
)
