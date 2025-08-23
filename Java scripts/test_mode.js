document.addEventListener('DOMContentLoaded', function() {
  // (Функции прокрутки теперь будут в HTML)
  // --- Функция генерации preview ---
  window.updatePreviewArea = function() {
    // Генерируем экспортируемое содержимое (до сохранения)
    let previewLines;
    if (window.restoreModeEnabled && window.japaneseLines && window.originalLines) {
      // Если восстановление уже было выполнено, используем обновленные строки
      previewLines = window.fullRusLines.slice();
    } else {
      // Проверяем, есть ли originalLines (режим работы только с японским файлом)
      if (!originalLines || originalLines.length === 0) {
        // Восстанавливаем оригинальную структуру японского файла
        let newLines = [];
        
        // Если есть оригинальные японские строки, используем их
        if (window.originalJapLines && window.originalJapLines.length > 0) {
          newLines = window.originalJapLines.slice();
          
          // Обновляем Display Name
          for (let i = 0; i < newLines.length; i++) {
            if (/^\s*Display Name\s*=/.test(newLines[i])) {
              newLines[i] = `Display Name = "${mapDisplayName}"`;
              break;
            }
          }
          
          // Обновляем только строки ShowText с переведенным содержимым
          textBlocks.forEach((block, blockIndex) => {
            if (block.idx !== undefined && block.type === 'ShowText') {
              // Пропускаем автоматически сгенерированные плейсхолдеры "ТРЕБУЕТСЯ ПЕРЕВОД"
              if (block.generated && block.text === 'ТРЕБУЕТСЯ ПЕРЕВОД') {
                return;
              }
              
              // Проверяем, не является ли это дублирующей строкой диалога
              let isDuplicate = false;
              if (blockIndex > 0) {
                const prevBlock = textBlocks[blockIndex - 1];
                if (prevBlock && prevBlock.japaneseLink && prevBlock.japaneseLink.type === 'name' && 
                    !(block.japaneseLink && block.japaneseLink.type === 'name')) {
                  // Это дублирующая строка диалога, пропускаем её
                  isDuplicate = true;
                }
              }
              
              if (!isDuplicate) {
                // Форматируем текст для ShowText
                let txt = block.text.replace(/∿/g, '<<ONE>>');
                txt = txt.replace(/\n/g, '\\n');
                txt = txt.replace(/∾+/g, '\\\\');
                txt = txt.replace(/<<ONE>>/g, '\\');
                txt = txt.replace(/\\{2,}n/g, '\\\\n');
                txt = txt.replace(/\\(?=[\?\.!\,—])/g, '');
                let newText = txt.replace(/(?<!\\)"/g, '\\"');
                
                // Применяем специальную обработку для строк с характеристиками
                newText = escapeSkillAttributes(newText);
                
                // Заменяем оригинальную строку
                newLines[block.idx] = newLines[block.idx].replace(/\[(.*)\]/, `["${newText}"]`);
                
                // Если это блок с именем, удаляем следующую строку (текст диалога)
                if (block.nextLine && block.japaneseLink && block.japaneseLink.type === 'name') {
                  // Находим и удаляем следующую строку ShowText
                  for (let j = block.idx + 1; j < newLines.length; j++) {
                    if (/^\s*ShowText\(\[/.test(newLines[j])) {
                      newLines.splice(j, 1);
                      break;
                    }
                  }
                }
              }
            }
          });
        } else {
          // Fallback: создаем новый файл из японских блоков
          // Используем новый алгоритм сборки файла
          newLines = [];
          const blockMap = new Map();
          textBlocks.forEach(block => {
              if (block.idx !== undefined) {
                  blockMap.set(block.idx, block);
              }
          });

          for (let i = 0; i < window.originalJapLines.length; i++) {
              const currentLine = window.originalJapLines[i];
              const block = blockMap.get(i);

              if (block) {
                  // Эта строка была обработана и есть в textBlocks.
                  const indentMatch = currentLine.match(/^\s*/);
                  const indent = indentMatch ? indentMatch[0] : '';
                  
                                     if (block.type === 'ShowText' && block.japaneseLink && block.japaneseLink.type === 'name') {
                       // Это блок с именем. Восстанавливаем оригинальную структуру.
                       const nameMatch = block.text.match(/∾\n<∾∾C\[6\](.*?)∾∾C\[0\]>/);
                       if (nameMatch) {
                           const name = nameMatch[1];
                           
                           // Проверяем, есть ли у нас сохраненные части диалога
                           if (block.dialogueParts && block.dialogueParts.length > 0) {
                                                               // Сначала добавляем строку с именем и первой частью диалога
                                const firstPart = block.dialogueParts[0];
                                let txt = firstPart.replace(/∿/g, '<<ONE>>').replace(/∾+/g, '\\\\').replace(/<<ONE>>/g, '\\').replace(/(?<!\\)"/g, '\\"');
                                
                                // Применяем специальную обработку для строк с характеристиками
                                txt = escapeSkillAttributes(txt);
                                
                                newLines.push(`${indent}ShowText(["\\\\n<\\\\C[6]${name}\\\\C[0]>${txt}"])`);
                               
                               // Затем добавляем остальные части диалога как отдельные строки
                               for (let j = 1; j < block.dialogueParts.length; j++) {
                                   const part = block.dialogueParts[j];
                                   if (part.trim()) {
                                       let txt = part.replace(/∿/g, '<<ONE>>').replace(/∾+/g, '\\\\').replace(/<<ONE>>/g, '\\').replace(/(?<!\\)"/g, '\\"');
                                       
                                       // Применяем специальную обработку для строк с характеристиками
                                       txt = escapeSkillAttributes(txt);
                                       
                                       newLines.push(`${indent}ShowText(["${txt}"])`);
                                   }
                               }
                           } else {
                               // Fallback: используем старый метод
                               const cleanText = block.text.replace(/∾<∾∾C\[6\].*?∾∾C\[0\]>/, '');
                               const linesToSave = cleanText.split('\n');
                               
                               linesToSave.forEach(line => {
                                   if (line.trim()) {
                                       let txt = line.replace(/∿/g, '<<ONE>>').replace(/∾+/g, '\\\\').replace(/<<ONE>>/g, '\\').replace(/(?<!\\)"/g, '\\"');
                                       
                                       // Применяем специальную обработку для строк с характеристиками
                                       txt = escapeSkillAttributes(txt);
                                       
                                       newLines.push(`${indent}ShowText(["${txt}"])`);
                                   }
                               });
                           }
                       }
                       
                       // Пропускаем оригинальные строки, которые были объединены
                       if (block.linesToSkip) {
                           i += block.linesToSkip;
                       }
                  } else if (block.type === 'ShowText') {
                      // Обычный ShowText без имени
                      let txt = block.text.replace(/∿/g, '<<ONE>>');
                      txt = txt.replace(/\n/g, '\\n');
                      txt = txt.replace(/∾+/g, '\\\\');
                      txt = txt.replace(/<<ONE>>/g, '\\');
                      txt = txt.replace(/\\{2,}n/g, '\\\\n');
                      txt = txt.replace(/\\(?=[\?\.!\,—])/g, '');
                      let newText = txt.replace(/(?<!\\)"/g, '\\"');
                      
                      // Применяем специальную обработку для строк с характеристиками
                      newText = escapeSkillAttributes(newText);
                      
                      newLines.push(`${indent}ShowText(["${newText}"])`);
                  } else {
                      // Другие типы блоков (ShowChoices, When, Script и т.д.)
                      let formattedLine = '';
                      switch (block.type) {
                          case 'ShowChoices':
                              const choices = block.text.split(' | ');
                              const choicesFormatted = choices.map(choice => 
                                  `"${choice.replace(/∾/g, '\\').replace(/"/g, '\\"')}"`
                              ).join(', ');
                              formattedLine = `${indent}ShowChoices([[${choicesFormatted}], ${block.defaultChoice || 0}])`;
                              break;
                          case 'When':
                              const whenText = block.text.replace(/∾/g, '\\').replace(/"/g, '\\"');
                              formattedLine = `${indent}When([${block.choiceIndex || 0}, "${whenText}"])`;
                              break;
                          case 'Script':
                              formattedLine = `${indent}Script([${block.text}])`;
                              break;
                          case 'ScriptMore':
                              formattedLine = `${indent}ScriptMore([${block.text}])`;
                              break;
                          default:
                              formattedLine = `${indent}${block.type}([${block.text}])`;
                      }
                      newLines.push(formattedLine);
                  }
              } else {
                  // Эта строка - структурная (ConditionalBranch, Empty и т.д.) или была пропущена при парсинге.
                  // Просто добавляем ее как есть, но проверяем на Display Name.
                  if (/^\s*Display Name\s*=/.test(currentLine)) {
                     newLines.push(`Display Name = "${mapDisplayName}"`);
                  } else {
                     newLines.push(currentLine);
                  }
              }
          }
        }
        
        previewLines = newLines;
      } else {
        // Обычный режим с русским файлом
      let newLines = [...originalLines];
      let lineInsertOffset = 0;
      let blockIndexMap = new Map();
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
      textBlocks.forEach((block, blockIndex) => {
        // === НАЧАЛО ИСПРАВЛЕНИЯ ===
        // Пропускаем автоматически сгенерированные плейсхолдеры "ТРЕБУЕТСЯ ПЕРЕВОД"
        if (block.generated && block.text === 'ТРЕБУЕТСЯ ПЕРЕВОД') {
          return; // Это пропустит текущий блок и перейдет к следующему
        }
        // === КОНЕЦ ИСПРАВЛЕНИЯ ===
        
        if (block.idx !== undefined) {
          const originalLine = originalLines[block.idx];
          const indentMatch = originalLine.match(/^\s*/);
          const indent = indentMatch ? indentMatch[0] : '';
          let newLine;
          switch (block.type) {
            case 'ShowText':
              let txt = block.text.replace(/∿/g, '<<ONE>>');
              txt = txt.replace(/\n/g, '\\n');
              txt = txt.replace(/∾+/g, '\\\\');
              txt = txt.replace(/<<ONE>>/g, '\\');
              txt = txt.replace(/\\{2,}n/g, '\\\\n');
              txt = txt.replace(/\\(?=[\?\.!\,—])/g, '');
              let newText = txt.replace(/(?<!\\)"/g, '\\"');
              
              // Применяем специальную обработку для строк с характеристиками
              newText = escapeSkillAttributes(newText);
              
              newLine = originalLine.replace(/\[(.*)\]/, `["${newText}"]`);
              break;
            case 'ShowTextAttributes':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            case 'DisplayName':
              const displayText = block.text.replace(/∾/g, '\\').replace(/"/g, '\\"');
              newLine = originalLine.replace(/"(.*)"/, `"${displayText}"`);
              break;
            case 'ShowChoices':
              const choices = block.text.split(' | ');
              const choicesFormatted = choices.map(choice => 
                `"${choice.replace(/∾/g, '\\').replace(/"/g, '\\"')}"`
              ).join(', ');
              newLine = originalLine.replace(/\[\[(.*)\],\s*(\d+)\]/, `[[${choicesFormatted}], ${block.defaultChoice || 0}]`);
              break;
            case 'When':
              const whenText = block.text.replace(/∾/g, '\\').replace(/"/g, '\\"');
              newLine = originalLine.replace(/\[(\d+),\s*"(.*)"\]/, `[${block.choiceIndex || 0}, "${whenText}"]`);
              break;
            case 'Script':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            case 'ScriptMore':
              newLine = originalLine.replace(/\[(.*)\]/, `[${block.text}]`);
              break;
            default:
              newLine = originalLine;
          }
          newLines[block.idx + lineInsertOffset] = indent + newLine.trimStart();
          blockIndexMap.set(blockIndex, block.idx + lineInsertOffset);
        } else {
          let lastMainBlockIdx = -1;
          for (let j = blockIndex - 1; j >= 0; j--) {
            if (textBlocks[j].idx !== undefined) {
              lastMainBlockIdx = textBlocks[j].idx;
              break;
            }
          }
          let indent = '';
          if (lastMainBlockIdx !== -1) {
            const originalLine = originalLines[lastMainBlockIdx];
            const indentMatch = originalLine.match(/^\s*/);
            indent = indentMatch ? indentMatch[0] : '';
          }
          if (block.type === 'ShowTextAttributes') {
            let lineToInsert = indent + `ShowTextAttributes([${block.text}])`;
            if (block.generated) {
              lineToInsert += ' #+';
            }
            newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
            lineInsertOffset++;
            blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
          } else if (/^∾<∾∾C\[6\]/.test(block.text) || /^\\n<\\C\[6\]/.test(block.text)) {
            let lineToInsert = indent + `ShowText(["${block.text}"])`;
            if (block.type === 'ShowText' && block.generated) {
              lineToInsert += ' #+';
            }
            newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
            lineInsertOffset++;
            blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
          } else {
            let cont = block.text.replace(/∿/g, '<<ONE>>');
            cont = cont.replace(/\n/g, '\\n');
            cont = cont.replace(/∾+/g, '\\');
            cont = cont.replace(/<<ONE>>/g, '\\');
            cont = cont.replace(/\\{2,}n/g, '\\\\n');
            cont = cont.replace(/\\(?=[\?\.!\,—])/g, '');
            let newText = cont.replace(/(?<!\\)"/g, '\\"');
            
            // Применяем специальную обработку для строк с характеристиками
            newText = escapeSkillAttributes(newText);
            
            let lineToInsert = indent + `ShowText(["${newText}"])`;
            if (block.type === 'ShowText' && block.generated) {
              lineToInsert += ' #+';
            }
            newLines.splice(lastMainBlockIdx + 1 + lineInsertOffset, 0, lineToInsert);
            lineInsertOffset++;
            blockIndexMap.set(blockIndex, lastMainBlockIdx + 1 + lineInsertOffset - 1);
          }
        }
      });
      previewLines = (window.restoreStructureByErrors ? window.restoreStructureByErrors(newLines, textBlocks) : newLines);
      }
    }
    // Применяем escapeFirstThree только к строкам ShowText с именем
    previewLines = previewLines.map(line => {
      let cleanLine = line.replace(' // RESTORED_FROM_JP', '');
      // Если строка соответствует паттерну имени, применяем escapeFirstThree
      if (/^\s*ShowText\(\["(?:∾<∾∾C\[6\]|\\n<\\C\[6\]).*?\\C\[0\]>/.test(cleanLine)) {
        return cleanLine.replace(/\["(.*)"\]/, (m, p1) => '["' + escapeFirstThree(p1) + '"]');
      }
      return cleanLine;
    });
    document.getElementById('previewArea').value = previewLines.join('\n');
    // --- Сравнение с редактором ---
    if (typeof window.testModeCompare === 'function') {
      const diffs = window.testModeCompare(textBlocks, previewLines);
      const diffDiv = document.getElementById('previewDiffs');
      diffDiv.innerHTML = '';
      if (diffs && diffs.length) {
        diffs.forEach(d => {
          const el = document.createElement('div');
          el.style.color = 'red';
          el.style.marginBottom = '4px';
          el.textContent = d;
          diffDiv.appendChild(el);
        });
      }
    }
    window.updatePreviewErrors();
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

// === Обновление списка ошибок под предпросмотром ===
window.updatePreviewErrors = function() {
  const diffsDiv = document.getElementById('previewDiffs');
  if (!window.textBlocks || window.textBlocks.length === 0) {
    diffsDiv.innerHTML = '';
    return;
  }
  const errors = [];
  window.textBlocks.forEach((block, i) => {
    if (block.type === 'ShowText' || block.type === undefined) {
      const info = window.getGameTextInfo(block.text);
      const visibleText = info.rawGameText
        .replace(/<∾∾C\[\d+\](?:.*?)∾∾C\[\d+\]>/g, '')
        .replace(/∾∾C\[\d+\]/g, '')
        .replace(/C\[\d+\]/g, '')
        .replace(/∾/g, '')
        .replace(/∿/g, '')
        .trim();
      const len = visibleText.length;
      if (len > 50) {
        errors.push({
          idx: block.idx,
          label: block.idx !== undefined ? `строка ${block.idx+1}` : '[продолжение]',
          type: 'ShowText',
          reason: `Превышен лимит символов: ${len} > 50`
        });
      }
      if (info.isCorrupted) {
        errors.push({
          idx: block.idx,
          label: block.idx !== undefined ? `строка ${block.idx+1}` : '[продолжение]',
          type: 'ShowText',
          reason: 'Повреждён тег имени (<∾∾C[6]...∾∾C[0]>) или синтаксис строки'
        });
      }
    }
  });
  if (errors.length === 0) {
    diffsDiv.innerHTML = '<span style="color:#393">Ошибок не обнаружено.</span>';
    return;
  }
  let html = '<b>Ошибки в строках:</b><ul style="color:#b00; margin-top:4px;">';
  errors.forEach(err => {
    html += `<li><b>${err.label}</b> (${err.type}): ${err.reason}</li>`;
  });
  html += '</ul>';
  diffsDiv.innerHTML = html;
};

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
    window.updatePreviewErrors();
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
              // Для всех остальных команд, которые совпали
            okLines++;
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
