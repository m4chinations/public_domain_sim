var game = new Phaser.Game(300, 550, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, render: render, update: update });


//@@@@@@@@@@@@@@@ GLOBAL VARS @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

var SCORE = 0; //current score
var COPYRIGHT_TERM = [28, 42, 56, 74, 95, 105]; //aka difficulty
var CURRENT_TERM = 0; //index into the COPYRIGHT_TERM array

var CWBMD;

var WORK_SPEED = 60;

/* GROUPS */
var BARS;
var WORKS;
var GOAL;
var INTRO;

var GRIDX = 27.5;
var GRIDY = 28;

var SCORE_TEXT;

var BOARD = new Array(8);
for (var i = 0; i < 8; i++) {
    BOARD[i] = new Array(15);
}

var STATE = 'intro';


var DEBUG = false;



/* defines the available blocks. */

var block_sizes = [
    "x",
    "xx",
    "x\nx",
    "xx\nxx",
    "xo\nxo\nxx",
    "x\nx\nx\nx",
    "oxo\nxxx",
    "ox\nxx\nxo"
];

//@@@@@@@@@@@@@@@@@@ PHASER FUNCTIONS @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
/**
 * function: preload
 * Phaser function that will handle asset loading
 * returns: nothing
 */
function preload() {
    this.game.load.image('background', 'sprites/png/background2.png');
    this.game.load.image('inactive_bar', 'sprites/png/blocked_bar.png');
    this.game.load.image('titlescreen', 'sprites/png/title_screen.png');
    this.game.load.image('newspaper', 'sprites/png/newspaper.png');
    this.game.load.image('pd', 'sprites/png/pd.png');
    this.game.load.image('message1', 'sprites/png/message1.png');
    this.game.load.image('message2', 'sprites/png/message2.png');
    this.game.load.image('message3', 'sprites/png/message3.png');
    this.game.load.image('message4', 'sprites/png/message4.png');
    this.game.load.image('message5', 'sprites/png/message5.png');
    if (DEBUG) game.time.advancedTiming = true;
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
    intro();
}

/**
 * function: render
 * Phaser function that is called when rendering a frame.
 * returns: nothing
 */
function render() {
    if (DEBUG) game.debug.inputInfo(32, 32);
    if (DEBUG) game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
}



/**
 * function: update
 * Phaser function, called at FPS rate to update the gamestate.
 * returns: nothing
 */
function update() {
    if (STATE == 'playing') {
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
                //sprite.y = 10;
                //sprite.body.velocity.x = 0;
                //sprite.body.velocity.y = 0;
            } else {
                sprite.body.velocity.x = 0;
                sprite.body.velocity.y = 0;
            }
        }
        game.physics.arcade.overlap(WORKS, WORKS, collideWorks);
    }

}

function popupMessage(messageNum) {
    var paperSprite = game.add.sprite(0, 550, 'message'+messageNum);
    paperSprite.angle = 3;
    paperSprite.inputEnabled = true;

    paperSprite.events.onInputDown.add(function(sprite) {
        game.add.tween(paperSprite).to( { y : 550 }, 500, Phaser.Easing.Linear.None, true).onComplete.add(function() {
            paperSprite.destroy();
        });
    }, this);

    tween = game.add.tween(paperSprite).to( { y: 350 }, 1400, Phaser.Easing.Bounce.Out, true).onComplete.add(function() {
        game.time.events.add(6000, function() {
            if (paperSprite.alive && paperSprite.y == 350) {
                game.add.tween(paperSprite).to( { y : 550 }, 500, Phaser.Easing.Linear.None, true).onComplete.add(function() {
                    paperSprite.destroy();
                });
            }
        });
    });
}

function transition(composer, toBeDestroyed) {
    var bmd = game.add.bitmapData(game.width, game.height);
    bmd.ctx.fillStyle = "black";
    bmd.ctx.fillRect(0, 0, game.width, game.height);
    bmd.update();


    var sprite = game.add.sprite(0, 0, bmd);
    sprite.alpha = 0;
    var composer = composer;
    game.add.tween(sprite).to({alpha: 1}, 2000, Phaser.Easing.Linear.None, true).onComplete.add(function() {
        if (toBeDestroyed)
            toBeDestroyed.destroy(true);
        composer();
        sprite.bringToTop();
        game.add.tween(sprite).to({alpha: 0}, 1000, Phaser.Easing.Linear.None, true).onComplete.add(function() {
            sprite.destroy();
        })
    });
}


