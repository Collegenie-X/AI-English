/* ============================================================
   puzzleMode.js — 낱말 퍼즐 (puzzle-overlay)

   핵심 기능:
   1. openPuzzleDialog()             — 다이얼로그 열기
   2. closePuzzleDialog()            — 닫기
   3. setPuzzleDiff(diff)            — 'easy'|'medium'|'hard' 전환
   4. startPuzzleFromSelected()      — 선택 카테고리로 퍼즐 시작
   5. generateWordSearch()           — 인접 그리드 생성 알고리즘
   6. generateScatteredWordSearch()  — 산재 그리드 생성 (고급)
   7. renderPuzzleGame()             — 게임 화면 렌더링
   8. 드래그/터치/탭 이벤트 핸들러
   9. renderPuzzleComplete()         — 라운드 완료 + 최종 완료 화면
============================================================ */

const PUZZLE_CONFIG = {
  easy: {
    name:          '초급',
    gridSize:      4,
    targetCount:   3,
    totalRounds:   5,
    fillerCount:   3,
    directions:    ['H'],
    showEasyHints: true,
    scattered:     false,
    cellClass:     'diff-easy',
    label:         '🟢 초급'
  },
  medium: {
    name:          '중급',
    gridSize:      5,
    targetCount:   3,
    totalRounds:   3,
    fillerCount:   4,
    directions:    ['H','V'],
    showEasyHints: false,
    scattered:     false,
    cellClass:     'diff-medium',
    label:         '🟡 중급'
  },
  hard: {
    name:          '고급',
    gridSize:      6,
    targetCount:   3,
    totalRounds:   3,
    fillerCount:   0,
    directions:    [],
    showEasyHints: false,
    scattered:     true,
    cellClass:     'diff-hard',
    label:         '🔴 고급'
  }
};

/* puzzleState는 app.js에서 선언 */

/* ── 열기 / 닫기 ── */
function openPuzzleDialog() {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const pb = document.querySelector('.mode-btn[data-mode="puzzle"]');
  if (pb) pb.classList.add('active');
  document.getElementById('puzzle-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  resetPuzzleRounds();
  startPuzzleFromSelected();
}

function closePuzzleDialog() {
  document.getElementById('puzzle-overlay').classList.remove('open');
  document.body.style.overflow = '';
  clearTimeout(puzzleState.hintTimeout);
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const lb = document.querySelector('.mode-btn[data-mode="learn"]');
  if (lb) lb.classList.add('active');
}

function puzzleOverlayClick(e) {
  if (e.target === document.getElementById('puzzle-overlay')) closePuzzleDialog();
}

/* ── 난이도 전환 ── */
function setPuzzleDiff(diff) {
  clearTimeout(puzzleState.roundTimer);
  puzzleState.difficulty = diff;
  document.querySelectorAll('.puzzle-diff-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.diff === diff);
  });
  _updatePuzzleDiffBadge(diff);
  resetPuzzleRounds();
  startPuzzleFromSelected();
}

function _updatePuzzleDiffBadge(diff) {
  const badge = document.getElementById('puzzle-diff-badge');
  if (!badge) return;
  const map = {
    easy:   '<span class="diff-badge-easy">🟢 초급</span>',
    medium: '<span class="diff-badge-medium">🟡 중급</span>',
    hard:   '<span class="diff-badge-hard">🔴 고급</span>'
  };
  badge.innerHTML = map[diff] || '';
}

/* ── 라운드 초기화 ── */
function resetPuzzleRounds() {
  clearTimeout(puzzleState.roundTimer);
  puzzleState.currentRound  = 1;
  puzzleState.totalRounds   = PUZZLE_CONFIG[puzzleState.difficulty].totalRounds;
  puzzleState.usedWordIds   = new Set();
  puzzleState.allFoundWords = [];
}

/* ── 새로고침 ── */
function pdlgRefresh(btn) {
  if (btn) {
    btn.classList.remove('spinning');
    void btn.offsetWidth;
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 480);
  }
  clearTimeout(puzzleState.roundTimer);
  _startPuzzleRound();
}

/* ── 선택 카테고리로 퍼즐 시작 ── */
function startPuzzleFromSelected() {
  resetPuzzleRounds();
  _startPuzzleRound();
}

function startNextRound() {
  clearTimeout(puzzleState.roundTimer);
  _startPuzzleRound();
}

/* ── 내부: 라운드 시작 ── */
function _startPuzzleRound() {
  const pool = getSelectedWords();
  if (!pool || pool.length < 3) {
    const pc = document.getElementById('puzzle-content');
    if (pc) pc.innerHTML = `<div style="text-align:center;color:#aaa;padding:30px">
      ⚠️ 상황 필터에서 3개 이상의 단어가 있는 주제를 선택해 주세요!
    </div>`;
    renderPuzzleSourceInfo(pool || []);
    return;
  }
  renderPuzzleSourceInfo(pool);
  const unused  = pool.filter(w => !puzzleState.usedWordIds.has(w.id));
  const usePool = unused.length >= 3 ? unused : pool;
  startPuzzleWithPool(shuffle([...usePool]));
}

/* ── 선택 주제 정보 표시 ── */
function renderPuzzleSourceInfo(pool) {
  const infoEl = document.getElementById('puzzle-source-info');
  if (!infoEl || !WORD_DATA) return;
  const selCats = getSelectedCats();
  if (!selCats.length) {
    infoEl.innerHTML = '<span style="color:#aaa">상황 필터에서 주제를 선택해 주세요</span>';
    return;
  }
  const MAX = 5;
  const iconChips = selCats.slice(0, MAX).map(c =>
    `<span class="puzzle-source-chip" title="${c.name}">${c.icon}</span>`
  ).join('');
  const more = selCats.length > MAX ? `<span class="puzzle-source-more">+${selCats.length - MAX}</span>` : '';
  infoEl.innerHTML = `
    ${iconChips}${more}
    <span class="puzzle-word-count">총 ${pool.length}단어 풀</span>
    <button class="pdlg-refresh-btn" onclick="pdlgRefresh(this)" title="새로고침">🔄</button>`;
}

