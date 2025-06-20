# MGQP Map Editor
![Version](https://img.shields.io/badge/version-1.01-blue)

A simple, browser-based, single-file HTML tool designed to safely edit in-game dialogue from `MapXXX.txt` files. It provides a user-friendly interface for translators and writers to edit text while respecting character limits and complex formatting tags.

This tool is built to be used offline, running entirely in your web browser without needing a server or internet connection.

## ✨ Features (v1.01)

- **Load Local Files:** Load `MapXXX.txt` files directly from your computer into the browser.
- **Automatic Dialogue Extraction:** Scans the file and extracts only the `ShowText(["..."])` commands for editing, ignoring all other script logic.
- **Live Character Counter:** Each text box displays a real-time count of "in-game" characters.
  - Ignores invisible control codes like `@@n` (newline).
  - Ignores character name tags (e.g., `<@@C[6]Name@@C[0]>`).
  - Ignores special quote symbols (`@`).
- **Visual Limit Warning:** Text areas automatically turn **red** if the visible character count exceeds the 50-character limit.
- **Corrupted Tag Detection:** Automatically highlights text areas in **red** if a character name tag is broken or syntactically incorrect, preventing game-breaking errors.
- **Advanced Line Splitting:** A **`+`** button appears for long lines to split them. This feature supports two distinct modes:
    - **Remainder Mode:** (Default) Fills the first line up to the 50-character limit and moves only the remaining words to the new line.
    - **Equal Mode:** Splits the text into two lines of roughly equal length, which is useful for balancing dialogue.
- **Wrap Mode Toggle:** A new button in the UI allows you to easily switch between "Remainder" and "Equal" splitting modes.
- **Empty Line Deletion:** A **`-`** button appears for empty text areas, allowing for easy cleanup of redundant dialogue boxes.
- **Undo/Redo Support:** Full history support with `Ctrl+Z` / `Ctrl+Y` and on-screen buttons.
- **Safe Save & Download:** Saves your changes into a new, correctly formatted `.txt` file, restoring all the original backslash (`\`) escape codes.
- **Copy Utility:** A button to copy all extracted text blocks to the clipboard for use in other tools.

## 🚀 How to Use

1.  Download the `.html` file of this editor.
2.  Open the file in any modern web browser (like Chrome, Firefox, or Edge).
3.  Click the **"Choose File"** button and select the `MapXXX.txt` file you wish to edit.
4.  The editor will load and display all dialogue blocks from the file.
5.  Edit the text in the text areas as needed. Use the features below to stay within limits.
6.  When you are finished, click the **"Download Modified File"** button to save your work. A new file will be downloaded to your computer.

##  UI Guide

-   **Red Background:** This indicates an error in the text area. It means one of two things:
    1.  The in-game character count is **over 50**.
    2.  The character name tag (e.g., `<@@C[6]...`) is **broken or incomplete**. You must fix the tag syntax to remove the red highlight.

-   **Character Counter:** Shows `Игровых символов: ##`. This is the final character count that will appear in the game.

-   **`+` Button:** Appears only when the character count is over 50. Click it to intelligently split the line according to the currently selected Wrap Mode.

-   **`-` Button:** Appears only when a text area is completely empty. Click it to remove that `ShowText` command from the file.

-   **Wrap Mode Button:** Located in the bottom-left corner. Click it to toggle the behavior of the `+` button between "Remainder Split" and "Equal Split".

## Technical Details

- The tool is designed to parse text files containing RPG Maker-style event commands.
- It specifically finds and isolates lines matching the `ShowText(["..."])` pattern.
- For safe in-browser editing, it internally converts all backslash (`\`) control characters into at-symbols (`@`) and restores them perfectly upon saving. This prevents the browser from misinterpreting escape sequences.
- The script has been refactored for v1.01, centralizing text-parsing logic into a single helper function for improved stability and maintainability.

## License
This project is licensed under the MIT License.
