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

// --- Подсветка textarea красным и подсчёт символов ---
window.updateAllForBlock = function(block, textarea, plusBtn, minusBtn, counter, textBlocks) {
  const text = textarea.value;
  if (block.type === 'ShowText' || block.type === undefined) {
    const info = window.getGameTextInfo(text);
    const visibleText = info.rawGameText
      .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[\d+\]>/g, '')
      .replace(/∾∾C\[\d+\]/g, '')
      .replace(/C\[\d+\]/g, '')
      .replace(/∾/g, '')
      .replace(/∿/g, '')
      .trim();
    const len = visibleText.length;
    if (len > 50 || info.isCorrupted) {
      textarea.style.background = '#ffd6d6';
      plusBtn.style.display = (len > 50) ? '' : 'none';
    } else {
      textarea.style.background = '';
      plusBtn.style.display = 'none';
    }
    minusBtn.style.display = (text.trim() === '' && textBlocks.length > 1) ? '' : 'none';
    let selStart = textarea.selectionStart;
    let selEnd = textarea.selectionEnd;
    let sel = Math.abs(selEnd - selStart);
    let nameLen = info.fullPrefix ? info.fullPrefix.length : 0;
    let selGame = 0;
    if (sel > 0 && selStart >= nameLen && selEnd >= nameLen) {
      const selected = info.rawGameText.substring(selStart - nameLen, selEnd - nameLen);
      selGame = selected
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[\d+\]>/g, '')
        .replace(/∾∾C\[\d+\]/g, '')
        .replace(/C\[\d+\]/g, '')
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .length;
    } else if (sel > 0 && selEnd > nameLen && selStart < nameLen) {
      const selected = info.rawGameText.substring(0, selEnd - nameLen);
      selGame = selected
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[\d+\]>/g, '')
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
    textarea.style.background = '';
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