/* ── 단어 풀로 퍼즐 생성 ── */
function startPuzzleWithPool(wordPool) {
  const cfg = PUZZLE_CONFIG[puzzleState.difficulty];
  _updatePuzzleDiffBadge(puzzleState.difficulty);

  const freshPool = shuffle([...wordPool]);
  const fitWords  = freshPool.filter(w => w.syllables && w.syllables.length <= cfg.gridSize && w.syllables.length >= 1);
  if (fitWords.length < 2) {
    const pc = document.getElementById('puzzle-content');
    if (pc) pc.innerHTML = `<div style="text-align:center;color:#aaa;padding:30px">
      ⚠️ 선택된 주제에 퍼즐에 맞는 단어가 부족해요. 다른 주제를 추가해 주세요!
    </div>`;
    return;
  }

  const actualTc = Math.min(cfg.targetCount, fitWords.length);
  const targets  = fitWords.slice(0, actualTc);
  targets.forEach(t => puzzleState.usedWordIds.add(t.id));

  if (cfg.scattered) {
    /* ── 고급: 음절 분리 배치 ── */
    puzzleState.scatteredMode = true;
    puzzleState.cellOwner     = {};

    let scGrid, scPlaced, validWords;
    let scRetry = 0;
    do {
      const freshTargets = shuffle([...targets]);
      const result = generateScatteredWordSearch(freshTargets, cfg.gridSize, freshPool);
      scGrid   = result.grid;
      scPlaced = result.placed;
      scPlaced.forEach(p => { p.isTarget = true; });
      const flatG = scGrid.flat();
      validWords = scPlaced.filter(p => p.isTarget)
        .filter(p => p.word.syllables.every(syl => flatG.includes(syl)));
      if (validWords.length >= Math.min(targets.length, 2)) break;
      scRetry++;
    } while (scRetry < 4);

    puzzleState.targetWords   = validWords.map(p => p.word);
    puzzleState.allPlaced     = validWords;
    puzzleState.grid          = scGrid;
    puzzleState.gridSize      = cfg.gridSize;
    puzzleState.selectedStart = null;
    puzzleState.foundCount    = 0;
    puzzleState.wordProgress  = {};
    puzzleState.targetWords.forEach(w => { puzzleState.wordProgress[w.id] = 0; });
    validWords.forEach(pl => {
      pl.cells.forEach((cell, idx) => {
        const key = cell.r + '-' + cell.c;
        if (!puzzleState.cellOwner[key]) {
          puzzleState.cellOwner[key] = { wordId: pl.word.id, syllableIdx: idx };
        }
      });
    });
  } else {
    /* ── 초급/중급: 인접 배치 ── */
    puzzleState.scatteredMode = false;
    puzzleState.wordProgress  = {};
    puzzleState.cellOwner     = {};

    const remaining    = fitWords.slice(actualTc);
    let fillerCount    = Math.min(cfg.fillerCount, remaining.length);
    const fillers      = remaining.slice(0, fillerCount);
    let grid, placed, placedTargetWords;
    let retries = 0, curFillerCount = fillerCount;

    do {
      const fillerSlice = fillers.slice(0, curFillerCount);
      const allWords = [...shuffle([...targets]), ...shuffle(fillerSlice)];
      ({ grid, placed } = generateWordSearch(allWords, cfg.gridSize, cfg.directions));
      placed.forEach(p => { p.isTarget = targets.some(t => t.id === p.word.id); });
      placedTargetWords = targets.filter(t => placed.some(p => p.isTarget && p.word.id === t.id));
      if (placedTargetWords.length >= Math.min(targets.length, 2)) break;
      curFillerCount = Math.max(0, curFillerCount - 1);
      retries++;
    } while (retries < 4);

    puzzleState.targetWords   = placedTargetWords;
    puzzleState.allPlaced     = placed;
    puzzleState.grid          = grid;
    puzzleState.gridSize      = cfg.gridSize;
    puzzleState.selectedStart = null;
    puzzleState.foundCount    = 0;
  }

  renderPuzzleGame(null, cfg);
}

