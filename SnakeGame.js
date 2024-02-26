"use strict";

import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import {OBJLoader} from "three/addons/loaders/OBJLoader.js";

// * Initialize webGL
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({canvas,
                                          antialias: true});
renderer.setClearColor('rgb(255,255,255)');    // set background color
// renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 1000);

// window.addEventListener("resize", function () {
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
// });

camera.position.set( 0.13921937852101335, -33.60575621603862, 9.779251868769181);
camera.lookAt(scene.position);
scene.add(camera);
window.camera = camera; // TODO DELETE THIS
scene.add(new THREE.AxesHelper(1.5));

// Add light sources
scene.add(new THREE.AmbientLight('#ffffff'));
// const light = new THREE.DirectionalLight();
// light.position.set(0,0,1);
// scene.add(light);

const spotlight = new THREE.SpotLight(0xffffff);
spotlight.castShadow = true; // default false

spotlight.position.set(0,10,20);
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
spotlight.shadow.camera.fov = 50;
spotlight.shadow.camera.near = 6;
spotlight.shadow.camera.far = 100;
spotlight.intensity = 1000;
scene.add(spotlight);
const spotLightHelper = new THREE.SpotLightHelper( spotlight );
scene.add( spotLightHelper );

const spotlightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color:'yellow'}))
spotlightBulb.position.copy(spotlight.position)
scene.add(spotlightBulb);

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

// Sky cube
const txtLoader = new THREE.TextureLoader();
const urls = [
  "resources/skybox/nz.jpg",
  "resources/skybox/pz.jpg",
  "resources/skybox/py.jpg",
  "resources/skybox/ny.jpg",
  "resources/skybox/px.jpg",
  "resources/skybox/nx.jpg",
];

let matArray = [];
urls.forEach(tn => {
  const txt = txtLoader.load(tn);
  matArray.push(new THREE.MeshBasicMaterial({map:txt, side:THREE.BackSide}));
});

const skyCubeSize = 300;
let skyBoxGeo = new THREE.BoxGeometry(skyCubeSize,skyCubeSize,skyCubeSize);
let skyBox = new THREE.Mesh(skyBoxGeo, matArray);
skyBox.rotation.x = Math.PI / 2;
scene.add(skyBox);

// Gray ground
const groundGeo = new THREE.CircleGeometry(skyCubeSize/2, 32);
const groundMat = new THREE.MeshPhongMaterial({color:'gray'});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.z = -0.002;
ground.receiveShadow = true;
scene.add(ground);

// Playing Field
const field = new THREE.Object3D;
scene.add( field );

const fieldSize = 12;
const widthSegments = 12;
const heightSegments = 12;
const fieldGeometry = new THREE.PlaneGeometry( fieldSize, fieldSize, widthSegments, heightSegments );
// const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0xc6bac2, 
//                                                     side: THREE.DoubleSide, 
//                                                     wireframe:false,
//                                                     wireframeLinewidth:2.0 }); 
// fieldMaterial.transparent = true;
// fieldMaterial.opacity = 0.7;

const playingFieldTexture = txtLoader.load('resources/FloorsCheckerboard_S_Diffuse.jpg');
playingFieldTexture.wrapS = THREE.RepeatWrapping;
playingFieldTexture.wrapT = THREE.RepeatWrapping;
playingFieldTexture.repeat.set(2,2);
const playingFieldNormalMap = txtLoader.load('resources/FloorsCheckerboard_S_Normal.jpg');
const playingFieldMaterial = new THREE.MeshStandardMaterial({
  map: playingFieldTexture,
  normalMap: playingFieldNormalMap,
  // side: THREE.DoubleSide,
  roughness: 0.8,
  metalness: 0.2
});

const playingField = new THREE.Mesh(fieldGeometry, playingFieldMaterial);
playingField.receiveShadow = true;
field.add( playingField );

// walls
const wallsLength = 13;

const outerFrame = new THREE.Shape();
outerFrame.moveTo(-wallsLength / 2, -wallsLength / 2);
outerFrame.lineTo(-wallsLength / 2, wallsLength / 2);
outerFrame.lineTo(wallsLength / 2, wallsLength / 2);
outerFrame.lineTo(wallsLength / 2, -wallsLength / 2);
outerFrame.lineTo(-wallsLength / 2, -wallsLength / 2);

const innerFrame = new THREE.Shape();
innerFrame.moveTo(-fieldSize / 2, -fieldSize / 2);
innerFrame.lineTo(-fieldSize / 2, fieldSize / 2);
innerFrame.lineTo(fieldSize / 2, fieldSize / 2);
innerFrame.lineTo(fieldSize / 2, -fieldSize / 2);
innerFrame.lineTo(-fieldSize / 2, -fieldSize / 2);

outerFrame.holes.push(innerFrame);

const frameExtrudeSettings = {
  depth: 1,
  bevelEnabled: false,
};

