# MGQP Map Editor
![Version](https://img.shields.io/badge/version-1.3.0-blue)

A simple, browser-based, single-file HTML tool designed for **bilingual editing and translation** of in-game dialogue and other text commands from `MapXXX.txt` files. It provides a user-friendly interface for translators to edit text while respecting character limits and complex formatting tags.

This tool is built to be used offline, running entirely in your web browser without needing a server or internet connection.

## ✨ Features (v1.3.0)

-   **Expanded Command Parsing:** Automatically extracts not just `ShowText`, but also other key commands for a more complete translation workflow:
    -   `Display Name` (Имена локаций)
    -   `ShowChoices` (Варианты выбора)
    -   `When` (Текст, который отображается при выборе)
    -   `Script` & `ScriptMore` (редактируемые скриптовые команды)
-   **Advanced Bilingual Synchronization:** The core feature for comparing translation with the original.
    -   **Intelligent Initial Mapping:** The script performs a sophisticated initial sync by matching dialogue segments between named speakers and by command types.
    -   **Missing Translation Alerts:** If the Japanese file contains text that is missing in the translation file, the editor will automatically insert a **"ТРЕБУЕТСЯ ПЕРЕВОД"** (TRANSLATION REQUIRED) placeholder block, ensuring no lines are missed.
-   **Duplicate Detection & Autofill:**
    -   The script automatically finds identical Japanese text blocks.
    -   A **"Дубликат"** button appears on these lines, allowing you to instantly copy the translation from the original line.
    -   The button color indicates status: **green** if texts match, **red** if they differ.
-   **Smart Character Counter:** A highly accurate counter shows the final in-game character count, ignoring all invisible tags (`<...`), codes (`∾n`), and special symbols (`∾`).
-   **Visual Error Highlighting:** Text areas turn **red** if the character count exceeds 50 or if a name tag is syntactically broken.
-   **Game-Aware Line Splitting (`+` button):**
    -   Features two modes: **Remainder** (fills the line to the limit) and **Equal** (splits in half).
    -   **Understands the 4-line window limit:** When splitting the 4th line of a dialogue window, it automatically creates a new window for the remaining text, preventing overflow in-game.
-   **UI & Usability Features:**
    -   **Error Navigation:** Use the **"←"** and **"→"** buttons in the top-right panel to quickly jump between all text fields highlighted in red.
    -   **Hide/Show Scripts Button:** Focus on dialogue by hiding `Script` blocks.
    -   **Quote Wrap Button:** Select any text and press the `"\...\"` button to wrap it in special quote characters.
    -   **Smart Deletion (`-` button):** Safely removes empty lines and their associated attribute commands.
    -   **Full Undo/Redo Support:** `Ctrl+Z` / `Ctrl+Y` and on-screen buttons.
-   **Structure-Preserving Save:** The save function has been completely rewritten. Split lines are now correctly re-joined before saving, ensuring the original file structure and line count are always preserved. This fixes all cross-session synchronization bugs.

## 🚀 How to Use

1.  Download the `.html` file of this editor.
2.  Open the file in any modern web browser (like Chrome, Firefox, or Edge).
3.  Click the **"1. Загрузить файл для перевода"** button and select the map file you wish to edit.
4.  (Optional but recommended) Click the **"2. Загрузить японский файл"** button and select the original Japanese map file.
5.  The editor will display the text for editing. Use the control panel in the top-right to streamline your workflow.
6.  When you are finished, click the **"Скачать изменённый файл"** button (now in the top-right panel) to save your work.

## UI Guide

-   **Red Background:** Indicates an error in a dialogue box (over 50 characters or a broken name tag). Use the `←` and `→` buttons in the control panel to navigate between them.
-   **Japanese Original Text:** A non-editable gray box above a translation field for reference.
-   **"Дубликат" Button:** Appears on lines that are duplicates of earlier lines. Click to copy the translation from the original.
-   **`+` Button:** Appears on long dialogue lines. Splits the line according to the selected Wrap Mode.
-   **`-` Button:** Appears on empty text areas for easy deletion.
-   **Control Panel (Top-Right):** Quick access to toggle **Wrap Mode**, hide/show **Scripts**, navigate errors, and **Undo/Redo**.

## License

This project is licensed under the MIT License.
