import XCTest

/// Walks the app and attaches a screenshot of every screen. Not part of the
/// regular suite; run with `npm run screenshots` to refresh docs/screenshots.
final class PantryChefScreenshotTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = true
        app = XCUIApplication(bundleIdentifier: "com.pantrychef.app")
        app.launch()
    }

    private func shot(_ name: String) {
        sleep(1)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func wait(_ element: XCUIElement, _ timeout: TimeInterval = 20) {
        _ = element.waitForExistence(timeout: timeout)
    }

    private func any(_ label: String) -> XCUIElement {
        app.descendants(matching: .any)[label].firstMatch
    }

    private func anyText(containing fragment: String) -> XCUIElement {
        app.descendants(matching: .any).containing(NSPredicate(format: "label CONTAINS[cd] %@", fragment)).firstMatch
    }

    private func tab(_ name: String) -> XCUIElement {
        app.buttons.containing(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
    }

    private func back() {
        let button = app.navigationBars.buttons.firstMatch
        if button.waitForExistence(timeout: 5) { button.tap() }
    }

    private func pickPhoto() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow Full Access", "Allow"] {
            let allow = springboard.buttons[label]
            if allow.waitForExistence(timeout: 3) { allow.tap(); break }
        }
        let image = app.images.firstMatch
        guard image.waitForExistence(timeout: 20) else { return }
        sleep(1)
        // Newest photo last in reading order: the food photo added for the README.
        let thumbnails = app.images.allElementsBoundByIndex.filter { $0.frame.width > 80 && $0.frame.width < 260 && $0.frame.minY > 60 }
        let newest = thumbnails.max { a, b in
            a.frame.minY != b.frame.minY ? a.frame.minY < b.frame.minY : a.frame.minX < b.frame.minX
        }
        (newest ?? image).coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    func testCaptureScreens() throws {
        wait(app.staticTexts["Your pantry"], 60)
        shot("01-pantry")

        app.buttons["Generate recipes"].tap()
        wait(app.staticTexts["Three ideas for tonight"], 90)
        shot("02-recipes")
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'servings'")).firstMatch.tap()
        wait(anyText(containing: "in your pantry"))
        app.swipeUp()
        let start = app.buttons["Start timer"].firstMatch
        if start.waitForExistence(timeout: 5) { start.tap() }
        sleep(2)
        shot("03-cooking")
        back()
        wait(app.staticTexts["Three ideas for tonight"])
        back()
        wait(app.staticTexts["Your pantry"])

        tab("Scan").tap()
        wait(app.staticTexts["What is this dish?"])
        app.buttons["Choose a dish photo"].tap()
        pickPhoto()
        wait(anyText(containing: "recipes for this dish"), 60)
        shot("04-dish-scan-meal")

        tab("Shopping").tap()
        wait(app.staticTexts["Shopping list"])
        app.buttons["Where to buy"].tap()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow While Using App", "Allow Once", "Allow"] {
            let allow = springboard.buttons[label]
            if allow.waitForExistence(timeout: 3) { allow.tap(); break }
        }
        wait(anyText(containing: "stores nearby"), 120)
        shot("05-stores-nearby")
    }
}
