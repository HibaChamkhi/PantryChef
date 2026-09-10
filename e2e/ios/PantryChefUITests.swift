import XCTest

/// End-to-end walk through PantryChef on the simulator.
/// Run with `npm run test:ui` (needs Metro running: `npx expo start`).
final class PantryChefUITests: XCTestCase {
    private var app: XCUIApplication!
    private let uniqueName = "Cherry tomatoes \(Int(Date().timeIntervalSince1970) % 10000)"

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication(bundleIdentifier: "com.pantrychef.app")

        addUIInterruptionMonitor(withDescription: "System alerts") { alert in
            for label in ["Allow Full Access", "Allow", "Open", "OK"] {
                let button = alert.buttons[label]
                if button.exists {
                    button.tap()
                    return true
                }
            }
            return false
        }
        app.launch()
    }

    private func waitFor(_ element: XCUIElement, _ timeout: TimeInterval = 15, file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "Timed out waiting for \(element)", file: file, line: line)
    }

    private func text(containing fragment: String) -> XCUIElement {
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS[cd] %@", fragment)).firstMatch
    }

    /// React Native controlled inputs drop characters when XCUITest types at full
    /// speed, so type one character at a time with a short pause.
    private func typeSlowly(_ text: String, into field: XCUIElement) {
        for character in text {
            field.typeText(String(character))
            usleep(40_000)
        }
    }

    private func anyText(containing fragment: String) -> XCUIElement {
        app.descendants(matching: .any).containing(NSPredicate(format: "label CONTAINS[cd] %@", fragment)).firstMatch
    }

    private func any(_ label: String) -> XCUIElement {
        app.descendants(matching: .any)[label].firstMatch
    }

    private func tab(_ name: String) -> XCUIElement {
        app.buttons.containing(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
    }

    private func snap(_ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    /// Closes the software keyboard if it is showing, so bottom controls are tappable.
    private func dismissKeyboard() {
        guard app.keyboards.count > 0 else { return }
        // Return on an empty quick-add field closes the keyboard (app behaviour).
        app.typeText("\n")
        if app.keyboards.firstMatch.waitForNonExistence(timeout: 2) { return }
        let done = app.keyboards.firstMatch.descendants(matching: .any).matching(
            NSPredicate(format: "label IN {'done', 'Done', 'return', 'Return', 'go', 'Go'}")
        ).firstMatch
        if done.exists { done.tap() }
        if !app.keyboards.firstMatch.waitForNonExistence(timeout: 2) {
            // Lists dismiss the keyboard on drag.
            app.swipeUp()
            _ = app.keyboards.firstMatch.waitForNonExistence(timeout: 3)
        }
    }

    /// Picks the first photo in the system picker, retrying once if the sheet
    /// was still animating in when the first tap landed. Returns false if no
    /// picker appeared. `settled` is the text that proves the picker went away.
    private func pickFirstPhoto(settled: XCUIElement) -> Bool {
        let pickerImage = app.images.firstMatch
        let pickerCell = app.cells.firstMatch
        guard pickerImage.waitForExistence(timeout: 20) || pickerCell.waitForExistence(timeout: 5) else {
            return false
        }
        for attempt in 0..<2 {
            sleep(1)
            snap("picker-before-tap-\(attempt)")
            // The picker also shows small icons (for example in its privacy banner);
            // pick the first image that is the size of a photo thumbnail.
            let thumbnail = app.images.allElementsBoundByIndex.first { image in
                let width = image.frame.width
                return width > 80 && width < 260 && image.frame.minY > 60
            }
            let target = thumbnail ?? (pickerImage.exists ? pickerImage : pickerCell)
            // Remote-process elements are often reported as not hittable; tap by coordinate.
            if target.exists { target.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap() }
            if settled.waitForExistence(timeout: 8) { return true }
            snap("picker-after-tap-\(attempt)")
        }
        return settled.waitForExistence(timeout: 30)
    }

    private func goBack() {
        let back = app.navigationBars.buttons.firstMatch
        if back.waitForExistence(timeout: 5) { back.tap() }
    }

    func testFullFlow() throws {
        // 1. Pantry loads (Metro bundle can take a moment on first launch).
        waitFor(app.staticTexts["Your pantry"], 60)
        app.tap() // flush any pending system alert through the interruption monitor

        // 2. Quick add from the inline bar.
        let quickAdd = app.textFields["Ingredient name"].firstMatch
        waitFor(quickAdd)
        quickAdd.tap()
        typeSlowly(uniqueName + "\n", into: quickAdd)
        waitFor(text(containing: uniqueName))

        // 3. Quantity stepper on the newest row (top of the list).
        let increase = app.buttons["Increase quantity"].firstMatch
        waitFor(increase)
        increase.tap()
        waitFor(text(containing: "2 pcs"))

        // 4. Full Add Item form: name, unit, expiry, auto category.
        app.buttons["Add item"].tap()
        waitFor(any("Type it in"))
        let nameField = app.textFields["New ingredient name"].firstMatch
        waitFor(nameField)
        nameField.tap()
        typeSlowly("Feta cheese", into: nameField)
        app.buttons["g"].firstMatch.tap()
        app.buttons["1 week"].firstMatch.tap()
        app.buttons["Add to pantry"].firstMatch.tap()
        waitFor(text(containing: "Feta cheese"))
        waitFor(text(containing: "Dairy & eggs"))
        waitFor(text(containing: "Good for 7 days"))

        // 5. Photo path (simulated recognition when no API key is configured).
        app.buttons["Add item"].tap()
        waitFor(any("Snap a photo"))
        any("Snap a photo").tap()
        waitFor(app.buttons["Choose from library"])
        app.buttons["Choose from library"].tap()
        // If iOS still shows a permission alert, dismiss it via SpringBoard.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow Full Access", "Allow"] {
            let allow = springboard.buttons[label]
            if allow.waitForExistence(timeout: 3) { allow.tap(); break }
        }
        // The photo picker runs out of process; try to pick the first image.
        var photoFlowCovered = false
        if pickFirstPhoto(settled: text(containing: "Found")) {
            let addButton = app.buttons.containing(NSPredicate(format: "label BEGINSWITH 'Add '")).firstMatch
            waitFor(addButton)
            addButton.tap()
            photoFlowCovered = true
        }
        // Make sure the modal is gone before continuing, whichever path ran.
        let modalBar = app.navigationBars["Add to pantry"]
        if modalBar.waitForExistence(timeout: 2) {
            // Close the topmost Cancel first (a picker sheet, if still up), then the modal.
            for _ in 0..<2 {
                let cancels = app.buttons.matching(identifier: "Cancel")
                if cancels.count == 0 { break }
                cancels.element(boundBy: cancels.count - 1).tap()
                if modalBar.waitForNonExistence(timeout: 3) { break }
            }
        }
        XCTAssertTrue(modalBar.waitForNonExistence(timeout: 10), "Add item modal did not close")
        waitFor(app.staticTexts["Your pantry"])
        sleep(1) // let the modal dismiss animation finish before pushing a new screen
        dismissKeyboard()
        snap("pantry-after-photo")

        // 6. Generate recipes (offline chef when no API key).
        app.buttons["Generate recipes"].tap()
        // The offline chef answers in about a second, so the thinking state may
        // already be gone by the first poll; accept either state.
        let thinking = app.staticTexts["Chef is thinking"]
        let results = app.staticTexts["Three ideas for tonight"]
        let deadline = Date().addingTimeInterval(90)
        while Date() < deadline && !results.exists {
            if thinking.exists { break }
            usleep(200_000)
        }
        snap("after-generate")
        waitFor(results, 90)
        snap("recipes")
        // One bookmark button per card (texts are exposed twice by RN, so count buttons).
        let bookmarks = app.buttons.matching(identifier: "Save recipe")
        XCTAssertEqual(bookmarks.count, 3, "Expected three recipe cards")

        // 7. Open the first recipe and exercise the cooking view.
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'servings'")).firstMatch.tap()
        waitFor(text(containing: "in your pantry"))
        snap("recipe-detail")
        let start = app.buttons["Start timer"].firstMatch
        waitFor(start)
        start.tap()
        waitFor(app.buttons["Pause timer"].firstMatch)
        app.buttons["Pause timer"].firstMatch.tap()
        waitFor(app.buttons["Start timer"].firstMatch)
        app.buttons["Reset timer"].firstMatch.tap()
        any("Step 1").tap()
        waitFor(text(containing: "1/"))

        // 8. Save it from the header and confirm it appears on the Saved tab.
        app.buttons["Save recipe"].firstMatch.tap()
        waitFor(app.buttons["Remove from saved"].firstMatch)
        let title = app.staticTexts.containing(NSPredicate(format: "label BEGINSWITH 'One-pan'")).firstMatch.label
        goBack()
        waitFor(app.staticTexts["Three ideas for tonight"])
        goBack()
        waitFor(app.staticTexts["Your pantry"])
        tab("Saved").tap()
        waitFor(app.staticTexts["Saved recipes"])
        waitFor(anyText(containing: title))
        snap("saved")

        // 9. Back to the pantry: swipe to remove the item we added.
        tab("Pantry").tap()
        let row = text(containing: uniqueName)
        waitFor(row)
        row.swipeLeft()
        let remove = app.buttons["Remove \(uniqueName)"].firstMatch
        waitFor(remove)
        remove.tap()
        XCTAssertTrue(row.waitForNonExistence(timeout: 5))

        XCTAssertTrue(photoFlowCovered, "Photo picker could not be automated; photo flow not covered by this run")
    }

    func testDishScan() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        tab("Scan").tap()
        waitFor(app.staticTexts["What is this dish?"])
        app.buttons["Choose a dish photo"].tap()

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow Full Access", "Allow"] {
            let allow = springboard.buttons[label]
            if allow.waitForExistence(timeout: 3) { allow.tap(); break }
        }
        XCTAssertTrue(pickFirstPhoto(settled: text(containing: "looks like")), "Could not pick a photo and get a dish result")
        waitFor(text(containing: "recipes for this dish"))
        snap("dish-scan-result")
        XCTAssertGreaterThanOrEqual(app.buttons.matching(identifier: "Save recipe").count, 1, "Expected at least one recipe")

        // Open the recipe and make sure the cooking view works from the scan too.
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'servings'")).firstMatch.tap()
        waitFor(text(containing: "in your pantry"))
        waitFor(app.buttons["Start timer"].firstMatch)
        snap("dish-scan-recipe")
        goBack()
        waitFor(text(containing: "recipes for this dish"))

        app.buttons["Scan another dish"].tap()
        waitFor(app.buttons["Choose a dish photo"])
    }
}

