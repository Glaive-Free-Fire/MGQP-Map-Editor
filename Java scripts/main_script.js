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
      if (!ta) return false;
      const bg = window.getComputedStyle(ta).backgroundColor;
      // Ловим ВСЕ оттенки ошибок (красные и розовые)
      return bg.includes('255') && (bg.includes('214') || bg.includes('204') || bg.includes('136'));
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
 * @param {string[]} optionalJpLines - Опциональный массив строк японского файла.
 * @param {number} globalOffset - Глобальное смещение строк (для крупных файлов, разбитых на части).
 * @returns {object[]} - Массив объектов с описанием ошибок.
 */
window.checkForLineLevelErrors = function (ruLines, optionalJpLines, globalOffset = 0) {
  const errors = [];
  if (!ruLines || ruLines.length === 0) {
    return errors;
  }

  // --- НОВОЕ: Вспомогательная функция для форматирования номера строки ---
  // Генерирует строку вида "строка 245[7781]", где в скобках указана строка с учетом глобального смещения
  const getLineLabel = (localIdx) => {
    const localLine = localIdx + 1;
    const globalLine = localLine + globalOffset;
    // Если смещение больше нуля, показываем оба номера. Иначе — только локальный.
    return globalOffset > 0 ? `строка ${localLine}[${globalLine}]` : `строка ${localLine}`;
  };

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
      const translatableCommands = ['Script', 'ScriptMore', 'Label', 'JumpToLabel', 'Name', 'ShowTextAttributes', 'ConditionalBranch', 'Empty'];
      const technicalCommands = ['PlaySE', 'PlayBGM', 'PlayME', 'TransferPlayer', 'ChangeGold', 'ChangeItems', 'ChangeWeapons', 'ChangeArmors', 'ControlSwitches', 'ControlVariables', 'ControlSelfSwitch'];
      if (translatableCommands.includes(commandType)) {
        tempBlocks.push({ text: commandText, type: commandType, originalIdx: idx, line: line, trailingContent: trailingContent });
      } else if (technicalCommands.includes(commandType)) {
        // Извлекаем технические команды для проверки соответствия японскому файлу
        tempBlocks.push({ text: commandText, type: commandType, originalIdx: idx, line: line, trailingContent: trailingContent, isTechnical: true });
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
              label: getLineLabel(errorBlock.idx),
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
            label: getLineLabel(block.idx),
            type: 'Ошибка тега имени',
            reason: 'Тег имени должен начинаться с префикса `\\n` (в редакторе `∾` и перенос строки).'
          });
        }
      }
    }

    // --- Проверка на Ошибку 2 (Добавить тег) и Ошибку 3 (Удалить STA) ---
    if (block.type === 'ShowTextAttributes' && (block.manualPlus || block.generated)) {

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
              label: getLineLabel(block.idx),
              type: 'Ошибка компоновки',
              reason: 'Этот ShowTextAttributes (#+) находится между двумя строками-продолжениями (#+) и будет удален.'
            });
          }
        }

        // --- Проверка на Ошибку 1 (Фаза 1 Очистки) ---
        if (window.isNameBlock(prevBlock.text) && !block.hasIgnoreMarker) {
          errors.push({
            label: getLineLabel(block.idx),
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
            label: getLineLabel(nextRelevantBlock.idx),
            type: 'Ошибка компоновки',
            reason: 'Эта строка должна содержать тег имени (\\n<\\C[6]Имя\\C[0]>), так как она идет после отмеченной (#+) ShowTextAttributes.'
          });
        }
      }

      // --- Проверка: ShowTextAttributes разрывает незаконченное предложение ---
      // Ищем предыдущий ShowText блок
      let prevShowText = null;
      for (let j = i - 1; j >= 0; j--) {
        if (textBlocks[j].type === 'ShowText') {
          prevShowText = textBlocks[j];
          break;
        }
        if (textBlocks[j].type !== 'ShowTextAttributes') break;
      }
      
      // Если нашли предыдущий ShowText, проверяем конец его текста
      if (prevShowText) {
        const text = prevShowText.text || '';
        // Проверяем, заканчивается ли текст на знак препинания (. ! ? ... " »)
        const hasTerminalPunctuation = /[.!?…"»][\s]*$/.test(text);
        
        if (!hasTerminalPunctuation && !block.hasIgnoreMarker) {
          // Проверяем, является ли разрыв вынужденным (4+ строки ShowText)
          let showTextCount = 0;
          for (let j = i - 1; j >= 0; j--) {
            const prevBlock = textBlocks[j];
            if (prevBlock.isDeleted) continue;
            if (prevBlock.type === 'ShowTextAttributes') break;
            if (prevBlock.type === 'ShowText') showTextCount++;
            if (prevBlock.type !== 'ShowText' && prevBlock.type !== 'ShowTextAttributes') break;
          }
          
          // Если меньше 4 строк ShowText - это преждевременный разрыв, генерируем ошибку
          if (showTextCount < 4) {
            errors.push({
              label: getLineLabel(block.idx),
              type: 'Ошибка компоновки',
              reason: 'Атрибут ShowTextAttributes разрывает незаконченное предложение.'
            });
          }
        }
      }
    }

    // --- Проверка: Висячий ShowTextAttributes (нет текста после него) ---
    if (block.type === 'ShowTextAttributes') {
      let hasTextAhead = false;
      for (let j = i + 1; j < textBlocks.length; j++) {
        let nextBlock = textBlocks[j];
        if (nextBlock.isDeleted || nextBlock.type === 'EmptyLine' || nextBlock.type === 'Comment') continue;
        
        if (nextBlock.type === 'ShowText') {
          hasTextAhead = true;
          break; // Нашли ShowText - всё ок
        } else if (nextBlock.type === 'ShowTextAttributes') {
          // Ещё один ShowTextAttributes - продолжаем поиск (это может быть разделение на окна)
          continue;
        } else {
          // Другой тип блока - останавливаемся
          break;
        }
      }
      
      if (!hasTextAhead && !block.hasIgnoreMarker) {
        errors.push({
          label: getLineLabel(block.idx),
          type: 'Ошибка компоновки',
          reason: 'Висячий атрибут ShowTextAttributes. После него нет диалога.'
        });
      }
    }

    // --- Other checks (length, Japanese text, etc.) ---
    if (block.type === 'ShowText') {
      const metrics = window.getVisibleTextMetrics(block.text);
      if (metrics.length > 50 && !block.hasIgnoreMarker) {
        errors.push({
          label: getLineLabel(block.idx),
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
            label: getLineLabel(block.idx),
            type: 'Ошибка строки',
            reason: 'Обнаружен японский текст'
          });
        }
      }
      const brokenCodeRegex = /∾∾[IC]\[\d+\].*?(?<!∾)∾C\[0\]/;
      if (brokenCodeRegex.test(block.text) && !block.hasIgnoreMarker) {
        errors.push({
          label: getLineLabel(block.idx),
          type: 'Ошибка кода',
          reason: 'Неправильно экранирован закрывающий тег. Вероятно, вместо `∾∾C[0]` используется `∾C[0]`.'
        });
      }
    }
  });

  // =================================================================
  // ПРОВЕРКА: Огрызки строк и позиция ShowTextAttributes в разделах подарков
  // =================================================================
  // Раздел подарков начинается с ConditionalBranch с параметрами [1, 11, 0, 2, 0] или похожими
  // Внутри такого раздела:
  // 1. Не должно быть коротких ShowText с #+, которые не начинаются с "Привязанность"
  // 2. ShowTextAttributes должен быть только на нечётных позициях (1, 3, 5, 7...)

  for (let i = 0; i < tempBlocks.length; i++) {
    const block = tempBlocks[i];
    // Ищем ConditionalBranch — потенциальный раздел подарков
    if (block.line && /^\s*ConditionalBranch\(/.test(block.line)) {
      // Сначала собираем все блоки раздела и проверяем, содержит ли он "Привязанность"
      const sectionBlocks = [];
      let j = i + 1;
      while (j < tempBlocks.length) {
        const innerBlock = tempBlocks[j];
        if (innerBlock.line && (/^\s*Empty\(/.test(innerBlock.line) || /^\s*ConditionalBranch\(/.test(innerBlock.line))) {
          break;
        }
        sectionBlocks.push(innerBlock);
        j++;
      }
      
      // Проверяем, содержит ли раздел строки начинающиеся с "Привязанность" — признак раздела подарков
      // В обычных диалогах "Привязанность" может быть в имени или внутри текста, но не в начале
      const hasAffinityText = sectionBlocks.some(b => {
        if (b.type !== 'ShowText') return false;
        const rawText = b.text.replace(/^"(.*)"$/, '$1');
        // Удаляем теги цвета и переносы в начале для проверки
        const cleanedText = rawText.replace(/^\\n/, '').replace(/^[\\∾]+C\[\d+\].*?[\\∾]+C\[0\]>/, '');
        // Проверяем, что текст начинается с "Привязанность"
        return /^Привязанность/.test(cleanedText);
      });
      
      if (!hasAffinityText) continue; // Не раздел подарков — пропускаем
      
      // Это раздел подарков — применяем проверки
      let positionInGift = 0;
      
      for (let k = 0; k < sectionBlocks.length; k++) {
        const innerBlock = sectionBlocks[k];
        positionInGift++;
        
        // Проверка 1: ShowText с #+ должен начинаться с "Привязанность"
        if (innerBlock.type === 'ShowText' && innerBlock.trailingContent && /#\+/.test(innerBlock.trailingContent)) {
          const rawText = innerBlock.text.replace(/^"(.*)"$/, '$1');
          const startsWithAffinity = /^Привязанность/.test(rawText) || /^\\nПривязанность/.test(rawText);
          
          if (!startsWithAffinity && !innerBlock.hasIgnoreMarker) {
            errors.push({
              label: getLineLabel(innerBlock.originalIdx),
              type: 'Ошибка компоновки',
              reason: 'Обнаружен огрызок строки в разделе подарков. Строка с #+ должна начинаться с "Привязанность".'
            });
          }
        }
        
        // Проверка 2: ShowTextAttributes должен быть только на позициях 1, 6, 11...
        if (innerBlock.type === 'ShowTextAttributes' && !innerBlock.hasIgnoreMarker) {
          if (positionInGift % 5 !== 1) {
            errors.push({
              label: getLineLabel(innerBlock.originalIdx),
              type: 'Ошибка компоновки',
              reason: `ShowTextAttributes в разделе подарков должен быть на позиции 1, 6, 11..., а не на позиции ${positionInGift}.`
            });
          }
        }
      }
    }
  }
  // =================================================================
  // END: Gift section check
  // =================================================================

  // =================================================================
  // START: Проверка технических команд с японским файлом
  // =================================================================
  console.log('[DEBUG TECHNICAL] Начало проверки технических команд');
  console.log('[DEBUG TECHNICAL] optionalJpLines:', optionalJpLines ? optionalJpLines.length : 'null');
  
  if (optionalJpLines && optionalJpLines.length > 0) {
    // Парсим японские технические команды
    const jpTempBlocks = [];
    const jpOtherRegex = /^\s*(\w+)\(\[([\s\S]*?)\]\)/;
    
    optionalJpLines.forEach((line, idx) => {
      if (/^\s*Display Name\s*=/.test(line)) return;
      
      let match;
      if ((match = line.match(jpOtherRegex))) {
        const commandType = match[1];
        const commandText = match[2];
        const technicalCommands = ['ConditionalBranch', 'PlaySE', 'PlayBGM', 'PlayME', 'TransferPlayer', 'ChangeGold', 'ChangeItems', 'ChangeWeapons', 'ChangeArmors', 'ControlSwitches', 'ControlVariables', 'ControlSelfSwitch'];
        if (technicalCommands.includes(commandType)) {
          jpTempBlocks.push({ text: commandText, type: commandType, originalIdx: idx, isTechnical: true });
          console.log(`[DEBUG TECHNICAL] JP: ${commandType} at idx ${idx}: ${commandText}`);
        }
      }
    });

    console.log(`[DEBUG TECHNICAL] Найдено JP технических команд: ${jpTempBlocks.length}`);

    // Сопоставляем русские и японские технические команды по типу и позиции
    const ruTechnicalBlocks = tempBlocks.filter(b => b.isTechnical);
    const jpTechnicalBlocks = jpTempBlocks.filter(b => b.isTechnical);
    
    console.log(`[DEBUG TECHNICAL] Найдено RU технических команд: ${ruTechnicalBlocks.length}`);
    
    // Отслеживаем использованные JP блоки
    const usedJpIndices = new Set();
    
    ruTechnicalBlocks.forEach((ruBlock) => {
      console.log(`[DEBUG TECHNICAL] RU: ${ruBlock.type} at idx ${ruBlock.originalIdx}: ${ruBlock.text}`);
      // Последовательное сопоставление по порядку появления команд одного типа
      const jpBlock = jpTechnicalBlocks.find((jp) => 
        jp.type === ruBlock.type && 
        !usedJpIndices.has(jp.originalIdx) // Ещё не использован
      );

      if (jpBlock) {
        console.log(`[DEBUG TECHNICAL] Сопоставлен с JP at idx ${jpBlock.originalIdx}: ${jpBlock.text}`);
        usedJpIndices.add(jpBlock.originalIdx); // Помечаем как использованный
        // Сравниваем значения
        if (ruBlock.text !== jpBlock.text) {
          console.log(`[DEBUG TECHNICAL] ОШИБКА: значения не совпадают!`);
          errors.push({
            label: getLineLabel(ruBlock.originalIdx),
            type: 'Ошибка технической команды',
            reason: `Значение команды ${ruBlock.type} не совпадает с японским файлом. RU: "${ruBlock.text}", JP: "${jpBlock.text}"`
          });
        } else {
          console.log(`[DEBUG TECHNICAL] Значения совпадают`);
        }
      } else {
        console.log(`[DEBUG TECHNICAL] Не найден соответствующий JP блок для ${ruBlock.type} at idx ${ruBlock.originalIdx}`);
      }
    });
  } else {
    console.log('[DEBUG TECHNICAL] optionalJpLines отсутствует или пуст');
  }
  // =================================================================
  // END: Проверка технических команд с японским файлом
  // =================================================================

  return errors;
};

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ИСПРАВЛЕНИЯ ДЛИННЫХ ДИАЛОГОВ (v7.5) ===
window.fixLongDialogues = function(silent = false) {
  // textBlocks определён в глобальной области видимости в HTML
  const longDialogueGroups = [];
  const checkedIndices = new Set();

  // ШАГ 1: Поиск ВСЕХ длинных диалогов
  textBlocks.forEach((block, i) => {
    if (checkedIndices.has(i) || block.isDeleted || block.type !== 'ShowText') {
      return;
    }

    let dialogueBlockIndices = [];
    let lineCount = 0;
    let counterIndex = i;

    while (counterIndex < textBlocks.length) {
      const currentDialogueBlock = textBlocks[counterIndex];

      if (currentDialogueBlock.isDeleted) {
        checkedIndices.add(counterIndex);
        counterIndex++;
        continue;
      }

      if (
        currentDialogueBlock.type !== 'ShowText' ||
        (counterIndex > i && window.isNameBlock(currentDialogueBlock.text))
      ) {
        break;
      }

      dialogueBlockIndices.push(counterIndex);
      checkedIndices.add(counterIndex);
      lineCount++;
      counterIndex++;
    }

    if (lineCount >= 5) {
      longDialogueGroups.push(dialogueBlockIndices);
    }
  });

  if (longDialogueGroups.length === 0) {
    if (!silent) alert('Проблемных диалогов не найдено.');
    return;
  }

  let fixedCount = 0;

  // ШАГ 2: Обрабатываем найденные группы в обратном порядке
  for (let i = longDialogueGroups.length - 1; i >= 0; i--) {
    const groupIndices = longDialogueGroups[i];

    // ШАГ 3: Вставляем атрибуты, строго соблюдая лимит не более 4 строк
    let chunkStart = 0;
    let insertedInGroup = 0;

    // Пока остаток группы больше 4 строк, мы должны его разбивать
    while (groupIndices.length - chunkStart > 4) {
      let targetEnd = chunkStart + 3; // 4-я строка в текущем чанке
      let cutIndex = targetEnd;
      let safeInsertionFound = false;

      // Ищем строку с завершающим знаком препинания в пределах последних 3 строк чанка
      // Не отступаем дальше, чем начало чанка!
      const searchStart = Math.max(targetEnd - 2, chunkStart);

      for (let k = targetEnd; k >= searchStart; k--) {
        // Учитываем смещение от уже добавленных элементов в эту группу
        const blockIndex = groupIndices[k] + insertedInGroup;
        const block = textBlocks[blockIndex];

        if (block && block.type === 'ShowText') {
          const text = block.text || '';
          const hasTerminalPunctuation = /[.!?…"»][\s]*$/.test(text);

          if (hasTerminalPunctuation) {
            cutIndex = k;
            safeInsertionFound = true;
            break;
          }
        }
      }

      // Вычисляем реальную точку вставки в массиве textBlocks
      const insertionPoint = groupIndices[cutIndex] + 1 + insertedInGroup;
      const startIndex = groupIndices[0]; // Индекс начала всей группы диалога (не смещается)

      // <<< Проверяем контекст (isNarration и lastKnownNameTag) >>>
      let isNarration = true;
      let lastKnownNameTag = null;

      // 1. Ищем "якорь" — последний ShowTextAttributes (без #+)
      let anchorStaIndex = -1;
      let m = startIndex - 1;
      while (m >= 0) {
        const prev = textBlocks[m];
        if (prev.isDeleted) { m--; continue; }
        if (prev.type === 'ShowTextAttributes') {
          if (!prev.manualPlus && !prev.generated) {
            anchorStaIndex = m;
            break;
          }
          m--; continue;
        }
        if (prev.type === 'ShowText') { m--; continue; }
        break;
      }

      // 2. Ищем "родителя" — первый ShowText ПОСЛЕ якоря (до начала группы включительно)
      let parentBlock = null;
      if (anchorStaIndex !== -1) {
        m = anchorStaIndex + 1;
        while (m <= startIndex) {
          const candidate = textBlocks[m];
          if (candidate.isDeleted) { m++; continue; }
          if (candidate.type === 'ShowText') {
            parentBlock = candidate;
            break;
          }
          if (candidate.type === 'ShowTextAttributes' && candidate.manualPlus) {
            m++; continue;
          }
          break;
        }
      }

      if (parentBlock) {
        if (window.isNameBlock(parentBlock.text)) {
          isNarration = false;
          const nameMatch = parentBlock.text.match(/(<∾∾C\[6\].*?∾∾C\[0\]>)/);
          if (nameMatch) lastKnownNameTag = nameMatch[1];
        } else {
          isNarration = true;
        }
      }

      // Если это ДИАЛОГ, добавляем тег имени к блоку, который будет сразу после нового STA
      if (!isNarration && lastKnownNameTag) {
        const nextBlock = textBlocks[insertionPoint];
        if (nextBlock && nextBlock.type === 'ShowText' && !window.isNameBlock(nextBlock.text)) {
          nextBlock.text = `∾\n${lastKnownNameTag}${nextBlock.text}`;
        }
      }

      // Ищем атрибуты *до* начала этой группы
      let parentAttrText = '"",0,0,2';
      for (let k = startIndex - 1; k >= 0; k--) {
        if (textBlocks[k].type === 'ShowTextAttributes') {
          parentAttrText = textBlocks[k].text;
          break;
        }
      }

      const newAttributesBlock = {
        type: 'ShowTextAttributes',
        text: parentAttrText,
        idx: undefined,
        generated: true,
        manualPlus: true
      };

      textBlocks.splice(insertionPoint, 0, newAttributesBlock);
      insertedInGroup++;
      fixedCount++;

      // Следующий чанк начинается сразу после места разреза
      chunkStart = cutIndex + 1;
    }
  }

  if (!silent) alert(`Исправлено ${fixedCount} проблемных мест в длинных диалогах.`);

  if (typeof window.updateMatchLamp === 'function') {
    window.updateMatchLamp();
  }

  // renderTextBlocks() и window.updateFixButtonsVisibility() вызываются из HTML
  // они определены там, где textBlocks доступен
};
