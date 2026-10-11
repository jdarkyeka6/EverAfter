import AppKit
import CoreGraphics

// Deterministic, opaque 1024x1024 Everafter app icon, generated on macOS CI.
let side = 1024
guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil,
                                   pixelsWide: side, pixelsHigh: side,
                                   bitsPerSample: 8, samplesPerPixel: 4,
                                   hasAlpha: true, isPlanar: false,
                                   colorSpaceName: .deviceRGB, bytesPerRow: 0,
                                   bitsPerPixel: 0),
      let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fatalError("Couldn't create bitmap context")
}
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = graphics
let cg = graphics.cgContext
let rect = CGRect(x: 0, y: 0, width: side, height: side)

cg.setFillColor(NSColor(srgbRed: 0.07, green: 0.06, blue: 0.16, alpha: 1).cgColor)
cg.fill(rect)
let colors = [
    NSColor(srgbRed: 0.92, green: 0.32, blue: 0.65, alpha: 1).cgColor,
    NSColor(srgbRed: 0.51, green: 0.28, blue: 0.83, alpha: 1).cgColor,
    NSColor(srgbRed: 0.12, green: 0.15, blue: 0.37, alpha: 1).cgColor
] as CFArray
guard let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                colors: colors, locations: [0, 0.50, 1]) else {
    fatalError("Could not create gradient")
}
cg.drawLinearGradient(gradient,
                      start: CGPoint(x: 40, y: 1024),
                      end: CGPoint(x: 960, y: 0), options: [])

cg.setFillColor(NSColor.white.withAlphaComponent(0.11).cgColor)
cg.fillEllipse(in: CGRect(x: -220, y: 420, width: 680, height: 680))
cg.setStrokeColor(NSColor.white.withAlphaComponent(0.27).cgColor)
cg.setLineWidth(13)
cg.strokeEllipse(in: CGRect(x: 130, y: 130, width: 764, height: 764))

let letter = NSAttributedString(string: "E", attributes: [
    .font: NSFont.systemFont(ofSize: 660, weight: .heavy),
    .foregroundColor: NSColor.white
])
let dimensions = letter.size()
letter.draw(at: NSPoint(x: (CGFloat(side) - dimensions.width) / 2,
                        y: (CGFloat(side) - dimensions.height) / 2 - 22))

func sparkle(_ x: CGFloat, _ y: CGFloat, _ radius: CGFloat) {
    cg.setFillColor(NSColor.white.withAlphaComponent(0.90).cgColor)
    cg.beginPath()
    cg.move(to: CGPoint(x: x, y: y + radius))
    cg.addLine(to: CGPoint(x: x + radius * 0.19, y: y + radius * 0.19))
    cg.addLine(to: CGPoint(x: x + radius, y: y))
    cg.addLine(to: CGPoint(x: x + radius * 0.19, y: y - radius * 0.19))
    cg.addLine(to: CGPoint(x: x, y: y - radius))
    cg.addLine(to: CGPoint(x: x - radius * 0.19, y: y - radius * 0.19))
    cg.addLine(to: CGPoint(x: x - radius, y: y))
    cg.addLine(to: CGPoint(x: x - radius * 0.19, y: y + radius * 0.19))
    cg.closePath()
    cg.fillPath()
}
sparkle(795, 803, 84)
sparkle(240, 234, 41)
sparkle(792, 325, 28)

graphics.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Couldn't encode app icon")
}
let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Icon-1024.png"
try FileManager.default.createDirectory(
    at: URL(fileURLWithPath: output).deletingLastPathComponent(),
    withIntermediateDirectories: true
)
try png.write(to: URL(fileURLWithPath: output))
print("Everafter icon generated (1024 x 1024, RGB): \(output)")
