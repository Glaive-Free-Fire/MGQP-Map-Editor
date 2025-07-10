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
function extractRusBlocks(lines) {
  return lines
    .filter(line => !line.includes('#+'))
    .map(line => {
      if (line.includes('ShowTextAttributes')) return 'ShowTextAttributes';
      if (line.includes('ShowChoices')) return 'ShowChoices';
      if (line.includes('When')) return 'When';
      if (line.includes('Display Name')) return 'DisplayName';
      if (line.includes('ShowText')) {
        if (/ShowText\(\["<∾∾C\[6\].*?∾∾C\[0\]>"\]\)/.test(line)) {
          return 'ShowTextWithName';
        } else {
          return 'ShowText';
        }
      }
    })
    .filter(Boolean);
}
function extractJapBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ShowText([')) {
      const nameMatch = lines[i].match(/ShowText\(\["【.*】"\]\)/);
      if (nameMatch && i + 1 < lines.length && lines[i+1].includes('ShowText([')) {
        blocks.push('ShowTextWithName');
        i++;
        continue;
      }
      blocks.push('ShowText');
    }
    if (lines[i].includes('ShowTextAttributes')) blocks.push('ShowTextAttributes');
    if (lines[i].includes('ShowChoices')) blocks.push('ShowChoices');
    if (lines[i].includes('When')) blocks.push('When');
    if (lines[i].includes('Display Name')) blocks.push('DisplayName');
  }
  return blocks;
}
function compareEventStructures(rusLines, japLines) {
  const rusBlocks = extractRusBlocks(rusLines);
  const japBlocks = extractJapBlocks(japLines);
  return {
    rusStruct: rusBlocks,
    japStruct: japBlocks,
    equal: JSON.stringify(rusBlocks) === JSON.stringify(japBlocks),
    diff: rusBlocks.map((t, i) => [t, japBlocks[i]])
  };
}
function parseCommonEventsForCompare(lines) {
  const events = [];
  let currentEvent = null;
  let inEvent = false;
  let inPage = false;
  let eventLines = [];
  lines.forEach(line => {
    let ce = line.match(/^CommonEvent (\d+)/);
    if (ce) {
      if (currentEvent) {
        currentEvent.lines = eventLines.slice();
        events.push(currentEvent);
      }
      currentEvent = { num: parseInt(ce[1]), name: '', lines: [] };
      inEvent = true;
      inPage = false;
      eventLines = [];
      return;
    }
    if (inEvent && line.match(/^Name\s*=\s*"(.*)"/)) {
      currentEvent.name = RegExp.$1;
      return;
    }
    if (line.match(/^\s*Page \d+/)) {
      inPage = true;
      return;
    }
    if (inPage) {
      eventLines.push(line);
    }
  });
  if (currentEvent) {
    currentEvent.lines = eventLines.slice();
    events.push(currentEvent);
  }
  return events;
}
function checkCommonEventStructureSmart(rusLines, japLines) {
  const ruEvents = parseCommonEventsForCompare(rusLines);
  const jpEvents = parseCommonEventsForCompare(japLines);
  let matches = 0;
  let mismatches = [];
  let total = 0;
  ruEvents.forEach(ruEv => {
    const jpEv = jpEvents.find(e => e.num === ruEv.num);
    if (!jpEv) return;
    const ruHasText = ruEv.lines.some(l => l.includes('ShowText'));
    const jpHasText = jpEv.lines.some(l => l.includes('ShowText'));
    if (!ruHasText && !jpHasText) return;
    total++;
    const cmp = compareEventStructures(ruEv.lines, jpEv.lines);
    if (cmp.equal) {
      matches++;
    } else {
      mismatches.push({num: ruEv.num, name: ruEv.name, diff: cmp.diff, ru: cmp.rusStruct, jp: cmp.japStruct});
    }
  });
  const percent = total > 0 ? Math.round(matches / total * 100) : 100;
  return { percent, total, matched: matches, mismatches };
}
function readFileAsLines(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split('\n'));
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}
async function batchCheckAllFiles() {
  const batchListDiv = document.getElementById('batchFileList');
  batchListDiv.innerHTML = '';
  const ruNames = Object.keys(ruFiles).sort();
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
    if (!hasJP) {
      fileDiv.textContent += ' — нет файла для сопоставления';
      batchListDiv.appendChild(fileDiv);
      continue;
    }
    let ruLines, jpLines;
    try {
      ruLines = await readFileAsLines(ruFiles[fileName]);
      jpLines = await readFileAsLines(jpFiles[fileName]);
    } catch (e) {
      fileDiv.textContent += ' — ошибка чтения файлов';
      fileDiv.style.background = '#fff0f0';
      fileDiv.style.border = '1.5px solid #e66';
      fileDiv.style.color = '#b00';
      batchListDiv.appendChild(fileDiv);
      continue;
    }
    const ruEvents = parseCommonEventsForCompare(ruLines);
    const jpEvents = parseCommonEventsForCompare(jpLines);
    let total = 0, matched = 0, hasMismatch = false;
    const rows = [];
    ruEvents.forEach(ruEv => {
      const jpEv = jpEvents.find(e => e.num === ruEv.num);
      if (!jpEv) return;
      const ruHasText = ruEv.lines.some(l => l.includes('ShowText'));
      const jpHasText = jpEv.lines.some(l => l.includes('ShowText'));
      if (!ruHasText && !jpHasText) return;
      total++;
      const cmp = compareEventStructures(ruEv.lines, jpEv.lines);
      const percent = cmp.equal ? 100 : Math.round(100 * (cmp.rusStruct.length === 0 ? 1 : cmp.rusStruct.filter((b, i) => b === cmp.japStruct[i]).length / cmp.rusStruct.length));
      if (cmp.equal) matched++;
      else hasMismatch = true;
      rows.push({num: ruEv.num, percent, equal: cmp.equal});
    });
    const percent = total > 0 ? Math.round(matched / total * 100) : 100;
    const summary = document.createElement('div');
    summary.style.marginTop = '6px';
    summary.style.fontWeight = 'bold';
    summary.style.color = percent === 100 ? '#226922' : '#b00';
    summary.textContent = percent === 100 ? 'Ошибок нет, 100% совпадение структуры данных' : `Обнаружено ${total - matched} ошибок, ${percent}% совпадения структуры данных`;
    fileDiv.appendChild(summary);
    if (percent !== 100 && rows.length > 0) {
      const table = document.createElement('table');
      table.style.marginTop = '8px';
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th style="text-align:left;padding:2px 8px;">CommonEvent</th><th style="text-align:left;padding:2px 8px;">%</th><th style="text-align:left;padding:2px 8px;">Статус</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      rows.forEach(row => {
        if (row.equal) return;
        const tr = document.createElement('tr');
        tr.style.background = '#fff0f0';
        tr.style.color = '#b00';
        tr.style.borderBottom = '1px solid #eee';
        tr.innerHTML = `<td style="padding:2px 8px;">EV${String(row.num).padStart(3, '0')}</td><td style="padding:2px 8px;">${row.percent}%</td><td style="padding:2px 8px;">Есть отличия</td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      fileDiv.appendChild(table);
    }
    batchListDiv.appendChild(fileDiv);
  }
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('batchRuFolder').addEventListener('change', e => handleFolderInput(e, 'ru'));
  document.getElementById('batchJpFolder').addEventListener('change', e => handleFolderInput(e, 'jp'));
  const checkBtn = document.getElementById('batchCheckBtn');
  if (checkBtn) checkBtn.onclick = batchCheckAllFiles;
  document.getElementById('tabBatch').onclick = showBatchTab;
});
