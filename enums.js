/**@import {TypedArray} from "./type" */
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
 * what face is drawn on screen
 * @enum {GPUCullMode}
 */
export const DrawnSide = Object.freeze({
      both: 'none',
      front: 'back',
      back: 'front',
});

/**
 * @enum {number}
 */

export const Type = Object.freeze({
      u8: 0,
      u16: 1,
      u32: 2,
      i8: 3,
      i16: 4,
      i32: 5,
      f32: 6,
});

/**
 * @enum {typeof TypedArray}
 */
export const TypeConstructor = Object.freeze({
      [Type.u8]: Uint8Array,
      [Type.u16]: Uint16Array,
      [Type.u32]: Uint32Array,

      [Type.i8]: Int8Array,
      [Type.i16]: Int16Array,
      [Type.i32]: Int32Array,

      [Type.f32]: Float32Array,
});

/**
* map that is indexed using TypedArrays. it is used to map each type on the same buffer
* @enum {string}
*/
export const TypeMap = Object.freeze({
      [Type.u8]: 'setUint8',
      [Type.u16]: 'setUint16',
      [Type.u32]: 'setUint32',
      [Type.i8]: 'setInt8',
      [Type.i16]: 'setInt16',
      [Type.i32]: 'setInt32',
      [Type.f32]: 'setFloat32',
});
/**
* @enum {string}
*/
export const TypeFormat = Object.freeze({
      [Type.u8]: 'uint8',
      [Type.u16]: 'uint16',
      [Type.u32]: 'uint32',
      [Type.i8]: 'sint8',
      [Type.i16]: 'sint16',
      [Type.i32]: 'sint32',
      [Type.f32]: 'float32',
});

/**
 * @enum {string}
 */
export const ThreadRenderingMsg = {
      createEntity: 'create-entity',
      addToScene: 'add-to-scene',
      removeFromScene: 'remove-from-scene',
      updateEntity: 'update-entity',
      ready: 'ready',
      canvasPassed: 'canvas-passed',
      draw: 'draw',
      stop: 'stop',
      preload: 'preload',
      createGlobal: 'create-global',
      writeGlobal: 'write-global',
      updateCamera: 'move-camera',
      createCamera: 'create-camera',
}

export const DEFAULT_CAMERA_BUFFER_ID = '__default__cameraBuffer__';