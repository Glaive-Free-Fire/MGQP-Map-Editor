# MGQP Map Editor v1.4.40

**A modern web-based tool for editing and batch-fixing RPG Maker XP map/event files, with advanced support for translation workflows (RU/JP), structure validation, and mass error correction.**

---

## Features

- **Visual Editor:** Edit map/event files with a user-friendly interface, including block-based editing for ShowText, ShowTextAttributes, ShowChoices, When, JumpToLabel, Label, Script, ScriptMore, and more.
- **Japanese/Translation Support:** Load both Russian and Japanese versions of files for side-by-side comparison and translation assistance.
- **Japanese-Only Mode:** Create translations from scratch by loading only the Japanese file - the editor will automatically structure the content for translation.
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
- **Split Lines Button:** New button to automatically split all long text blocks in the editor according to the selected wrapping mode.
- **Update Editor Button:** After restoring structure, you can now update the editor with the fixed file without reloading it manually.
- **New Error Types:** Additional error types are now detected and highlighted, including new syntax and structure issues.
- **Red Download Button:** The "Download edited file" button turns red if there are unresolved errors, preventing accidental saving.
- **Improved Restore Structure:** The CommonEvent structure fixer now handles errors left after the first fix, and you no longer need to reload the fixed file each time—just click "Update Editor".
- **Enhanced Error Lamp:** The red/green lamp now reflects new error types and provides more detailed feedback.
- **Affinity System Support:** Automatic detection and handling of character affinity/好感度 system strings with proper formatting.
- **Automatic Block Synchronization:** Related blocks (JumpToLabel/Label, Script/ScriptMore) are automatically synchronized when edited.
- **Smart Block Filtering:** Only relevant blocks are shown in the editor based on content analysis (e.g., Script blocks with Japanese text or Russian translations).
- **Contextual Fix Buttons:** Fix buttons now appear only when relevant errors are detected, providing a cleaner interface.
- **Automatic Script Error Fixing:** Automatically detects and fixes missing quotes in Script commands.
- **Skill Attributes Fixing:** Proper handling of skill attribute strings with correct escaping of control sequences.
- **Indentation Error Detection:** Automatic detection and fixing of indentation errors in map files.
- **Enhanced Batch Processing:** Complete file visibility in batch mode with detailed statistics and missing file detection.
- **Orphaned Line Detection:** New error type that identifies and highlights "orphaned" ShowText lines without Japanese counterparts.
- **Clear Lines Button:** Convenient button to clear content of orphaned lines with a single click.
- **Improved Japanese Parsing:** Enhanced parsing of Japanese files with better support for complex text structures and mixed content.
- **Smart Deletion System:** "Soft deletion" mechanism preserves array indices for proper Japanese mapping while allowing visual removal of blocks.
- **Robust File Generation:** "Build from scratch" algorithm ensures consistent file generation with proper handling of deleted blocks and generated placeholders.
- **Unified Error Reporting:** Consolidated error display system that shows all types of errors consistently across editor and preview tabs.

---

## How to Use

### 1. Editing a Single File

1. **Load Files:**
   - Click "Load file for translation" to upload your Russian map/event file.
   - (Optional) Click "Load Japanese file" to upload the original Japanese file for comparison.
   - **NEW:** You can now load only the Japanese file to create a translation from scratch!

2. **Edit Blocks:**
   - Each block (ShowText, ShowTextAttributes, ShowChoices, When, JumpToLabel, Label, Script, ScriptMore, etc.) is shown as a separate editable area.
   - Japanese text (if loaded) is shown above the corresponding Russian block for reference.
   - Use the "+" button to split long text blocks. The editor will automatically insert a generated ShowTextAttributes block (with `#+`) after every 4 ShowText blocks.
   - Use the "-" button to remove blocks (soft deletion preserves structure).
   - Use the **Split Lines** button to automatically split all long text blocks in the file at once.
   - **NEW:** Related blocks (JumpToLabel/Label, Script/ScriptMore) are automatically synchronized when you edit one of them.

3. **Undo/Redo:**
   - Use the ↺ and ↻ buttons or Ctrl+Z / Ctrl+Y to undo/redo changes.

