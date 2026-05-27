// debug_batch_mode.js
// Режим отладки пакетной обработки с детальным логированием проверки ошибок

// Глобальная переменная для хранения логов
window.debugLogs = [];

// Функция для добавления лога
function addDebugLog(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  window.debugLogs.push({ timestamp, message, type });
  console.log(`[${type.toUpperCase()}] ${timestamp} - ${message}`);
}

// Функция для вывода всех логов
function printDebugLogs() {
  console.log('\n=== ДЕТАЛЬНЫЙ ЛОГ ПРОВЕРКИ ===');
  window.debugLogs.forEach(log => {
    const prefix = log.type === 'error' ? '[ОШИБКА]' : log.type === 'warning' ? '[ПРЕДУПРЕЖДЕНИЕ]' : '[ИНФО]';
    console.log(`${prefix} ${log.timestamp} - ${log.message}`);
  });
  console.log('=== КОНЕЦ ЛОГА ===\n');
}

// Функция для очистки логов
function clearDebugLogs() {
  window.debugLogs = [];
}

// Очистка логов перед началом
clearDebugLogs();
addDebugLog('Инициализация режима отладки пакетной обработки');

// === ТЕСТОВЫЙ БЛОК ДЛЯ ПРОВЕРКИ ОШИБОК ===
const testBlock = `
FadeinScreen([])
ShowTextAttributes(["iriasu_fc4", 0, 0, 2])
ShowText(["\\\\n<\\\\C[6]Илиас\\\\C[0]>Вот и славно, цель достигнута."])
ShowText(["Теперь вернёмся к Промештейн."])
ShowTextAttributes(["", 0, 0, 2])
ShowText(["Мы уничтожили врата, и теперь враг не сможет"])
ShowTextAttributes(["", 0, 0, 2]) #+
ShowText(["вторгаться."]) #+
ShowText(["Но сама Сингулярность, источник проблемы, всё ещё"])
ShowText(["в строю."]) #+
ShowTextAttributes(["", 0, 0, 2])
ShowText(["Нельзя сидеть и ждать, пока она предпримет что-то"])
ShowTextAttributes(["", 0, 0, 2]) #+
ShowText(["новое. "]) #+
ShowText(["Поговорим с Промештейн и решим, что делать"])
ShowText(["дальше..."]) #+
FadeoutBGM([1])
FadeoutScreen([])
`;

addDebugLog('Загружен тестовый блок для проверки ошибок');