function startGame() {

    STATE = 'playing';

    /* add background and scale it for retina*/
    var background = game.add.sprite(0, 0, 'background');
    background.scale.set(0.5, 0.5);



    GOAL = game.add.group();
    GOAL.z = 2;


    /* initialize WORKS group that holds the works moving in the pipe */
    WORKS = game.add.group();
    WORKS.enableBody = true;
    game.physics.arcade.enable(WORKS);
    WORKS.z = 3;

    /* initialize BARS group that holds the disabling-bars*/
    BARS = game.add.group();
    BARS.z = 4;

    GRID = game.add.group();
    GRID.z = 5;


    createGoalArea();

    SCORE_TEXT = game.add.text(73, 70, "Score: 0", { font: '12px Arial', fill: '#ffffff', align: 'left'});

    game.time.events.add(Phaser.Timer.SECOND * 30, function() {runGameEvent(0)}, this);
    workSpawner(WORKDELAY);
    //game.time.events.loop(Phaser.Timer.SECOND * 1, function() { if (Math.random() > 0.2) addBlockedBar(); }, this);
}

var WORKDELAY = Phaser.Timer.SECOND * 2;

function workSpawner(delay) {
    createWork();
    game.time.events.add(delay, function() {workSpawner(WORKDELAY)}, this);
}


function createWork() {

    var worksize = block_sizes[Math.floor(Math.random() * block_sizes.length)];

    /* calculate bitmap size of the block */
    workY = (worksize.match(/\n/g) || []).length + 1; //how many newlines does the block have
    workX = 1;
    workRows = worksize.split("\n");
    /* find largest row */
    for (var i = 0; i < workY; i++) {
        if (workRows[i].length > workX)
            workX = workRows[i].length;
    }
    var blockBmd = game.add.bitmapData(workX * GRIDX, workY * GRIDY);
    blockBmd.ctx.fillStyle = getRandomColor();
    for (var row = 0; row < workRows.length; row++) {
        for (var cell = 0; cell < workRows[row].length; cell++) {
            if (workRows[row].charAt(cell) === 'x') {
                blockBmd.ctx.fillRect(cell * GRIDX, row * GRIDY, GRIDX, GRIDY);
            }
        }
    }


    var workHolder = game.add.bitmapData(48.5, 48.5);

    var text = game.make.text(0, 0, workX + " x " + workY, { font: "12px monospace", fill: "white" });
    text.anchor.x = 0.5;
    workHolder.draw(text, 24.25, 38);
    var scaledWorkX = ((workX * GRIDX) / (workY * GRIDY)) * 35;
    workHolder.draw(blockBmd, 24.25 - ( scaledWorkX / 2), 5, scaledWorkX, 35);




    var work = game.add.sprite(11, 442, workHolder);
    work.block = blockBmd;
    work.workRows = workRows;
    WORKS.add(work);
    work.body.bounce.set(0);
    work.body.immovable = true;

    work.inputEnabled = true;
    work.input.enableDrag();
    work.input.enableSnap(27.5, 28, true, true);
    work.input.snapOffsetX = 69;
    work.input.snapOffsetY = 68;

    work.explode = function() {
        game.add.tween(this).to({alpha: 0}, 200, Phaser.Easing.Bounce.Out, true).onComplete.add(function() {
            this.destroy();
        }, this);
    }



    work.events.onDragStart.add(function(sprite, pointer) {
        sprite.body.velocity.x = 0;
        sprite.body.velocity.y = 0;
        sprite.bringToTop();
    }, this);

    work.events.onDragStop.add(function(sprite, pointer) {
        var boardXY = absoluteXYToBoard(sprite);
        if (boardXY.x >= 0 && boardXY.y >= 0) {
            if (game.physics.arcade.overlap(sprite, GOAL)) {
                score(sprite, boardXY);
            }
        } else {
            sprite.explode();
        }
    }, this);

    work.events.onInputOver.add(function(sprite, pointer) {
        /*if (Math.random() > 0.5)
            sprite.loadTexture('spaceship2');
        else
            sprite.loadTexture('spaceship1');*/
    }, this);
    work.events.onInputOut.add(function(sprite, pointer) {
        //sprite.loadTexture('workholder');
    }, this);

    work.events.onInputDown.add(function(sprite, pointer) {
        sprite.loadTexture(sprite.block);
        sprite.x = pointer.x - sprite.width / 2;
        sprite.y = pointer.y - sprite.height / 2;
    }, this);

    return work;

}


function drawGrid() {
    var grid = game.add.bitmapData(220, 420);
    var ctx = grid.ctx;
    for (var repeatStroke = 0; repeatStroke < 5; repeatStroke++) {
        for (var i = 0; i < 9; i++) {
            var x = i * 27.5;
            if (x % 1 === 0) x += 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 420);
        }

        for (i = 0; i < 16; i++) {
            var y = i * 28;
            if (x % 1 === 0) x+= 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(220, y);
        }

        ctx.strokeStyle = "#595652";
        ctx.lineWidth = 1.3;
        ctx.stroke();
    }
    var gridsprite = game.add.sprite(69, 68, grid);
    gridsprite.bmd = grid;
    GRID.add(gridsprite);
}

