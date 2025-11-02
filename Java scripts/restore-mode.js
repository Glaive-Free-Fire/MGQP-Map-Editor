// restore-mode.js
(function(global) {
  // === Функция экранирования первых трёх управляющих последовательностей ===
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

  // === Старая функция восстановления структуры CommonEvent ===
  // Разбить lines на CommonEvent-блоки (с заголовком, страницами и содержимым)
  function parseCommonEvents(lines) {
    const events = [];
    let currentEvent = null;
    let eventLines = [];
    lines.forEach((line, idx) => {
      let ce = line.match(/^CommonEvent (\d+)/);
      if (ce) {
        if (currentEvent) {
          currentEvent.lines = eventLines.slice();
          events.push(currentEvent);
        }
        currentEvent = { num: parseInt(ce[1]), header: [], lines: [], start: idx };
        eventLines = [];
        currentEvent.header = [line];
        return;
      }
      if (currentEvent && line.match(/^Name\s*=\s*"(.*)"/)) {
        currentEvent.header.push(line);
        return;
      }
      if (currentEvent && line.match(/^	*Page \d+/)) {
        currentEvent.header.push(line);
        return;
      }
      if (currentEvent) {
        eventLines.push(line);
      }
    });
    if (currentEvent) {
      currentEvent.lines = eventLines.slice();
      events.push(currentEvent);
    }
    return events;
  }
  
  // Экспортируем функцию для отладки
  global.parseCommonEvents = parseCommonEvents;

  // === ВСПОМОГАТЕЛЬНАЯ: актуальное содержимое RU-файла ===
  function getActualRuContent() {
    if (typeof window.generateCurrentFileContentAsLines !== 'function') {
      return (window.fullRusLines || []).join('\n');
    }
    const currentRuLines = window.generateCurrentFileContentAsLines();
    return (currentRuLines || []).join('\n');
  }

  // Вспомогательная функция для слияния японских строк с именами в русский формат
  function processAndMergeJpLines(jpEventLines) {
    const resultLines = [];
    let j = 0;
    while (j < jpEventLines.length) {
      const currentLine = jpEventLines[j];
      const nextLine = (j + 1 < jpEventLines.length) ? jpEventLines[j + 1] : null;

      // Ищем пару: ShowText(["【Имя】"]) + ShowText(["Текст"])
      const nameMatch = currentLine.match(/^\s*ShowText\(\["【(.+?)】"\]\)/);
      const textMatch = nextLine ? nextLine.match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/) : null;

      if (nameMatch && textMatch) {
        const name = nameMatch[1];
        const text = textMatch[1];
        const indent = currentLine.match(/^(\s*)/) ? currentLine.match(/^(\s*)/)[1] : '';
        
        // Собираем строку в русском формате: \n<\\C[6]Имя\\C[0]>Текст
        let mergedContent = `\\n<\\C[6]${name}\\C[0]>${text}`;
        
        // Экранируем кавычки и обратные слеши для вставки в команду ShowText(["..."])
        mergedContent = mergedContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        
        const mergedLine = `${indent}ShowText(["${mergedContent}"])`;
        resultLines.push(mergedLine);
        
        j += 2; // Пропускаем обе обработанные японские строки
      } else {
        // Если пара не найдена, просто добавляем текущую строку
        resultLines.push(currentLine);
        j += 1;
      }
    }
    return resultLines;
  }

  /**
   * Создаёт содержимое исправленного файла, заменяя только те CommonEvent,
   * в которых были обнаружены структурные ошибки.
   * @param {string[]} ruLines - Массив строк русского файла.
   * @param {string[]} jpLines - Массив строк японского файла.
   * @returns {string[] | null} - Массив строк исправленного файла или null в случае отсутствия ошибок.
   */
  global.fixOnlyMismatchedEvents = function(ruLines, jpLines) {
    const ruContent = ruLines.join('\n');
    const jpContent = jpLines.join('\n');
    const checkResult = window.checkMapStructureMatch(jpContent, ruContent);

    const mismatchedEventIds = new Set();
    if (checkResult.grouped) {
      checkResult.grouped.forEach(ev => {
        if (ev.pages && ev.pages.some(p => !p.ok)) {
          mismatchedEventIds.add(parseInt(ev.eid, 10));
        }
      });
    }

    if (mismatchedEventIds.size === 0) {
      alert('Структурных ошибок не найдено. Файл не требует исправления.');
      return null;
    }

    const ruEvents = parseCommonEvents(ruLines);
    const jpEvents = parseCommonEvents(jpLines);

    const ruEventsMap = new Map(ruEvents.map(e => [e.num, e]));
    const jpEventsMap = new Map(jpEvents.map(e => [e.num, e]));
    const allEventNums = Array.from(new Set([...ruEventsMap.keys(), ...jpEventsMap.keys()])).sort((a, b) => a - b);

    const newFileLines = [];

    // Добавляем всё, что было до первого события
    const firstEventStart = ruEvents.length > 0 ? ruEvents[0].start : ruLines.length;
    for (let i = 0; i < firstEventStart; i++) {
      newFileLines.push(ruLines[i]);
    }

    // Итерируем по всем событиям и решаем, какое из них использовать
    for (const eventNum of allEventNums) {
      const ruEvent = ruEventsMap.get(eventNum);
      const jpEvent = jpEventsMap.get(eventNum);

      if (mismatchedEventIds.has(eventNum)) {
        if (jpEvent) {
          // --- НАЧАЛО ИЗМЕНЕНИЯ ---
          // Обрабатываем и сливаем строки с именами перед вставкой
          const processedJpLines = processAndMergeJpLines(jpEvent.lines);
          newFileLines.push(...jpEvent.header, ...processedJpLines, '');
          // --- КОНЕЦ ИЗМЕНЕНИЯ ---
        }
      } else {
        if (ruEvent) {
          newFileLines.push(...ruEvent.header, ...ruEvent.lines, '');
        }
      }
    }

    // Удаляем последний лишний перенос строки, если он есть
    if (newFileLines[newFileLines.length - 1] === '') {
      newFileLines.pop();
    }

    alert(`Исправление завершено!\nЗаменено ${mismatchedEventIds.size} блоков CommonEvent с ошибками: ${Array.from(mismatchedEventIds).join(', ')}.\n\nВАЖНО: Вам нужно будет заново перевести текст внутри заменённых блоков.`);

    return newFileLines;
  };

  // Главная функция старого восстановления
  global.restoreRussianStructure = function(ruLines, jpLines, replaceNums) {
    const ruEvents = parseCommonEvents(ruLines);
    const jpEvents = parseCommonEvents(jpLines);
    let resultLines = [];
    let jpMap = {};
    jpEvents.forEach(ev => { jpMap[ev.num] = ev; });

    // --- Новый алгоритм: сохраняем все строки вне CommonEvent ---
    // 1. Собираем индексы начала всех CommonEvent в ruLines
    let ceIndices = [];
    for (let i = 0; i < ruLines.length; i++) {
      if (/^CommonEvent \d+/.test(ruLines[i])) ceIndices.push(i);
    }
    // 2. Добавляем все строки до первого CommonEvent
    let firstCE = ceIndices.length > 0 ? ceIndices[0] : ruLines.length;
    for (let i = 0; i < firstCE; i++) {
      resultLines.push(ruLines[i]);
    }
    // 3. По всем CommonEvent
    for (let evIdx = 0; evIdx < ruEvents.length; evIdx++) {
      const ruEv = ruEvents[evIdx];
      const jpEv = jpMap[ruEv.num];
      if (jpEv && Array.isArray(replaceNums) && replaceNums.includes(ruEv.num)) {
        // --- Жёстко копируем японский блок, но слияние ShowText с именем ---
        resultLines.push(...jpEv.header);
        const jpLines = jpEv.lines;
        let j = 0;
        while (j < jpLines.length) {
          // Проверяем: ShowText(["【...】"]) + ShowText(["..."])
          const nameMatch = jpLines[j].match(/^\s*ShowText\(\["【(.+?)】"\]\)/);
          const textMatch = (j + 1 < jpLines.length) ? jpLines[j + 1].match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/) : null;
          if (nameMatch && textMatch) {
            const name = nameMatch[1]
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"');
            const text = textMatch[1]
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"');
            const indent = jpLines[j].match(/^(\s*)/) ? jpLines[j].match(/^(\s*)/)[1] : '';
            const merged = `${indent}ShowText(["\\n<\\C[6]${name}\\C[0]>${text}"] )`;
            // --- Новый патч: гарантированное исправление формата строки с именем ---
            let finalMerged = merged;
            // Проверяем, что строка имеет правильный формат с двойными слэшами
            const formatCheck = merged.match(/^([ \t]*)ShowText\(\["(.*)"\]\s*\)/);
            if (formatCheck) {
              const indent = formatCheck[1] || '';
              const content = formatCheck[2] || '';
              // Ищем паттерн \n<\C[6]Имя\C[0]>Текст
              const contentMatch = content.match(/^\\n<\\C\[6\](.+?)\\C\[0\]>(.*)$/);
              if (contentMatch) {
                let name = contentMatch[1] || '';
                let text = contentMatch[2] || '';
                name = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                text = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                
                // Применяем специальную обработку для строк с характеристиками
                text = escapeSkillAttributes(text);
                
                // --- Применяем escapeFirstThree для правильного экранирования ---
                const escapedContent = escapeFirstThree(`\\n<\\C[6]${name}\\C[0]>${text}`);
                finalMerged = `${indent}ShowText(["${escapedContent}"])`;
              }
            }
            resultLines.push(finalMerged);
            j += 2;
            continue;
          }
          resultLines.push(jpLines[j]);
          j++;
        }
      } else if (jpEv) {
        resultLines.push(...ruEv.header);
        resultLines.push(...ruEv.lines);
      } else {
        resultLines.push(...ruEv.header);
        resultLines.push(...ruEv.lines);
      }
      // --- Добавляем все строки между этим и следующим CommonEvent ---
      let thisEnd = ruEvents[evIdx].start + ruEv.header.length + ruEv.lines.length;
      let nextStart = (evIdx + 1 < ceIndices.length) ? ceIndices[evIdx + 1] : ruLines.length;
      for (let i = thisEnd; i < nextStart; i++) {
        resultLines.push(ruLines[i]);
      }
    }
    // 4. Добавляем все строки после последнего CommonEvent
    let lastEv = ruEvents[ruEvents.length - 1];
    if (lastEv) {
      let lastEnd = lastEv.start + lastEv.header.length + lastEv.lines.length;
      for (let i = lastEnd; i < ruLines.length; i++) {
        resultLines.push(ruLines[i]);
      }
    }
    return resultLines;
  };

  // === Новый алгоритм восстановления структуры по ошибкам ===
  global.restoreStructureByErrors = function(rusLines, japLines, compareResult) {
    let ru = rusLines.slice();
    let jp = japLines.slice();
    if (!compareResult || !compareResult.grouped) return ru;
    function buildEventPageMap(lines) {
      const map = {};
      let currentEvent = null, currentPage = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const ce = line.match(/^CommonEvent (\d+)/);
      if (ce) {
          currentEvent = ce[1];
          if (!map[currentEvent]) map[currentEvent] = {};
          currentPage = null;
        }
        const pg = line.match(/^\s*Page (\d+)/);
        if (pg && currentEvent) {
          currentPage = pg[1];
          if (!map[currentEvent][currentPage]) map[currentEvent][currentPage] = [];
        }
        if (currentEvent && currentPage !== null) {
          map[currentEvent][currentPage].push(i);
        }
      }
      return map;
    }
    const ruMap = buildEventPageMap(ru);
    const jpMap = buildEventPageMap(jp);
    // Собираем все диапазоны для замены
    let ranges = [];
    compareResult.grouped.forEach(ev => {
      ev.pages.forEach(page => {
        if (!page.ok && page.errors && page.errors.length > 0) {
          page.errors.forEach(err => {
            const eid = ev.eid;
            const pg = page.page;
            const line = err.line;
            const ruLines = ruMap[eid] && ruMap[eid][pg];
            const jpLines = jpMap[eid] && jpMap[eid][pg];
            if (!ruLines || !jpLines) return;
            let ruStartIdx = ruLines[line-1];
            let ruEndIdx = ruStartIdx;
            while (ruEndIdx < ruLines[ruLines.length-1]) {
              if (/^\s*Empty\(\[\]\)/.test(ru[ruEndIdx])) break;
              ruEndIdx++;
            }
            let jpStartIdx = jpLines[line-1];
            let jpEndIdx = jpStartIdx;
            while (jpEndIdx < jpLines[jpLines.length-1]) {
              if (/^\s*Empty\(\[\]\)/.test(jp[jpEndIdx])) break;
              jpEndIdx++;
            }
            ranges.push({
              eid, pg,
              ruStart: ruStartIdx,
              ruEnd: ruEndIdx,
              jpStart: jpStartIdx,
              jpEnd: jpEndIdx
            });
          });
        }
      });
    });
    // Сортируем и объединяем перекрывающиеся диапазоны
    ranges.sort((a, b) => a.ruStart - b.ruStart);
    let merged = [];
    for (let i = 0; i < ranges.length; i++) {
      const cur = ranges[i];
      if (merged.length === 0) {
        merged.push(cur);
      } else {
        let last = merged[merged.length-1];
        // Если перекрываются или смежные
        if (cur.ruStart <= last.ruEnd) {
          // Объединяем диапазон
          last.ruEnd = Math.max(last.ruEnd, cur.ruEnd);
          last.jpEnd = Math.max(last.jpEnd, cur.jpEnd);
        } else {
          merged.push(cur);
        }
      }
    }
    // Заменяем с конца, чтобы не сбивать индексы
    for (let i = merged.length - 1; i >= 0; i--) {
      const r = merged[i];
      const jpBlock = jp.slice(r.jpStart, r.jpEnd+1);
      ru.splice(r.ruStart, r.ruEnd - r.ruStart + 1, ...jpBlock);
    }
    
    // Временное решение: удаляем все строки выше Display Name
    const displayNameIndex = ru.findIndex(line => /^\s*Display Name\s*=/.test(line));
    if (displayNameIndex > 0) {
      ru.splice(0, displayNameIndex);
    }
    
    return ru;
  };

  // === Новая функция для восстановления структуры с добавлением пропущенных CommonEvent ===
  global.restoreRussianStructureWithMissing = function(ruLines, jpLines, replaceNums) {
    const ruEvents = parseCommonEvents(ruLines);
    const jpEvents = parseCommonEvents(jpLines);
    
    let resultLines = [];
    
    // Создаем карты событий
    let ruMap = {};
    ruEvents.forEach(ev => { ruMap[ev.num] = ev; });
    let jpMap = {};
    jpEvents.forEach(ev => { jpMap[ev.num] = ev; });
    
    // Собираем все номера CommonEvent из обоих файлов
    let allEventNums = new Set();
    ruEvents.forEach(ev => allEventNums.add(ev.num));
    jpEvents.forEach(ev => allEventNums.add(ev.num));
    allEventNums = Array.from(allEventNums).sort((a, b) => a - b);
    
    // --- Новый алгоритм: сохраняем все строки вне CommonEvent ---
    // 1. Собираем индексы начала всех CommonEvent в ruLines
    let ceIndices = [];
    for (let i = 0; i < ruLines.length; i++) {
      if (/^CommonEvent \d+/.test(ruLines[i])) ceIndices.push(i);
    }
    
    // 2. Добавляем все строки до первого CommonEvent
    let firstCE = ceIndices.length > 0 ? ceIndices[0] : ruLines.length;
    for (let i = 0; i < firstCE; i++) {
      resultLines.push(ruLines[i]);
    }
    
    // 3. Обрабатываем все CommonEvent по порядку номеров
    for (let eventNum of allEventNums) {
      const ruEv = ruMap[eventNum];
      const jpEv = jpMap[eventNum];
      
      if (ruEv && jpEv) {
        // Оба события существуют - применяем обычную логику
        if (Array.isArray(replaceNums) && replaceNums.includes(eventNum)) {
          // Заменяем на японскую версию с обработкой ShowText
          resultLines.push(...jpEv.header);
          const jpLines = jpEv.lines;
          let j = 0;
          while (j < jpLines.length) {
            // Проверяем: ShowText(["【...】"]) + ShowText(["..."])
            const nameMatch = jpLines[j].match(/^\s*ShowText\(\["【(.+?)】"\]\)/);
            const textMatch = (j + 1 < jpLines.length) ? jpLines[j + 1].match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/) : null;
            if (nameMatch && textMatch) {
              const name = nameMatch[1]
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"');
              const text = textMatch[1]
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"');
              const indent = jpLines[j].match(/^(\s*)/) ? jpLines[j].match(/^(\s*)/)[1] : '';
              const merged = `${indent}ShowText(["\\n<\\C[6]${name}\\C[0]>${text}"] )`;
              // --- Новый патч: гарантированное исправление формата строки с именем ---
              let finalMerged = merged;
              // Проверяем, что строка имеет правильный формат с двойными слэшами
              const formatCheck = merged.match(/^([ \t]*)ShowText\(\["(.*)"\]\s*\)/);
              if (formatCheck) {
                const indent = formatCheck[1] || '';
                const content = formatCheck[2] || '';
                // Ищем паттерн \n<\C[6]Имя\C[0]>Текст
                const contentMatch = content.match(/^\\n<\\C\[6\](.+?)\\C\[0\]>(.*)$/);
                if (contentMatch) {
                  let name = contentMatch[1] || '';
                  let text = contentMatch[2] || '';
                  name = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                  text = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                  
                  // Применяем специальную обработку для строк с характеристиками
                  text = escapeSkillAttributes(text);
                  
                  // --- Применяем escapeFirstThree для правильного экранирования ---
                  const escapedContent = escapeFirstThree(`\\n<\\C[6]${name}\\C[0]>${text}`);
                  finalMerged = `${indent}ShowText(["${escapedContent}"])`;
                }
              }
              resultLines.push(finalMerged);
              j += 2;
              continue;
            }
            resultLines.push(jpLines[j]);
            j++;
          }
        } else {
          // Оставляем русскую версию
          resultLines.push(...ruEv.header);
          resultLines.push(...ruEv.lines);
        }
      } else if (jpEv && !ruEv) {
        // Японское событие существует, но русского нет - добавляем японское с обработкой ShowText
        resultLines.push(...jpEv.header);
        const jpLines = jpEv.lines;
        let j = 0;
        while (j < jpLines.length) {
          // Проверяем: ShowText(["【...】"]) + ShowText(["..."])
          const nameMatch = jpLines[j].match(/^\s*ShowText\(\["【(.+?)】"\]\)/);
          const textMatch = (j + 1 < jpLines.length) ? jpLines[j + 1].match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/) : null;
          if (nameMatch && textMatch) {
            const name = nameMatch[1]
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"');
            const text = textMatch[1]
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"');
            const indent = jpLines[j].match(/^(\s*)/) ? jpLines[j].match(/^(\s*)/)[1] : '';
            const merged = `${indent}ShowText(["\\n<\\C[6]${name}\\C[0]>${text}"] )`;
            // --- Новый патч: гарантированное исправление формата строки с именем ---
            let finalMerged = merged;
            // Проверяем, что строка имеет правильный формат с двойными слэшами
            const formatCheck = merged.match(/^([ \t]*)ShowText\(\["(.*)"\]\s*\)/);
            if (formatCheck) {
              const indent = formatCheck[1] || '';
              const content = formatCheck[2] || '';
              // Ищем паттерн \n<\C[6]Имя\C[0]>Текст
              const contentMatch = content.match(/^\\n<\\C\[6\](.+?)\\C\[0\]>(.*)$/);
              if (contentMatch) {
                let name = contentMatch[1] || '';
                let text = contentMatch[2] || '';
                name = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                text = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                
                // Применяем специальную обработку для строк с характеристиками
                text = escapeSkillAttributes(text);
                
                // --- Применяем escapeFirstThree для правильного экранирования ---
                const escapedContent = escapeFirstThree(`\\n<\\C[6]${name}\\C[0]>${text}`);
                finalMerged = `${indent}ShowText(["${escapedContent}"])`;
              }
            }
            resultLines.push(finalMerged);
            j += 2;
            continue;
          }
          resultLines.push(jpLines[j]);
          j++;
        }
      } else if (ruEv && !jpEv) {
        // Русское событие существует, но японского нет - оставляем русское
        resultLines.push(...ruEv.header);
        resultLines.push(...ruEv.lines);
      }
    }
    
    // 4. Добавляем все строки после последнего CommonEvent в русском файле
    let lastEv = ruEvents[ruEvents.length - 1];
    if (lastEv) {
      let lastEnd = lastEv.start + lastEv.header.length + lastEv.lines.length;
      for (let i = lastEnd; i < ruLines.length; i++) {
        resultLines.push(ruLines[i]);
      }
    }
    
    // --- Финальное выравнивание пустых строк между Page N и Empty([]) ---
    for (let i = 0; i < jpLines.length - 2; i++) {
      if (
        /^\s*Page \d+/.test(jpLines[i]) &&
        jpLines[i + 1].trim() === "" &&
        /^\s*Empty\(\[\]\)/.test(jpLines[i + 2])
      ) {
        // Найти соответствующий участок в русском файле
        for (let j = 0; j < resultLines.length - 1; j++) {
          if (
            resultLines[j].trim() === jpLines[i].trim() &&
            /^\s*Empty\(\[\]\)/.test(resultLines[j + 1]) &&
            (j === 0 || resultLines[j - 1].trim() !== "")
          ) {
            // Проверяем, нет ли уже пустой строки между ними
            if (resultLines[j + 1].trim() === "Empty([])" && resultLines[j + 1] !== "" && resultLines[j] !== "") {
              resultLines.splice(j + 1, 0, "");
              break;
            }
          }
        }
      }
    }
    
    return resultLines;
  };

  // === Функция для безопасного восстановления только проблемных строк ===
  global.safeRestoreStructure = function() {
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      alert('Сначала загрузите русский и японский файлы!');
      return;
    }

    // Проверяем структуру и находим конкретные ошибки
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    // Собираем конкретные ошибки для восстановления
    let errorsToFix = [];
    if (result.grouped) {
      result.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok && page.errors && page.errors.length > 0) {
            page.errors.forEach(error => {
              // Добавляем только ошибки, которые можно безопасно исправить
              if (error.msg.includes('Несовпадение содержимого команды') || 
                  error.msg.includes('Нарушение форматирования команды') ||
                  error.msg.includes('тип команды не совпадает')) {
                errorsToFix.push({
                  eid: parseInt(ev.eid),
                  page: page.page,
                  line: error.line,
                  jp: error.jp,
                  ru: error.ru,
                  msg: error.msg
                });
              }
            });
          }
        });
      });
    }
    
    if (errorsToFix.length === 0) {
      alert('Нет ошибок, которые можно безопасно исправить.');
      return;
    }

    // Показываем пользователю, что будет исправлено
    const errorList = errorsToFix.map(err => 
      `CommonEvent ${err.eid}, Page ${err.page}, строка ${err.line}: ${err.msg}`
    ).join('\n');
    
    const confirmed = confirm(
      `Найдено ${errorsToFix.length} ошибок для безопасного исправления:\n\n${errorList}\n\n` +
      'Это заменит только проблемные строки на их японские аналоги, не затрагивая стабильные части файла.\n\n' +
      'Продолжить?'
    );
    
    if (!confirmed) return;

    // Создаем копию русского файла для безопасного восстановления
    let restoredLines = window.fullRusLines.slice();
    
          // === БЫСТРАЯ ПРОВЕРКА КОМАНД EMPTY ===
      // Ищем и исправляем команды Empty([""]) на Empty([]) без замедления парсинга
      for (let i = 0; i < restoredLines.length; i++) {
        const line = restoredLines[i];
        const trimmedLine = line.trim();
        
        // Ищем команды Empty([""]) и заменяем их на Empty([])
        if (trimmedLine === 'Empty([""])') {
          restoredLines[i] = line.replace('Empty([""])', 'Empty([])');
        }
        
        // Ищем команды BranchEnd([""]) и заменяем их на BranchEnd([])
        if (trimmedLine === 'BranchEnd([""])') {
          restoredLines[i] = line.replace('BranchEnd([""])', 'BranchEnd([])');
        }
        
        // Ищем команды ExitEventProcessing([""]) и заменяем их на ExitEventProcessing([])
        if (trimmedLine === 'ExitEventProcessing([""])') {
          restoredLines[i] = line.replace('ExitEventProcessing([""])', 'ExitEventProcessing([])');
        }
      }
    
    // Исправляем каждую ошибку
    errorsToFix.forEach(error => {
      // Находим позицию строки в файле по содержимому
      let lineFound = false;
      
      // Ищем строку по содержимому (error.ru содержит проблемную строку)
      for (let i = 0; i < restoredLines.length; i++) {
        const line = restoredLines[i];
        const trimmedLine = line.trim();
        
        // Сравниваем содержимое строки с проблемной строкой
        if (trimmedLine === error.ru.trim()) {
          // Находим соответствующую строку в японском файле
          for (let j = 0; j < window.fullJapLines.length; j++) {
            const jpLine = window.fullJapLines[j];
            const jpTrimmedLine = jpLine.trim();
            
            // Сравниваем содержимое строки с японской строкой
            if (jpTrimmedLine === error.jp.trim()) {
              // Заменяем русскую строку на японскую
              restoredLines[i] = jpLine;
              lineFound = true;
              break;
            }
          }
          break;
        }
      }
      
      // Если не нашли по точному содержимому, пробуем найти по команде и аргументам
      if (!lineFound && error.msg.includes('Несовпадение содержимого команды')) {
        const ruMatch = error.ru.trim().match(/^(\w+)\(\[(.*)\]\)/);
        const jpMatch = error.jp.trim().match(/^(\w+)\(\[(.*)\]\)/);
        
        if (ruMatch && jpMatch && ruMatch[1] === jpMatch[1]) {
          const command = ruMatch[1];
          const ruArgs = ruMatch[2];
          const jpArgs = jpMatch[2];
          
          // Ищем строку с той же командой и похожими аргументами
          for (let i = 0; i < restoredLines.length; i++) {
            const line = restoredLines[i];
            const trimmedLine = line.trim();
            
            const lineMatch = trimmedLine.match(/^(\w+)\(\[(.*)\]\)/);
            if (lineMatch && lineMatch[1] === command) {
              // Проверяем, похожи ли аргументы (например, Empty([""]) vs Empty([]))
              if (lineMatch[2] === ruArgs || 
                  (ruArgs === '""' && lineMatch[2] === '') ||
                  (ruArgs === '' && lineMatch[2] === '""')) {
                
                // Находим соответствующую строку в японском файле
                for (let j = 0; j < window.fullJapLines.length; j++) {
                  const jpLine = window.fullJapLines[j];
                  const jpTrimmedLine = jpLine.trim();
                  
                  const jpLineMatch = jpTrimmedLine.match(/^(\w+)\(\[(.*)\]\)/);
                  if (jpLineMatch && jpLineMatch[1] === command && jpLineMatch[2] === jpArgs) {
                    // Заменяем русскую строку на японскую
                    restoredLines[i] = jpLine;
                    lineFound = true;
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      }
      
      if (!lineFound) {
        // Строка не найдена для исправления
      }
    });

    // Обновляем глобальные переменные
    window.fullRusLines = restoredLines.slice();
    window.originalLines = restoredLines.slice();
    window.japaneseLines = window.fullJapLines;
    
    // Устанавливаем флаг для правильного сохранения
    window.restoreModeEnabled = true;

    // Показываем кнопку синхронизации
    const syncBtn = document.getElementById('syncEditorBtn');
    if (syncBtn) {
      syncBtn.style.display = '';
      syncBtn.title = 'Заменить содержимое редактора на восстановленные строки';
    }

    // Обновляем предпросмотр если он открыт
    if (typeof window.updatePreviewArea === 'function') {
      window.updatePreviewArea();
    }
    
    // Обновляем состояние кнопки сохранения
    setTimeout(() => {
      if (typeof window.updateRedIndices === 'function') {
        window.updateRedIndices();
      }
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn && window.restoreModeEnabled) {
        saveBtn.disabled = false;
        saveBtn.style.background = '#cdf';
        saveBtn.style.color = '#333';
        saveBtn.title = 'Структура восстановлена. Можно сохранить файл.';
      }
      
      // Обновляем лампочку совпадения
      if (typeof window.updateMatchLamp === 'function') {
        window.updateMatchLamp();
      }
    }, 100);

    alert(`Безопасно исправлено ${errorsToFix.length} ошибок структуры!\n\nТеперь можно сохранить файл или синхронизировать редактор.`);
  };

  // === Функция для немедленного восстановления структуры ===
  global.immediateRestoreStructure = function() {
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      alert('Сначала загрузите русский и японский файлы!');
      return;
    }

    // Проверяем структуру и находим CommonEvent с ошибками
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    // Собираем номера CommonEvent с ошибками
    let mismatchedNums = [];
    if (result.grouped) {
      result.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok && page.errors && page.errors.length > 0) {
            mismatchedNums.push(parseInt(ev.eid));
          }
        });
      });
    }
    
    if (mismatchedNums.length === 0) {
      alert('Структура CommonEvent полностью совпадает. Восстановление не требуется.');
      return;
    }

    // Убираем дубликаты номеров
    mismatchedNums = [...new Set(mismatchedNums)];
    
    // Выполняем восстановление с новой функцией
    const restoredLines = window.restoreRussianStructureWithMissing(window.fullRusLines, window.fullJapLines, mismatchedNums);
    
    // Автоматически исправляем ошибки Script после восстановления структуры
    const fixedLines = window.fixScriptQuotes(restoredLines);
    
    // Обновляем глобальные переменные
    window.fullRusLines = fixedLines.slice();
    window.originalLines = fixedLines.slice();
    window.japaneseLines = window.fullJapLines; // для совместимости
    
    // Устанавливаем флаг для правильного сохранения
    window.restoreModeEnabled = true;

    // Проверяем, остались ли ошибки после первого восстановления
    const jpContent2 = window.fullJapLines.join('\n');
    const ruContent2 = window.fullRusLines.join('\n');
    const result2 = window.checkMapStructureMatch(jpContent2, ruContent2);

    let stillMismatchedNums = [];
    if (result2.grouped) {
      result2.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok && page.errors && page.errors.length > 0) {
            stillMismatchedNums.push(parseInt(ev.eid));
          }
        });
      });
    }
    stillMismatchedNums = [...new Set(stillMismatchedNums)];

    if (stillMismatchedNums.length > 0) {
      // Повторяем восстановление
      const restoredLines2 = window.restoreRussianStructureWithMissing(window.fullRusLines, window.fullJapLines, stillMismatchedNums);
      // Автоматически исправляем ошибки Script после второго восстановления
      const fixedLines2 = window.fixScriptQuotes(restoredLines2);
      window.fullRusLines = fixedLines2.slice();
      window.originalLines = fixedLines2.slice();
      window.japaneseLines = window.fullJapLines;
      window.restoreModeEnabled = true;
    }
    
    // НЕ синхронизируем редактор автоматически!
    // Показываем кнопку синхронизации после восстановления
    const syncBtn = document.getElementById('syncEditorBtn');
    if (syncBtn) {
      syncBtn.style.display = '';
      syncBtn.title = 'Заменить содержимое редактора на восстановленные строки';
    }

    // Обновляем предпросмотр если он открыт
    if (typeof window.updatePreviewArea === 'function') {
      window.updatePreviewArea();
    }
    
    // Принудительно обновляем состояние кнопки сохранения
    setTimeout(() => {
      if (typeof window.updateRedIndices === 'function') {
        window.updateRedIndices();
      }
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn && window.restoreModeEnabled) {
        saveBtn.disabled = false;
        saveBtn.style.background = '#cdf';
        saveBtn.style.color = '#333';
        saveBtn.title = 'Структура восстановлена. Можно сохранить файл.';
      }
      
      // Обновляем видимость кнопок после восстановления
      if (typeof window.updateFixButtonsVisibility === 'function') {
        window.updateFixButtonsVisibility();
      }
    }, 100);

    alert(`Восстановлена структура для CommonEvent: ${mismatchedNums.join(', ')}\nОбновлено ${mismatchedNums.length} событий.\nТакже автоматически исправлены ошибки в командах Script.\n\nИспользуйте кнопку "Обновить редактор" для синхронизации.`);
  };

  // === Функция для исправления кавычек в командах Script ===
  global.fixScriptQuotes = function(lines) {
    let fixedLines = lines.slice();
    let fixedCount = 0;
    
    for (let i = 0; i < fixedLines.length; i++) {
      const line = fixedLines[i];
      // Проверяем, является ли это командой Script без кавычек
      const scriptMatch = line.match(/^\s*Script\(\[([^"]+)\]\)/);
      if (scriptMatch) {
        const content = scriptMatch[1].trim();
        const indent = line.match(/^(\s*)/)[1];
        // Добавляем кавычки вокруг содержимого
        fixedLines[i] = `${indent}Script(["${content}"])`;
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      console.log(`Исправлено ${fixedCount} команд Script без кавычек`);
    }
    
    return fixedLines;
  };

  // === Функция для автоматического исправления всех ошибок Script ===
  global.autoFixScriptErrors = function() {
    if (!window.fullRusLines || window.fullRusLines.length === 0) {
      alert('Сначала загрузите русский файл!');
      return;
    }

    // Исправляем кавычки в командах Script
    const fixedLines = window.fixScriptQuotes(window.fullRusLines);
    
    // Обновляем глобальные переменные
    window.fullRusLines = fixedLines.slice();
    window.originalLines = fixedLines.slice();
    
    // Устанавливаем флаг для правильного сохранения
    window.restoreModeEnabled = true;

    // Показываем кнопку синхронизации
    const syncBtn = document.getElementById('syncEditorBtn');
    if (syncBtn) {
      syncBtn.style.display = '';
      syncBtn.title = 'Заменить содержимое редактора на исправленные строки';
    }

    // Обновляем предпросмотр если он открыт
    if (typeof window.updatePreviewArea === 'function') {
      window.updatePreviewArea();
    }
    
    // Принудительно обновляем состояние кнопки сохранения
    setTimeout(() => {
      if (typeof window.updateRedIndices === 'function') {
        window.updateRedIndices();
      }
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn && window.restoreModeEnabled) {
        saveBtn.disabled = false;
        saveBtn.style.background = '#cdf';
        saveBtn.style.color = '#333';
        saveBtn.title = 'Ошибки Script исправлены. Можно сохранить файл.';
      }
    }, 100);

    // Обновляем видимость кнопок после исправления
    setTimeout(() => {
      if (typeof window.updateFixButtonsVisibility === 'function') {
        window.updateFixButtonsVisibility();
      }
    }, 200);

    alert(`Автоматически исправлены ошибки в командах Script.\n\nИспользуйте кнопку "Обновить редактор" для синхронизации.`);
  };

  // === Функция для проверки наличия ошибок Script ===
  global.hasScriptErrors = function() {
    if (!window.fullJapLines || window.fullJapLines.length === 0) return false;
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = getActualRuContent();
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    if (!result.grouped) return false;
    return result.grouped.some(ev => ev.pages.some(p => !p.ok && p.errors?.some(err => err.msg?.includes('кавычки в команде Script'))));
  };

  // === Функция для проверки наличия ошибок структуры CommonEvent ===
  global.hasStructureErrors = function() {
    if (!window.fullJapLines || window.fullJapLines.length === 0) return false;
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = getActualRuContent();
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    if (!result.grouped) return false;
    return result.grouped.some(ev => ev.pages.some(p => !p.ok && p.errors?.some(err => !err.msg?.includes('кавычки в команде Script'))));
  };

  // === Функция для проверки наличия любых ошибок ===
  global.hasAnyErrors = function() {
    if (!window.fullJapLines || window.fullJapLines.length === 0) return false;
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = getActualRuContent();
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    if (!result.grouped) return false;
    return result.grouped.some(ev => ev.pages.some(p => !p.ok && p.errors && p.errors.length > 0));
  };

  // === Функция для проверки наличия ошибок отступов ===
  global.hasIndentErrors = function() {
    if (!window.fullJapLines || window.fullJapLines.length === 0) return false;
    const jpContent = window.fullJapLines.join('\n');
    const ruContent = getActualRuContent();
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    if (!result.grouped) return false;
    return result.grouped.some(ev => ev.pages.some(p => !p.ok && p.errors?.some(err => err.msg?.includes('Неправильный отступ'))));
  };

  // === Функция для автоматического исправления ошибок отступов ===
  global.autoFixIndentErrors = function() {
    if (!window.fullRusLines || !window.fullJapLines) {
      alert('Сначала загрузите русский и японский файлы!');
      return;
    }
    
    const ruContent = window.fullRusLines.join('\n');
    const jpContent = window.fullJapLines.join('\n');
    const checkResult = window.checkMapStructureMatch(jpContent, ruContent);
    
    // Собираем ТОЛЬКО ИСПРАВИМЫЕ ошибки отступов
    let indentErrors = [];
    if (checkResult.grouped) {
      checkResult.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok && page.errors) {
            page.errors.forEach(err => {
              // Добавляем ошибку, только если она помечена как исправимая
              if (err.isFixableIndent) {
                indentErrors.push(err);
              }
            });
          }
        });
      });
    }
    
    if (indentErrors.length === 0) {
      alert('Исправимых ошибок отступов не найдено.');
      if (typeof window.updateMatchLamp === 'function') window.updateMatchLamp();
      return;
    }
    
    let fixedLines = window.fullRusLines.slice();
    let fixedCount = 0;
    
    indentErrors.forEach(err => {
      const lineNum = err.ruLineNum;
      // Убеждаемся, что все данные для исправления существуют
      if (lineNum !== undefined && err.correctIndent !== undefined && fixedLines[lineNum] !== undefined) {
        const lineContent = fixedLines[lineNum].trim();
        fixedLines[lineNum] = err.correctIndent + lineContent;
        fixedCount++;
      }
    });
    
    if (fixedCount === 0) {
      alert('Не удалось применить исправления отступов.');
      return;
    }

    window.fullRusLines = fixedLines;

    alert(`Исправлено ${fixedCount} ошибок отступов.\n\nРедактор будет автоматически обновлен.`);

    if (typeof window.syncEditorWithRestored === 'function') {
        window.syncEditorWithRestored();
    } else {
        alert('Критическая ошибка: syncEditorWithRestored не найдена. Обновите страницу.');
    }
  };

  // === Вспомогательная функция для поиска предыдущего видимого блока ===
  function getPreviousVisibleBlock(textBlocks, startIndex) {
    if (!textBlocks) return null;
    let k = startIndex - 1;
    while (k >= 0) {
      if (textBlocks[k] && !textBlocks[k].isDeleted) return textBlocks[k];
      k--;
    }
    return null;
  }

  // === Функции для работы с тегами имён ===

  // Функция для ПРОВЕРКИ наличия ошибок тегов (ОБНОВЛЕНО v16)
  global.hasNameTagErrors = function() {
    if (!window.textBlocks) return false;

    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      if (block.isDeleted) continue;

      // --- Проверка на Ошибку 1: Тег есть, префикса ∾\n нет ---
      if (block.type === 'ShowText') {
        const text = block.text;
        const hasNameTag = /<∾∾C\[6\].*?∾∾C\[0\]>/.test(text);
        const isMissingPrefix = !/^∾\n/.test(text);
        if (hasNameTag && isMissingPrefix) {
          return true; // Нашли Ошибку 1
        }
      }

      // --- Проверка на Ошибку 2 (Добавить тег) и Ошибку 3 (Удалить STA) ---
      if (block.type === 'ShowTextAttributes' && block.manualPlus) {
          
          let nextRelevantBlock = null;
          for (let j = i + 1; j < textBlocks.length; j++) {
              if (textBlocks[j].isDeleted) continue;
              if (textBlocks[j].type === 'ShowText') { nextRelevantBlock = textBlocks[j]; break; }
              if (textBlocks[j].type !== 'ShowText' && textBlocks[j].type !== 'ShowTextAttributes' && textBlocks[j].type !== undefined) { break; }
          }
          
          if (!nextRelevantBlock || window.isNameBlock(nextRelevantBlock.text)) {
            continue; // STA стоит перед именем или в конце, ошибки нет
          }

          const prevBlock = getPreviousVisibleBlock(window.textBlocks, i);
          if (!prevBlock) continue;

          // --- Проверка на Ошибку 3 (Мусорный STA) v16 ---
          // STA - мусор, ТОЛЬКО ЕСЛИ он между ДВУМЯ строками-продолжениями.
          if (prevBlock.type === 'ShowText' && prevBlock.manualPlus && nextRelevantBlock.manualPlus) {
            // prevBlock - продолжение (#+), nextBlock - тоже продолжение (#+)
            return true; // Нашли Ошибку 3
          }

          // --- Проверка на Ошибку 1 (Фаза 1 Очистки) v16 ---
          // STA стоит сразу после имени
          if (prevBlock.type === 'ShowText' && window.isNameBlock(prevBlock.text)) {
            return true; // Нашли Ошибку 1 (Фаза 1)
          }

          // --- Проверка на Ошибку 2 (Нет тега) v14 ---
          // (Сюда попадают все остальные STA #+ перед ShowText-без-имени)
          let isNarrationBlock = false;
          let k = i - 1;
          while (k >= 0) {
              const prev = textBlocks[k];
              if (prev.isDeleted) { k--; continue; }
              
              if (prev.type === 'ShowText') {
                if (window.isNameBlock(prev.text)) {
                  isNarrationBlock = false; 
                  break; 
                }
              } else if (prev.type !== 'ShowTextAttributes') {
                isNarrationBlock = true; 
                break;
              }
              k--;
          }
          if (k < 0) {
              if (textBlocks[0] && textBlocks[0].type === 'ShowText' && !window.isNameBlock(textBlocks[0].text)) {
                  isNarrationBlock = true;
              } else if (textBlocks[0] && textBlocks[0].type !== 'ShowText') {
                  isNarrationBlock = true;
              }
          }
          
          if (!isNarrationBlock) {
              return true; // Нашли Ошибку 2 (отсутствует тег)
          }
      }
    } // Конец цикла for
    return false; // Ошибок не найдено
  };

  // Функция для ИСПРАВЛЕНИЯ ошибок тегов (ОБНОВЛЕНО v16)
  global.autoFixNameTagErrors = function() {
    if (!window.textBlocks) return;

    if (typeof pushUndo === 'function') pushUndo();
    
    let blocksToFix_Prefix = [];
    let blocksToFix_MissingTag = [];
    let lastKnownNameTag = null;
    let fixedCount = 0;
    let failedCount = 0;
    let preCleanedCount = 0; // Считает Ошибку 3 + Ошибку 1 (Фаза 1)

    // === Шаг 1: Фаза Очистки (v16 - c 'isDeleted = true') ===
    let blocksToPreClean = [];
    for (let i = 0; i < window.textBlocks.length; i++) {
      const block = window.textBlocks[i];
      if (block.isDeleted) continue;

      if (block.type === 'ShowTextAttributes' && block.manualPlus) {
        
        let nextRelevantBlock = null;
        for (let j = i + 1; j < window.textBlocks.length; j++) {
            if (window.textBlocks[j].isDeleted) continue;
            if (window.textBlocks[j].type === 'ShowText') { nextRelevantBlock = window.textBlocks[j]; break; }
            if (window.textBlocks[j].type !== 'ShowText' && window.textBlocks[j].type !== 'ShowTextAttributes' && window.textBlocks[j].type !== undefined) { break; }
        }
        
        const prevBlock = getPreviousVisibleBlock(window.textBlocks, i);
        if (prevBlock && prevBlock.type === 'ShowText') {

          // Правило 1 (Фаза 1): STA #+ после имени
          if (window.isNameBlock(prevBlock.text)) { 
            blocksToPreClean.push(block); 
            continue; 
          }

          // Правило 2 (Ошибка 3): STA #+ в середине предложения #+
          if (prevBlock.manualPlus && nextRelevantBlock && nextRelevantBlock.manualPlus) {
            blocksToPreClean.push(block);
            continue; 
          }
        }
      }
    }
    
    if (blocksToPreClean.length > 0) {
      blocksToPreClean.forEach(block => {
        block.isDeleted = true; 
        preCleanedCount++;
      });
    }
    // === Конец Фазы Очистки ===


    // === Шаг 2: Ищем ошибки (v14) на *полном*, но помеченном массиве ===
    for (let i = 0; i < window.textBlocks.length; i++) {
      const block = window.textBlocks[i];
      if (block.isDeleted) continue; 

      if (block.type === 'ShowText') {
        const text = block.text;
        const hasNameTag = /<∾∾C\[6\].*?∾∾C\[0\]>/.test(text);
        if (hasNameTag) {
          const nameMatch = text.match(/(<∾∾C\[6\].*?∾∾C\[0\]>)/);
          if (nameMatch) lastKnownNameTag = nameMatch[1];
          const isMissingPrefix = !/^∾\n/.test(text);
          if (isMissingPrefix) {
            blocksToFix_Prefix.push(block);
          }
        }
      }
      
      if (block.type === 'ShowTextAttributes' && block.manualPlus) {
          
          let nextRelevantBlock = null;
          for (let j = i + 1; j < window.textBlocks.length; j++) {
              if (window.textBlocks[j].isDeleted) continue;
              if (window.textBlocks[j].type === 'ShowText') { nextRelevantBlock = window.textBlocks[j]; break; }
              if (window.textBlocks[j].type !== 'ShowText' && window.textBlocks[j].type !== 'ShowTextAttributes' && window.textBlocks[j].type !== undefined) { break; }
          }
          
          if (!nextRelevantBlock || window.isNameBlock(nextRelevantBlock.text)) {
            continue;
          }

          // (Ошибка 3 и Ошибка 1 (Фаза 1) уже обработаны и помечены isDeleted)
          
          // --- Проверка на Ошибку 2 (v14 - Исправленная логика) ---
          let isNarrationBlock = false;
          let k = i - 1;
          while (k >= 0) {
              const prev = textBlocks[k];
              if (prev.isDeleted) { k--; continue; }
              
              if (prev.type === 'ShowText') {
                if (window.isNameBlock(prev.text)) {
                  isNarrationBlock = false; 
                  break; 
                }
              } else if (prev.type !== 'ShowTextAttributes') {
                isNarrationBlock = true; 
                break;
              }
              k--;
          }
          if (k < 0) {
              if (textBlocks[0] && textBlocks[0].type === 'ShowText' && !window.isNameBlock(textBlocks[0].text)) {
                  isNarrationBlock = true;
              } else if (textBlocks[0] && textBlocks[0].type !== 'ShowText') {
                  isNarrationBlock = true;
              }
          }
          
          if (!isNarrationBlock) {
               blocksToFix_MissingTag.push({
                   block: nextRelevantBlock,
                   nameTag: lastKnownNameTag 
               }); // Нашли Ошибку 2
          }
      }
    } // Конец Шага 2

    // === Шаг 3: Применяем исправления ===
    const totalFixes = blocksToFix_Prefix.length + blocksToFix_MissingTag.length;
    
    if (totalFixes === 0 && preCleanedCount === 0) {
      alert('Ошибок в тегах имён для исправления не найдено.');
      if (typeof window.undoStack === 'object' && window.undoStack.length > 0) {
        window.undoStack.pop();
        if (typeof document.getElementById === 'function' && document.getElementById('undoBtn')) {
           document.getElementById('undoBtn').disabled = window.undoStack.length === 0;
        }
      }
      return;
    }
    
    // --- ПОТОМ Исправляем Ошибку 1 (Добавляем префикс ∾\n) ---
    blocksToFix_Prefix.forEach(block => {
      block.text = '∾\n' + block.text;
      fixedCount++;
    });

    // --- В КОНЦЕ Исправляем Ошибку 2 (Добавляем полный тег имени) ---
    blocksToFix_MissingTag.forEach(item => {
      if (item.nameTag) {
        item.block.text = `∾\n${item.nameTag}${item.block.text}`;
        fixedCount++;
      } else {
        failedCount++;
        console.warn("Не удалось исправить тег имени для блока (не найден предыдущий тег):", item.block);
      }
    });

    let alertMsg = `Исправление завершено.\n`;
    if (preCleanedCount > 0) alertMsg += `• Удалено "мусорных" ShowTextAttributes: ${preCleanedCount}\n`;
    if (fixedCount > 0) alertMsg += `• Исправлено тегов имён: ${fixedCount}\n`;
    if (failedCount > 0) alertMsg += `• Ошибок (не найден тег): ${failedCount}\n`;
    
    alert(alertMsg);
    
    // --- Шаг 4: Перерисовываем редактор и обновляем все ошибки ---
    if (typeof renderTextBlocks === 'function') renderTextBlocks();
    if (typeof window.updateMatchLamp === 'function') window.updateMatchLamp();
    if (typeof updateRedIndices === 'function') updateRedIndices();
  };

  // === Функция для запоминания строк-огрызков ===
  global.memorizeOrphanedLines = function() {
    if (!window.textBlocks || textBlocks.length === 0) return;

    // Находим ВСЕ ShowText без пары (не имя, не сгенерированы)
    let orphanedIndices = [];
    textBlocks.forEach((block, i) => {
      if (block.isDeleted) return;
      if (block.type === 'ShowText' &&
          window.japBlocks && window.japBlocks.length > 0 &&
          !window.isNameBlock(block.text) &&
          !block.japaneseLink &&
          !block.generated) {
        orphanedIndices.push(i);
      }
    });

    if (orphanedIndices.length === 0) {
      alert('Строки для запоминания не найдены!');
      return;
    }

    const confirmed = confirm(
      `Найдено ${orphanedIndices.length} дополнительных строк (огрызков).\n\n` +
      `К каждой из этих строк будет добавлен маркер "#+", после чего они будут считаться легитимными строками-продолжениями.\n\n` +
      `Продолжить? (Это действие можно отменить)`
    );

    if (!confirmed) return;

    if (typeof pushUndo === 'function') pushUndo();

    let modifiedLines = window.fullRusLines.slice();
    let modifiedCount = 0;

    orphanedIndices.forEach(blockIndex => {
      const block = textBlocks[blockIndex];
      if (block && block.idx !== undefined && modifiedLines[block.idx]) {
        if (!modifiedLines[block.idx].trim().endsWith('#+')) {
          modifiedLines[block.idx] = modifiedLines[block.idx].trimEnd() + ' #+';
          modifiedCount++;
        }
      }
    });

    if (modifiedCount > 0) {
      window.fullRusLines = modifiedLines;
      alert(`Запомнено ${modifiedCount} строк. Редактор будет обновлен.`);

      if (typeof window.syncEditorWithRestored === 'function') {
        window.syncEditorWithRestored();
      }
    } else {
      alert('Все подходящие строки уже были помечены ранее.');
    }
  };

  // === Функция для обновления видимости кнопок исправления ===
  global.updateFixButtonsVisibility = function() {
    const restoreBtn = document.getElementById('restoreStructBtn');
    const fixScriptBtn = document.getElementById('fixScriptBtn');
    const fixIndentBtn = document.getElementById('fixIndentBtn');
    const fixNameTagsBtn = document.getElementById('fixNameTagsBtn');
    const clearOrphanedBtn = document.getElementById('clearOrphanedBtn');
    const memorizeOrphanedBtn = document.getElementById('memorizeOrphanedBtn');
    
    if (!restoreBtn || !fixScriptBtn || !fixIndentBtn || !clearOrphanedBtn || !memorizeOrphanedBtn || !fixNameTagsBtn) return;
    
    // Определяем, какие типы ошибок присутствуют
    const hasStructureErrors = window.hasStructureErrors();
    const hasScriptErrors = window.hasScriptErrors();
    const hasIndentErrors = window.hasIndentErrors();
    const hasTagsErrors = window.hasNameTagErrors();
    
    // Считаем количество "строк-огрызков"
    let orphanedCount = 0;
    if (window.textBlocks && window.japBlocks && window.japBlocks.length > 0) {
      textBlocks.forEach((block) => {
        if (!block.isDeleted && block.type === 'ShowText' && 
            !window.isNameBlock(block.text) && !block.japaneseLink && !block.generated && !block.manualPlus) {
          orphanedCount++;
        }
      });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЯ: Новая логика отображения ---
    // Показываем кнопки для "сирот" только если есть сироты И НЕТ структурных ошибок
    const showOrphaned = (orphanedCount > 0 && !hasStructureErrors);

    clearOrphanedBtn.style.display = showOrphaned ? '' : 'none';
    memorizeOrphanedBtn.style.display = showOrphaned ? '' : 'none';
    
    // Кнопка "Безопасно исправить" теперь показывается только при наличии структурных ошибок
    restoreBtn.style.display = hasStructureErrors ? '' : 'none';
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    
    // Остальные кнопки работают как раньше
    fixScriptBtn.style.display = hasScriptErrors ? '' : 'none';
    fixIndentBtn.style.display = hasIndentErrors ? '' : 'none';
    fixNameTagsBtn.style.display = hasTagsErrors ? '' : 'none';

    if (orphanedCount > 0) {
      clearOrphanedBtn.title = `Удалить ${orphanedCount} строк без сопоставления с японским файлом`;
      memorizeOrphanedBtn.title = `Пометить ${orphanedCount} строк как строки-продолжения, добавив в конец #+`;
    }
  };
})(window);