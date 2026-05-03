// game.js — Game logic: shooter gameplay

const Game = {
    time: 0,
    PLAYER_SPEED: 300,
    PLAYER_BULLET_SPEED: 500,
    ENEMY_BULLET_SPEED: 200,
    SHOOT_COOLDOWN: 0.15,
    _shootTimer: 0,
    _finalScore: 0,

    // ── MAIN UPDATE ──
    update(dt) {
        this.time += dt;

        if (State.transition) {
            State.transition.timer += dt;
            if (State.transition.timer >= State.transition.duration) {
                State.transition.callback();
                State.transition = null;
            }
            return;
        }

        switch (State.current) {
            case 'title': this.updateTitle(); break;
            case 'select': this.updateSelect(); break;
            case 'fight': this.updateShooter(dt); break;
            case 'victory': this.updateVictory(); break;
        }
    },

    // ── MAIN RENDER ──
    render() {
        Render.clear();

        switch (State.current) {
            case 'title': Render.drawTitle(this.time); break;
            case 'select': Render.drawSelect(State.selectedFighter, this.time); break;
            case 'fight': this.renderShooter(); break;
            case 'victory':
                Render.drawVictory(
                    this._playerName, this._playerColor,
                    this._playerIndex, this._finalScore, this.time
                );
                break;
        }

        if (State.transition) {
            const progress = State.transition.timer / State.transition.duration;
            Render.drawTransition(progress);
        }
    },

    // ═══════════════
    //  TITLE
    // ═══════════════
    updateTitle() {
        if (Input.pressed('Enter') || Input.pressed('Space')) {
            Sound.confirm();
            this.transition('select');
        }
    },

    // ═══════════════
    //  SELECT
    // ═══════════════
    updateSelect() {
        const cols = 3;
        const total = FIGHTER_DATA.length;
        let sel = State.selectedFighter;

        if (Input.pressed('ArrowRight')) { sel = (sel + 1) % total; Sound.select(); }
        if (Input.pressed('ArrowLeft')) { sel = (sel - 1 + total) % total; Sound.select(); }
        if (Input.pressed('ArrowDown')) { sel = (sel + cols) % total; Sound.select(); }
        if (Input.pressed('ArrowUp')) { sel = (sel - cols + total) % total; Sound.select(); }

        State.selectedFighter = sel;

        if (Input.pressed('Enter') || Input.pressed('Space')) {
            Sound.confirm();
            this.transition('fight', () => this.startGame());
        }
    },

    // ═══════════════
    //  GAME START
    // ═══════════════
    startGame() {
        const data = FIGHTER_DATA[State.selectedFighter];
        State.player = {
            x: Render.W / 2,
            y: Render.H - 60,
            hp: data.hp,
            maxHp: data.hp,
            index: State.selectedFighter,
            hitFlash: 0
        };
        this.PLAYER_SPEED = data.speed;
        State.enemies = [];
        State.playerBullets = [];
        State.enemyBullets = [];
        State.explosions = [];
        State.score = 0;
        State.level = 1;
        State.levelTimer = 0;
        State.spawnTimer = 0;
        State.gameOver = false;
        State.gameOverTimer = 0;
        State.shakeTimer = 0;
        this._shootTimer = 0;

        // Init stars
        State.stars = [];
        for (let i = 0; i < 80; i++) {
            State.stars.push({
                x: Math.random() * Render.W,
                y: Math.random() * Render.H,
                speed: 20 + Math.random() * 60,
                size: Math.random() > 0.7 ? 2 : 1,
                brightness: 0.3 + Math.random() * 0.7
            });
        }
    },

    // ═══════════════
    //  SHOOTER UPDATE
    // ═══════════════
    updateShooter(dt) {
        const p = State.player;

        // Screen shake
        if (State.shakeTimer > 0) State.shakeTimer -= dt;

        // Update stars
        for (let i = 0; i < State.stars.length; i++) {
            const s = State.stars[i];
            s.y += s.speed * dt;
            if (s.y > Render.H) {
                s.y = 0;
                s.x = Math.random() * Render.W;
            }
        }

        // Update explosions
        State.explosions = State.explosions.filter(e => {
            e.timer -= dt;
            return e.timer > 0;
        });

        // Game over state
        if (State.gameOver) {
            State.gameOverTimer += dt;
            if (State.gameOverTimer > 1.5 && (Input.pressed('Enter') || Input.pressed('Space'))) {
                this._playerName = FIGHTER_DATA[State.selectedFighter].name;
                this._playerColor = FIGHTER_DATA[State.selectedFighter].color;
                this._playerIndex = State.selectedFighter;
                this._finalScore = State.score;
                this.transition('victory');
            }
            return;
        }

        // ── Player input ──
        if (Input.isDown('ArrowLeft')) p.x -= this.PLAYER_SPEED * dt;
        if (Input.isDown('ArrowRight')) p.x += this.PLAYER_SPEED * dt;
        // Slight vertical movement
        if (Input.isDown('ArrowUp')) p.y -= this.PLAYER_SPEED * 0.5 * dt;
        if (Input.isDown('ArrowDown')) p.y += this.PLAYER_SPEED * 0.5 * dt;

        // Clamp player bounds
        p.x = Math.max(28, Math.min(Render.W - 28, p.x));
        p.y = Math.max(Render.H * 0.5, Math.min(Render.H - 30, p.y));

        // Shooting
        this._shootTimer -= dt;
        if (Input.isDown('Space') && this._shootTimer <= 0) {
            State.playerBullets.push({ x: p.x, y: p.y - 26 });
            this._shootTimer = this.SHOOT_COOLDOWN;
            Sound.shoot();
        }

        // Hit flash timer
        if (p.hitFlash > 0) p.hitFlash -= dt;

        // ── Level progression ──
        State.levelTimer += dt;
        if (State.levelTimer > 15) {
            State.level++;
            State.levelTimer = 0;
            Sound.levelUp();
        }

        // ── Spawn enemies ──
        const spawnInterval = Math.max(0.4, 2.0 - State.level * 0.15);
        State.spawnTimer -= dt;
        if (State.spawnTimer <= 0) {
            this.spawnEnemy();
            State.spawnTimer = spawnInterval;
        }

        // ── Update player bullets ──
        State.playerBullets = State.playerBullets.filter(b => {
            b.y -= this.PLAYER_BULLET_SPEED * dt;
            return b.y > -10;
        });

        // ── Update enemy bullets ──
        const eBulletSpeed = this.ENEMY_BULLET_SPEED + State.level * 10;
        State.enemyBullets = State.enemyBullets.filter(b => {
            b.y += eBulletSpeed * dt;
            return b.y < Render.H + 10;
        });

        // ── Update enemies ──
        const enemyShootInterval = Math.max(0.8, 3.0 - State.level * 0.2);
        State.enemies = State.enemies.filter(e => {
            e.timer += dt;
            e.flashTimer = Math.max(0, e.flashTimer - dt);

            // Movement patterns
            const baseSpeed = 40 + State.level * 8;
            switch (e.pattern) {
                case 'horizontal':
                    e.x += Math.cos(e.timer * e.freq) * baseSpeed * dt * 3;
                    e.y += baseSpeed * 0.3 * dt;
                    break;
                case 'zigzag':
                    e.x += Math.sin(e.timer * e.freq) * baseSpeed * dt * 4;
                    e.y += baseSpeed * 0.5 * dt;
                    break;
                case 'drift':
                    e.x += e.driftDir * baseSpeed * 0.4 * dt;
                    e.y += baseSpeed * 0.4 * dt;
                    break;
                case 'dive':
                    e.y += baseSpeed * (0.5 + e.timer * 0.3) * dt;
                    e.x += Math.sin(e.timer * 2) * baseSpeed * 0.5 * dt;
                    break;
            }

            // Enemy shooting
            e.shootTimer -= dt;
            if (e.shootTimer <= 0 && e.y > 20 && e.y < Render.H * 0.7) {
                State.enemyBullets.push({ x: e.x, y: e.y + 22 });
                e.shootTimer = enemyShootInterval + Math.random() * 1.0;
                Sound.enemyShoot();
            }

            // Enemy reached bottom — game over
            if (e.y > Render.H + 10) {
                p.hp = 0;
                State.gameOver = true;
                State.gameOverTimer = 0;
                State.explosions.push({ x: p.x, y: p.y, timer: 0.5 });
                Sound.gameOver();
                return false;
            }

            // Remove if off sides
            return e.x > -40 && e.x < Render.W + 40;
        });

        // ── Collision: player bullets → enemies ──
        for (let bi = State.playerBullets.length - 1; bi >= 0; bi--) {
            const b = State.playerBullets[bi];
            for (let ei = State.enemies.length - 1; ei >= 0; ei--) {
                const e = State.enemies[ei];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (dx * dx + dy * dy < 22 * 22) {
                    // Hit
                    State.playerBullets.splice(bi, 1);
                    e.hp--;
                    e.flashTimer = 0.1;
                    if (e.hp <= 0) {
                        State.explosions.push({ x: e.x, y: e.y, timer: 0.4 });
                        State.enemies.splice(ei, 1);
                        State.score += 100 * State.level;
                        State.shakeTimer = 0.08;
                        State.shakeIntensity = 3;
                        Sound.explode();
                    } else {
                        Sound.hit();
                    }
                    break;
                }
            }
        }

        // ── Collision: enemy bullets → player ──
        const playerHitR = 14; // small hitbox for fairness
        for (let bi = State.enemyBullets.length - 1; bi >= 0; bi--) {
            const b = State.enemyBullets[bi];
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            if (dx * dx + dy * dy < playerHitR * playerHitR) {
                State.enemyBullets.splice(bi, 1);
                p.hp -= 8 + State.level;
                p.hitFlash = 0.25;
                State.shakeTimer = 0.12;
                State.shakeIntensity = 5;
                Sound.playerHit();

                if (p.hp <= 0) {
                    p.hp = 0;
                    State.gameOver = true;
                    State.gameOverTimer = 0;
                    State.explosions.push({ x: p.x, y: p.y, timer: 0.5 });
                    Sound.gameOver();
                }
            }
        }

        // ── Collision: enemy body → player ──
        for (let ei = State.enemies.length - 1; ei >= 0; ei--) {
            const e = State.enemies[ei];
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            if (dx * dx + dy * dy < 34 * 34) {
                State.explosions.push({ x: e.x, y: e.y, timer: 0.4 });
                State.enemies.splice(ei, 1);
                p.hp -= 15;
                p.hitFlash = 0.3;
                State.shakeTimer = 0.15;
                State.shakeIntensity = 6;
                State.score += 50;
                Sound.explode();
                Sound.playerHit();
                if (p.hp <= 0) {
                    p.hp = 0;
                    State.gameOver = true;
                    State.gameOverTimer = 0;
                    State.explosions.push({ x: p.x, y: p.y, timer: 0.5 });
                    Sound.gameOver();
                }
            }
        }
    },

    // ── Spawn enemy ──
    spawnEnemy() {
        // Pick a random fighter (not the player)
        let idx;
        do {
            idx = Math.floor(Math.random() * FIGHTER_DATA.length);
        } while (idx === State.selectedFighter);

        const patterns = ['horizontal', 'zigzag', 'drift', 'dive'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];

        State.enemies.push({
            x: 60 + Math.random() * (Render.W - 120),
            y: -25,
            hp: 1 + Math.floor(State.level / 3),
            index: idx,
            pattern: pattern,
            freq: 1.5 + Math.random() * 2,
            driftDir: Math.random() > 0.5 ? 1 : -1,
            timer: 0,
            shootTimer: 1.0 + Math.random() * 2.0,
            flashTimer: 0
        });
    },

    // ═══════════════
    //  SHOOTER RENDER
    // ═══════════════
    renderShooter() {
        const ctx = Render.ctx;

        ctx.save();
        if (State.shakeTimer > 0) {
            ctx.translate(
                (Math.random() - 0.5) * State.shakeIntensity,
                (Math.random() - 0.5) * State.shakeIntensity
            );
        }

        // Background
        Render.drawSpaceBg(State.stars);

        // Player bullets
        State.playerBullets.forEach(b => Render.drawPlayerBullet(b));

        // Enemy bullets
        State.enemyBullets.forEach(b => Render.drawEnemyBullet(b));

        // Enemies
        State.enemies.forEach(e => Render.drawEnemy(e, this.time));

        // Explosions
        State.explosions.forEach(e => Render.drawExplosion(e, this.time));

        // Player (don't draw if game over)
        if (!State.gameOver) {
            Render.drawPlayer(State.player, this.time);
        }

        ctx.restore();

        // HUD
        Render.drawShooterHUD(State.player, State.score, State.level);

        // Scanlines
        Render._drawScanlines(0.02);

        // Branding
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('SOCIAL TRAUMA FIGHT', Render.W - 10, Render.H - 8);

        // Game over overlay
        if (State.gameOver) {
            Render.drawGameOver(State.score, this.time);
        }
    },

    // ═══════════════
    //  VICTORY
    // ═══════════════
    _playerName: '',
    _playerColor: '#fff',
    _playerIndex: 0,

    updateVictory() {
        if (Input.pressed('Enter') || Input.pressed('Space')) {
            Sound.confirm();
            this.transition('title');
        }
    },

    // ── Transition Helper ──
    transition(toState, onMidpoint) {
        State.transition = {
            timer: 0,
            duration: 0.6,
            callback: () => {
                State.change(toState);
                if (onMidpoint) onMidpoint();
            }
        };
    }
};
