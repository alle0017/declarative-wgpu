/**@import {GPUApp, Mat4x4, GPUProgram} from '../type.d.ts' */

/**
 * if you extend this class, you _**NEED**_ to call Entity#create inside the constructor, if not, your entity will not be created.
 * @abstract 
 */
export default class Entity {

      static #code = 0;

      /**
       * (grad normalized on 360°):180° = x:π
       * @param {number} grad 
       * @returns {number}
       */
      static #toRad = grad => grad%360 * Math.PI / 180;

      /**
       * @protected
       * @type {string}
       * @readonly
       */
      static fragmentShader = /*wgsl*/`
            @fragment
            fn fs_main( varying_var: Varying ) -> @location(0) vec4f {
                  return varying_var.color;
            }
      `;

      /**
       * @protected
       * @type {string}
       * @readonly
       */
      static vertexShader = /*wgsl*/`
            struct Attribute {
                  @location(0) color: vec4f,
                  @location(1) position: vec3f,
            }

            @group(0) @binding(0) var<uniform> matrix: mat4x4f;
            @group(0) @binding(1) var<uniform> camera: mat4x4f;
             
            struct Varying {
                  @builtin(position) position: vec4f,
                  @location(0) color: vec4f,
            };
            @vertex
            fn vs_main( attr: Attribute ) -> Varying {
                  var varying_var: Varying;

                  varying_var.position = camera * matrix * vec4f( attr.position, 1.0 );
                  varying_var.color = attr.color;

                  return varying_var;
            }
      `;

      /**
       * @protected
       * @readonly
       */
      static fragmentEntry = 'fs_main';

      /**
       * @protected
       * @readonly
       */
      static vertexEntry = 'vs_main';

      

      #translation = {
            x: 0,
            y: 0,
            z: 0,
      };

      #rotation = {
            //rotation around the z-axis
            alpha: {
                  angle: 0,
                  sin: 0,
                  cos: 1,
            },
            //rotation around the y-axis
            beta: {
                  angle: 0,
                  sin: 0,
                  cos: 1,
            },
            //rotation around the x-axis
            gamma: {
                  angle: 0,
                  sin: 0,
                  cos: 1,
            },
      }

      #scale = {
            x: 1,
            y: 1,
            z: 1,
      }

      /**
       * @type {GPUApp}
       */
      #engine;

      /**
       * @type {string}
       * @readonly
       */
      id;

      static get idCode(){
            return this.#code++;
      }

      get idBase(){
            return Object.getPrototypeOf(this).constructor.name;
      };

      get x(){
            return this.#translation.x;
      }
      set x( value ){
            if( value == this.#translation.x  )
                  return;
            this.#translation.x = value;
            this.update( 0, 0, this.getMatrix() );
      }

      
      get y(){
            return this.#translation.y;
      }
      set y( value ){
            if( value == this.#translation.y  )
                  return;
            this.#translation.y = value;
            this.update( 0, 0, this.getMatrix() );
      };

      get z(){
            return this.#translation.z;
      }
      set z( value ){
            if( value == this.#translation.z  )
                  return;
            this.#translation.z = value;
            this.update( 0, 0, this.getMatrix() );
      };

      /**
       * 
       * @param {GPUApp} engine 
       */
      constructor( engine ){
            this.#engine = engine;
            this.id = this.idBase + Entity.idCode;
      }

      /**
       * @protected
       * @param {GPUProgram} program
       */
      create( program ){
            this.#engine.create( this.id, program );
            this.#engine.addToScene( this.id );
            return this;
      }

      /**
       * update uniform at specified binding and group
       * ## USAGE 
       * inside your shader...
       * ```wgsl
       * ＠group(0) ＠binding(0) var<uniform> matrix: mat4x4f;
       * ```
       * ...in js code...
       * ```javascript
       * //change the uniform value to a new value
       * this.update( 0, 0, this.getMatrix() );
       * ```
       * @param {number} group 
       * @param {number} binding 
       * @param {number[] | string} resource 
       */
      update( group, binding, resource ){
            this.#engine.update( this.id, group, binding, resource );
            return this;
      }

      /**
       * return the model matrix, with translation, scale and rotation.
       * ## USAGE
       * override only if your model matrix is different from the current one. 
       * The actual model matrix returns translation, scale and rotation, 
       * represented as a 4 dimensional matrix that operates in 3D space.\
       * material on this topic can be found [here](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html) (is developed in webgl).
       * 
       * @protected
       * @returns {Mat4x4}
       */
      getMatrix(){
            const a = this.#rotation.alpha.cos;
            const b = this.#rotation.alpha.sin;

            const c = this.#rotation.beta.cos;
            const d = this.#rotation.beta.sin;

            const e = this.#rotation.gamma.cos;
            const f = this.#rotation.gamma.sin;

            const { x, y, z } = this.#scale;
            const { x: u, y: v, z: w } = this.#translation;
            
            return [
                  c*x*e,	a*f*y+b*d*y*e,   b*f*z-a*d*z*e,    0,  
                  -c*f*x,     -b*d*f*y+a*y*e,  a*d*f*z+b*z*e,    0,
                  d*x,        -b*c*y,          a*c*z,            0,
                  u,          v,                w,               1,
            ];
      }

      addToScene(){
            this.#engine.addToScene( this.id );
            return this;
      }

      removeFromScene(){
            this.#engine.removeFromScene( this.id );
            return this;
      }

      /**
       * 
       * @param {number} angle 
       */
      rotateAroundXAxis( angle ){
            if( this.#rotation.alpha.angle === angle ){
                  return this;
            }
            const rad = Entity.#toRad( angle );

            this.#rotation.alpha.angle = angle;
            this.#rotation.alpha.cos = Math.cos( rad );
            this.#rotation.alpha.sin = Math.sin( rad );

            this.update( 0, 0, this.getMatrix() );

            return this;
      }

      /**
       * 
       * @param {number} angle 
       */
      rotateAroundYAxis( angle ){
            if( this.#rotation.beta.angle === angle ){
                  return this;
            }
            const rad = Entity.#toRad( angle );

            this.#rotation.beta.angle = angle;
            this.#rotation.beta.cos = Math.cos( rad );
            this.#rotation.beta.sin = Math.sin( rad );

            this.update( 0, 0, this.getMatrix() );

            return this;
      }
      /**
       * 
       * @param {number} angle 
       */
      rotateAroundZAxis( angle ){
            if( this.#rotation.gamma.angle === angle ){
                  return this;
            }
            const rad = Entity.#toRad( angle );

            this.#rotation.gamma.angle = angle;
            this.#rotation.gamma.cos = Math.cos( rad );
            this.#rotation.gamma.sin = Math.sin( rad );

            this.update( 0, 0, this.getMatrix() );

            return this;
      }
}
