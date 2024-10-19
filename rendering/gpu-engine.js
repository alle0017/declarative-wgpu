import Renderer from "./renderer.js";
import Drawer from "./drawer.js";
import { DEFAULT_CAMERA_BUFFER_ID, TypeConstructor, Type, } from "../enums.js";

/**
 * @import { GPUCompilableProgram, GPUExecutable, VertexBuffer, UniformDescriptor, GPUApp, VertexTransferable, } from "../type.d.ts";
 */

/**
 * @implements {GPUApp}
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
       * @type {Map<string, GPUExecutable>} //Object.<string,GPUExecutable>}
       */
      #idExecMap = new Map();

      /**
       * @type {Map<string, GPUExecutable>} type {Object.<string,GPUExecutable>}
       */
      #codeExecMap = new Map();

      /**
       * @type {boolean}     
       */
      #inExecution = false;

      /**
       * @type {Array<{ method: string, args: any[] }>}
       */
      #events = [];

      /**
       * @type {boolean} 
       */
      #isBusy = false;


      get ctx(){
            return this.#ctx;
      }

      get device(){
            return this.#device;
      }

      /**
       * 
       * @param {VertexTransferable[]} attrib 
       */
      static #attribToString( attrib ){
            const map = [];

            attrib.forEach( buff => {
                  map[buff.location] = new TypeConstructor[buff.type](buff.values).join(',');
            })
            return map.reduce( (p,v) => p + '/' + v );
      }

      /**
       * 
       * @param {GPUCompilableProgram} program 
       */
      static #getShaderId( program ){
            return program.code + 
            ( program.cullMode || 'back' ) + 
            ( program.topology || 'triangle-list' ) +
            ( program.fragmentEntryPoint || 'fragment_main' ) + 
            ( program.vertexEntryPoint || 'vertex_main' );
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
            engine.#drawer = new Drawer( engine );

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
       * 
       * @param {string} id 
       * @param {GPUCompilableProgram} program 
       */
      async create( id, program ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'create',
                        args: [id,program],
                  });
                  return;
            }

            if( this.#idExecMap.has( id ) ){
                  throw new ReferenceError(`[wgpu] id ${id} is already in use`);
            }
            const shaderId = GPUEngine.#getShaderId( program ) + GPUEngine.#attribToString( program.vertexDescriptor );
            
            if( this.#codeExecMap.has( shaderId ) ){
                  this.#idExecMap.set( id, await this.#renderer.cloneProgram( program, this.#codeExecMap.get( shaderId ) ) );
            }else{
                  const executable = await this.#renderer.createProgram( program );

                  this.#idExecMap.set( id, executable );
                  this.#codeExecMap.set( shaderId, executable );
            }     
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
            const draw = async ()=>{
                  this.#isBusy = true;
                  this.#drawer.draw();

                  if( !this.#inExecution )
                        return;

                  this.#isBusy = false;

                  for( let i = 0; i < this.#events.length; i++ ){
                        await this[ this.#events[i].method ]( ...this.#events[i].args );
                  }

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

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'addToScene',
                        args: [id],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) )
                  throw new ReferenceError(`[wgpu] no entity with id ${id}`);

            this.#drawer.add( this.#idExecMap.get( id ) );
            this.#drawer.sort();
      }

      /**
       * 
       * @param {string} id 
       */
      removeFromScene( id ){
            if( this.#isBusy ){
                  this.#events.push({
                        method: 'removeFromScene',
                        args: [id],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) )
                  throw new ReferenceError(`[wgpu] no entity with id ${id}`);
            
            this.#drawer.remove( this.#idExecMap.get( id ) );
      }

      /**
       * 
       * @param {string} id 
       * @param {number} binding 
       * @param {number} group
       * @param {number[]|string} resource 
       * @param {number} z
       */
      async update( id, group, binding, resource, z ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'update',
                        args: [id, group, binding, resource, z],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) )
                  throw new ReferenceError(`[wgpu] no entity with id ${id}`);

            const updated = this.#idExecMap.get( id );
            updated.z = z;
            this.#drawer.sort();

            await updated.updateBinding( group, binding, resource );
      }
      /**
       * 
       * @param {string} bufferId 
       * @param {Type | null} type
       * @param {number} size 
       */
      async createGlobalBuffer( bufferId, type, size ){
            if( this.#isBusy ){
                  this.#events.push({
                        method: 'createGlobalBuffer',
                        args: [bufferId, type, size],
                  });
                  return;
            }

            await this.#renderer.createGlobalBuffer(
                  bufferId,
                  type,
                  size
            );
      }
      
      /**
       * 
       * @param {string} bufferId 
       * @param {number} byteOffset 
       * @param {Type} type
       * @param {ArrayBuffer} values 
       * @param {boolean} priority 
       */
      async writeGlobalBuffer( bufferId, byteOffset, type, values, priority = false ){

            if( !priority && this.#isBusy ){
                  this.#events.push({
                        method: 'writeGlobalBuffer',
                        args: [ bufferId, byteOffset, type, values ],
                  });
                  return;
            }

            await this.#renderer.writeGlobalBuffer( 
                  bufferId, 
                  byteOffset, 
                  type, 
                  values 
            );
      }

      /**
       * @param {ArrayBuffer} values
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      async createCamera( sceneId, cameraId, values ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'createCamera',
                        args: [  sceneId, cameraId, values  ],
                  });
                  return;
            }

            if( !this.#renderer.hasDefaultCamera() ){
                  await this.#renderer.createGlobalBuffer( DEFAULT_CAMERA_BUFFER_ID, Type.f32, 16 );
                  await this.#renderer.writeGlobalBuffer( DEFAULT_CAMERA_BUFFER_ID, 0, Type.f32, values );
            }

            this.#drawer.addCamera( values, sceneId, cameraId );
      }

      /**
       * @param {ArrayBuffer} values
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      updateCamera( sceneId, cameraId, values ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'updateCamera',
                        args: [  sceneId, cameraId, values  ],
                  });
                  return;
            }

            this.#drawer.updateCamera( values, sceneId, cameraId );
      }
}