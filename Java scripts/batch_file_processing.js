let ruFiles = {};
let jpFiles = {};
let batchResults = [];
let batchErrorTypes = {}; // Хранит все типы ошибок и их количество
let batchFixOptions = {}; // Хранит выбранные опции исправления // Сохраняем результаты проверки для последующего исправления

// Функции для управления панелью отчёта
function clearBatchReport() {
  const reportPanel = document.getElementById('batchReportPanel');
  const reportContent = document.getElementById('batchReportContent');
  if (reportContent) reportContent.innerHTML = '';
  if (reportPanel) reportPanel.style.display = 'none';
}

function addBatchReportLine(text, type = 'info') {
  const reportPanel = document.getElementById('batchReportPanel');
  const reportContent = document.getElementById('batchReportContent');
  if (!reportContent) return;

  // Показываем панель при первом добавлении строки
  if (reportPanel && reportPanel.style.display === 'none') {
    reportPanel.style.display = 'block';
  }

  const line = document.createElement('div');

  // Для пустых строк делаем минимальную высоту, для остальных - отступ
  if (text.trim() === '') {
    line.style.height = '8px';
  } else {
    line.style.marginBottom = '4px';
  }

  // Цвет в зависимости от типа сообщения
  if (type === 'error') {
    line.style.color = '#d00';
    line.style.fontWeight = 'bold';
  } else if (type === 'success') {
    line.style.color = '#0a0';
  } else if (type === 'warning') {
    line.style.color = '#b60';
  } else {
    line.style.color = '#333';
  }

  line.textContent = text;
  reportContent.appendChild(line);

  // Автопрокрутка вниз
  reportContent.scrollTop = reportContent.scrollHeight;
}

function handleFolderInput(event, type) {
  const files = event.target.files;
  for (let file of files) {
    if (!file.name.endsWith('.txt')) continue;
    if (type === 'ru') ruFiles[file.name] = file;
    else if (type === 'jp') jpFiles[file.name] = file;
  }
  renderBatchFileList();
}

function renderBatchFileList() {
  const listDiv = document.getElementById('batchFileList');
  if (!listDiv) return;
  listDiv.innerHTML = '';

  // Получаем значение чекбокса "Скрывать файлы без сопоставления"
  const hideUnmatchedFiles = document.getElementById('batchHideUnmatchedFiles')?.checked;

  // Собираем все уникальные имена файлов из обеих папок
  const allFileNames = new Set();
  Object.keys(ruFiles).forEach(name => allFileNames.add(name));
  Object.keys(jpFiles).forEach(name => allFileNames.add(name));

  // Сортируем и отображаем все файлы
  Array.from(allFileNames).sort().forEach(fileName => {
    const hasRU = !!ruFiles[fileName];
    const hasJP = !!jpFiles[fileName];

    // Если чекбокс активен и файл без сопоставления — пропускаем
    if (hideUnmatchedFiles && (!hasRU || !hasJP)) {
      return;
    }

    const div = document.createElement('div');
    div.style.padding = '4px 8px';
    div.style.marginBottom = '2px';
    div.style.borderRadius = '4px';

    if (hasRU && hasJP) {
      // Файл есть в обеих папках
      div.textContent = fileName;
      div.style.color = '#222';
      div.style.background = '#f0f8ff';
      div.style.border = '1px solid #ccc';
    } else if (hasRU && !hasJP) {
      // Файл есть только в русской папке
      div.textContent = fileName + ' — нет японского файла для сопоставления';
      div.style.color = '#b00';
      div.style.background = '#fff0f0';
      div.style.border = '1px solid #e66';
    } else if (!hasRU && hasJP) {
      // Файл есть только в японской папке
      div.textContent = fileName + ' — нет русского файла для сопоставления';
      div.style.color = '#b00';
      div.style.background = '#fff0f0';
      div.style.border = '1px solid #e66';
    }

    listDiv.appendChild(div);
  });

  // Добавляем статистику
  const ruCount = Object.keys(ruFiles).length;
  const jpCount = Object.keys(jpFiles).length;
  const matchedCount = Array.from(allFileNames).filter(name => ruFiles[name] && jpFiles[name]).length;

  const statsDiv = document.createElement('div');
  statsDiv.style.marginTop = '15px';
  statsDiv.style.padding = '10px';
  statsDiv.style.background = '#f9f9f9';
  statsDiv.style.border = '1px solid #ddd';
  statsDiv.style.borderRadius = '6px';
  statsDiv.style.fontSize = '14px';
  statsDiv.innerHTML = `
    <strong>Статистика:</strong><br>
    • Файлов в русской папке: ${ruCount}<br>
    • Файлов в японской папке: ${jpCount}<br>
    • Файлов с сопоставлением: ${matchedCount}<br>
    • Файлов без сопоставления: ${allFileNames.size - matchedCount}
  `;
  listDiv.appendChild(statsDiv);
}

function showBatchTab() {
  document.getElementById('tabContentEditor').style.display = 'none';
  document.getElementById('tabContentPreview').style.display = 'none';
  document.getElementById('tabContentBatch').style.display = '';
  document.getElementById('tabEditor').style.fontWeight = 'normal';
  document.getElementById('tabPreview').style.fontWeight = 'normal';
  document.getElementById('tabBatch').style.fontWeight = 'bold';
}

function readFileAsLines(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.replace(/\r/g, '').split('\n'));
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

function getFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

