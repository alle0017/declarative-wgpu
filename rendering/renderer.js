import { BufferUsage, TypeConstructor, TypeMap, TypeFormat, Type, DEFAULT_CAMERA_BUFFER_ID, } from "../enums.js";
/**@import { GPUBinding, GPUProgram, GPUExecutable, UniformDescriptor, VertexBuffer, VertexTransferable, TypedArray, GPUCompilableProgram } from "../type.d.ts" */

export default class Renderer {

      /**
       * @type {Map<string,GPUBuffer>}
       */
      #globalBuffers = new Map();

      /**
       * @type {GPUTextureFormat}
       */
      #format;

      /**
      * @type {GPUDevice}
      */
      #device;

      /**
       * @type {number}
       */
      #z = 0;

      get defaultZ(){
            return this.#z++;
      }


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
      static #getBufferSize = binding =>  TypeConstructor[binding.resource['type']].BYTES_PER_ELEMENT * binding.resource['size'];

      /**
       * returns the size of the buffer
       * @param {GPUBinding} binding 
       * @returns {number}
       */
      static #getBufferLocalSize = binding => !binding.resource['global'] || !binding.resource['global'].id? this.#getBufferSize( binding ): 0;

      /**
       * @param {Type} type
       * @param {1|2|3|4} size
       * @returns {GPUVertexFormat}
       */
      static #typeToFormat = ( type, size )=>{
            /**
             * it can be also uint8x2 uint8x4 sint8x2 sint8x4 uint16x4 sint16x4
             * @type { 'sint32' | 'uint32' | 'float32' }
             */
            const format = TypeFormat[type]

            if( ( size === 1 || size === 3 ) && ( type === Type.u8 || type === Type.u16 || type === Type.i8 || type === Type.i16 ) )
                  throw new TypeError(`[wgpu]: illegal size ${size} for type ${TypeFormat[type]}`);
            else if( size === 1 )
                  return TypeFormat[type];
            return `${format}x${size}`;
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
       * @param {VertexTransferable[]} buffers 
       * @param {number} bytes
       */
      static #chainArrays = ( buffers, bytes )=>{
            const buffer = new ArrayBuffer( bytes );
            const view = new DataView( buffer );
            /**
             * @type {TypedArray[]}
             */
            const arrays = [];
            const len = (buffers[0].values.byteLength / TypeConstructor[buffers[0].type].BYTES_PER_ELEMENT)/buffers[0].size;
            

