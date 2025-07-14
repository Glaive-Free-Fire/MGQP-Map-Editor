document.addEventListener('DOMContentLoaded', function() {
  // (Функции прокрутки теперь будут в HTML)
  // --- Функция генерации preview ---
  window.updatePreviewArea = function() {
    // Генерируем экспортируемое содержимое (до сохранения)
    let previewLines;
    if (window.restoreModeEnabled && window.japaneseLines && window.originalLines) {
      // Если восстановление уже было выполнено, используем обновленные строки
      previewLines = window.fullRusLines.slice();
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
            let lineToInsert = indent + `ShowTextAttributes([${block.text}])`;
            if (block.generated) {
              lineToInsert += ' #+';
            }
            newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
            lineInsertOffset++;
            blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
          } else if (/^\\n<\\C\[6\]/.test(block.text)) {
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
      });
      previewLines = (window.restoreStructureByErrors ? window.restoreStructureByErrors(newLines, textBlocks) : newLines);
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

// --- Проверка структуры для красной лампочки ---
window.checkMapStructureMatch = function(jpContent, ruContent) {
  function parseMapFile(content) {
    const events = {};
    let currentEvent = null, currentPage = null;
    const lines = content.split(/\r?\n/);
    let pageIdx = null;
    let currentBranchEnd = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith('CommonEvent')) {
        const match = line.match(/^CommonEvent (\d+)/);
        if (match) {
          currentEvent = match[1];
          events[currentEvent] = { name: '', pages: [] };
          pageIdx = null;
          currentBranchEnd = 0;
        } else {
          currentEvent = null;
        }
        continue;
      }
      if (line.startsWith('Name = ')) {
        if (currentEvent) events[currentEvent].name = line.replace('Name = ', '').replace(/^"|"$/g, '');
        continue;
      }
      if (line.startsWith('Page ')) {
        const match = line.match(/^Page (\d+)/);
        if (match) {
          pageIdx = Number(match[1]);
          if (currentEvent) events[currentEvent].pages[pageIdx] = [];
          currentBranchEnd = 0;
        } else {
          pageIdx = null;
        }
        continue;
      }
      if (currentEvent !== null && pageIdx !== null) {
        let command = line.match(/^(\w+)/);
        if (!command) continue;
        command = command[1];
        let raw = line;
        
        // --- Обработка BranchEnd и Empty ---
        if (command === 'Empty') {
          // Empty([]) завершает текущий BranchEnd, следующий BranchEnd будет с номером +1
          currentBranchEnd++;
        } else if (command === 'BranchEnd') {
          // BranchEnd([]) получает текущий номер
          events[currentEvent].pages[pageIdx].push({ 
            command, 
            raw, 
            lineNum: i, 
            branchEndNumber: currentBranchEnd 
          });
          continue;
        } else {
          // Обычные команды получают текущий номер BranchEnd
          events[currentEvent].pages[pageIdx].push({ 
            command, 
            raw, 
            lineNum: i, 
            branchEndNumber: currentBranchEnd 
          });
        }
      }
    }
    return events;
  }
  function compareEvents(jpEvents, ruEvents) {
    let total = 0, ok = 0, errors = [], grouped = [];
    let totalLines = 0, okLines = 0;
    for (const [eid, jpEv] of Object.entries(jpEvents)) {
      const ruEv = ruEvents[eid];
      if (!ruEv) {
        errors.push(`Нет CommonEvent ${eid} (${jpEv.name}) в русском файле`);
        grouped.push({ eid, name: jpEv.name, pages: [{ page: 0, ok: false, errors: [`Нет CommonEvent ${eid} (${jpEv.name}) в русском файле`] }] });
        continue;
      }
      let eventGroup = { eid, name: jpEv.name, pages: [] };
      for (let p = 0; p < jpEv.pages.length; p++) {
        const jpPage = jpEv.pages[p] || [];
        const ruPage = (ruEv.pages[p] || []);
        let jpLen = jpPage.length;
        let ruLen = ruPage.length;
        let issues = [];
        for (let i = 0, j = 0; i < jpLen || j < ruLen;) {
          const jpCmd = jpPage[i]?.command;
          const ruCmd = ruPage[j]?.command;
          const jpRaw = jpPage[i]?.raw;
          const ruRaw = ruPage[j]?.raw;
          const jpBranchEnd = jpPage[i]?.branchEndNumber;
          const ruBranchEnd = ruPage[j]?.branchEndNumber;
          
          // --- SKIP: строки с #+ (любые) ---
          if (ruRaw && (ruRaw.trim().startsWith('#+') || /#\+\s*$/.test(ruRaw))) { j++; continue; }
          // --- SKIP: ShowTextAttributes([..]) #+ ---
          if (ruRaw && ruRaw.trim().startsWith('ShowTextAttributes([') && /#\+\s*$/.test(ruRaw)) { j++; continue; }
          
          totalLines++;
          
          // --- Проверка совпадения номеров BranchEnd ---
          if (jpBranchEnd !== undefined && ruBranchEnd !== undefined && jpBranchEnd !== ruBranchEnd) {
            issues.push({
              line: i+1,
              msg: `несовпадение номеров BranchEnd (JP: ${jpBranchEnd}, RU: ${ruBranchEnd})`,
              jp: jpRaw || '',
              ru: ruRaw || '',
              branchEndNumber: jpBranchEnd
            });
            i += 1; j += 1; continue;
          }
          
          if (
            jpCmd === 'ShowText' && jpRaw && jpRaw.match(/^\s*ShowText\(\["【.*】"\]\)/) &&
            jpPage[i+1] && jpPage[i+1].command === 'ShowText'
          ) {
            if (ruCmd === 'ShowText') {
              okLines++;
              i += 2; j += 1; continue;
            } else {
              issues.push({
                line: i+1,
                msg: `тип команды не совпадает (JP: <b>ShowText</b>, RU: <b>${ruCmd || '—'}</b>)`,
                jp: jpRaw + '\n' + (jpPage[i+1]?.raw || ''),
                ru: ruRaw || '',
                branchEndNumber: jpBranchEnd
              });
              i += 2; j += 1; continue;
            }
          }
          if (jpCmd !== ruCmd) {
            issues.push({
              line: i+1,
              msg: `тип команды не совпадает (JP: <b>${jpCmd || '—'}</b>, RU: <b>${ruCmd || '—'}</b>)`,
              jp: jpRaw || '',
              ru: ruRaw || '',
              branchEndNumber: jpBranchEnd
            });
          } else {
            okLines++;
          }
          i += 1; j += 1;
        }
        total++;
        if (issues.length === 0) {
          ok++;
          eventGroup.pages.push({ page: p, ok: true, errors: [] });
        } else {
          errors.push(...issues.map(e => `CommonEvent ${eid} (${jpEv.name}), Page ${p}: Строка ${e.line}: ${e.msg}\nJP: ${e.jp}\nRU: ${e.ru}`));
          eventGroup.pages.push({ page: p, ok: false, errors: issues });
        }
      }
      grouped.push(eventGroup);
    }
    const percent = totalLines ? Math.round(okLines/totalLines*100) : 100;
    return { percent, total, ok, errors, grouped, totalLines, okLines };
  }
  const jpEvents = parseMapFile(jpContent);
  const ruEvents = parseMapFile(ruContent);
  return compareEvents(jpEvents, ruEvents);
};