4. **Structure Validation & Fixing:**
   - The **Restore CommonEvent Structure** button will attempt to fix structural errors using the Japanese file as a reference, including restoring missing CommonEvent blocks and fixing errors left after the first fix.
   - **NEW:** The **Fix Script Errors** button automatically fixes missing quotes in Script commands.
   - **NEW:** The **Fix Indentation** button automatically corrects indentation errors.
   - **NEW:** The **Clear Lines** button appears when orphaned lines are detected, allowing you to clear their content with one click.
   - After restoring, use the **Update Editor** button to reload the fixed file into the editor without manual re-upload.

5. **Preview & Export:**
   - Switch to the "Preview" tab to see the exact file that will be saved, including all generated blocks and structure corrections.
   - The **Download edited file** button will turn red if there are unresolved errors, and saving will be blocked until they are fixed.
   - Click "Download edited file" to save your changes, or "Copy all extracted" to copy the text.

### 2. Japanese-Only Translation Mode

1. **Load Japanese File Only:**
   - Click "Load Japanese file" without loading a Russian file.
   - The editor will automatically structure the content for translation.

2. **Translate Content:**
   - Edit the automatically generated Russian text blocks.
   - The editor maintains the original Japanese structure while allowing you to add translations.

3. **Save Translation:**
   - The file will be saved with the proper structure and formatting.

### 3. Batch Processing

1. **Go to the "Batch Processing" Tab:**
   - Upload entire folders of Russian and Japanese map files using the folder upload controls.

2. **Check Files:**
   - Click "Check maps for errors" to validate all files.
   - **NEW:** All files from both folders are now displayed with clear indication of missing files.
   - **NEW:** Detailed statistics show file counts and error summaries.
   - Errors and structure mismatches are shown per file, with detailed breakdowns.

3. **Fix All Errors:**
   - If errors are found, click "Fix all files with errors" to automatically correct them.
   - **NEW:** Files with missing CommonEvent blocks are now properly processed with correct ShowText merging.
   - All fixed files are packaged into a ZIP archive for download.

4. **All OK Message:**
   - If all files are correct and the "Show OK files" checkbox is off, a green message "Congratulations! All files are correct" will be displayed.

---

## Key Details

- **Generated Blocks:** All auto-generated blocks (ShowTextAttributes, etc.) are marked with `#+` at the end of the line, both in the editor and in the saved file.
- **Scroll Position:** The editor remembers your scroll position when switching tabs or after editing, so you never lose your place.
- **Preview = Save:** The "Preview" tab always shows exactly what will be saved to disk, including all generated and fixed blocks.
- **Batch ZIP Export:** Batch fixes are exported as a ZIP archive containing all corrected files.
- **Error Highlighting:** Lines exceeding the character limit, with syntax errors, or with new error types are highlighted in red. The download button is also highlighted if errors remain.
- **Split Lines:** The new button allows you to split all long text blocks in one click, making it easier to conform to length limits.
- **Update Editor:** After restoring structure, you can update the editor with the fixed file instantly, streamlining the workflow.
- **Enhanced Error Lamp:** The red/green lamp now reflects all error types, giving you instant feedback on file status.
- **Affinity System:** Character affinity strings (好感度) are automatically detected and properly formatted for translation.
- **Block Synchronization:** Related blocks are automatically kept in sync, reducing manual work and preventing inconsistencies.
- **Smart Filtering:** The editor intelligently shows only relevant blocks, making it easier to focus on translatable content.
- **Contextual Buttons:** Fix buttons appear only when relevant errors are detected, providing a cleaner interface.
- **Script Error Fixing:** Automatic detection and correction of missing quotes in Script commands.
- **Skill Attributes:** Proper handling of skill attribute strings with correct escaping of control sequences like `\I[98]` and `\C[1]`.
- **Indentation Fixing:** Automatic detection and correction of indentation errors in map files.
- **Complete Batch Visibility:** All files from both folders are displayed with clear indication of missing files and detailed statistics.
- **Orphaned Line Management:** New system for detecting and managing ShowText lines without Japanese counterparts.
- **Soft Deletion:** Blocks can be marked as deleted while preserving array structure for proper Japanese mapping.
- **Robust File Generation:** Improved algorithm ensures consistent file output with proper handling of all block types.

---

## Changelog (v1.4.40)

