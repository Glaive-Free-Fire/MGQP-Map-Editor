document.addEventListener('DOMContentLoaded', function() {
  // (Функции прокрутки теперь будут в HTML)
  // --- Функция генерации preview ---
  window.updatePreviewArea = function() {
    // Генерируем экспортируемое содержимое (до сохранения)
    let previewLines;
    if (window.restoreModeEnabled && window.japaneseLines && window.originalLines) {
      const result = checkCommonEventStructureSmart(window.originalLines, window.japaneseLines);
      const mismatchedNums = result.mismatches.map(m => m.num);
      previewLines = restoreRussianStructure(window.originalLines, window.japaneseLines, mismatchedNums);
    } else {
      let newLines = [...originalLines];
      let lineInsertOffset = 0;
      let blockIndexMap = new Map();
      let displayNameLine = `Display Name = "${mapDisplayName}"`;
      let foundDisplayName = false;
      for (let i = 0; i < newLines.length; i++) {
        if (/^\s*Display Name\s*=/.test(newLines[i])) {
          newLines[i] = displayNameLine;
          foundDisplayName = true;
          break;
        }
      }
      if (!foundDisplayName) {
        newLines.unshift(displayNameLine);
      }
      textBlocks.forEach((block, blockIndex) => {
        if (block.idx !== undefined) {
          const originalLine = originalLines[block.idx];
          const indentMatch = originalLine.match(/^\s*/);
          const indent = indentMatch ? indentMatch[0] : '';
          let newLine;
          switch (block.type) {
            case 'ShowText':
              let txt = block.text.replace(/∿/g, '<<ONE>>');
              txt = txt.replace(/\n/g, '\\n');
              txt = txt.replace(/∾+/g, '\\\\');
              txt = txt.replace(/<<ONE>>/g, '\\');
              txt = txt.replace(/\\{2,}n/g, '\\\\n');
              txt = txt.replace(/\\(?=[\?\.!\,—])/g, '');
              let newText = txt.replace(/(?<!\\)"/g, '\\"');
              newLine = originalLine.replace(/\[(.*)\]/, `["${newText}"]`);
              break;
            case 'ShowTextAttributes':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            case 'DisplayName':
              const displayText = block.text.replace(/∾/g, '\\').replace(/"/g, '\\"');
              newLine = originalLine.replace(/"(.*)"/, `"${displayText}"`);
              break;
            case 'ShowChoices':
              const choices = block.text.split(' | ');
              const choicesFormatted = choices.map(choice => 
                `"${choice.replace(/∾/g, '\\').replace(/"/g, '\\"')}"`
              ).join(', ');
              newLine = originalLine.replace(/\[\[(.*)\],\s*(\d+)\]/, `[[${choicesFormatted}], ${block.defaultChoice || 0}]`);
              break;
            case 'When':
              const whenText = block.text.replace(/∾/g, '\\').replace(/"/g, '\\"');
              newLine = originalLine.replace(/\[(\d+),\s*"(.*)"\]/, `[${block.choiceIndex || 0}, "${whenText}"]`);
              break;
            case 'Script':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            case 'ScriptMore':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            default:
              newLine = originalLine;
          }
          newLines[block.idx + lineInsertOffset] = indent + newLine.trimStart();
          blockIndexMap.set(blockIndex, block.idx + lineInsertOffset);
        } else {
          let lastMainBlockIdx = -1;
          for (let j = blockIndex - 1; j >= 0; j--) {
            if (textBlocks[j].idx !== undefined) {
              lastMainBlockIdx = textBlocks[j].idx;
              break;
            }
          }
          let indent = '';
          if (lastMainBlockIdx !== -1) {
            const originalLine = originalLines[lastMainBlockIdx];
            const indentMatch = originalLine.match(/^\s*/);
            indent = indentMatch ? indentMatch[0] : '';
          }
          if (block.type === 'ShowTextAttributes') {
            newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, indent + `ShowText([${block.text}])`);
            lineInsertOffset++;
            blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
          } else {
            if (/^\\n<\\C\[6\]/.test(block.text)) {
              let lineToInsert = indent + `ShowText(["${block.text}"])`;
              if (block.type === 'ShowText' && block.generated) {
                lineToInsert += ' #+';
              }
              newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
              lineInsertOffset++;
              blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
            } else {
              let cont = block.text.replace(/∿/g, '<<ONE>>');
              cont = cont.replace(/\n/g, '\\n');
              cont = cont.replace(/∾+/g, '\\');
              cont = cont.replace(/<<ONE>>/g, '\\');
              cont = cont.replace(/\\{2,}n/g, '\\\\n');
              cont = cont.replace(/\\(?=[\?\.!\,—])/g, '');
              let newText = cont.replace(/(?<!\\)"/g, '\\"');
              let lineToInsert = indent + `ShowText(["${newText}"])`;
              if (block.type === 'ShowText' && block.generated) {
                lineToInsert += ' #+';
              }
              newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
              lineInsertOffset++;
              blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
            }
          }
        }
      });
      previewLines = (window.getExportLines ? window.getExportLines(newLines, textBlocks) : newLines);
    }
    // Применяем escapeFirstThree только к строкам ShowText с именем
    previewLines = previewLines.map(line => {
      let cleanLine = line.replace(' // RESTORED_FROM_JP', '');
      // Если строка соответствует паттерну имени, применяем escapeFirstThree
      if (/^\s*ShowText\(\["\\n<\\C\[6\].*?\\C\[0\]>/.test(cleanLine)) {
        return cleanLine.replace(/\["(.*)"\]/, (m, p1) => '["' + escapeFirstThree(p1) + '"]');
      }
      return cleanLine;
    });
    document.getElementById('previewArea').value = previewLines.join('\n');
    // --- Сравнение с редактором ---
    if (typeof window.testModeCompare === 'function') {
      const diffs = window.testModeCompare(textBlocks, previewLines);
      const diffDiv = document.getElementById('previewDiffs');
      diffDiv.innerHTML = '';
      if (diffs && diffs.length) {
        diffs.forEach(d => {
          const el = document.createElement('div');
          el.style.color = 'red';
          el.style.marginBottom = '4px';
          el.textContent = d;
          diffDiv.appendChild(el);
        });
      }
    }
    window.updatePreviewErrors();
  }
});

window.testModeCompare = function(textBlocks, previewLines) {
  const diffs = [];
  // --- Функция нормализации спецсимволов для сравнения ---
  function normalizeShowText(str) {
    if (!str) return '';
    // Привести все ∾ к \\, все \n к \n, <∾∾C[6] к <\\C[6] и т.д.
    return str
      .replace(/∾/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/<∾∾C\[(\d+)\]/g, '<\\C[$1]')
      .replace(/∾∾C\[(\d+)\]>/g, '\\C[$1]>')
      .replace(/∾∾C\[(\d+)\]/g, '\\C[$1]')
      .replace(/\n/g, '\n'); // для редактора, если есть реальные переводы строк
  }
  // 1. Собираем все строки ShowText, которые реально попадут в файл (previewLines)
  const previewShowTexts = previewLines
    .map((line, i) => {
      const m = line.match(/ShowText\(\["(.*)"\]\)/);
      return m ? { idx: i, text: m[1], raw: line } : null;
    })
    .filter(Boolean);

  // 2. Собираем все ShowText из редактора, которые будут экспортированы (только те, что реально попадут в файл)
  let exported = [];
  let buffer = '';
  let isNameLine = false;
  for (let i = 0; i < textBlocks.length; i++) {
    const block = textBlocks[i];
    if (block.type === 'ShowText') {
      if (/^<∾∾C\[6\]/.test(block.text) || /^\\n<\\C\[6\]/.test(block.text)) {
        if (buffer) exported.push(buffer);
        buffer = block.text;
        isNameLine = true;
      } else if (isNameLine && buffer) {
        buffer += '\n' + block.text;
      } else {
        if (buffer) exported.push(buffer);
        buffer = block.text;
        isNameLine = false;
      }
    } else {
      if (buffer) exported.push(buffer);
      buffer = '';
      isNameLine = false;
    }
  }
  if (buffer) exported.push(buffer);

  // 3. Сравниваем экспортируемые строки с тем, что реально попало в файл (с нормализацией)
  for (let i = 0; i < exported.length; i++) {
    const exp = normalizeShowText(exported[i]);
    const prev = previewShowTexts[i] ? normalizeShowText(previewShowTexts[i].text) : undefined;
    if (prev === undefined) {
      diffs.push(`Строка [ShowText #${i+1}] не попала в файл: "${exported[i]}"`);
    } else if (exp !== prev) {
      diffs.push(`Строка [ShowText #${i+1}] отличается в файле:\nВ редакторе: "${exported[i]}"\nВ файле:    "${previewShowTexts[i].text}"`);
    }
  }
  // 4. Проверяем лишние строки в файле
  if (previewShowTexts.length > exported.length) {
    for (let i = exported.length; i < previewShowTexts.length; i++) {
      diffs.push(`В файле есть лишняя строка [ShowText #${i+1}]: "${previewShowTexts[i].text}"`);
    }
  }
  return diffs;
};

// === Обновление списка ошибок под предпросмотром ===
window.updatePreviewErrors = function() {
  const diffsDiv = document.getElementById('previewDiffs');
  if (!window.textBlocks || window.textBlocks.length === 0) {
    diffsDiv.innerHTML = '';
    return;
  }
  const errors = [];
  window.textBlocks.forEach((block, i) => {
    if (block.type === 'ShowText' || block.type === undefined) {
      const info = window.getGameTextInfo(block.text);
      const visibleText = info.rawGameText
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[\d+\]>/g, '')
        .replace(/∾∾C\[\d+\]/g, '')
        .replace(/C\[\d+\]/g, '')
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .trim();
      const len = visibleText.length;
      if (len > 50) {
        errors.push({
          idx: block.idx,
          label: block.idx !== undefined ? `строка ${block.idx+1}` : '[продолжение]',
          type: 'ShowText',
          reason: `Превышен лимит символов: ${len} > 50`
        });
      }
      if (info.isCorrupted) {
        errors.push({
          idx: block.idx,
          label: block.idx !== undefined ? `строка ${block.idx+1}` : '[продолжение]',
          type: 'ShowText',
          reason: 'Повреждён тег имени (<∾∾C[6]...∾∾C[0]>) или синтаксис строки'
        });
      }
    }
  });
  if (errors.length === 0) {
    diffsDiv.innerHTML = '<span style="color:#393">Ошибок не обнаружено.</span>';
    return;
  }
  let html = '<b>Ошибки в строках:</b><ul style="color:#b00; margin-top:4px;">';
  errors.forEach(err => {
    html += `<li><b>${err.label}</b> (${err.type}): ${err.reason}</li>`;
  });
  html += '</ul>';
  diffsDiv.innerHTML = html;
};

// --- Переключение вкладок: обновляем предпросмотр и ошибки ---
document.addEventListener('DOMContentLoaded', function() {
  function showTab(tab) {
    document.getElementById('tabContentEditor').style.display = (tab === 'editor') ? '' : 'none';
    document.getElementById('tabContentPreview').style.display = (tab === 'preview') ? '' : 'none';
    document.getElementById('tabEditor').style.fontWeight = (tab === 'editor') ? 'bold' : 'normal';
    document.getElementById('tabPreview').style.fontWeight = (tab === 'preview') ? 'bold' : 'normal';
  }
  document.getElementById('tabEditor').onclick = () => showTab('editor');
  document.getElementById('tabPreview').onclick = () => {
    updatePreviewArea();
    showTab('preview');
    window.updatePreviewErrors();
  };
});

// --- Также обновляем ошибки при каждом изменении textBlocks ---
window._origUpdateAllForBlock = window.updateAllForBlock;
window.updateAllForBlock = function(block, textarea, plusBtn, minusBtn, counter, textBlocks) {
  if (window._origUpdateAllForBlock) window._origUpdateAllForBlock(block, textarea, plusBtn, minusBtn, counter, textBlocks);
  if (typeof window.updatePreviewErrors === 'function') window.updatePreviewErrors();
};

// === Добавляю функцию escapeFirstThree в начало файла ===
function escapeFirstThree(str) {
  let count = 0;
  let result = str.replace(/\\n|<\\?C\[6\]|\\?C\[0\]>/g, function(match) {
    count++;
    if (count === 1 && match === '\\n') return '\\\\n';
    if (count === 2 && (match === '<\\C[6]' || match === '<C[6]')) return '<\\\\C[6]';
    if (count === 3 && (match === '\\C[0]>' || match === 'C[0]>')) return '\\\\C[0]>';
    return match;
  });
  return result;
}
