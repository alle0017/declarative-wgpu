import { CompareMode, SampleFilter, AddressMode, Type, } from "./enums.js";
import Game from "../game.js";

interface GPUApp {
      /**
       * @ignore
       * primitive used to instantiate new entities that can be rendered on the gpu.
       * ## USAGE
       * ```javascript
      game.create('triangle', {
                  code: `
                              struct Vertex {
                                    ＠location(0) position: vec2f,
                                    ＠location(1) color: vec3f,
                              };
      
                              struct VSOutput {
                                    ＠builtin(position) position: vec4f,
                                    ＠location(0) color: vec4f,
                              };
      
                              ＠vertex fn vs(
                              vert: Vertex,
                              ) -> VSOutput {
                                    var vsOut: VSOutput;
                                    vsOut.position = vec4f(vert.position, 0.0, 1.0);
                                    vsOut.color = vec4f( vert.color, 1.0 );
                                    return vsOut;     
                              }
      
                              ＠fragment fn fs(vsOut: VSOutput) -> ＠location(0) vec4f {
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
       */
      create( id: string, program: GPUCompilableProgram | GPUProgram ): Promise<void> | this;
      addToScene( id: string ): void;
      /**
       * start a loop that draws on the canvas the elements
       * 
       * ## USAGE
       * ```javascript
       * engine.draw();
       * ```
       */
      draw(): void;
      /**
       * stop execution started with loop.
       * ## USAGE
       * ```javascript
       * engine.stop();
       * ```
       */
      stop(): void;
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
       */
      addToScene( id: string ): void;
      removeFromScene( id: string ): void;
      update( id: string, group: number, binding: number, resource: number[] | string, z?: number ): Promise<void> | this;
}

type Mat4x4 = [
      number, number, number, number, 
      number, number, number, number, 
      number, number, number, number,
      number, number, number, number,
];

declare class TypedArray {
      static BYTES_PER_ELEMENT: number;
      BYTES_PER_ELEMENT: number;
      length: number;
      constructor(array: number[] | ArrayBuffer);
}

type GPUTypeFormat =  
"uint8" | 
"uint8x2" | 
"uint8x3" | 
"uint8x4" | 
"sint8" | 
"sint8x2" | 
"sint8x3" | 
"sint8x4" | 
"uint16" | 
"uint16x2" | 
"uint16x3" | 
"uint16x4" | 
"sint16" | 
"sint16x2" | 
"sint16x3" | 
"sint16x4" | 
"float32" | 
"float32x2" | 
"float32x3" | 
"float32x4" | 
"uint32" | 
"uint32x2" | 
"uint32x3" | 
"uint32x4" | 
"sint32" | 
"sint32x2" | 
"sint32x3" | 
"sint32x4";

type Sampler = {
      addressMode: { 
            v?: AddressMode, 
            u?: AddressMode, 
            w?: AddressMode
      },
      compare?: CompareMode,
      lodMinClamp?: number,
      lodMaxClamp?: number,
      maxAnisotropy?: 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16,
      magFilter?: SampleFilter,
      minFilter?: SampleFilter,
      mipmapFilter?: SampleFilter,
}

type Buffer = {
      /**
       * number of elements inside the uniform
       * @example 
       * size(mat4x4f) == 16
       */
      size: number,
      /**
       * type of the number to store inside the buffer
       * you need to use Type enum
       */
      type: Type,

      global?: ({
            id: string,
            byteOffset: number,
      } | {
            isCamera?: boolean,
      })
}
type VertexTransferable = {
      location: number,
      type: Type,
      size: 1 | 2 | 3 | 4,
      values: ArrayBuffer,
}
type VertexBuffer = {
      location: number,
      type: Type,
      size: 1 | 2 | 3 | 4,
      values: number[],
}

type Texture = {
      img: string,
      width: number,
      height: number,
      offsetX?: number,
      offsetY?: number,
      format: GPUTextureFormat,
      dimension: '1d' | '2d' | '3d',
}

type GPUBinding = {
      usage: 'vertex' | 'fragment',
      resource: Buffer | Sampler | Texture,
}
/**
 * @ignore
 */
type UniformDescriptor = {
      size?: number,
      offset?: number,
      type?: Type,

      width?: number,
      height?: number,
      texture?: GPUTexture,

      sampler?: GPUSampler
}
type GPUBindingUniform = number[] | string;

type GPUProgram = {
      code: string,
      topology?: GPUPrimitiveTopology,
      groups: Array<Array<GPUBinding>>,
      cullMode?: GPUCullMode,
      vertexEntryPoint?: string,
      fragmentEntryPoint?: string,
      vertexDescriptor: VertexBuffer[],
      indices: number[],
}

type GPUCompilableProgram = {
      code: string,
      topology?: GPUPrimitiveTopology,
      groups: Array<Array<GPUBinding>>,
      cullMode?: GPUCullMode,
      vertexEntryPoint?: string,
      fragmentEntryPoint?: string,
      vertexDescriptor: VertexTransferable[],
      indices: number[],
}

type GPUExecutable = {
      pipeline: GPURenderPipeline,
      bindGroups: GPUBindGroup[],
      uniforms: UniformDescriptor[][],

      uniformBuffer: GPUBuffer,
      vertexBuffer: GPUBuffer,
      indexBuffer: GPUBuffer,

      vertexCount: number,
      indexType: 'uint16'|'uint32',
      z: number,
      updateBinding(group: number, binding: number, resource: string | number[] ): Promise<void>,
}

type Shape = {
      vertices: number[],
      indices: number[],
}
type TextureShape = {
      textureCoordinates: number[],
      texture: Texture,
      sampler: Sampler,
} & Shape;

type LifecycleFunctions = {
      create?: (( game: Game )=> void) | (( game: Game )=> { [ key: string]: unknown });
      update?: (()=> void) | (( game: Game ) => void );
}

type Color = {
      r: number,
      g: number,
      b: number,
      a: number,
}

type PerspectiveCameraDescriptor = {
      fow: number,
      near: number,
      far: number,
}
type GPUExecutableRefCounter = {
      executable: GPUExecutable,
      count: number,
}

type GPUShaderRef = {
      executable: GPUExecutable, 
      shaderId: string
};

type CameraMovement = {
      roll: number,
      yaw: number,
      pitch: number,
      x: number,
      y: number,
      z: number,
};