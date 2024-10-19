import { SlaveThread } from "../utils/thread.js";
import GPUEngine from "./rendering/gpu-engine.js";
import { ThreadRenderingMsg as Msg } from "./enums.js";



SlaveThread.onMessage( Msg.canvasPassed, async ev => {
      if( !('canvas' in ev) || !(ev.canvas instanceof OffscreenCanvas) )
            return;
      const engine = await GPUEngine.create( ev.canvas );

      SlaveThread.onMessage( Msg.createEntity, e =>{
            engine.create( e.id, e.program );
      });

      SlaveThread.onMessage( Msg.addToScene, e =>{
            engine.addToScene( e.id )
      });

      SlaveThread.onMessage( Msg.removeFromScene, e =>{
            engine.removeFromScene( e.id );
      });

      SlaveThread.onMessage( Msg.updateEntity, e =>{
            engine.update(
                  e.id,
                  e.group,
                  e.binding,
                  e.resource,
                  e.z
            );
      });

      SlaveThread.onMessage( Msg.draw, e =>{
            engine.draw();
      });

      SlaveThread.onMessage( Msg.stop, e =>{
            engine.stop();
      });

      SlaveThread.sendMessage( Msg.ready, {} );

      SlaveThread.onMessage( Msg.createGlobal, e => {
            engine.createGlobalBuffer( e.bufferId, e.type, e.size );
      });
      SlaveThread.onMessage( Msg.writeGlobal, e => {
            engine.writeGlobalBuffer( e.bufferId, e.byteOffset, e.type, e.values );
      });
      SlaveThread.onMessage( Msg.createCamera, e => {
            engine.createCamera( 
                  e.sceneId,
                  e.cameraId,
                  e.values
            );
      });
      SlaveThread.onMessage( Msg.updateCamera, e => {
            engine.updateCamera( 
                  e.sceneId,
                  e.cameraId,
                  e.values
            );
      });
});
SlaveThread.sendMessage( Msg.ready, {} );

