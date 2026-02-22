// main_script.js
// --- Подсчёт игровых символов ---
window.getGameTextInfo = function (txt) {
  const result = {
    rawGameText: txt,
    fullPrefix: '',
    continuationPrefix: '',
    isCorrupted: false
  };

  // Проверка на поврежденный тег
  const hasTagHint = /<∾∾C/.test(txt);
  const validNameTagRegex = /<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/;
  if (hasTagHint && !validNameTagRegex.test(txt)) {
    result.isCorrupted = true;
    return result;
  }

  // Новое, улучшенное регулярное выражение
  const fullMatch = txt.match(/^(∾\n)?(<∾∾C\[\d+\].*?∾∾C\[0\]>)?(.*)$/s);

  if (fullMatch) {
    const newlinePrefix = fullMatch[1] || '';
    const nameTag = fullMatch[2] || '';
    const dialogue = fullMatch[3] || '';

    result.fullPrefix = newlinePrefix + nameTag;
    result.continuationPrefix = nameTag; // Для продолжений диалога без ∾\n
    result.rawGameText = dialogue;
  } else {
    // Если регулярное выражение не сработало, считаем, что вся строка - это текст
    result.rawGameText = txt;
  }

  return result;
};

// --- Подсчёт символов и управление кнопками ---
// --- НОВАЯ ЦЕНТРАЛИЗОВАННАЯ ФУНКЦИЯ ПОДСЧЁТА СИМВОЛОВ ---
window.getVisibleTextMetrics = function (text) {
  const info = window.getGameTextInfo(text);
  let cleanText = info.rawGameText.replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '');
  while (true) {
    const newer = cleanText.replace(/∾∾[A-Z](\[.*?\])?/g, '');
    if (newer === cleanText) break;
    cleanText = newer;
  }
  const visibleText = cleanText
    .replace(/∾/g, '')
    .replace(/∿/g, '')
    .trim();
  return { text: visibleText, length: visibleText.length };
};

// --- Подсчёт символов и управление кнопками ---
window.updateAllForBlock = function (block, textarea, plusBtn, minusBtn, counter, textBlocks) {
  const text = textarea.value;
  if (block.type === 'ShowText' || block.type === undefined) {
    const info = window.getGameTextInfo(text);
    const metrics = window.getVisibleTextMetrics(text);
    const len = metrics.length;
    // Логика для кнопок +/- остаётся
    plusBtn.style.display = (len > 50) ? '' : 'none';
    minusBtn.style.display = (text.trim() === '' && textBlocks.length > 1) ? '' : 'none';
    // Логика подсчёта символов и выделения остаётся
    let selStart = textarea.selectionStart;
    let selEnd = textarea.selectionEnd;
    let sel = Math.abs(selEnd - selStart);
    let nameLen = info.fullPrefix ? info.fullPrefix.length : 0;
    let selGame = 0;
    if (sel > 0 && selStart >= nameLen && selEnd >= nameLen) {
      const selected = info.rawGameText.substring(selStart - nameLen, selEnd - nameLen);
      let cleanSel = selected.replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '');
      while (true) {
        const newer = cleanSel.replace(/∾∾[A-Z](\[.*?\])?/g, '');
        if (newer === cleanSel) break;
        cleanSel = newer;
      }
      selGame = cleanSel
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .length;
    } else if (sel > 0 && selEnd > nameLen && selStart < nameLen) {
      const selected = info.rawGameText.substring(0, selEnd - nameLen);
      let cleanSel = selected.replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '');
      while (true) {
        const newer = cleanSel.replace(/∾∾[A-Z](\[.*?\])?/g, '');
        if (newer === cleanSel) break;
        cleanSel = newer;
      }
      selGame = cleanSel
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .length;
      if (selGame < 0) selGame = 0;
    }
    if (selGame > 0) {
      counter.textContent = `Игровых символов: ${len} (выделено: ${selGame})`;
    } else {
      counter.textContent = `Игровых символов: ${len}`;
    }
  } else {
    const len = text.replace(/∾/g, '').length;
    plusBtn.style.display = 'none';
    minusBtn.style.display = (text.trim() === '' && textBlocks.length > 1) ? '' : 'none';
    counter.textContent = `Символов: ${len}`;
  }
};

