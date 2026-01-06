document.addEventListener('DOMContentLoaded', function () {
  // --- Универсальный генератор актуального содержимого файла ---
  window.generateCurrentFileContentAsLines = function () {
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

        // --- УМНЫЙ ПРОПУСК ДУБЛИКАТОВ ---
        // Если мы только что обработали ShowText, проверяем следующие строки.
        // Если следующая строка тоже ShowText И для неё нет отдельного блока (значит, она объединена),
        // то мы её пропускаем. Но если это другая команда (ShowTextAttributes и т.д.), мы её НЕ трогаем.
        if (block.type === 'ShowText') {
          while ((i + 1) < newLines.length) {
            const nextIdx = i + 1;
            // 1. Если для следующей строки есть блок, значит это независимая строка. Не пропускаем.
            if (blockMap.has(nextIdx)) break;

            // 2. Если следующая строка НЕ является ShowText, это другая команда. Не пропускаем.
            const nextLineContent = newLines[nextIdx];
            if (!/^\s*ShowText\(/.test(nextLineContent)) break;

            // 3. Если это ShowText и для него нет блока, значит это "хвост" объединения. Пропускаем.
            i++;
          }
        }
        // --------------------------------
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
  window.updatePreviewArea = function () {
    // Используем единую функцию сборки файла для предпросмотра
    const previewLines = window.generateFinalFileLines ? window.generateFinalFileLines() : window.generateCurrentFileContentAsLines();
    document.getElementById('previewArea').value = previewLines.join('\n');
    if (window.updateMatchLamp) {
      window.updateMatchLamp();
    }
  }
});

window.testModeCompare = function (textBlocks, previewLines) {
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
      diffs.push(`Строка [ShowText #${i + 1}] не попала в файл: "${exported[i]}"`);
    } else if (exp !== prev) {
      diffs.push(`Строка [ShowText #${i + 1}] отличается в файле:\nВ редакторе: "${exported[i]}"\nВ файле:    "${previewShowTexts[i].text}"`);
    }
  }
  // 4. Проверяем лишние строки в файле
  if (previewShowTexts.length > exported.length) {
    for (let i = exported.length; i < previewShowTexts.length; i++) {
      diffs.push(`В файле есть лишняя строка [ShowText #${i + 1}]: "${previewShowTexts[i].text}"`);
    }
  }
  return diffs;
};


