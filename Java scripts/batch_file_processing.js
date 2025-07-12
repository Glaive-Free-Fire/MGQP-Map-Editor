let ruFiles = {};
let jpFiles = {};
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
  Object.keys(ruFiles).sort().forEach(fileName => {
    const hasJP = !!jpFiles[fileName];
    const div = document.createElement('div');
    div.textContent = fileName + (hasJP ? '' : ' — нет файла для сопоставления');
    div.style.color = hasJP ? '#222' : '#b00';
    listDiv.appendChild(div);
  });
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

async function batchCheckAllFiles() {
  const batchListDiv = document.getElementById('batchFileList');
  batchListDiv.innerHTML = '';
  const ruNames = Object.keys(ruFiles).sort();
  const showOnlyErrorLines = document.getElementById('batchShowOnlyErrorLines')?.checked;
  const showOkFiles = document.getElementById('batchShowOkFiles')?.checked;
  // Сохраняем результаты для фильтрации
  const results = [];
  for (const fileName of ruNames) {
    const hasJP = !!jpFiles[fileName];
    const fileDiv = document.createElement('div');
    fileDiv.style.marginBottom = '16px';
    fileDiv.style.padding = '10px 14px';
    fileDiv.style.borderRadius = '7px';
    fileDiv.style.fontSize = '15px';
    fileDiv.style.lineHeight = '1.6';
    fileDiv.style.background = hasJP ? '#f9f9f9' : '#fff0f0';
    fileDiv.style.border = hasJP ? '1.5px solid #bbb' : '1.5px solid #e66';
    fileDiv.style.color = hasJP ? '#222' : '#b00';
    fileDiv.textContent = fileName;
    let isError = false;
    let isOkFile = false;
    if (!hasJP) {
      fileDiv.textContent += ' — нет файла для сопоставления';
      isError = true;
      results.push({fileDiv, isError, isOkFile});
      continue;
    }
    let ruText, jpText;
    try {
      ruText = await getFileText(ruFiles[fileName]);
      jpText = await getFileText(jpFiles[fileName]);
    } catch (e) {
      fileDiv.textContent += ' — ошибка чтения файлов';
      fileDiv.style.background = '#fff0f0';
      fileDiv.style.border = '1.5px solid #e66';
      fileDiv.style.color = '#b00';
      isError = true;
      results.push({fileDiv, isError, isOkFile});
      continue;
    }
    // --- Используем window.checkMapStructureMatch ---
    let result;
    if (window.checkMapStructureMatch) {
      result = window.checkMapStructureMatch(jpText, ruText);
    } else {
      fileDiv.textContent += ' — функция проверки структуры не найдена';
      fileDiv.style.background = '#fff0f0';
      fileDiv.style.border = '1.5px solid #e66';
      fileDiv.style.color = '#b00';
      isError = true;
      results.push({fileDiv, isError, isOkFile});
      continue;
    }
    // --- Выводим процент совпадения и ошибки ---
    const percent = result.percent;
    const errorCount = result.grouped ? result.grouped.reduce((acc, ev) => acc + ev.pages.reduce((a, p) => a + (p.errors ? p.errors.length : 0), 0), 0) : (result.errors ? result.errors.length : 0);
    const summary = document.createElement('div');
    summary.style.marginTop = '6px';
    summary.style.fontWeight = 'bold';
    summary.style.color = percent === 100 ? '#226922' : '#b00';
    summary.textContent = percent === 100 ? 'Ошибок нет, 100% совпадение структуры данных' : `Обнаружено ${errorCount} ошибок, ${percent}% совпадения структуры данных`;
    fileDiv.appendChild(summary);
    // --- Подробная статистика ---
    if (result.grouped && result.grouped.length > 0) {
      let statHtml = '';
      result.grouped.forEach(ev => {
        ev.pages.forEach(page => {
          if (page.ok) {
            if (!showOnlyErrorLines) {
              statHtml += `<div style='color:#228B22; font-weight:bold; margin:6px 0 2px 0;'>CommonEvent ${ev.eid} (${ev.name}), Page ${page.page}: OK</div>`;
            }
          } else {
            statHtml += `<div style='color:#b00; font-weight:bold; margin:10px 0 2px 0;'>CommonEvent ${ev.eid} (${ev.name}), Page ${page.page}</div>`;
            page.errors.forEach(err => {
              statHtml += `<div style='color:#b00; margin-left:12px; margin-bottom:8px;'><b>Строка ${err.line}:</b> ${err.msg}<br>`;
              if (err.jp || err.ru) {
                statHtml += `<div style='font-size:13px; margin-top:2px;'><span style='color:#444;'>JP:</span> <pre style='display:inline; background:#f7f7f7; border-radius:4px; padding:2px 6px;'>${(err.jp||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre><br><span style='color:#444;'>RU:</span> <pre style='display:inline; background:#f7f7f7; border-radius:4px; padding:2px 6px;'>${(err.ru||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
              }
              statHtml += `</div>`;
            });
          }
        });
      });
      if (percent === 100 || statHtml === '') {
        if (!showOnlyErrorLines) {
          statHtml += '<span style="color:#393">Структура CommonEvent полностью совпадает.</span>';
        }
      }
      const statDiv = document.createElement('div');
      statDiv.innerHTML = statHtml;
      fileDiv.appendChild(statDiv);
    }
    isError = errorCount > 0 || percent < 100;
    isOkFile = percent === 100 && errorCount === 0;
    results.push({fileDiv, isError, isOkFile});
  }
  // --- Фильтрация вывода ---
  results.forEach(({fileDiv, isError, isOkFile}) => {
    if ((!showOkFiles && isOkFile) || (showOkFiles && false)) {
      // скрываем исправные файлы если чекбокс выключен
      return;
    }
    batchListDiv.appendChild(fileDiv);
  });
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
