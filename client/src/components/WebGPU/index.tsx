import React, { useEffect, useRef, useState } from "react";
import './style.css';
import { VolumeInfo } from "../../pages/app";

interface WebGPURendererProps {
    volumeInfo: VolumeInfo;
}

const fail = (msg: string) => {
    console.error(msg);
    // You could also set an error state here
};

export const WebGPURenderer: React.FC<WebGPURendererProps> = ({volumeInfo}) => {
    // Canvas is a HTML element that you can use to draw
    // WebGPU, WebGL, etc, in a window
    // UseRef is React’s way of giving you direct access to a DOM element
    // Tells react to give us a reference to our canvas I can use later
    // Which is null at first
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // run webgpu setup once component is mounted
    useEffect(() => {
        // main entry
        const initWebgpu = async () => {
            // if canvas element doesn't exist exit
            if (!canvasRef) return;

            const canvas = canvasRef.current;
            if (!canvas) {
                fail('Failed to get WebGPU canvas');
                return;
            }

            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;
            
            // Check if the canvas's internal size is different
            if (canvas.width  !== displayWidth ||
                canvas.height !== displayHeight) {
                // Make the canvas's internal size match its display size
                canvas.width  = displayWidth;
                canvas.height = displayHeight;
            }
            
            // request adapater then request device from adapter
            // adapter is essentially the gpu
            // the we request the device again
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                fail('Failed to get WebGPU adapter');
                return;
            }

            const device = await adapter.requestDevice();
            if (!device) {
                fail('need a browser that supports WebGPU');
                return;
            }

            // Connects webgpu to windowing system
            // similar to the surface in vulkan
            const context = canvas.getContext('webgpu');
            if (!context) {
                fail('Failed to get WebGPU context');
                return;
            }
            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            // configures the "surface" by setting up a "swap chain" image
            // sort of, and we're setting desired texel format
            context.configure({
                device,
                format: presentationFormat
            });

            // shader modules
            // @vertex is the tag that tells webgpu this funciton is the
            // vertex shader portion
            // fn means function
            // vs is the function name
            // vertexIndex is the name of the argument
            // : u32 is the argument type
            // @builtin tells us this value is being filled by the default
            // vertex_index (same as gl_Vertex)
            // -> @builtin(position) return
            const module = device.createShaderModule({
                label: 'Hard coded red triangle shaders',
                code: /* wgsl */ `
                @vertex fn vs(
                    @builtin(vertex_index) vertexIndex : u32
                ) -> @builtin(position) vec4f {
                    let pos = array(
                    vec2f( 0.0,  0.5),  // top center
                    vec2f(-0.5, -0.5),  // bottom left
                    vec2f( 0.5, -0.5)   // bottom right
                    );
            
                    return vec4f(pos[vertexIndex], 0.0, 1.0);
                }
            
                @fragment fn fs() -> @location(0) vec4f {
                    return vec4f(1.0, 0.0, 0.0, 1.0);
                }
                `,
            });

            const pipeline = device.createRenderPipeline({
                label: 'hardcoded red triangle pipeline',
                layout: 'auto',
                vertex: {
                    entryPoint: 'vs',
                    module
                },
                fragment: {
                    entryPoint: 'fs',
                    module,
                    targets:[{ format: presentationFormat }]
                },
            });

            const render = () => {
                const colorAttachment: GPURenderPassColorAttachment = {
                    // Get the current texture from the canvas context and
                    // set it as the texture to render to.
                    // image view in vulkan
                    view: context.getCurrentTexture().createView(), 
                    clearValue: [0,0,0, 1],
                    // 0.1098, 0.1216, 0.1490
                    loadOp: 'clear',
                    storeOp: 'store',
                };

                const renderPassDescriptor: GPURenderPassDescriptor = {
                    label: 'our basic canvas renderPass',
                    colorAttachments: [colorAttachment],
                };

                // create command encoder
                // to start encoding commands
                const encoder = device.createCommandEncoder({ label: 'our encoder' });

                // make a renderpass encoder to start rendering
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setPipeline(pipeline);
                pass.draw(3);
                pass.end();

                const commandBuffer = encoder.finish();
                device.queue.submit([commandBuffer]);
            }

            render();
        }

        initWebgpu();
    }, []);

    return(
    <div className="renderer">
        <canvas ref={canvasRef}></canvas>
    </div>
    )
}