            let offset = 0;
            for( let i = 0; i < len; i++ ){
                  for( let j = 0; j < buffers.length; j++ ){
                        //create the array view if it doesn't exists
                        if( arrays.length <= j ){
                              arrays.push( new TypeConstructor[buffers[j].type](buffers[j].values) );
                        }
                        //chain the arrays
                        for( let k = 0; k < buffers[j].size; k++ ){
                              view[ TypeMap[buffers[j].type] ]( offset, arrays[j][ k + i * buffers[j].size ], true  );
                              offset += arrays[j].BYTES_PER_ELEMENT;
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
                              Renderer.#getBufferLocalSize( groups[i][j] ): 
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
       * @param {VertexTransferable[]} vertexDescriptor
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
            const len = (vertexDescriptor[0].values.byteLength / TypeConstructor[vertexDescriptor[0].type].BYTES_PER_ELEMENT)/vertexDescriptor[0].size;

            let stride = 0;
            let size = 0;
            

            for( let i = 0; i < vertexDescriptor.length; i++ ){

                  const descriptor = vertexDescriptor[i];

                  if( (descriptor.values.byteLength / TypeConstructor[descriptor.type].BYTES_PER_ELEMENT)/descriptor.size !== len )
                        throw new RangeError(`[wgpu] array size mismatch: ${descriptor.values}. Actual length of this array must be ${len*descriptor.size}`);

                  attributes.push({
                        shaderLocation: descriptor.location,
                        offset: stride,
                        format: Renderer.#typeToFormat( descriptor.type, descriptor.size ),
                  });

                  stride += descriptor.size * TypeConstructor[descriptor.type].BYTES_PER_ELEMENT;
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
                        entry.binding = j;

                        if( Renderer.#isTypeOfBuffer( groups[i][j] ) ){
                              const size = Renderer.#getBufferSize( groups[i][j] );

                              entry.resource = {};
                              entry.resource.size = size;

                              if( groups[i][j].resource['global'] && groups[i][j].resource['global'].isCamera ){
                                    entry.resource.buffer = this.#globalBuffers.get( DEFAULT_CAMERA_BUFFER_ID );
                                    entry.resource.offset = 0;
                              }else if( groups[i][j].resource['global'] ){
                                    entry.resource.buffer = this.#globalBuffers.get( groups[i][j].resource['global'].id );
                                    entry.resource.offset = groups[i][j].resource['global'].byteOffset; 
                              }else{

                                    entry.resource.buffer = buffer;
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
                              }
                              
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
                              label: 'group'+i,
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
       * @param {GPUCompilableProgram} program 
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
                  depthStencil: {
                        depthWriteEnabled: true,
                        depthCompare: 'less',
                        format: 'depth24plus',
                  },
            });

            
            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });

            return { 
                  // z index of the entity
                  z: this.defaultZ,
                  //i32 or i16
                  indexType,
                  //number of vertices
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
                  async updateBinding( group, binding, resource ){

                        __device__.pushErrorScope('out-of-memory');
                        __device__.pushErrorScope('validation');
                        __device__.pushErrorScope('internal');

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

                              const array = new TypeConstructor[uniforms[ group ][ binding ]['type']]( resource );   

                              __device__.queue.writeBuffer(
                                    uniformBuffer,
                                    uniforms[ group ][ binding ]['offset'],
                                    array,
                              );
                        }
                        __device__.popErrorScope().then( error => {
                              error && console.error( error );
                        });
                  }
            };
      }
      /**
       * 
       * @param {GPUCompilableProgram} program 
       * @param {GPUExecutable} executable 
       * @returns {Promise<GPUExecutable>}
       */
      async cloneProgram( program, executable ){

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            const __device__ = this.#device;
            const bindGroupLayouts = this.#createGroupLayout( program.groups );
            const uniformBuffer = this.#createUniformBuffer( program.groups );
            const { bindGroups, uniforms } = await this.#createBindGroup( program.groups, bindGroupLayouts, uniformBuffer );

            
            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });

            return { 
                  ...executable,
                  // z index of the entity
                  z: this.defaultZ,
                  bindGroups,
                  uniforms,
                  uniformBuffer,
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
                  async updateBinding( group, binding, resource ){
                        __device__.pushErrorScope('out-of-memory');
                        __device__.pushErrorScope('validation');
                        __device__.pushErrorScope('internal');

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

                              const array = new TypeConstructor[uniforms[ group ][ binding ]['type']]( resource );   

                              __device__.queue.writeBuffer(
                                    uniformBuffer,
                                    uniforms[ group ][ binding ]['offset'],
                                    array,
                              );
                        }
                        __device__.popErrorScope().then( error => {
                              error && console.error( error );
                        });
                  }
            };
      }
      /**
       * 
       * @param {string} bufferId 
       * @param {Type | null} type - if null, the size is considered in bytes, to store multiple values inside the buffer
       * @param {number} size 
       */
      async createGlobalBuffer( bufferId, type, size ){

            if( this.#globalBuffers.has( bufferId ) ){
                  throw new ReferenceError(`[wgpu] global buffer with id ${bufferId} already exists.`);
            }

            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            const buffer = this.#device.createBuffer({
                  label: bufferId,
                  size: typeof type == 'number'? 
                        size * TypeConstructor[type].BYTES_PER_ELEMENT: 
                        size,
                  usage: BufferUsage.uniform,
            });
            
            this.#globalBuffers.set( bufferId, buffer );

            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });
      }

      /**
       * 
       * @param {string} bufferId 
       * @param {number} byteOffset 
       * @param {Type} type 
       * @param {ArrayBuffer} values 
       */
      async writeGlobalBuffer( bufferId, byteOffset, type, values ){
            if( !this.#globalBuffers.has( bufferId ) ){
                  throw new ReferenceError(`[wgpu] global buffer with id ${bufferId} doesn't exists.`);
            }
            
            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            this.#device.queue.writeBuffer( 
                  this.#globalBuffers.get( bufferId ),
                  byteOffset,
                  new TypeConstructor[type]( values ),
            );

            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });
      }

      hasDefaultCamera(){
            return this.#globalBuffers.has( DEFAULT_CAMERA_BUFFER_ID );
      }
}