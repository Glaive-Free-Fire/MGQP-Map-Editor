# MGQP Map Editor
![Version](https://img.shields.io/badge/version-1.2.60-blue)

A simple, browser-based, single-file HTML tool designed for **bilingual editing and translation** of in-game dialogue and other text commands from `MapXXX.txt` files. It provides a user-friendly interface for translators to edit text while respecting character limits and complex formatting tags.

This tool is built to be used offline, running entirely in your web browser without needing a server or internet connection.

## ✨ Features (v1.2.60)

-   **Expanded Command Parsing:** Automatically extracts not just `ShowText`, but also other key commands for a more complete translation workflow:
    -   `Display Name`, `ShowChoices`, `When`, `Script` & `ScriptMore`.
-   **Advanced Bilingual Synchronization:** The core feature for comparing translation with the original.
    -   **Intelligent Initial Mapping:** The script performs a sophisticated initial sync by matching dialogue segments between named speakers and by command types.
    -   **Manual Sync Correction:** An **"Доп Строка"** (Extra Line) button provides manual control to fix any synchronization errors.
    -   **Missing Translation Alerts:** Automatically inserts a **"ТРЕБУЕТСЯ ПЕРЕВОД"** placeholder if a Japanese text block has no corresponding translation block.
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
    -   **Hide/Show Scripts Button:** Focus on dialogue by hiding `Script` blocks.
    -   **Smart Deletion (`-` button):** Safely removes empty lines and their associated attribute commands.
    -   **Full Undo/Redo Support:** `Ctrl+Z` / `Ctrl+Y` and on-screen buttons.
-   **Structure-Aware Saving:** The save function correctly handles all edited block types, including new lines created by splitting.

## 🚀 How to Use

1.  Download the `.html` file of this editor.
2.  Open the file in any modern web browser (like Chrome, Firefox, or Edge).
3.  Click the **"1. Загрузить файл для перевода"** button and select the map file you wish to edit.
4.  (Optional but recommended) Click the **"2. Загрузить японский файл"** button and select the original Japanese map file.
5.  The editor will display the text for editing. Use the UI controls to streamline your workflow.
6.  When you are finished, click the **"Скачать изменённый файл"** button to save your work.

## UI Guide

-   **Red Background:** Indicates an error in a dialogue box (over 50 characters or a broken name tag).
-   **Japanese Original Text:** A non-editable gray box above a translation field for reference.
-   **"Дубликат" Button:** Appears on lines that are duplicates of earlier lines. Click to copy the translation from the original.
-   **"Доп Строка" (Extra Line) Button:** Manually shifts the Japanese text block down to fix sync issues.
-   **`+` Button:** Appears on long dialogue lines. Splits the line according to the selected Wrap Mode.
-   **`-` Button:** Appears on empty text areas for easy deletion.
-   **Control Panel (Top-Right):** Quick access to toggle **Wrap Mode**, hide/show **Scripts**, and **Undo/Redo**.

## License

This project is licensed under the MIT License.
