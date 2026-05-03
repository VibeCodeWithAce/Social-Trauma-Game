// state.js — Global game state

const State = {
    current: 'title',       // title | select | fight | victory
    previous: null,

    // Character select
    selectedFighter: 0,

    // Shooter state
    player: null,           // { x, y, hp, maxHp, hitFlash, index }
    enemies: [],            // [{ x, y, hp, index, pattern, timer, shootTimer, flashTimer }]
    playerBullets: [],      // [{ x, y }]
    enemyBullets: [],       // [{ x, y }]
    explosions: [],         // [{ x, y, timer }]
    score: 0,
    level: 1,
    levelTimer: 0,
    spawnTimer: 0,
    gameOver: false,
    gameOverTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,

    // Stars background
    stars: [],

    // Transition
    transition: null,

    change(newState) {
        this.previous = this.current;
        this.current = newState;
        document.body.className = document.body.className.replace(/state-\w+/g, '');
        document.body.classList.add('state-' + newState);
    }
};
