import { Type } from "../enums.js";
import Scene from "../scene.js";

/**@import {GPUApp, Mat4x4, PerspectiveCameraDescriptor} from "../type.d.ts" */
/**@import Game from "../../game.js" */

/**
 * @abstract
 */
export default class Camera {

      static #cameraId = 0;

      /**
       * @readonly
       * @type {number}
       */
      #id;

      /**
       * @readonly
       * @type {number}
       */
      #sceneId;

      /**
       * @type {Game}
       */
      #game;

      #position = {
            x: 0,
            y: 0,
            z: 0,
      };

      /**
       * roll or rotation around x axis
       * @default 0
       * @type {number}
       */
      #alpha = 0;

      /**
       * pitch or rotation around y axis
       * @default 0
       * @type {number}
       */
      #beta = 0;

      /**
       * yaw or rotation around z axis
       * @default 0
       * @type {number}
       */
      #gamma = 0;

      get x(){
            return this.#position.x;
      }
      set x( value ){
            if( this.#position.x === value )
                  return;
            this.#position.x = value;

            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get y(){
            return this.#position.y;
      }
      set y( value ){
            if( this.#position.y === value )
                  return;
            this.#position.y = value;

            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get z(){
            return this.#position.z;
      }
      set z( value ){
            if( this.#position.z === value )
                  return;
            this.#position.z = value;

            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get yaw(){
            return this.#gamma;
      }
      set yaw( value ){
            if( value == this.#gamma )
                  return;

            this.#gamma = value;

            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get pitch(){
            return this.#beta;
      }
      set pitch( value ){
            if( value == this.#beta )
                  return;
            this.#beta = value;
            
            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get roll(){
            return this.#alpha;
      }
      set roll( value ){
            if( value == this.#alpha )
                  return;

            this.#alpha = value;
            
            this.#game.writeGlobalBuffer( 
                  'camera',
                  0, 
                  Type.f32, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      get id(){
            return this.#id;
      }

      /**
       * 
       * @param {number} sceneId 
       */
      constructor( sceneId ){
            this.#sceneId = sceneId;
            this.#id = Camera.#cameraId++;
      }

      /**
       * @param {Mat4x4} a
       * @param {Mat4x4} b
       * @returns {Mat4x4}
       */
      multiply( a, b ){
            const matrix = [];

            if( a.length !== 16 && b.length !== 16 )
                  throw new Error('Invalid matrix size');

            for( let i = 0; i < 4; i++ ){
                  for( let j = 0; j  < 4; j++ ){
                        let res = 0;
                        for( let k = 0; k < 4; k++ ){
                              res += a[ i*4 + k ] * b[ k*4 + j ];
                        }
                        matrix.push( res );
                  }
            }
            //@ts-ignore
            return matrix;
      }

      /**
       * 
       * @param {Scene} scene
       */
      initialize( scene ){
            this.#game = scene.game;

            scene.game.createCamera( 
                  scene.id, this.#id, 
                  this.multiply( 
                        this.getViewMatrix(),
                        this.getMatrix(),
                  )
            );
      }

      /**
       * @abstract 
       * @return {Mat4x4}
       */
      getMatrix(){
            return [
                  1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1,
            ];
      }

      /**
       * @returns {Mat4x4} 
       */
      getViewMatrix(){

            const a = Math.cos( this.#alpha );
            const b = -Math.sin( this.#alpha );

            const c = Math.cos( this.#beta );
            const d = -Math.sin( this.#beta );

            const e = Math.cos( this.#gamma );
            const f = -Math.sin( this.#gamma );

            const { x, y, z } = this.#position;


            return [

                  c*e,	-a*f+b*d*e,	b*f+a*d*e,	-a*f*y+b*f*z+c*x*e+b*d*y*e+a*d*z*e,
                  c*f,	 b*d*f+a*e,	a*d*f-b*e,	 c*f*x+b*d*f*y+a*d*f*z+a*y*e-b*z*e,
                  -d,	       b*c,	      a*c,	                  -d*x+b*c*y+a*c*z,
                  0,	         0,	        0,	                                 1,

            ];
      }
}