// MARK: - Feature tests added with the second batch of features

extension PantryChefUITests {
    func testShoppingListAndCookedIt() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        // Seed one shopping line so the list steps do not depend on what the recipe needs.
        tab("Shopping").tap()
        waitFor(app.staticTexts["Shopping list"])
        let seedField = app.textFields["Shopping item name"].firstMatch
        waitFor(seedField)
        seedField.tap()
        typeSlowly("Lemongrass\n", into: seedField)
        dismissKeyboard()
        tab("Pantry").tap()
        waitFor(app.staticTexts["Your pantry"])
        app.buttons["Generate recipes"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'servings'")).firstMatch.tap()
        waitFor(text(containing: "in your pantry"))

        // Servings scaler doubles an amount.
        let before = app.staticTexts["2 tbsp"].firstMatch
        waitFor(before)
        app.buttons["More servings"].firstMatch.tap()
        waitFor(app.staticTexts["3 tbsp"].firstMatch)
        app.buttons["Fewer servings"].firstMatch.tap()
        waitFor(app.staticTexts["2 tbsp"].firstMatch)

        // Missing ingredients go to the shopping list (absent when the pantry already has everything).
        let addMissing = app.buttons.containing(NSPredicate(format: "label BEGINSWITH 'Add ' AND label CONTAINS 'shopping list'")).firstMatch
        if addMissing.waitForExistence(timeout: 5) {
            addMissing.tap()
            let alertOk = app.alerts.buttons["OK"].firstMatch
            if alertOk.waitForExistence(timeout: 5) { alertOk.tap() }
        }

        // Cooked it: remove the matched pantry items.
        app.swipeUp()
        let cooked = app.buttons["I cooked this"].firstMatch
        waitFor(cooked)
        cooked.tap()
        waitFor(app.staticTexts["What did you use up?"])
        let confirm = app.buttons.containing(NSPredicate(format: "label BEGINSWITH 'Remove '")).firstMatch
        waitFor(confirm)
        confirm.tap()
        waitFor(app.staticTexts["Dinner is served"])

        goBack()
        waitFor(app.staticTexts["Three ideas for tonight"])
        goBack()
        waitFor(app.staticTexts["Your pantry"])
        // The stats card now records at least one used item.
        waitFor(text(containing: "this month"))

        // Shopping tab shows the lines; check one and move it to the pantry.
        tab("Shopping").tap()
        waitFor(app.staticTexts["Shopping list"])
        let firstLine = app.descendants(matching: .any).containing(NSPredicate(format: "label BEGINSWITH 'Mark '")).firstMatch
        waitFor(firstLine)
        let lineLabel = firstLine.label
        firstLine.tap()
        let move = app.buttons.containing(NSPredicate(format: "label BEGINSWITH 'Move '")).firstMatch
        waitFor(move)
        move.tap()
        XCTAssertTrue(app.descendants(matching: .any)[lineLabel].firstMatch.waitForNonExistence(timeout: 5))
        tab("Pantry").tap()
        waitFor(app.staticTexts["Your pantry"])
    }

