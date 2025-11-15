import React, { useEffect, useRef, useState } from "react";
import './style.css';

import { mat4, vec3 } from 'wgpu-matrix';

import {
  cubeVertexArray,
  cubeVertexSize,
  cubeUVOffset,
  cubePositionOffset,
  cubeVertexCount,
} from '../../assets/Meshes/cube';

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

            // canvas is like your window
            const canvas = canvasRef.current;
            if (!canvas) {
                fail('Failed to get WebGPU canvas');
                return;
            }

            // 'volumeInfo.volumeData' is the Int16Array of HU values
            // these values are signed (not 0 - 25535) but -32768 - 32767
            // we need to normalize these values so we can apply linear filtering
            // and we will convert them to unsigned so we can get them from 0 -1 
            // so we can index our transfer function properly and so the gpu can read it
            const huData = volumeInfo.volumeData; 

            // clamped range
            const huMin = -1024.0;
            const huMax = 2000.0;
            const huRange = huMax - huMin;

            // Create a new Float32Array to hold the converted values
            const normalizedData = new Uint16Array(huData.length);
    
            // Loop through and convert each Int16 value to a Float32 value
            for (let i = 0; i < huData.length; i++) {
                normalizedData[i] = huData[i]; 
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

            // logical device
            const device = await adapter.requestDevice();
            if (!device) {
                fail('need a browser that supports WebGPU');
                return;
            }

            // Connects webgpu to windowing system
            // similar to the surface in vulkan
            // also acts as the swapchain?
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

            // create vertex buffer for my 3D cube
            const vertexBuffer = device.createBuffer({
                size: cubeVertexArray.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });
            // map to my vertex buffer and copy data over
            new Float32Array(vertexBuffer.getMappedRange()).set(cubeVertexArray);
            vertexBuffer.unmap();

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
                struct Uniforms {
                    modelViewProjectionMatrix : mat4x4f,
                }

                struct VertexOutput {
                    @builtin(position) Position : vec4f,
                    @location(0) fragUV : vec2f,
                    @location(1) fragPosition: vec4f,
                }

                @group(0) @binding(0) var<uniform> uniforms : Uniforms;
                @group(0) @binding(1) var mySampler : sampler;
                @group(0) @binding(2) var myVolume : texture_3d<f16>;

                @vertex fn vs(
                    @location(0) position : vec4f,
                    @location(1) uv : vec2f
                ) -> VertexOutput {
                    var output : VertexOutput;
                    output.Position = uniforms.modelViewProjectionMatrix * position;
                    output.fragUV = uv;
                    output.fragPosition = 0.5 * (position + vec4f(1.0, 1.0, 1.0, 1.0));
                    return output;
                }

                @fragment fn fs(
                    @location(0) fragUV: vec2f,
                    @location(1) fragPosition: vec4f
                ) -> @location(0) vec4f {
                    let uvw = fragPosition.xyz;
                    let hu = textureSampleLevel(myVolume, mySampler, uvw, 0.0).r;
                    let val = (hu + 1000.0) / 2000.0;

                    return vec4<f32>(vec3<f32>(val), 1.0);
                }

                `,
            });

            // Manually define the layout for our bind group
            const bindGroupLayout = device.createBindGroupLayout({
                label: 'Main Bind Group Layout',
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        sampler: { type: 'filtering' }
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: { 
                            sampleType: 'float',
                            viewDimension: '3d' 
                        }
                    }
                ] as const
            });

            // Create a pipeline layout using our manual bind group layout
            const pipelineLayout = device.createPipelineLayout({
                label: 'Main Pipeline Layout',
                bindGroupLayouts: [bindGroupLayout] // Pass it in as an array
            });

            // graphics pipeline!
            const pipeline = device.createRenderPipeline({
                label: 'hardcoded red triangle pipeline',
                layout: pipelineLayout,
                vertex: {
                    entryPoint: 'vs',
                    module,
                    buffers: [
                        {
                            arrayStride: cubeVertexSize,
                            attributes: [
                                {
                                    // position
                                    shaderLocation: 0,
                                    offset: cubePositionOffset,
                                    format: 'float32x4' as GPUVertexFormat,
                                },
                                {
                                    // uv
                                    shaderLocation: 1,
                                    offset: cubeUVOffset,
                                    format: 'float32x2' as GPUVertexFormat,
                                },
                            ],
                        },
                    ],
                },
                fragment: {
                    entryPoint: 'fs',
                    module,
                    targets:[{ format: presentationFormat }]
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                }
            });

            const depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            // creating a uniform buffer so we can attach our view/projection matrix
            const uniformBufferSize = 4 * 16;

            // will copy values into it
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // volume texture
            const volumeTexture = device.createTexture({
                size: {
                    width: volumeInfo.dimensions[0],
                    height: volumeInfo.dimensions[1],
                    depthOrArrayLayers: volumeInfo.dimensions[2],
                },
                dimension: "3d",
                // the thing with format is complex, because the format is dependant on
                // the format of the volumeData is an int16array right now
                // there's a few things we want for this texture
                // 1. we want to have linear filtering (for smoothness)
                // 2. we need it to be in 16 bits
                // we use r16unorm because each HU value is r16
                // linear filtering is done on the gpu which only accepts certain types,
                // the gpu can only handle normalize values for filtering
                // the values of each r16 needs to be normalized
                // we use use unsigned for data symmetry
                format: "r16uint",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });

            device.queue.writeTexture(
                {
                    texture: volumeTexture
                },
                normalizedData,
                {
                    offset: 0,
                    // change dimensions to 2 bytes per voxel
                    bytesPerRow: volumeInfo.dimensions[0] * 2,
                    rowsPerImage: volumeInfo.dimensions[1]
                },
                {
                    width: volumeInfo.dimensions[0],
                    height: volumeInfo.dimensions[1], 
                    depthOrArrayLayers: volumeInfo.dimensions[2]},
            )

            // 1D transfer function texture

            // texture sampler
            const sampler = device.createSampler({
                magFilter: "linear",
                minFilter: "linear",
            });

            // to read a descriptor you need a descriptor set
            const bindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: sampler,
                    },
                    {
                        binding: 2,
                        resource: volumeTexture.createView({ dimension: '3d' }),
                    },
                ],
            });

            const aspect = canvas.width / canvas.height;
            
            const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);

            const modelViewProjectionMatrix = mat4.create();

            const getTransformationMatrix = ():Float32Array => {
                const viewMatrix = mat4.identity();
                mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);

                const now = Date.now() / 1000;
                mat4.rotate(
                    viewMatrix,
                    vec3.fromValues(Math.sin(now), Math.cos(now), 0),
                    1,
                    viewMatrix
                );

                mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

                return modelViewProjectionMatrix;
            }


            // main render function
            const render = () => {
                const colorAttachment: GPURenderPassColorAttachment = {
                    // Get the current texture from the canvas context and
                    // set it as the texture to render to.
                    // image view in vulkan
                    view: context.getCurrentTexture().createView(), 
                    clearValue: [0.1098, 0.1216, 0.1490, 1],
                    // 0.1098, 0.1216, 0.1490
                    loadOp: 'clear',
                    storeOp: 'store',
                };

                const depthAttachment: GPURenderPassDepthStencilAttachment = {
                    view: depthTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                };

                const renderPassDescriptor: GPURenderPassDescriptor = {
                    label: 'our basic canvas renderPass',
                    colorAttachments: [colorAttachment],
                    depthStencilAttachment: depthAttachment,
                };

                // MVP matrix
                const transformationMatrix = getTransformationMatrix();

                // write to uniform buffer
                device.queue.writeBuffer(
                    uniformBuffer,
                    0,
                    transformationMatrix.buffer,
                    transformationMatrix.byteOffset,
                    transformationMatrix.byteLength
                );

                // create command encoder
                // to start encoding commands
                const encoder = device.createCommandEncoder({ label: 'our encoder' });

                // make a renderpass encoder to start rendering
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setPipeline(pipeline);
                pass.setBindGroup(0, bindGroup);
                pass.setVertexBuffer(0, vertexBuffer);
                pass.draw(cubeVertexCount);
                pass.end();

                const commandBuffer = encoder.finish();
                device.queue.submit([commandBuffer]);
                
                // animation loop
                requestAnimationFrame(render);
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