/* ── 그리드 생성 알고리즘 (초급/중급) ── */
function generateWordSearch(words, gridSize, directions) {
  const grid   = Array.from({length: gridSize}, () => Array(gridSize).fill(''));
  const placed = [];

  for (const w of words) {
    const syls = w.syllables;
    if (!syls || !syls.length || syls.length > gridSize) continue;
    let done = false;
    const dirs = shuffle([...directions]);

    for (const dir of dirs) {
      if (done) break;
      /* 1차: 랜덤 300회 */
      for (let attempt = 0; attempt < 300 && !done; attempt++) {
        let cells;
        if (dir === 'H') {
          const maxC = gridSize - syls.length;
          if (maxC < 0) break;
          const r = Math.floor(Math.random() * gridSize);
          const c = Math.floor(Math.random() * (maxC + 1));
          cells = syls.map((s, i) => ({r, c: c + i}));
        } else {
          const maxR = gridSize - syls.length;
          if (maxR < 0) break;
          const r = Math.floor(Math.random() * (maxR + 1));
          const c = Math.floor(Math.random() * gridSize);
          cells = syls.map((s, i) => ({r: r + i, c}));
        }
        if (cells.every(cell => grid[cell.r][cell.c] === '')) {
          cells.forEach((cell, i) => { grid[cell.r][cell.c] = syls[i]; });
          placed.push({word: w, cells, found: false, isTarget: false});
          done = true;
        }
      }
      /* 2차: 체계적 스캔 */
      if (!done) {
        const startRows = shuffle(Array.from({length: gridSize}, (_, i) => i));
        for (const r of startRows) {
          if (done) break;
          if (dir === 'H') {
            const maxC = gridSize - syls.length;
            for (let c = 0; c <= maxC && !done; c++) {
              const cells = syls.map((s, i) => ({r, c: c + i}));
              if (cells.every(cell => grid[cell.r][cell.c] === '')) {
                cells.forEach((cell, i) => { grid[cell.r][cell.c] = syls[i]; });
                placed.push({word: w, cells, found: false, isTarget: false});
                done = true;
              }
            }
          } else {
            const maxR = gridSize - syls.length;
            for (let startR = 0; startR <= maxR && !done; startR++) {
              const cells = syls.map((s, i) => ({r: startR + i, c: r}));
              if (cells.every(cell => grid[cell.r][cell.c] === '')) {
                cells.forEach((cell, i) => { grid[cell.r][cell.c] = syls[i]; });
                placed.push({word: w, cells, found: false, isTarget: false});
                done = true;
              }
            }
          }
        }
      }
    }
  }

  /* 빈 칸 채우기 */
  const allSyls = words.flatMap(w2 => w2.syllables).filter(Boolean);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = allSyls.length ? allSyls[Math.floor(Math.random() * allSyls.length)] : '가';
      }
    }
  }
  return {grid, placed};
}

/* ── 산재 그리드 생성 (고급) ── */
function generateScatteredWordSearch(targetWords, gridSize, allWordsPool) {
  const grid     = Array.from({length: gridSize}, () => Array(gridSize).fill(''));
  const usedKeys = new Set();
  const placed   = [];

  for (const w of targetWords) {
    const syls = w.syllables;
    if (!syls || !syls.length) continue;
    const wCells = [];
    let ok = true;

    for (let i = 0; i < syls.length; i++) {
      let found = false;
      for (let att = 0; att < 400 && !found; att++) {
        const r = Math.floor(Math.random() * gridSize);
        const c = Math.floor(Math.random() * gridSize);
        const key = r + '-' + c;
        if (!usedKeys.has(key)) {
          usedKeys.add(key); grid[r][c] = syls[i]; wCells.push({r, c}); found = true;
        }
      }
      if (!found) {
        for (let r = 0; r < gridSize && !found; r++) {
          for (let c = 0; c < gridSize && !found; c++) {
            const key = r + '-' + c;
            if (!usedKeys.has(key)) {
              usedKeys.add(key); grid[r][c] = syls[i]; wCells.push({r, c}); found = true;
            }
          }
        }
      }
      if (!found) { ok = false; break; }
    }

    if (ok) {
      placed.push({word: w, cells: wCells, found: false, isTarget: true});
    } else {
      wCells.forEach(cell => {
        grid[cell.r][cell.c] = '';
        usedKeys.delete(cell.r + '-' + cell.c);
      });
    }
  }

  const allSyls = allWordsPool.flatMap(w => w.syllables || []).filter(Boolean);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === '') grid[r][c] = allSyls.length ? allSyls[Math.floor(Math.random() * allSyls.length)] : '가';
    }
  }
  return {grid, placed};
}