// === ФУНКЦИЯ ДЛЯ ДЕТАЛЬНОЙ ПРОВЕРКИ С ЛОГИРОВАНИЕМ ===
window.checkForLineLevelErrorsWithLogging = function (ruLines, optionalJpLines) {
  addDebugLog('Начало проверки файла на ошибки');
  addDebugLog(`Количество строк в файле: ${ruLines ? ruLines.length : 0}`);

  const errors = [];
  if (!ruLines || ruLines.length === 0) {
    addDebugLog('Файл пуст или не загружен', 'warning');
    return errors;
  }

  // === 1. ПАРСИНГ ФАЙЛА ===
  addDebugLog('Этап 1: Парсинг файла');
  const tempBlocks = [];
  const textCmdRegex = /^\s*ShowText\(\["([\s\S]*?)"\]\)(.*)/;
  const showChoicesRegex = /^\s*ShowChoices\(\[\[(.*)\],\s*(\d+)\]\)/;
  const whenRegex = /^\s*When\(\[(\d+),\s*"(.*)"\]\)/;
  const otherRegex = /^\s*(\w+)\(\[([\s\S]*?)\]\)(.*)/;
  const nameValueRegex = /^\s*(\w+)\s*=\s*"(.*)"$/;

  ruLines.forEach((line, idx) => {
    if (/^\s*Display Name\s*=/.test(line)) {
      addDebugLog(`Строка ${idx + 1}: Пропущена (Display Name)`);
      return;
    }

    let match;
    if ((match = line.match(textCmdRegex))) {
      const textContent = match[1];
      const trailingContent = match[2] || '';
      const hasIgnoreMarker = /##/.test(trailingContent);
      tempBlocks.push({ 
        text: textContent, 
        type: 'ShowText', 
        originalIdx: idx, 
        line: line, 
        hasIgnoreMarker: hasIgnoreMarker, 
        trailingContent: trailingContent 
      });
      addDebugLog(`Строка ${idx + 1}: ShowText - "${textContent.substring(0, 30)}..." (игнор: ${hasIgnoreMarker})`);
    } else if ((match = line.match(showChoicesRegex))) {
      let choicesText = match[1];
      const choices = choicesText.split(/\s*\|\s*/).map(c => c.replace(/^"|"$/g, ''));
      tempBlocks.push({ 
        text: choices.join(' | '), 
        type: 'ShowChoices', 
        originalIdx: idx, 
        choices: choices, 
        defaultChoice: parseInt(match[2]), 
        line: line 
      });
      addDebugLog(`Строка ${idx + 1}: ShowChoices - ${choices.length} вариантов`);
    } else if ((match = line.match(whenRegex))) {
      tempBlocks.push({ 
        text: match[2], 
        type: 'When', 
        originalIdx: idx, 
        choiceIndex: parseInt(match[1]), 
        line: line 
      });
      addDebugLog(`Строка ${idx + 1}: When - выбор ${match[1]}`);
    } else if ((match = line.match(otherRegex))) {
      const commandType = match[1];
      const commandText = match[2];
      const trailingContent = match[3] || '';
      const translatableCommands = ['Script', 'ScriptMore', 'Label', 'JumpToLabel', 'Name', 'ShowTextAttributes', 'ChangeActorName'];
      if (translatableCommands.includes(commandType)) {
        tempBlocks.push({ 
          text: commandText, 
          type: commandType, 
          originalIdx: idx, 
          line: line, 
          trailingContent: trailingContent 
        });
        addDebugLog(`Строка ${idx + 1}: ${commandType} - "${commandText.substring(0, 30)}..."`);
      }
    } else if ((match = line.match(nameValueRegex))) {
      const commandType = match[1];
      const commandText = match[2];
      if (commandType === 'Name') {
        tempBlocks.push({ 
          text: commandText, 
          type: commandType, 
          originalIdx: idx, 
          line: line 
        });
        addDebugLog(`Строка ${idx + 1}: Name = "${commandText}"`);
      }
    }
  });

  addDebugLog(`Парсинг завершен. Найдено блоков: ${tempBlocks.length}`);

  // === ФОРМИРОВАНИЕ textBlocks ===
  addDebugLog('Этап 2: Формирование текстовых блоков');
  const textBlocks = [];
  for (let i = 0; i < tempBlocks.length; i++) {
    const currentBlock = tempBlocks[i];
    const rawText = currentBlock.text.replace(/^"(.*)"$/, '$1');
    const hasPlus = /#\+/.test(currentBlock.trailingContent || '');

    if (currentBlock.type === 'ShowTextAttributes') {
      textBlocks.push({ 
        text: currentBlock.text, 
        type: 'ShowTextAttributes', 
        originalIdx: currentBlock.originalIdx, 
        idx: currentBlock.originalIdx, 
        line: currentBlock.line, 
        generated: hasPlus, 
        manualPlus: hasPlus 
      });
      addDebugLog(`Блок ${i}: ShowTextAttributes (#+: ${hasPlus})`);
      continue;
    }

    if (window.isNameBlock && window.isNameBlock(rawText) && currentBlock.type === 'ShowText') {
      let combinedText = currentBlock.text;
      const specialTemplateRegex = /(^\\n|^∾∾\\n)<[\\∾]{2}C\[\d+\].*[\\∾]{2}C\[0\]>\((Уровень симпатии:|Найдено мастеров:).*?\)$/;
      if (specialTemplateRegex.test(rawText.trim()) && i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText') {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
        addDebugLog(`Блок ${i}: Объединен со следующим (специальный шаблон)`);
      } else if (i + 1 < tempBlocks.length && tempBlocks[i + 1].type === 'ShowText' && window.isNameBlock && !window.isNameBlock(tempBlocks[i + 1].text.replace(/^"(.*)"$/, '$1'))) {
        combinedText += '\n' + tempBlocks[i + 1].text;
        i++;
        addDebugLog(`Блок ${i}: Объединен со следующим (тег имени)`);
      }
      const finalText = combinedText.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ 
        idx: currentBlock.originalIdx, 
        text: finalText, 
        type: 'ShowText', 
        line: currentBlock.line, 
        hasIgnoreMarker: currentBlock.hasIgnoreMarker, 
        manualPlus: hasPlus 
      });
      addDebugLog(`Блок ${i}: ShowText с именем - "${finalText.substring(0, 30)}..."`);
    } else {
      const text = rawText.replace(/\\n/g, '\n').replace(/\\/g, '∾');
      textBlocks.push({ 
        idx: currentBlock.originalIdx, 
        text: text, 
        type: currentBlock.type, 
        line: currentBlock.line, 
        hasIgnoreMarker: currentBlock.hasIgnoreMarker, 
        manualPlus: hasPlus 
      });
      addDebugLog(`Блок ${i}: ${currentBlock.type} - "${text.substring(0, 30)}..."`);
    }
  }

  addDebugLog(`Формирование блоков завершено. Итого блоков: ${textBlocks.length}`);

  // === 2. ЕДИНЫЙ ЦИКЛ ПРОВЕРКИ ОШИБОК ===
  addDebugLog('Этап 3: Проверка ошибок');
  let checkedIndices_long = new Set();
  
  textBlocks.forEach((block, i) => {
    addDebugLog(`\n--- Проверка блока ${i} (тип: ${block.type}, индекс: ${block.idx}) ---`);

    // --- Проверка: Длинные диалоги ---
    if (block.type === 'ShowText' && !checkedIndices_long.has(i)) {
      addDebugLog(`  Проверка длинных диалогов для блока ${i}`);
      let lineCount = 0;
      let blockIndices = [];
      let counterIndex = i;
      while (counterIndex < textBlocks.length) {
        const currentDialogueBlock = textBlocks[counterIndex];
        if (counterIndex > i) {
          const prevBlock = textBlocks[counterIndex - 1];
          if (currentDialogueBlock.type !== 'ShowText' || 
              (window.isNameBlock && window.isNameBlock(currentDialogueBlock.text)) || 
              (currentDialogueBlock.idx !== undefined && prevBlock.idx !== undefined && (currentDialogueBlock.idx - prevBlock.idx > 1))) {
            addDebugLog(`    Прервано на блоке ${counterIndex}: тип не ShowText или есть разрыв`);
            break;
          }
        }
        lineCount++;
        blockIndices.push(counterIndex);
        checkedIndices_long.add(counterIndex);
        counterIndex++;
      }
      addDebugLog(`  Найдено строк в диалоге: ${lineCount}`);
      
      if (lineCount >= 5) {
        addDebugLog(`  ОШИБКА: Слишком длинный диалог (${lineCount} строк)`, 'error');
        blockIndices.forEach(errorIndex => {
          const errorBlock = textBlocks[errorIndex];
          if (!errorBlock.hasIgnoreMarker) {
            errors.push({
              label: `строка ${errorBlock.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: `Часть слишком длинного диалога (${lineCount} строк). Требуется вставка ShowTextAttributes.`
            });
            addDebugLog(`    Добавлена ошибка для строки ${errorBlock.idx + 1}`);
          }
        });
      }
    }

    // --- Проверка: Ошибка тега имени ---
    if (block.type === 'ShowText') {
      addDebugLog(`  Проверка тега имени`);
      const hasNameTag = /<∾∾C\[6\].*?∾∾C\[0\]>/.test(block.text);
      if (hasNameTag) {
        addDebugLog(`    Тег имени найден`);
        const isMissingPrefix = !/^∾\n/.test(block.text);
        if (isMissingPrefix && !block.hasIgnoreMarker) {
          addDebugLog(`    ОШИБКА: Отсутствует префикс \\n`, 'error');
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка тега имени',
            reason: 'Тег имени должен начинаться с префикса `\\n` (в редакторе `∾` и перенос строки).'
          });
        } else {
          addDebugLog(`    Префикс корректен`);
        }
      } else {
        addDebugLog(`    Тег имени не найден`);
      }
    }

    // --- ПРОВЕРКИ ShowTextAttributes (СТРОГО ОДИН БЛОК) ---
    if (block.type === 'ShowTextAttributes' && (block.manualPlus || block.generated)) {
      addDebugLog(`  Проверка ShowTextAttributes (#+: ${block.manualPlus}, generated: ${block.generated})`);
      let isDangling = false;
      let nextRelevantBlock = null;

      // Ищем следующий значимый блок текста
      addDebugLog(`    Поиск следующего блока текста...`);
      for (let j = i + 1; j < textBlocks.length; j++) {
        let nextBlock = textBlocks[j];
        if (nextBlock.isDeleted || nextBlock.type === 'EmptyLine' || nextBlock.type === 'Comment') continue;
        if (nextBlock.type === 'ShowText') {
          nextRelevantBlock = nextBlock;
          addDebugLog(`    Найден следующий ShowText на индексе ${j}`);
          break;
        }
      }

      if (!nextRelevantBlock) {
        addDebugLog(`    Следующий ShowText не найден`);
      }

      // А. Проверка на висячий атрибут
      if (!nextRelevantBlock && !block.hasIgnoreMarker) {
        addDebugLog(`    ОШИБКА: Висячий атрибут`, 'error');
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка компоновки',
          reason: 'Висячий атрибут ShowTextAttributes. После него нет диалога.'
        });
        isDangling = true;
      } else if (!nextRelevantBlock) {
        addDebugLog(`    Висячий атрибут (игнорируется из-за маркера ##)`);
      }

      // Б. Проверка на разрыв предложения
      if (!isDangling && (block.manualPlus || block.generated)) {
        addDebugLog(`    Проверка на разрыв предложения...`);
        let prevShowText = null;
        for (let j = i - 1; j >= 0; j--) {
          if (textBlocks[j].type === 'ShowText') {
            prevShowText = textBlocks[j];
            addDebugLog(`    Найден предыдущий ShowText на индексе ${j}`);
            break;
          }
          if (textBlocks[j].type !== 'ShowTextAttributes') break;
        }
        
        if (prevShowText) {
          const text = prevShowText.text || '';
          const hasTerminalPunctuation = /[.!?…"»][\s]*$/.test(text);
          addDebugLog(`    Текст заканчивается на знак препинания: ${hasTerminalPunctuation}`);
          
          if (!hasTerminalPunctuation && !block.hasIgnoreMarker) {
            addDebugLog(`    Проверка количества строк ShowText...`);
            let showTextCount = 0;
            for (let j = i - 1; j >= 0; j--) {
              const prevBlock = textBlocks[j];
              if (prevBlock.isDeleted) continue;
              if (prevBlock.type === 'ShowTextAttributes') break; 
              if (prevBlock.type === 'ShowText') showTextCount++;
              if (prevBlock.type !== 'ShowText' && prevBlock.type !== 'ShowTextAttributes') break;
            }
            addDebugLog(`    Количество строк ShowText: ${showTextCount}`);
            
            if (showTextCount < 4) {
              addDebugLog(`    ОШИБКА: Разрывает незаконченное предложение`, 'error');
              errors.push({
                label: `строка ${block.idx + 1}`,
                type: 'Ошибка компоновки',
                reason: 'Атрибут ShowTextAttributes разрывает незаконченное предложение.'
              });
            } else {
              addDebugLog(`    Вынужденный разрыв (4+ строк), ошибки нет`);
            }
          }
        } else {
          addDebugLog(`    Предыдущий ShowText не найден`);
        }
      }

      // В. Проверка на отсутствие тега имени после STA / мусорный тег
      if (!isDangling && nextRelevantBlock && window.isNameBlock && !window.isNameBlock(nextRelevantBlock.text)) {
        addDebugLog(`    Проверка на отсутствие тега имени после STA...`);
        let prevBlock = null;
        let k = i - 1;
        while (k >= 0) {
          prevBlock = textBlocks[k];
          if (prevBlock) break; 
          k--;
        }

        if (prevBlock && prevBlock.type === 'ShowText') {
          addDebugLog(`    Предыдущий блок: ShowText (#+: ${prevBlock.manualPlus})`);
          
          if (prevBlock.manualPlus && nextRelevantBlock.manualPlus) {
            if (!block.generated && !block.hasIgnoreMarker) {
              addDebugLog(`    ОШИБКА: Мусорный STA между продолжениями`, 'error');
              errors.push({
                label: `строка ${block.idx + 1}`,
                type: 'Ошибка компоновки',
                reason: 'Этот ShowTextAttributes (#+) находится между двумя строками-продолжениями (#+) и будет удален.'
              });
            }
          }
          
          if (window.isNameBlock && window.isNameBlock(prevBlock.text) && !block.hasIgnoreMarker) {
            addDebugLog(`    ОШИБКА: STA сразу после строки с именем`, 'error');
            errors.push({
              label: `строка ${block.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: 'Этот ShowTextAttributes (#+) находится сразу после строки с именем и будет удален.'
            });
          }
        }

        addDebugLog(`    Поиск якоря и родительского блока...`);
        let isNarrationBlock = true; 
        let anchorStaIndex = -1;
        k = i - 1;
        while (k >= 0) {
          const prev = textBlocks[k];
          if (prev.type === 'ShowTextAttributes') {
            if (!prev.manualPlus && !prev.generated) {
              anchorStaIndex = k;
              addDebugLog(`    Якорь найден на индексе ${k}`);
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

        let parentBlock = null;
        if (anchorStaIndex !== -1) {
          k = anchorStaIndex + 1;
          while (k < i) {
            const tempBlock = textBlocks[k];
            if (tempBlock.type === 'ShowText' && !tempBlock.manualPlus && !tempBlock.generated) {
              parentBlock = tempBlock;
              addDebugLog(`    Родительский блок найден на индексе ${k}`);
              break;
            }
            if (tempBlock.type === 'ShowTextAttributes' && tempBlock.manualPlus) {
              k++;
              continue;
            }
            break;
          }
        }

        if (parentBlock) {
          if (window.isNameBlock && window.isNameBlock(parentBlock.text)) {
            isNarrationBlock = false; 
            addDebugLog(`    Родительский блок содержит имя -> диалог`);
          } else {
            isNarrationBlock = true; 
            addDebugLog(`    Родительский блок без имени -> повествование`);
          }
        } else {
          addDebugLog(`    Родительский блок не найден -> повествование`);
        }

        if (!isNarrationBlock) {
          if (!nextRelevantBlock.hasIgnoreMarker) {
            addDebugLog(`    ОШИБКА: Отсутствует тег имени после STA`, 'error');
            errors.push({
              label: `строка ${nextRelevantBlock.idx + 1}`,
              type: 'Ошибка компоновки',
              reason: 'Эта строка должна содержать тег имени (\\n<\\C[6]Имя\\C[0]>), так как она идет после отмеченной (#+) ShowTextAttributes.'
            });
          }
        }
      }
    }

    // --- Остальные проверки (лимит, японский, экранирование) ---
    if (block.type === 'ShowText') {
      addDebugLog(`  Проверка длины строки...`);
      if (window.getVisibleTextMetrics) {
        const metrics = window.getVisibleTextMetrics(block.text);
        addDebugLog(`    Длина: ${metrics.length} символов`);
        if (metrics.length > 50 && !block.hasIgnoreMarker) {
          addDebugLog(`    ОШИБКА: Превышен лимит символов`, 'error');
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка строки',
            reason: `Превышен лимит символов: ${metrics.length} > 50`
          });
        }
      }
      
      addDebugLog(`  Проверка на японский текст...`);
      const isJapanesePresent = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(block.text);
      if (!block.hasIgnoreMarker && isJapanesePresent) {
        addDebugLog(`    Обнаружен японский текст`, 'warning');
        let isAnError = true;
        if (block.type === 'Script' || block.type === 'ScriptMore') {
          const isCodeLikeRegex = /[=\/~_()\[\]\.\+\-]|\b(if|else|for|while|return|function|var|let|const|script)\b|e\./i;
          if (isCodeLikeRegex.test(block.text)) {
            isAnError = false;
            addDebugLog(`    Похож на код, ошибка игнорируется`);
          }
        }
        if (isAnError) {
          addDebugLog(`    ОШИБКА: Японский текст`, 'error');
          errors.push({
            label: `строка ${block.idx + 1}`,
            type: 'Ошибка строки',
            reason: 'Обнаружен японский текст'
          });
        }
      }
      
      addDebugLog(`  Проверка экранирования тегов...`);
      const brokenCodeRegex = /∾∾[IC]\[\d+\].*?(?<!∾)∾C\[0\]/;
      if (brokenCodeRegex.test(block.text) && !block.hasIgnoreMarker) {
        addDebugLog(`    ОШИБКА: Неправильно экранированный тег`, 'error');
        errors.push({
          label: `строка ${block.idx + 1}`,
          type: 'Ошибка кода',
          reason: 'Неправильно экранирован закрывающий тег. Вероятно, вместо `∾∾C[0]` используется `∾C[0]`.'
        });
      }
    }
  });

  addDebugLog(`Проверка завершена. Найдено ошибок: ${errors.length}`);
  return errors;
};

// === ФУНКЦИЯ ДЛЯ ЗАПУСКА ТЕСТА ===
window.runDebugTest = function() {
  addDebugLog('=== ЗАПУСК ТЕСТОВОЙ ПРОВЕРКИ ===');
  
  // Разбиваем тестовый блок на строки
  const testLines = testBlock.trim().split('\n');
  addDebugLog(`Тестовый блок содержит ${testLines.length} строк`);
  
  // Запускаем проверку с логированием
  const errors = window.checkForLineLevelErrorsWithLogging(testLines);
  
  // Выводим результаты
  console.log('\n=== РЕЗУЛЬТАТЫ ПРОВЕРКИ ===');
  console.log(`Всего найдено ошибок: ${errors.length}`);
  errors.forEach((err, idx) => {
    console.log(`\nОшибка ${idx + 1}:`);
    console.log(`  Строка: ${err.label}`);
    console.log(`  Тип: ${err.type}`);
    console.log(`  Причина: ${err.reason}`);
  });
  
  // Выводим детальный лог
  printDebugLogs();
  
  return errors;
};

// Автоматический запуск теста при загрузке файла
if (typeof window !== 'undefined') {
  addDebugLog('Скрипт загружен. Для запуска теста вызовите window.runDebugTest()');
  console.log('=== РЕЖИМ ОТЛАДКИ ПАКЕТНОЙ ОБРАБОТКИ ===');
  console.log('Для запуска теста вызовите: window.runDebugTest()');
  console.log('Для просмотра логов вызовите: printDebugLogs()');
  console.log('Для очистки логов вызовите: clearDebugLogs()');
}
