// ラベンダー収穫パズル - メインゲームロジック
class LavenderPuzzleGame {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 8; // 8x8のボード
        this.cellSize = this.canvas.width / this.boardSize;
        this.board = [];
        this.score = 0;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.isPaused = false;
        this.selectedCells = [];
        this.isDragging = false;
        this.language = 'en'; // デフォルトは英語
        
        // ラベンダーの種類（色）
        this.lavenderTypes = [
            { id: 0, color: '#9370DB', name: 'ラベンダー' }, // 標準ラベンダー
            { id: 1, color: '#8A2BE2', name: 'ブルーラベンダー' }, // 青紫
            { id: 2, color: '#DDA0DD', name: 'ピンクラベンダー' }, // ピンク
            { id: 3, color: '#E6E6FA', name: 'ライトラベンダー' } // 薄紫
        ];
        
        this.initializeGame();
        this.setupEventListeners();
        this.setupLanguage();
    }
    
    // ゲーム初期化
    initializeGame() {
        this.generateBoard();
        
        // 有効な移動がない場合はシャッフル
        if (!this.hasValidMoves()) {
            this.reshuffleBoard();
        } else {
            this.drawBoard();
        }
    }
    
    // ボード生成
    generateBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = Math.floor(Math.random() * this.lavenderTypes.length);
            }
        }
        // 初期状態でマッチするものがないように調整
        this.removeInitialMatches();
    }
    
    // 初期マッチを除去
    removeInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            hasMatches = false;
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    if (this.checkMatches(row, col).length > 0) {
                        this.board[row][col] = Math.floor(Math.random() * this.lavenderTypes.length);
                        hasMatches = true;
                    }
                }
            }
        }
    }
    
    // ボード描画
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド線
        this.ctx.strokeStyle = 'rgba(147, 112, 219, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // ラベンダー描画
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.drawLavender(row, col);
            }
        }
        
        // 選択されたセルをハイライト
        this.selectedCells.forEach(cell => {
            this.highlightCell(cell.row, cell.col);
        });
    }
    
    // ラベンダー描画
    drawLavender(row, col) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;
        const radius = this.cellSize * 0.3;
        
        const lavenderType = this.lavenderTypes[this.board[row][col]];
        
        // ラベンダーの花びら
        this.ctx.fillStyle = lavenderType.color;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const petalX = centerX + Math.cos(angle) * radius * 0.8;
            const petalY = centerY + Math.sin(angle) * radius * 0.8;
            
            this.ctx.beginPath();
            this.ctx.arc(petalX, petalY, radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 中心
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 茎
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY + radius * 0.3);
        this.ctx.lineTo(centerX, y + this.cellSize - 5);
        this.ctx.stroke();
    }
    
    // セルハイライト
    highlightCell(row, col) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    }
    
    // マウス座標をボード座標に変換
    getBoardPosition(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = mouseX - rect.left;
        const y = mouseY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            return { row, col };
        }
        return null;
    }
    
    // マッチチェック
    checkMatches(startRow, startCol) {
        const type = this.board[startRow][startCol];
        const visited = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
        const matches = [];
        
        const dfs = (row, col) => {
            if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) return;
            if (visited[row][col] || this.board[row][col] !== type) return;
            
            visited[row][col] = true;
            matches.push({ row, col });
            
            // 上下左右をチェック
            dfs(row - 1, col);
            dfs(row + 1, col);
            dfs(row, col - 1);
            dfs(row, col + 1);
        };
        
        dfs(startRow, startCol);
        return matches.length >= 3 ? matches : [];
    }
    
    // マッチしたセルを削除
    removeMatches(matches) {
        matches.forEach(cell => {
            this.board[cell.row][cell.col] = -1; // 空にする
        });
        
        // 重力効果
        this.applyGravity();
        
        // 新しいラベンダーを生成
        this.fillEmptyCells();
        
        // 3個以上隣接できるラベンダーがあるかチェック
        if (!this.hasValidMoves()) {
            this.reshuffleBoard();
        }
    }
    
    // 重力効果
    applyGravity() {
        for (let col = 0; col < this.boardSize; col++) {
            let writeRow = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== -1) {
                    if (writeRow !== row) {
                        this.board[writeRow][col] = this.board[row][col];
                        this.board[row][col] = -1;
                    }
                    writeRow--;
                }
            }
        }
    }
    
    // 空のセルを埋める
    fillEmptyCells() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === -1) {
                    this.board[row][col] = Math.floor(Math.random() * this.lavenderTypes.length);
                }
            }
        }
    }
    
    // 有効な移動があるかチェック
    hasValidMoves() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.checkMatches(row, col).length >= 3) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // ボードをシャッフル
    reshuffleBoard() {
        // 現在のボードの内容を保存
        const currentBoard = this.board.map(row => [...row]);
        
        // シャッフル通知を表示
        this.showShuffleNotification();
        
        // 新しいボードを生成
        this.generateBoard();
        
        // 有効な移動がない場合は再度シャッフル
        let attempts = 0;
        while (!this.hasValidMoves() && attempts < 10) {
            this.generateBoard();
            attempts++;
        }
        
        // それでも有効な移動がない場合は、一部のセルを強制的に変更
        if (!this.hasValidMoves()) {
            this.forceValidMoves();
        }
        
        this.drawBoard();
    }
    
    // シャッフル通知を表示
    showShuffleNotification() {
        const comboText = document.getElementById('combo-text');
        
        if (this.language === 'ja') {
            comboText.textContent = 'ボードをシャッフル中...';
        } else {
            comboText.textContent = 'Shuffling board...';
        }
        
        comboText.classList.add('show', 'shuffle');
        
        // 1.5秒後に通知を消す
        setTimeout(() => {
            comboText.classList.remove('show', 'shuffle');
        }, 1500);
    }
    
    // 強制的に有効な移動を作成
    forceValidMoves() {
        // ランダムに3つの隣接するセルを同じ色にする
        const startRow = Math.floor(Math.random() * (this.boardSize - 1));
        const startCol = Math.floor(Math.random() * (this.boardSize - 1));
        const color = Math.floor(Math.random() * this.lavenderTypes.length);
        
        // 水平方向に3つ並べる
        if (startCol + 2 < this.boardSize) {
            this.board[startRow][startCol] = color;
            this.board[startRow][startCol + 1] = color;
            this.board[startRow][startCol + 2] = color;
        } else {
            // 垂直方向に3つ並べる
            this.board[startRow][startCol] = color;
            this.board[startRow + 1][startCol] = color;
            this.board[startRow + 2][startCol] = color;
        }
    }
    
    // スコア計算
    calculateScore(matches) {
        const baseScore = 10;
        const comboMultiplier = Math.min(matches.length - 2, 5); // 最大5倍
        return baseScore * matches.length * (1 + comboMultiplier * 0.5);
    }
    
    // エフェクト生成
    createLavenderEffect(x, y, count) {
        const effectsContainer = document.getElementById('effects-container');
        
        for (let i = 0; i < count; i++) {
            const effect = document.createElement('div');
            effect.className = 'lavender-effect';
            effect.style.left = (x + Math.random() * 40 - 20) + 'px';
            effect.style.top = (y + Math.random() * 40 - 20) + 'px';
            effect.style.animationDelay = Math.random() * 0.5 + 's';
            
            effectsContainer.appendChild(effect);
            
            // アニメーション終了後に要素を削除
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 2000);
        }
    }
    
    // コンボテキスト表示
    showComboText(matches) {
        const comboText = document.getElementById('combo-text');
        const comboCount = matches.length;
        
        if (this.language === 'ja') {
            if (comboCount >= 5) {
                comboText.textContent = `メガコンボ! ${comboCount}`;
            } else if (comboCount >= 4) {
                comboText.textContent = `コンボ! ${comboCount}`;
            } else {
                comboText.textContent = `${comboCount} つながり!`;
            }
        } else {
            if (comboCount >= 5) {
                comboText.textContent = `MEGA COMBO! ${comboCount}`;
            } else if (comboCount >= 4) {
                comboText.textContent = `COMBO! ${comboCount}`;
            } else {
                comboText.textContent = `${comboCount} CONNECTIONS!`;
            }
        }
        
        comboText.classList.add('show');
        setTimeout(() => {
            comboText.classList.remove('show');
        }, 1000);
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        
        // ドキュメント全体のマウスイベント（ドラッグ中にキャンバスから離れた場合）
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // タッチイベント（モバイル対応）
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // ボタンイベント
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('how-to-play-btn').addEventListener('click', () => this.showHowToPlay());
        document.getElementById('how-to-play-back-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('pause-back-to-menu-btn').addEventListener('click', () => this.backToMenuFromPause());
        document.getElementById('game-back-to-menu-btn').addEventListener('click', () => this.backToMenuFromGame());
        document.getElementById('lang-btn').addEventListener('click', () => this.toggleLanguage());
    }
    
    // マウスダウン
    handleMouseDown(e) {
        if (!this.gameRunning || this.isPaused) return;
        
        const pos = this.getBoardPosition(e.clientX, e.clientY);
        if (pos) {
            this.isDragging = true;
            this.selectedCells = [{ row: pos.row, col: pos.col }];
            this.drawBoard();
        }
    }
    
    // マウス移動
    handleMouseMove(e) {
        if (!this.isDragging || !this.gameRunning || this.isPaused) return;
        
        const pos = this.getBoardPosition(e.clientX, e.clientY);
        if (pos && this.selectedCells.length > 0) {
            const lastCell = this.selectedCells[this.selectedCells.length - 1];
            
            // 隣接しているかチェック（上下左右のみ）
            const isAdjacent = (
                (Math.abs(pos.row - lastCell.row) === 1 && pos.col === lastCell.col) ||
                (Math.abs(pos.col - lastCell.col) === 1 && pos.row === lastCell.row)
            );
            
            if (isAdjacent) {
                // 同じタイプかチェック
                if (this.board[pos.row][pos.col] === this.board[lastCell.row][lastCell.col]) {
                    // 既に選択されていないかチェック
                    const alreadySelected = this.selectedCells.some(cell => 
                        cell.row === pos.row && cell.col === pos.col
                    );
                    if (!alreadySelected) {
                        this.selectedCells.push({ row: pos.row, col: pos.col });
                        this.drawBoard();
                    }
                }
            }
        } else if (pos && this.selectedCells.length === 0) {
            // ドラッグ開始時の処理
            this.selectedCells = [{ row: pos.row, col: pos.col }];
            this.drawBoard();
        }
    }
    
    // マウスアップ
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        if (this.selectedCells.length >= 3) {
            this.processSelection();
        }
        
        this.selectedCells = [];
        this.drawBoard();
    }
    
    // マウスがキャンバスから離れた場合
    handleMouseLeave(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.selectedCells = [];
            this.drawBoard();
        }
    }
    
    // タッチイベント（マウスイベントのラッパー）
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }
    
    // 選択処理
    processSelection() {
        const matches = this.selectedCells;
        const scoreGain = this.calculateScore(matches);
        
        this.score += scoreGain;
        this.updateScore();
        
        // エフェクト生成
        const canvasRect = this.canvas.getBoundingClientRect();
        const centerX = canvasRect.left + this.canvas.width / 2;
        const centerY = canvasRect.top + this.canvas.height / 2;
        this.createLavenderEffect(centerX, centerY, Math.min(matches.length * 3, 20));
        
        // コンボテキスト表示
        this.showComboText(matches);
        
        // マッチしたセルを削除
        this.removeMatches(matches);
        
        // ボード再描画
        setTimeout(() => {
            this.drawBoard();
        }, 100);
    }
    
    // スコア更新
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    // タイマー更新
    updateTimer() {
        document.getElementById('timer').textContent = this.timeLeft;
    }
    
    // ゲーム画面の言語更新
    updateGameScreenLanguage() {
        const scoreLabel = document.querySelector('.score-label');
        const timeLabel = document.querySelector('.time-label');
        
        if (scoreLabel) {
            scoreLabel.textContent = this.language === 'ja' ? 'スコア:' : 'Score:';
        }
        if (timeLabel) {
            timeLabel.textContent = this.language === 'ja' ? '残り時間:' : 'Time:';
        }
    }
    
    // ゲーム開始
    startGame() {
        this.showScreen('game-screen');
        this.gameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.timeLeft = 60;
        this.updateScore();
        this.updateTimer();
        
        this.gameTimer = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.updateTimer();
                
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }
    
    // ゲーム終了
    endGame() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        
        document.getElementById('final-score').textContent = this.score;
        this.updateResultMessage();
        this.showScreen('gameover-screen');
    }
    
    // 結果メッセージ更新
    updateResultMessage() {
        const messageElement = document.getElementById('result-message');
        let message = '';
        
        if (this.score >= 1000) {
            message = this.language === 'ja' ? '素晴らしい収穫でした！' : 'Excellent harvest!';
        } else if (this.score >= 500) {
            message = this.language === 'ja' ? '良い収穫でした！' : 'Good harvest!';
        } else if (this.score >= 200) {
            message = this.language === 'ja' ? 'まずまずの収穫でした。' : 'Decent harvest.';
        } else {
            message = this.language === 'ja' ? 'もう少し頑張りましょう。' : 'Keep trying!';
        }
        
        messageElement.textContent = message;
    }
    
    // ゲーム再開
    restartGame() {
        this.initializeGame();
        this.startGame();
    }
    
    // 一時停止切り替え
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showScreen('pause-screen');
        } else {
            this.showScreen('game-screen');
        }
    }
    
    // 画面表示切り替え
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    // 遊び方画面表示
    showHowToPlay() {
        this.showScreen('how-to-play-screen');
    }
    
    // スタート画面表示
    showStartScreen() {
        this.showScreen('start-screen');
    }
    
    // 一時停止画面からメニューに戻る
    backToMenuFromPause() {
        this.isPaused = false;
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        this.showStartScreen();
    }
    
    // ゲーム画面からメニューに戻る
    backToMenuFromGame() {
        this.gameRunning = false;
        clearInterval(this.gameTimer);
        this.showStartScreen();
    }
    
    // 言語切り替え
    toggleLanguage() {
        this.language = this.language === 'ja' ? 'en' : 'ja';
        this.updateLanguage();
    }
    
    // 言語設定
    setupLanguage() {
        this.updateLanguage();
    }
    
    // 言語更新
    updateLanguage() {
        const langBtn = document.getElementById('lang-btn');
        const elements = {
            'start-btn': { ja: 'ゲーム開始', en: 'Start Game' },
            'how-to-play-btn': { ja: '遊び方', en: 'How to Play' },
            'how-to-play-back-btn': { ja: 'メニューに戻る', en: 'Back to Menu' },
            'pause-btn': { ja: '一時停止', en: 'Pause' },
            'resume-btn': { ja: '続ける', en: 'Resume' },
            'restart-btn': { ja: 'リスタート', en: 'Restart' },
            'retry-btn': { ja: 'もう一度プレイ', en: 'Play Again' },
            'back-to-menu-btn': { ja: 'メニューに戻る', en: 'Back to Menu' },
            'pause-back-to-menu-btn': { ja: 'メニューに戻る', en: 'Back to Menu' },
            'game-back-to-menu-btn': { ja: 'メニューに戻る', en: 'Back to Menu' },
            'score-label': { ja: 'スコア:', en: 'Score:' },
            'time-label': { ja: '残り時間:', en: 'Time:' },
            'result-title': { ja: '収穫完了！', en: 'Harvest Complete!' },
            'final-score-label': { ja: 'あなたの収穫量:', en: 'Your Harvest:' },
            'final-score-unit': { ja: '点', en: 'points' },
            'how-to-play-title': { ja: '遊び方', en: 'How to Play' },
            'how-to-play-subtitle': { ja: 'How to Play', en: 'How to Play' },
            'section-title-basic': { ja: '基本操作', en: 'Basic Controls' },
            'section-title-rules': { ja: 'ゲームルール', en: 'Game Rules' },
            'section-title-score': { ja: 'スコアシステム', en: 'Score System' }
        };
        
        langBtn.textContent = `Language: ${this.language === 'ja' ? '日本語' : 'English'}`;
        
        // 基本要素の更新
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id][this.language];
            }
        });
        
        // 遊び方画面の内容を更新
        this.updateHowToPlayContent();
        
        // スタート画面の説明文を更新
        this.updateStartScreenInstructions();
        
        // ゲーム画面の言語更新
        this.updateGameScreenLanguage();
        
        // リザルト画面の言語更新
        this.updateResultScreenLanguage();
    }
    
    // 遊び方画面の内容を更新
    updateHowToPlayContent() {
        const content = {
            ja: {
                basic: {
                    title: '基本操作',
                    text1: '同じ色のラベンダーをマウスでドラッグしてつなげてください。',
                    text2: '3個以上つなげると自動的に収穫され、スコアが加算されます。'
                },
                rules: {
                    title: 'ゲームルール',
                    items: [
                        '制限時間は60秒です',
                        'つなげた数が多いほど高スコア',
                        '4個以上つなげるとコンボボーナス',
                        '収穫後、上のラベンダーが下に落ちてきます'
                    ]
                },
                score: {
                    title: 'スコアシステム',
                    items: [
                        '3個つなげ: 30点',
                        '4個つなげ: 60点',
                        '5個つなげ: 100点',
                        '6個つなげ: 150点'
                    ]
                }
            },
            en: {
                basic: {
                    title: 'Basic Controls',
                    text1: 'Drag and connect lavender flowers of the same color with your mouse.',
                    text2: 'Connect 3 or more to automatically harvest and earn points.'
                },
                rules: {
                    title: 'Game Rules',
                    items: [
                        'Time limit is 60 seconds',
                        'More connections = higher score',
                        '4+ connections = combo bonus',
                        'After harvest, flowers above fall down'
                    ]
                },
                score: {
                    title: 'Score System',
                    items: [
                        '3 connections: 30 points',
                        '4 connections: 60 points',
                        '5 connections: 100 points',
                        '6 connections: 150 points'
                    ]
                }
            }
        };
        
        const currentContent = content[this.language];
        
        // 基本操作セクション
        const basicSection = document.querySelector('.how-to-play-section:nth-child(1)');
        if (basicSection) {
            basicSection.querySelector('.section-title').textContent = currentContent.basic.title;
            const texts = basicSection.querySelectorAll('.section-text');
            texts[0].textContent = currentContent.basic.text1;
            texts[1].textContent = currentContent.basic.text2;
        }
        
        // ゲームルールセクション
        const rulesSection = document.querySelector('.how-to-play-section:nth-child(2)');
        if (rulesSection) {
            rulesSection.querySelector('.section-title').textContent = currentContent.rules.title;
            const items = rulesSection.querySelectorAll('.rule-list li');
            currentContent.rules.items.forEach((item, index) => {
                if (items[index]) {
                    items[index].textContent = item;
                }
            });
        }
        
        // スコアシステムセクション
        const scoreSection = document.querySelector('.how-to-play-section:nth-child(3)');
        if (scoreSection) {
            scoreSection.querySelector('.section-title').textContent = currentContent.score.title;
            const items = scoreSection.querySelectorAll('.score-list li');
            currentContent.score.items.forEach((item, index) => {
                if (items[index]) {
                    items[index].textContent = item;
                }
            });
        }
    }
    
    // スタート画面の説明文を更新
    updateStartScreenInstructions() {
        const instructionText = document.getElementById('instruction-text');
        if (instructionText) {
            if (this.language === 'ja') {
                instructionText.textContent = '同じ色のラベンダーを3個以上つなげて収穫しよう！';
            } else {
                instructionText.textContent = 'Connect 3 or more lavender flowers of the same color!';
            }
        }
    }
    
    // リザルト画面の言語更新
    updateResultScreenLanguage() {
        const resultTitle = document.getElementById('result-title');
        const finalScoreLabel = document.querySelector('.final-score-label');
        const finalScoreUnit = document.querySelector('.final-score-unit');
        
        if (resultTitle) {
            resultTitle.textContent = this.language === 'ja' ? '収穫完了！' : 'Harvest Complete!';
        }
        if (finalScoreLabel) {
            finalScoreLabel.textContent = this.language === 'ja' ? 'あなたの収穫量:' : 'Your Harvest:';
        }
        if (finalScoreUnit) {
            finalScoreUnit.textContent = this.language === 'ja' ? '点' : 'points';
        }
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new LavenderPuzzleGame();
});