/* ── 게임 화면 렌더링 ── */
function renderPuzzleGame(cat, cfg) {
  const content = document.getElementById('puzzle-content');
  if (!content) return;
  if (!puzzleState.targetWords || !puzzleState.targetWords.length) { startPuzzleFromSelected(); return; }

  const scattered = puzzleState.scatteredMode;

  const targetCardsHtml = puzzleState.targetWords.map((w, wIdx) => {
    const pl      = puzzleState.allPlaced.find(p => p.word.id === w.id);
    const isFound = pl && pl.found;
    let bottomHtml;
    if (isFound) {
      bottomHtml = `<div class="syl-progress">${w.syllables.map((syl, i) =>
        `<span class="syl-box done-${wIdx}" id="sylbox-${w.id}-${i}">${syl}</span>`).join('')}</div>`;
    } else {
      const prog = puzzleState.wordProgress[w.id] || 0;
      bottomHtml = `<div class="syl-progress">${w.syllables.map((syl, i) => {
        const cls = i < prog ? `done-${wIdx}` : '';
        return `<span class="syl-box ${cls}" id="sylbox-${w.id}-${i}">${i < prog ? syl : '?'}</span>`;
      }).join('')}</div>`;
    }
    return `
    <div class="puzzle-target-card ${isFound ? 'found' : ''}" id="ptc-${w.id}"
         onclick="speakPuzzleCard('${w.word.replace(/'/g,"\\'")}','${w.id}');puzzleCardHint(${w.id})"
         style="cursor:pointer">
      <span class="puzzle-target-emoji" id="pte-${w.id}">${w.emoji}</span>
      <div class="puzzle-target-word">${w.word}</div>
      ${bottomHtml}
    </div>`;
  }).join('');

  const gs = puzzleState.gridSize;
  let gridHtml = '';
  for (let r = 0; r < gs; r++) {
    for (let c = 0; c < gs; c++) {
      gridHtml += `<div class="puzzle-cell" id="pc-${r}-${c}"
        data-r="${r}" data-c="${c}"
        onmousedown="puzzleDragStart(event,${r},${c})"
        onmousemove="puzzleDragOver(${r},${c})"
        onmouseup="puzzleDragEnd(event)"
        ontouchstart="puzzleTouchStart(event,${r},${c})"
        >${puzzleState.grid[r][c]}</div>`;
    }
  }

  let dirHint = '';
  if (scattered) {
    dirHint = '🔍 음절을 <b>순서대로</b> 하나씩 탭해요!<br>숨겨진 단어를 찾아보세요!';
  } else if (cfg.directions.length === 1) {
    dirHint = '👆 가로(→) 방향으로만 단어가 숨어있어요!<br>끌거나 한 글자씩 탭해 보세요!';
  } else {
    dirHint = '👆 가로(→)·세로(↓) 방향으로 단어가 숨어있어요!<br>끌거나 한 글자씩 탭해 보세요!';
  }

  const roundDots = Array.from({length: puzzleState.totalRounds}, (_, i) => {
    const n   = i + 1;
    const cls = n < puzzleState.currentRound ? 'done' : n === puzzleState.currentRound ? 'active' : '';
    return `<span class="round-dot ${cls}">${n}</span>`;
  }).join('');

  content.innerHTML = `
    <div class="puzzle-targets">${targetCardsHtml}</div>
    <div class="puzzle-grid-wrap">
      <div class="puzzle-grid ${cfg.cellClass}" id="puzzle-grid"
           style="grid-template-columns:repeat(${gs},1fr);touch-action:none"
           ontouchmove="puzzleTouchMove(event)"
           ontouchend="puzzleTouchEnd(event)">
        ${gridHtml}
      </div>
    </div>`;

  puzzleState.targetWords.forEach(w => {
    const el = document.getElementById(`pte-${w.id}`);
    if (el) applyTwemoji(el);
  });

  if (cfg.showEasyHints && !scattered) {
    puzzleState.allPlaced.forEach(pl => {
      if (!pl.isTarget) return;
      const tIdx = puzzleState.targetWords.findIndex(t => t.id === pl.word.id);
      if (tIdx < 0 || !pl.cells.length) return;
      const el = document.getElementById(`pc-${pl.cells[0].r}-${pl.cells[0].c}`);
      if (el) el.classList.add(`easy-hint-${tIdx}`);
    });
  }
}

/* ── 드래그 & 터치 ── */
let _puzzleDrag = { active: false, startR: -1, startC: -1, cells: [], direction: null, moved: false };

function _clearDragVisual() {
  document.querySelectorAll('.puzzle-cell.selected-start,.puzzle-cell.selected-path')
    .forEach(el => el.classList.remove('selected-start', 'selected-path'));
}

function _buildDragCells(startR, startC, endR, endC, dir) {
  const cells = [];
  if (dir === 'H' && endR === startR) {
    const lo = Math.min(startC, endC), hi = Math.max(startC, endC);
    for (let col = lo; col <= hi; col++) cells.push({r: startR, c: col});
  } else if (dir === 'V' && endC === startC) {
    const lo = Math.min(startR, endR), hi = Math.max(startR, endR);
    for (let row = lo; row <= hi; row++) cells.push({r: row, c: startC});
  }
  return cells;
}

function _applyDragVisual(cells) {
  cells.forEach(({r, c}, i) => {
    const el = document.getElementById(`pc-${r}-${c}`);
    if (el) el.classList.add(i === 0 ? 'selected-start' : 'selected-path');
  });
}

function puzzleDragStart(event, r, c) {
  if (puzzleState.scatteredMode) { puzzleCellClickScattered(r, c); return; }
  event.preventDefault();
  const foundCls = ['found-0','found-1','found-2','found-3','found-4'];
  const cellEl   = document.getElementById(`pc-${r}-${c}`);
  if (!cellEl || foundCls.some(cls => cellEl.classList.contains(cls))) return;
  _clearDragVisual();
  _puzzleDrag = { active: true, startR: r, startC: c, cells: [{r,c}], direction: null, moved: false };
}

function puzzleDragOver(r, c) {
  if (!_puzzleDrag.active) return;
  const { startR, startC } = _puzzleDrag;
  if (r === startR && c === startC) return;
  if (!_puzzleDrag.direction) {
    if (r === startR)      _puzzleDrag.direction = 'H';
    else if (c === startC) _puzzleDrag.direction = 'V';
    else return;
  }
  const dir = _puzzleDrag.direction;
  if (dir === 'H' && r !== startR) return;
  if (dir === 'V' && c !== startC) return;
  const newCells = _buildDragCells(startR, startC, r, c, dir);
  if (!newCells.length) return;
  _puzzleDrag.moved = true;
  _puzzleDrag.cells = newCells;
  _clearDragVisual();
  _applyDragVisual(newCells);
}

function puzzleDragEnd(event) {
  if (!_puzzleDrag.active) return;
  _puzzleDrag.active = false;
  const { moved, startR, startC, cells } = _puzzleDrag;
  if (!moved) { _clearDragVisual(); puzzleCellClick(startR, startC); return; }
  const wordText = cells.map(({r, c}) => puzzleState.grid[r][c]).join('');
  setTimeout(() => puzzleCheckWord(wordText, cells), 80);
}

function puzzleTouchStart(event, r, c) {
  event.preventDefault();
  if (puzzleState.scatteredMode) { puzzleCellClickScattered(r, c); return; }
  puzzleDragStart(event, r, c);
}

function puzzleTouchMove(event) {
  event.preventDefault();
  const touch  = event.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const r = parseInt(target.dataset.r), c = parseInt(target.dataset.c);
  if (!isNaN(r) && !isNaN(c)) puzzleDragOver(r, c);
}

