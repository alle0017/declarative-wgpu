import Entity from "./entity.js";
import { Type } from "../enums.js";
/**@import {GPUApp, Shape, Color,} from '../type.d.ts' */



export default class BasicEntity3D extends Entity {

      /**
       * 
       * @param {GPUApp} engine 
       * @param {Shape} shape
       * @param {Color | number[]} color
       */
      constructor( engine, shape, color ){
            super( engine );

            const colors = [];

            if( color instanceof Array ){
                  colors.push(...color);
            }else{
                  for( let i = 0; i < shape.vertices.length/3; i++ )
                        colors.push( color.r, color.g, color.b, color.a );
            }
            

            this
            .create({
                  code: BasicEntity3D.vertexShader + BasicEntity3D.fragmentShader,
                  vertexDescriptor: [{
                        location: 1,
                        values: shape.vertices,
                        type: Type.f32,
                        size: 3,
                  }, {
                        location: 0,
                        values: colors,
                        type: Type.f32,
                        size: 4,
                  }],
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
                        }]],
                  indices: shape.indices,
                  cullMode: 'none',
                  vertexEntryPoint: BasicEntity3D.vertexEntry,
                  fragmentEntryPoint: BasicEntity3D.fragmentEntry,
            })
            .update( 0, 0, this.getMatrix() );
      }
}