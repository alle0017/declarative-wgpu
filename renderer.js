/**
 * contains information about different roles 
 * of buffers in the rendering process
 * @enum {number}
 */
export const BufferUsage = {
      vertex: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      uniform: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      index: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
};

/**
 * contains information about different address modes to use in sampler creation
 * @enum {string}
 */
export const AddressMode = {
      clampToEdge: 'clamp-to-edge',
      repeat: 'repeat',
      mirror: 'mirror-repeat',
};

/**
 * contains information about different compare modes to use in sampler creation
 * @enum {string}
 */
export const CompareMode = {
      never: 'never',
      always: 'always',
      less: 'less',
      equal: 'equal',
      notEqual: 'not-equal',
      lessEqual: 'less-equal',
      greater: 'greater',
      greaterEqual: 'greater-equal',
};

/**
 * contains information about different filters to use in sampler creation
 * @enum {string}
 */
export const SampleFilter = {
      nearest: 'nearest',
      linear: 'linear',
};

/**
 * @abstract
 */
class TypedArray {
      /**
       * @type {number}
       */
      static BYTES_PER_ELEMENT;
      /**
       * 
       * @param  {number[] | ArrayBuffer} array
       */
      constructor(array){}
}

/**
 * @typedef {"uint8" | "uint8x2" | "uint8x3" | "uint8x4" | "sint8" | "sint8x2" | "sint8x3" | "sint8x4" | "uint16" | "uint16x2" | "uint16x3" | "uint16x4" | "sint16" | "sint16x2" | "sint16x3" | "sint16x4" | "float32" | "float32x2" | "float32x3" | "float32x4" | "uint32" | "uint32x2" | "uint32x3" | "uint32x4" | "sint32" | "sint32x2" | "sint32x3" | "sint32x4"} GPUTypeFormat
 */

/**
 * 
 * @typedef {Object} Sampler
 * 
 * @property {{ v?: AddressMode, u?: AddressMode, w?: AddressMode}} addressMode
 * @property {CompareMode?} compare
 * @property {number?} lodMinClamp
 * @property {number?} lodMaxClamp
 * @property {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16 | null} maxAnisotropy
 * @property {SampleFilter?} magFilter
 * @property {SampleFilter?} minFilter
 * @property {SampleFilter?} mipmapFilter
 */

/**
 * @typedef {Object} Buffer
 * 
 * @property {number} size
 * @property {typeof TypedArray} type
 */

/**
 * @typedef {Object} VertexBuffer
 * 
 * @property {number} location
 * @property {typeof TypedArray} type
 * @property {1|2|3|4} size
 * @property {number[]} values
 */

/**
 * @typedef {Object} Texture
 * 
 * @property {string} img
 * @property {number} width
 * @property {number} height
 * @property {number?} offsetX
 * @property {number?} offsetY
 * @property {GPUTextureFormat} format
 * @property {'1d' | '2d' | '3d'} dimension
 */

/**
 * @typedef {Object} GPUBinding
 * 
 * @property { 'vertex' | 'fragment' } usage
 * @property { Buffer | Sampler | Texture } resource
 */

/**
 * @typedef {Object} UniformDescriptor
 * 
 * @property {number | undefined} size
 * @property {number | undefined} offset
 * @property {typeof TypedArray | undefined} type
 * 
 * @property {number | undefined} width
 * @property {number | undefined} height
 * @property {GPUTexture | undefined} texture
 */

/**
 * @typedef {Object} GPUProgram
 * 
 * @property {string} code 
 * @property {?GPUPrimitiveTopology} topology
 * @property {Array<Array<GPUBinding>>} groups
 * @property {?GPUCullMode} cullMode
 * @property {?string} vertexEntryPoint
 * @property {?string} fragmentEntryPoint
 * @property {VertexBuffer[]} vertexDescriptor
 * @property {number[]} indices
 */

/**
 * parameters used to execute the shader
 * @typedef {Object} GPUUniformBuffer
 * 
 * @property {GPUBuffer} buffer
 */

