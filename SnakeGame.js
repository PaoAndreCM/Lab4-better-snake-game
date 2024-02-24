"use strict";

import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";

// * Initialize webGL
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({canvas,
                                          antialias: true});
renderer.setClearColor('rgb(255,255,255)');    // set background color

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100);
camera.position.set(0, -12, 15);
camera.lookAt(scene.position);
scene.add(camera);
// scene.add(new THREE.AxesHelper(1.5));

// Add light sources
scene.add(new THREE.AmbientLight('#ffffff'));
const light = new THREE.DirectionalLight();
light.position.set(0,0,1);
scene.add(light);

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create global audio sources
const gameOverSound = new THREE.Audio( listener );
const foodSound = new THREE.Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'sound1.wav', function( buffer ) {
	gameOverSound.setBuffer( buffer );
	gameOverSound.setVolume( 0.5 );
});

audioLoader.load( 'sound2.wav', function( buffer ) {
	foodSound.setBuffer( buffer );
	foodSound.setVolume( 0.5 );
});

// Playing Field
const field = new THREE.Object3D;
scene.add( field );

const fieldSize = 10;
const widthSegments = 10;
const heightSegments = 10;
const fieldGeometry = new THREE.PlaneGeometry( fieldSize, fieldSize, widthSegments, heightSegments );
const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0xc6bac2, 
                                                    side: THREE.DoubleSide, 
                                                    wireframe:false,
                                                    wireframeLinewidth:2.0 }); 
fieldMaterial.transparent = true;
fieldMaterial.opacity = 0.7;
const playingField = new THREE.Mesh( fieldGeometry, fieldMaterial );
field.add( playingField );

// Grid
const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper( size, divisions );
gridHelper.rotation.x = - Math.PI / 2;
field.add( gridHelper );

// Snake head
const sneakHead = new THREE.Object3D; // invisible plane to center the cube
const Z_OFFSET = 0.001
const step = 1;
sneakHead.position.copy(getRandomPosition()); 
field.add( sneakHead );

const sneakCubeLength = 0.95;
const cubeGeometry = new THREE.BoxGeometry( sneakCubeLength, sneakCubeLength, sneakCubeLength ); 
let cubeMaterial = new THREE.MeshStandardMaterial( { color: 0x59af3f,
                                                       metalness:0.5,
                                                       roughness:0.1 } ); 
const snakeHeadCube = new THREE.Mesh( cubeGeometry, cubeMaterial ); 
sneakHead.add( snakeHeadCube );

// Snake body
const snake = new THREE.Object3D;
field.add(snake)
const bodySegment = new THREE.Object3D; // invisible plane to center the cube
let bodyMaterial = new THREE.MeshStandardMaterial( { color: 'blue',
                                                       metalness:0.5,
                                                       roughness:0.1 } ); 
const snakeBodyCube = new THREE.Mesh( cubeGeometry, bodyMaterial ); 
bodySegment.add( snakeBodyCube );


let snakeBody = new Deque();
window.snakeBody = snakeBody;


// Food ball
const foodRadius = 0.5;
const foodGeometry = new THREE.SphereGeometry( foodRadius ); 
const foodMaterial = new THREE.MeshStandardMaterial( { color: 0xbf2237,
                                                    metalness:0.5,
                                                    roughness:0.1 } ); 
const food = new THREE.Mesh( foodGeometry, foodMaterial ); 
food.position.copy(getFoodPosition())
field.add( food );

function getFoodPosition() {
  let foodPosition = new THREE.Vector3;
  do {
    foodPosition = getRandomPosition();
  } while ( collidesWithSnake(foodPosition) );
  return foodPosition;
}

function getRandomPosition() {
  const MAX = 4;
  const MIN = -6;
  const x = Math.ceil(Math.random() * ( MAX - MIN ) + MIN) + step / 2;
  const y = Math.ceil(Math.random() * ( MAX - MIN ) + MIN) + step / 2;
  const z = step / 2 + Z_OFFSET;
  return new THREE.Vector3( x, y, z );
}

function collidesWithSnake(objectPosition) {
  if (sneakHead.position.equals(objectPosition)){
    return true;
  }
  return collidesWithSnakeBody(objectPosition);
}

function collidesWithSnakeBody(objectPosition){
    for (const element of snakeBody.getValues()) {
      if (element.position.equals(objectPosition)) {
        return true;
      }
  }
}

let nIntervId;
const TIMEFRAME = 250;
setInterval(move, TIMEFRAME);

function move(){
  if (!nIntervId) { 
    let oldHeadPosition = new THREE.Object3D;
    if(!direction.equals(0,0,0)){
      oldHeadPosition = sneakHead.position.clone();
    }
    sneakHead.position.add(direction.clone());
    if (!snakeBody.isEmpty()){
      const lastBodySegment = snakeBody.removeBack(); // Remove the last segment
      lastBodySegment.position.copy(oldHeadPosition);
      snakeBody.insertFront(lastBodySegment); // Move it to the front
    }
    checkIfGameOver();
  }
}