function puzzleTouchEnd(event) { event.preventDefault(); puzzleDragEnd(event); }

function puzzleCellClick(r, c) {
  if (puzzleState.scatteredMode) puzzleCellClickScattered(r, c);
  else puzzleCellClickNormal(r, c);
}

/* ── 초급/중급: 인접 방식 클릭 ── */
function puzzleCellClickNormal(r, c) {
  const cellEl   = document.getElementById(`pc-${r}-${c}`);
  if (!cellEl) return;
  const foundCls = ['found-0','found-1','found-2','found-3','found-4'];
  if (foundCls.some(cls => cellEl.classList.contains(cls))) return;
  const tappedChar = puzzleState.grid[r][c];

  /* 1글자 단어: 즉시 정답 */
  const oneSyl = puzzleState.allPlaced.find(p =>
    p.isTarget && !p.found && p.word.syllables.length === 1 && p.word.syllables[0] === tappedChar
  );
  if (oneSyl) {
    puzzleState.selectedStart = null;
    _clearDragVisual();
    puzzleCheckWord(oneSyl.word.syllables.join(''), [{r, c}]);
    return;
  }

  /* 한 글자씩 순서 탭 */
  let seqMatch = null, seqColorIdx = -1, seqProgress = 0;
  for (const pl of puzzleState.allPlaced) {
    if (!pl.isTarget || pl.found) continue;
    const prog = puzzleState.wordProgress[pl.word.id] || 0;
    if (prog > 0 && pl.word.syllables[prog] === tappedChar) {
      seqMatch = pl; seqProgress = prog;
      seqColorIdx = puzzleState.targetWords.findIndex(t => t.id === pl.word.id);
      break;
    }
  }
  if (!seqMatch) {
    for (const pl of puzzleState.allPlaced) {
      if (!pl.isTarget || pl.found) continue;
      const prog = puzzleState.wordProgress[pl.word.id] || 0;
      if (prog === 0 && pl.word.syllables[0] === tappedChar) {
        seqMatch = pl; seqProgress = 0;
        seqColorIdx = puzzleState.targetWords.findIndex(t => t.id === pl.word.id);
        break;
      }
    }
  }
  if (seqMatch) {
    if (puzzleState.selectedStart) {
      const prevEl = document.getElementById(`pc-${puzzleState.selectedStart.r}-${puzzleState.selectedStart.c}`);
      if (prevEl) prevEl.classList.remove('selected-start','selected-path');
      puzzleState.selectedStart = null;
    }
    puzzleState.wordProgress[seqMatch.word.id] = seqProgress + 1;
    cellEl.classList.remove('easy-hint-0','easy-hint-1','easy-hint-2','easy-hint-3','easy-hint-4',
                             'selected-start','selected-path');
    cellEl.classList.add(`found-${seqColorIdx}`,'found-bounce','seq-correct');
    setTimeout(() => cellEl.classList.remove('found-bounce'), 500);
    speak(tappedChar);
    updateSylBox(seqMatch.word.id, seqProgress, seqProgress, seqColorIdx, tappedChar);
    const totalSyls = seqMatch.word.syllables.length;
    if (seqProgress + 1 >= totalSyls) {
      seqMatch.found = true;
      puzzleState.foundCount++;
      setTimeout(() => triggerWordExplosion(r, c, seqMatch, seqColorIdx), 100);
      showPuzzleHintBox(`🎉 "${seqMatch.word.word}" 완성! 🎆`);
      speak(seqMatch.word.word);
      playCorrectSound();
      showConfetti(35);
      updatePuzzleProgressBar();
      updatePuzzleTargetCard(seqMatch.word.id, seqColorIdx);
      if (puzzleState.foundCount >= puzzleState.targetWords.length) setTimeout(renderPuzzleComplete, 1600);
    } else {
      showPuzzleHintBox(`👍 "${seqMatch.word.word}" ${seqProgress+1}/${totalSyls} — ${totalSyls-(seqProgress+1)}글자 더!`);
      updatePuzzleProgressBar();
    }
    return;
  }

  /* 기존: 첫 글자/끝 글자 선택 방식 */
  if (!puzzleState.selectedStart) {
    puzzleState.selectedStart = {r, c};
    cellEl.classList.add('selected-start');
    speak(tappedChar);
  } else {
    const start   = puzzleState.selectedStart;
    puzzleState.selectedStart = null;
    const startEl = document.getElementById(`pc-${start.r}-${start.c}`);
    if (startEl) startEl.classList.remove('selected-start','selected-path');
    if (start.r === r && start.c === c) return;
    let selCells = [];
    if (start.r === r) {
      const lo = Math.min(start.c, c), hi = Math.max(start.c, c);
      for (let col = lo; col <= hi; col++) selCells.push({r, c: col});
    } else if (start.c === c) {
      const lo = Math.min(start.r, r), hi = Math.max(start.r, r);
      for (let row = lo; row <= hi; row++) selCells.push({r: row, c});
    } else {
      showPuzzleHintBox('😅 가로 또는 세로로만 선택해 주세요!'); return;
    }
    selCells.forEach(({r: pr, c: pc}) => {
      const el = document.getElementById(`pc-${pr}-${pc}`);
      if (el && !foundCls.some(cls => el.classList.contains(cls))) el.classList.add('selected-path');
    });
    const wordText = selCells.map(({r: pr, c: pc}) => puzzleState.grid[pr][pc]).join('');
    setTimeout(() => puzzleCheckWord(wordText, selCells), 110);
  }
}

