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
    
    // Выполняем восстановление
    const restoredLines = window.restoreRussianStructure(window.originalLines, window.fullJapLines, mismatchedNums);
    
    // Обновляем глобальные переменные
    window.fullRusLines = restoredLines.slice();
    window.originalLines = restoredLines.slice();
    window.japaneseLines = window.fullJapLines; // для совместимости
    
    // Устанавливаем флаг для правильного сохранения
    window.restoreModeEnabled = true;
    
    // Перезагружаем редактор
    window.extractTexts();
    window.updateMatchLamp();
    
    // Обновляем предпросмотр если он открыт
    if (typeof window.updatePreviewArea === 'function') {
      window.updatePreviewArea();
    }
    
    alert(`Восстановлена структура для CommonEvent: ${mismatchedNums.join(', ')}\nОбновлено ${mismatchedNums.length} событий.`);
  };
})(window);
