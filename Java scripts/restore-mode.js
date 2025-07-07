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

  // Склеиваем ShowText с #+ с предыдущей ShowText
  function glueRuShowText(lines) {
    const out = [];
    let buffer = null;
    let showTextRegex = /^\s*ShowText\(\["(.*)"\]\)/;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.trim().startsWith('ShowText([')) {
        let isPlus = line.includes('#+');
        let textMatch = line.match(showTextRegex);
        if (isPlus && buffer !== null && textMatch) {
          // Продолжение предыдущей строки
          buffer = buffer.replace(/"\]$/, '\\n' + textMatch[1].replace(/"/g, '\\"') + '"]');
    } else {
          if (buffer !== null) out.push(buffer);
          buffer = line.replace(/\s*#\+\s*$/, '');
        }
      } else {
        if (buffer !== null) out.push(buffer);
        buffer = null;
        out.push(line);
      }
    }
    if (buffer !== null) out.push(buffer);
    return out;
    }

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

  // Вспомогательная функция: парсинг команд внутри блока событий
  function parseCommands(lines) {
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      let line = lines[i];
      // ShowText с именем
      let nameMatch = line.match(/^\s*ShowText\(\["【(.+?)】"\]\)/);
      if (nameMatch && i + 1 < lines.length) {
        let nextLine = lines[i+1];
        let textMatch = nextLine.match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/);
        if (textMatch) {
          blocks.push({ type: 'ShowTextWithName', name: nameMatch[1], text: textMatch[1], raw: [line, nextLine], idx: i });
          i += 2;
          continue;
        }
      }
      // Одиночный ShowText
      let textMatch = line.match(/^\s*ShowText\(\["([\s\S]*?)"\]\)/);
      if (textMatch) {
        blocks.push({ type: 'ShowText', text: textMatch[1], raw: [line], idx: i });
        i++;
        continue;
      }
      // ShowTextAttributes
      let attrMatch = line.match(/^\s*ShowTextAttributes\(\[(.*)\]\)/);
      if (attrMatch) {
        blocks.push({ type: 'ShowTextAttributes', text: attrMatch[1], raw: [line], idx: i });
        i++;
        continue;
      }
      // ShowChoices
      let choicesMatch = line.match(/^\s*ShowChoices\(\[\[(.*)\],\s*(\d+)\]\)/);
      if (choicesMatch) {
        blocks.push({ type: 'ShowChoices', text: choicesMatch[1], defaultChoice: parseInt(choicesMatch[2]), raw: [line], idx: i });
        i++;
        continue;
      }
      // When
      let whenMatch = line.match(/^\s*When\(\[(\d+),\s*"(.*)"\]\)/);
      if (whenMatch) {
        blocks.push({ type: 'When', choiceIndex: parseInt(whenMatch[1]), text: whenMatch[2], raw: [line], idx: i });
        i++;
        continue;
      }
      // Script
      let scriptMatch = line.match(/^\s*Script\(\[(.*)\]\)/);
      if (scriptMatch) {
        blocks.push({ type: 'Script', text: scriptMatch[1], raw: [line], idx: i });
        i++;
        continue;
      }
      // ScriptMore
      let scriptMoreMatch = line.match(/^\s*ScriptMore\(\[(.*)\]\)/);
      if (scriptMoreMatch) {
        blocks.push({ type: 'ScriptMore', text: scriptMoreMatch[1], raw: [line], idx: i });
        i++;
        continue;
      }
      // Прочее (оставляем как есть)
      blocks.push({ type: 'Other', text: line, raw: [line], idx: i });
      i++;
    }
    return blocks;
  }

  // Вспомогательная функция: найти ShowText с именем в русском
  function findRuShowTextWithName(ruBlocks, name, used, lastIdx) {
    for (let i = lastIdx; i < ruBlocks.length; i++) {
      let b = ruBlocks[i];
      if (b.type === 'ShowText' && !b.generated && /<∾∾C\[6\](.*?)∾∾C\[0\]>/u.test(b.text) && !used.has(i)) {
        let ruName = b.text.match(/<∾∾C\[6\](.*?)∾∾C\[0\]>/u);
        if (ruName && ruName[1].trim() === name.trim()) {
          return i;
        }
      }
    }
    return -1;
  }
  // Найти одиночный ShowText без имени
  function findRuShowTextNoName(ruBlocks, used, lastIdx) {
    for (let i = lastIdx; i < ruBlocks.length; i++) {
      let b = ruBlocks[i];
      if (b.type === 'ShowText' && !b.generated && !/<∾∾C\[6\](.*?)∾∾C\[0\]>/u.test(b.text) && !used.has(i)) {
        return i;
      }
    }
    return -1;
  }
  // Найти ShowChoices/When/ShowTextAttributes по типу и позиции
  function findRuByType(ruBlocks, type, used) {
    for (let i = 0; i < ruBlocks.length; i++) {
      let b = ruBlocks[i];
      if (b.type === type && !b.generated && !used.has(i)) {
        return i;
            }
          }
    return -1;
  }

  // Сравниваем структуру по всем строкам внутри блока (без учёта пустых)
  function isEventStructEqual(ruEv, jpEv) {
    if (!jpEv) return true; // Если нет японского блока, не меняем
    // Сравниваем массив строк (можно добавить .trim() для надёжности)
    let ruLines = ruEv.lines.map(l => l.trim()).filter(l => l.length);
    let jpLines = jpEv.lines.map(l => l.trim()).filter(l => l.length);
    if (ruLines.length !== jpLines.length) return false;
    for (let i = 0; i < ruLines.length; i++) {
      if (ruLines[i] !== jpLines[i]) return false;
    }
    return true;
  }

  // Главная функция
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
})(window);