/* ── 고급: 음절 순서 탭 ── */
function puzzleCellClickScattered(r, c) {
  const cellEl   = document.getElementById(`pc-${r}-${c}`);
  if (!cellEl) return;
  const foundCls = ['found-0','found-1','found-2','found-3','found-4'];
  if (foundCls.some(cls => cellEl.classList.contains(cls))) return;
  const tappedSyl = puzzleState.grid[r][c];

  let matchedPl = null, matchedColorIdx = -1, matchedProgress = 0;
  for (const pl of puzzleState.allPlaced) {
    if (!pl.isTarget || pl.found) continue;
    const prog = puzzleState.wordProgress[pl.word.id] || 0;
    if (pl.word.syllables[prog] === tappedSyl) {
      matchedPl = pl; matchedProgress = prog;
      matchedColorIdx = puzzleState.targetWords.findIndex(t => t.id === pl.word.id);
      break;
    }
  }

  if (!matchedPl) {
    cellEl.classList.add('wrong-flash');
    setTimeout(() => cellEl.classList.remove('wrong-flash'), 450);
    playWrongSound();
    const hintTexts = puzzleState.allPlaced.filter(p => p.isTarget && !p.found).map(p => {
      const prog = puzzleState.wordProgress[p.word.id] || 0;
      return `"${p.word.syllables[prog]}"`;
    });
    showPuzzleHintBox(`😊 ${hintTexts.length ? '다음 음절: ' + hintTexts.join(' / ') : '힌트를 눌러보세요~'}`);
    return;
  }

  puzzleState.wordProgress[matchedPl.word.id] = matchedProgress + 1;
  cellEl.classList.add(`found-${matchedColorIdx}`,'found-bounce','seq-correct');
  setTimeout(() => cellEl.classList.remove('found-bounce'), 500);
  speak(tappedSyl);
  updateSylBox(matchedPl.word.id, matchedProgress, matchedProgress, matchedColorIdx, tappedSyl);

  const totalSyls = matchedPl.word.syllables.length;
  if (matchedProgress + 1 >= totalSyls) {
    matchedPl.found = true;
    puzzleState.foundCount++;
    setTimeout(() => triggerWordExplosion(r, c, matchedPl, matchedColorIdx), 100);
    showPuzzleHintBox(`🎉 "${matchedPl.word.word}" 완성! 🎆`);
    speak(matchedPl.word.word);
    playCorrectSound();
    showConfetti(35);
    updatePuzzleProgressBar();
    if (puzzleState.foundCount >= puzzleState.targetWords.length) setTimeout(renderPuzzleComplete, 1600);
  } else {
    const remaining = totalSyls - (matchedProgress + 1);
    showPuzzleHintBox(`👍 "${matchedPl.word.word}" ${matchedProgress+1}/${totalSyls} — ${remaining}글자 더!`);
    updatePuzzleProgressBar();
  }
}

/* ── 단어 확인 (드래그 완료 후) ── */
function puzzleCheckWord(wordText, cells) {
  const matched = puzzleState.allPlaced.find(p =>
    !p.found && p.isTarget && p.word.syllables.join('') === wordText
  );
  if (matched) {
    matched.found = true;
    const colorIdx = puzzleState.foundCount++;
    const hintCls  = ['easy-hint-0','easy-hint-1','easy-hint-2','easy-hint-3','easy-hint-4'];
    cells.forEach(({r, c}) => {
      const el = document.getElementById(`pc-${r}-${c}`);
      if (el) {
        el.classList.remove('selected-path','selected-start',...hintCls);
        el.classList.add(`found-${colorIdx}`,'found-bounce');
        setTimeout(() => el.classList.remove('found-bounce'), 500);
      }
    });
    matched.cells.forEach(({r, c}) => {
      const el = document.getElementById(`pc-${r}-${c}`);
      if (el) el.classList.remove(...hintCls,'selected-start','selected-path');
    });

    const tcEl = document.getElementById(`ptc-${matched.word.id}`);
    if (tcEl) { tcEl.classList.add('found','word-explode'); setTimeout(() => tcEl.classList.remove('word-explode'), 750); }

    puzzleState.wordProgress[matched.word.id] = matched.word.syllables.length;
    matched.word.syllables.forEach((syl, i) => {
      const boxEl = document.getElementById(`sylbox-${matched.word.id}-${i}`);
      if (boxEl) { boxEl.classList.add(`done-${colorIdx}`); boxEl.textContent = syl; }
    });

    /* 별 터지기 */
    const emojis = ['⭐','✨','🌟','💥','🎉','🎊'];
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const ov = document.createElement('div');
        ov.className   = 'starburst-overlay';
        ov.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        ov.style.left  = (window.innerWidth  * 0.15 + Math.random() * window.innerWidth  * 0.7) + 'px';
        ov.style.top   = (window.innerHeight * 0.15 + Math.random() * window.innerHeight * 0.6) + 'px';
        document.body.appendChild(ov);
        setTimeout(() => ov.remove(), 900);
      }, i * 100);
    }

    updatePuzzleProgressBar();
    showPuzzleHintBox(`🎉 "${matched.word.word}" 찾았어요! 대단해요!`);
    speak(matched.word.word);
    playCorrectSound();
    showConfetti(22);
    if (puzzleState.foundCount >= puzzleState.targetWords.length) setTimeout(renderPuzzleComplete, 1300);
  } else {
    cells.forEach(({r, c}) => {
      const el = document.getElementById(`pc-${r}-${c}`);
      if (el) { el.classList.remove('selected-path','selected-start'); el.classList.add('wrong-flash'); setTimeout(() => el.classList.remove('wrong-flash'), 450); }
    });
    showPuzzleHintBox('😊 다시 해봐요! 첫 글자 → 끝 글자 탭~');
    playWrongSound();
  }
}

