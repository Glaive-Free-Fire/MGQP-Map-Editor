// main_script.js
// --- Подсчёт игровых символов ---
window.getGameTextInfo = function(txt) {
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
window.getVisibleTextMetrics = function(text) {
  const info = window.getGameTextInfo(text);
  const visibleText = info.rawGameText
    .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '')
    .replace(/∾∾[A-Z](\[\d+\])?/g, '')
    .replace(/∾/g, '')
    .replace(/∿/g, '')
    .trim();
  return { text: visibleText, length: visibleText.length };
};

// --- Подсчёт символов и управление кнопками ---
window.updateAllForBlock = function(block, textarea, plusBtn, minusBtn, counter, textBlocks) {
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
      selGame = selected
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '')
        .replace(/∾∾C\[\d+\]/g, '')
        .replace(/C\[\d+\]/g, '')
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .length;
    } else if (sel > 0 && selEnd > nameLen && selStart < nameLen) {
      const selected = info.rawGameText.substring(0, selEnd - nameLen);
      selGame = selected
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[0\]>/g, '')
        .replace(/∾∾C\[\d+\]/g, '')
        .replace(/C\[\d+\]/g, '')
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
window.updateRedIndices = function() {
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
window.moveToNextRed = function() {
  window.updateRedIndices();
  if (window.redIndices.length === 0) return;
  window.redPointer = (window.redPointer + 1) % window.redIndices.length;
  const idx = window.redIndices[window.redPointer];
  const ta = document.querySelector(`textarea[data-block='${idx}']`);
  if (ta) {
    ta.scrollIntoView({behavior:'smooth', block:'center'});
    ta.focus();
  }
};
window.moveToPrevRed = function() {
  window.updateRedIndices();
  if (window.redIndices.length === 0) return;
  if (window.redPointer < 0) window.redPointer = 0;
  window.redPointer = (window.redPointer - 1 + window.redIndices.length) % window.redIndices.length;
  const idx = window.redIndices[window.redPointer];
  const ta = document.querySelector(`textarea[data-block='${idx}']`);
  if (ta) {
    ta.scrollIntoView({behavior:'smooth', block:'center'});
    ta.focus();
  }
};
// --- Привязка обработчиков к стрелкам ---
document.addEventListener('DOMContentLoaded', function() {
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
window.checkForLineLevelErrors = function(ruLines) {
  // Эта функция является адаптированной версией парсера extractTexts
  // и логики проверок из updateMatchLamp, созданной специально для пакетной обработки.
  
  const errors = [];
  if (!ruLines || ruLines.length === 0) {
    return errors;
  }

  // 1. Упрощенный парсинг строк в `textBlocks`
  const tempBlocks = [];
  const textCmdRegex = /^\s*ShowText\(\["([\s\S]*?)"\]\)(.*)/;
  ruLines.forEach((line, idx) => {
    let match;
    if ((match = line.match(textCmdRegex))) {
      const textContent = match[1];
      const trailingContent = match[2] || '';
      const hasIgnoreMarker = trailingContent.trim().startsWith('##');
      tempBlocks.push({ text: textContent, type: 'ShowText', originalIdx: idx, line: line, hasIgnoreMarker: hasIgnoreMarker });
    }
  });

  const textBlocks = [];
  for (let i = 0; i < tempBlocks.length; i++) {
    const currentBlock = tempBlocks[i];
    const rawText = currentBlock.text.replace(/^"(.*)"$/, '$1');
    if (window.isNameBlock(rawText)) {
      let combinedText = currentBlock.text;
      const specialTemplateRegex = /^\\n<\\C\[\d+\].*\\C\[0\]>\((Уровень симпатии:|Найдено мастеров:).*?\)$/;
      if (specialTemplateRegex.test(rawText.trim()) && i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText') {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
      } else if (i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText' && !window.isNameBlock(tempBlocks[i + 1].text.replace(/^"(.*)"$/, '$1'))) {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
      }
      const finalText = combinedText.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ idx: currentBlock.originalIdx, text: finalText, type: 'ShowText', line: currentBlock.line, hasIgnoreMarker: currentBlock.hasIgnoreMarker }); // <<< ИЗМЕНЕНИЕ
    } else {
      const text = rawText.replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ idx: currentBlock.originalIdx, text: text, type: currentBlock.type, line: currentBlock.line, hasIgnoreMarker: currentBlock.hasIgnoreMarker }); // <<< ИЗМЕНЕНИЕ
    }
  }

  // 2. Запуск проверок по созданным `textBlocks`
  let checkedIndices_long = new Set();
  textBlocks.forEach((block, i) => {
    if (checkedIndices_long.has(i)) return;

    // Проверка на длинные диалоги (>= 5 строк)
    if (block.type === 'ShowText' && window.isNameBlock(block.text)) {
      let lineCount = 0;
      let blockIndices = []; // <<< ИЗМЕНЕНИЕ: Собираем индексы всех строк в диалоге
      let counterIndex = i;
      
      while (counterIndex < textBlocks.length) {
        const currentDialogueBlock = textBlocks[counterIndex];
        
        if (counterIndex > i) {
            const prevBlock = textBlocks[counterIndex - 1];
            if (
                window.isNameBlock(currentDialogueBlock.text) ||
                // <<< ГЛАВНОЕ ИСПРАВЛЕНИЕ: Проверяем разрыв > 1, а не > 2 >>>
                (currentDialogueBlock.idx !== undefined && prevBlock.idx !== undefined && (currentDialogueBlock.idx - prevBlock.idx > 1))
            ) {
                break;
            }
        }

        lineCount++;
        blockIndices.push(counterIndex); // <<< ИЗМЕНЕНИЕ: Добавляем индекс в список
        checkedIndices_long.add(counterIndex);
        counterIndex++;
      }
      
      // <<< ИЗМЕНЕНИЕ: Добавляем ошибку для КАЖДОЙ строки, как в предпросмотре >>>
      if (lineCount >= 5) {
        blockIndices.forEach(errorIndex => {
            const errorBlock = textBlocks[errorIndex];
            errors.push({
              label: `строка ${errorBlock.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: `Часть слишком длинного диалога (${lineCount} строк). Требуется вставка ShowTextAttributes.`
            });
        });
      }
    }
    
    // Другие проверки (лимит символов, японский текст и т.д.)
    if (block.type === 'ShowText') {
      const metrics = window.getVisibleTextMetrics(block.text);
      if (metrics.length > 50) {
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка строки',
          reason: `Превышен лимит символов: ${metrics.length} > 50`
        });
      }
      if (!block.hasIgnoreMarker && /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(block.text)) {
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка строки',
          reason: 'Обнаружен японский текст'
        });
      }
    }
  });

  return errors;
}; 