    func testSettingsDietAndLanguage() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        app.buttons["Settings"].tap()
        waitFor(text(containing: "diet"))
        // Settings persist between runs, so set an explicit state rather than toggling.
        app.buttons["No restriction"].tap()
        app.buttons["Vegetarian"].tap()
        if !app.buttons["Nuts"].isSelected { app.buttons["Nuts"].tap() }

        // Reminders toggle asks for permission; the interruption monitor allows it.
        let toggle = app.switches["Expiry reminders"].firstMatch
        waitFor(toggle)
        toggle.tap()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let allow = springboard.buttons["Allow"]
        if allow.waitForExistence(timeout: 6) { allow.tap() }
        waitFor(text(containing: "reminder"))
        sleep(1)

        // Switch to French and back.
        app.buttons["Français"].tap()
        waitFor(tab("Garde-manger"), 20)
        waitFor(text(containing: "regime"), 20)
        app.buttons["English"].tap()
        waitFor(text(containing: "diet"), 20)
        app.buttons["Done"].firstMatch.tap()
        waitFor(app.staticTexts["Your pantry"])

        // Recipes respect the diet: no chicken in any title.
        app.buttons["Generate recipes"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        waitFor(text(containing: "Respecting: Vegetarian, Nuts"))
        XCTAssertFalse(app.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] 'chicken thighs with'")).firstMatch.exists)

        // Filters: under 30 minutes gives quick recipes, Italian adds the cuisine.
        app.buttons["Under 30 min"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        XCTAssertTrue(app.buttons["Under 30 min"].isSelected, "Time filter should be selected")
        app.buttons["Italian"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        waitFor(anyText(containing: "Italian "), 30)
        app.buttons["Any time"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        app.buttons["Any cuisine"].tap()
        waitFor(app.staticTexts["Three ideas for tonight"], 90)
        goBack()

        // Reset the diet so other tests see the default pantry recipes.
        app.buttons["Settings"].tap()
        waitFor(text(containing: "diet"))
        app.buttons["No restriction"].tap()
        if app.buttons["Nuts"].isSelected { app.buttons["Nuts"].tap() }
        app.buttons["Done"].firstMatch.tap()
        waitFor(app.staticTexts["Your pantry"])
    }

    func testReceiptAndBarcode() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        app.buttons["Add item"].tap()
        waitFor(any("Receipt"))
        any("Receipt").tap()
        waitFor(app.buttons["Choose from library"])
        app.buttons["Choose from library"].tap()
        XCTAssertTrue(pickFirstPhoto(settled: text(containing: "Found")), "Receipt scan did not produce items")
        let addButton = app.buttons.containing(NSPredicate(format: "label BEGINSWITH 'Add '")).firstMatch
        waitFor(addButton)
        addButton.tap()
        waitFor(app.staticTexts["Your pantry"])
        sleep(1)

        // Barcode: manual entry with a well-known product code.
        app.buttons["Add item"].tap()
        waitFor(app.buttons["Scan a barcode instead"])
        app.buttons["Scan a barcode instead"].tap()
        let field = app.textFields["Barcode number"].firstMatch
        waitFor(field)
        field.tap()
        typeSlowly("3017620422003", into: field)
        app.buttons["Look up"].firstMatch.tap()
        waitFor(text(containing: "found"), 30)
        let addProduct = app.buttons["Add to pantry"].firstMatch
        waitFor(addProduct)
        addProduct.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        waitFor(app.staticTexts["Your pantry"], 15)
        waitFor(text(containing: "Nutella"), 15)
    }

    func testWeeklyPlan() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        app.buttons["Plan my week"].tap()
        waitFor(app.staticTexts["Weekly plan"])
        let planButton = app.buttons["Plan five dinners"].firstMatch
        if planButton.waitForExistence(timeout: 5) { planButton.tap() }
        waitFor(app.staticTexts["MONDAY"], 60)
        waitFor(app.staticTexts["FRIDAY"])
        XCTAssertEqual(app.buttons.matching(identifier: "Save recipe").count, 5, "Expected five planned dinners")
        app.swipeUp()
        app.swipeUp()
        let addAll = app.buttons.containing(NSPredicate(format: "label CONTAINS 'shopping list'")).firstMatch
        if addAll.waitForExistence(timeout: 5) {
            addAll.tap()
            let alertOk = app.alerts.buttons["OK"].firstMatch
            if alertOk.waitForExistence(timeout: 5) { alertOk.tap() }
        }
        goBack()
        waitFor(app.staticTexts["Your pantry"])
    }
}

extension PantryChefUITests {
    func testWhereToBuy() throws {
        waitFor(app.staticTexts["Your pantry"], 60)
        tab("Shopping").tap()
        waitFor(app.staticTexts["Shopping list"])
        let addField = app.textFields["Shopping item name"].firstMatch
        waitFor(addField)
        addField.tap()
        typeSlowly("Olive oil\n", into: addField)
        dismissKeyboard()
        app.buttons["Where to buy"].tap()
        waitFor(any("Nearby"))

        // Location permission alert, then Overpass results (simulator location set by the test script).
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow While Using App", "Allow Once", "Allow"] {
            let allow = springboard.buttons[label]
            if allow.waitForExistence(timeout: 4) { allow.tap(); break }
        }
        waitFor(anyText(containing: "stores nearby"), 120)
        XCTAssertTrue(app.buttons["Directions"].firstMatch.waitForExistence(timeout: 10))
        snap("stores-nearby")

        // Online: list preview and copy.
        any("Online").tap()
        waitFor(anyText(containing: "Olive oil"))
        app.buttons["Copy shopping list"].tap()
        waitFor(app.buttons["List copied"])
        XCTAssertTrue(app.buttons["Open Google Shopping"].exists)
        snap("stores-online")
        goBack()
        waitFor(app.staticTexts["Shopping list"])
    }
}
