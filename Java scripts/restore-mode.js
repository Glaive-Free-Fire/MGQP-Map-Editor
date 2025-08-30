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
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      return false;
    }

    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    if (!result.grouped) return false;
    
    for (const ev of result.grouped) {
      for (const page of ev.pages) {
        if (!page.ok && page.errors && page.errors.length > 0) {
          for (const error of page.errors) {
            if (error.msg && error.msg.includes('кавычки в команде Script')) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  // === Функция для проверки наличия ошибок структуры CommonEvent ===
  global.hasStructureErrors = function() {
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      return false;
    }

    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    if (!result.grouped) return false;
    
    for (const ev of result.grouped) {
      for (const page of ev.pages) {
        if (!page.ok && page.errors && page.errors.length > 0) {
          // Проверяем, есть ли ошибки, не связанные с Script
          for (const error of page.errors) {
            if (error.msg && !error.msg.includes('кавычки в команде Script')) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  // === Функция для проверки наличия любых ошибок ===
  global.hasAnyErrors = function() {
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      return false;
    }

    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    if (!result.grouped) return false;
    
    for (const ev of result.grouped) {
      for (const page of ev.pages) {
        if (!page.ok && page.errors && page.errors.length > 0) {
          return true;
        }
      }
    }
    return false;
  };

  // === Функция для проверки наличия ошибок отступов ===
  global.hasIndentErrors = function() {
    if (!window.fullRusLines || !window.fullJapLines || window.fullRusLines.length === 0 || window.fullJapLines.length === 0) {
      return false;
    }

    const jpContent = window.fullJapLines.join('\n');
    const ruContent = window.fullRusLines.join('\n');
    const result = window.checkMapStructureMatch(jpContent, ruContent);
    
    if (!result.grouped) return false;
    
    for (const ev of result.grouped) {
      for (const page of ev.pages) {
        if (!page.ok && page.errors && page.errors.length > 0) {
          for (const error of page.errors) {
            if (error.msg && error.msg.includes('Неправильный отступ')) {
              return true;
            }
          }
        }
      }
    }
    return false;
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
    
    let indentErrors = [];
    if (checkResult.grouped) {
      checkResult.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok && page.errors) {
            page.errors.forEach(err => {
              if (err.msg && err.msg.includes('Неправильный отступ')) {
                indentErrors.push(err);
              }
            });
          }
        });
      });
    }
    
    if (indentErrors.length === 0) {
      alert('Ошибок отступов не найдено.');
      return;
    }
    
    let fixedLines = window.fullRusLines.slice();
    let fixedCount = 0;
    
    indentErrors.forEach(err => {
      const lineNum = err.line - 1; // lineNum - это номер строки в файле (1-based)
      if (fixedLines[lineNum]) {
        const correctIndent = (err.jp.match(/^(\s*)/) || ['',''])[1];
        const lineContent = fixedLines[lineNum].trim();
        fixedLines[lineNum] = correctIndent + lineContent;
        fixedCount++;
      }
    });
    
    window.fullRusLines = fixedLines;
    window.originalLines = fixedLines;
    window.restoreModeEnabled = true;

    // Показываем кнопку синхронизации
    const syncBtn = document.getElementById('syncEditorBtn');
    if (syncBtn) {
      syncBtn.style.display = '';
    }
    
    alert(`Исправлено ${fixedCount} ошибок отступов.\n\nИспользуйте кнопку "Обновить редактор" для синхронизации.`);
    
    // Обновляем проверку, чтобы кнопка исчезла
    setTimeout(window.updateMatchLamp, 100);
  };

  // === Функция для обновления видимости кнопок исправления ===
  global.updateFixButtonsVisibility = function() {
    const restoreBtn = document.getElementById('restoreStructBtn');
    const fixScriptBtn = document.getElementById('fixScriptBtn');
    const fixIndentBtn = document.getElementById('fixIndentBtn');
    const clearOrphanedBtn = document.getElementById('clearOrphanedBtn');
    
    if (!restoreBtn || !fixScriptBtn || !fixIndentBtn || !clearOrphanedBtn) return;
    
    const hasStructureErrors = window.hasStructureErrors();
    const hasScriptErrors = window.hasScriptErrors();
    const hasIndentErrors = window.hasIndentErrors();
    
    restoreBtn.style.display = hasStructureErrors ? '' : 'none';
    fixScriptBtn.style.display = hasScriptErrors ? '' : 'none';
    fixIndentBtn.style.display = hasIndentErrors ? '' : 'none';
    
    // Управление кнопкой "Очистить строки" вынесено в updateRedIndices
    // для более точного подсчета строк-огрызков
  };
})(window);