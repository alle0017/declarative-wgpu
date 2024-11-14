import Entity from "./entities/entity.js";
import { PerspectiveCamera } from "./camera/camera.js";
/**@import Game from "../game.js"; */
/**@import {Mat4x4, PerspectiveCameraDescriptor, CameraMovement} from "./type.d.ts" */
/**@import Camera from "./camera/prototype.js" */

/**
 * represents a scene inside the game.
 * ## life cycle callbacks
 * 
 * - `onEnter` - called when the scene is added to the game with Game#changeScene
 * - `onLeave` - called when the scene is removed from the game. this happens when another scene is added using the Game#changeScene
 * - `onUpdate` - called during the main game loop (only if is the current scene)
 * 
 * ### important note
 * **the constructor will be called only once**, the first time the scene is added to the game
 * 
 * ## useful methods 
 *  
 * - `createPerspectiveCamera` - create new camera that is used everytime the scene is in use.
 * - `addEntity` - if the scene leaves, all the entities bound to the scene will be removed from the screen.
 *    Equally, if the scene enters, all the entities bound to the scene will be drawn.
 * 
 * ## usage
 * ```javascript
 * import Game from "./madjs/index.js";
import { Scene, BasicEntity3D } from "./madjs/index.js";


class Chapter1 extends Scene {

      x;

      onEnter( game ){

            this.createPerspectiveCamera( 'camera1', {
                  near: 1,
                  far: 2000,
                  fow: Math.PI*60/180,
            });
            
            this.x = new BasicEntity3D( game, {
                  indices: [ 
                        0, 1, 2, 
                        2, 1, 3,
                  ],
                  vertices: [
                        0, 0, 0,
                        1, 0, 0,
                        0, 1, 0,
                        1, 1, 0,
                  ],
            }, {
                  r: 0.7,
                  g: 0.5,
                  b: .9,
                  a: 1,
            });
      }
      onUpdate( game ){
            this.x.z -= 0.1;
      }
}


const game = new Game();


game.startGame();
game.changeScene( Chapter1 );



```
 */
export default class Scene {

      /**
       * @type {Map<string, number>}
       */
      static #sceneIdMap = new Map();

      /**
       * @type {number}
       */
      static #incrementalId = 0;

      /**
       * @type {Entity[]}
       */
      #entities = [];

      /**
       * @type {Map<string,Camera>}
       */
      #cameras = new Map();

      /**
       * @type {Game}
       */
      #game;

      /**
       * @readonly
       * @type {number}
       */
      #id;

      get game(){
            return this.#game;
      }

      get id(){
            return this.#id;
      }

      /**
       * @param {Game} game 
       * @abstract
       */
      constructor( game ){
            const protoName = Object.getPrototypeOf(this).constructor.name;

            this.#game = game;

            if( Scene.#sceneIdMap.has( protoName ) ){
                  this.#id = Scene.#sceneIdMap.get( protoName );
            }else{
                  this.#id = Scene.#incrementalId++;
                  Scene.#sceneIdMap.set( protoName, this.#id );
            }
      }

      __draw__(){
            this.#entities.forEach( entity => {
                  entity.addToScene();
            });
            return this;
      }

      __stopDrawing__(){
            this.#entities.forEach( entity => {
                  entity.removeFromScene();
            });
            return this;
      }

      /**
       * 
       * @param {Entity} entity 
       */
      addEntity( entity ){
            this.#entities.push( entity );
            return this;
      }

      /**
       * @param {string} id
       * @param {?PerspectiveCameraDescriptor} descriptor 
       */
      createPerspectiveCamera( id, descriptor ){
            const cam = new PerspectiveCamera( 
                  descriptor, 
                  this
            );

            this.#cameras.set( id, cam );

            return this;
      }

      /**
       * @param {string} id 
       * @param {Partial<CameraMovement>} movement 
       */
      moveCamera( id, movement ){
            const camera = this.#cameras.get( id )
            if( !camera )
                  throw new ReferenceError(`[wgpu] no camera with id ${id}`);
            camera.moveTo( movement );
            return this;
      }

      /**
       * 
       * @param {Entity | string} entity 
       */
      followEntity( entity ){}

      /**
       * ### **Needs to be assigned**
       * function called when the scene leaves the game
       * @param {Game} game 
       * @returns {void}
       * @abstract
       */
      onEnter( game ){}
      /**
       * ### **Needs to be assigned**
       * function called when the scene leaves the game
       * @param {Game} game 
       * @returns {void}
       * @abstract
       */
      onLeave( game ){}
      /**
       * ### **Needs to be assigned**
       * function called in main loop, when the game is being updated
       * @abstract
       * @param {Game} game 
       * @returns {void}
       */
      onUpdate( game ){}
}     