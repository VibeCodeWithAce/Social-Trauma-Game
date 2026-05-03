// render.js — All rendering code

const Render = {
    canvas: null,
    ctx: null,
    W: 800,
    H: 450,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const scaleX = window.innerWidth / this.W;
        const scaleY = window.innerHeight / this.H;
        const scale = Math.min(scaleX, scaleY);
        this.canvas.style.width = (this.W * scale) + 'px';
        this.canvas.style.height = (this.H * scale) + 'px';
    },

    clear() {
        this.ctx.clearRect(0, 0, this.W, this.H);
    },

    // ── Title Screen ──
    drawTitle(time) {
        const ctx = this.ctx;

        // Background image
        if (BgImage && BgImage.complete && BgImage.naturalWidth > 0) {
            const imgW = BgImage.naturalWidth;
            const imgH = BgImage.naturalHeight;
            const scale = Math.max(this.W / imgW, this.H / imgH);
            const dw = imgW * scale;
            const dh = imgH * scale;
            const dx = (this.W - dw) / 2;
            const dy = (this.H - dh) / 2;
            ctx.drawImage(BgImage, dx, dy, dw, dh);
            // Dark overlay so text is readable
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, this.W, this.H);
        } else {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, this.W, this.H);
        }

        this._drawScanlines(0.03);

        // Title
        const pulse = Math.sin(time * 3) * 0.15 + 0.85;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SOCIAL TRAUMA', this.W / 2, 160);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('FIGHT', this.W / 2, 210);
        ctx.restore();

        // Subtitle
        const blink = Math.sin(time * 5) > 0;
        if (blink) {
            ctx.fillStyle = '#888';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS ENTER TO START', this.W / 2, 320);
        }

        // Version
        ctx.fillStyle = '#444';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('v2.0 // SOCIAL TRAUMA FIGHT', this.W / 2, this.H - 20);
    },

    // ── Character Select ──
    drawSelect(selectedIndex, time) {
        const ctx = this.ctx;
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, this.W, this.H);

        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHOOSE YOUR FIGHTER', this.W / 2, 45);

        const cols = 3, rows = 2;
        const cellW = 160, cellH = 140;
        const startX = (this.W - cols * cellW) / 2;
        const startY = 65;

        for (let i = 0; i < FIGHTER_DATA.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * cellW + 10;
            const y = startY + row * cellH + 5;
            const w = cellW - 20;
            const h = cellH - 25;
            const data = FIGHTER_DATA[i];

            ctx.fillStyle = i === selectedIndex ? '#222' : '#111';
            ctx.fillRect(x, y, w, h);

            if (Portraits[i] && Portraits[i].complete && Portraits[i].naturalWidth > 0) {
                ctx.drawImage(Portraits[i], x + 10, y + 8, w - 20, h - 35);
            } else {
                ctx.fillStyle = data.color;
                ctx.fillRect(x + 10, y + 8, w - 20, h - 35);
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(x + w / 2, y + 30, 18, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(data.name.toUpperCase(), x + w / 2, y + h - 5);

            if (i === selectedIndex) {
                const glow = Math.sin(time * 6) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(255, 51, 51, ${glow})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
            }
        }

        const sel = FIGHTER_DATA[selectedIndex];
        const statsX = this.W / 2;
        const statsY = startY + rows * cellH + 10;

        ctx.fillStyle = sel.color;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sel.name.toUpperCase(), statsX, statsY);

        ctx.fillStyle = '#aaa';
        ctx.font = '13px monospace';
        ctx.fillText(`HP: ${sel.hp}  SPD: ${sel.speed}`, statsX, statsY + 20);

        const btnBlink = Math.sin(time * 4) > 0;
        ctx.fillStyle = btnBlink ? '#ff3333' : '#cc0000';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ ENTER TO FIGHT ]', statsX, statsY + 50);

        this._drawScanlines(0.02);
    },

    // ── Space Background ──
    drawSpaceBg(stars) {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.H);
        grad.addColorStop(0, '#020010');
        grad.addColorStop(0.5, '#0a0020');
        grad.addColorStop(1, '#100030');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.W, this.H);

        // Stars
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
    },

    // ── Player Ship (portrait image) ──
    drawPlayer(player, time) {
        const ctx = this.ctx;
        const px = player.x;
        const py = player.y;
        const size = 48;

        // Engine glow
        const flicker = Math.sin(time * 30) * 3;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(px - 8, py + size / 2 + 2);
        ctx.lineTo(px, py + size / 2 + 14 + flicker);
        ctx.lineTo(px + 8, py + size / 2 + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(px - 4, py + size / 2 + 2);
        ctx.lineTo(px, py + size / 2 + 8 + flicker * 0.5);
        ctx.lineTo(px + 4, py + size / 2 + 2);
        ctx.closePath();
        ctx.fill();

        // Portrait as ship body
        const img = Portraits[player.index];
        const isFlash = player.hitFlash > 0;

        ctx.save();
        // Circular clip
        ctx.beginPath();
        ctx.arc(px, py, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (img && img.complete && img.naturalWidth > 0) {
            if (isFlash) {
                ctx.globalAlpha = 0.5 + Math.sin(time * 40) * 0.5;
            }
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const cropSize = Math.min(imgW, imgH) * 0.75;
            const cropX = (imgW - cropSize) / 2;
            const cropY = (imgH - cropSize) / 2 - imgH * 0.05;
            ctx.drawImage(img, cropX, cropY, cropSize, cropSize,
                px - size / 2, py - size / 2, size, size);
        } else {
            ctx.fillStyle = isFlash ? '#fff' : FIGHTER_DATA[player.index].color;
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
        ctx.restore();

        // Ring border
        ctx.strokeStyle = isFlash ? '#fff' : FIGHTER_DATA[player.index].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, size / 2, 0, Math.PI * 2);
        ctx.stroke();
    },

    // ── Enemy (portrait image) ──
    drawEnemy(enemy, time) {
        const ctx = this.ctx;
        const ex = enemy.x;
        const ey = enemy.y;
        const size = 40;
        const isFlash = enemy.flashTimer > 0;

        const img = Portraits[enemy.index];

        ctx.save();
        ctx.beginPath();
        ctx.arc(ex, ey, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (img && img.complete && img.naturalWidth > 0) {
            if (isFlash) {
                ctx.globalAlpha = 0.4;
            }
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;
            const cropSize = Math.min(imgW, imgH) * 0.75;
            const cropX = (imgW - cropSize) / 2;
            const cropY = (imgH - cropSize) / 2 - imgH * 0.05;
            ctx.drawImage(img, cropX, cropY, cropSize, cropSize,
                ex - size / 2, ey - size / 2, size, size);
        } else {
            ctx.fillStyle = isFlash ? '#fff' : FIGHTER_DATA[enemy.index].color;
            ctx.fillRect(ex - size / 2, ey - size / 2, size, size);
        }
        ctx.restore();

        // Outer ring
        ctx.strokeStyle = isFlash ? '#fff' : '#ff3333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Flash white overlay
        if (isFlash) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(ex, ey, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ── Bullets ──
    drawPlayerBullet(b) {
        const ctx = this.ctx;
        // Bright cyan bolt
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        ctx.fillStyle = '#fff';
        ctx.fillRect(b.x - 1, b.y - 4, 2, 8);
    },

    drawEnemyBullet(b) {
        const ctx = this.ctx;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    // ── Explosion ──
    drawExplosion(ex, time) {
        const ctx = this.ctx;
        const progress = 1 - (ex.timer / 0.4); // 0→1
        const radius = 10 + progress * 20;
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;
        // Outer ring
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner flash
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Particles
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + time * 8;
            const dist = radius * 0.8;
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(
                ex.x + Math.cos(angle) * dist - 2,
                ex.y + Math.sin(angle) * dist - 2,
                4, 4
            );
        }
        ctx.restore();
    },

    // ── Shooter HUD ──
    drawShooterHUD(player, score, level) {
        const ctx = this.ctx;
        const barW = 200, barH = 14, barY = 14;

        // HP bar
        const hpPct = Math.max(0, player.hp / player.maxHp);
        ctx.fillStyle = '#333';
        ctx.fillRect(15, barY, barW, barH);
        ctx.fillStyle = hpPct > 0.3 ? '#33cc33' : '#ff3333';
        ctx.fillRect(15, barY, barW * hpPct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(15, barY, barW, barH);

        // HP label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HP', 15, barY - 3);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('SCORE: ' + score, this.W - 15, barY + 12);

        // Level
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + level, this.W / 2, barY + 12);
    },

    // ── Game Over overlay ──
    drawGameOver(score, time) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, this.H / 2 - 70, this.W, 140);

        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.W / 2, this.H / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('SCORE: ' + score, this.W / 2, this.H / 2 + 35);

        const blink = Math.sin(time * 5) > 0;
        if (blink) {
            ctx.fillStyle = '#888';
            ctx.font = '14px monospace';
            ctx.fillText('PRESS ENTER TO CONTINUE', this.W / 2, this.H / 2 + 60);
        }
    },

    // ── Victory / Game Over Screen ──
    drawVictory(playerName, playerColor, playerIndex, score, time) {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.W, this.H);

        // Radiating lines
        ctx.save();
        ctx.translate(this.W / 2, this.H / 2);
        for (let i = 0; i < 24; i++) {
            ctx.rotate(Math.PI / 12);
            ctx.fillStyle = `rgba(255,51,51,${0.03 + Math.sin(time * 2 + i) * 0.02})`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-40, -500);
            ctx.lineTo(40, -500);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Player portrait
        const pImg = Portraits[playerIndex];
        if (pImg && pImg.complete && pImg.naturalWidth > 0) {
            const portraitSize = 120;
            const py = this.H / 2 - 120;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.W / 2, py + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(pImg, this.W / 2 - portraitSize / 2, py, portraitSize, portraitSize);
            ctx.restore();
            ctx.strokeStyle = playerColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.W / 2, py + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.W / 2, this.H / 2 + 30);

        ctx.fillStyle = playerColor;
        ctx.font = 'bold 22px monospace';
        ctx.fillText(playerName.toUpperCase(), this.W / 2, this.H / 2 + 60);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('SCORE: ' + score, this.W / 2, this.H / 2 + 95);

        const blink = Math.sin(time * 5) > 0;
        if (blink) {
            ctx.fillStyle = '#666';
            ctx.font = '16px monospace';
            ctx.fillText('PRESS ENTER TO CONTINUE', this.W / 2, this.H / 2 + 130);
        }

        this._drawScanlines(0.03);
    },

    // ── Scanlines ──
    _drawScanlines(alpha) {
        const ctx = this.ctx;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        for (let y = 0; y < this.H; y += 3) {
            ctx.fillRect(0, y, this.W, 1);
        }
    },

    // ── Screen transition ──
    drawTransition(progress) {
        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        if (progress < 0.5) {
            ctx.globalAlpha = progress * 2;
        } else {
            ctx.globalAlpha = (1 - progress) * 2;
        }
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
    }
};