function createGoalArea() {
    var goal = game.add.bitmapData(220, 420, 'goal');
    var ctx = goal.ctx;

    /* draw the goal area */
    ctx.beginPath();
    ctx.rect(0, 0, 220, 420);
    ctx.fillStyle = '#AAABA9';
    ctx.fill();

    /* add goal area to game */
    var goalsprite = game.add.sprite(69, 68, goal);
    goalsprite.bmd = goal;
    /* enable arcade physics for collision detection */
    game.physics.arcade.enable(goalsprite);
    goalsprite.body.immovable = true; //it's not going to move though
    GOAL.add(goalsprite);


    drawGrid();
}

function tutorial() {
    var tutString = [
        "you are an artist",
        "",
        "you make collages using other's works--",
        "--you are remixing their work.",
        "",
        "today, you are making a rectangle filled with blocks",
        "",
        "drag other's works into the game area, and fill the entire rectangle."
    ];
    var fontStyle = {
        font: 'bold 22px Times',
        fill: 'white',
        wordWrap: true,
        wordWrapWidth: 250,
        align: 'center'
    }
    var tutorialText = game.add.text(game.world.centerX, 50, tutString[0], fontStyle);
    tutorialText.anchor.x = 0.5;
    var index = 0;
    var line = '';

    function done() {
        transition(startGame, null);
    }

    function updateLine() {
        if (line.length < tutString[index].length) {
            line = tutString[index].substr(0, line.length + 1);
            tutorialText.setText(line);
        }
        else {
            game.time.events.add(Phaser.Timer.SECOND * 2, nextLine, this);
        }
    }
    function nextLine() {
        index++;
        if (index < tutString.length) {
            line = '';
            game.time.events.repeat(80, tutString[index].length + 1, updateLine, this);
        } else {
            done();
        }
    }
    nextLine();
}

var TIER = 0;

function increaseCWTerm(tiers) {
    if (CWBMD) {
        CWBMD.bmd.clear();
        CWBMD.update();
    }

    function generateCWLayer(tiers) {
        var bmd = game.make.bitmapData(70, 550);
        var final = game.make.bitmapData(70, 550);
        var fontStyle = {
            font: 'bold 22px Arial',
        }
        /* draw initial tier */
        var cwText = game.make.text(0, 0, "©©©©", fontStyle);
        cwText.angle = -30;
        bmd.draw(cwText, 0, 480);
        var copyRegion = new Phaser.Rectangle(0, 450, 70, 45);
        for (var x = 0; x < tiers; x++) {
            final.copyRect(bmd, copyRegion, 0, 450 - x * 20);
        }
        return final;
    }
    var bmd = generateCWLayer(tiers);
    var sprite = game.add.sprite(5, 0, bmd);
    sprite.bmd = bmd;
    sprite.alpha = 0.5;
    CWBMD = sprite;
    TIER = tiers;
}



function collideWorks(work1, work2) {
    if (work1 == work2)
        return;
    /* both sprites moving up */
    if (work1.x == 11 && work2.x == 11) {
        //make the lower one wait
        if (work1.y <= work2.y && work1.body.velocity.y != 0) {
            work2.body.velocity.y = 0;
        }
    }

    /* both sprites moving right */
    if (work1.y == 10 && work2.y == 10) {
        //make the left one wait
        if (work1.x > work2.x && work1.body.velocity.x != 0) {
            work2.body.velocity.x = 0;
        }
    }
}

function setScore(newScore) {
    SCORE = newScore;
    SCORE_TEXT.text = "Score: "+SCORE;
}

function absoluteXYToBoard(position) {
    var boardXY = {};
    boardXY.x = Math.floor((position.x - 69) / GRIDX);
    boardXY.y = Math.floor((position.y - 68) / GRIDY);
    console.log(position, boardXY);
    return boardXY;
}