// --- Навигация по красным строкам ---
window.redIndices = [];
window.redPointer = -1;
window.updateRedIndices = function () {
  window.redIndices = window.textBlocks
    .map((_, i) => i)
    .filter(i => {
      const ta = window.textBlocks[i].dom?.rusInput;
      return ta && window.getComputedStyle(ta).backgroundColor === 'rgb(255, 214, 214)';
    });
  if (window.redPointer >= window.redIndices.length) window.redPointer = -1;
  const prev = document.getElementById('prevRedBtn');
  const next = document.getElementById('nextRedBtn');
  const disabled = window.redIndices.length === 0;
  if (prev) prev.disabled = disabled;
  if (next) next.disabled = disabled;
};
window.moveToNextRed = function () {
  window.updateRedIndices();
  if (window.redIndices.length === 0) return;
  window.redPointer = (window.redPointer + 1) % window.redIndices.length;
  const idx = window.redIndices[window.redPointer];
  const ta = document.querySelector(`textarea[data-block='${idx}']`);
  if (ta) {
    ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ta.focus();
  }
};
window.moveToPrevRed = function () {
  window.updateRedIndices();
  if (window.redIndices.length === 0) return;
  if (window.redPointer < 0) window.redPointer = 0;
  window.redPointer = (window.redPointer - 1 + window.redIndices.length) % window.redIndices.length;
  const idx = window.redIndices[window.redPointer];
  const ta = document.querySelector(`textarea[data-block='${idx}']`);
  if (ta) {
    ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ta.focus();
  }
};
// --- Привязка обработчиков к стрелкам ---
document.addEventListener('DOMContentLoaded', function () {
  const nextBtn = document.getElementById('nextRedBtn');
  const prevBtn = document.getElementById('prevRedBtn');
  if (nextBtn) nextBtn.onclick = window.moveToNextRed;
  if (prevBtn) prevBtn.onclick = window.moveToPrevRed;
  window.updateRedIndices();
});

/**
 * Новая универсальная функция для поиска всех ошибок на уровне строк.
 * Принимает на вход строки файла и возвращает массив найденных ошибок.
 * @param {string[]} ruLines - Массив строк русского файла.
 * @returns {object[]} - Массив объектов с описанием ошибок.
 */