// Функция для создания UI с чекбоксами выбора типов ошибок
function createErrorTypeCheckboxes() {
  const checkboxPanel = document.createElement('div');
  checkboxPanel.id = 'batchErrorTypeCheckboxes';
  checkboxPanel.style.marginTop = '15px';
  checkboxPanel.style.padding = '12px';
  checkboxPanel.style.background = '#f5f5f5';
  checkboxPanel.style.border = '1px solid #ddd';
  checkboxPanel.style.borderRadius = '6px';
  
  const title = document.createElement('div');
  title.textContent = 'Выберите типы ошибок для автоматического исправления:';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.color = '#333';
  checkboxPanel.appendChild(title);
  
  // Определяем поддерживаемые типы исправлений
  const supportedFixes = {
    'Структурные ошибки': true,  // restoreRussianStructureWithMissing
    'Ошибка форматирования (лишние пробелы)': true,  // trimEnd
    'Ошибка шаблона': true,  // fixAffectionTemplates
    'Ошибка компоновки (ShowTextAttributes)': true,  // частично поддерживается
    'Ошибка строки (длина > 50)': false,  // не поддерживается автоматически
    'Ошибка строки (японский текст)': false,  // не поддерживается автоматически
    'Ошибка кода (неправильные теги)': false,  // не поддерживается автоматически
    'Ошибка компоновки (огрызки в подарках)': false,  // не поддерживается автоматически
    'Ошибка компоновки (позиция ShowTextAttributes)': false  // не поддерживается автоматически
  };
  
  // Создаём чекбоксы для каждого типа ошибки
  Object.keys(batchErrorTypes).forEach(errorType => {
    const isSupported = Object.keys(supportedFixes).some(key => errorType.includes(key.split('(')[0].trim()));
    const count = batchErrorTypes[errorType];
    
    const checkboxDiv = document.createElement('div');
    checkboxDiv.style.marginBottom = '8px';
    checkboxDiv.style.display = 'flex';
    checkboxDiv.style.alignItems = 'center';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `fix_${errorType}`;
    checkbox.checked = isSupported; // По умолчанию отмечены только поддерживаемые
    checkbox.disabled = !isSupported; // Неподдерживаемые отключены
    checkbox.style.marginRight = '8px';
    
    // Сохраняем выбор
    checkbox.addEventListener('change', () => {
      batchFixOptions[errorType] = checkbox.checked;
    });
    batchFixOptions[errorType] = checkbox.checked;
    
    const label = document.createElement('label');
    label.htmlFor = `fix_${errorType}`;
    label.textContent = `${errorType} (${count})`;
    label.style.cursor = isSupported ? 'pointer' : 'default';
    
    if (!isSupported) {
      label.style.textDecoration = 'line-through';
      label.style.color = '#999';
      label.title = 'Этот тип ошибки пока не поддерживается для автоматического исправления';
    }
    
    checkboxDiv.appendChild(checkbox);
    checkboxDiv.appendChild(label);
    checkboxPanel.appendChild(checkboxDiv);
  });
  
  return checkboxPanel;
}

// Функция для создания элементов управления исправлением
function createFixControls() {
  const batchContent = document.getElementById('tabContentBatch');

  // Удаляем старые элементы управления если они есть
  const oldFixControls = document.getElementById('batchFixControls');
  if (oldFixControls) {
    oldFixControls.remove();
  }

  // Создаем контейнер для элементов управления исправлением
  const fixControls = document.createElement('div');
  fixControls.id = 'batchFixControls';
  fixControls.style.marginBottom = '20px';
  fixControls.style.padding = '15px';
  fixControls.style.background = '#f0f8ff';
  fixControls.style.border = '1px solid #ccc';
  fixControls.style.borderRadius = '8px';

  // Заголовок
  const title = document.createElement('h3');
  title.textContent = 'Исправление файлов с ошибками';
  title.style.margin = '0 0 15px 0';
  title.style.color = '#333';
  fixControls.appendChild(title);

  // Кнопка исправления
  const fixBtn = document.createElement('button');
  fixBtn.textContent = 'Исправить все файлы с ошибками';
  fixBtn.id = 'batchFixBtn';
  fixBtn.className = 'control-btn';
  fixBtn.style.padding = '10px 20px';
  fixBtn.style.fontSize = '16px';
  fixBtn.style.fontWeight = 'bold';
  fixBtn.style.background = '#4CAF50';
  fixBtn.style.color = 'white';
  fixBtn.style.border = 'none';
  fixBtn.style.borderRadius = '6px';
  fixBtn.style.cursor = 'pointer';
  fixBtn.onclick = batchFixAllFiles;

  fixControls.appendChild(fixBtn);

  // Добавляем чекбоксы для выбора типов ошибок
  if (Object.keys(batchErrorTypes).length > 0) {
    const checkboxPanel = createErrorTypeCheckboxes();
    fixControls.appendChild(checkboxPanel);
  }

  // Создаем панель отчета внутри контейнера исправления
  const reportPanel = document.createElement('div');
  reportPanel.id = 'batchReportPanel';
  reportPanel.style.display = 'none';
  reportPanel.style.marginTop = '15px';
  reportPanel.style.padding = '12px';
  reportPanel.style.background = '#fff';
  reportPanel.style.border = '1px solid #aaa';
  reportPanel.style.borderRadius = '6px';
  reportPanel.style.maxHeight = '300px';
  reportPanel.style.overflowY = 'auto';

  const reportTitle = document.createElement('h4');
  reportTitle.textContent = 'Отчет об исправлении файлов';
  reportTitle.style.margin = '0 0 8px 0';
  reportTitle.style.color = '#333';
  reportTitle.style.fontSize = '14px';

  const reportContent = document.createElement('div');
  reportContent.id = 'batchReportContent';
  reportContent.style.fontFamily = 'monospace';
  reportContent.style.fontSize = '12px';
  reportContent.style.lineHeight = '1.6';

  reportPanel.appendChild(reportTitle);
  reportPanel.appendChild(reportContent);
  fixControls.appendChild(reportPanel);

  // Добавляем элементы управления в начало контейнера (вверху)
  batchContent.insertBefore(fixControls, batchContent.firstChild);
}