/* ── 음절 박스 업데이트 ── */
function updateSylBox(wordId, progress, sylIdx, colorIdx, sylText) {
  const boxEl = document.getElementById(`sylbox-${wordId}-${sylIdx}`);
  if (boxEl) { boxEl.classList.add(`done-${colorIdx}`); boxEl.textContent = sylText; }
}

/* ── 진행 바 ── */
function updatePuzzleProgressBar() {
  const total = puzzleState.targetWords.length;
  const pct   = Math.round((puzzleState.foundCount / total) * 100);
  const fillEl= document.getElementById('puzzle-prog-fill');
  const textEl= document.getElementById('puzzle-prog-text');
  if (fillEl) fillEl.style.width = pct + '%';
  if (textEl) textEl.textContent = `${puzzleState.foundCount} / ${total} 발견 🔍`;
}

/* ── 단어 완성 폭발 효과 ── */
function triggerWordExplosion(lastR, lastC, pl, colorIdx) {
  const cardEl = document.getElementById(`ptc-${pl.word.id}`);
  if (cardEl) {
    cardEl.classList.add('found','word-explode');
    pl.word.syllables.forEach((syl, i) => {
      const boxEl = document.getElementById(`sylbox-${pl.word.id}-${i}`);
      if (boxEl) { boxEl.classList.add(`done-${colorIdx}`); boxEl.textContent = syl; }
    });
    setTimeout(() => cardEl.classList.remove('word-explode'), 750);
  }
  const lastCellEl = document.getElementById(`pc-${lastR}-${lastC}`);
  if (lastCellEl) { lastCellEl.classList.add('cell-burst'); setTimeout(() => lastCellEl.classList.remove('cell-burst'), 700); }
  const emojis = ['⭐','✨','🌟','💥','🎉','🎊'];
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const ov = document.createElement('div');
      ov.className   = 'starburst-overlay';
      ov.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      ov.style.left  = (window.innerWidth * 0.2 + Math.random() * window.innerWidth * 0.6) + 'px';
      ov.style.top   = (window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.5) + 'px';
      document.body.appendChild(ov);
      setTimeout(() => ov.remove(), 900);
    }, i * 110);
  }
}

/* ── 힌트 ── */
function puzzleHint() {
  const notFound = puzzleState.allPlaced.filter(p => p.isTarget && !p.found);
  if (!notFound.length) { showPuzzleHintBox('모두 찾았어요! 🏆'); return; }
  const foundCls = ['found-0','found-1','found-2','found-3','found-4'];
  const target   = notFound[0];
  if (puzzleState.scatteredMode) {
    const progress = puzzleState.wordProgress[target.word.id] || 0;
    if (progress < target.cells.length) {
      const nextCell = target.cells[progress];
      const el = document.getElementById(`pc-${nextCell.r}-${nextCell.c}`);
      if (el && !foundCls.some(cls => el.classList.contains(cls))) {
        el.style.background = 'linear-gradient(135deg,#FFE082,#FFCA28)';
        el.style.borderColor= '#F57F17';
        el.style.transform  = 'scale(1.2)';
        setTimeout(() => {
          if (!foundCls.some(cls => el.classList.contains(cls))) {
            el.style.background = ''; el.style.borderColor = ''; el.style.transform = '';
          }
        }, 1050);
      }
      showPuzzleHintBox(`💡 "${target.word.word}"의 ${progress+1}번째 음절 "${target.word.syllables[progress]}"을 찾아요!`);
    }
  } else {
    target.cells.forEach(({r, c}) => {
      const el = document.getElementById(`pc-${r}-${c}`);
      if (el && !foundCls.some(cls => el.classList.contains(cls))) {
        el.style.background = 'linear-gradient(135deg,#FFE082,#FFCA28)';
        el.style.borderColor= '#F57F17';
        setTimeout(() => { if (!foundCls.some(cls => el.classList.contains(cls))) { el.style.background=''; el.style.borderColor=''; } }, 2000);
      }
    });
    const dir = target.cells[0].r === target.cells[target.cells.length-1].r ? '→ 가로' : '↓ 세로';
    showPuzzleHintBox(`💡 "${target.word.word}" 은(는) ${dir} 방향에 있어요!`);
  }
  speak(target.word.word);
}

function showPuzzleHintBox(msg) {
  const el = document.getElementById('puzzle-hint-box');
  if (el) el.textContent = msg;
  clearTimeout(puzzleState.hintTimeout);
  puzzleState.hintTimeout = setTimeout(() => {
    const el2 = document.getElementById('puzzle-hint-box');
    if (el2) el2.textContent = '💡 단어를 찾아보세요!';
  }, 3500);
}

/* ── 카드 TTS ── */
async function speakPuzzleCard(word, wordId) {
  const cardEl = document.getElementById(`ptc-${wordId}`);
  if (cardEl) {
    cardEl.classList.add('speaking');
    setTimeout(() => cardEl.classList.remove('speaking'), 900);
  }
  await speak(word);
}

function puzzleCardHint(wordId) {
  const pl = puzzleState.allPlaced.find(p => p.isTarget && p.word.id === wordId);
  if (!pl || pl.found) return;
  const progress = puzzleState.wordProgress[pl.word.id] || 0;
  const nextSyl  = pl.word.syllables[progress];
  const foundCls = ['found-0','found-1','found-2','found-3','found-4'];
  const targetCell = puzzleState.scatteredMode && progress < pl.cells.length
    ? pl.cells[progress]
    : pl.cells[0];
  if (targetCell) {
    const el = document.getElementById(`pc-${targetCell.r}-${targetCell.c}`);
    if (el && !foundCls.some(cls => el.classList.contains(cls))) {
      el.style.background = ''; el.style.borderColor = ''; el.style.transform = '';
      el.classList.remove('hint-blink');
      void el.offsetWidth;
      el.classList.add('hint-blink');
      setTimeout(() => { if (!foundCls.some(cls => el.classList.contains(cls))) el.classList.remove('hint-blink'); }, 1050);
    }
  }
  showPuzzleHintBox(`💡 "${pl.word.word}"의 첫 글자 → "${nextSyl}"`);
}

