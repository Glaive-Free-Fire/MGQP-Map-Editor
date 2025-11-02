document.addEventListener('DOMContentLoaded', function() {
  // --- Универсальный генератор актуального содержимого файла ---
  window.generateCurrentFileContentAsLines = function() {
    if (window.restoreModeEnabled) {
      return window.fullRusLines.slice();
    }
    if (!originalLines || originalLines.length === 0) {
      return ["Сборка файла невозможна. Сначала загрузите файл."];
    }

    const previewLines = [];
    let newLines = [...originalLines];

    // 1. Обновляем Display Name
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
      
      // 2. Создаём карту блоков и карту позиций
    const blockMap = new Map();
    textBlocks.forEach(block => {
      if (block.idx !== undefined) {
        blockMap.set(block.idx, block);
      }
    });
      
      // >>> НАЧАЛО ИЗМЕНЕНИЯ: Создаём карту для отслеживания позиций <<<
    const originalIdxToPosMap = new Map();
      // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<
      
      // 3. Собираем итоговый файл
    for (let i = 0; i < newLines.length; i++) {
      const originalLine = newLines[i];
      const block = blockMap.get(i);
      
      if (block) {
        if (block.isDeleted) {
          continue;
        }
        const indentMatch = originalLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        let formattedLine = originalLine; // Default fallback
        
        switch (block.type) {
            case 'ShowText':
              let txt = block.text.replace(/∿/g, '<<ONE>>').replace(/\n/g, '\\n').replace(/∾∾/g, '\\\\').replace(/∾/g, '\\').replace(/<<ONE>>/g, '\\').replace(/\\(?=[\?\.!\,—])/g, '');
              let newText = txt.replace(/(?<!\\)"/g, '\\"');
              formattedLine = originalLine.replace(/\[(.*)\]/, `["${newText}"]`);
              break;
            case 'ShowTextAttributes':
              // ShowTextAttributes не требует экранирования кавычек, но заменяем ∾ на \
              let attrText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Определяем, были ли кавычки в оригинале
              const attrHasQuotes = /\["(.*)"\]/.test(originalLine);
              if (attrHasQuotes) {
                formattedLine = originalLine.replace(/\["(.*)"\]/, `["${attrText}"]`);
              } else {
                formattedLine = originalLine.replace(/\[(.*)\]/, `[${attrText}]`);
              }
              break;
            case 'Script':
              let scriptText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              let escapedScriptText = scriptText.replace(/(?<!\\)"/g, '\\"');
              formattedLine = originalLine.replace(/\[(.*)\]/, `["${escapedScriptText}"]`);
              break;
            case 'ScriptMore':
              let scriptMoreText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              let escapedScriptMoreText = scriptMoreText.replace(/(?<!\\)"/g, '\\"');
              formattedLine = originalLine.replace(/\[(.*)\]/, `["${escapedScriptMoreText}"]`);
              break;
            case 'Label':
              // Label имеет специальный формат: [имя_метки]
              // Сохраняем оригинальное форматирование с кавычками, заменяем только содержимое
              let labelText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Определяем, были ли кавычки в оригинале
              const labelHasQuotes = /\["(.*)"\]/.test(originalLine);
              if (labelHasQuotes) {
                formattedLine = originalLine.replace(/\["(.*)"\]/, `["${labelText}"]`);
              } else {
                formattedLine = originalLine.replace(/\[(.*)\]/, `[${labelText}]`);
              }
              break;


            case 'JumpToLabel':
              // JumpToLabel имеет специальный формат: [имя_метки]
              // Сохраняем оригинальное форматирование с кавычками, заменяем только содержимое
              let jumpText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Определяем, были ли кавычки в оригинале
              const jumpHasQuotes = /\["(.*)"\]/.test(originalLine);
              if (jumpHasQuotes) {
                formattedLine = originalLine.replace(/\["(.*)"\]/, `["${jumpText}"]`);
              } else {
                formattedLine = originalLine.replace(/\[(.*)\]/, `[${jumpText}]`);
              }
              break;
            case 'Name':
              // Name имеет специальный формат: [имя_персонажа]
              // Сохраняем оригинальное форматирование с кавычками, заменяем только содержимое
              let nameText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Определяем, были ли кавычки в оригинале
              const nameHasQuotes = /\["(.*)"\]/.test(originalLine);
              if (nameHasQuotes) {
                formattedLine = originalLine.replace(/\["(.*)"\]/, `["${nameText}"]`);
              } else {
                formattedLine = originalLine.replace(/\[(.*)\]/, `[${nameText}]`);
              }
              break;
            case 'ShowChoices':
              // ShowChoices имеет формат: [[текст1, текст2, ...], номер_выбора]
              // Заменяем содержимое массива выборов, сохраняя структуру
              let choicesText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Разбиваем варианты выбора и добавляем кавычки к каждому
              const choices = choicesText.split(/\s*\|\s*/);
              const quotedChoices = choices.map(choice => `"${choice.trim()}"`).join(' | ');
              // Заменяем содержимое массива выборов
              formattedLine = originalLine.replace(/\[\[(.*?)\],\s*(\d+)\]/, `[[${quotedChoices}], $2]`);
              break;
            case 'When':
              // When имеет формат: [номер_выбора, "текст_условия"]
              // Заменяем текст условия, сохраняя номер выбора
              let whenText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
              // Определяем, были ли кавычки в оригинале
              const whenHasQuotes = /\[(\d+),\s*"(.*)"\]/.test(originalLine);
              if (whenHasQuotes) {
                formattedLine = originalLine.replace(/\[(\d+),\s*"(.*)"\]/, `[$1, "${whenText}"]`);
              } else {
                formattedLine = originalLine.replace(/\[(\d+),\s*(.*)\]/, `[$1, ${whenText}]`);
              }
              break;
            default:
              // Для ВСЕХ остальных типов (MoveRoute, PlaySE и т.д.)
              // мы НЕ ДЕЛАЕМ НИЧЕГО. Это сохранит их оригинальную структуру.
              formattedLine = originalLine;
              break;
          }
        previewLines.push(indent + formattedLine.trimStart());
        originalIdxToPosMap.set(block.idx, previewLines.length - 1);
      } else {
        previewLines.push(originalLine);
      }
    }
      
      // 4. Вставляем новые строки, используя карту позиций
    textBlocks.forEach(block => {
      if (block.idx === undefined && !block.isDeleted) {
        if (block.generated && block.text === 'ТРЕБУЕТСЯ ПЕРЕВОД') {
          return;
        }

        let lastMainBlockLine = -1;
        let parentIndent = '    ';

        for (let j = textBlocks.indexOf(block) - 1; j >= 0; j--) {
          if (textBlocks[j].idx !== undefined) {
            if (originalIdxToPosMap.has(textBlocks[j].idx)) {
              lastMainBlockLine = originalIdxToPosMap.get(textBlocks[j].idx);
            }
            const parentOriginalLine = newLines[textBlocks[j].idx];
            if (parentOriginalLine) {
              const indentMatch = parentOriginalLine.match(/^\s*/);
              parentIndent = indentMatch ? indentMatch[0] : '    ';
            }
            break;
          }
        }

        if (lastMainBlockLine !== -1) {
          let lineToInsert = '';
          if (block.type === 'ShowTextAttributes') {
            lineToInsert = `${parentIndent}ShowTextAttributes([${block.text}]) #+`;
          } else {
            let txt = block.text.replace(/∿/g, '<<ONE>>').replace(/\n/g, '\\n').replace(/∾∾/g, '\\\\').replace(/∾/g, '\\').replace(/<<ONE>>/g, '\\').replace(/\\(?=[\?\.!\,—])/g, '');
            let newText = txt.replace(/(?<!\\)"/g, '\\"');
            lineToInsert = `${parentIndent}ShowText(["${newText}"]) #+`;
          }

          previewLines.splice(lastMainBlockLine + 1, 0, lineToInsert);
          for (const [key, value] of originalIdxToPosMap.entries()) {
            if (value > lastMainBlockLine) {
              originalIdxToPosMap.set(key, value + 1);
            }
          }
        }
      }
    });

    return previewLines;
  }

  // --- Обновленная функция предпросмотра ---
  window.updatePreviewArea = function() {
    // Используем единую функцию сборки файла для предпросмотра
    const previewLines = window.generateFinalFileLines ? window.generateFinalFileLines() : window.generateCurrentFileContentAsLines();
    document.getElementById('previewArea').value = previewLines.join('\n');
    if (window.updateMatchLamp) {
      window.updateMatchLamp();
    }
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
      if (/^<∾∾C\[6\]/.test(block.text) || /^∾<∾∾C\[6\]/.test(block.text) || /^\\n<\\C\[6\]/.test(block.text)) {
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


// =================================================================================
// === НАЧАЛО ИСПРАВЛЕНИЯ: Упрощенная функция updatePreviewErrors ===
// =================================================================================
window.updatePreviewErrors = function() {
    // Шаг 1: Пересчитываем все ошибки и обновляем список в предпросмотре
    if (window.updateMatchLamp) {
        window.updateMatchLamp();
    }
    // Шаг 2 (недостающий): Применяем изменения подсветки в редакторе
    if (typeof updateRedIndices === 'function') {
        updateRedIndices();
    }
};
// ===============================================================================
// === КОНЕЦ ИСПРАВЛЕНИЯ ===
// ===============================================================================


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
      // updatePreviewErrors() уже вызывается внутри updatePreviewArea
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

// === Новая функция для обработки строк с характеристиками ===
function escapeSkillAttributes(str) {
  // Проверяем, содержит ли строка паттерн получения характеристик
  if (str.includes('получила') || str.includes('получил')) {
    // Проверяем, не является ли строка уже правильно экранированной
    // Если в строке уже есть двойные слеши для I[] и C[], не изменяем её
    if (str.includes('\\\\I[') && str.includes('\\\\C[')) {
      return str; // Уже правильно экранировано, не изменяем
    }
    
    // Обрабатываем управляющие последовательности для навыков
    let result = str;
    
    // Заменяем одиночные слеши на двойные для управляющих последовательностей навыков
    result = result.replace(/\\([IC])\[/g, '\\\\$1[');
    result = result.replace(/\\C\[(\d+)\]/g, '\\\\C[$1]');
    result = result.replace(/\\I\[(\d+)\]/g, '\\\\I[$1]');
    
    return result;
  }
  
  return str;
}

// --- Проверка структуры для красной лампочки ---
window.checkMapStructureMatch = function(jpContent, ruContent) {
  // 1) Простой единый парсер для обоих языков
  function parseMapFile(content) {
    const events = {};
    let currentEvent = null, pageIdx = null;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmedLine = line.trim();
      if (!trimmedLine) continue;
      if (trimmedLine.startsWith('CommonEvent')) {
        const match = trimmedLine.match(/^CommonEvent (\d+)/);
        if (match) {
          currentEvent = match[1];
          events[currentEvent] = { name: '', pages: [] };
          pageIdx = null;
        }
        continue;
      }
      if (trimmedLine.startsWith('Name = ')) {
        if (currentEvent) events[currentEvent].name = trimmedLine.replace('Name = ', '').replace(/^"|"$/g, '');
        continue;
      }
      if (trimmedLine.startsWith('Page ')) {
        const match = trimmedLine.match(/^Page (\d+)/);
        if (match) {
          pageIdx = Number(match[1]);
          if (currentEvent) events[currentEvent].pages[pageIdx] = [];
        }
        continue;
      }
      if (currentEvent !== null && pageIdx !== null) {
        let commandMatch = trimmedLine.match(/^(\w+)/);
        if (!commandMatch) continue;
        const command = commandMatch[1];
        events[currentEvent].pages[pageIdx].push({ command, raw: line, lineNum: i });
      }
    }
    return events;
  }

  // 2) Умный и безопасный компаратор
  function compareEvents(jpEvents, ruEvents) {
    let grouped = [];
    for (const [eid, jpEv] of Object.entries(jpEvents)) {
      const ruEv = ruEvents[eid];
      if (!ruEv) continue;
      let eventGroup = { eid, name: jpEv.name, pages: [] };
      for (let p = 0; p < Math.max(jpEv.pages.length, ruEv.pages.length); p++) {
        const jpPage = jpEv.pages[p] || [];
        const ruPage = (ruEv.pages[p] || []);
        let issues = [];
        let i = 0, j = 0;
        let expectedIndent = null;
        while (i < jpPage.length || j < ruPage.length) {
          const jpLine = jpPage[i];
          const ruLine = ruPage[j];
          const jpCmd = jpLine?.command;
          const ruCmd = ruLine?.command;
          if (ruCmd === 'ShowText' && ruLine) {
            const isContinuation = ruLine.raw.trim().endsWith('#+');
            const isRuNameBlock = ruLine.raw.includes('<\\C[6]');
            if (!isContinuation || isRuNameBlock) {
              expectedIndent = (jpLine?.raw.match(/^(\s*)/) || ['', ''])[1];
            }
            if (expectedIndent !== null) {
              const ruIndent = (ruLine.raw.match(/^(\s*)/) || ['', ''])[1];
              if (ruIndent !== expectedIndent) {
                const already = issues.some(e => e.ruLineNum === ruLine.lineNum && e.msg.includes('отступ'));
                if (!already) {
                  issues.push({
                    line: ruLine.lineNum + 1, msg: `Неправильный отступ в блоке диалога.`,
                    jp: `(Эталонный отступ: "${expectedIndent.replace(/\s/g, '␣')}")`, ru: ruLine.raw,
                    jpLineNum: jpLine?.lineNum, ruLineNum: ruLine.lineNum, isFixableIndent: true, correctIndent: expectedIndent
                  });
                }
              }
            }
          } else {
            expectedIndent = null;
          }
          if (ruPage[j] && ruPage[j].raw.trim().endsWith('#+')) { j++; continue; }
          if (jpCmd === 'ShowText' || ruCmd === 'ShowText') {
            const isJpNameLine = jpLine?.raw.includes('["【');
            
            // <<< НАЧАЛО ИСПРАВЛЕНИЯ: Проверка на оба специальных шаблона >>>
            let isRuSpecialTemplateLine = false;
            if (ruLine) {
                const ruRawTrimmed = ruLine.raw.trim();
                // Проверяем наличие одной из двух ключевых фраз
                const hasSympathy = ruRawTrimmed.includes('(Уровень симпатии:');
                const hasMasters = ruRawTrimmed.includes('(Найдено мастеров:');
                
                if (ruRawTrimmed.startsWith('ShowText') && (hasSympathy || hasMasters) && ruRawTrimmed.endsWith(')"])')) {
                    isRuSpecialTemplateLine = true;
                }
            }

            // Условие срабатывает, только если ОБА файла имеют пару ShowText для обработки
            if (isJpNameLine && jpPage[i + 1]?.command === 'ShowText' && isRuSpecialTemplateLine && ruPage[j + 1]?.command === 'ShowText') {
                // Это наш особый случай: 2 строки в JP (Имя, Диалог) соответствуют 2 строкам в RU (Симпатия, Диалог)
                i += 2; // Пропускаем пару в JP
                j += 2; // Пропускаем пару в RU
                continue;
            }
            // <<< КОНЕЦ ИСПРАВЛЕНИЯ >>>

            // Стандартное правило для обычных имен (2 строки в JP к 1 в RU)
            if (isJpNameLine && (jpPage[i + 1]?.command === 'ShowText') && !jpPage[i + 1]?.raw.includes('["【')) {
              if (ruCmd === 'ShowText') { i += 2; j += 1; continue; }
            }
            if (ruCmd === 'ShowText' && !jpLine) { j++; continue; }
          }
          if (!jpLine || !ruLine || jpCmd !== ruCmd) {
            // --- НАЧАЛО ИЗМЕНЕНИЯ ---
            // Собираем контекст: строки до и после ошибки
            issues.push({
              line: ruLine?.lineNum + 1 || jpLine?.lineNum + 1,
              msg: `Нарушение структуры: ожидалась команда <b>${jpCmd || '—'}</b>, а найдена <b>${ruCmd || '—'}</b>`,
              jp: jpLine?.raw || '',
              ru: ruLine?.raw || '',
              jpLineNum: jpLine?.lineNum,
              ruLineNum: ruLine?.lineNum,
              // Добавляем контекст
              jpContext: { before: jpPage[i - 1]?.raw, after: jpPage[i + 1]?.raw },
              ruContext: { before: ruPage[j - 1]?.raw, after: ruPage[j + 1]?.raw }
            });
            // --- КОНЕЦ ИЗМЕНЕНИЯ ---
            break;
          }
          i++; j++;
        }
        eventGroup.pages.push({ page: p, ok: issues.length === 0, errors: issues });
      }
      grouped.push(eventGroup);
    }
    const totalLines = grouped.reduce((sum, ev) => sum + ev.pages.reduce((pSum, page) => pSum + Math.max(jpEvents[ev.eid]?.pages[page.page]?.length || 0, ruEvents[ev.eid]?.pages[page.page]?.length || 0), 0), 0);
    const okLines = totalLines - grouped.reduce((sum, ev) => sum + ev.pages.reduce((pSum, page) => pSum + page.errors.length, 0), 0);
    const percent = totalLines ? Math.round(okLines / totalLines * 100) : 100;
    return { percent, grouped, totalLines, okLines };
  }

  const jpEvents = parseMapFile(jpContent);
  const ruEvents = parseMapFile(ruContent);
  return compareEvents(jpEvents, ruEvents);
};