// Функция для исправления всех файлов с ошибками
async function batchFixAllFiles() {
  // --- ЭТАП 0: Получаем ВСЕ файлы с ошибками (и структурными, И линейными) ---
  const filesWithErrors = batchResults.filter(result => result.isError);

  if (filesWithErrors.length === 0) {
    clearBatchReport();
    addBatchReportLine('Нет файлов с ошибками для исправления!', 'warning');
    return;
  }

  // Очищаем панель отчета и начинаем новый отчет
  clearBatchReport();
  addBatchReportLine(`=== Начало пакетного исправления ===`);
  addBatchReportLine(`Всего файлов для обработки: ${filesWithErrors.length}`);

  // Отключаем кнопку на время обработки
  const fixBtn = document.getElementById('batchFixBtn');
  const originalText = fixBtn.textContent;
  fixBtn.textContent = 'Исправление... (0%)';
  fixBtn.disabled = true;

  let fixedCount = 0;
  let errorCount = 0;
  let totalHighPriorityErrorsFixed = 0;
  let totalLowPriorityErrorsFixed = 0;
  const fixedFiles = []; // Массив для хранения исправленных файлов
  const totalFiles = filesWithErrors.length;

  try {
    for (let i = 0; i < totalFiles; i++) {
      const result = filesWithErrors[i];
      const fileName = result.fileName;

      // Обновляем счетчик на кнопке
      fixBtn.textContent = `Исправление... (${Math.round((i / totalFiles) * 100)}%)`;

      try {
        const ruFile = ruFiles[fileName];
        const jpFile = jpFiles[fileName];

        if (!ruFile || !jpFile) {
          console.error(`Пропускаем ${fileName}: отсутствует один из файлов`);
          addBatchReportLine(`✗ ${fileName}: отсутствует один из файлов`, 'error');
          errorCount++;
          continue;
        }

        // --- УСТАНОВКА КОНТЕКСТА ФАЙЛА (Критично для generateFinalFileLines) ---
        window.loadedFileName = fileName;
        window.textBlocks = [];
        window.mapDisplayName = "";

        // Читаем содержимое файлов
        const ruLines = await readFileAsLines(ruFile);
        const jpLines = await readFileAsLines(jpFile);
        window.fullJapLines = jpLines.slice(); // Обновляем глобальный японский контекст

        let currentFixedLines = ruLines.slice(); // Начинаем с оригинальных RU строк

        // === ЭТАП 1: Исправляем СТРУКТУРНЫЕ ошибки (если они есть и выбран чекбокс) ===
        if (result.hasStructError && batchFixOptions['Структурные ошибки']) {
          console.log(`[Этап 1] Исправление структуры для: ${fileName}`);
          addBatchReportLine(`→ ${fileName}: исправление структуры...`, 'info');
          const checkResult = window.checkMapStructureMatch(jpLines.join('\n'), ruLines.join('\n'));

          let mismatchedNums = [];
          if (checkResult.grouped) {
            checkResult.grouped.forEach(ev => {
              ev.pages.forEach(page => {
                if (!page.ok && page.errors && page.errors.length > 0) {
                  mismatchedNums.push(parseInt(ev.eid));
                }
              });
            });
          }

          if (mismatchedNums.length > 0) {
            mismatchedNums = [...new Set(mismatchedNums)];
            // Запускаем структурный фиксер
            currentFixedLines = window.restoreRussianStructureWithMissing(currentFixedLines, jpLines, mismatchedNums);
          }
        }

        // === ЭТАП 2: Исправляем ЛИНЕЙНЫЕ ошибки с ПРИОРИТЕТОМ ===
        // Загружаем строки (оригинальные или исправленные на этапе 1)
        // в "виртуальный редактор" для запуска линейных фиксеров.
        console.log(`[Этап 2] Исправление линейных ошибок для: ${fileName}`);

        // 2a. Устанавливаем глобальное состояние, которое используют парсеры
        window.originalLines = currentFixedLines.slice(); // Парсеры читают из этого
        window.fullRusLines = currentFixedLines.slice();   // Генератор файла читает из этого
        window.fullJapLines = jpLines.slice();         // Необходимо для контекста (например, для поиска тегов)
        window.textBlocks = []; // Очищаем от данных предыдущего файла
        window.japBlocks = [];  // Очищаем от данных предыдущего файла

        // 2b. Запускаем парсеры (они заполняют window.textBlocks и window.mapDisplayName)
        // Эти функции взяты прямо из твоего HTML-файла
        window.extractTexts();
        window.extractJapaneseTexts(window.fullJapLines); // Это связывает блоки, что критично для autoFixNameTagErrors

        // === ПРИОРИТЕТ 1: Исправляем ОШИБКИ С ВЫСОКИМ ПРИОРИТЕТОМ (лишние пробелы в конце строки) ===
        // Проверяем, выбран ли чекбокс для ошибок форматирования
        const fixFormatErrors = Object.keys(batchFixOptions).some(key => key.includes('Ошибка форматирования') && batchFixOptions[key]);
        
        if (fixFormatErrors) {
          addBatchReportLine(`  → ${fileName}: проверка ошибок высокого приоритета...`, 'info');

        let highPriorityErrorsFixed = 0;
        let maxHighPriorityPasses = 3;
        let highPriorityPass = 0;

        while (highPriorityPass < maxHighPriorityPasses) {
          highPriorityPass++;

          // Проверяем ошибки высокого приоритета (лишние пробелы в конце строки)
          const highPriorityErrors = window.checkForLineLevelErrors(currentFixedLines).filter(e =>
            e.type === 'Ошибка форматирования' && e.reason.includes('лишние пробелы в конце строки')
          );

          if (highPriorityErrors.length === 0) {
            if (highPriorityPass > 1) {
              addBatchReportLine(`    ✓ Ошибки высокого приоритета исправлены за ${highPriorityPass - 1} проход(а)`, 'success');
            } else {
              addBatchReportLine(`    ✓ Ошибок высокого приоритета не обнаружено`, 'success');
            }
            break;
          }

          addBatchReportLine(`    [Проход ${highPriorityPass}] Обнаружено ${highPriorityErrors.length} ошибок высокого приоритета`, 'info');

          // Исправляем ошибки высокого приоритета
          for (let i = highPriorityErrors.length - 1; i >= 0; i--) {
            const err = highPriorityErrors[i];
            if (currentFixedLines[err.line] !== undefined) {
              // Убираем пробелы в конце строки
              let line = currentFixedLines[err.line].trimEnd();
              currentFixedLines[err.line] = line;
              highPriorityErrorsFixed++;
              totalHighPriorityErrorsFixed++;
            }
          }

          // Обновляем глобальное состояние после исправления
          window.originalLines = currentFixedLines.slice();
          window.fullRusLines = currentFixedLines.slice();

          // Перепарсим файл с исправленными ошибками
          window.textBlocks = [];
          window.extractTexts();
          window.extractJapaneseTexts(window.fullJapLines);
        }

        if (highPriorityPass >= maxHighPriorityPasses) {
          addBatchReportLine(`    [ПРЕДУПРЕЖДЕНИЕ] Достигнут лимит проходов для ошибок высокого приоритета (${maxHighPriorityPasses})`, 'warning');
        }
        } // Конец блока if (fixFormatErrors)

        // === ПРИОРИТЕТ 2: Исправляем ОШИБКИ С НИЗКИМ ПРИОРИТЕТОМ (ошибки шаблона) ===
        // Проверяем, выбран ли чекбокс для ошибок шаблона
        const fixTemplateErrors = Object.keys(batchFixOptions).some(key => key.includes('Ошибка шаблона') && batchFixOptions[key]);
        
        if (fixTemplateErrors) {
          addBatchReportLine(`  → ${fileName}: проверка ошибок низкого приоритета...`, 'info');

        // Проверяем наличие ошибок шаблона
        const templateErrors = window.checkForLineLevelErrors(currentFixedLines).filter(e =>
          e.type === 'Ошибка шаблона'
        );

        if (templateErrors.length > 0) {
          addBatchReportLine(`    Обнаружено ${templateErrors.length} ошибок шаблона, исправляем...`, 'info');

          // Используем настоящую функцию исправления шаблонов из restore-mode.js
          // Для этого нужно временно установить глобальные переменные и вызвать функцию
          try {
            // Устанавливаем глобальные переменные для работы fixAffectionTemplates
            window.originalLines = currentFixedLines.slice();
            window.fullRusLines = currentFixedLines.slice();
            window.fullJapLines = jpLines.slice();

            // Очищаем и пересоздаем textBlocks
            window.textBlocks = [];
            window.extractTexts();
            window.extractJapaneseTexts(window.fullJapLines);

            // Проверяем, есть ли функция fixAffectionTemplates
            if (typeof window.fixAffectionTemplates === 'function') {
              // Сохраняем текущее состояние для подсчета изменений
              const initialTextBlocksLength = window.textBlocks ? window.textBlocks.length : 0;

              // Вызываем функцию исправления шаблонов
              window.fixAffectionTemplates();

              // Подсчитываем количество исправленных шаблонов
              let fixedTemplates = 0;
              if (window.textBlocks) {
                // Считаем количество удаленных блоков (isDeleted = true)
                fixedTemplates = window.textBlocks.filter(block => block.isDeleted).length;
              }

              // Добавляем к общему счетчику
              totalLowPriorityErrorsFixed += fixedTemplates;

              if (fixedTemplates > 0) {
                addBatchReportLine(`    ✓ Исправлено ${fixedTemplates} шаблонов привязанности`, 'success');
              } else {
                addBatchReportLine(`    ✓ Исправлены ошибки форматирования шаблонов`, 'success');
              }

              // Обновляем currentFixedLines из измененного состояния
              const finalLines = window.generateFinalFileLines();
              currentFixedLines = finalLines.slice();
            } else {
              addBatchReportLine(`    [ПРЕДУПРЕЖДЕНИЕ] Функция fixAffectionTemplates не найдена, пропускаем исправление шаблонов`, 'warning');
            }
          } catch (error) {
            addBatchReportLine(`    [ОШИБКА] Не удалось исправить шаблоны: ${error.message}`, 'error');
            console.error("Ошибка при исправлении шаблонов:", error);
          }
        } else {
          addBatchReportLine(`    ✓ Ошибок низкого приоритета не обнаружено`, 'success');
        }
        } // Конец блока if (fixTemplateErrors)

        // === ЭТАП 2.3: Исправляем ОСТАЛЬНЫЕ ОШИБКИ (отступы, длинные диалоги, теги имён) ===
        // Проверяем, выбран ли чекбокс для ошибок компоновки (включая отступы)
        const fixCompositionErrors = Object.keys(batchFixOptions).some(key => key.includes('Ошибка компоновки') && batchFixOptions[key]);
        
        if (fixCompositionErrors) {
          addBatchReportLine(`  → ${fileName}: проверка остальных ошибок...`, 'info');
          const indentErrors = window.checkForLineLevelErrors(currentFixedLines).filter(e => e.isFixableIndent);

          if (indentErrors.length > 0) {
            addBatchReportLine(`    Обнаружено ${indentErrors.length} ошибок отступов, исправляем...`, 'info');

          // Исправляем отступы в обратном порядке (чтобы индексы не сбивались)
          for (let i = indentErrors.length - 1; i >= 0; i--) {
            const err = indentErrors[i];
            if (currentFixedLines[err.line] !== undefined) {
              // Убираем пробелы в конце строки
              let line = currentFixedLines[err.line].trimEnd();

              // Определяем целевой отступ: если expectedIndent не задан, сохраняем текущий
              let targetIndent = err.expectedIndent;
              if (targetIndent === undefined) {
                const currentIndentMatch = currentFixedLines[err.line].match(/^\s*/);
                targetIndent = currentIndentMatch ? currentIndentMatch[0] : '';
              }

              currentFixedLines[err.line] = line.replace(/^\s*/, targetIndent);
            }
          }

          // Обновляем глобальное состояние после исправления отступов
          window.originalLines = currentFixedLines.slice();
          window.fullRusLines = currentFixedLines.slice();

          // Перепарсим файл с исправленными отступами
          window.textBlocks = [];
          window.extractTexts();
          window.extractJapaneseTexts(window.fullJapLines);

          addBatchReportLine(`    ✓ Исправлено ${indentErrors.length} ошибок отступов`, 'success');
        }
        } // Конец блока if (fixCompositionErrors)

        // === ЭТАП 2.3.1: Исправляем ОШИБКИ СКРИПТОВ (двойные слэши) через блоки ===
        // Проверяем, выбран ли чекбокс для ошибок скрипта
        const fixScriptErrors = Object.keys(batchFixOptions).some(key => key.includes('Ошибка скрипта') && batchFixOptions[key]);
        
        if (fixScriptErrors) {
          addBatchReportLine(`  → ${fileName}: проверка ошибок скриптов...`, 'info');
        // Передаем японские строки для точной проверки (критично для избежания ложных срабатываний)
        const scriptErrors = window.checkForLineLevelErrors(currentFixedLines, jpLines).filter(e =>
          e.type === 'Ошибка скрипта' && e.reason.includes('двойные слэши')
        );

        if (scriptErrors.length > 0) {
          addBatchReportLine(`    Обнаружено ${scriptErrors.length} потенциальных ошибок скриптов, исправляем через модель блоков...`, 'info');
          let fixedSlashes = 0;

          // Для каждого обнаруженного индекса ошибки ищем соответствующий блок
          scriptErrors.forEach(err => {
            // Маппинг для пакетного режима (простой поиск по оригинальному индексу)
            const block = window.textBlocks.find(b => b.idx === err.line);
            if (block && (block.type === 'Script' || block.type === 'ScriptMore')) {
              const oldText = block.text;
              // Исправляем любое количество повторов ∾ (внутреннее представление слэша)
              const fixedText = oldText.replace(/∾∾+/g, '∾');

              if (oldText !== fixedText) {
                block.text = fixedText;
                fixedSlashes++;
              }
            }
          });

          if (fixedSlashes > 0) {
            addBatchReportLine(`    ✓ Исправлено ${fixedSlashes} блоков с двойными слэшами`, 'success');
            // После изменения блоков нужно перегенерировать итоговые строки
            currentFixedLines = window.generateFinalFileLines().slice();

            // Синхронизируем глобальные переменные для последующих этапов
            window.originalLines = currentFixedLines.slice();
            window.fullRusLines = currentFixedLines.slice();
          } else {
            addBatchReportLine(`    ✓ Все подозрительные слэши совпадают с оригиналом или уже исправлены через авто-синхронизацию`, 'success');
          }
        } else {
          addBatchReportLine(`    ✓ Ошибок скриптов не обнаружено`, 'success');
        }
        } // Конец блока if (fixScriptErrors)


        // 2c. Запускаем фиксеры в цикле, пока они вносят изменения
        // Проверяем, выбран ли чекбокс для ошибок компоновки (включая длинные диалоги и теги)
        const fixCompositionErrorsForLoop = Object.keys(batchFixOptions).some(key => key.includes('Ошибка компоновки') && batchFixOptions[key]);
        
        if (fixCompositionErrorsForLoop) {
          addBatchReportLine(`  → ${fileName}: запуск цикла исправления...`, 'info');
        let pass = 0;
        const MAX_PASSES = 5; // Защита от бесконечного цикла

        while (pass < MAX_PASSES) {
          pass++;
          let errorsFoundThisPass = {
            longDialogues: false,
            nameTags: false,
            orphanedAttributes: false
          };

          // Удаляем висячие ShowTextAttributes перед другими исправлениями
          if (window.removeOrphanedAttributes()) {
            errorsFoundThisPass.orphanedAttributes = true;
          }

          // --- Проверка 1: Ищем ошибки длинных диалогов ---
          // Для этого нам нужно сгенерировать текущее состояние файла в строки
          // и прогнать через парсер ошибок.
          let currentLines = window.generateFinalFileLines();
          let lineLevelErrors = window.checkForLineLevelErrors(currentLines);

          // Ищем ОСОБЫЙ тип ошибки, который исправляет fixLongDialogues
          errorsFoundThisPass.longDialogues = lineLevelErrors.some(
            err => err.type === 'Ошибка компоновки' && err.reason.includes('слишком длинного диалога')
          );

          // --- Проверка 2: Ищем ошибки тегов имён ---
          // Эта функция работает напрямую с window.textBlocks
          errorsFoundThisPass.nameTags = window.hasNameTagErrors();

          // --- Выход из цикла, если ошибок нет ---
          if (!errorsFoundThisPass.longDialogues && !errorsFoundThisPass.nameTags) {
            if (pass > 1) {
              addBatchReportLine(`  → ${fileName}: цикл исправления завершен за ${pass - 1} проход(а).`, 'info');
            } else {
              addBatchReportLine(`  → ${fileName}: доп. исправления не требуются.`, 'info');
            }
            break; // Все чисто, выходим из while
          }

          addBatchReportLine(`    [Проход ${pass}] Обнаружены ошибки: ${errorsFoundThisPass.longDialogues ? 'Длинные диалоги ' : ''}${errorsFoundThisPass.nameTags ? 'Теги имён' : ''}`, 'info');

          // --- Выполнение исправления ---
          if (errorsFoundThisPass.longDialogues) {
            addBatchReportLine(`    [Проход ${pass}]... исправляем длинные диалоги...`, 'info');
            window.fixLongDialogues(true);
          }

          // Запускаем исправление тегов, *только* если есть ошибки тегов
          // (или если мы только что исправили диалоги, что могло породить ошибки тегов)
          if (errorsFoundThisPass.nameTags || errorsFoundThisPass.longDialogues) {
            // Мы запускаем autoFixNameTagErrors в любом случае,
            // так как fixLongDialogues мог создать ошибки тегов
            if (errorsFoundThisPass.nameTags) {
              addBatchReportLine(`    [Проход ${pass}]... исправляем теги имён...`, 'info');
            }
            window.autoFixNameTagErrors(true);
          }

          // После исправления, цикл пойдет на новую итерацию и
          // заново проверит, не появились ли новые ошибки
        } // Конец while

        if (pass >= MAX_PASSES) {
          addBatchReportLine(`    [ПРЕДУПРЕЖДЕНИЕ] Достигнут лимит проходов (${MAX_PASSES}). Возможен бесконечный цикл.`, 'warning');
        }
        } // Конец блока if (fixCompositionErrorsForLoop)

        // 2d. Генерируем финальный контент файла из ИТОГОВОГО состояния
        const finalLines = window.generateFinalFileLines();

        // === ЭТАП 3: Добавляем в ZIP ===
        const keepOriginal = document.getElementById('keepOriginalName').checked;
        const fixedFileName = keepOriginal ? fileName : fileName.replace('.txt', '_fixed.txt');
        fixedFiles.push({
          name: fixedFileName,
          content: finalLines.join('\n')
        });

        fixedCount++;
        console.log(`[Этап 3] Завершено исправление: ${fileName}`);
        addBatchReportLine(`✓ ${fileName}: успешно исправлен`, 'success');

      } catch (error) {
        console.error(`Критическая ошибка при исправлении ${fileName}:`, error);
        addBatchReportLine(`✗ ${fileName}: ошибка - ${error.message}`, 'error');
        errorCount++;
      }
    }

    // Если есть исправленные файлы, создаем ZIP архив
    if (fixedFiles.length > 0) {
      try {
        addBatchReportLine('', 'info'); // Пустая строка
        addBatchReportLine('=== Создание ZIP архива ===', 'info');
        // Создаем ZIP архив
        const zip = new JSZip();

        // Добавляем все исправленные файлы в архив
        fixedFiles.forEach(file => {
          zip.file(file.name, file.content);
        });

        // Генерируем ZIP файл
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Создаем ссылку для скачивания
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = 'fixed_files.zip';
        a.click();

        // Показываем результат в отчете
        addBatchReportLine('', 'info'); // Пустая строка
        addBatchReportLine('=== ИТОГО ===', 'success');
        addBatchReportLine(`Исправлено файлов: ${fixedCount}`, 'success');
        addBatchReportLine(`Ошибок высокого приоритета: ${totalHighPriorityErrorsFixed}`, totalHighPriorityErrorsFixed > 0 ? 'success' : 'info');
        addBatchReportLine(`Ошибок низкого приоритета: ${totalLowPriorityErrorsFixed}`, totalLowPriorityErrorsFixed > 0 ? 'success' : 'info');
        addBatchReportLine(`Ошибок при обработке: ${errorCount}`, errorCount > 0 ? 'error' : 'success');
        addBatchReportLine(`Создан архив 'fixed_files.zip'`, 'success');

      } catch (zipError) {
        console.error('Ошибка при создании ZIP архива:', zipError);
        addBatchReportLine('', 'info'); // Пустая строка
        addBatchReportLine('=== ИТОГО (С ОШИБКАМИ) ===', 'warning');
        addBatchReportLine(`Исправлено файлов: ${fixedCount}`, fixedCount > 0 ? 'success' : 'error');
        addBatchReportLine(`Ошибок при обработке: ${errorCount}`, 'error');
        addBatchReportLine(`Не удалось создать ZIP архив`, 'error');
      }
    } else {
      addBatchReportLine('', 'info'); // Пустая строка
      addBatchReportLine('=== ИТОГО ===', 'error');
      addBatchReportLine(`Не удалось исправить ни одного файла`, 'error');
      addBatchReportLine(`Ошибок высокого приоритета: ${totalHighPriorityErrorsFixed}`, totalHighPriorityErrorsFixed > 0 ? 'success' : 'info');
      addBatchReportLine(`Ошибок низкого приоритета: ${totalLowPriorityErrorsFixed}`, totalLowPriorityErrorsFixed > 0 ? 'success' : 'info');
      addBatchReportLine(`Ошибок при обработке: ${errorCount}`, 'error');
    }

  } catch (error) {
    console.error('Ошибка при массовом исправлении:', error);
    addBatchReportLine('', 'info'); // Пустая строка
    addBatchReportLine('=== КРИТИЧЕСКАЯ ОШИБКА ===', 'error');
    addBatchReportLine(`Произошла ошибка при массовом исправлении: ${error.message}`, 'error');
  } finally {
    // Восстанавливаем кнопку
    fixBtn.textContent = originalText;
    fixBtn.disabled = false;
  }
}

