import Entity from "./entity.js";
import { Type } from "../enums.js";
/**@import {GPUApp,TextureShape,} from "../type.d.ts" */

export default class TexturedEntity extends Entity {
      /**
       * @readonly
       * @override
       * @protected
       */
      static vertexShader = /*wgsl*/`

            struct Attributes {
                  @location(0) position: vec3f,
                  @location(1) text_coords: vec2f,
            }

            struct VOut {
                  @builtin(position) position: vec4f,
                  @location(0) text_coords: vec2f,
            }

            @group(0) @binding(0) var<uniform> matrix: mat4x4f;
            @group(0) @binding(1) var<uniform> camera: mat4x4f;
            @group(0) @binding(2) var samp: sampler;
            @group(0) @binding(3) var texture: texture_2d<f32>;

            @vertex
            fn vs_main( attr: Attributes ) -> VOut {
                  var out: VOut;

                  out.position = camera * matrix * vec4f( attr.position, 1.0 );
                  out.text_coords = attr.text_coords;

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
                  return textureSample( texture, samp, in.text_coords );
            }
      `;

      /**
       * 
       * @param {GPUApp} engine 
        * @param {TextureShape} shape
       */
      constructor( engine, shape ) {
            super( engine );

            this
            .create({
                  code: TexturedEntity.vertexShader + TexturedEntity.fragmentShader,
                  vertexDescriptor: [{
                        location: 0,
                        values: shape.vertices,
                        type: Type.f32,
                        size: 3,
                  },{
                        location: 1,
                        values: shape.textureCoordinates,
                        type: Type.f32,
                        size: 2,
                  },],
                  groups: [[{
                              //@group(0) @binding(0)
                              usage: "vertex",
                              resource: {
                                    size: 16,
                                    type: Type.f32,
                              }
                        },{
                              //@group(0) @binding(1)
                              usage: "vertex",
                              resource: {
                                    size: 16,
                                    type: Type.f32,
                                    global: {
                                          isCamera: true,
                                    }
                              }
                        },{
                              //@group(0) @binding(2)
                              usage: "fragment",
                              //@ts-ignore
                              resource: shape.sampler,
                        },{
                              //@group(0) @binding(3)
                              usage: "fragment",
                              resource: shape.texture,
                        }]],
                  indices: shape.indices,
                  cullMode: 'none',
                  vertexEntryPoint: TexturedEntity.vertexEntry,
                  fragmentEntryPoint: TexturedEntity.fragmentEntry,
            });
            this.update( 0, 0, this.getMatrix() );
      }
}