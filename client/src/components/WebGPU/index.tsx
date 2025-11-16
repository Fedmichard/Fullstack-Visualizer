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
            // we need to have unsigned for linear filtering
            // and we will convert them to unsigned so we can get them from 0 -1 
            // so we can index our transfer function properly and so the gpu can read it
            const huData = volumeInfo.volumeData; 

            // Create a new Float32Array to hold the converted values
            const unsignedData = new Uint16Array(huData.length);
            
            // Loop through and convert each Int16 value to a Float32 value
            for (let i = 0; i < huData.length; i++) {
                // giving it a shift of 32768 (reference ossium)
                unsignedData[i] = huData[i] + 2**15; 
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
                // --- 1. UNIFORMS (Renamed cameraPos01 to cameraPos) ---
                struct Uniforms {
                    modelViewProjectionMatrix : mat4x4f,
                    inverseModelMatrix : mat4x4f,
                    cameraPos : vec3f, // This is our world-space "eye_pos"
                };

                // --- 2. VERTEX OUTPUT (Now passes ray data) ---
                struct VertexOutput {
                    @builtin(position) Position : vec4f,
                    @location(0) uv : vec2f,
                    @location(1) rayDir : vec3f, // The ray direction (interpolated)
                    @location(2) @interpolate(flat) transformed_eye : vec3f, // The ray origin
                };

                @group(0) @binding(0) var<uniform> uniforms : Uniforms;
                @group(0) @binding(1) var samp : sampler;
                @group(0) @binding(2) var volumeTex : texture_3d<f32>;

                // --- 3. VERTEX SHADER (Calculates the ray) ---
                @vertex
                fn vs(
                    @location(0) position : vec4f,
                    @location(1) uv : vec2f
                ) -> VertexOutput {
                    var out : VertexOutput;

                    out.Position = uniforms.modelViewProjectionMatrix * position;
                    out.uv = uv;

                    // --- This is the logic from Will Usher's shader ---
                    // 1. Transform world-space camera to [-1, 1] model-space
                    let cameraModelPos = (uniforms.inverseModelMatrix * vec4f(uniforms.cameraPos, 1.0)).xyz;
                    
                    // 2. Transform [-1, 1] model-space camera to [0, 1] texture-space
                    // This is our "transformed_eye"
                    out.transformed_eye = 0.5 * (cameraModelPos + vec3f(1.0));

                    // 3. Convert vertex position to [0, 1] texture-space
                    let pos01 = 0.5 * (position.xyz + vec3f(1.0));

                    // 4. Calculate ray direction (from eye to vertex) in [0, 1] space
                    out.rayDir = pos01 - out.transformed_eye;

                    return out;
                }

                // --- 4. NEW FUNCTION (From Will Usher's code) ---
                // Intersects a ray with the [0, 1] unit box
                fn intersect_box(orig: vec3f, dir: vec3f) -> vec2f {
                    let box_min = vec3f(0.0);
                    let box_max = vec3f(1.0);
                    let inv_dir = 1.0 / dir;
                    let tmin_tmp = (box_min - orig) * inv_dir;
                    let tmax_tmp = (box_max - orig) * inv_dir;
                    let tmin = min(tmin_tmp, tmax_tmp);
                    let tmax = max(tmin_tmp, tmax_tmp);
                    let t0 = max(tmin.x, max(tmin.y, tmin.z));
                    let t1 = min(tmax.x, min(tmax.y, tmax.z));
                    return vec2f(t0, t1);
                }

                // --- 5. FRAGMENT SHADER (Uses the new ray) ---
                @fragment
                fn fs(
                    @location(0) uv: vec2f,
                    @location(1) rayDir: vec3f, // Receives ray direction
                    @location(2) @interpolate(flat) transformed_eye: vec3f // Receives ray origin
                ) -> @location(0) vec4f {

                    // --- Ray setup (from Will Usher) ---
                    let dir = normalize(rayDir);
                    let t_hit = intersect_box(transformed_eye, dir);

                    // If no hit, discard the pixel
                    if (t_hit.x > t_hit.y) {
                        discard;
                    }

                    // We don't want to sample behind the eye
                    let t_min = max(t_hit.x, 0.0);
                    let t_max = t_hit.y;

                    // Calculate a step size. 128 steps is a good start.
                    let steps = 128u;
                    let stepSize = (t_max - t_min) / f32(steps);

                    // Start the ray at the entry point
                    var pos = transformed_eye + t_min * dir;
                    
                    var acc = 0.0; // accumulated grayscale

                    // --- Raymarch ---
                    for (var i = 0u; i < steps; i++) {
                        // Note: We don't need the "if ray escaped" check anymore
                        // because our loop only goes from t_min to t_max.

                        // --- FIX: Reconstruct 16-bit value from rg8unorm ---
                        let sampleVec = textureSampleLevel(volumeTex, samp, pos, 0.0);
                        let sampleVal = (sampleVec.r * 255.0 + sampleVec.g * 255.0 * 256.0) / 65535.0;

                        // Convert 16-bit value back to HU-like range
                        let hu16 = sampleVal * 65535.0;

                        // Simple grayscale visualization
                        let shade = hu16 / 4096.0;  // tune as needed
                        acc += shade * 0.02; // Tune the 0.02 for brightness

                        pos += dir * stepSize;
                    }

                    let g = clamp(acc, 0.0, 1.0);
                    return vec4f(g, g, g, 1.0);
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
            const uniformBufferSize = (4 * 16) + (4 * 16) + (4 * 4);

            const uniformData = new Float32Array(uniformBufferSize / 4);

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
                // we use rg8unorm because each HU value is 16 bits split into high and low byte
                // linear filtering is done on the gpu which only accepts unsigned values,
                // you can't use linear filtering
                // Also apparently pure integer formats don't allow any form of filtering so we use 
                format: "rg8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });

            device.queue.writeTexture(
                {
                    texture: volumeTexture
                },
                unsignedData,
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

            const getUniformData = (): Float32Array => {
                
                // 1. Camera (View)
                const viewMatrix = mat4.identity();
                mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
                // World-space camera position
                const cameraWorldPos = vec3.fromValues(0, 10, 0);

                // 2. Object (Model)
                const modelMatrix = mat4.identity();
                const now = Date.now() / 1000;
                mat4.rotateY(modelMatrix, now * 0.7, modelMatrix);

                // 3. Inverse Model
                // This is the new matrix we need for the shader
                const inverseModelMatrix = mat4.invert(modelMatrix);

                // 4. Final MVP
                // P * V * M
                mat4.multiply(viewMatrix, modelMatrix, modelViewProjectionMatrix);
                mat4.multiply(projectionMatrix, modelViewProjectionMatrix, modelViewProjectionMatrix);

                // 5. Pack all data into our array
                uniformData.set(modelViewProjectionMatrix, 0);  // Offset 0
                uniformData.set(inverseModelMatrix, 16);       // Offset 16
                uniformData.set(cameraWorldPos, 32);           // Offset 32

                return uniformData;
            };

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
                const transformationData = getUniformData();

                // write to uniform buffer
                device.queue.writeBuffer(
                    uniformBuffer,
                    0,
                    transformationData.buffer,
                    transformationData.byteOffset,
                    transformationData.byteLength
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