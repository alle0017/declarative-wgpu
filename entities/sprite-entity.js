import Entity from "./entity.js";
import { Type } from "../enums.js";
/**@import {GPUApp,TextureShape,} from "../type.d.ts" */

export default class SpriteEntity extends Entity {

      #offset = new Float32Array([0.5,0.5]);

      /**
       * @readonly
       * @override
       * @protected
       */
      static vertexShader = /*wgsl*/`
            struct VOut {
                  @builtin(position) position: vec4f,
                  @location(0) text_coords: vec2f,
                  @location(1) offset: vec2f,
            }
            
            @group(0) @binding(0) var<uniform> matrix: mat4x4f;
            @group(0) @binding(1) var<uniform> camera: mat4x4f;
            @group(0) @binding(2) var samp: sampler;
            @group(0) @binding(3) var texture: texture_2d<f32>;
            
            @vertex
            fn vs_main( @builtin(vertex_index) vertexIndex : u32 ) -> VOut {
                  var out: VOut;
                  var position = array<vec4f,4>(
                        vec4f( 0, 0, 0, 1 ),
                        vec4f( 1, 0, 0, 1 ),
                        vec4f( 0, 1, 0, 1 ),
                        vec4f( 1, 1, 0, 1 )
                  );          
                  var text_coords = array<vec2f,4>(
                        vec2f( 0, 0 ),
                        vec2f( 1, 0 ),
                        vec2f( 0, 1 ),
                        vec2f( 1, 1 )
                  );          
                  var trans_mat = mat4x4f(matrix);
                  trans_mat[0][3] = 0;
                  trans_mat[1][3] = 0;
                  out.offset = vec2f( matrix[0][3], matrix[1][3] );
                  out.position = camera * trans_mat * position[vertexIndex];
                  out.text_coords = text_coords[vertexIndex];
      
            
                  return out;
            }
      `

      /**
       * @readonly
       * @override
       * @protected
       */
      static fragmentShader = /*wgsl*/`
            @fragment
            fn fs_main( in: VOut )-> @location(0) vec4f {
                  return textureSample( texture, samp, in.text_coords + in.offset );
            }
      `;

      /**
       * 
       * @param {GPUApp} engine 
       * @param {string} img 
       * @param {number} width
       * @param {number} height
       */
      constructor( engine, img, width, height ) {
            super( engine );

            this
            .create({
                  code: SpriteEntity.vertexShader + SpriteEntity.fragmentShader,
                  vertexDescriptor: [],
                  groups: [[
                        {
                              //@group(0) @binding(0)
                              usage: "vertex",
                              resource: {
                                    size: 16,
                                    type: Type.f32,
                              }
                        },
                        {
                              //@group(0) @binding(1)
                              usage: "vertex",
                              resource: {
                                    size: 16,
                                    type: Type.f32,
                                    global: {
                                          isCamera: true,
                                    }
                              }
                        },
                        {
                              //@group(0) @binding(2)
                              usage: "fragment",
                              //@ts-ignore
                              resource: { addressMode: {} },
                        },
                        {
                              //@group(0) @binding(3)
                              usage: "fragment",
                              resource: {
                                    //@ts-ignore
                                    img,
                                    width,
                                    height,
                                    format: 'rgba8unorm',
                                    dimension: '2d',
                              },
                        }]],
                  indices: [ 
                        0, 1, 2, 
                        2, 1, 3,
                  ],
                  cullMode: 'none',
                  vertexEntryPoint: SpriteEntity.vertexEntry,
                  fragmentEntryPoint: SpriteEntity.fragmentEntry,
            });
            this.update( 0, 0, this.getMatrix() );
      }

      /**
       * @override
       */
      getMatrix(){
            const matrix = super.getMatrix();

            matrix[3] = this.#offset[0];
            matrix[7] = this.#offset[1];
            return matrix;
      }
}