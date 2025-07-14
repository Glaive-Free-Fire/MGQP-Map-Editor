# MGQP Map Editor v1.4.0

**A modern web-based tool for editing and batch-fixing RPG Maker XP map/event files, with advanced support for translation workflows (RU/JP), structure validation, and mass error correction.**

---

## Features

- **Visual Editor:** Edit map/event files with a user-friendly interface, including block-based editing for ShowText, ShowTextAttributes, ShowChoices, When, and more.
- **Japanese/Translation Support:** Load both Russian and Japanese versions of files for side-by-side comparison and translation assistance.
- **Structure Validation:** Automatic detection of CommonEvent structure errors, with detailed error reporting and highlighting.
- **Batch Processing:** Check and fix entire folders of map files at once, with ZIP export of all corrected files.
- **Undo/Redo:** Full undo/redo support for editing operations.
- **Smart Text Wrapping:** Split long text blocks with a single click, with customizable wrapping modes.
- **Generated Block Marking:** All auto-generated blocks (e.g., ShowTextAttributes after every 4 ShowText) are marked with `#+` for easy tracking and filtering.
- **Preserves Scroll Position:** The editor remembers your scroll position when switching tabs or editing.
- **Preview Tab:** See exactly how your file will be saved, including all generated blocks and structure corrections.
- **Error Highlighting:** Instantly see which lines exceed character limits or have syntax issues.
- **Export & Copy:** Download the edited file or copy all extracted text for external use.
- **Batch "All OK" Message:** If all files are correct in batch mode, a green congratulatory message is shown.

---

## How to Use

### 1. Editing a Single File

1. **Load Files:**
   - Click "Load file for translation" to upload your Russian map/event file.
   - (Optional) Click "Load Japanese file" to upload the original Japanese file for comparison.

2. **Edit Blocks:**
   - Each block (ShowText, ShowTextAttributes, etc.) is shown as a separate editable area.
   - Japanese text (if loaded) is shown above the corresponding Russian block for reference.
   - Use the "+" button to split long text blocks. The editor will automatically insert a generated ShowTextAttributes block (with `#+`) after every 4 ShowText blocks.
   - Use the "-" button to remove blocks.

3. **Undo/Redo:**
   - Use the ↺ and ↻ buttons or Ctrl+Z / Ctrl+Y to undo/redo changes.

4. **Structure Validation:**
   - The "Restore CommonEvent Structure" button will attempt to fix structural errors using the Japanese file as a reference, including restoring missing CommonEvent blocks.

5. **Preview & Export:**
   - Switch to the "Preview" tab to see the exact file that will be saved, including all generated blocks and structure corrections.
   - Click "Download edited file" to save your changes, or "Copy all extracted" to copy the text.

### 2. Batch Processing

1. **Go to the "Batch Processing" Tab:**
   - Upload entire folders of Russian and Japanese map files using the folder upload controls.

2. **Check Files:**
   - Click "Check maps for errors" to validate all files.
   - Errors and structure mismatches are shown per file, with detailed breakdowns.

3. **Fix All Errors:**
   - If errors are found, click "Fix all files with errors" to automatically correct them.
   - All fixed files are packaged into a ZIP archive for download.

4. **All OK Message:**
   - If all files are correct and the "Show OK files" checkbox is off, a green message "Congratulations! All files are correct" will be displayed.

---

## Key Details

- **Generated Blocks:** All auto-generated blocks (ShowTextAttributes, etc.) are marked with `#+` at the end of the line, both in the editor and in the saved file.
- **Scroll Position:** The editor remembers your scroll position when switching tabs or after editing, so you never lose your place.
- **Preview = Save:** The "Preview" tab always shows exactly what will be saved to disk, including all generated and fixed blocks.
- **Batch ZIP Export:** Batch fixes are exported as a ZIP archive containing all corrected files.
- **Error Highlighting:** Lines exceeding the character limit or with syntax errors are highlighted in red.

---

## Changelog (v1.4.0)

- **Batch Fix ZIP Export:** Batch fixes now export as a ZIP archive.
- **Missing CommonEvent Restoration:** The structure fixer now restores missing CommonEvent blocks from the Japanese file.
- **Generated Block Marking:** All auto-generated ShowTextAttributes blocks are marked with `#+`.
- **Scroll Position Memory:** The editor now preserves scroll position after edits and tab switches.
- **Green "All OK" Message:** Batch mode displays a congratulatory message if all files are correct.
- **Preview Tab Fixes:** The preview tab now correctly displays generated ShowTextAttributes blocks with `#+`.
- **Numerous bugfixes and UI improvements.**

---

## Tips

- **Always load both Russian and Japanese files for best structure validation and fixing.**
- **Use batch mode for large-scale translation projects to quickly check and fix entire folders.**
- **If you see a green message in batch mode, you can be confident all your files are structurally correct!**

---

## License

MIT License

---

If you have any questions or encounter issues, please open an issue on GitHub or contact the maintainer.
