import { Type } from "../enums.js";
import Camera from "./prototype.js";

/**@import {Mat4x4, PerspectiveCameraDescriptor} from "../type.d.ts" */
/**@import Scene from "../scene.js" */

export class PerspectiveCamera extends Camera {


      /**
       * @readonly
       * @type {number}
       */
      #width;

      /**
       * @readonly
       * @type {number}
       */
      #height;

      /**
       * @readonly
       * @type {number}
       */
      #near;

      /**
       * @readonly
       * @type {number}
       */
      #far;

      /**
       * @readonly
       * @type {number}
       */
      #fow;


      /**
       * @param {PerspectiveCameraDescriptor} descriptor 
       * @param {Scene} scene
       */
      constructor( descriptor, scene ){
            super( scene.id );
            
            this.#width = scene.game.canvasWidth;
            this.#height = scene.game.canvasHeight;

            this.#far = descriptor.far;
            this.#near = descriptor.near;
            this.#fow = descriptor.fow;

            this.initialize( scene );
            
      }

      /**
       * 
       * @returns {Mat4x4}
       */
      getMatrix(){

            const n = this.#near;
            const f = this.#far;
            const O = Math.tan( this.#fow / 2 );
            const a = this.#width/this.#height;

            const r = a*n*O;
            const l = -r;

            const b = n*O;
            const t = -b;

            return [ 
                  2*n/(r-l), 0, (r+l)/(r-l), 0,
                  0, 2*n/(t-b), (t+b)/(t-b), 0,
                  0, 0, (f+n)/(n-f), 2*f*n/(n-f),
                  0,0,-a,0,
            ];
      }

}