### Major Improvements
- **Enhanced Japanese Parsing:** Improved parsing of Japanese files with better support for complex text structures and mixed content.
- **Orphaned Line Detection:** New error type that identifies ShowText lines without Japanese counterparts, marked in red for easy identification.
- **Clear Lines Button:** Convenient button to clear content of orphaned lines with a single click.
- **Soft Deletion System:** New deletion mechanism that preserves array indices for proper Japanese mapping while allowing visual removal of blocks.
- **Robust File Generation:** "Build from scratch" algorithm ensures consistent file generation with proper handling of deleted blocks and generated placeholders.
- **Unified Error Reporting:** Consolidated error display system that shows all types of errors consistently across editor and preview tabs.
- **Enhanced Batch Processing:** Complete file visibility in batch mode with detailed statistics and missing file detection.
- **Contextual Fix Buttons:** Fix buttons now appear only when relevant errors are detected, providing a cleaner interface.
- **Automatic Script Error Fixing:** Automatically detects and fixes missing quotes in Script commands.
- **Skill Attributes Fixing:** Proper handling of skill attribute strings with correct escaping of control sequences.
- **Indentation Error Detection:** Automatic detection and fixing of indentation errors in map files.

### Bug Fixes
- **Fixed Japanese Parsing Issues:** Resolved problems with ShowTextAttributes parsing and complex text structure recognition.
- **Fixed Block Matching:** Improved algorithm for matching Russian and Japanese blocks, reducing false "ТРЕБУЕТСЯ ПЕРЕВОД" blocks.
- **Fixed File Generation:** Resolved issues with deleted blocks not being properly removed from saved files.
- **Fixed ShowTextAttributes Formatting:** Corrected formatting of generated ShowTextAttributes blocks in both preview and saved files.
- **Fixed Indentation Inheritance:** Generated blocks now properly inherit indentation from parent blocks.
- **Fixed Error Display:** Resolved conflicts between multiple error reporting functions, ensuring all errors are displayed consistently.
- **Fixed Batch Processing Issue:** Files with missing CommonEvent blocks now properly merge ShowText lines with names and dialogues.
- **Improved Error Detection:** Enhanced detection of various error types with better accuracy.
- **Fixed Script Quote Issues:** Automatic correction of Script commands missing quotes.
- **Fixed Skill Attribute Escaping:** Proper handling of skill attribute control sequences.
- **Fixed Indentation Issues:** Automatic correction of indentation errors in map files.

### UI/UX Improvements
- **Cleaner Interface:** Contextual buttons reduce interface clutter.
- **Better Error Reporting:** More detailed error messages and statistics.
- **Enhanced Batch Mode:** Complete file visibility with color-coded status indicators.
- **Improved Statistics:** Detailed file counts and error summaries in batch mode.
- **New Error Types:** Visual indicators for orphaned lines and other new error categories.
- **Improved Block Management:** Better handling of block deletion and generation with visual feedback.

### Previous Features (v1.4.30)
- **Japanese-Only Mode:** Added ability to create translations from scratch by loading only Japanese files.
- **New Block Types:** Added support for JumpToLabel, Label, and ScriptMore block types.
- **Affinity System Support:** Automatic detection and handling of character affinity/好感度 system strings.
- **Automatic Block Synchronization:** Related blocks (JumpToLabel/Label, Script/ScriptMore) are automatically synchronized.
- **Smart Block Filtering:** Only relevant blocks are shown based on content analysis.
- **Enhanced Text Parsing:** Improved parsing logic with better support for complex text structures.
- **Improved Save Functionality:** More robust file saving with better error handling and format preservation.
- **Better Copy Function:** Simplified and improved text copying functionality.
- **Enhanced Error Detection:** More comprehensive error detection and highlighting.
- **Numerous bugfixes and UI improvements.**

---

## Tips

- **Always load both Russian and Japanese files for best structure validation and fixing.**
- **Use Japanese-only mode to create new translations from scratch.**
- **Use batch mode for large-scale translation projects to quickly check and fix entire folders.**
- **If you see a green message in batch mode, you can be confident all your files are structurally correct!**
- **Take advantage of automatic block synchronization to maintain consistency across related elements.**
- **Use the contextual fix buttons that appear only when relevant errors are detected.**
- **Batch mode now shows all files from both folders, making it easy to identify missing files.**
- **Script errors are automatically detected and can be fixed with a single click.**
- **Skill attribute strings are now properly handled with correct escaping.**
- **Use the "Clear Lines" button to quickly clean up orphaned ShowText lines without Japanese counterparts.**
- **The soft deletion system preserves file structure while allowing you to remove unwanted content.**
- **Check the preview tab to see exactly how your file will be saved before downloading.**

---

## License

MIT License

---

If you have any questions or encounter issues, please open an issue on GitHub or contact the maintainer. 
