/**
 * @import {GPUExecutable} from './renderer.js';
 */

/**
 * @typedef {Object} Color
 * @property {number} r
 * @property {number} g
 * @property {number} b
 * @property {number} a
 */

export default class Drawer {
      
      /**
       * @type {GPUExecutable[]}
       */
      #entities = [];

      /**
       * @type {GPUDevice}
       */
      #device;

      /**
       * @type {GPUCanvasContext}
       */
      #ctx;

      /**
       * @type {[number, number, number,number]}
       */
      #clearColor = [0,0,0,1]

      get clearColor() {
            return {
                  r: this.#clearColor[0],
                  g: this.#clearColor[1],
                  b: this.#clearColor[2],
                  a: this.#clearColor[3],
            };
      }

      set clearColor( value ) {
            this.#clearColor = [
                  value.r,
                  value.g,
                  value.b,
                  value.a
            ];
      }


      /**
       * 
       * @param {GPUDevice} device 
       * @param {GPUCanvasContext} ctx 
       */
      constructor( device, ctx ){
            this.#ctx = ctx;
            this.#device = device;
      }
      /**
       * 
       * @param {GPUExecutable} entity 
       */
      add( entity ){
            this.#entities.push( entity );
      }

      /**
       * 
       * @param {GPUExecutable} entity 
       */
      remove( entity ){
            for( let i = 0; i < this.#entities.length; i++ ){
                  if( this.#entities[i] !== entity )
                        continue;
                  this.#entities.splice( i, 1 );
                  return;
            }
      }

      draw(){
            /**
             * @type {GPURenderPassDescriptor}
             */
            const renderPassDescriptor = {
                  colorAttachments: [
                        {
                              clearValue: this.#clearColor,
                              loadOp: "clear",
                              storeOp: "store",
                              view: this.#ctx.getCurrentTexture().createView(),
                        },
                  ], 
            };
            const commandEncoder = this.#device.createCommandEncoder();
            const pass = commandEncoder.beginRenderPass( renderPassDescriptor );

            for( let i = 0; i < this.#entities.length; i++ ){
                  pass.setPipeline( this.#entities[i].pipeline );

                  if( this.#entities[i].vertexBuffer )
                        pass.setVertexBuffer( 0, this.#entities[i].vertexBuffer );

                  if( this.#entities[i].bindGroups ){
                        for( let j = 0; j < this.#entities[i].bindGroups.length; j++ )
                              pass.setBindGroup( j, this.#entities[i].bindGroups[j] );
                  }
                  pass.setIndexBuffer( this.#entities[i].indexBuffer, this.#entities[i].indexType );
                  pass.drawIndexed( this.#entities[i].vertexCount );
            }

            pass.end();
            this.#device.queue.submit([commandEncoder.finish()]);
      }
}