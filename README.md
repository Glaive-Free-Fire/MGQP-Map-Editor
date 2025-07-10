# MGQP Map Editor

A visual editor for translating and fixing MGQP / MGQ Paradox map script files.  
Current version: **1.3.80**

## Main Features

- Fast markup, validation, and export of map files in CommonEvent format.
- Japanese original file support: structure comparison, error highlighting, and restoration.
- Navigation between "red" (error-prone or too long) lines with instant correction tools.
- Undo/Redo support for editing safety.
- **Batch Processing:** Mass check of entire folders for structure errors and event mismatches (third tab).

## How to Use

### 1. Launch

Open `MGQP Map Editor ver 1.3.80.html` in your browser (Chrome/Edge recommended).

### 2. UI & Tabs

#### **Editor** Tab
- **File Loading:**  
  - Load your Russian/translated file (`.txt`).
  - Optionally load the Japanese original.
- **Editing:**  
  - Every text block is directly editable.
  - Errors are highlighted instantly:
    - Exceeding character limits (50 game characters)
    - Corrupted name tag
  - Under each field: character counter and quick "+" / "–" buttons.
  - Arrow buttons (← →) on top to jump between errors.
- **Undo/Redo:**  
  - Clickable icons or keyboard shortcuts (Ctrl+Z, Ctrl+Y).
- **Wrap Mode:**  
  - Choose how long lines are split (residual or strict).

#### **Preview** Tab
- Shows what the final exported file will look like.
- Compares your version with the editor state:
  - Shows a detailed list of differences and errors below the preview.
  - Separate error list (over-limit, corrupted syntax, etc.).
- Download the final file or copy all content in one click.

#### **Batch Processing** Tab (NEW!)
- **Batch check** entire folders of maps for structure differences vs the Japanese originals.
- Load Russian and Japanese map folders (via drag'n'drop or folder selection).
- For each map, see the structural match percentage, detected problems, and which events differ.
- Results are shown as a per-file summary with a table of problematic events.

### 3. Restoring Data Structure

- "Restore Data Structure" button reconstructs the Russian map structure using the Japanese original (see the Preview tab).
- Only mismatched events are replaced; correct events are kept untouched.
- If name tags differ only by language, but ShowTextAttributes are identical, the matching is now more flexible.

### 4. Quick Actions

- **Jump to error:**  
  - Arrow buttons let you quickly jump between errors.
- **Wrap selection in ∿"..."∿:**  
  - One-click markup for script-specific inline tags.

### 5. Validation & Error Highlighting

- **Automatic error highlighting:**  
  - Lines exceeding 50 "game" characters or with tag/syntax errors turn red.
  - The preview always shows a complete error list for rapid debugging.
- **Batch Check:**  
  - The Batch tab lets you check all maps in a folder for CommonEvent structure mismatches.

## Editor Features

- Full **Undo/Redo** (Ctrl+Z/Ctrl+Y) for all text fields.
- Character counter (excluding tags/control codes) in every text block.
- Jump to next/previous error with dedicated buttons.
- Mass checking of CommonEvent structure across map folders.

## Structure Comparison & Matching

- Compares event structures (ShowText, ShowTextWithName, ShowTextAttributes, ShowChoices, When, DisplayName) between translation and original.
- If character names are different but ShowTextAttributes match, the line is considered matched and safe.
- The Preview tab shows not only the final export, but also lists all diffs and errors for fast diagnostics.

## Requirements

- Any modern browser.
- Batch processing requires directory picker support (modern browsers only).

## Changelog

### v1.3.80
- Added the "Batch Processing" tab for mass map structure checking.
- Improved restore algorithm: smarter matching by ShowTextAttributes (works even if names differ by language).
- Expanded error highlighting and error listing in Preview.
- Optimized Undo/Redo, character counter, and file copy/export features.

### v1.3.60 - v3.50
- Preview tab, structure restore tools, error navigation, auto-line split, advanced highlighting.
- Mass event comparison and highlighting for all diffs vs original.
- Major codebase improvements and UI polish.

### Earlier
- Initial release, basic structure editor, line markup and export, Japanese file loading.

## License

Free for non-commercial use, forks and contributions are welcome.

---

**MGQP Map Editor** — for those who want to translate fast, clean, and with minimum headache.

