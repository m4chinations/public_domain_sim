var game = new Phaser.Game(300, 550, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, render: render, update: update });

var SCORE = 0; //current score
var COPYRIGHT_TERM = [28, 42, 56, 74, 95, 105]; //aka difficulty
var CURRENT_TERM = 0; //index into the COPYRIGHT_TERM array

var GOALIMAGE;
var GOALBM;
var WORKSPRITE;

var WORK_SPEED = 160;


var BARS;

var WORKS;

var DEBUG = true;

//@@@@@@@@@@@@@@@@@@ PHASER FUNCTIONS @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
/**
 * function: preload
 * Phaser function that will handle asset loading
 * returns: nothing
 */
function preload() {
    this.game.load.image('background', 'sprites/png/background.png');
    this.game.load.image('workholder', 'sprites/png/work_holder.png');
    this.game.load.image('workholderactive', 'sprites/png/work_holder_active.png');
    this.game.load.image('inactive_bar', 'sprites/png/blocked_bar.png')
    game.time.advancedTiming = true;
}

/**
 * function: create
 * Phaser function that handles the initial creation of the gamestate.
 * returns: nothing
 */
function create() {
    /* Arcade Physics, for some simple velocity/acceleration libs */
    game.physics.startSystem(Phaser.Physics.ARCADE);

    /* achieve pixel crispness */
    game.stage.smoothed = false;
    if (game.renderer instanceof PIXI.CanvasRenderer) {
        Phaser.Canvas.setSmoothingEnabled(game.context, false);
        Phaser.Canvas.setImageRenderingCrisp(game.canvas);
    } else {
        PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
    }

    /* add background and scale it for retina*/
    var background = game.add.sprite(0, 0, 'background');
    background.scale.set(0.5, 0.5);

    /* initialize WORKS group that holds the works moving in the pipe */
    WORKS = game.add.group();
    WORKS.enableBody = true;
    game.physics.arcade.enable(WORKS);

    /* initialize BARS group that holds the disabling-bars*/
    BARS = game.add.group();
}

/**
 * function: render
 * Phaser function that is called when rendering a frame.
 * returns: nothing
 */
function render() {
    if (DEBUG) game.debug.inputInfo(32, 32);
    if (DEBUG) game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    //if (WORKS.length) game.debug.spriteInfo(WORKS.getAt(0), 32, 32);

}

/**
 * function: update
 * Phaser function, called at FPS rate to update the gamestate.
 * returns: nothing
 */
function update() {
    for (var i = 0; i < WORKS.length; i++) {
        var sprite = WORKS.getAt(i);
        /* moving up */
        if (sprite.x == 11 && sprite.y > 10) {
            sprite.x = 11;
            sprite.body.velocity.y = -WORK_SPEED;
            sprite.body.velocity.x = 0;
        } else if (sprite.y <= 10 && sprite.x < 240) { //moving to side
            sprite.y = 10;
            sprite.body.velocity.x = WORK_SPEED;
            sprite.body.velocity.y = 0;
        } else if (sprite.y == 10 && sprite.x >= 240) {
            sprite.y = 10;
            sprite.body.velocity.x = 0;
            sprite.body.velocity.y = 0;
        }
    }
    game.physics.arcade.overlap(WORKS, WORKS, collideWorks);

}

function createWork() {
    var work = game.add.sprite(11, 442, 'workholder');
    work.scale.set(0.5, 0.5);
    WORKS.add(work);
    work.body.bounce.set(0);
    work.body.immovable = true;
}


function addBlockedBar() {
    var newBarX = 6, newBarY = 475;
    if (BARS.length) { //if a bar already exists
        var last_bar = BARS.getAt(BARS.length - 1);
        newBarY = last_bar.y - 18;
        newBarX= last_bar.x;
    }
    var bar = game.add.sprite(newBarX, newBarY, 'inactive_bar');
    bar.scale.set(0.5, 0.5);
    bar.alpha = 0.4;
    BARS.add(bar);
}



function collideWorks(work1, work2) {
    if (work1 == work2)
        return;
    /* both sprites moving up */
    if (work1.x == 11 && work2.x == 11) {
        //make the lower one wait
        if (work1.y <= work2.y) {
            work2.body.velocity.y = 0;
        } else {
            work1.body.velocity.y = 0;
        }
    }

    /* both sprites moving right */
    if (work1.y == 10 && work2.y == 10) {
        //make the left one wait
        if (work1.x > work2.x) {
            work2.body.velocity.x = 0;
        } else {
            work1.body.velocity.x = 0;
        }
    }

}
