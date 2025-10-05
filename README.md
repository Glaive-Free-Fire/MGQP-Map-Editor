# MGQP Map Editor v1.4.71

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
- **Advanced Block Matching:** Revolutionary anchor-based algorithm for precise matching of Russian and Japanese text blocks, eliminating false translation placeholders.
- **Intelligent Dialogue Splitting:** Unified `splitDialogueBlock` function with automatic `ShowTextAttributes` insertion for proper dialogue window management.
- **Structural Integrity Preservation:** Complete rewrite of `linkAndRender()` function ensures all structural commands are preserved during file matching.
- **Performance Optimization:** Optimized "Split Lines" button algorithm from O(n²) to O(n) for significantly faster processing of large files.
- **Enhanced Error Detection:** Improved logic for detecting long dialogues with proper structural command awareness.
- **Automatic Fix Tools:** New "Fix ShowTextAttributes" button for automatic correction of long dialogue blocks.
- **Comprehensive Logging:** Detailed diagnostic logging for troubleshooting complex file structure issues.
- **Type-Aware Block Matching:** Advanced matching algorithm that considers block types for more accurate Russian-Japanese correspondence.
- **CommonEvent Boundary Respect:** Strict adherence to CommonEvent boundaries prevents cross-contamination of blocks between different events.
- **Japanese Text Ignore Marker:** New `##` marker support allows ignoring Japanese text in specific lines from error detection.
- **Empty ShowText Handling:** Improved processing of empty ShowText blocks with proper matching and interface hiding.
- **Special Template Support:** Enhanced support for special text patterns like "Уровень симпатии" and "Найдено мастеров".

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
   - **NEW:** Use `##` marker at the end of ShowText lines to ignore Japanese text detection for that line.

3. **Undo/Redo:**
   - Use the ↺ and ↻ buttons or Ctrl+Z / Ctrl+Y to undo/redo changes.

4. **Structure Validation & Fixing:**
   - The **Restore CommonEvent Structure** button will attempt to fix structural errors using the Japanese file as a reference, including restoring missing CommonEvent blocks and fixing errors left after the first fix.
   - **NEW:** The **Fix Script Errors** button automatically fixes missing quotes in Script commands.
   - **NEW:** The **Fix Indentation** button automatically corrects indentation errors.
   - **NEW:** The **Clear Lines** button appears when orphaned lines are detected, allowing you to clear their content with one click.
   - **NEW:** The **Fix ShowTextAttributes** button automatically corrects long dialogue blocks by inserting proper structural commands.
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
- **Contextual Fix Buttons:** Fix buttons appear only when relevant errors are detected, providing a cleaner interface.
- **Script Error Fixing:** Automatic detection and correction of missing quotes in Script commands.
- **Skill Attributes:** Proper handling of skill attribute strings with correct escaping of control sequences like `\I[98]` and `\C[1]`.
- **Indentation Fixing:** Automatic detection and correction of indentation errors in map files.
- **Complete Batch Visibility:** All files from both folders are displayed with clear indication of missing files and detailed statistics.
- **Orphaned Line Management:** New system for detecting and managing ShowText lines without Japanese counterparts.
- **Soft Deletion:** Blocks can be marked as deleted while preserving file structure for proper Japanese mapping.
- **Robust File Generation:** Improved algorithm ensures consistent file output with proper handling of all block types.
- **Advanced Block Matching:** Revolutionary anchor-based algorithm eliminates false translation placeholders by precisely matching Russian and Japanese blocks.
- **Intelligent Dialogue Management:** Automatic insertion of `ShowTextAttributes` commands ensures proper dialogue window structure.
- **Performance Boost:** "Split Lines" button now processes large files significantly faster with optimized O(n) algorithm.
- **Structural Integrity:** Complete preservation of all structural commands during file matching operations.
- **Enhanced Diagnostics:** Comprehensive logging system provides detailed insights for troubleshooting complex issues.
- **Type-Aware Matching:** Advanced algorithm considers block types for more accurate Russian-Japanese correspondence.
- **Boundary Respect:** Strict adherence to CommonEvent boundaries prevents cross-contamination between different events.
- **Japanese Text Ignore Marker:** Use `##` at the end of ShowText lines to exclude them from Japanese text error detection.
- **Empty ShowText Processing:** Empty ShowText blocks are properly matched with Japanese counterparts but hidden from the editor interface.
- **Special Template Recognition:** Automatic detection and handling of special text patterns for improved translation workflow.

---

## Changelog (v1.4.70)

### New Features
- **Japanese Text Ignore Marker (`##`):** Added support for `##` marker at the end of ShowText lines to exclude them from Japanese text error detection.
  - Lines marked with `##` will not trigger "Japanese text detected" errors in both editor and batch processing modes.
  - Marker is parsed during text extraction and preserved throughout the processing pipeline.
  - Fully supported in both main editor and batch processing workflows.

