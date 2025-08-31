document.addEventListener('DOMContentLoaded', function() {
  // --- Функция генерации preview ---
  window.updatePreviewArea = function() {
    let previewLines;

    if (window.restoreModeEnabled) {
      previewLines = window.fullRusLines.slice();
    } else if (!originalLines || originalLines.length === 0) {
      previewLines = ["Предпросмотр недоступен в этом режиме."];
    } else {
      // === НОВЫЙ ЕДИНЫЙ АЛГОРИТМ СБОРКИ ПРЕДПРОСМОТРА ===
      previewLines = [];
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
          
          // >>> НАЧАЛО ИЗМЕНЕНИЯ: Заполняем карту позиций <<<
          originalIdxToPosMap.set(block.idx, previewLines.length - 1);
          // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<
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
          // >>> НАЧАЛО ИЗМЕНЕНИЯ: Определяем отступ родителя <<<
          let parentIndent = '    '; // Отступ по умолчанию

          for (let j = textBlocks.indexOf(block) - 1; j >= 0; j--) {
            if (textBlocks[j].idx !== undefined) {
              if (originalIdxToPosMap.has(textBlocks[j].idx)) {
                lastMainBlockLine = originalIdxToPosMap.get(textBlocks[j].idx);
              }
              // Находим оригинальную строку родителя, чтобы получить её отступ
              const parentOriginalLine = newLines[textBlocks[j].idx];
              if (parentOriginalLine) {
                  const indentMatch = parentOriginalLine.match(/^\s*/);
                  parentIndent = indentMatch ? indentMatch[0] : '    ';
              }
              break;
            }
          }
          // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<

          if (lastMainBlockLine !== -1) {
            // >>> НАЧАЛО ИЗМЕНЕНИЯ: Добавляем проверку типа блока <<<
            let lineToInsert = '';
          if (block.type === 'ShowTextAttributes') {
                lineToInsert = `${parentIndent}ShowTextAttributes([${block.text}]) #+`;
            } else { // По умолчанию считаем, что это ShowText
                lineToInsert = `${parentIndent}ShowText(["${block.text}"]) #+`;
            }
            // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<

            previewLines.splice(lastMainBlockLine + 1, 0, lineToInsert);
            
            // >>> НАЧАЛО ИЗМЕНЕНИЯ: Сдвигаем позиции в карте <<<
            for (const [key, value] of originalIdxToPosMap.entries()) {
              if (value > lastMainBlockLine) {
                originalIdxToPosMap.set(key, value + 1);
              }
            }
            // >>> КОНЕЦ ИЗМЕНЕНИЯ <<<
          }
        }
      });
    }
    document.getElementById('previewArea').value = previewLines.join('\n');
    // Обновляем ошибки через объединенную функцию
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
    if (window.updateMatchLamp) {
        window.updateMatchLamp();
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
  function parseMapFile(content) {
    const events = {};
    let currentEvent = null, currentPage = null;
    const lines = content.split(/\r?\n/);
    let pageIdx = null;
    let currentBranchEnd = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]; // Используем полную строку для сохранения отступов
      let trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('CommonEvent')) {
        const match = trimmedLine.match(/^CommonEvent (\d+)/);
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

      if (trimmedLine.startsWith('Name = ')) {
        if (currentEvent) events[currentEvent].name = trimmedLine.replace('Name = ', '').replace(/^"|"$/g, '');
        continue;
      }

      if (trimmedLine.startsWith('Page ')) {
        const match = trimmedLine.match(/^Page (\d+)/);
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
        let commandMatch = trimmedLine.match(/^(\w+)/);
        if (!commandMatch) continue;
        const command = commandMatch[1];
        
        // --- УМНОЕ ОБЪЕДИНЕНИЕ ДИАЛОГОВ ---
        if (command === 'ShowText' && trimmedLine.includes('【') && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextLineTrimmed = nextLine.trim();
            if (nextLineTrimmed.startsWith('ShowText')) {
                // Это блок имя + текст. Объединяем их.
                events[currentEvent].pages[pageIdx].push({ 
                  command, 
                  raw: line, 
                  lineNum: i, 
                  branchEndNumber: currentBranchEnd 
                });
                i++; // Пропускаем следующую строку, так как мы ее "включили" в эту
                continue;
            }
        }
        
        // --- Обработка BranchEnd и Empty ---
        if (command === 'Empty') {
          // Empty([]) завершает текущий BranchEnd, следующий BranchEnd будет с номером +1
          currentBranchEnd++;
        } else if (command === 'BranchEnd') {
          // BranchEnd([]) получает текущий номер
          events[currentEvent].pages[pageIdx].push({ 
            command, 
            raw: line, 
            lineNum: i, 
            branchEndNumber: currentBranchEnd 
          });
          continue;
        } else {
          // Обычные команды получают текущий номер BranchEnd
          events[currentEvent].pages[pageIdx].push({ 
            command, 
            raw: line, 
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
        // Для каждой страницы отсутствующего события считаем ошибку
        grouped.push({
          eid,
          name: jpEv.name,
          pages: jpEv.pages.map((_, p) => ({
            page: p,
            ok: false,
            errors: [{
              line: 1,
              msg: `Нет CommonEvent ${eid} (${jpEv.name}) в русском файле`,
              jp: `CommonEvent ${eid}`,
              ru: '',
              branchEndNumber: 0
            }]
          }))
        });
        continue;
      }
      
      // --- НОВАЯ ПРОВЕРКА: Сравнение заголовков CommonEvent ---
      let headerErrors = [];
      
      // Проверяем только наличие строки Name в заголовке (не сравниваем содержимое)
      if (jpEv.name && !ruEv.name) {
        headerErrors.push({
          line: 1,
          msg: `Отсутствует строка Name в заголовке CommonEvent ${eid}`,
          jp: `Name = "${jpEv.name}"`,
          ru: 'отсутствует',
          branchEndNumber: 0
        });
      }
      // Убираем проверку несовпадения имен - это нормальный перевод
      
      let eventGroup = { eid, name: jpEv.name, pages: [] };
      for (let p = 0; p < jpEv.pages.length; p++) {
        const jpPage = jpEv.pages[p] || [];
        const ruPage = (ruEv.pages[p] || []);
        let jpLen = jpPage.length;
        let ruLen = ruPage.length;
        let issues = [...headerErrors]; // Добавляем ошибки заголовка к ошибкам страницы
        
        for (let i = 0, j = 0; i < jpLen || j < ruLen;) {
          const jpCmd = jpPage[i]?.command;
          const ruCmd = ruPage[j]?.command;
          const jpRaw = jpPage[i]?.raw;
          const ruRaw = ruPage[j]?.raw;
          const jpBranchEnd = jpPage[i]?.branchEndNumber;
          const ruBranchEnd = ruPage[j]?.branchEndNumber;
          
          // --- ПРОПУСКАЕМ СТРОКИ, КОТОРЫЕ НЕ ДОЛЖНЫ УЧАСТВОВАТЬ В СРАВНЕНИИ ---
          
          // 1. Строки с пометкой #+ (добавляются редактором автоматически)
          if (ruRaw && (ruRaw.trim().startsWith('#+') || /#\+\s*$/.test(ruRaw))) { 
            j++; 
            continue; 
          }
          
          // 2. ShowTextAttributes с #+ (добавляются редактором автоматически)
          if (ruRaw && ruRaw.trim().startsWith('ShowTextAttributes([') && /#\+\s*$/.test(ruRaw)) { 
            j++; 
            continue; 
          }
          
          // 3. Пропуск блоков ShowText подряд в обоих файлах одновременно
          if (ruCmd === 'ShowText' && jpCmd === 'ShowText') {
            // Оба файла имеют ShowText - пропускаем все ShowText подряд в обоих файлах
            let ruShowTextCount = 1; // Текущая строка
            let jpShowTextCount = 1; // Текущая строка
            
            // Считаем ShowText в русском файле
            for (let k = j + 1; k < ruLen; k++) {
              if (ruPage[k]?.command === 'ShowText') {
                ruShowTextCount++;
              } else {
                break;
              }
            }
            
            // Считаем ShowText в японском файле
            for (let k = i + 1; k < jpLen; k++) {
              if (jpPage[k]?.command === 'ShowText') {
                jpShowTextCount++;
              } else {
                break;
              }
            }
            
            // Пропускаем все ShowText в обоих файлах
            i += jpShowTextCount;
            j += ruShowTextCount;
            continue;
          }
          
          // 4. Дополнительные строки ShowText в русском файле (когда в японском нет ShowText)
          // Пропускаем одиночные/серии ShowText, если это часть кластера ShowText (до или после тоже ShowText)
          if (ruCmd === 'ShowText' && jpCmd !== 'ShowText') {
            const ruPrevIsShow = (j - 1 >= 0) && (ruPage[j - 1]?.command === 'ShowText');
            const ruNextIsShow = (j + 1 < ruLen) && (ruPage[j + 1]?.command === 'ShowText');
            if (ruPrevIsShow || ruNextIsShow) {
              // Пропустим весь непрерывный кластер ShowText, начиная с текущего j
              let skipCount = 1; // текущая строка
              for (let k = j + 1; k < ruLen; k++) {
                if (ruPage[k]?.command === 'ShowText') skipCount++; else break;
              }
              j += skipCount;
              continue;
            }
            // Если одиночная лишняя строка ShowText — пропускаем её тоже
            j += 1;
            continue;
          }
          
          // 5. Обратная ситуация: в японском файле больше строк ShowText
          // Пропускаем одиночные/серии ShowText, если это часть кластера ShowText
          if (jpCmd === 'ShowText' && ruCmd !== 'ShowText') {
            const jpPrevIsShow = (i - 1 >= 0) && (jpPage[i - 1]?.command === 'ShowText');
            const jpNextIsShow = (i + 1 < jpLen) && (jpPage[i + 1]?.command === 'ShowText');
            if (jpPrevIsShow || jpNextIsShow) {
              let skipCount = 1; // текущая строка
              for (let k = i + 1; k < jpLen; k++) {
                if (jpPage[k]?.command === 'ShowText') skipCount++; else break;
              }
              i += skipCount;
              continue;
            }
            // Одиночная лишняя строка ShowText с японской стороны — тоже пропускаем
            i += 1;
            continue;
          }
          
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
          

          if (jpCmd !== ruCmd) {
            // Если команды не совпадают, это ошибка структуры
            issues.push({
              line: i+1,
              msg: `тип команды не совпадает (JP: <b>${jpCmd || '—'}</b>, RU: <b>${ruCmd || '—'}</b>)`,
              jp: jpRaw || '',
              ru: ruRaw || '',
              branchEndNumber: jpBranchEnd
            });
            i += 1; j += 1; // Увеличиваем счетчики при несовпадении
            continue;
          } else {
            // --- НАЧАЛО НОВОЙ ПРОВЕРКИ ---
            const jpIndent = jpRaw ? (jpRaw.match(/^(\s*)/) || ['',''])[1] : '';
            const ruIndent = ruRaw ? (ruRaw.match(/^(\s*)/) || ['',''])[1] : '';
            
            // ПРОВЕРКА №1: Неправильный отступ
            if (jpRaw && ruRaw && jpIndent !== ruIndent) {
              issues.push({
                line: ruPage[j]?.lineNum + 1 || i + 1,
                msg: `Неправильный отступ команды (ожидается "${jpIndent.replace(/\s/g, '␣')}", по факту "${ruIndent.replace(/\s/g, '␣')}")`,
                jp: jpRaw || '',
                ru: ruRaw || '',
                branchEndNumber: jpBranchEnd
              });
            } 
            // ПРОВЕРКА №2: Отсутствие кавычек в команде Script
            else if (jpCmd === 'Script' && jpRaw && ruRaw) {
              const jpHasQuotes = /^\s*Script\(\["/.test(jpRaw);
              const ruHasQuotes = /^\s*Script\(\["/.test(ruRaw);

              if (jpHasQuotes && !ruHasQuotes) {
                issues.push({
                  line: ruPage[j]?.lineNum + 1 || i + 1,
                  msg: `Отсутствуют кавычки в команде Script. Правильный формат: Script(["..."])`,
                  jp: jpRaw || '',
                  ru: ruRaw || '',
                  branchEndNumber: jpBranchEnd
                });
              } else {
                okLines++; // Все в порядке
              }
            } else {
              // ПРОВЕРКА №3: Полное совпадение строк для команд, которые не редактируются в редакторе
              const fullyEditableCommands = ['ShowText', 'Script', 'ScriptMore', 'Label', 'JumpToLabel', 'Name', 'ShowTextAttributes'];
              const formatOnlyCommands = ['When', 'ShowChoices'];
              
              if (!fullyEditableCommands.includes(jpCmd) && !formatOnlyCommands.includes(jpCmd) && jpRaw && ruRaw && jpRaw.trim() !== ruRaw.trim()) {
                // Для команд, которые не редактируются в редакторе - проверяем полное совпадение
                issues.push({
                  line: ruPage[j]?.lineNum + 1 || i + 1,
                  msg: `Несовпадение содержимого команды ${jpCmd}`,
                  jp: jpRaw || '',
                  ru: ruRaw || '',
                  branchEndNumber: jpBranchEnd
                });
              } else if (formatOnlyCommands.includes(jpCmd) && jpRaw && ruRaw) {
                // Для When и ShowChoices проверяем только форматирование
                const jpFormat = jpRaw.replace(/\[.*?\]/g, '[FORMAT]');
                const ruFormat = ruRaw.replace(/\[.*?\]/g, '[FORMAT]');
                
                if (jpFormat !== ruFormat) {
                  issues.push({
                    line: ruPage[j]?.lineNum + 1 || i + 1,
                    msg: `Нарушение форматирования команды ${jpCmd}`,
                    jp: jpRaw || '',
                    ru: ruRaw || '',
                    branchEndNumber: jpBranchEnd
                  });
                } else {
                  okLines++;
              }
            } else {
              // Для всех остальных команд, которые совпали
            okLines++;
              }
            }
            // --- КОНЕЦ НОВОЙ ПРОВЕРКИ ---
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