function checkIfGameOver(){
  if (snakeHitsWall() || collidesWithSnakeBody(sneakHead.position)) {
    gameOverSound.play();
    const zz = step / 2 + Z_OFFSET
    sneakHead.position.set(0, 0, -zz);
    field.remove(sneakHead);
    field.remove(snake);
    if (!alert('Game Over. Your snake was ' + getSnakeLength() + ' segments long.')) {
      window.location.reload(true);
    }
  }
}

function snakeHitsWall() {
  const halfFieldSize = fieldSize / 2;

  return (
    sneakHead.position.x > halfFieldSize ||
    sneakHead.position.x < -halfFieldSize ||
    sneakHead.position.y > halfFieldSize ||
    sneakHead.position.y < -halfFieldSize
  );
}

const direction = new THREE.Vector3(0,0,0);

document.addEventListener("keydown", moveSnake);

function moveSnake(event){
  if ( event.key == "ArrowLeft" && direction.x != 1 ){
      direction.y=0;
      direction.x=-1;
  }
  if ( event.key == "ArrowRight" && direction.x != -1 ){
      direction.y=0;
      direction.x=1;
  }
  if ( event.key == "ArrowUp" && direction.y != -1 ){
      direction.x=0;
      direction.y=1;
  }
  if ( event.key == "ArrowDown" && direction.y != 1){
      direction.y=-1;
      direction.x=0;
  }
}

function snakeEatsFood() {
  return sneakHead.position.equals(food.position);
}

function getSnakeLength() {
  return snakeBody.size() + 1;
}

// * Render loop
const controls = new TrackballControls(camera, renderer.domElement);
function render() {
  requestAnimationFrame(render);

  if( snakeEatsFood() ){
    foodSound.play();
    const newBodyBlock = food.position.clone(); // clones coordinates of food
    const cube2 = bodySegment.clone();
    cube2.position.copy(newBodyBlock);
    snake.add(cube2);
    snakeBody.insertBack(cube2); // adds new cube to the snake body
    food.position.copy(getFoodPosition()); // gives the food a new position
  }

  renderer.render(scene, camera);
  controls.update();
}
render();



// * Deque:
// https://learnersbucket.com/tutorials/data-structures/implement-deque-data-structure-in-javascript/

function Deque() {
  //To track the elements from back
  let count = 0;

  //To track the elements from the front
  let lowestCount = 0;

  //To store the data
  let items = {};
  this.getValues = () => {return Object.values(items);};

  //Add an item on the front
  this.insertFront = (elm) => {

    if(this.isEmpty()){
      //If empty then add on the back
      this.insertBack(elm);

    }else if(lowestCount > 0){
      //Else if there is item on the back
      //then add to its front
      items[--lowestCount] = elm;

    }else{
      //Else shift the existing items
      //and add the new to the front
      for(let i = count; i > 0; i--){
        items[i] = items[i - 1];
      }

      count++;
      items[0] = elm;
    }
  };

  //Add an item on the back of the list
  this.insertBack = (elm) => {
    items[count++] = elm;
  };

  //Remove the item from the front
  this.removeFront = () => {
    //if empty return null
    if(this.isEmpty()){
      return null;
    }

    //Get the first item and return it
    const result = items[lowestCount];
    delete items[lowestCount];
    lowestCount++;
    return result;
  };

  //Remove the item from the back
  this.removeBack = () => {
    //if empty return null
    if(this.isEmpty()){
      return null;
    }

    //Get the last item and return it
    count--;
    const result = items[count];
    delete items[count];
    return result;
  };

  //Peek the first element
  this.getFront = () => {
    //If empty then return null
    if(this.isEmpty()){
      return null;
    }

    //Return first element
    return items[lowestCount];
  };

  //Peek the last element
  this.getBack = () => {
    //If empty then return null
    if(this.isEmpty()){
      return null;
    }

    //Return first element
    return items[count - 1];
  };

  //Check if empty
  this.isEmpty = () => {
    return this.size() === 0;
  };

  //Get the size
  this.size = () => {
    return count - lowestCount;
  };

  //Clear the deque
  this.clear = () => {
    count = 0;
    lowestCount = 0;
    items = {};
  };

  //Convert to the string
  //From front to back
  this.toString = () => {
    if (this.isEmpty()) {
      return '';
    }
    let objString = `${items[lowestCount]}`;
    for (let i = lowestCount + 1; i < count; i++) {
      objString = `${objString},${items[i]}`;
    }
    return objString;
  };
}