function updatePuzzleTargetCard(wordId, colorIdx) {
  const cardEl = document.getElementById(`ptc-${wordId}`);
  if (!cardEl) return;
  cardEl.classList.add('found','word-explode');
  setTimeout(() => cardEl.classList.remove('word-explode'), 750);
}

/* ── 완료 화면 ── */
function renderPuzzleComplete() {
  const content = document.getElementById('puzzle-content');
  if (!content) return;
  const diffLabel = PUZZLE_CONFIG[puzzleState.difficulty].label;
  const round     = puzzleState.currentRound;
  const total     = puzzleState.totalRounds;
  puzzleState.allFoundWords.push(...puzzleState.targetWords);

  const roundWordChips = puzzleState.targetWords.map(w =>
    `<div class="rc-word-chip">
      <div style="font-size:1.7em" id="rcw-${w.id}">${w.emoji}</div>
      <div style="font-size:0.88em;font-weight:700;color:#2c3e50">${w.word}</div>
    </div>`
  ).join('');

  if (round < total) {
    showConfetti(28);
    const nextRound = round + 1;
    const roundDots2 = Array.from({length: total}, (_, i) => {
      const n   = i + 1;
      const cls = n <= round ? 'done' : n === nextRound ? 'active' : '';
      return `<span class="round-dot ${cls}">${n}</span>`;
    }).join('');

    content.innerHTML = `
      <div class="round-complete">
        <div class="puzzle-round-bar" style="margin-bottom:8px">
          <span class="round-label">라운드</span>
          <div class="round-dots">${roundDots2}</div>
        </div>
        <div class="rc-round-num">🎯 라운드 ${round} / ${total} 완료!</div>
        <div class="rc-title">잘했어요! 🎉</div>
        <div class="rc-words">${roundWordChips}</div>
        <div class="rc-next-msg">잠시 후 라운드 ${nextRound} 시작...</div>
        <div class="rc-countdown" id="rc-countdown">3</div>
        <div class="puzzle-controls">
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#7E57C2,#9C27B0);color:white"
                  onclick="clearTimeout(puzzleState.roundTimer);puzzleState.currentRound=${nextRound};startNextRound()">
            ▶ 바로 다음 라운드
          </button>
        </div>
      </div>`;

    puzzleState.targetWords.forEach(w => {
      const el = document.getElementById(`rcw-${w.id}`);
      if (el) applyTwemoji(el);
    });

    puzzleState.currentRound = nextRound;
    let cnt = 3;
    puzzleState.roundTimer = setInterval(() => {
      cnt--;
      const el = document.getElementById('rc-countdown');
      if (el) el.textContent = cnt;
      if (cnt <= 0) { clearInterval(puzzleState.roundTimer); startNextRound(); }
    }, 1000);
    speak(`라운드 ${round} 완료! 잘했어요!`);
  } else {
    showConfetti(80);
    const diffOrder = ['easy','medium','hard'];
    const currIdx   = diffOrder.indexOf(puzzleState.difficulty);
    const nextDiff  = diffOrder[Math.min(currIdx + 1, diffOrder.length - 1)];
    const allWordChips = puzzleState.allFoundWords.map(w =>
      `<div class="gf-word-chip">
        <div style="font-size:1.5em" id="gfw-${w.id}">${w.emoji}</div>
        <div style="font-weight:700;color:#2c3e50">${w.word}</div>
      </div>`
    ).join('');
    const totalWords = puzzleState.allFoundWords.length;

    content.innerHTML = `
      <div class="grand-finale">
        <div class="gf-icon">🏆</div>
        <h2>${total}라운드 완료!</h2>
        <div style="margin-bottom:8px"><span class="diff-badge-${puzzleState.difficulty}">${diffLabel}</span></div>
        <div class="gf-stats">
          <div class="gf-stat-chip">🎯 ${total}라운드 완주</div>
          <div class="gf-stat-chip">📚 ${totalWords}단어 발견</div>
        </div>
        <div style="font-size:0.9em;color:#888;margin-bottom:8px">찾은 모든 단어</div>
        <div class="gf-all-words">${allWordChips}</div>
        <div class="puzzle-controls">
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#7E57C2,#9C27B0);color:white"
                  onclick="startPuzzleFromSelected()">🔀 다시 ${total}라운드</button>
          ${nextDiff !== puzzleState.difficulty
            ? `<button class="btn btn-orange btn-sm" onclick="setPuzzleDiff('${nextDiff}')">
               ${{easy:'🟢 초급으로',medium:'🟡 중급 도전!',hard:'🔴 고급 도전!'}[nextDiff]}
               </button>` : ''}
          <button class="btn btn-gray btn-sm" onclick="closePuzzleDialog()">✕ 닫기</button>
        </div>
      </div>`;

    puzzleState.allFoundWords.forEach(w => {
      const el = document.getElementById(`gfw-${w.id}`);
      if (el) applyTwemoji(el);
    });
    speak(`${total}라운드 모두 완료! 정말 대단해요! 최고예요!`);
  }
}

/* 레거시 alias */
function startPuzzle() { startPuzzleFromSelected(); }
