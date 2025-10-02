let ruFiles = {};
let jpFiles = {};
let batchResults = []; // Сохраняем результаты проверки для последующего исправления

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
  
  // Собираем все уникальные имена файлов из обеих папок
  const allFileNames = new Set();
  Object.keys(ruFiles).forEach(name => allFileNames.add(name));
  Object.keys(jpFiles).forEach(name => allFileNames.add(name));
  
  // Сортируем и отображаем все файлы
  Array.from(allFileNames).sort().forEach(fileName => {
    const hasRU = !!ruFiles[fileName];
    const hasJP = !!jpFiles[fileName];
    
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
    reader.onload = e => resolve(e.target.result.split('\n'));
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
  
  // Добавляем элементы управления в начало контейнера (вверху)
  batchContent.insertBefore(fixControls, batchContent.firstChild);
}

// Функция для исправления всех файлов с ошибками
async function batchFixAllFiles() {
  const filesWithErrors = batchResults.filter(result => result.isError);
  
  if (filesWithErrors.length === 0) {
    alert('Нет файлов с ошибками для исправления!');
    return;
  }
  
  // Отключаем кнопку на время обработки
  const fixBtn = document.getElementById('batchFixBtn');
  const originalText = fixBtn.textContent;
  fixBtn.textContent = 'Исправление...';
  fixBtn.disabled = true;
  
  let fixedCount = 0;
  let errorCount = 0;
  const fixedFiles = []; // Массив для хранения исправленных файлов
  
  try {
    for (const result of filesWithErrors) {
      try {
        const fileName = result.fileName;
        const ruFile = ruFiles[fileName];
        const jpFile = jpFiles[fileName];
        
        if (!ruFile || !jpFile) {
          console.error(`Пропускаем ${fileName}: отсутствует один из файлов`);
          continue;
        }
        
        // Читаем содержимое файлов
        const ruLines = await readFileAsLines(ruFile);
        const jpLines = await readFileAsLines(jpFile);
        
        // Проверяем структуру
        const ruText = ruLines.join('\n');
        const jpText = jpLines.join('\n');
        const checkResult = window.checkMapStructureMatch(jpText, ruText);
        
        // Если есть ошибки, исправляем
        if (checkResult.percent < 100 || (checkResult.grouped && checkResult.grouped.some(ev => 
          ev.pages.some(page => !page.ok && page.errors && page.errors.length > 0)
        ))) {
          
          // Собираем номера CommonEvent с ошибками
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
            // Убираем дубликаты номеров
            mismatchedNums = [...new Set(mismatchedNums)];
            
            // Выполняем восстановление структуры с новой функцией
            const restoredLines = window.restoreRussianStructureWithMissing(ruLines, jpLines, mismatchedNums);
            
            // Добавляем исправленный файл в массив
            const fixedFileName = fileName.replace('.txt', '_fixed.txt');
            const fileContent = restoredLines.join('\n');
            fixedFiles.push({
              name: fixedFileName,
              content: fileContent
            });
            
            fixedCount++;
            console.log(`Исправлен файл: ${fileName}`);
          }
        }
      } catch (error) {
        console.error(`Ошибка при исправлении ${result.fileName}:`, error);
        errorCount++;
      }
    }
    
    // Если есть исправленные файлы, создаем ZIP архив
    if (fixedFiles.length > 0) {
      try {
        // Создаем ZIP архив
        const zip = new JSZip();
        
        // Добавляем все исправленные файлы в архив
        fixedFiles.forEach(file => {
          zip.file(file.name, file.content);
        });
        
        // Генерируем ZIP файл
        const zipBlob = await zip.generateAsync({type: 'blob'});
        
        // Создаем ссылку для скачивания
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = 'fixed_files.zip';
        a.click();
        
        // Показываем результат
        alert(`Исправление завершено!\n\nИсправлено файлов: ${fixedCount}\nОшибок при обработке: ${errorCount}\n\nСоздан архив 'fixed_files.zip' со всеми исправленными файлами.`);
        
      } catch (zipError) {
        console.error('Ошибка при создании ZIP архива:', zipError);
        alert(`Исправление завершено, но не удалось создать ZIP архив.\n\nИсправлено файлов: ${fixedCount}\nОшибок при обработке: ${errorCount}`);
      }
    } else {
      alert('Не удалось исправить ни одного файла.');
    }
    
  } catch (error) {
    console.error('Ошибка при массовом исправлении:', error);
    alert('Произошла ошибка при массовом исправлении файлов.');
  } finally {
    // Восстанавливаем кнопку
    fixBtn.textContent = originalText;
    fixBtn.disabled = false;
  }
}

async function batchCheckAllFiles() {
  const batchListDiv = document.getElementById('batchFileList');
  batchListDiv.innerHTML = '';
  
  // Собираем все уникальные имена файлов из обеих папок
  const allFileNames = new Set();
  Object.keys(ruFiles).forEach(name => allFileNames.add(name));
  Object.keys(jpFiles).forEach(name => allFileNames.add(name));
  const sortedFileNames = Array.from(allFileNames).sort();
  
  const showOnlyErrorLines = document.getElementById('batchShowOnlyErrorLines')?.checked;
  const showOkFiles = document.getElementById('batchShowOkFiles')?.checked;
  
  // Очищаем предыдущие результаты
  batchResults = [];
  
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
      results.push({fileDiv, isError, isOkFile, fileName});
      batchResults.push({isError, isOkFile, fileName});
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
      results.push({fileDiv, isError, isOkFile, fileName});
      batchResults.push({isError, isOkFile, fileName});
      continue;
    }
    
    // 1. Проверяем ошибки на уровне строк с помощью новой функции
    const lineLevelErrors = window.checkForLineLevelErrors(ruLines);

    // 2. Проверяем ошибки структуры, как и раньше
    const ruText = ruLines.join('\n');
    const structResult = window.checkMapStructureMatch(jpText, ruText);
    
    const structErrorCount = structResult.grouped ? structResult.grouped.reduce((acc, ev) => acc + ev.pages.reduce((a, p) => a + (p.errors ? p.errors.length : 0), 0), 0) : 0;
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
      structResult.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (!page.ok) {
            if (!showOnlyErrorLines || page.errors.length > 0) {
              statHtml += `<div style='color:#b00; font-weight:bold; margin:10px 0 2px 0;'>CommonEvent ${ev.eid} (${ev.name}), Page ${page.page}</div>`;
              page.errors.forEach(err => {
                statHtml += `<div style='color:#b00; margin-left:12px; margin-bottom:8px;'><b>Строка ${err.line}:</b> ${err.msg}</div>`;
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
    // <<< КОНЕЦ ИЗМЕНЕНИЯ >>>
    
    if (isError) {
      hasErrors = true;
    }
    
    results.push({fileDiv, isError, isOkFile, fileName});
    batchResults.push({isError, isOkFile, fileName});
  }
  
  // --- Фильтрация вывода ---
  results.forEach(({fileDiv, isError, isOkFile}) => {
    if ((!showOkFiles && isOkFile) || (showOkFiles && false)) {
      // скрываем исправные файлы если чекбокс выключен
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

document.addEventListener('DOMContentLoaded', function() {
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
});
