// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CueWave",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    products: [
        .executable(
            name: "CueWave",
            targets: ["CueWave"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "CueWave",
            dependencies: [],
            path: "CueWave"
        )
    ]
)