// =================================================================================
// === НАЧАЛО ИСПРАВЛЕНИЯ: Упрощенная функция updatePreviewErrors ===
// =================================================================================
window.updatePreviewErrors = function () {
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
document.addEventListener('DOMContentLoaded', function () {
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
window.updateAllForBlock = function (block, textarea, plusBtn, minusBtn, counter, textBlocks) {
  if (window._origUpdateAllForBlock) window._origUpdateAllForBlock(block, textarea, plusBtn, minusBtn, counter, textBlocks);
  if (typeof window.updatePreviewErrors === 'function') window.updatePreviewErrors();
};

// === Добавляю функцию escapeFirstThree в начало файла ===
function escapeFirstThree(str) {
  let count = 0;
  let result = str.replace(/\\n|<\\?C\[6\]|\\?C\[0\]>/g, function (match) {
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
// --- Проверка структуры для красной лампочки ---
// --- Проверка структуры для красной лампочки ---
// --- Проверка структуры для красной лампочки ---
window.checkMapStructureMatch = function (jpContent, ruContent) {
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
          pageIdx = 1; // Default page for CommonEvents
          events[currentEvent].pages[pageIdx] = [];
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

        if (!events[currentEvent].pages[pageIdx]) {
          events[currentEvent].pages[pageIdx] = [];
        }

        events[currentEvent].pages[pageIdx].push({ command, raw: line, lineNum: i });
      }
    }
    return events;
  }

  // 2) Умный и безопасный компаратор (ИГНОРИРУЕТ ТЕКСТОВЫЕ КОМАНДЫ)
  function compareEvents(jpEvents, ruEvents) {
    let grouped = [];
    // Список команд, которые мы исключаем из проверки структуры (игнорируем их наличие/отсутствие)
    // Это позволяет менять структуру диалогов (делить строки, добавлять атрибуты) без ошибок.
    const ignoredCommands = ['ShowText', 'ShowTextAttributes'];

    for (const [eid, jpEv] of Object.entries(jpEvents)) {
      const ruEv = ruEvents[eid];
      if (!ruEv) continue;

      let eventGroup = { eid, name: jpEv.name, pages: [] };
      const maxPages = Math.max(jpEv.pages.length, ruEv.pages.length);

      for (let p = 0; p < maxPages; p++) {
        if (!jpEv.pages[p] && !ruEv.pages[p]) continue;

        const jpPage = jpEv.pages[p] || [];
        const ruPage = (ruEv.pages[p] || []);
        let issues = [];

        let i = 0, j = 0;

        while (i < jpPage.length || j < ruPage.length) {
          const jpLine = jpPage[i];
          const ruLine = ruPage[j];
          const jpCmd = jpLine?.command;
          const ruCmd = ruLine?.command;

          // === НОВАЯ ЛОГИКА: Пропуск текстовых команд ===

          // 1. Если японская команда в списке игнорируемых - пропускаем её
          if (jpCmd && ignoredCommands.includes(jpCmd)) {
            i++;
            continue;
          }

          // 2. Если русская команда в списке игнорируемых - пропускаем её
          if (ruCmd && ignoredCommands.includes(ruCmd)) {
            j++;
            continue;
          }

          // 3. Также пропускаем сгенерированные строки #+ в русском файле (на всякий случай)
          if (ruPage[j] && ruPage[j].raw.trim().endsWith('#+')) {
            j++;
            continue;
          }

          // === Сравнение только структурных команд (Switch, Variable, Condition, Exit, etc.) ===
          if (!jpLine || !ruLine || jpCmd !== ruCmd) {
            issues.push({
              line: ruLine?.lineNum + 1 || jpLine?.lineNum + 1,
              msg: `Нарушение логической структуры: ожидалась команда <b>${jpCmd || '—'}</b>, а найдена <b>${ruCmd || '—'}</b>`,
              jp: jpLine?.raw || '',
              ru: ruLine?.raw || '',
              jpLineNum: jpLine?.lineNum,
              ruLineNum: ruLine?.lineNum,
              jpContext: { before: jpPage[i - 1]?.raw, after: jpPage[i + 1]?.raw },
              ruContext: { before: ruPage[j - 1]?.raw, after: ruPage[j + 1]?.raw }
            });
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

// =================================================================================
// === НОВОЕ: Принудительное использование имен из японского файла ===
// =================================================================================

// 1. Функция принудительного исправления имен
window.forceCorrectNames = function () {
  // Если нет загруженных данных, выходим
  if (!window.fullJapLines || window.fullJapLines.length === 0) return;
  if (!window.originalLines || window.originalLines.length === 0) return;

  // A. Парсим японские имена (EventId -> Name)
  const jpNames = {}; // EventId -> Name
  let curJpEvent = null;
  for (const line of window.fullJapLines) {
    const trim = line.trim();
    const evMatch = trim.match(/^CommonEvent (\d+)/);
    if (evMatch) {
      curJpEvent = evMatch[1];
      continue;
    }
    if (curJpEvent && trim.startsWith('Name = ')) {
      // Извлекаем имя, убирая кавычки
      jpNames[curJpEvent] = trim.replace('Name = ', '').replace(/^"|"$/g, '');
      curJpEvent = null;
    }
  }

  // B. Сопоставляем строки русского файла с EventID
  const lineToEvent = new Map();
  let curRuEvent = null;
  for (let i = 0; i < window.originalLines.length; i++) {
    const trim = window.originalLines[i].trim();
    const evMatch = trim.match(/^CommonEvent (\d+)/);
    if (evMatch) { curRuEvent = evMatch[1]; }
    if (curRuEvent) lineToEvent.set(i, curRuEvent);
  }

  // C. Проходим по всем блокам и обновляем имена
  if (window.textBlocks) {
    window.textBlocks.forEach(block => {
      // Нас интересуют только блоки типа Name и только те, что имеют привязку к строкам
      if (block.type === 'Name' && block.idx !== undefined) {
        const evId = lineToEvent.get(block.idx);

        // Если мы знаем EventID и для него есть японское имя
        if (evId && jpNames[evId] !== undefined) {
          // Проверяем, отличается ли имя
          if (block.text !== jpNames[evId]) {
            console.log(`[AutoFix] Исправлено имя события ${evId}: "${block.text}" -> "${jpNames[evId]}"`);
            // 1. Обновляем текст в блоке данных
            block.text = jpNames[evId];

            // 2. Обновляем UI (поле ввода), если оно существует
            if (block.dom && block.dom.rusInput) {
              block.dom.rusInput.value = jpNames[evId];
              // Вызываем событие input, чтобы сбросить красную подсветку (если была)
              // и обновить любые связанные состояния редактора
              block.dom.rusInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }
      }
    });
  }
};

// 2. Переопределяем генератор файла, чтобы он внедрял это исправление
// Используем setTimeout, чтобы убедиться, что основной скрипт уже загрузил оригинальную функцию
setTimeout(function () {
  const originalGen = window.generateFinalFileLines;

  // Добавляем вспомогательную функцию форматирования, если она еще не доступна
  // (хотя она должна быть глобальной, но для надежности в test_mode.js лучше иметь копию или ссылку)
  function formatShowTextContentLocal(text) {
    if (typeof window.formatShowTextContent === 'function') {
      return window.formatShowTextContent(text);
    }
    // Фоллбек, если глобальной функции нет (копия логики из html)
    let txt = text.replace(/∿/g, '<<ONE>>').replace(/\n/g, '\\n').replace(/∾∾/g, '\\\\').replace(/∾/g, '\\').replace(/<<ONE>>/g, '\\').replace(/\\(?=[\?\.!\,—])/g, '');
    return txt.replace(/(?<!\\)"/g, '\\"');
  }

  window.generateFinalFileLines = function () {
    // === ШАГ 0: АВТО-ИСПРАВЛЕНИЕ ИМЕН ===
    try {
      if (typeof window.forceCorrectNames === 'function') {
        window.forceCorrectNames();
      }
    } catch (e) {
      console.error("Critical Error in forceCorrectNames:", e);
    }

    // === ШАГ 1: ПОДГОТОВКА ДАННЫХ ===
    // Если включен режим восстановления, просто возвращаем уже готовые строки
    if (window.restoreModeEnabled && window.fullRusLines) {
      return window.fullRusLines.slice();
    }

    // Используем window.originalLines и window.textBlocks если доступны, иначе локальные
    const linesToUse = window.originalLines || originalLines;
    const blocksToUse = window.textBlocks || textBlocks;

    // Если данных нет, возвращаем пустой массив
    if (!linesToUse || !blocksToUse) {
      return [];
    }

    let exportLines = []; // Итоговые строки
    let newLines = [...linesToUse];
    const blockMap = new Map();
    blocksToUse.forEach(block => {
      if (block.idx !== undefined) {
        blockMap.set(block.idx, block);
      }
    });

    // === ШАГ 2: ОБРАБОТКА 'Display Name' (Только для Карт!) ===
    // Опираемся на имя файла для разделения логики
    const isMapFile = window.loadedFileName && /Map\d+/i.test(window.loadedFileName);
    const isCommonEventFile = window.loadedFileName && /CommonEvent\d+/i.test(window.loadedFileName);

    let lineOffset = 0; // Сдвиг индексов, если мы вставили строку

    if (isMapFile || (!isCommonEventFile)) {
      let dn = '';
      if (typeof mapDisplayName !== 'undefined') dn = mapDisplayName;
      else if (window.mapDisplayName) dn = window.mapDisplayName;

      let displayNameLine = `Display Name = "${dn}"`;
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
        lineOffset = 1;
      }
    } else {
      lineOffset = 0;
    }

    // === ШАГ 3: СБОРКА ИТОГОВОГО ФАЙЛА ===
    const originalIdxToExportPos = new Map();

    for (let i = 0; i < newLines.length; i++) {
      const currentLineContent = newLines[i];
      const originalIdx = i - lineOffset;
      const block = (originalIdx >= 0) ? blockMap.get(originalIdx) : undefined;

      if (originalIdx >= 0) {
        originalIdxToExportPos.set(originalIdx, exportLines.length);
      }

      if (block) {
        if (block.isDeleted) {
          continue;
        }

        const indentMatch = currentLineContent.match(/^\s*/);
        let formattedLine = currentLineContent;

        switch (block.type) {
          case 'ShowText':
            formattedLine = currentLineContent.replace(/\[(.*)\]/, `["${formatShowTextContentLocal(block.text)}"]`);
            break;
          case 'ShowTextAttributes':
            let attrText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const attrHasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (attrHasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${attrText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${attrText}]`); }
            break;
          case 'Script':
            let scriptText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            let escapedScriptText = scriptText.replace(/(?<!\\)"/g, '\\\\"');
            formattedLine = currentLineContent.replace(/\[(.*)\]/, `["${escapedScriptText}"]`);
            break;
          case 'ScriptMore':
            let scriptMoreText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            let escapedScriptMoreText = scriptMoreText.replace(/(?<!\\)"/g, '\\\\"');
            formattedLine = currentLineContent.replace(/\[(.*)\]/, `["${escapedScriptMoreText}"]`);
            break;
          case 'Label':
            let labelText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const labelHasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (labelHasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${labelText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${labelText}]`); }
            break;
          case 'JumpToLabel':
            let jumpText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const jumpHasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (jumpHasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${jumpText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${jumpText}]`); }
            break;
          case 'Name':
            let nameText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const nameHasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (nameHasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${nameText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${nameText}]`); }
            break;
          case 'ShowChoices':
            let choicesText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const choices = choicesText.split(/\s*\|\s*/);
            const quotedChoices = choices.map(choice => `"${choice.trim()}"`).join(', ');
            formattedLine = currentLineContent.replace(/\[\[(.*?)\],\s*(\d+)\]/, `[[${quotedChoices}], $2]`);
            break;
          case 'When':
            let whenText = block.text.replace(/∾/g, '\\\\').replace(/\n/g, '\\\\n');
            const whenHasQuotes = /\[(\d+),\s*"(.*)"\]/.test(currentLineContent);
            if (whenHasQuotes) { formattedLine = currentLineContent.replace(/\[(\d+),\s*"(.*)"\]/, `[$1, "${whenText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(\d+),\s*(.*)\]/, `[$1, ${whenText}]`); }
            break;
          default:
            formattedLine = currentLineContent;
            break;
        }
        exportLines.push(formattedLine);

        // --- УМНЫЙ ПРОПУСК ДУБЛИКАТОВ ---
        if (block.type === 'ShowText') {
          while ((i + 1) < newLines.length) {
            const nextIdx = i - lineOffset + 1; // Индекс в оригинальном файле/блоках
            if (blockMap.has(nextIdx)) break;
            const nextLineContent = newLines[i + 1];
            if (!/^\s*ShowText\(/.test(nextLineContent)) break;
            i++;
          }
        }
      } else {
        exportLines.push(currentLineContent);
      }
    }

    // === ШАГ 4: ВСТАВКА НОВЫХ СТРОК (созданных в редакторе через +) ===
    let insertedCountCombined = 0;
    blocksToUse.forEach(block => {
      if (block.idx === undefined && !block.isDeleted) {
        if (block.generated && block.text === 'ТРЕБУЕТСЯ ПЕРЕВОД') return;

        let lastMainBlockLine = -1;
        let parentIndent = '    ';
        const myIndexInBlocks = blocksToUse.indexOf(block);

        for (let j = myIndexInBlocks - 1; j >= 0; j--) {
          if (blocksToUse[j].idx !== undefined) {
            if (originalIdxToExportPos.has(blocksToUse[j].idx)) {
              lastMainBlockLine = originalIdxToExportPos.get(blocksToUse[j].idx);
            }
            break;
          }
        }

        if (lastMainBlockLine !== -1) {
          if (exportLines[lastMainBlockLine]) {
            const indentMatch = exportLines[lastMainBlockLine].match(/^\s*/);
            if (indentMatch) parentIndent = indentMatch[0];
          }

          let txt = formatShowTextContentLocal(block.text);
          let lineToInsert = (block.type === 'ShowTextAttributes') ?
            `${parentIndent}ShowTextAttributes([${block.text}]) #+` :
            `${parentIndent}ShowText(["${txt}"]) #+`;

          exportLines.splice(lastMainBlockLine + 1, 0, lineToInsert);

          // Обновляем карту позиций для всех последующих элементов
          for (const [key, value] of originalIdxToExportPos.entries()) {
            if (value > lastMainBlockLine) {
              originalIdxToExportPos.set(key, value + 1);
            }
          }
        }
      }
    });

    // === ШАГ 5: ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ ОТСТУПОВ PAGE ===
    for (let i = 0; i < exportLines.length; i++) {
      if (/^\s*Page\s+\d+/.test(exportLines[i])) {
        exportLines[i] = exportLines[i].replace(/^\s*(Page\s+\d+)/, '  $1');
      }
    }

    return exportLines;
  };

  console.log("window.generateFinalFileLines успешно переопределена. Логика разделена для Map/CommonEvent.");
}, 500);

// =================================================================================
// === НОВОЕ: Индикатор типа файла (Map/Event) ===
// =================================================================================
window.updateFileTypeIndicator = function () {
  const indicator = document.getElementById('fileTypeIndicator');
  if (!indicator) return;

  // Пытаемся получить имя файла из переменной или напрямую из инпута
  let fileName = window.loadedFileName;
  if (!fileName) {
    const input = document.getElementById('fileInput');
    if (input && input.files && input.files.length > 0) {
      fileName = input.files[0].name;
      // На всякий случай обновляем глобальную переменную, если она была пуста
      window.loadedFileName = fileName;
    }
  }

  if (!fileName) {
    indicator.style.display = 'none';
    return;
  }

  const isMap = /Map\d+/i.test(fileName);
  const isEvent = /CommonEvent\d+/i.test(fileName);

  // console.log("File Type Update:", fileName, isMap, isEvent); // Debug

  if (isMap) {
    indicator.textContent = 'Map';
    indicator.style.backgroundColor = '#28a745'; // Green
    indicator.style.display = 'inline-block';
  } else if (isEvent) {
    indicator.textContent = 'Event';
    indicator.style.backgroundColor = '#007bff'; // Blue
    indicator.style.display = 'inline-block';
  } else {
    // Unknown file type
    indicator.style.display = 'none';
  }
};

// Запускаем периодическую проверку (так как загрузка файла может произойти в любой момент)
setInterval(function () {
  if (typeof window.updateFileTypeIndicator === 'function') {
    window.updateFileTypeIndicator();
  }
}, 1000);

// =================================================================================
// === НОВОЕ: Кнопка "ChangeItems" для CommonEvent ===
// =================================================================================

// 1. Создаем функцию для добавления кнопок
window.addChangeItemsButtons = function () {
  let fileName = window.loadedFileName;
  if (!fileName) {
    const input = document.getElementById('fileInput');
    if (input && input.files && input.files.length > 0) {
      fileName = input.files[0].name;
    }
  }

  if (!fileName || !/(CommonEvent|Map)\d+/i.test(fileName)) {
    return;
  }

  const lines = window.originalLines || [];
  if (lines.length === 0) return;

  window.textBlocks.forEach((block, index) => {
    if (block.type !== 'ShowText' || !block.dom || !block.dom.rusInput) return;
    if (block.idx === undefined) return;

    const isItemGetPattern = (text) => {
      // Ищем шаблоны i[iaw][...] или японские ключевые слова получения предмета
      return /i[iaw]\[|手に入れた|入手|獲得|拾った|授かった|Obtained|Got|Найдено|Получено/i.test(text);
    };

    const currentIsPattern = isItemGetPattern(block.text);

    // --- Улучшенная логика поиска ---
    const searchDepth = 15; // Немного уменьшили глубину
    let itemId = null;
    let itemAmount = '1';
    let itemType = 'ii'; // По умолчанию предмет (Item)
    let interveningShowTexts = 0;

    for (let i = block.idx - 1; i >= Math.max(0, block.idx - searchDepth); i--) {
      const line = lines[i].trim();

      // Если встретили конец ветвления, начало другого условия или технические прерывания - ПРЕКРАЩАЕМ
      // Это предотвратит "просачивание" кнопок в не связанный диалог
      if (/^(BranchEnd|Else|ConditionalBranch|TransferPlayer|CallCommonEvent|Script|ExitEventProcessing|Label|JumpToLabel)/.test(line)) {
        break;
      }

      if (/^ShowText\(/.test(line)) {
        interveningShowTexts++;
        if (interveningShowTexts > 2) break;
      }

      // Парсинг ChangeItems, ChangeWeapons, ChangeArmor
      const matchFull = line.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),\s*\d+,\s*(\d+),\s*(\d+).*?\]\)/);
      const matchSimple = line.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),/);

      if (matchFull) {
        const command = matchFull[1];
        itemId = matchFull[2];
        const typeOp = matchFull[3];
        const amount = matchFull[4];
        itemAmount = (typeOp === '1') ? `∾∾V[${amount}]` : amount;

        if (command === 'ChangeWeapons') itemType = 'iw';
        else if (command === 'ChangeArmor') itemType = 'ia';
        else itemType = 'ii';

        break;
      } else if (matchSimple) {
        const command = matchSimple[1];
        itemId = matchSimple[2];
        itemAmount = '1';

        if (command === 'ChangeWeapons') itemType = 'iw';
        else if (command === 'ChangeArmor') itemType = 'ia';
        else itemType = 'ii';

        break;
      }
    }

    if (!itemId) return;

    // Решаем, показывать ли кнопку
    // Теперь показываем ТОЛЬКО если текст совпадает с паттерном получения предмета.
    // Это исключает ложные срабатывания на обычном диалоге, который просто идет после команды.
    if (currentIsPattern) {
      if (block.dom.changeItemsBtn && block.dom.changeItemsBtn.isConnected) return;

      const btn = document.createElement('button');

      // Настраиваем текст и стиль в зависимости от типа
      let typeLabel = 'Item';
      let btnBg = '#e6ccff'; // Фиолетовый для предметов
      if (itemType === 'iw') { typeLabel = 'Weapon'; btnBg = '#ffe0cc'; }
      else if (itemType === 'ia') { typeLabel = 'Armor'; btnBg = '#ccf2ff'; }

      btn.textContent = `${typeLabel}[${itemId}] x${itemAmount}`;
      btn.className = 'control-btn';
      btn.style.cssText = `font-size:11px; margin-left:10px; padding:2px 6px; background:${btnBg}; cursor:pointer;`;
      btn.title = `Заменить на шаблон получения (${typeLabel}) ID ${itemId}`;

      btn.onclick = function () {
        const newText = `∾∾${itemType}[${itemId}] × ${itemAmount} получено!`;
        if (block.dom.rusInput.value === newText) return;

        block.dom.rusInput.value = newText;
        block.text = newText;
        block.dom.rusInput.dispatchEvent(new Event('input', { bubbles: true }));

        const oldLabel = btn.textContent;
        btn.textContent = 'Done!';
        setTimeout(() => { btn.textContent = oldLabel; }, 1000);
      };

      const blockDiv = block.dom.rusInput.closest('.block');
      if (blockDiv) {
        const label = blockDiv.querySelector('label');
        if (label) {
          label.appendChild(btn);
          block.dom.changeItemsBtn = btn;
        }
      }
    }
  });

  // Обновляем глобальную кнопку после добавления локальных
  if (typeof window.updateGlobalChangeItemsBtn === 'function') {
    window.updateGlobalChangeItemsBtn();
  }
};

// --- ЛОГИКА ГЛОБАЛЬНОЙ КНОПКИ ChangeItems ---
window.updateGlobalChangeItemsBtn = function () {
  const existingGlobalBtn = document.getElementById('globalChangeItemsBtn');

  // Ищем все красные блоки, у которых есть кнопка ChangeItems
  // Используем несколько признаков "красности" для надежности
  const redBlocksWithBtn = (window.textBlocks || []).filter((block, blIdx) => {
    if (!block.dom || !block.dom.changeItemsBtn) return false;

    // 1. Проверка на японский текст
    const isJapanese = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(block.text);

    // 2. Проверка на наличие в общем списке ошибок (если он есть)
    const hasError = window.allErrorIndices && window.allErrorIndices.has(blIdx);

    // 3. Проверка на CSS класс ошибки
    const hasRedClass = block.dom.rusInput && block.dom.rusInput.parentElement.classList.contains('error-red');

    // 4. Проверка на цвет фона (через computed style)
    let hasRedColor = false;
    if (block.dom.rusInput) {
      const bg = window.getComputedStyle(block.dom.rusInput).backgroundColor;
      // rgb(255, 204, 204) - #FFCCCC, rgb(255, 214, 214) - #FFD6D6
      if (bg.includes('255') && (bg.includes('204') || bg.includes('214'))) {
        hasRedColor = true;
      }
    }

    return (isJapanese || hasError || hasRedClass || hasRedColor);
  });

  if (redBlocksWithBtn.length > 0) {
    const globalBtn = existingGlobalBtn || document.createElement('button');
    globalBtn.id = 'globalChangeItemsBtn';
    globalBtn.textContent = `Применить ChangeItems ко всем красным (${redBlocksWithBtn.length})`;
    globalBtn.className = 'control-btn';
    globalBtn.style.cssText = 'margin-left:10px; background:#9933ff; color:white; font-weight:bold; cursor:pointer; vertical-align: middle;';

    globalBtn.onclick = function () {
      redBlocksWithBtn.forEach(block => {
        if (block.dom.changeItemsBtn && block.dom.changeItemsBtn.isConnected) {
          block.dom.changeItemsBtn.click();
        }
      });
      this.remove(); // Скрываем кнопку после нажатия
    };

    if (!existingGlobalBtn) {
      const controls = document.querySelector('.control-panel') || document.querySelector('.controls') || document.getElementById('batchCheckBtn')?.parentElement;
      if (controls) {
        controls.appendChild(globalBtn);
      }
    }
  } else if (existingGlobalBtn) {
    existingGlobalBtn.remove();
  }
};

// --- Функция для добавления кнопок "Fix Name" ---
window.addFixNameButtons = function () {
  if (!window.textBlocks) return;

  let totalFixable = 0;
  let fixedCount = 0;

  window.textBlocks.forEach((block, index) => {
    if (block.type !== 'ShowText' || !block.dom || !block.dom.rusInput) return;

    const text = block.text;
    // Паттерн: 【Имя】\nТекст
    const nameMatch = text.match(/^【(.+?)】\s*\n?([\s\S]*)$/);
    // Проверка, исправлена ли уже строка
    const isAlreadyFixed = /^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(text);

    // ИСПРАВЛЕНИЕ: Считаем только блоки, которые имеют отношение к именам
    // (либо нуждаются в исправлении, либо уже исправлены)
    if (nameMatch || isAlreadyFixed) {
      totalFixable++;
      if (isAlreadyFixed) {
        fixedCount++;
      }
    }

    if (!nameMatch && !isAlreadyFixed) return;

    // Если кнопка уже есть, просто обновляем её состояние (цвета)
    if (block.dom.fixNameBtn && block.dom.fixNameBtn.isConnected) {
      block.dom.fixNameBtn.style.background = isAlreadyFixed ? '#8f8' : '#eee';
      return;
    }

    const btn = document.createElement('button');
    btn.textContent = 'Fix Name';
    btn.className = 'control-btn';
    btn.style.fontSize = '11px';
    btn.style.marginLeft = '10px';
    btn.style.padding = '2px 6px';
    btn.style.background = isAlreadyFixed ? '#8f8' : '#eee';
    btn.title = 'Оформить тег имени (∾\\n<∾∾C[6]...>)';

    btn.onclick = function () {
      if (/^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(block.text)) return;

      const match = block.text.match(/^【(.+?)】\s*\n?([\s\S]*)$/);
      if (match) {
        const name = match[1];
        const rest = match[2];
        const newText = `∾\n<∾∾C[6]${name}∾∾C[0]>${rest}`;

        block.dom.rusInput.value = newText;
        block.text = newText;
        block.dom.rusInput.dispatchEvent(new Event('input', { bubbles: true }));
        btn.style.background = '#8f8';

        // Обновляем состояние глобальной кнопки (пересчет)
        window.addFixNameButtons();
      }
    };

    const blockDiv = block.dom.rusInput.closest('.block');
    if (blockDiv) {
      const label = blockDiv.querySelector('label');
      if (label) {
        label.appendChild(btn);
        block.dom.fixNameBtn = btn;
      }
    }
  });

  // Управление глобальной кнопкой в верхней панели
  const globalBtn = document.getElementById('fixNameTagsBtn');
  if (globalBtn) {
    const actuallyUnfixed = totalFixable - fixedCount;
    if (actuallyUnfixed > 0) {
      globalBtn.style.display = 'inline-block';
      globalBtn.style.background = '#cfc';
      globalBtn.textContent = `Fix All Names (${actuallyUnfixed})`;
    } else {
      globalBtn.style.display = 'none';
    }
  }
};

// 2. Переопределяем renderTextBlocks, чтобы он вызывал нашу функцию
setTimeout(function () {
  if (typeof window.renderTextBlocks === 'function' && !window.renderTextBlocksOriginal) {
    window.renderTextBlocksOriginal = window.renderTextBlocks;

    window.renderTextBlocks = function () {
      // Вызываем оригинал
      window.renderTextBlocksOriginal.apply(this, arguments);

      // Вызываем наше дополнение
      try {
        window.addChangeItemsButtons();
        window.addFixNameButtons();
      } catch (e) {
        console.error("Error in additional buttons (ChangeItems/FixName):", e);
      }
    };
    console.log("renderTextBlocks successfully hooked for ChangeItems buttons.");

    // Инициализация глобальной кнопки Fix All Names
    const globalFixBtn = document.getElementById('fixNameTagsBtn');
    if (globalFixBtn) {
      globalFixBtn.onclick = function () {
        if (!window.textBlocks) return;
        let count = 0;
        window.textBlocks.forEach(block => {
          if (block.type !== 'ShowText' || !block.dom || !block.dom.rusInput) return;
          const match = block.text.match(/^【(.+?)】\s*\n?([\s\S]*)$/);
          if (match && !/^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(block.text)) {
            const name = match[1];
            const rest = match[2];
            const newText = `∾\n<∾∾C[6]${name}∾∾C[0]>${rest}`;
            block.dom.rusInput.value = newText;
            block.text = newText;
            block.dom.rusInput.dispatchEvent(new Event('input', { bubbles: true }));
            count++;
          }
        });
        if (count > 0) {
          console.log(`Global Fix Names: fixed ${count} blocks.`);
          window.addFixNameButtons(); // Перерисовать/скрыть
        }
      };
    }

    // --- НОВОЕ: Перехват функции updateFixButtonsVisibility ---
    // Это гарантирует, что кнопка "Fix All Names" не будет скрыта скриптом restore-mode.js,
    // если есть имена для исправления.
    if (typeof window.updateFixButtonsVisibility === 'function' && !window.updateFixButtonsVisibilityOriginal) {
      window.updateFixButtonsVisibilityOriginal = window.updateFixButtonsVisibility;
      window.updateFixButtonsVisibility = function () {
        // Сначала выполняем стандартную проверку видимости
        window.updateFixButtonsVisibilityOriginal.apply(this, arguments);

        // Затем принудительно запускаем проверку наших кнопок Fix Name
        try {
          window.addFixNameButtons();
        } catch (e) {
          console.error("Error in addFixNameButtons hook:", e);
        }
      };
      console.log("updateFixButtonsVisibility successfully hooked.");
    }
  }
}, 1000); // Чуть больше задержка, чтобы убедиться что основной скрипт загружен

// =================================================================================
// === НОВОЕ: Переопределение проверки и исправления отступов ===
// =================================================================================

setTimeout(function () {
  const originalCheckForLineLevelErrors = window.checkForLineLevelErrors;

  // Расширяем функцию проверки ошибок
  window.checkForLineLevelErrors = function (lines) {
    let errors = [];

    // 1. Вызываем базовые проверки (Японский текст, длина строк и т.д.)
    if (typeof originalCheckForLineLevelErrors === 'function') {
      errors = originalCheckForLineLevelErrors(lines);
    }

    if (!lines || lines.length === 0) return errors;

    // 2. Добавляем проверку отступов для строк с #+
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/#\+/.test(line)) {
        let prevLine = null;
        for (let j = i - 1; j >= 0; j--) {
          const l = lines[j];
          if (l && l.trim() !== '') {
            prevLine = l;
            break;
          }
        }

        if (prevLine) {
          const currentIndentMatch = line.match(/^\s*/);
          const prevIndentMatch = prevLine.match(/^\s*/);
          const currentIndent = currentIndentMatch ? currentIndentMatch[0] : '';
          const prevIndent = prevIndentMatch ? prevIndentMatch[0] : '';

          if (currentIndent !== prevIndent) {
            errors.push({
              label: `строка ${i + 1}`,
              type: 'Ошибка отступа',
              reason: `Неверный отступ (ожидался: "${prevIndent.length}", найдено: "${currentIndent.length}")`,
              line: i,
              msg: `Неверный отступ в сгенерированной строке (ожидался: "${prevIndent.length}" пробелов, найдено: "${currentIndent.length}")`,
              expectedIndent: prevIndent,
              isFixableIndent: true // Важный флаг для фильтрации
            });
          }
        }
      }
    }

    // 3. Добавляем проверку отступов для строк "Page X"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const pageMatch = line.match(/^(\s*)Page\s+\d+/);

      if (pageMatch) {
        const indent = pageMatch[1];
        const indentLength = indent.length;

        // Page должен иметь ровно 2 пробела отступа
        if (indentLength !== 2) {
          errors.push({
            label: `строка ${i + 1}`,
            type: 'Ошибка отступа Page',
            reason: `Неверный отступ для Page (ожидается: 2 пробела, найдено: ${indentLength})`,
            line: i,
            msg: `Неверный отступ для Page (ожидается: 2 пробела, найдено: ${indentLength})`,
            expectedIndent: '  ', // Ровно 2 пробела
            isFixableIndent: true
          });
        }
      }
    }
    return errors;
  };
  console.log("window.checkForLineLevelErrors расширена с защитой от NaN.");

  // Переопределяем отображение ошибок (лампочка)
  if (typeof window.updateMatchLamp === 'function' && !window.updateMatchLampOriginalForIndent) {
    window.updateMatchLampOriginalForIndent = window.updateMatchLamp;

    window.updateMatchLamp = function () {
      // Вызываем оригинальную функцию
      window.updateMatchLampOriginalForIndent.apply(this, arguments);

      const lines = window.originalLines || [];
      if (!lines || lines.length === 0) return;

      // Получаем ВСЕ ошибки
      const allErrors = window.checkForLineLevelErrors(lines);

      // >>> ФИЛЬТРУЕМ: Берем только настоящие ошибки отступов, у которых есть isFixableIndent <<<
      const indentErrors = allErrors.filter(e => e.isFixableIndent);

      if (indentErrors.length > 0) {
        // Подсвечиваем в редакторе (если есть textBlocks)
        if (window.textBlocks) {
          window.textBlocks.forEach((block, blIdx) => {
            if (block.idx !== undefined) {
              const hasErr = indentErrors.some(e => e.line === block.idx);
              if (hasErr) window.allErrorIndices.add(blIdx);
            }
          });
        }

        const lamp = document.getElementById('matchLamp');
        if (lamp) {
          lamp.style.background = '#f66';
          lamp.title += `\n + Обнаружено ${indentErrors.length} ошибок отступов.`;
        }

        const diffsDiv = document.getElementById('previewDiffs');
        if (diffsDiv) {
          let extraHtml = '<div style="margin-top:10px; border-top:1px solid #ccc; padding-top:5px;">';
          extraHtml += '<b>Ошибки отступов (авто-детект):</b><ul style="color:#d00; margin-top:4px;">';
          indentErrors.forEach(err => {
            // Теперь здесь не будет undefined, так как мы отфильтровали массив
            extraHtml += `<li><b>Строка ${err.line + 1}</b>: ${err.msg}</li>`;
          });
          extraHtml += '</ul></div>';
          diffsDiv.innerHTML += extraHtml;
        }

        const fixBtn = document.getElementById('fixIndentBtn');
        if (fixBtn) {
          fixBtn.style.setProperty('display', 'inline-block', 'important');
          fixBtn.textContent = `Исправить отступы (${indentErrors.length})`;

          // Убедимся что родительский контейнер тоже видим
          const parent = fixBtn.parentElement;
          if (parent && parent.style.display === 'none') {
            parent.style.display = '';
          }
        }
      } else {
        // Скрываем кнопку если ошибок нет
        const fixBtn = document.getElementById('fixIndentBtn');
        if (fixBtn) {
          fixBtn.style.setProperty('display', 'none', 'important');
        }
      }

      // Обновляем глобальную кнопку ChangeItems (если есть блоки с красным фоном и локальными кнопками)
      if (typeof window.updateGlobalChangeItemsBtn === 'function') {
        window.updateGlobalChangeItemsBtn();
      }
    };
    console.log("window.updateMatchLamp успешно расширена (с фильтрацией NaN).");
  }

  // Функция автоматического исправления
  window.autoFixIndentErrors = function () {
    const lines = window.originalLines || [];
    if (!lines || lines.length === 0) return;

    const allErrors = window.checkForLineLevelErrors(lines);
    const indentErrors = allErrors.filter(e => e.isFixableIndent);

    if (indentErrors.length === 0) {
      alert("Ошибок отступов не найдено.");
      return;
    }

    let fixedCount = 0;
    for (let i = indentErrors.length - 1; i >= 0; i--) {
      const err = indentErrors[i];
      if (lines[err.line] !== undefined) {
        lines[err.line] = lines[err.line].replace(/^\s*/, err.expectedIndent);
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      // === БАГ-ФИКС: Полная синхронизация состояния ===
      window.originalLines = lines;
      window.fullRusLines = lines.slice(); // Обновляем fullRusLines!

      // Пересоздаём textBlocks из обновлённых строк
      if (typeof window.extractTexts === 'function') window.extractTexts();

      // === КРИТИЧНО: Восстанавливаем связи RU-JP блоков ===
      if (window.fullJapLines && window.fullJapLines.length > 0) {
        if (typeof window.extractJapaneseTexts === 'function') {
          window.extractJapaneseTexts(window.fullJapLines);
        }
      }

      // Перерисовываем редактор
      if (typeof window.renderTextBlocks === 'function') window.renderTextBlocks();

      // Обновляем лампу и индексы ошибок
      if (typeof window.updateMatchLamp === 'function') window.updateMatchLamp();
      if (typeof window.updateRedIndices === 'function') window.updateRedIndices();

      alert(`Исправлено ошибок отступов: ${fixedCount}.`);
    }
  };

}, 1000);