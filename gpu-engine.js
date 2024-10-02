import Renderer from "./renderer.js";
import Drawer from "./drawer.js";

/**
 * @import { GPUProgram, GPUExecutable } from "./renderer.js";
 */


export default class GPUEngine {

      /**
       * @type {GPUTextureFormat}
       */
      #format;

      /**
      * @type {GPUDevice}
      */
      #device;

      /**
       * @type {GPUCanvasContext}
       */
      #ctx;

      /**
       * @type {Renderer}
       */
      #renderer;

      /**
       * @type {Drawer}
       */
      #drawer;

      /**
       * @type {Object.<string,GPUExecutable>}
       */
      #idExec = {};

      /**
       * @type {boolean}     
       */
      #inExecution = false;

      /**
       * initialize the different components of the webgpu API\
       * return false if the method failed, true otherwise.\
       * this function setup also all the listeners to the possible errors.
       * @returns {Promise<boolean>} 
       */
      async #instance(){

            if( !navigator.gpu ){
                  console.error('webgpu not supported');
                  return false;
            }

            const adapter = await navigator.gpu.requestAdapter();

            const device = await adapter.requestDevice();

            if( !device ){
                  console.error('device not available');
                  return false;
            }

            this.#device = device;
            this.#format = navigator.gpu.getPreferredCanvasFormat();

            this.#ctx.configure({
                  device,
                  format: this.#format,
                  alphaMode: 'premultiplied',
            });

            return true;
      }

      /**
       * return new instance of the GPUEngine class. It can be used to create and draw elements with the gpu.
       * ## USAGE
       * ```javascript
       * const engine = await GPUEngine.create( document.querySelector('#your-canvas') );
       * ```
       * @param {HTMLCanvasElement | OffscreenCanvas } cvs
       * @returns {Promise<GPUEngine>} 
       */
      static async create( cvs ){

            const engine = new GPUEngine( cvs );

            await engine.#instance();

            engine.#renderer = new Renderer( engine.#device, engine.#format );
            engine.#drawer = new Drawer( engine.#device, engine.#ctx );

            return engine;
      }

      /**
       * @param {HTMLCanvasElement | OffscreenCanvas} cvs
       * @hideconstructor
       */
      constructor( cvs ){
            const ctx = cvs.getContext('webgpu');
            this.#ctx = ctx;
      }     

      /**
       * primitive used to instantiate new entities that can be rendered on the gpu.
       * ## USAGE
       * ```javascript
       * const cvs = document.createElement('canvas');
document.body.appendChild( cvs );

GPUEngine.create( cvs ).then( async engine => {
      console.log(engine)
      await engine.create('triangle', {
                  code: `
                              struct Vertex {
                                    \@location(0) position: vec2f,
                                   \ @location(1) color: vec3f,
                              };
      
                              struct VSOutput {
                                    \@builtin(position) position: vec4f,
                                    \@location(0) color: vec4f,
                              };
      
                              \@vertex fn vs(
                              vert: Vertex,
                              ) -> VSOutput {
                                    var vsOut: VSOutput;
                                    vsOut.position = vec4f(vert.position, 0.0, 1.0);
                                    vsOut.color = vec4f( vert.color, 1.0 );
                                    return vsOut;     
                              }
      
                              \@fragment fn fs(vsOut: VSOutput) -> \@location(0) vec4f {
                                    return vsOut.color;
                              }
                        `,
                  vertexDescriptor: [{
                        location: 0,
                        type: Float32Array,
                        size: 2,
                        values: [ 
                              0, 0, 
                              1, 0, 
                              0, 1,
                              1, 1,
                        ],
                  },{
                        location: 1,
                        type: Float32Array,
                        size: 3,
                        values: [ 
                              1, 0, 0, 
                              0, 1, 0, 
                              0, 0, 1,
                              1, 0, 1,
                        ],
                  }],
                  groups: [],
                  indices: [ 0, 1, 2, 1,2,3 ],
                  topology: null,
                  cullMode: 'none',
                  vertexEntryPoint: "vs",
                  fragmentEntryPoint: "fs",
            });
      })
       * ```
       * ## FAILURE
       * 
       * it may fail in some cases, such as: 
       * - the arguments of program aren't legal;
       * - the id used is already in use;
       * @param {string} id 
       * @param {GPUProgram} program 
       */
      async create( id, program ){
            if( this.#idExec[id] ){
                  throw new Error(`[wgpu] id ${id} is already in use`);
            }
            const executable = await this.#renderer.createProgram( program );
            this.#idExec[id] = executable;
      }

      /**
       * start a loop that draws on the canvas the elements
       * 
       * ## USAGE
       * ```javascript
       * engine.draw();
       * ```
       */
      draw(){

            if( this.#inExecution )
                  return;

            const draw = ()=>{
                  this.#drawer.draw();
                  if( !this.#inExecution )
                        return;
                  requestAnimationFrame(draw);
            };

            this.#inExecution = true;
            draw()
      }

      /**
       * stop execution started with loop.
       * ## USAGE
       * ```javascript
       * engine.stop();
       * ```
       */
      stop(){
            this.#inExecution = false;
      }

      /**
       * add to the scene (draw on screen) an element with the given id.
       * the id is the id associated with the element from the GPUEngine.create function.
       * ## USAGE
       * ```javascript
       * engine.create( 'my-id', {...} ); //instantiate new entity
       * 
       * engine.addToScene('my-id'); //from now on, it is drawn on screen
       * ```
       * 
       * ## FAILURE
       * the method may fail if the given id doesn't exists.
       * @param {string} id 
       */
      addToScene( id ){
            if( !this.#idExec[id] )
                  throw new Error(`[wgpu] no entity with id ${id}`);

            this.#drawer.add( this.#idExec[id] );
      }

      /**
       * 
       * @param {string} id 
       */
      removeFromScene( id ){
            if( !this.#idExec[id] )
                  throw new Error(`[wgpu] no entity with id ${id}`);
            
            this.#drawer.remove( this.#idExec[id] );
      }
}