async function batchCheckAllFiles() {
  const batchListDiv = document.getElementById('batchFileList');
  batchListDiv.innerHTML = '';

  // Очищаем панель отчета при новой проверке
  clearBatchReport();

  // Собираем все уникальные имена файлов из обеих папок
  const allFileNames = new Set();
  Object.keys(ruFiles).forEach(name => allFileNames.add(name));
  Object.keys(jpFiles).forEach(name => allFileNames.add(name));
  const sortedFileNames = Array.from(allFileNames).sort();

  const showOnlyErrorLines = document.getElementById('batchShowOnlyErrorLines')?.checked;
  const showOkFiles = document.getElementById('batchShowOkFiles')?.checked;
  const hideUnmatchedFiles = document.getElementById('batchHideUnmatchedFiles')?.checked;

  // Очищаем предыдущие результаты
  batchResults = [];
  batchErrorTypes = {}; // Очищаем типы ошибок
  batchFixOptions = {}; // Очищаем опции исправления

  // Сохраняем результаты для фильтрации
  const results = [];
  let hasErrors = false;

  for (const fileName of sortedFileNames) {
    const hasRU = !!ruFiles[fileName];
    const hasJP = !!jpFiles[fileName];
    const fileDiv = document.createElement('div');
    fileDiv.style.marginBottom = '16px';
    fileDiv.style.padding = '10px 14px';
    fileDiv.style.borderRadius = '7px';
    fileDiv.style.fontSize = '15px';
    fileDiv.style.lineHeight = '1.6';
    let isError = false;
    let isOkFile = false;

    if (!hasRU || !hasJP) {
      // Файл отсутствует в одной из папок
      fileDiv.style.background = '#fff0f0';
      fileDiv.style.border = '1.5px solid #e66';
      fileDiv.style.color = '#b00';

      if (!hasRU && hasJP) {
        fileDiv.textContent = fileName + ' — нет русского файла для сопоставления';
      } else if (hasRU && !hasJP) {
        fileDiv.textContent = fileName + ' — нет японского файла для сопоставления';
      }

      isError = true;
      hasErrors = true;
      results.push({ fileDiv, isError, isOkFile, fileName });
      batchResults.push({ isError, isOkFile, fileName, hasStructError: false });
      continue;
    }

    // Файл есть в обеих папках - проверяем структуру
    fileDiv.style.background = '#f9f9f9';
    fileDiv.style.border = '1.5px solid #bbb';
    fileDiv.style.color = '#222';
    fileDiv.textContent = fileName;

    // <<< НАЧАЛО ИЗМЕНЕНИЯ >>>
    let ruLines, jpText;
    try {
      ruLines = await readFileAsLines(ruFiles[fileName]); // Читаем в виде массива строк
      jpText = await getFileText(jpFiles[fileName]);
    } catch (e) {
      // (обработка ошибок чтения остаётся без изменений)
      fileDiv.textContent += ' — ошибка чтения файлов';
      fileDiv.style.background = '#fff0f0';
      fileDiv.style.border = '1.5px solid #e66';
      fileDiv.style.color = '#b00';
      isError = true;
      hasErrors = true;
      results.push({ fileDiv, isError, isOkFile, fileName });
      batchResults.push({ isError, isOkFile, fileName, hasStructError: false });
      continue;
    }

    let jpLines = null;
    if (typeof jpText === 'string') {
      jpLines = jpText.split(/\r?\n/);
    }

    // === НОВОЕ: Создаем контекст блоков для проверки логических ошибок ===
    window.originalLines = ruLines.slice();
    window.fullRusLines = ruLines.slice();
    window.fullJapLines = jpLines.slice();
    window.textBlocks = [];
    window.japBlocks = [];
    
    // Временно отключаем рендеринг UI, чтобы не тормозить пакетную проверку
    const originalRender = window.renderTextBlocks;
    window.renderTextBlocks = function() {}; 
    
    try {
      if (typeof window.extractTexts === 'function') window.extractTexts();
      if (typeof window.extractJapaneseTexts === 'function') window.extractJapaneseTexts(window.fullJapLines);
    } catch(e) {
      console.error("Ошибка создания блоков для пакетной проверки:", e);
    } finally {
      window.renderTextBlocks = originalRender;
    }
    // =====================================================================

    let lineLevelErrors = window.checkForLineLevelErrors(ruLines, jpLines);

    // 2. Проверяем ошибки структуры, как и раньше
    const ruText = ruLines.join('\n');
    const structResult = window.checkMapStructureMatch(jpText, ruText);

    const structErrorCount = structResult.grouped ? structResult.grouped.reduce((acc, ev) => acc + ev.pages.reduce((a, p) => a + (p.errors ? p.errors.length : 0), 0), 0) : 0;

    if (structErrorCount === 0 && window.textBlocks && window.textBlocks.length > 0 && window.japBlocks && window.japBlocks.length > 0) {
      window.textBlocks.forEach(block => {
        if (block.isDeleted) return;
        if (block.type === 'ShowText' &&
          !window.isNameBlock(block.text) &&
          !block.japaneseLink &&
          !block.generated &&
          !block.manualPlus &&
          !block.hasIgnoreMarker) {
          lineLevelErrors.push({
            label: block.idx !== undefined ? window.formatLineLabel(block.idx) : '[продолжение]',
            type: 'Рекомендация',
            reason: 'Это дополнительная строка диалога. Добавьте в конец `#+` с помощью кнопки "Запомнить Доп. Строки".'
          });
        }
      });
    }

    // Собираем типы ошибок для чекбоксов
    lineLevelErrors.forEach(err => {
      const errorKey = `${err.type}`;
      if (!batchErrorTypes[errorKey]) {
        batchErrorTypes[errorKey] = 0;
      }
      batchErrorTypes[errorKey]++;
    });

    // Если есть структурные ошибки, добавляем их
    if (structErrorCount > 0) {
      if (!batchErrorTypes['Структурные ошибки']) {
        batchErrorTypes['Структурные ошибки'] = 0;
      }
      batchErrorTypes['Структурные ошибки'] += structErrorCount;
    }

    const totalErrorCount = structErrorCount + lineLevelErrors.length;

    const summary = document.createElement('div');
    summary.style.marginTop = '6px';
    summary.style.fontWeight = 'bold';
    summary.style.color = totalErrorCount === 0 ? '#226922' : '#b00';
    summary.textContent = totalErrorCount === 0 ? 'Ошибок нет, 100% совпадение' : `Обнаружено ${totalErrorCount} ошибок`;
    fileDiv.appendChild(summary);

    let statHtml = '';
    // Отображаем ошибки на уровне строк
    if (lineLevelErrors.length > 0) {
      statHtml += `<div style='color:#b00; font-weight:bold; margin:10px 0 2px 0;'>Ошибки в строках:</div>`;
      lineLevelErrors.forEach(err => {
        statHtml += `<div style='color:#b00; margin-left:12px; margin-bottom:8px;'><b>${err.label}</b> (${err.type}): ${err.reason}</div>`;
      });
    }

    // Отображаем структурные ошибки
    if (structResult.grouped) {
      const escapeHtml = (text) => (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const createContextBlock = (lang, context, errorLine) => {
        if (!context) return '';
        let blockHtml = `<div style='font-size:13px; margin-top:4px; background:#f7f7f7; border-radius:4px; padding:4px 8px; border: 1px solid #ddd;'><span style='color:#444; font-weight:bold;'>${lang} Context:</span><pre style='margin:0; padding:0; display:block;'>`;
        if (context.before) {
          blockHtml += `<span style='opacity:0.6;'>${escapeHtml(context.before)}</span>\n`;
        }
        blockHtml += `<strong style='color:#b00; background-color: #ffe0e0;'>${escapeHtml(errorLine)}</strong>\n`;
        if (context.after) {
          blockHtml += `<span style='opacity:0.6;'>${escapeHtml(context.after)}</span>`;
        }
        blockHtml += `</pre></div>`;
        return blockHtml;
      };

      structResult.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok) {
            if (!showOnlyErrorLines || page.errors.length > 0) {
              statHtml += `<div style='color:#b00; font-weight:bold; margin:10px 0 2px 0;'>CommonEvent ${ev.eid} (${ev.name}), Page ${page.page}</div>`;
              page.errors.forEach(err => {
                const branchEndInfo = err.branchEndNumber !== undefined ? `<div style='color:#666; font-size:12px; margin-bottom:2px;'>BranchEnd ${err.branchEndNumber}</div>` : '';
                let linePointers = [];
                if (err.jpLineNum !== undefined) { linePointers.push(`JP: ${err.jpLineNum + 1}`); }
                if (err.ruLineNum !== undefined) { linePointers.push(`RU: ${err.ruLineNum + 1}`); }
                const lineInfo = linePointers.length > 0 ? `<span style="color:#555; background:#eee; padding: 2px 5px; border-radius:3px; font-size:12px; margin-right:8px;">${linePointers.join(' | ')}</span>` : '';
                const lineLabel = err.line !== undefined ? err.line : '—';

                statHtml += `<div style='color:#b00; margin-left:12px; margin-bottom:8px;'>${branchEndInfo}${lineInfo}<b>Строка ${lineLabel}:</b> ${err.msg}<br>`;

                if (err.jpContext || err.ruContext) {
                  statHtml += createContextBlock('JP', err.jpContext, err.jp);
                  statHtml += createContextBlock('RU', err.ruContext, err.ru);
                } else if (err.jp || err.ru) {
                  statHtml += `<div style='font-size:13px; margin-top:2px;'><span style='color:#444;'>JP:</span> <pre style='display:inline; background:#f7f7f7; border-radius:4px; padding:2px 6px;'>${escapeHtml(err.jp)}</pre><br><span style='color:#444;'>RU:</span> <pre style='display:inline; background:#f7f7f7; border-radius:4px; padding:2px 6px;'>${escapeHtml(err.ru)}</pre></div>`;
                }

                statHtml += `</div>`;
              });
            }
          }
        });
      });
    }

    if (statHtml) {
      const statDiv = document.createElement('div');
      statDiv.innerHTML = statHtml;
      fileDiv.appendChild(statDiv);
    }

    isError = totalErrorCount > 0;
    isOkFile = totalErrorCount === 0;

    // Определяем, есть ли структурные ошибки
    const hasStructError = structErrorCount > 0;
    // <<< КОНЕЦ ИЗМЕНЕНИЯ >>>

    if (isError) {
      hasErrors = true;
    }

    results.push({ fileDiv, isError, isOkFile, fileName });
    batchResults.push({ isError, isOkFile, fileName, hasStructError });
  }

  // --- Фильтрация вывода ---
  results.forEach(({ fileDiv, isError, isOkFile, fileName }) => {
    // Скрываем исправные файлы если чекбокс выключен
    if (!showOkFiles && isOkFile) {
      return;
    }
    // Скрываем файлы без сопоставления если чекбокс активен
    const hasRU = !!ruFiles[fileName];
    const hasJP = !!jpFiles[fileName];
    if (hideUnmatchedFiles && (!hasRU || !hasJP)) {
      return;
    }
    batchListDiv.appendChild(fileDiv);
  });

  // Добавляем общую статистику
  const ruCount = Object.keys(ruFiles).length;
  const jpCount = Object.keys(jpFiles).length;
  const matchedCount = Array.from(allFileNames).filter(name => ruFiles[name] && jpFiles[name]).length;
  const missingCount = allFileNames.size - matchedCount;
  const structureErrorCount = results.filter(r => r.isError && ruFiles[r.fileName] && jpFiles[r.fileName]).length;
  const okCount = results.filter(r => r.isOkFile).length;

  const statsDiv = document.createElement('div');
  statsDiv.style.marginTop = '20px';
  statsDiv.style.padding = '15px';
  statsDiv.style.background = '#f9f9f9';
  statsDiv.style.border = '1px solid #ddd';
  statsDiv.style.borderRadius = '8px';
  statsDiv.style.fontSize = '14px';
  statsDiv.innerHTML = `
    <strong>Общая статистика проверки:</strong><br>
    • Файлов в русской папке: ${ruCount}<br>
    • Файлов в японской папке: ${jpCount}<br>
    • Файлов с сопоставлением: ${matchedCount}<br>
    • Файлов без сопоставления: ${missingCount}<br>
    • Файлов с ошибками структуры: ${structureErrorCount}<br>
    • Файлов без ошибок: ${okCount}
  `;
  batchListDiv.appendChild(statsDiv);

  // Показываем элементы управления исправлением только если есть ошибки
  if (hasErrors) {
    createFixControls();
  } else {
    // Удаляем элементы управления исправлением если нет ошибок
    const oldFixControls = document.getElementById('batchFixControls');
    if (oldFixControls) {
      oldFixControls.remove();
    }

    // Показываем зелёную надпись если все файлы исправны и чекбокс "Показывать исправные файлы" выключен
    if (!showOkFiles && results.length > 0 && results.every(r => r.isOkFile)) {
      const congratulationsDiv = document.createElement('div');
      congratulationsDiv.style.marginTop = '20px';
      congratulationsDiv.style.padding = '15px';
      congratulationsDiv.style.background = '#e8f5e8';
      congratulationsDiv.style.border = '2px solid #4CAF50';
      congratulationsDiv.style.borderRadius = '8px';
      congratulationsDiv.style.textAlign = 'center';
      congratulationsDiv.style.fontSize = '18px';
      congratulationsDiv.style.fontWeight = 'bold';
      congratulationsDiv.style.color = '#2E7D32';
      congratulationsDiv.textContent = '🎉 Поздравляем! Все файлы исправны 🎉';
      batchListDiv.appendChild(congratulationsDiv);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('batchRuFolder').addEventListener('change', e => handleFolderInput(e, 'ru'));
  document.getElementById('batchJpFolder').addEventListener('change', e => handleFolderInput(e, 'jp'));
  const checkBtn = document.getElementById('batchCheckBtn');
  if (checkBtn) checkBtn.onclick = batchCheckAllFiles;
  document.getElementById('tabBatch').onclick = showBatchTab;
  // --- Обработчики чекбоксов ---
  const showOnlyErrorLinesBox = document.getElementById('batchShowOnlyErrorLines');
  if (showOnlyErrorLinesBox) {
    showOnlyErrorLinesBox.addEventListener('change', batchCheckAllFiles);
  }
  const showOkFilesBox = document.getElementById('batchShowOkFiles');
  if (showOkFilesBox) {
    showOkFilesBox.addEventListener('change', batchCheckAllFiles);
  }
  const hideUnmatchedFilesBox = document.getElementById('batchHideUnmatchedFiles');
  if (hideUnmatchedFilesBox) {
    hideUnmatchedFilesBox.addEventListener('change', batchCheckAllFiles);
  }
});