/**
 * parameters used to execute the shader
 * @typedef {Object} GPUExecutable
 * 
 * @property {GPURenderPipeline} pipeline
 * @property {GPUBindGroup[]} bindGroups
 * @property {UniformDescriptor[][]} uniforms
 * @property {GPUBuffer} uniformBuffer
 * @property {GPUBuffer} vertexBuffer
 * @property {GPUBuffer} indexBuffer
 * @property {number} vertexCount
 * @property {'uint16'|'uint32'} indexType
 * @property {(group: number, binding: number, resource: string | number[])=> Promise<void>} updateBinding
 */


export default class Renderer {

      /**
       * @type {GPUTextureFormat}
       */
      #format;

      /**
      * @type {GPUDevice}
      */
      #device;


      /**
       * check if the binding is a buffer
       * @param {GPUBinding} binding 
       * @returns {boolean}
       */
      static #isTypeOfBuffer = binding => 'type' in binding.resource;
      /**
       * check if the binding is a texture
       * @param {GPUBinding} binding 
       * @returns {boolean}
       */
      static #isTypeOfTexture = binding => 'img' in binding.resource;

      /**
       * returns the size of the buffer
       * @param {GPUBinding} binding 
       * @returns {number}
       */
      static #getBufferSize = binding => binding.resource['type'].BYTES_PER_ELEMENT * binding.resource['size'];

      /** 
       * @param {typeof TypedArray} type
       * @param {1|2|3|4} size
       * @returns {GPUVertexFormat}
       */
      static #typeToFormat = ( type, size )=>{
            /**@type {GPUVertexFormat}*/
            let str;

            switch( type ){
                  case Uint8Array: {
                        if( size == 1 || size == 3 )
                              throw new Error(`[wgpu]: illegal size ${size} for type uint8`);
                        return `uint8x${size}`;
                  }
                  case Uint16Array: {
                        if( size == 1 || size == 3 )
                              throw new Error(`[wgpu]: illegal size ${size} for type uint16`);
                        return `uint16x${size}`;
                  }
                  case Uint32Array: str = 'uint32';
                        break;
                  case Int8Array: {
                        if( size == 1 || size == 3 )
                              throw new Error(`[wgpu]: illegal size ${size} for type sint8`);
                        return `sint8x${size}`;
                  }
                  case Int16Array: {
                        if( size == 1 || size == 3 )
                              throw new Error(`[wgpu]: illegal size ${size} for type sint16`);
                        return `uint16x${size}`;
                  }
                  case Int32Array: str = 'sint32';
                        break;
                  case Float32Array: str = 'float32';
                        break;
                  default: str = 'float32';
                        break;
            }

            if( size == 1 )
                  return str;
            