- **Empty ShowText Handling:** Comprehensive improvement of empty ShowText block processing.
  - Japanese parser now correctly processes all ShowText blocks, including empty ones and those containing only whitespace.
  - Empty ShowText blocks are properly matched with their Japanese counterparts, eliminating false "additional line" errors.
  - Empty ShowText blocks are automatically hidden from the editor interface to reduce clutter.
  - Maintains structural integrity while improving user experience.

- **Enhanced Special Template Support:** Extended support for special text patterns.
  - Added recognition for "Найдено мастеров" template in addition to existing "Уровень симпатии" support.
  - Both templates are automatically detected and properly combined with subsequent dialogue lines.
  - Improved template matching logic for more reliable detection.

### Improvements
- **Robust Flag Propagation:** Fixed critical issue where `hasIgnoreMarker` flag was lost during text block processing.
  - Updated both main editor and batch processing pipelines to properly preserve the `##` marker flag.
  - Ensured consistent behavior across all processing stages from parsing to error detection.

- **Enhanced Batch Processing:** Improved line-level error detection in batch mode.
  - Added comprehensive error checking including long dialogues, character limits, and Japanese text detection.
  - Integrated new `checkForLineLevelErrors` function for consistent error reporting.
  - Better alignment between editor and batch processing error detection logic.

- **Improved Parser Accuracy:** Enhanced text parsing for better structure recognition.
  - Removed unnecessary filtering of empty ShowText blocks in Japanese parser.
  - Improved special template detection with more robust regex patterns.
  - Better handling of edge cases in text block combination logic.

### Bug Fixes
- **Fixed Japanese Text Detection:** Resolved issue where `##` marker was not properly excluding lines from Japanese text error detection.
- **Fixed Empty ShowText Matching:** Eliminated false positive errors for empty ShowText blocks that should match Japanese counterparts.
- **Fixed Flag Transmission:** Corrected critical bug where `hasIgnoreMarker` flag was not passed through the processing pipeline.
- **Fixed Template Recognition:** Improved reliability of special template pattern detection and combination logic.
- **Fixed Batch Processing Errors:** Resolved inconsistencies between editor and batch processing error detection.

### Technical Improvements
- **Unified Processing Pipeline:** Standardized text block processing across all components.
- **Enhanced Error Detection Chain:** Improved error detection flow from parsing to final validation.
- **Optimized Flag Handling:** Streamlined flag propagation through the entire processing chain.
- **Better Code Organization:** Improved code structure for better maintainability and debugging.

---

## Changelog (v1.4.60)

### New
- **Fix Name Tags button:** Automatically fixes broken name tags by adding the required `∾\n` prefix only when missing.
- **Memorize Additional Lines button:** Marks orphaned ShowText lines as legitimate continuations by appending `#+` to their source lines.

### Improvements
- **Unified error-highlighting pipeline:**
  - Introduced a global `window.allErrorIndices` as the single source of truth for error indices.
  - `updateMatchLamp()` now populates the error set; `updateRedIndices()` only applies the highlighting.
  - `updatePreviewErrors()` now calls `updateMatchLamp()` followed by `updateRedIndices()` on each edit to keep visuals in sync.
- **Consistent updates after actions:**
  - The "+" split button triggers a full error recompute via `updateMatchLamp()` before re-rendering, preventing stale highlights.
  - Removed the legacy `updateRedIndices()` call from the old `updateAllForBlock` (main_script.js) to avoid race conditions.
- **Save button UX:**
  - The save button is no longer force-disabled when errors are present. It now shows a red warning style and informative tooltip while remaining clickable.
  - Your double-click/confirm flow is preserved and works reliably.
- **Name tag validation:**
  - Precise detection: checks that a name tag `<∾∾C[6]...∾∾C[0]>` is preceded by the correct `∾\n` prefix (validated against the text before the tag).
  - The fix operates only on truly broken lines and won't duplicate prefixes.
- **Structure checker refinements:**
  - Added `ShowScrollingText` and `Comment` to fully editable commands.
  - Indentation check is evaluated early in the compare loop, and dialogue blocks are validated as consistent indent groups using the first JP line as the base.

### Bug Fixes
- Immediate red-line refresh across edits, splits, and automated fixes.
- Eliminated highlight desynchronization after splitting lines.
- Fixed a conflict between outdated and new highlight logic by centralizing the pipeline.
- Prevented incorrect re-highlighting caused by outdated calls in `main_script.js`.