window.checkForLineLevelErrors = function (ruLines, optionalJpLines) {
  const errors = [];
  if (!ruLines || ruLines.length === 0) {
    return errors;
  }

  // =================================================================
  // START: Full parser copied from `extractTexts` in the HTML file
  // =================================================================
  const tempBlocks = [];
  const textCmdRegex = /^\s*ShowText\(\["([\s\S]*?)"\]\)(.*)/;
  const showChoicesRegex = /^\s*ShowChoices\(\[\[(.*)\],\s*(\d+)\]\)/;
  const whenRegex = /^\s*When\(\[(\d+),\s*"(.*)"\]\)/;
  const otherRegex = /^\s*(\w+)\(\[([\s\S]*?)\]\)(.*)/;
  const nameValueRegex = /^\s*(\w+)\s*=\s*"(.*)"$/;

  ruLines.forEach((line, idx) => {
    if (/^\s*Display Name\s*=/.test(line)) return;

    let match;
    if ((match = line.match(textCmdRegex))) {
      const textContent = match[1];
      const trailingContent = match[2] || '';
      const hasIgnoreMarker = /##/.test(trailingContent);
      tempBlocks.push({ text: textContent, type: 'ShowText', originalIdx: idx, line: line, hasIgnoreMarker: hasIgnoreMarker, trailingContent: trailingContent });
    } else if ((match = line.match(showChoicesRegex))) {
      let choicesText = match[1];
      const choices = choicesText.split(/\s*\|\s*/).map(c => c.replace(/^"|"$/g, ''));
      tempBlocks.push({ text: choices.join(' | '), type: 'ShowChoices', originalIdx: idx, choices: choices, defaultChoice: parseInt(match[2]), line: line });
    } else if ((match = line.match(whenRegex))) {
      tempBlocks.push({ text: match[2], type: 'When', originalIdx: idx, choiceIndex: parseInt(match[1]), line: line });
    } else if ((match = line.match(otherRegex))) {
      const commandType = match[1];
      const commandText = match[2];
      const trailingContent = match[3] || '';
      const translatableCommands = ['Script', 'ScriptMore', 'Label', 'JumpToLabel', 'Name', 'ShowTextAttributes'];
      if (translatableCommands.includes(commandType)) {
        tempBlocks.push({ text: commandText, type: commandType, originalIdx: idx, line: line, trailingContent: trailingContent });
      }
    } else if ((match = line.match(nameValueRegex))) {
      const commandType = match[1];
      const commandText = match[2];
      if (commandType === 'Name') {
        tempBlocks.push({ text: commandText, type: commandType, originalIdx: idx, line: line });
      }
    }
  });

  const textBlocks = [];
  for (let i = 0; i < tempBlocks.length; i++) {
    const currentBlock = tempBlocks[i];
    const rawText = currentBlock.text.replace(/^"(.*)"$/, '$1');
    const hasPlus = /#\+/.test(currentBlock.trailingContent || '');

    if (currentBlock.type === 'ShowTextAttributes') {
      textBlocks.push({ text: currentBlock.text, type: 'ShowTextAttributes', originalIdx: currentBlock.originalIdx, idx: currentBlock.originalIdx, line: currentBlock.line, generated: hasPlus, manualPlus: hasPlus });
      continue;
    }

    if (window.isNameBlock(rawText) && currentBlock.type === 'ShowText') {
      let combinedText = currentBlock.text;
      const specialTemplateRegex = /(^\\n|^∾∾\\n)<[\\∾]{2}C\[\d+\].*[\\∾]{2}C\[0\]>\((Уровень симпатии:|Найдено мастеров:).*?\)$/;
      if (specialTemplateRegex.test(rawText.trim()) && i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText') {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
      } else if (i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText' && !window.isNameBlock(tempBlocks[i + 1].text.replace(/^"(.*)"$/, '$1'))) {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
      }
      const finalText = combinedText.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ idx: currentBlock.originalIdx, text: finalText, type: 'ShowText', line: currentBlock.line, hasIgnoreMarker: currentBlock.hasIgnoreMarker, manualPlus: hasPlus });
    } else {
      const text = rawText.replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ idx: currentBlock.originalIdx, text: text, type: currentBlock.type, line: currentBlock.line, hasIgnoreMarker: currentBlock.hasIgnoreMarker, manualPlus: hasPlus });
    }
  }
  // =================================================================
  // END: Full parser
  // =================================================================

  // =================================================================
  // START: All checks, now including the ShowTextAttributes check
  // =================================================================
  let checkedIndices_long = new Set();
  let lastKnownNameTag = null; // Требуется для Ошибки 2
  textBlocks.forEach((block, i) => {

    // --- Check for long dialogues ---
    if (block.type === 'ShowText' && !checkedIndices_long.has(i)) {
      let lineCount = 0;
      let blockIndices = [];
      let counterIndex = i;
      while (counterIndex < textBlocks.length) {
        const currentDialogueBlock = textBlocks[counterIndex];
        if (counterIndex > i) {
          const prevBlock = textBlocks[counterIndex - 1];
          if (currentDialogueBlock.type !== 'ShowText' || window.isNameBlock(currentDialogueBlock.text) || (currentDialogueBlock.idx !== undefined && prevBlock.idx !== undefined && (currentDialogueBlock.idx - prevBlock.idx > 1))) {
            break;
          }
        }
        lineCount++;
        blockIndices.push(counterIndex);
        checkedIndices_long.add(counterIndex);
        counterIndex++;
      }
      if (lineCount >= 5) {
        blockIndices.forEach(errorIndex => {
          const errorBlock = textBlocks[errorIndex];
          if (!errorBlock.hasIgnoreMarker) {
            errors.push({
              label: `строка ${errorBlock.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: `Часть слишком длинного диалога (${lineCount} строк). Требуется вставка ShowTextAttributes.`
            });
          }
        });
      }
    }

    // --- Проверка на Ошибку 1: Тег есть, префикса ∾\n нет ---
    if (block.type === 'ShowText') {
      const text = block.text;
      const hasNameTag = /<∾∾C\[6\].*?∾∾C\[0\]>/.test(text);
      if (hasNameTag) {
        // Запоминаем последний тег на случай Ошибки 2
        const nameMatch = text.match(/(<∾∾C\[6\].*?∾∾C\[0\]>)/);
        if (nameMatch) lastKnownNameTag = nameMatch[1];

        // Проверяем префикс
        const isMissingPrefix = !/^∾\n/.test(text);
        if (isMissingPrefix && !block.hasIgnoreMarker) {
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка тега имени',
            reason: 'Тег имени должен начинаться с префикса `\\n` (в редакторе `∾` и перенос строки).'
          });
        }
      }
    }

    // --- Проверка на Ошибку 2 (Добавить тег) и Ошибку 3 (Удалить STA) ---
    if (block.type === 'ShowTextAttributes' && block.manualPlus) {

      let nextRelevantBlock = null;
      let nextRelevantBlockIndex = -1;
      for (let j = i + 1; j < textBlocks.length; j++) {
        // (Парсер в main_script.js не имеет 'isDeleted', поэтому мы проверяем все блоки)
        if (textBlocks[j].type === 'ShowText') { nextRelevantBlock = textBlocks[j]; nextRelevantBlockIndex = j; break; }
        if (textBlocks[j].type !== 'ShowText' && textBlocks[j].type !== 'ShowTextAttributes') { break; }
      }

      if (!nextRelevantBlock || window.isNameBlock(nextRelevantBlock.text)) {
        // STA стоит перед именем или в конце, ошибки нет
        return;
      }

      // --- Ищем предыдущий блок (аналог getPreviousVisibleBlock) ---
      let prevBlock = null;
      let k = i - 1;
      while (k >= 0) {
        // (Пропускаем 'isDeleted' т.к. его здесь нет)
        prevBlock = textBlocks[k];
        if (prevBlock) break; // Нашли первый предыдущий блок
        k--;
      }

      if (prevBlock && prevBlock.type === 'ShowText') {
        // --- Проверка на Ошибку 3 (Мусорный STA) ---
        if (prevBlock.manualPlus && nextRelevantBlock.manualPlus) {
          if (!block.generated && !block.hasIgnoreMarker) {
            errors.push({
              label: `строка ${block.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: 'Этот ShowTextAttributes (#+) находится между двумя строками-продолжениями (#+) и будет удален.'
            });
          }
        }

        // --- Проверка на Ошибку 1 (Фаза 1 Очистки) ---
        if (window.isNameBlock(prevBlock.text) && !block.hasIgnoreMarker) {
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка компоновки',
            reason: 'Этот ShowTextAttributes (#+) находится сразу после строки с именем и будет удален.'
          });
        }
      }

      // --- Проверка на Ошибку 2 (Нет тега) v17 ---

      // <<< ИЗМЕНЕНИЕ: УДАЛЕНО "УМНОЕ" ИСКЛЮЧЕНИЕ >>>
      // **ПОЯСНЕНИЕ ДЛЯ РАЗРАБОТЧИКОВ:**
      // Причина: Любой STA#+ (вручную или сгенерированный),
      // который обновляет окно диалога (например, с портретом персонажа),
      // ДОЛЖЕН сопровождаться ShowText с тегом имени, если это диалог.
      // Старая логика ошибочно пропускала эту проверку.

      // --- Теперь эта проверка выполняется ДЛЯ ВСЕХ STA#+ ---

      // --- Проверка на Ошибку 2 (v25 - Жесткое правило якоря STA) ---
      let isNarrationBlock = true; // По умолчанию считаем, что это повествование

      // 1. Ищем "якорь" - последний STA (без #+) строго перед текущим STA#+
      let anchorStaIndex = -1;
      k = i - 1;
      while (k >= 0) {
        const prev = textBlocks[k];

        if (prev.type === 'ShowTextAttributes') {
          if (!prev.manualPlus && !prev.generated) {
            anchorStaIndex = k;
            break;
          }
          k--;
          continue;
        }
        if (prev.type === 'ShowText') {
          k--;
          continue;
        }
        break;
      }

      // 2. Ищем "родителя" - первый ShowText (без #+) ПОСЛЕ найденного якоря
      let parentBlock = null;
      if (anchorStaIndex !== -1) {
        k = anchorStaIndex + 1;

        while (k < i) {
          const block = textBlocks[k];

          if (block.type === 'ShowText' && !block.manualPlus && !block.generated) {
            parentBlock = block;
            break;
          }

          if (block.type === 'ShowTextAttributes' && block.manualPlus) {
            k++;
            continue;
          }

          break;
        }
      }
      // (Если якорь не найден — повествование)

      if (parentBlock) {
        if (window.isNameBlock(parentBlock.text)) {
          isNarrationBlock = false; // Это диалог
        } else {
          isNarrationBlock = true; // Это повествование
        }
      }

      if (!isNarrationBlock) {
        if (!nextRelevantBlock.hasIgnoreMarker) {
          errors.push({
            label: `строка ${nextRelevantBlock.idx + 1}`,
            type: 'Ошибка компоновки',
            reason: 'Эта строка должна содержать тег имени (\\n<\\C[6]Имя\\C[0]>), так как она идет после отмеченной (#+) ShowTextAttributes.'
          });
        }
      }
    }

    // --- Other checks (length, Japanese text, etc.) ---
    if (block.type === 'ShowText') {
      const metrics = window.getVisibleTextMetrics(block.text);
      if (metrics.length > 50 && !block.hasIgnoreMarker) {
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка строки',
          reason: `Превышен лимит символов: ${metrics.length} > 50`
        });
      }
      const isJapanesePresent = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(block.text);
      if (!block.hasIgnoreMarker && isJapanesePresent) {
        let isAnError = true;
        if (block.type === 'Script' || block.type === 'ScriptMore') {
          const isCodeLikeRegex = /[=\/~_()\[\]\.\+\-]|\b(if|else|for|while|return|function|var|let|const|script)\b|e\./i;
          if (isCodeLikeRegex.test(block.text)) {
            isAnError = false;
          }
        }
        if (isAnError) {
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка строки',
            reason: 'Обнаружен японский текст'
          });
        }
      }
      const brokenCodeRegex = /∾∾[IC]\[\d+\].*?(?<!∾)∾C\[0\]/;
      if (brokenCodeRegex.test(block.text) && !block.hasIgnoreMarker) {
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка кода',
          reason: 'Неправильно экранирован закрывающий тег. Вероятно, вместо `∾∾C[0]` используется `∾C[0]`.'
        });
      }
    }
  });
  // =================================================================
  // END: All checks
  // =================================================================

  // --- ПРОВЕРКА: Двойные слэши в Script/ScriptMore (сравнение с японским оригиналом) ---
  for (let i = 0; i < ruLines.length; i++) {
    const line = ruLines[i];
    if (!line.includes('Script(') && !line.includes('ScriptMore(')) continue;

    const contentMatch = line.match(/\["(.*)"\]/);
    if (contentMatch) {
      const content = contentMatch[1];

      // Ищем именно двойной обратный слэш \\ (который в коде пишется как \\\\)
      if (content.includes('\\\\')) {
        // Сравниваем с японским оригиналом, если он доступен
        let japContent = null;

        // Проверяем, есть ли японский файл и соответствующая строка
        if (optionalJpLines && optionalJpLines.length > 0 && optionalJpLines[i]) {
          const japLine = optionalJpLines[i];
          const japContentMatch = japLine.match(/\["(.*)"\]/);
          if (japContentMatch) {
            japContent = japContentMatch[1];
          }
        }

        // Если есть японский оригинал и содержимое совпадает - не показываем ошибку
        if (japContent !== null && content === japContent) {
          // Содержимое совпадает с японским оригиналом - это не ошибка
          continue;
        }

        // Если японского оригинала нет или содержимое отличается - показываем ошибку
        errors.push({
          label: `строка ${i + 1}`,
          type: 'Ошибка скрипта',
          reason: 'Обнаружены ошибочные двойные слэши. Требуется пересохранить файл для исправления.',
          line: i,
          msg: 'Двойные слэши в скрипте.'
        });
      }
    }
  }

  return errors;
};
