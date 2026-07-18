    // Horloge
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      document.getElementById('clock').textContent = `${hours}:${minutes}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Sélection des icônes
    function selectIcon(e, id) {
      e.stopPropagation();
      deselectAllIcons();
      e.currentTarget.classList.add('selected');
    }
    function deselectAllIcons() {
      document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('selected');
      });
    }

    // Gestion de la Corbeille
    let trashEmpty = true;
    function openTrash() {
      if (trashEmpty) {
        alert("La Corbeille est vide !");
      } else {
        if (confirm("Voulez-vous vider la Corbeille ?")) {
          trashEmpty = true;
          document.getElementById('trash-icon-img').src = "https://win98icons.alexmeub.com/icons/png/recycle_bin_empty-4.png";
          playBeep(150, 0.15);
        }
      }
    }

    // Gestion Start Menu
    function toggleStartMenu(e) {
      e.stopPropagation();
      const menu = document.getElementById('start-menu');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#start-btn') && !e.target.closest('#start-menu')) {
        document.getElementById('start-menu').style.display = 'none';
      }
    });

    // Gestion Fenêtres
    const windowStates = {};

    function openWindow(id) {
      const win = document.getElementById(id);
      win.style.display = 'block';
      
      // Placer au centre par défaut
      if (!win.style.left && !win.classList.contains('maximized')) {
        win.style.left = `${(window.innerWidth - win.offsetWidth) / 2}px`;
        win.style.top = `${(window.innerHeight - win.offsetHeight - 40) / 2}px`;
      }
      
      bringToFront(id);
      updateTaskbar();

      // Focus automatique si c'est le terminal
      if (id === 'win-terminal') {
        setTimeout(focusTerminalInput, 50);
      }
    }

    function closeWindow(id) {
      document.getElementById(id).style.display = 'none';
      updateTaskbar();
    }

    function minimizeWindow(id) {
      document.getElementById(id).style.display = 'none';
      updateTaskbar();
    }

    function toggleMaximize(id) {
      const win = document.getElementById(id);
      if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        // restaurer la position
        if (windowStates[id]) {
          win.style.left = windowStates[id].left;
          win.style.top = windowStates[id].top;
        }
      } else {
        windowStates[id] = {
          left: win.style.left,
          top: win.style.top
        };
        win.classList.add('maximized');
        win.style.left = '0';
        win.style.top = '0';
      }
    }

    function bringToFront(id) {
      document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
      const activeWin = document.getElementById(id);
      if (activeWin) {
        activeWin.classList.add('active');
      }
      updateTaskbar();
    }

    function updateTaskbar() {
      const tasks = document.getElementById('tasks');
      tasks.innerHTML = '';
      
      document.querySelectorAll('.window').forEach(win => {
        if (win.style.display === 'block') {
          const id = win.id;
          const title = win.querySelector('.title-bar-text').textContent;
          
          const btn = document.createElement('button');
          btn.className = 'task-tab' + (win.classList.contains('active') ? ' active' : '');
          btn.textContent = title;
          btn.onclick = () => {
            if (win.style.display === 'none' || !win.classList.contains('active')) {
              win.style.display = 'block';
              bringToFront(id);
            } else {
              win.style.display = 'none';
              win.classList.remove('active');
              updateTaskbar();
            }
          };
          tasks.appendChild(btn);
        }
      });
    }

    // Glisser-Déposer (Drag and Drop)
    let activeDrag = null;
    let offsetX = 0;
    let offsetY = 0;

    function dragStart(e, id) {
      const win = document.getElementById(id);
      if (win.classList.contains('maximized')) return; // pas de drag si maximisé
      
      activeDrag = win;
      bringToFront(id);
      offsetX = e.clientX - activeDrag.offsetLeft;
      offsetY = e.clientY - activeDrag.offsetTop;
      
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragEnd);
    }

    function dragMove(e) {
      if (activeDrag) {
        activeDrag.style.left = `${e.clientX - offsetX}px`;
        activeDrag.style.top = `${e.clientY - offsetY}px`;
      }
    }

    function dragEnd() {
      activeDrag = null;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }

    // WEB AUDIO API : Synthèse Sonore Rétro
    let audioCtx = null;
    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }

    function playBeep(freq, duration) {
      try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function playStartupSound() {
      try {
        initAudio();
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Accord majeur harmonieux
        
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.0);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 2.2);
        });
      } catch(e) {}
    }

    // LOGIQUE DE L'INVITE DE COMMANDES TERMINAL
    function focusTerminalInput() {
      const input = document.getElementById('terminal-input');
      if (input) input.focus();
    }

    const files = {
      'cv_readme.txt': `==================================================
              YVAL - DEVELOPPEUR
