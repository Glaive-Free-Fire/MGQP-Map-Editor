# MGQP Map Editor
![Version](https://img.shields.io/badge/version-1.3.60-blue)

A powerful, browser-based, single-file HTML tool designed for **bilingual editing and translation** of in-game dialogue and other text commands from `MapXXX.txt` files. It provides a user-friendly interface for translators to edit text while respecting character limits and complex formatting tags.

This tool is built to be used offline, running entirely in your web browser without needing a server or internet connection.

## ✨ Features (v1.3.60)

-   **Expanded Command Parsing:** Automatically extracts not just `ShowText`, but also other key commands for a more complete translation workflow:
    -   `Display Name` (Имена локаций)
    -   `ShowChoices` (Варианты выбора)
    -   `When` (Текст, который отображается при выборе)
    -   `Script` & `ScriptMore` (редактируемые скриптовые команды)
-   **Advanced Bilingual Synchronization:** The core feature for comparing translation with the original.
    -   **Intelligent Initial Mapping:** The script performs a sophisticated initial sync by matching dialogue segments between named speakers and by command types.
    -   **Structural Integrity Check:** A **"Status Lamp"** in the control panel shows the percentage of structural similarity between the translated file and the Japanese original based on `CommonEvent` blocks. Mismatches are detailed in the developer console.
    -   **Structure Restore Mode:** A dedicated **"Восстановить структуру"** button allows forcefully re-syncing specified `CommonEvent` blocks in the translation file to match the structure of the Japanese original, automatically merging name/dialogue pairs into the correct format.
    -   **Missing Translation Alerts:** If the Japanese file contains text that is missing in the translation file, the editor will automatically insert a **"ТРЕБУЕТСЯ ПЕРЕВОД"** (TRANSLATION REQUIRED) placeholder block.
-   **Duplicate Detection & Autofill:**
    -   The script automatically finds identical Japanese text blocks.
    -   A **"Дубликат"** button appears on these lines, allowing you to instantly copy the translation from the original line.
    -   The button color indicates status: **green** if texts match, **red** if they differ.
-   **Smart Character Counter & Error Highlighting:**
    -   A highly accurate counter shows the final in-game character count, ignoring all invisible tags (`<...`), codes (`∾n`), and special symbols (`∾`, `∿`).
    -   Text areas turn **red** if the character count exceeds 50 or if a name tag is syntactically broken.
    -   **Error Navigation:** Use the **"←"** and **"→"** buttons in the control panel to quickly jump between all text fields highlighted in red.
-   **Game-Aware Line Splitting (`+` button):**
    -   Features two modes: **Remainder** (fills the line to the limit) and **Equal** (splits in half).
    -   **Understands the 4-line window limit:** When splitting the 4th line of a dialogue window, it automatically creates a new window for the remaining text, preventing overflow in-game.
    -   **Improved `[продолжение]:` handling:** Split lines are now always correctly exported, regardless of their position in the file (fixed bug from v1.3.50).
-   **UI & Usability Features:**
    -   **Hide/Show Scripts Button:** Focus on dialogue by hiding `Script` blocks.
    -   **Quote Wrap Button:** Select any text and press the `"\...\"` button to wrap it in special quote characters (new in v1.3.60).
    -   **Full Undo/Redo Support:** `Ctrl+Z` / `Ctrl+Y` and on-screen buttons (added in v1.3.60).
-   **Structure-Aware Saving:** The save function correctly handles all edited block types and correctly marks generated lines that have no Japanese counterpart with a `#+` comment for easy tracking.
-   **Enhanced Preview:** The preview tab now highlights all errors and mismatches in structure in a user-friendly way.

## 🚀 How to Use

1.  Download the `.html` file and the `restore-mode.js` file into the same folder.
2.  Open the `.html` file in any modern web browser.
3.  Click the **"1. Загрузить файл для перевода"** button to load your working file.
4.  (Optional but recommended) Click the **"2. Загрузить японский файл"** button to load the original Japanese map file for comparison and advanced features.
5.  Use the control panel in the top-right to streamline your workflow.
6.  When you are finished, click the **"Скачать изменённый файл"** button to save your work.

## UI Guide

-   **Red Background:** Indicates an error in a dialogue box (over 50 characters or a broken name tag). Use the `←` and `→` buttons in the control panel to navigate between them.
-   **Japanese Original Text:** A non-editable gray box above a translation field for reference.
-   **"Дубликат" Button:** Appears on lines that are duplicates of earlier lines. Click to copy the translation from the original.
-   **"Восстановить структуру" Button:** Activates a special mode for advanced file correction based on the Japanese original (use with care).
-   **Control Panel (Top-Right):** Quick access to toggle **Wrap Mode**, hide/show **Scripts**, navigate errors, add **Quotes**, and **Undo/Redo**.

## 🆕 What's New in v1.3.60

- Fixed: `[продолжение]:` (split lines) are now always exported correctly after splitting any text block.
- Added: **Undo/Redo** for all editing actions (Ctrl+Z/Y or buttons).
- Added: **Quote Wrap Button** — quickly wrap selection in `∿"..."∿`.
- Improved: Error navigation — quickly jump to any problematic (red) line using new navigation buttons.
- Preview and restore logic: Smarter structural comparison, more robust restore of `CommonEvent` events and named blocks.

## License

This project is licensed under the MIT License.