const wallTexture = txtLoader.load('resources/hardwood2_diffuse.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(0,3);
const wallBumpMap = txtLoader.load('resources/hardwood2_bump.jpg')

const frameGeometry = new THREE.ExtrudeGeometry(outerFrame, frameExtrudeSettings);
const frameMaterial = new THREE.MeshPhongMaterial({
  color: 0x9b8369,
  side: THREE.DoubleSide,
  map: wallTexture,
  bumpMap: wallBumpMap,
  bumpScale: 0.1
});
const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
frameMesh.castShadow = true;
scene.add(frameMesh);

// Grid
// const size = 12;
// const divisions = 12;
// const gridHelper = new THREE.GridHelper( fieldSize, fieldSize );
// gridHelper.rotation.x = - Math.PI / 2;
// field.add( gridHelper );

// rounded cube

function snakeSegment(){
  const length = 0.70;

  const shape = new THREE.Shape();
  shape.moveTo( -length/2, -length/2 );
  shape.lineTo( -length/2, length/2 );
  shape.lineTo( length/2, length/2 );
  shape.lineTo( length/2, -length/2 );
  shape.lineTo( -length/2, -length/2 );

  const extrudeSettings = {
    steps: 1,
    depth: 0.40,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 8
  };

  const geo = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  return geo;
}

const snakeTexture = txtLoader.load('resources/lavatile.jpg');
snakeTexture.wrapS = snakeTexture.wrapT = THREE.RepeatWrapping;

// Snake head
const sneakHead = new THREE.Object3D; // invisible plane to center the cube
const Z_OFFSET = 0.001
const step = 1;
sneakHead.position.copy(getRandomPosition(false)); 
sneakHead.position.z = 0.1;
field.add( sneakHead );

let cubeMaterial = new THREE.MeshStandardMaterial( { map: snakeTexture } ); 
const snakeHeadCube = new THREE.Mesh( snakeSegment(), cubeMaterial ); 
snakeHeadCube.castShadow = true;
sneakHead.add( snakeHeadCube );

// Snake body
const snake = new THREE.Object3D;
field.add(snake)
const bodySegment = new THREE.Object3D; // invisible plane to center the cube
let bodyMaterial = new THREE.MeshStandardMaterial( { color: 0xe8c68d,
                                                       map: snakeTexture } ); 
const snakeBodyCube = new THREE.Mesh( snakeSegment(), bodyMaterial ); 
bodySegment.add( snakeBodyCube );

let snakeBody = new Deque();

// Apple
const objLoader = new OBJLoader();

let food = null;

objLoader.load(
  'resources/Apple.obj',
  function (object) {
      const appleTexture = txtLoader.load('resources/Apple_BaseColor.png');
      const appleNormalMap = txtLoader.load('resources/Apple_Normal.png');
      const appleSpecMap = txtLoader.load('resources/Apple_Roughness.png');
      const material = new THREE.MeshPhongMaterial({ shininess: 5,
                                                     map:appleTexture,
                                                     normalMap: appleNormalMap,
                                                     specularMap:appleSpecMap}); 
      object.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
              child.material = material;
              child.castShadow = true;
          }
      });
      object.scale.set(0.01,0.01,0.01);
      
      food = object;
      food.position.copy(getFoodPosition())
      food.rotation.x = Math.PI/2
      // food.castShadow = true;
      scene.add(food);
      render();

  },
  function (xhr) {
      // On progress
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
      // On error
      console.error('An error happened', error);
  }
);

// const appleGeometry = new THREE.Geometry().fromBufferGeometry(apple.children[0].geometry);


// Food ball
const foodRadius = 0.5;
const foodGeometry = new THREE.SphereGeometry( foodRadius ); 
const foodMaterial = new THREE.MeshStandardMaterial( { color: 0xbf2237,
                                                    metalness:0.5,
                                                    roughness:0.1 } ); 
// const food = new THREE.Mesh( foodGeometry, foodMaterial ); 
// const food = apple; 
// food.position.copy(getFoodPosition())
// field.add( food );

function getFoodPosition() {
  let foodPosition = new THREE.Vector3;
  do {
    foodPosition = getRandomPosition(true);
  } while ( collidesWithSnake(foodPosition) );
  return foodPosition;
}

function getRandomPosition(isFood) {
  const MAX = 4;
  const MIN = -6;
  const x = Math.ceil(Math.random() * ( MAX - MIN ) + MIN) + step / 2;
  const y = Math.ceil(Math.random() * ( MAX - MIN ) + MIN) + step / 2;
  let z = 0;
  if (isFood == true){
    z = step / 3 + Z_OFFSET;
  } else {
    z = 0.15;
  }
  return new THREE.Vector3( x, y, z );
}

function collidesWithSnake(objectPosition) {
  if (sneakHead.position.x == objectPosition.x && sneakHead.position.y == objectPosition.y){
    return true;
  }
  return collidesWithSnakeBody(objectPosition);
}

function collidesWithSnakeBody(objectPosition){
    for (const element of snakeBody.getValues()) {
      if (element.position.x == objectPosition.x && element.position.y == objectPosition.y) {
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
  return sneakHead.position.x == food.position.x && sneakHead.position.y == food.position.y;
}

function getSnakeLength() {
  return snakeBody.size() + 1;
}

// * Render loop
const controls = new TrackballControls(camera, renderer.domElement);
controls.zoomSpeed = 5;
controls.maxDistance = 100;
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