### Developer Notes
- Highlight pipeline is now: edit → `updatePreviewErrors()` → `updateMatchLamp()` → `updateRedIndices()`.
- `updateRedIndices()` must never compute errors; it only reflects `window.allErrorIndices` to the UI.
- When adding new error detectors, always push indices into `window.allErrorIndices` in `updateMatchLamp()`.

---

## Changelog (v1.4.50)

### Major Improvements
- **Revolutionary Block Matching Algorithm:** Complete rewrite of the core matching system with anchor-based algorithm for precise Russian-Japanese block correspondence.
- **Intelligent Dialogue Splitting:** New unified `splitDialogueBlock` function with automatic `ShowTextAttributes` insertion for proper dialogue window management.
- **Structural Integrity Preservation:** Complete rewrite of `linkAndRender()` function ensures all structural commands are preserved during file matching operations.
- **Performance Optimization:** Optimized "Split Lines" button algorithm from O(n²) to O(n) for significantly faster processing of large files.
- **Enhanced Error Detection:** Improved logic for detecting long dialogues with proper structural command awareness, eliminating false positives.
- **Automatic Fix Tools:** New "Fix ShowTextAttributes" button for automatic correction of long dialogue blocks without manual intervention.
- **Comprehensive Diagnostic Logging:** Detailed logging system provides insights for troubleshooting complex file structure issues.
- **Type-Aware Block Matching:** Advanced matching algorithm that considers block types for more accurate Russian-Japanese correspondence.
- **CommonEvent Boundary Respect:** Strict adherence to CommonEvent boundaries prevents cross-contamination of blocks between different events.

### Bug Fixes
- **Fixed ShowTextAttributes Parsing:** Resolved critical issue where `ShowTextAttributes` commands were not parsed from Japanese files, creating false translation placeholders.
- **Fixed Block Matching Algorithm:** Complete rewrite eliminates false "ТРЕБУЕТСЯ ПЕРЕВОД" blocks through precise anchor-based matching.
- **Fixed Structural Command Loss:** Resolved issue where structural commands were lost during Russian-Japanese file matching operations.
- **Fixed Long Dialogue Detection:** Eliminated false positives in long dialogue error detection through improved structural command awareness.
- **Fixed Cross-Event Contamination:** Prevented Japanese blocks from being incorrectly inserted into wrong CommonEvent sections.
- **Fixed Performance Issues:** Optimized "Split Lines" button from O(n²) to O(n) algorithm for large file processing.
- **Fixed Name Preservation:** Corrected issue where character names were lost when splitting dialogue continuation lines.
- **Fixed When Block Matching:** Improved matching algorithm for `When` blocks using sequential order instead of choice index.
- **Fixed Empty Label Display:** Resolved issue where empty `Label` blocks were unnecessarily displayed in the editor.
- **Fixed ShowText Block Filtering:** Improved filtering logic to hide `ShowText` blocks with only whitespace content.
- **Fixed Block Synchronization:** Enhanced synchronization between related blocks (JumpToLabel/Label, Script/ScriptMore).
- **Fixed Japanese Parsing Issues:** Resolved problems with ShowTextAttributes parsing and complex text structure recognition.
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
- **Revolutionary Interface:** Complete overhaul of the core matching system provides more intuitive and reliable user experience.
- **Enhanced Performance:** Significantly faster processing of large files with optimized algorithms.
- **Better Error Reporting:** More accurate error detection with detailed diagnostic information.
- **Automatic Fix Tools:** New contextual buttons appear only when relevant errors are detected.
- **Improved Block Management:** Better handling of block deletion and generation with visual feedback.
- **Cleaner Interface:** Contextual buttons reduce interface clutter.
- **Enhanced Batch Mode:** Complete file visibility with color-coded status indicators.
- **Improved Statistics:** Detailed file counts and error summaries in batch mode.
- **New Error Types:** Visual indicators for orphaned lines and other new error categories.

---

## Previous Features (v1.4.30)
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
- **NEW:** The revolutionary block matching algorithm eliminates false translation placeholders - trust the system!
- **NEW:** Use the "Fix ShowTextAttributes" button for automatic correction of long dialogue blocks.
- **NEW:** The optimized "Split Lines" button now processes large files significantly faster.
- **NEW:** The system now preserves all structural commands during file matching - no more lost separators!
- **NEW:** Type-aware matching ensures more accurate Russian-Japanese correspondence.
- **NEW:** CommonEvent boundaries are strictly respected, preventing cross-contamination.
- **NEW:** Use `##` marker at the end of ShowText lines to ignore Japanese text detection for specific lines.
- **NEW:** Empty ShowText blocks are automatically handled - they match properly but stay hidden from the interface.
- **NEW:** Special templates like "Уровень симпатии" and "Найдено мастеров" are automatically recognized and processed.

---

## License

MIT License

---

If you have any questions or encounter issues, please open an issue on GitHub or contact the maintainer.
