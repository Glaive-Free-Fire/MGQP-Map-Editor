# MGQP Map Editor
![Version](https://img.shields.io/badge/version-1.2.40-blue)

A simple, browser-based, single-file HTML tool designed for **bilingual editing and translation** of in-game dialogue and other text commands from `MapXXX.txt` files. It provides a user-friendly interface for translators to edit text while respecting character limits and complex formatting tags.

This tool is built to be used offline, running entirely in your web browser without needing a server or internet connection.

## ✨ Features (v1.2.40)

-   **Expanded Command Parsing:** Automatically extracts not just `ShowText`, but also other key commands for a more complete translation workflow:
    -   `Display Name` (Имена локаций)
    -   `ShowChoices` (Варианты выбора)
    -   `When` (Текст, который отображается при выборе)
    -   `Script` & `ScriptMore` (для редактирования скриптовых команд)
-   **Robust Bilingual Synchronization:** The core feature for comparing translation with the original.
    -   **Smart Name Handling:** Automatically detects and merges separate Japanese name lines (e.g., `【NAME】`) with their corresponding dialogue line.
    -   **Reliable Sync Logic:** A stable, sequential algorithm correctly maps original Japanese text to translated lines, properly handling lines split by the translator and preserving order.
-   **Live Character Counter:** Each text box displays a real-time count of "in-game" characters. For non-dialogue lines, it shows a simple character count.
    -   Ignores invisible control codes like `@@n` (newline).
    -   Ignores character name tags (e.g., `<@@C[6]Name@@C[0]>`).
    -   Ignores special quote symbols (`@`).
-   **Visual Limit Warning:** Text areas for dialogue automatically turn **red** if the visible character count exceeds the 50-character limit.
-   **Corrupted Tag Detection:** Automatically highlights text areas in **red** if a character name tag is broken or syntactically incorrect, preventing game-breaking errors.
-   **Advanced Line Splitting:** A **`+`** button appears for long dialogue lines to split them. This feature supports two distinct modes:
    -   **Remainder Mode:** (Default) Fills the first line up to the 50-character limit and moves only the remaining words to the new line.
    -   **Equal Mode:** Splits the text into two lines of roughly equal length.
-   **Wrap Mode Toggle:** A button in the UI allows you to easily switch between "Remainder" and "Equal" splitting modes.
-   **Empty Line Deletion:** A **`-`** button appears for empty text areas, allowing for easy cleanup.
-   **Undo/Redo Support:** Full history support with `Ctrl+Z` / `Ctrl+Y` and on-screen buttons.
-   **Structure-Preserving Save:** The save function has been completely rewritten. Split lines are now correctly re-joined before saving, ensuring the original file structure and line count are always preserved. This fixes all cross-session synchronization bugs.
-   **Dynamic Filename:** The saved file is automatically named based on the original file (e.g., `Map001.txt` becomes `Map001_edited.txt`).

## 🚀 How to Use

1.  Download the `.html` file of this editor.
2.  Open the file in any modern web browser (like Chrome, Firefox, or Edge).
3.  Click the **"1. Загрузить файл для перевода"** button and select the map file you wish to edit.
4.  (Optional but recommended) Click the **"2. Загрузить японский файл"** button and select the original Japanese map file.
5.  The editor will display the text for editing, with the corresponding Japanese text above each dialogue block.
6.  Edit the text as needed.
7.  When you are finished, click the **"Скачать изменённый файл"** button to save your work.

## UI Guide

-   **Red Background:** This indicates an error in a dialogue box. It means one of two things:
    1.  The in-game character count is **over 50**.
    2.  The character name tag (e.g., `<@@C[6]...`) is **broken or incomplete**.
-   **Japanese Original Text:** A non-editable gray box that appears above a translation field when a Japanese source file is loaded. This text is selectable for easy copying.
-   **`+` Button:** Appears only when a dialogue line's character count is over 50. Click it to split the line according to the currently selected Wrap Mode.
-   **`-` Button:** Appears only when a text area is completely empty. Click it to remove that line from the file.
-   **Wrap Mode Button:** Located in the top-right corner. Click it to toggle the behavior of the `+` button between "Remainder Split" and "Equal Split".

## Technical Details

-   The tool is designed to parse text files containing RPG Maker-style event commands.
-   It finds and isolates lines for various commands, including `ShowText`, `DisplayName`, `ShowChoices`, `When`, and `Script`.
-   For safe in-browser editing, it internally converts all backslash (`\`) control characters into at-symbols (`@`) and restores them perfectly upon saving.
-   The save mechanism now re-joins any split lines to preserve the original file's structure, ensuring synchronization is never broken between sessions.

## License

This project is licensed under the MIT License.