==================================================

COMPETENCES DU SYSTEME :
------------------------
- Front-End/Mobile : Kotlin (Android SDK), TS / JS (Angular)
- Back-End         : PHP (Symfony), Java (Spring Boot)
- DevOps / Systèmes: Docker, Git, Linux (Debian)

CONTACT :
---------
GitHub : https://github.com/Yval`
    };

    let matrixRainInterval = null;

    function handleTerminalCommand(e) {
      if (e.key === 'Enter') {
        const inputEl = e.currentTarget;
        const cmdText = inputEl.value.trim();
        inputEl.value = '';

        if (matrixRainInterval) {
          clearInterval(matrixRainInterval);
          matrixRainInterval = null;
          document.getElementById('terminal-output').innerHTML = '';
        }

        const outputEl = document.getElementById('terminal-output');
        outputEl.innerHTML += `C:\\>${cmdText}\n`;

        const parts = cmdText.split(' ');
        const command = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ').toLowerCase();

        switch (command) {
          case 'help':
            outputEl.innerHTML += `Commandes disponibles :\n` +
                                  `  help            Affiche cette aide\n` +
                                  `  dir / ls        Liste les fichiers du répertoire courant\n` +
                                  `  cat / type [f]  Affiche le contenu d'un fichier (ex: cat cv_readme.txt)\n` +
                                  `  matrix          Déclenche la cascade de code Matrix\n` +
                                  `  beep            Émet un signal sonore système\n` +
                                  `  clear / cls     Efface l'écran\n`;
            break;
          case 'dir':
          case 'ls':
            outputEl.innerHTML += ` Répertoire de C:\\\n\n` +
                                  `18/07/2026  16:59            748  cv_readme.txt\n` +
                                  `18/07/2026  16:59    <DIR>        Projects\n` +
                                  `18/07/2026  16:59         45,120  démineur.exe\n` +
                                  `18/07/2026  16:59        102,400  winamp.exe\n\n` +
                                  `       3 Fichier(s)        148,268 octets\n` +
                                  `       1 Rép(s)         98,124,288 octets libres\n`;
            break;
          case 'cat':
          case 'type':
            if (!arg) {
              outputEl.innerHTML += `Usage : ${command} [nom_du_fichier]\n`;
            } else if (files[arg]) {
              outputEl.innerHTML += `${files[arg]}\n`;
            } else {
              outputEl.innerHTML += `Fichier introuvable : ${arg}\n`;
            }
            break;
          case 'beep':
            playBeep(800, 0.2);
            outputEl.innerHTML += `Bip !\n`;
            break;
          case 'clear':
          case 'cls':
            outputEl.innerHTML = '';
            break;
          case 'matrix':
            startMatrixRain(outputEl);
            break;
          case '':
            break;
          default:
            outputEl.innerHTML += `Commande ou nom de fichier non reconnu : "${command}"\n`;
        }

        // Scroll automatique
        const winBody = inputEl.closest('.window-body');
        winBody.scrollTop = winBody.scrollHeight;
      }
    }

    function startMatrixRain(outputEl) {
      outputEl.innerHTML = '';
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=<>[]%#@";
      const cols = 50;
      const drops = Array(cols).fill(0);

      outputEl.innerHTML += "Appuyez sur ENTRÉE pour quitter le mode Matrix...\n\n";

      matrixRainInterval = setInterval(() => {
        let line = '';
        for (let i = 0; i < cols; i++) {
          if (Math.random() > 0.95 || drops[i] > 0) {
            line += chars[Math.floor(Math.random() * chars.length)];
            if (drops[i] === 0) drops[i] = Math.floor(Math.random() * 12) + 4;
            drops[i]--;
          } else {
            line += ' ';
          }
        }
        outputEl.innerHTML += line + '\n';
        
        // Empêcher le débordement
        const lines = outputEl.innerHTML.split('\n');
        if (lines.length > 22) {
          outputEl.innerHTML = "Appuyez sur ENTRÉE pour quitter le mode Matrix...\n\n" + lines.slice(lines.length - 20).join('\n');
        }
        
        const winBody = outputEl.closest('.window-body');
        winBody.scrollTop = winBody.scrollHeight;
      }, 75);
    }
    let musicInterval = null;
    let musicTempo = 150; // ms par note
    let musicStep = 0;
    let isPlaying = false;
    let trackName = 'tetris';

    const tracks = {
      tetris: [
        659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 523, 587, 659,
        523, 440, 440, 0, 587, 698, 880, 784, 698, 659, 523, 659, 587, 523, 494, 494,
        523, 587, 659, 523, 440, 440
      ],
      mario: [
        660, 660, 0, 660, 0, 510, 660, 0, 770, 0, 0, 0, 380, 0, 0, 0,
        510, 0, 0, 380, 0, 0, 320, 0, 0, 440, 0, 480, 0, 450, 440, 0,
        380, 660, 770, 880, 0, 690, 770, 0, 660, 0, 510, 580, 490
      ],
      startup: [
        261, 329, 392, 523, 659, 783, 1046
      ]
    };

    function playMusic() {
      if (isPlaying) return;
      initAudio();
      isPlaying = true;
      document.getElementById('winamp-song-title').textContent = `Playing: ${trackName.toUpperCase()}`;
      
      musicInterval = setInterval(() => {
        const notes = tracks[trackName];
        const freq = notes[musicStep % notes.length];
        if (freq > 0) {
          playBeep(freq, 0.2);
        }
        
        // Update Time
        const totalSecs = Math.floor((musicStep * musicTempo) / 1000);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        document.getElementById('winamp-time').textContent = `${mins}:${secs}`;
        
        musicStep++;
      }, musicTempo);
    }

    function pauseMusic() {
      clearInterval(musicInterval);
      isPlaying = false;
      document.getElementById('winamp-song-title').textContent = "Paused";
    }

    function stopMusic() {
      clearInterval(musicInterval);
      isPlaying = false;
      musicStep = 0;
      document.getElementById('winamp-time').textContent = "00:00";
      document.getElementById('winamp-song-title').textContent = "Stopped";
    }

    function changeTrack() {
      stopMusic();
      trackName = document.getElementById('track-select').value;
      if (trackName === 'startup') {
        musicTempo = 250;
      } else {
        musicTempo = 150;
      }
    }

    // JEU DEMINEUR (MINESWEEPER)
    const minesSize = 9;
    const minesCount = 10;
    let minesGrid = [];
    let revealedCount = 0;
    let minePositions = [];
    let isGameOver = false;
    let minesTimerInterval = null;
    let minesTime = 0;

    function initMinesweeper() {
      isGameOver = false;
      revealedCount = 0;
      minesTime = 0;
      document.getElementById('mines-smiley').textContent = '🙂';
      document.getElementById('mines-left').textContent = String(minesCount).padStart(3, '0');
      document.getElementById('mines-timer').textContent = '000';
      clearInterval(minesTimerInterval);
      
      // Start Timer on first click
      minesTimerInterval = setInterval(() => {
        if (!isGameOver && minesTime < 999) {
          minesTime++;
          document.getElementById('mines-timer').textContent = String(minesTime).padStart(3, '0');
        }
      }, 1000);

      // Générer Grid
      const gridContainer = document.getElementById('mines-grid');
      gridContainer.innerHTML = '';
      minesGrid = Array(minesSize).fill(null).map(() => Array(minesSize).fill(0));
      
      // Mines
      minePositions = [];
      while(minePositions.length < minesCount) {
        const r = Math.floor(Math.random() * minesSize);
        const c = Math.floor(Math.random() * minesSize);
        if (!minePositions.some(p => p.r === r && p.c === c)) {
          minePositions.push({r, c});
          minesGrid[r][c] = 'M';
        }
      }

      // Calculer Nombres adjacents
      for(let r=0; r<minesSize; r++) {
        for(let c=0; c<minesSize; c++) {
          if (minesGrid[r][c] === 'M') continue;
          let count = 0;
          for(let dr=-1; dr<=1; dr++) {
            for(let dc=-1; dc<=1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < minesSize && nc >= 0 && nc < minesSize) {
                if (minesGrid[nr][nc] === 'M') count++;
              }
            }
          }
          minesGrid[r][c] = count;
        }
      }

      // Render
      for(let r=0; r<minesSize; r++) {
        for(let c=0; c<minesSize; c++) {
          const cell = document.createElement('div');
          cell.className = 'mine-cell';
          cell.dataset.row = r;
          cell.dataset.col = c;
          
          cell.addEventListener('click', () => clickCell(r, c));
          cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            flagCell(cell);
          });
          
          gridContainer.appendChild(cell);
        }
      }
    }

    function clickCell(r, c) {
      if (isGameOver) return;
      
      const idx = r * minesSize + c;
      const cell = document.getElementById('mines-grid').children[idx];
      if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;
      
      const val = minesGrid[r][c];
      if (val === 'M') {
        // Boom!
        cell.classList.add('mine');
        cell.textContent = '💣';
        gameOver(false);
      } else {
        revealCell(r, c);
        checkWin();
      }
    }

    function revealCell(r, c) {
      const idx = r * minesSize + c;
      const cell = document.getElementById('mines-grid').children[idx];
      if (cell.classList.contains('revealed')) return;
      
      cell.classList.add('revealed');
      cell.style.borderColor = '#808080';
      const val = minesGrid[r][c];
      
      if (val > 0) {
        cell.textContent = val;
        // Couleurs classiques Démineur
        const colors = ['', 'blue', 'green', 'red', 'darkblue', 'darkred', 'teal', 'black', 'gray'];
        cell.style.color = colors[val];
      } else {
        // Étendre aux cellules vides adjacentes
        for(let dr=-1; dr<=1; dr++) {
          for(let dc=-1; dc<=1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < minesSize && nc >= 0 && nc < minesSize) {
              revealCell(nr, nc);
            }
          }
        }
      }
      revealedCount++;
    }

    function flagCell(cell) {
      if (isGameOver || cell.classList.contains('revealed')) return;
      
      if (cell.classList.contains('flagged')) {
        cell.classList.remove('flagged');
        cell.textContent = '';
      } else {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
        cell.style.color = 'red';
      }
    }

    function checkWin() {
      if (revealedCount === (minesSize * minesSize - minesCount)) {
        gameOver(true);
      }
    }

    function gameOver(isWin) {
      isGameOver = true;
      clearInterval(minesTimerInterval);
      
      if (isWin) {
        document.getElementById('mines-smiley').textContent = '😎';
        alert('Félicitations ! Vous avez gagné !');
      } else {
        document.getElementById('mines-smiley').textContent = '😵';
        // Révéler toutes les mines
        minePositions.forEach(p => {
          const idx = p.r * minesSize + p.c;
          const cell = document.getElementById('mines-grid').children[idx];
          cell.classList.add('mine');
          cell.textContent = '💣';
        });
      }
    }

    // Lancement de l'environnement rétro au chargement
    window.addEventListener('DOMContentLoaded', () => {
      openWindow('win-welcome');
      initMinesweeper();
      initStarfield();
    });


    // ANIMATION STARFIELD (Écran de veille rétro cyberpunk)
    function initStarfield() {
      const canvas = document.getElementById('desktop-bg');
      const ctx = canvas.getContext('2d');
      let width = canvas.width = window.innerWidth;
      let height = canvas.height = window.innerHeight;

      const numStars = 120;
      const stars = [];

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width,
          color: i % 10 === 0 ? '#ffffff' : (i % 3 === 0 ? '#00cc00' : '#005500')
        });
      }

      function animate() {
        // Remplir d'abord avec un fond noir Matrix opaque
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < numStars; i++) {
          const star = stars[i];
          star.z -= 1.5; // Vitesse

          if (star.z <= 0) {
            star.z = width;
            star.x = Math.random() * width - width / 2;
            star.y = Math.random() * height - height / 2;
          }

          const k = 128.0 / star.z;
          const px = star.x * k + width / 2;
          const py = star.y * k + height / 2;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = (1 - star.z / width) * 4;
            ctx.fillStyle = star.color;
            ctx.fillRect(px, py, size, size);
          }
        }
        requestAnimationFrame(animate);
      }

      window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });
      
      animate();
    }