/* Called when scoring a sprite in the goal area */
function score(sprite, location) {
    var goal = GOAL.getAt(0);
    var workRows = sprite.workRows;
    var canPlace = true;
    for (var x = 0; x < workRows.length; x++) {
        for (var y = 0; y < workRows[x].length; y++) {
            if (location.x + y > 7 || location.y + x > 14) {
                canPlace = false;
                break;
            }
            if (workRows[x].charAt(y) == 'x' && BOARD[location.x + y][location.y + x]) {
                canPlace = false;
                break;
            }
        }
    }
    console.log(canPlace, BOARD);

    if (canPlace) {
        console.log(workRows);
        for (var x = 0; x < workRows.length; x++) {
            for (var y = 0; y < workRows[x].length; y++) {
                if (workRows[x].charAt(y) == 'x') {
                    console.log("Setting to true: ", location.x + y, location.y + x, x, y);
                    BOARD[location.x + y][location.y + x] = true;
                }
            }
        }
        console.log("new board", BOARD);
        //draw sprite onto goal area
        goal.bmd.update();
        var bmdBefore = goal.bmd.pixels;
        //sprite.scale.set(0.71, 0.71);
        goal.bmd.draw(sprite, sprite.x - goal.x, sprite.y - goal.y, sprite.width, sprite.height, null, true);
        goal.bmd.update();
        var bmdAfter = goal.bmd.pixels;
        goal.bmd.render();

        var difference = 0;
        for (var pixel = 0; pixel < bmdBefore.length; pixel++)
            if (bmdBefore[pixel] != bmdAfter[pixel])
                difference++;

        displayCoolText("+"+difference, boardToAbsolute(location));
        sprite.destroy();
        checkWin();
    } else {
        sprite.explode();
    }
}

var gameEvents = [
    [30, function() {
        popupMessage(2);
        WORKDELAY = Phaser.Timer.SECOND * 10;
    }],
    [30, function() {
        increaseCWTerm(4);
        popupMessage(1);
        WORKDELAY = Phaser.Timer.SECOND * 2;
    }],
    [60, function() {
        popupMessage(3);
        WORKDELAY = Phaser.Timer.SECOND * 6;
    }],
    [60, function() {
        popupMessage(4);
        WORKDELAY = Phaser.Timer.SECOND * 4;
    }],
    [60, function() {
        increaseCWTerm(10);
        popupMessage(5);
        WORKDELAY = Phaser.Timer.SECOND * 3;
    }],
    [60, function() {
        popupMessage(3);
        WORKDELAY = Phaser.Timer.SECOND * 5;
    }],
    [30, function() {
        increaseCWTerm(22);
        popupMessage(5);
        WORKDELAY = Phaser.Timer.SECOND * 1;
    }]

]

function runGameEvent(index) {
    gameEvents[index][1]();
    if ((index + 2) < gameEvents.length) {
        console.log("registering next game event for seconds: ", gameEvents[index+1][0])
        game.time.events.add(Phaser.Timer.SECOND * gameEvents[index+1][0], function() {runGameEvent(index+1)});
    }
}


function boardToAbsolute(location) {
    var abs = {};
    abs.x = (1 + location.x) * GRIDX;
    abs.y = (1 + location.y) * GRIDY;
    return abs;
}

function checkWin() {
    for (var i = 0; i < BOARD.length; i++)
        for (var j = 0; j < BOARD[i].length; j++)
            if (!BOARD[i][j])
                return;


    console.log("YOU WON!");
}


function getRandomColor() {
    return randomColor();
}

function displayCoolText(message, location) {
    var fontStyle = {
        font: 'bold 16px monospace'
    }
    var text = game.add.text(location.x + Math.random() * 50, location.y + Math.random() * 50, message, fontStyle);
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    var swapper = true;
    game.time.events.repeat(30, 200, function() { swapper ? text.addColor('#DBE84F', 0) : text.addColor('#9FA83D', 0); swapper = !swapper; }, this);
    game.add.tween(text.scale).to({x: 1.3, y: 1.3}, 400, Phaser.Easing.Bounce.InOut, true, 0, -1, true);
    game.add.tween(text).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true).onComplete.add(function() {
        text.destroy();
    })
}


function intro() {
    INTRO = game.add.group();
    var bg = game.add.sprite(0, -100, 'newspaper');
    bg.angle = 4;
    var heading = game.add.sprite(0, 0, 'titlescreen');
    var text = game.add.text(game.world.centerX, game.world.centerY + 130, "click to start", { font: "bold 24px monospace", fill: "black" })
    text.anchor.x = 0.5;
    game.add.tween(bg).to({y : -30, angle: -4, x : -50}, 50000, Phaser.Easing.Linear.None, true, 0, -1, true);
    game.add.tween(bg.scale).to({x: 1.2, y: 1.2}, 30000, Phaser.Easing.Linear.None, true, 0, -1, true);
    INTRO.add(bg); INTRO.add(heading); INTRO.add(text);
    bg.inputEnabled = true; bg.events.onInputDown.add(function() {transition(tutorial, INTRO)}, this);
    heading.inputEnabled = true; heading.events.onInputDown.add(function() {transition(tutorial, INTRO)}, this);
    text.inputEnabled = true; text.events.onInputDown.add(function() {transition(tutorial, INTRO)}, this);
}
