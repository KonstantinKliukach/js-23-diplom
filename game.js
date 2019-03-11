'use strict';

'use strict'
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(vector) {
    if (vector instanceof Vector) {
      let newVector = new Vector;
      newVector.x = this.x + vector.x
      newVector.y = this.y + vector.y
      return newVector;
    }
    else {
      throw new Error('Должен быть Вектор');
    }
  }
  times(multiplier) {
    let newVector = new Vector;
    newVector.x = this.x * multiplier;
    newVector.y = this.y * multiplier;
    return newVector;
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(size instanceof Vector && speed instanceof Vector && pos instanceof Vector)) {
      throw new Error('Размер и Скорость должны быть Вектор');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get type() {
    return 'actor'
  }
  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('Должен быть Actor');
    }
    if (Object.is(this, actor)) {
      return false;
    }
    else if (!(this.left < actor.right && this.right > actor.left &&
      this.bottom > actor.top && this.top < actor.bottom)) {
      return false
    }
    else {
      return true;
    }
  }

  act() {

  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    let playerIndex;
    let maxWidth = 0;
    actors.forEach(function (actor) {
      if (actor.type === 'player') {
        playerIndex = actors.indexOf(actor)
      }
    })
    this.player = actors[playerIndex];
    this.height = grid.length;
    grid.forEach(function (line) {
      if (line.length > maxWidth) {
        maxWidth = line.length;
      }
    })
    this.width = maxWidth;
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    }
    else if (this.status !== null && this.finishDelay > 0) {
      return false;
    }
    else {
      return false;
    }
  }
  actorAt(actor) {
    let intersects = false;
    if (!(actor instanceof Actor)) {
      throw new Error('Должен быть Actor');
    }
    else {
      for (let i = 0; i < this.actors.length; i++) {
        if (this.actors[i] instanceof Actor) {
          if (actor.isIntersect(this.actors[i])) {
            intersects = true;
            return this.actors[i];
          }
        }
      }
    }
    if (intersects === false) {
      return;
    }
  }
  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('Метод obstacleAt. Переданы аргументы, отличные от Vector');
    }
    if ((position.y < 0) || ((position.x + size.x) > this.width) || (position.x < 0)) {
      return 'wall';
    }
    if ((position.y + size.y) > this.height) {
      return 'lava';
    }
    for (let curRow = Math.floor(position.y); curRow < Math.ceil(position.y + size.y); curRow++) {
      for (let curCell = Math.floor(position.x); curCell < Math.ceil(position.x + size.x); curCell++) {
        let obstacle = this.grid[curRow][curCell];
        if ((obstacle === 'wall') || (obstacle === 'lava')) {
          return obstacle;
        }
      }
    }
  }
  removeActor(actor) {
    let actorIndex = this.actors.indexOf(actor);
    if (actorIndex > -1) {
      this.actors.splice(actorIndex, 1);
    }
  }
  noMoreActors(typeToFind) {
    for (let i = 0; i < this.actors.length; i++) {
      if (this.actors[i].type === typeToFind) {
        return false;
      }
    }
    return true;
  }
  playerTouched(type, actor) {
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
      }
      else if (type === 'coin') {
        this.removeActor(actor)
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(symbol) {
    for (let key in this.dictionary) {
      if (key === symbol) {
        return this.dictionary[key];
      }
    }
    return;
  }
  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    }
    else if (symbol === '!') {
      return 'lava';
    }
    else {
      return;
    }
  }
  createGrid(plan) {
    let levelPlan = [];
    for (let i = 0; i < plan.length; i++) {
      let planSplited = plan[i].split('')
      let newLine = [];
      for (let l = 0; l < planSplited.length; l++) {
        newLine.push(this.obstacleFromSymbol(planSplited[l]));
      }
      levelPlan.push(newLine)
    }
    return levelPlan

  }
  createActors(plan) {
    let actorsPlan = [];
    for (let i = 0; i < plan.length; i++) {
      actorsPlan.push(plan[i].split(''))
    }
    let newActors = [];
    for (let i = 0; i < actorsPlan.length; i++) {
      for (let l = 0; l < actorsPlan[i].length; l++) {
        let actorType = this.actorFromSymbol(actorsPlan[i][l])
        if (actorType !== undefined) {
          if (typeof actorType !== 'function') {
            continue;
          }
          let newActor = new actorType(new Vector(l, i))
          if (newActor instanceof Actor) {
            newActors.push(newActor)
          }
        }
      }
    }
    return newActors;
  }
  parse(plan) {
    let newLevel = new Level(this.createGrid(plan), this.createActors(plan))
    return newLevel;
  }
}

class Fireball extends Actor {
  constructor(pos, size, speed) {
    if (speed === undefined) {
      speed = size;
      size = new Vector(1, 1);
    }
    super(pos, size, speed)
  }
  get type() {
    return 'fireball'
  }
  getNextPosition(time = 1) {
    let newPosX = this.pos.x + this.speed.x * time;
    let newPosY = this.pos.y + this.speed.y * time;
    return new Vector(newPosX, newPosY)
  }
  handleObstacle() {
    this.speed.x = - this.speed.x;
    this.speed.y = - this.speed.y;
  }
  act(time, level) {
    let newPos = this.getNextPosition(time)
    let hasObstacle = level.obstacleAt(newPos, this.size)
    if (hasObstacle === undefined || hasObstacle.type === Actor) {
      this.pos.x = newPos.x;
      this.pos.y = newPos.y
    }
    else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}


class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
    this.start = new Vector(0, 0);
    this.start.x = this.pos.x;
    this.start.y = this.pos.y;
  }
  handleObstacle() {
    this.pos.x = this.start.x;
    this.pos.y = this.start.y;
  }
}

class Player extends Actor {
  constructor(pos) {
    super()
    if (pos !== undefined) {
      let realX = pos.x - 0;
      let realY = pos.y - 0.5;
      this.pos = new Vector(realX, realY)
    }
    else {
      this.pos = new Vector(0, -0.5);
    }
    this.size = new Vector(0.8, 1.5)
    this.speed = new Vector(0, 0)
  }
  get type() {
    return 'player'
  }
}

class Coin extends Actor {
  constructor(pos) {
    super();
    if (pos !== undefined) {
      this.pos = new Vector(pos.x + 0.2, pos.y + 0.1);
    }
    else {
      this.pos = new Vector(0.2, 0.1);
    }
    this.start = this.pos;
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (2 * Math.PI);
  }
  get type() {
    return 'coin';
  }
  updateSpring(time) {
    if (time === undefined) {
      this.spring = this.spring + this.springSpeed;
    }
    else {
      this.spring = this.spring + this.springSpeed * time;
    }
  }
  getSpringVector() {
    let springVectorY = Math.sin(this.spring) * this.springDist;
    return new Vector(0, springVectorY);
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    let newVectorY = this.start.y + this.getSpringVector().y;
    return new Vector(this.start.x, newVectorY);
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}


const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
}


const parser = new LevelParser(actorDict);

loadLevels().then(function (result) {
  runGame(JSON.parse(result), parser, DOMDisplay)
})

const ball = new FireRain();
// console.log(ball instanceof Fireball)
// console.log(ball.speed)