            return `${str}x${size}`;
      }

      /**
       * 
       * @param {string} url
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @returns {Promise<ImageBitmap>}  
       */
      static #loadImage = async ( url, x, y, width, height ) => {
            const res = await fetch(url);
            const blob = await res.blob();

            return await createImageBitmap(
                  blob,
                  x,y,
                  width, height,
            );
      }

      /**
       * @param {VertexBuffer[]} buffers 
       * @param {number} bytes
       */
      static #chainArrays = ( buffers, bytes )=>{
            const buffer = new ArrayBuffer( bytes );
            const view = new DataView( buffer );
            const len = buffers[0].values.length/buffers[0].size;
            /**
             * map that is indexed using TypedArrays. it is used to map each type on the same buffer
             */
            const typesMap = {
                  [Float32Array.toString()]: 'setFloat32',
                  [Uint8Array.toString()]: 'setUint8',
                  [Uint16Array.toString()]: 'setUint16',
                  [Uint32Array.toString()]: 'setUint32',
                  [Int8Array.toString()]: 'setInt8',
                  [Int16Array.toString()]: 'setInt16',
                  [Int32Array.toString()]: 'setInt32',
            }

            let offset = 0;
            for( let i = 0; i < len; i++ ){
                  for( let j = 0; j < buffers.length; j++ ){
                        for( let k = 0; k < buffers[j].size; k++ ){
                              view[ typesMap[buffers[j].type.toString()] ]( offset, buffers[j].values[ k + i * buffers[j].size ], true  );
                              offset += buffers[j].type.BYTES_PER_ELEMENT;
                        }
                  }
            }

            return buffer;
      }
 
      /**
       * @param {GPUDevice} device
       * @param {GPUTextureFormat} format
       */
      constructor( device, format ){
            this.#device = device;
            this.#format = format;
      }     

      /**
       * 
       * @param {Array<Array<GPUBinding>>} groups 
       * @returns {GPUBindGroupLayout[]}
       */
      #createGroupLayout( groups ){
            const bindGroupLayouts = [];

            for( let i = 0; i < groups.length; i++ ){
                  const entries = [];
                  for( let j = 0; j < groups[i].length; j++ ){
                        const descriptor = {
                              binding: j,
                              visibility: groups[i][j].usage == 'fragment'? 
                                    GPUShaderStage.FRAGMENT: 
                                    GPUShaderStage.VERTEX,
                        };

                        if( Renderer.#isTypeOfBuffer( groups[i][j] )  ){
                              descriptor.buffer = {}
                        }else if( Renderer.#isTypeOfTexture( groups[i][j] ) ){
                              descriptor.texture = {};
                        }else{
                              descriptor.sampler = {};
                        }
                        entries.push(descriptor);
                  }

                  bindGroupLayouts.push(this.#device.createBindGroupLayout({ entries }));
            }

            return bindGroupLayouts;
      }

      /**
       *  
       * @param {Array<Array<GPUBinding>>} groups
       * @return {GPUBuffer | undefined}
       */
      #createUniformBuffer( groups ){

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            if( groups.length <= 0 ){
                  return;
            }

            let size = 0;

            for( let i = 0; i < groups.length; i++ ){
                  for( let j = 0; j < groups[i].length; j++ ){
                        size += Renderer.#isTypeOfBuffer( groups[i][j] )? 
                              Renderer.#getBufferSize( groups[i][j] ): 
                              0;
                  }
            }

            const buffer = this.#device.createBuffer({
                  usage: BufferUsage.uniform,
                  size,
            });

            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });

            return buffer;
      }
      /**
       *  
       * @param {number[]} indices
       * @param {number} size
       * @return { { buffer: GPUBuffer, vertexCount: number, type: 'uint16' | 'uint32' } } 
       */
      #createIndexBuffer( indices, size ){

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            
            const MAX_U16 = 65535;
            /**
             * @type { typeof Uint16Array | typeof Uint32Array}
             */
            let constructor = Uint16Array;
            /**
             * @type {'uint16' | 'uint32'}
             */
            let type = 'uint16';

            if( indices.length <= 0 ){
                  console.warn('[wgpu] no indices found.')

                  for( let i = 0; i < size; i++ ){
                        indices.push( i );
                  }
            }

            if( size > MAX_U16 ){
                  constructor = Uint32Array;
                  type = 'uint32';
            }


            const buffer = this.#device.createBuffer({
                  usage: BufferUsage.index,
                  size: indices.length * constructor.BYTES_PER_ELEMENT,
                  mappedAtCreation: true,
                  label: 'index buffer'
            });

            const range = new constructor( buffer.getMappedRange() );

            range.set( indices );

            buffer.unmap();

            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });

            return { 
                  buffer, 
                  vertexCount: indices.length,
                  type,
            };
      }
      /**
       * @param {VertexBuffer[]} vertexDescriptor
       * @returns {{ buffer: GPUBuffer, attributes: GPUVertexAttribute[], stride: number, size: number }}
       */
      #createVertexBuffer( vertexDescriptor ){

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            if( !vertexDescriptor.length ){
                  return {
                        buffer: null,
                        attributes: [],
                        stride: 0,
                        size: 0,
                  };
            }

            /**
             * @type {GPUVertexAttribute[]}
             */
            const attributes = [];
            const len = vertexDescriptor[0].values.length/vertexDescriptor[0].size;

            let stride = 0;
            let size = 0;
            

            for( let i = 0; i < vertexDescriptor.length; i++ ){

                  const descriptor = vertexDescriptor[i];

                  if( descriptor.values.length/descriptor.size !== len )
                        throw new Error(`[wgpu] array size mismatch: ${descriptor.values}. Actual length of this array must be ${len*descriptor.size}`);

                  attributes.push({
                        shaderLocation: descriptor.location,
                        offset: stride,
                        format: Renderer.#typeToFormat( descriptor.type, descriptor.size ),
                  });

                  stride += descriptor.size * descriptor.type.BYTES_PER_ELEMENT;
            }

            size = stride * len;

            const buffer = this.#device.createBuffer({
                  usage: BufferUsage.vertex,
                  size,
                  label: 'vertex buffer',
            });
            this.#device.queue.writeBuffer( buffer, 0, Renderer.#chainArrays( vertexDescriptor, size ) );
            
            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });
            return { buffer, attributes, stride, size: len };
      }

      /**
       * 
       * @param {GPUBinding[][]} groups 
       * @param {GPUBindGroupLayout[]} bindGroupLayouts 
       * @param {GPUBuffer} buffer 
       */
      async #createBindGroup( groups, bindGroupLayouts, buffer ){
            if( !groups.length ){
                  return {
                        bindGroups: [],
                        uniforms: [],
                  };
            }
            const bindGroups = [];
            /**
             * @type {UniformDescriptor[][]}
             */
            const uniforms = [];

            let offset = 0;

            for( let i = 0; i < groups.length; i++ ){
                  /**@type {Object[]} */
                  const entries = [];

                  for( let j = 0; j < groups[i].length; j++ ){
                        const entry = {};
                        uniforms.push( [] );

                        if( Renderer.#isTypeOfBuffer( groups[i][j] ) ){
                              const size = Renderer.#getBufferSize( groups[i][j] );

                              entry.resource = {};
                              entry.resource.buffer = buffer;
                              entry.resource.size = size;
                              entry.resource.offset = offset;

                              uniforms[i].push({
                                    offset,
                                    size,
                                    type: groups[i][j].resource['type'],
                                    width: undefined,
                                    height: undefined,
                                    texture: undefined,
                              });

                              offset += size;
                        }else if( Renderer.#isTypeOfTexture( groups[i][j] ) ){ 
                              const source = await Renderer.#loadImage( 
                                    groups[i][j].resource['img'], 
                                    groups[i][j].resource['offsetX'] || 0,
                                    groups[i][j].resource['offsetY'] || 0, 
                                    groups[i][j].resource['width'], 
                                    groups[i][j].resource['height'],
                              );
                              const width = groups[i][j].resource['width'] - (groups[i][j].resource['offsetX'] || 0);
                              const height = groups[i][j].resource['height'] - (groups[i][j].resource['offsetY'] || 0);

            
                              entry.resource = this.#device.createTexture({
                                    dimension: groups[i][j].resource['dimension'] || '2d',
                                    format: groups[i][j].resource['format'],
                                    size: [ width, height, 1 ],
                                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
                              });

                              this.#device.queue.copyExternalImageToTexture(
                                    { source },
                                    { texture: entry.resource },
                                    [ width, height ]
                              );

                              uniforms[i].push({
                                    width,
                                    height,
                                    texture: entry.resource,
                                    size: undefined,
                                    offset: undefined,
                                    type: undefined,
                              });
                        }else{
                              entry.resource = this.#device.createSampler({
                                    addressModeU: groups[i][j].resource['addressMode'].u || 'clamp-to-edge',
                                    addressModeV: groups[i][j].resource['addressMode'].v || 'clamp-to-edge',
                                    addressModeW: groups[i][j].resource['addressMode'].w || 'clamp-to-edge',
                                    
                                    compare: groups[i][j].resource['compare'] || undefined,
                                    lodMaxClamp: groups[i][j].resource['lodMaxClamp'] || 32,
                                    lodMinClamp: groups[i][j].resource['lodMinClamp'] || 0,
                                    maxAnisotropy: groups[i][j].resource['maxAnisotropy'] || 1,
                                    magFilter: groups[i][j].resource['magFilter'] || 'nearest',
                                    minFilter: groups[i][j].resource['minFilter'] || 'nearest',
                                    mipmapFilter: groups[i][j].resource['mipmapFilter'] || 'nearest',
                              });

                              uniforms[i].push({
                                    width: undefined,
                                    height: undefined,
                                    size: undefined,
                                    offset: undefined,
                                    type: undefined,
                                    texture: undefined,
                              });
                        }

                        entries.push(entry);
                        
                  }

                  bindGroups.push( 
                        this.#device.createBindGroup({
                              layout: bindGroupLayouts[i],
                              entries,
                        })
                  );
            }

            return {
                  bindGroups,
                  uniforms,
            }
      }

      /**
       * 
       * @param {GPUProgram} program 
       * @returns {Promise<GPUExecutable>}
       */
      async createProgram( program ){

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            const __device__ = this.#device;
            const bindGroupLayouts = this.#createGroupLayout( program.groups );
            const uniformBuffer = this.#createUniformBuffer( program.groups );
            const { buffer: vertexBuffer, attributes, stride, size } = this.#createVertexBuffer( program.vertexDescriptor );
            const { bindGroups, uniforms } = await this.#createBindGroup( program.groups, bindGroupLayouts, uniformBuffer );
            const { buffer: indexBuffer, vertexCount, type: indexType } = this.#createIndexBuffer( program.indices, size );
            const module = this.#device.createShaderModule({
                  code: program.code,
            });

            const pipeline = this.#device.createRenderPipeline({
                  layout: this.#device.createPipelineLayout({
                        bindGroupLayouts,
                  }),
                  primitive: {
                        cullMode: program.cullMode || 'back',
                        topology: program.topology || 'triangle-list',
                  },
                  vertex: {
                        entryPoint: program.vertexEntryPoint || 'vertex_main',
                        module,    
                        buffers: [{
                              arrayStride: stride,
                              attributes,
                        }],
                  },
                  fragment: {
                        module,
                        entryPoint: program.fragmentEntryPoint || 'fragment_main',
                        targets: [ { format: this.#format }],
                        
                  },
            });
            
            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });

            return {
                  indexType,
                  vertexCount,
                  indexBuffer,
                  pipeline,
                  bindGroups,
                  uniforms,
                  uniformBuffer,
                  vertexBuffer,
                  /**
                   * update the binding at the specified group
                   * 
                   * in wgsl:
                   * ```wgsl
                   * \@group(0) \@binding(0) var<uniform> uniform_vec: vec4f;
                   * ```
                   * \
                   * corresponding js code:
                   * ```javascript
                   * myEntity.updateBinding(0,0, [1,1,0,1]);
                   * ```
                   * @param {number} group 
                   * @param {number} binding 
                   * @param {string | number[] } resource
                   */
                  async updateBinding( group, binding, resource ) {
                        if( typeof resource == 'string' && 'width' in uniforms[ group ][ binding ] ){
                              const source = await Renderer.#loadImage( 
                                    resource, 
                                    0, 0, 
                                    uniforms[ group ][ binding ]['width'], 
                                    uniforms[ group ][ binding ]['height'] 
                              );

                              __device__.queue.copyExternalImageToTexture(
                                    { source },
                                    { texture: uniforms[ group ][ binding ]['texture'] },
                                    [ 
                                          uniforms[ group ][ binding ]['width'], 
                                          uniforms[ group ][ binding ]['height']  
                                    ]
                              );
                        }else if( 'type' in uniforms[ group ][ binding ] && resource instanceof Array ){  
                              const array = new uniforms[ group ][ binding ]['type']( resource );   

                              __device__.queue.writeBuffer(
                                    uniformBuffer,
                                    uniforms[ group ][ binding ]['offset'],
                                    array,
                              );
                        }
                  }
            }
      }
}