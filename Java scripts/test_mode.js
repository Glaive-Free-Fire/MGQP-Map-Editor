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
            let scriptText = block.text.replace(/[∾∿]/g, '\\').replace(/\n/g, '\\n');
            let escapedScriptText = scriptText.replace(/(?<!\\)"/g, '\\"');
            formattedLine = originalLine.replace(/\[(.*)\]/, `["${escapedScriptText}"]`);
            break;
          case 'ScriptMore':
            let scriptMoreText = block.text.replace(/[∾∿]/g, '\\').replace(/\n/g, '\\n');
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
        previewLines.push((indent + formattedLine.trimStart()).trimEnd());
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
        previewLines.push(originalLine.trimEnd());
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
    // Фоллбек
    let cleanText = text;
    // Очистка от вложенных тегов (симуляция getVisibleTextMetrics, но для генерации мы оставляем теги, 
    // здесь нам нужно просто экранирование. 
    // ОСТОРОЖНО: formatShowTextContent нужен для ФИНАЛЬНОГО вывода в файл, 
    // поэтому он НЕ должен удалять теги, а только экранировать слэши.
    // НО! Логика выше (replace(/∾∾/g, '\\\\')) уже делает это.

    // Возвращаем старую логику экранирования, так как formatShowTextContent НЕ должен удалять теги
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

    // --- СИНХРОНИЗАЦИЯ СКРЫТЫХ SCRIPT БЛОКОВ ---
    // Если блок Script или ScriptMore не содержит ни японских, ни русских символов, 
    // это означает, что он был скрыт в редакторе (фильтр в renderTextBlocks).
    // Мы принудительно синхронизируем их текст с японским файлом перед сохранением.
    blocksToUse.forEach(block => {
      if ((block.type === 'Script' || block.type === 'ScriptMore') && !block.isDeleted) {
        const hasJapanese = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(block.text);
        const hasRussian = /[А-Яа-яЁё]/.test(block.text);

        if (!hasJapanese && !hasRussian && block.japaneseLink && block.japaneseLink.text) {
          block.text = block.japaneseLink.text;
        }
      }
    });

    let exportLines = []; // Итоговые строки
    let newLines = [...linesToUse];
    const blockMap = new Map();
    blocksToUse.forEach(block => {
      if (block.idx !== undefined) {
        blockMap.set(block.idx, block);
      }
    });

    // === ШАГ 2: ОБРАБОТКА 'Display Name' (Только для Карт!) ===
    // Проверка через имя файла и содержимое (для надежности при пакетной обработке)
    const fileNameLower = (window.loadedFileName || "").toLowerCase();
    const isMapFile = fileNameLower.includes('map') && !fileNameLower.includes('commonevent');
    const isCommonEventFile = fileNameLower.includes('commonevent') || linesToUse.some(l => /^CommonEvent \d+/.test(l));

    let lineOffset = 0;
    // Вставляем Display Name ТОЛЬКО если это карта и НЕТ признаков CommonEvent
    if (isMapFile && !isCommonEventFile) {
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
    window.lastExportLineToBlockIndex = new Map();
    const blockToIndexMap = new Map();
    blocksToUse.forEach((b, idx) => blockToIndexMap.set(b, idx));

    // Набор индексов строк, которые нужно пропустить (т.к. они были объединены в один блок)
    const skipIndices = new Set();
    blocksToUse.forEach(b => {
      if (b.linesToSkip) {
        if (Array.isArray(b.linesToSkip)) {
          b.linesToSkip.forEach(idx => skipIndices.add(idx));
        } else if (typeof b.linesToSkip === 'number' && b.linesToSkip > 0) {
          // Если это число, значит пропущено N строк СРАЗУ ПОСЛЕ текущей
          for (let k = 1; k <= b.linesToSkip; k++) {
            skipIndices.add(b.idx + k);
          }
        }
      }
    });

    for (let i = 0; i < newLines.length; i++) {
      const currentLineContent = newLines[i];
      const originalIdx = i - lineOffset;

      // Если эта строка была поглощена другим блоком - пропускаем её
      if (originalIdx >= 0 && skipIndices.has(originalIdx)) {
        continue;
      }

      const block = (originalIdx >= 0) ? blockMap.get(originalIdx) : undefined;

      if (originalIdx >= 0) {
        originalIdxToExportPos.set(originalIdx, exportLines.length);
      }

      if (block) {
        window.lastExportLineToBlockIndex.set(exportLines.length, blockToIndexMap.get(block));
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
            let attrText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
            const attrHasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (attrHasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${attrText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${attrText}]`); }
            break;
          case 'Script':
          case 'ScriptMore':
            let scriptText = block.text.replace(/[∾∿]/g, '\\').replace(/\n/g, '\\n');
            let escapedScriptText = scriptText.replace(/(?<!\\)"/g, '\\"');
            formattedLine = currentLineContent.replace(/\[(.*)\]/, `["${escapedScriptText}"]`);
            break;
          case 'Label':
          case 'JumpToLabel':
          case 'Name':
            let generalText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
            const hasQuotes = /\["(.*)"\]/.test(currentLineContent);
            if (hasQuotes) { formattedLine = currentLineContent.replace(/\["(.*)"\]/, `["${generalText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(.*)\]/, `[${generalText}]`); }
            break;
          case 'ShowChoices':
            let choicesText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
            const choices = choicesText.split(/\s*\|\s*/);
            const quotedChoices = choices.map(choice => `"${choice.trim()}"`).join(', ');
            formattedLine = currentLineContent.replace(/\[\[(.*?)\],\s*(\d+)\]/, `[[${quotedChoices}], $2]`);
            break;
          case 'When':
            let whenText = block.text.replace(/∾/g, '\\').replace(/\n/g, '\\n');
            const whenHasQuotes = /\[(\d+),\s*"(.*)"\]/.test(currentLineContent);
            if (whenHasQuotes) { formattedLine = currentLineContent.replace(/\[(\d+),\s*"(.*)"\]/, `[$1, "${whenText}"]`); }
            else { formattedLine = currentLineContent.replace(/\[(\d+),\s*(.*)\]/, `[$1, ${whenText}]`); }
            break;
          default:
            formattedLine = currentLineContent;
            break;
        }
        exportLines.push(formattedLine.trimEnd());
      } else {
        exportLines.push(currentLineContent.trimEnd());
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

          const posToInsert = lastMainBlockLine + 1;
          exportLines.splice(posToInsert, 0, lineToInsert.trimEnd());

          // Обновляем карту позиций: сдвигаем все существующие маппинги после точки вставки
          const newMap = new Map();
          for (const [pos, blIdx] of window.lastExportLineToBlockIndex.entries()) {
            if (pos >= posToInsert) {
              newMap.set(pos + 1, blIdx);
            } else {
              newMap.set(pos, blIdx);
            }
          }
          // Добавляем маппинг для самой вставленной строки
          newMap.set(posToInsert, myIndexInBlocks);
          window.lastExportLineToBlockIndex = newMap;


          // Обновляем карту позиций для всех последующих элементов (оригинальная логика)
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
        exportLines[i] = exportLines[i].trimEnd().replace(/^\s*(Page\s+\d+)/, '  $1');
      }
    }

    return exportLines;
  };

  // Обеспечиваем, чтобы алиас тоже указывал на новую функцию
  window.generateCurrentFileContentAsLines = window.generateFinalFileLines;

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


    // === ЛОГИКА "ВЗГЛЯДА В БУДУЩЕЕ" (Forward Search) ===
    // Если поиск назад ничего не дал, но в тексте есть плейсхолдер предмета
    // ИЛИ если после этого блока идет ShowChoices (верный признак вопроса о предмете)
    let triggerForwardSearch = false;
    if (!itemId) {
      if (/\\[iI][iIwaW]\[|Дать|Отдать/.test(block.text)) {
        triggerForwardSearch = true;
      } else {
        // Проверяем, есть ли впереди ShowChoices (в пределах пары блоков)
        // НО! Чтобы не мусорить кнопками на каждой строке диалога перед выбором,
        // требуем наличие кавычек в текущей строке (обычно имя предмета в кавычках).
        if (/([「«]).+?\1/.test(block.text)) {
          for (let k = 1; k <= 5; k++) {
            const nextB = window.textBlocks[index + k];
            if (!nextB) break;
            if (nextB.type === 'ShowChoices') {
              triggerForwardSearch = true;
              break;
            }
          }
        }
      }
    }

    if (triggerForwardSearch) {
      const forwardDepth = 30; // Ищем достаточно далеко вперед
      for (let i = block.idx + 1; i < Math.min(lines.length, block.idx + forwardDepth); i++) {
        const line = lines[i].trim();

        // Прерываем поиск, если начался совсем другой диалог (ShowText не внутри выбора)
        // Но! Нужно пропускать ShowChoices, When, и ShowText внутри них.
        // Пока сделаем проще: ищем ПЕРВЫЙ ChangeItems.
        // Если встретили ExitEventProcessing или конец файла - стоп.
        if (/^ExitEventProcessing/.test(line)) break;

        // Парсинг ChangeItems (тот же код)
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
          break; // Нашли!
        } else if (matchSimple) {
          const command = matchSimple[1];
          itemId = matchSimple[2];
          itemAmount = '1';
          if (command === 'ChangeWeapons') itemType = 'iw';
          else if (command === 'ChangeArmor') itemType = 'ia';
          else itemType = 'ii';
          break; // Нашли!
        }
      }
    }

    if (!itemId) return;

    // Решаем, показывать ли кнопку
    // Теперь показываем ТОЛЬКО если текст совпадает с паттерном получения предмета.
    // Это исключает ложные срабатывания на обычном диалоге, который просто идет после команды.
    if (currentIsPattern || triggerForwardSearch) {
      let btn = block.dom.changeItemsBtn;
      const isNew = !btn || !btn.isConnected;

      if (isNew) {
        btn = document.createElement('button');
        btn.className = 'control-btn';
        btn.style.fontSize = '11px';
        btn.style.marginLeft = '10px';
        btn.style.padding = '2px 6px';
        btn.style.cursor = 'pointer';
        block.dom.changeItemsBtn = btn;
      }

      // Те же данные теперь в самом блоке
      block.associatedItemId = itemId;
      block.associatedItemType = itemType;

      // Настраиваем текст и стиль в зависимости от типа
      let typeLabel = 'Item';
      let btnBg = '#e6ccff'; // Фиолетовый для предметов
      if (itemType === 'iw') { typeLabel = 'Weapon'; btnBg = '#ffe0cc'; }
      else if (itemType === 'ia') { typeLabel = 'Armor'; btnBg = '#ccf2ff'; }

      btn.textContent = `${typeLabel}[${itemId}] x${itemAmount}`;
      btn.style.background = btnBg;
      btn.title = `Заменить на шаблон получения (${typeLabel}) ID ${itemId}`;

      // --- ПРОВЕРКА НА НЕСООТВЕТСТВИЕ ID ---
      const itemTagRegex = /(?:\\|∾+)i([iaw]?)\[(\d+)\]/i;
      const tMatch = block.text.match(itemTagRegex);
      let hasMismatch = false;

      if (tMatch) {
        const textTypeLetter = (tMatch[1] || '').toLowerCase();
        let textType = 'ii';
        if (textTypeLetter === 'w') textType = 'iw';
        else if (textTypeLetter === 'a') textType = 'ia';

        const textId = tMatch[2];
        if (textId !== itemId || textType !== itemType) {
          hasMismatch = true;
          btn.style.border = '2px solid #f00';
          btn.style.boxShadow = '0 0 5px #f00';
          btn.title = `ВНИМАНИЕ: ID в тексте (${textType}[${textId}]) не совпадает с командой (${itemType}[${itemId}])!`;
          // Подсвечиваем блок
          if (window.allErrorIndices) {
            window.allErrorIndices.add(index);
          }
        }
      }

      if (!hasMismatch) {
        btn.style.border = '';
        btn.style.boxShadow = '';
      }

      if (isNew) {
        btn.onclick = function () {
          const currentText = block.dom.rusInput.value;
          const currentMatch = currentText.match(itemTagRegex);
          let newText;

          if (currentMatch) {
            // Заменяем только ID и тип, сохраняя префиксы
            const typeLetter = itemType === 'iw' ? 'w' : (itemType === 'ia' ? 'a' : '');
            newText = currentText.replace(itemTagRegex, (match) => {
              const prefix = match.startsWith('∾') ? (match.startsWith('∾∾') ? '∾∾' : '∾') : '\\';
              return `${prefix}i${typeLetter}[${itemId}]`;
            });
          } else {
            // Полная замена только если тег не найден
            newText = `∾∾${itemType}[${itemId}] × ${itemAmount} получено!`;
          }

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
          }
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

  function extractNameFromBlock(text) {
    const tagMatch = text.match(/<∾∾C\[6\](.*?)∾∾C\[0\]>/);
    if (tagMatch) return tagMatch[1];
    const bracketMatch = text.match(/^【(.+?)】/);
    if (bracketMatch) return bracketMatch[1];
    return null;
  }

  window.textBlocks.forEach((block, index) => {
    if (block.type !== 'ShowText' || !block.dom || !block.dom.rusInput) return;

    const text = block.text;
    // Паттерн: 【Имя】\nТекст
    const nameMatch = text.match(/^【(.+?)】\s*\n?([\s\S]*)$/);
    // Проверка, исправлена ли уже строка
    const isAlreadyFixed = /^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(text);

    let suggestedName = null;
    let isMissingTag = false;

    if (nameMatch || isAlreadyFixed) {
      totalFixable++;
      if (isAlreadyFixed) {
        fixedCount++;
      }
    } else {
      // ПРОВЕРКА НА ОТСУТСТВУЮЩИЙ ТЕГ (Ошибка компоновки v25)
      // Ищем ближайший STA перед нами (аналог логики из main_script.js / restore-mode.js)
      let k = index - 1;
      while (k >= 0) {
        const prev = window.textBlocks[k];
        if (prev.isDeleted) { k--; continue; }
        if (prev.type === 'ShowTextAttributes') {
          if (prev.manualPlus || prev.generated) {
            // Это STA #+, ищем якорь и родителя
            let anchorIdx = -1;
            let m = k - 1;
            while (m >= 0) {
              const p2 = window.textBlocks[m];
              if (p2.isDeleted) { m--; continue; }
              if (p2.type === 'ShowTextAttributes' && !p2.manualPlus && !p2.generated) {
                anchorIdx = m;
                break;
              }
              if (p2.type === 'ShowText') { m--; continue; }
              break;
            }

            if (anchorIdx !== -1) {
              let parent = null;
              let n = anchorIdx + 1;
              while (n < k) {
                const p3 = window.textBlocks[n];
                if (p3.isDeleted) { n++; continue; }
                if (p3.type === 'ShowText' && !p3.manualPlus && !p3.generated) {
                  parent = p3;
                  break;
                }
                if (p3.type === 'ShowTextAttributes' && p3.manualPlus) { n++; continue; }
                break;
              }

              if (parent) {
                suggestedName = extractNameFromBlock(parent.text);
                if (suggestedName) {
                  isMissingTag = true;
                  totalFixable++;
                }
              }
            }
          }
          break; // Нашли STA (любой), поиск закончен
        }
        if (prev.type === 'ShowText') break; // Встретили текст раньше STA
        k--;
      }
    }

    if (!nameMatch && !isAlreadyFixed && !isMissingTag) {
      if (block.dom.fixNameBtn) {
        block.dom.fixNameBtn.remove();
        block.dom.fixNameBtn = null;
      }
      return;
    }

    // Сохраняем информацию для исправления
    block.isMissingTag = isMissingTag;
    block.suggestedName = suggestedName;

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
    btn.title = isMissingTag ? `Добавить тег имени: ${suggestedName}` : 'Оформить тег имени (∾\\n<∾∾C[6]...>)';

    btn.onclick = function () {
      if (/^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(block.text)) return;

      let newText = null;
      const match = block.text.match(/^【(.+?)】\s*\n?([\s\S]*)$/);
      if (match) {
        const name = match[1];
        const rest = match[2];
        newText = `∾\n<∾∾C[6]${name}∾∾C[0]>${rest}`;
      } else if (block.isMissingTag && block.suggestedName) {
        newText = `∾\n<∾∾C[6]${block.suggestedName}∾∾C[0]>${block.text}`;
      }

      if (newText) {
        block.dom.rusInput.value = newText;
        block.text = newText;
        block.dom.rusInput.dispatchEvent(new Event('input', { bubbles: true }));
        btn.style.background = '#8f8';
        // Пересчёт состояния
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
          if (block.dom && block.dom.fixNameBtn) {
            const isAlreadyFixed = /^∾\n<∾∾C\[6\].*?∾∾C\[0\]>/.test(block.text);
            if (!isAlreadyFixed) {
              block.dom.fixNameBtn.click();
              count++;
            }
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
  window.checkForLineLevelErrors = function (lines, optionalJpLines) {
    let errors = [];

    // 1. Вызываем базовые проверки (Японский текст, длина строк и т.д.)
    // Включаем проверку двойных слэшей из main_script.js
    if (typeof originalCheckForLineLevelErrors === 'function') {
      const originalErrors = originalCheckForLineLevelErrors(lines, optionalJpLines);
      errors = originalErrors.slice(); // Копируем все ошибки, включая двойные слэши
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

    // 4. Логическая проверка и Синхронизация (Sync/Nesting Check)
    // Определяем контекст японских строк: аргумент имеет приоритет над глобальной переменной
    const validJpLines = optionalJpLines || (window.fullJapLines && window.fullJapLines.length > 0 ? window.fullJapLines : null);

    if (validJpLines && validJpLines.length > 0) {
      // === ВАРИАНТ А: СИНХРОНИЗАЦИЯ С ЯПОНСКИМ ФАЙЛОМ ===
      const jLines = validJpLines;
      let j = 0;

      // Хелпер для получения сигнатуры строки
      function getSig(line) {
        const t = line.trim();
        if (!t) return 'BLK';
        if (/^CommonEvent/.test(t)) return 'CE ' + (t.match(/\d+/) || [])[0];
        if (/^Page/.test(t)) return 'PG ' + (t.match(/\d+/) || [])[0];
        if (/^ShowTextAttributes/.test(t)) return 'ATTR';
        if (/^ShowText/.test(t)) return 'TXT';
        if (/^Empty/.test(t)) return 'EMPTY';
        if (/^Comment/.test(t)) return 'CMT';
        // Для остальных команд берем первое слово
        const m = t.match(/^([a-zA-Z]+)/);
        return m ? m[1] : 'UNK';
      }

      for (let i = 0; i < lines.length; i++) {
        const rLine = lines[i];
        const rSig = getSig(rLine);
        if (rSig === 'BLK') continue;

        // Ищем следующую непустую строку в JP
        let tempJ = j;
        while (tempJ < jLines.length && getSig(jLines[tempJ]) === 'BLK') tempJ++;

        // Если JP кончился, прекращаем проверки
        if (tempJ >= jLines.length) break;

        const jLine = jLines[tempJ];
        const jSig = getSig(jLine);

        // 1. Полное совпадение сигнатуры
        if (rSig === jSig) {
          const rLineTrim = rLine.trim();
          const jLineTrim = jLine.trim();

          // Дополнительная проверка отступов для совпавших команд
          const rIndent = (rLine.match(/^\s*/) || [""])[0];
          const jIndent = (jLine.match(/^\s*/) || [""])[0];

          if (rIndent !== jIndent) {
            errors.push({
              label: `строка ${i + 1}`,
              type: 'Ошибка отступа',
              reason: `Отступ не совпадает с японским оригиналом.`,
              line: i,
              msg: `Отступ не совпадает с JP (RU: ${rIndent.length}, JP: ${jIndent.length}).`,
              expectedIndent: jIndent,
              isFixableIndent: true
            });
          }

          // --- НОВОЕ: Проверка структуры Script/ScriptMore внутри синхронизации ---
          if (rSig === 'Script' || rSig === 'ScriptMore') {
            const rMatch = rLineTrim.match(/\["(.*)"\]/);
            const jMatch = jLineTrim.match(/\["(.*)"\]/);

            if (rMatch && jMatch) {
              const ruContent = rMatch[1];
              const jpContent = jMatch[1];

              // Если контент идентичен (техническая команда), пропускаем
              if (ruContent !== jpContent) {
                const getScriptFingerprint = (s) => {
                  // 1. Нормализуем спецсимволы и экранированные кавычки
                  let normalized = s
                    .replace(/[“”]/g, '"')
                    .replace(/[‘’]/g, "'")
                    .replace(/[（]/g, '(')
                    .replace(/[）]/g, ')')
                    .replace(/[［]/g, '[')
                    .replace(/[］]/g, ']')
                    .replace(/\\/g, '∾')
                    .replace(/∾"/g, '"') // Для поиска строк считаем ∾" как просто "
                    .replace(/∾'/g, "'");

                  // 2. Маскируем содержимое строк, чтобы не сверять пунктуацию в переводе
                  normalized = normalized
                    .replace(/"[^"]*"/g, '"X"')
                    .replace(/'[^']*'/g, "'X'");

                  // 3. Оставляем только каркас кода
                  return normalized.replace(/[^\[\]\(\)\{\}"'∾,:;=!]/g, '');
                };

                const ruSigFinger = getScriptFingerprint(ruContent);
                const jpSigFinger = getScriptFingerprint(jpContent);

                if (ruSigFinger !== jpSigFinger) {
                  errors.push({
                    label: `строка ${i + 1}`,
                    type: 'Ошибка скрипта',
                    reason: `Структура не совпадает с JP. Ожидалось: ${jpSigFinger}, найдено: ${ruSigFinger}`,
                    line: i,
                    msg: 'Структура скрипта (скобки/кавычки) отличается от оригинала.'
                  });
                }
              }
            }
          }

          j = tempJ + 1; // Продвигаем JP курсор
          continue;
        }

        // 2. Рассинхрон из-за текста (RU текст, которого нет в JP или наоборот)
        // EMPTY не считается "текстом", это структурный элемент, который должен совпадать или пропускаться строгой логикой
        const isFluidR = ['TXT', 'ATTR', 'CMT'].includes(rSig);
        const isFluidJ = ['TXT', 'ATTR', 'CMT'].includes(jSig);

        if (isFluidR && !isFluidJ) {
          // Лишняя строка в RU (расширенный перевод). Пропускаем проверку для i.
          // Не продвигаем j.
          continue;
        }

        if (isFluidJ && !isFluidR) {
          // Лишняя строка в JP. Продвигаем j, пробуем снова для текущего i.
          j = tempJ + 1;
          i--;
          continue;
        }

        // 3. Структурный рассинхрон (разные команды)
        // В этом случае мы не можем гарантировать корректность проверки, 
        // поэтому просто пропускаем проверку для текущей строки и надеемся на ресинк на следующем Page/CommonEvent
        // Можно попытаться найти CE/Page в JP
        if (rSig.startsWith('CE') || rSig.startsWith('PG')) {
          // Попытка найти эту секцию в JP
          let scanJ = tempJ;
          while (scanJ < jLines.length) {
            if (getSig(jLines[scanJ]) === rSig) {
              j = scanJ; // Нашли!
              i--; // Повторяем проверку с синхронизированным j
              break;
            }
            scanJ++;
          }
          // Если не нашли - просто идем дальше
        }
      }

    } else {
      // === ВАРИАНТ Б: ГРАММАТИЧЕСКАЯ ПРОВЕРКА (FALLBACK) ===
      let expectedLevel = 0;
      let inPage = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const indentMatch = line.match(/^\s*/);
        const currentIndent = indentMatch ? indentMatch[0].length : 0;
        const trimmed = line.trim();

        if (/^CommonEvent\s+\d+/.test(trimmed) || /^Name\s*=/.test(trimmed)) {
          expectedLevel = 0; inPage = false; continue;
        }
        if (/^Page\s+\d+/.test(trimmed)) {
          inPage = true; expectedLevel = 4; continue;
        }
        if (!inPage) continue;

        let targetIndent = expectedLevel;

        // Блоки, уменьшающие отступ (закрывающие) ИЛИ "When/Else" (которые выравниваются по родителю)
        const isCloser = /^BranchEnd/.test(trimmed) || /^RepeatAbove/.test(trimmed) || /^LoopEnd/.test(trimmed);
        const isMidBlock = /^Else/.test(trimmed) || /^When/.test(trimmed); // Добавили When

        if (isCloser || isMidBlock) {
          targetIndent = Math.max(4, expectedLevel - 2);
        }

        const alreadyHasError = errors.some(e => e.line === i);
        if (!alreadyHasError && currentIndent !== targetIndent) {
          errors.push({
            label: `строка ${i + 1}`,
            type: 'Ошибка вложенности',
            reason: `Ожидался отступ ${targetIndent}, найдено ${currentIndent}`,
            line: i,
            msg: `Неверная вложенность (ожидался отступ ${targetIndent}, найдено ${currentIndent})`,
            expectedIndent: ' '.repeat(targetIndent),
            isFixableIndent: true
          });
        }

        // Обновление уровня для следующих строк
        if (isCloser) {
          expectedLevel = Math.max(4, expectedLevel - 2);
        } else if (/^ConditionalBranch/.test(trimmed) || /^Loop/.test(trimmed) || /^ShowChoices/.test(trimmed)) {
          expectedLevel += 2;
        }
      }
    }

    // Обновляем глобальную кнопку ChangeItems (если есть блоки с красным фоном и локальными кнопками)
    if (typeof window.updateGlobalChangeItemsBtn === 'function') {
      window.updateGlobalChangeItemsBtn();
    }

    // --- НОВАЯ ПРОВЕРКА: Шаблоны привязанности ---
    const affectionTemplateRegex = /(<[\\∾]{2}C\[6\].*?)([\\∾]{2}C\[0\]>)\s*\((Уровень симпатии:|Привязанность:)\s*([\\∾]+)(V\[\d+\])\)([\s\S]*)$/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('ShowText([')) continue;

      const startIdx = line.indexOf('["');
      const endIdx = line.lastIndexOf('"]');
      if (startIdx === -1 || endIdx === -1) continue;
      const text = line.substring(startIdx + 2, endIdx);

      const affMatch = text.match(affectionTemplateRegex);
      if (affMatch) {
        let isBroken = (affMatch[3] === 'Уровень симпатии:' || affMatch[4].length !== 2); // Проверяем на 2 символа (\\ или ∾∾)
        const dialoguePart = affMatch[6];
        if (!isBroken && dialoguePart.trim() === '') {
          let nextIdx = i + 1;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
          if (nextIdx < lines.length) {
            const nextLine = lines[nextIdx];
            if (nextLine.includes('ShowText([')) {
              const nStart = nextLine.indexOf('["');
              const nEnd = nextLine.lastIndexOf('"]');
              if (nStart !== -1 && nEnd !== -1) {
                const nextText = nextLine.substring(nStart + 2, nEnd);
                const isNameBlock = /<[\\∾]{2}C\[6\].*?[\\∾]{2}C\[0\]>/.test(nextText);
                const isMarked = nextLine.includes('#+');
                if (!isNameBlock && !isMarked) isBroken = true;
              }
            }
          }
        }
        if (isBroken) {
          errors.push({
            label: `строка ${i + 1}`,
            type: 'Ошибка шаблона',
            reason: 'Требуется исправить шаблон привязанности и объединить строки.',
            line: i,
            msg: 'Ошибка шаблона привязанности.'
          });
        }
      }
    }

    // --- ПРОВЕРКА: Двойные слэши в Script/ScriptMore (уже обработано в main_script.js) ---
    // Эта проверка уже выполняется в оригинальной функции checkForLineLevelErrors из main_script.js
    // с логикой сравнения с японским оригиналом, поэтому здесь мы её не дублируем

    // --- ПРОВЕРКА: Лишние пробелы в конце строк ---
    for (let i = 0; i < lines.length; i++) {
      if (/[ \t]+$/.test(lines[i])) {
        errors.push({
          label: `строка ${i + 1}`,
          type: 'Ошибка форматирования',
          reason: 'Обнаружены лишние пробелы в конце строки.',
          line: i,
          msg: 'Лишние пробелы в конце строки.',
          isFixableIndent: true
        });
      }
    }

    // --- НОВАЯ ПРОВЕРКА: Несоответствие ID предмета ---
    const itemMismatchTagRegex = /(?:\\|∾+)i([iaw]?)\[(\d+)\]/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('ShowText([')) continue;

      const startIdx = line.indexOf('["');
      const endIdx = line.lastIndexOf('"]');
      if (startIdx === -1 || endIdx === -1) continue;
      const text = line.substring(startIdx + 2, endIdx);

      const tMatch = text.match(itemMismatchTagRegex);
      if (tMatch) {
        const textTypeLetter = (tMatch[1] || '').toLowerCase();
        let textType = 'ii';
        if (textTypeLetter === 'w') textType = 'iw';
        else if (textTypeLetter === 'a') textType = 'ia';
        const textId = tMatch[2];

        let itemId = null;
        let itemType = 'ii';

        // Поиск НАЗАД
        for (let k = i - 1; k >= Math.max(0, i - 15); k--) {
          const l = lines[k].trim();
          if (/^(Label|JumpToLabel|Script|ExitEventProcessing)/.test(l)) break;
          const mF = l.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),\s*\d+,\s*(\d+),\s*(\d+).*?\]\)/);
          const mS = l.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),/);
          if (mF) {
            itemId = mF[2];
            if (mF[1] === 'ChangeWeapons') itemType = 'iw';
            else if (mF[1] === 'ChangeArmor') itemType = 'ia';
            break;
          } else if (mS) {
            itemId = mS[2];
            if (mS[1] === 'ChangeWeapons') itemType = 'iw';
            else if (mS[1] === 'ChangeArmor') itemType = 'ia';
            break;
          }
        }

        // Поиск ВПЕРЕД
        if (!itemId) {
          for (let k = i + 1; k < Math.min(lines.length, i + 30); k++) {
            const l = lines[k].trim();
            if (/^ExitEventProcessing/.test(l)) break;
            const mF = l.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),\s*\d+,\s*(\d+),\s*(\d+).*?\]\)/);
            const mS = l.match(/(ChangeItems|ChangeWeapons|ChangeArmor)\(\[\s*(\d+),/);
            if (mF) {
              itemId = mF[2];
              if (mF[1] === 'ChangeWeapons') itemType = 'iw';
              else if (mF[1] === 'ChangeArmor') itemType = 'ia';
              break;
            } else if (mS) {
              itemId = mS[2];
              if (mS[1] === 'ChangeWeapons') itemType = 'iw';
              else if (mS[1] === 'ChangeArmor') itemType = 'ia';
              break;
            }
          }
        }

        if (itemId && (textId !== itemId || textType !== itemType)) {
          errors.push({
            label: `строка ${i + 1}`,
            type: 'Ошибка ID предмета',
            reason: `ID в тексте (${textType}[${textId}]) не совпадает с командой (${itemType}[${itemId}])!`,
            line: i,
            msg: `ID в тексте (${textType}[${textId}]) не совпадает с командой (${itemType}[${itemId}])!`,
            isItemIdMismatchLine: true
          });
        }
      }
    }

    return errors;
  };

  console.log("window.checkForLineLevelErrors расширена с JP Sync.");
  console.log("window.checkForLineLevelErrors расширена с защитой от NaN.");

  // Переопределяем отображение ошибок (лампочка)
  if (typeof window.updateMatchLamp === 'function' && !window.updateMatchLampOriginalForIndent) {
    window.updateMatchLampOriginalForIndent = window.updateMatchLamp;

    window.updateMatchLamp = function () {
      // 1. Вызываем оригинальную функцию (проверка структуры CommonEvent/Map)
      window.updateMatchLampOriginalForIndent.apply(this, arguments);

      // 2. Генерируем АКТУАЛЬНЫЙ текст файла из редактора
      // Это ключевой момент: мы проверяем не то, что было при загрузке, а то, что вы исправили
      let currentLines = [];
      if (typeof window.generateCurrentFileContentAsLines === 'function') {
        currentLines = window.generateCurrentFileContentAsLines();
      } else {
        currentLines = window.originalLines || [];
      }

      if (!currentLines || currentLines.length === 0) return;

      // 3. Проверяем этот актуальный текст на ошибки
      // Передаем также японские линии для сверки отступов и скриптов (если есть)
      const jpLines = (window.fullJapLines && window.fullJapLines.length > 0) ? window.fullJapLines : null;
      const allErrors = window.checkForLineLevelErrors(currentLines, jpLines);

      // 4. Обновляем список красных строк (allErrorIndices)
      let scriptErrorsCount = 0;
      let indentErrorsCount = 0;
      let itemMismatchCount = 0;

      // Фильтруем ошибки, которые нам интересны
      allErrors.forEach(err => {
        const fileLineIdx = err.line;

        // --- ИСПРАВЛЕНИЕ ФАНТОМНЫХ ОШИБОК ---
        const blockIndex = window.lastExportLineToBlockIndex ? window.lastExportLineToBlockIndex.get(fileLineIdx) : undefined;

        // Если блок не найден или удален, ошибку игнорируем
        if (blockIndex === undefined || (window.textBlocks && window.textBlocks[blockIndex] && window.textBlocks[blockIndex].isDeleted)) return;

        // Обработка ошибок скрипта (Двойные слэши)
        if (err.type === 'Ошибка скрипта') {
          window.allErrorIndices.add(blockIndex);
          scriptErrorsCount++;
        }

        // Обработка ошибок отступов
        if (err.isFixableIndent) {
          window.allErrorIndices.add(blockIndex);
          indentErrorsCount++;
        }

        // Обработка ошибок ID предметов
        if (err.isItemIdMismatchLine) {
          window.allErrorIndices.add(blockIndex);
          itemMismatchCount++;
        }
      });

      // 5. Обновляем интерфейс (Лампочка, Кнопки, Список ошибок)
      const lamp = document.getElementById('matchLamp');

      if (scriptErrorsCount > 0 || indentErrorsCount > 0 || itemMismatchCount > 0) {
        if (lamp) {
          lamp.style.background = '#f66';
          let titleMsg = '';
          if (scriptErrorsCount > 0) titleMsg += `\n + Ошибок скрипта: ${scriptErrorsCount}`;
          if (indentErrorsCount > 0) titleMsg += `\n + Ошибок отступов: ${indentErrorsCount}`;
          if (itemMismatchCount > 0) titleMsg += `\n + Ошибок ID предметов: ${itemMismatchCount}`;

          if (!lamp.title.includes('Ошибок скрипта') && !lamp.title.includes('Ошибок отступов') && !lamp.title.includes('Ошибок ID предметов')) {
            lamp.title += titleMsg;
          }
        }
      }

      // Обновляем список ошибок под предпросмотром (previewDiffs)
      // Чтобы сообщение об ошибке исчезало сразу после исправления
      const diffsDiv = document.getElementById('previewDiffs');
      if (diffsDiv) {
        // Удаляем старые списки авто-детекта, чтобы не дублировать
        const oldLists = diffsDiv.querySelectorAll('.auto-detect-errors');
        oldLists.forEach(el => el.remove());

        if (allErrors.length > 0) {
          let extraHtml = '<div class="auto-detect-errors" style="margin-top:10px; border-top:1px solid #ccc; padding-top:5px;">';
          extraHtml += '<b>Обнаруженные ошибки (Live):</b><ul style="color:#d00; margin-top:4px;">';
          allErrors.forEach(err => {
            // Показываем только скрипты, отступы и ID предметов в этом списке
            if (err.type === 'Ошибка скрипта' || err.isFixableIndent || err.isItemIdMismatchLine) {
              extraHtml += `<li><b>Строка ${err.line + 1}</b>: ${err.msg}</li>`;
            }
          });
          extraHtml += '</ul></div>';

          // Если мы нашли ошибки, добавляем их в div
          if (indentErrorsCount > 0 || scriptErrorsCount > 0 || itemMismatchCount > 0) {
            diffsDiv.insertAdjacentHTML('beforeend', extraHtml);
          }
        }
      }

      // Управление кнопкой "Исправить отступы"
      const fixIndentBtn = document.getElementById('fixIndentBtn');
      if (fixIndentBtn) {
        if (indentErrorsCount > 0) {
          fixIndentBtn.style.setProperty('display', 'inline-block', 'important');
          fixIndentBtn.textContent = `Исправить отступы (${indentErrorsCount})`;
          if (fixIndentBtn.parentElement) fixIndentBtn.parentElement.style.display = '';
        } else {
          fixIndentBtn.style.setProperty('display', 'none', 'important');
        }
      }

      // Обновляем глобальную кнопку ChangeItems
      if (typeof window.updateGlobalChangeItemsBtn === 'function') {
        window.updateGlobalChangeItemsBtn();
      }

      // Принудительно обновляем цвета полей ввода, чтобы убрать красный цвет сразу
      if (typeof window.updateRedIndices === 'function') {
        window.updateRedIndices();
      }

      // --- НОВОЕ: Обновляем статус кнопок ChangeItems в реальном времени ---
      if (typeof window.addChangeItemsButtons === 'function') {
        window.addChangeItemsButtons();
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
        // Убираем пробелы в конце
        let line = lines[err.line].trimEnd();

        // Определяем, какой отступ использовать
        // Если в ошибке указан целевой отступ (expectedIndent) - используем его.
        // Если нет (это была просто ошибка лишних пробелов) - сохраняем текущий отступ.
        let targetIndent = err.expectedIndent;
        if (targetIndent === undefined) {
          const currentIndentMatch = lines[err.line].match(/^\s*/);
          targetIndent = currentIndentMatch ? currentIndentMatch[0] : '';
        }

        lines[err.line] = line.replace(/^\s*/, targetIndent);
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