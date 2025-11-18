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

            // Convert signed Int16 to unsigned Uint16
            const unsignedData = new Uint16Array(huData.length);
            for (let i = 0; i < huData.length; i++) {
                // Shift from [-32768, 32767] to [0, 65535]
                unsignedData[i] = huData[i] + 2**15; 
            }
            
            // RG8Unorm format requires bytes, not 16-bit values
            // We need to split each 16-bit value into high and low bytes
            // Format: [R0, G0, R1, G1, ...] where R is high byte, G is low byte
            const rg8Data = new Uint8Array(huData.length * 2);
            for (let i = 0; i < unsignedData.length; i++) {
                const value = unsignedData[i];
                rg8Data[i * 2] = (value >> 8) & 0xFF;      // High byte -> R
                rg8Data[i * 2 + 1] = value & 0xFF;          // Low byte -> G
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
                    inverseModelMatrix : mat4x4f,
                    cameraPos : vec3f, // This is our world-space "eye_pos"
                };

                struct VertexOutput {
                    @builtin(position) Position : vec4f,
                    @location(0) uv : vec2f,
                    @location(1) rayDir : vec3f, // The ray direction (interpolated)
                    @location(2) @interpolate(flat) transformed_eye : vec3f, // The ray origin
                };

                @group(0) @binding(0) var<uniform> uniforms : Uniforms;
                @group(0) @binding(1) var samp : sampler;
                @group(0) @binding(2) var volumeTex : texture_3d<f32>;

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
                    // This is our "transformed_eye" position
                    out.transformed_eye = 0.5 * (cameraModelPos + vec3f(1.0));

                    // 3. Convert vertex position to [0, 1] texture-space
                    let pos01 = 0.5 * (position.xyz + vec3f(1.0));

                    // 4. Calculate ray direction (from eye to vertex) in [0, 1] space
                    out.rayDir = pos01 - out.transformed_eye;

                    return out;
                }

                // --- 4. Ray intersection Formula (From Will Usher's code) ---
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

                @fragment
                fn fs(
                    @location(0) uv: vec2f,
                    @location(1) rayDir: vec3f,
                    @location(2) @interpolate(flat) transformed_eye: vec3f
                ) -> @location(0) vec4f {
                    // Step 1: Normalize the view ray
                    let dir = normalize(rayDir);
                    
                    // Step 2: Intersect the ray with the volume bounds to find the interval
                    // along the ray overlapped by the volume.
                    let t_hit = intersect_box(transformed_eye, dir);
                    
                    if (t_hit.x > t_hit.y) {
                        discard;
                    }
                    
                    // We don't want to sample voxels behind the eye if it's
                    // inside the volume, so keep the starting point at or in front
                    // of the eye
                    let t_start = max(t_hit.x, 0.0);
                    
                    // Early discard if the intersection is invalid or too small
                    if (t_hit.y <= t_start || t_hit.y - t_start < 0.001) {
                        discard;
                    }
                    
                    // Step 3: Compute the step size to march through the volume grid
                    // Using a reasonable step count
                    let steps = 2048u;
                    let dt = (t_hit.y - t_start) / f32(steps);
                    
                    // Step 4: Starting from the entry point, march the ray through the volume
                    // and sample it
                    var p = transformed_eye + t_start * dir;

                    // continuous color
                    var color = vec4f(0.0);
                    
                    for (var i = 0u; i < steps; i++) {
                        // Clamp position to [0, 1] for texture sampling
                        let clamped_p = clamp(p, vec3f(0.0), vec3f(1.0));

                        // Compute radius from relative XY
                        let rel = clamped_p.xy * 2.0 - vec2f(1.0);
                        let r = dot(rel, rel);

                        // If outside circle treat as air
                        // 0.75
                        if (r > 0.75) {
                            p += dir * dt;
                            continue;
                        }
                        
                        // Step 4.1: Sample the volume
                        // RG8Unorm: R channel contains high byte, G channel contains low byte
                        // Both R and G are already normalized to 0.0-1.0 range
                        let sample = textureSampleLevel(volumeTex, samp, clamped_p, 0.0);
                        let r_val = sample.r; // Already normalized (0.0-1.0)
                        let g_val = sample.g; // Already normalized (0.0-1.0)
                        
                        // Reconstruct 16-bit unsigned value from RG8Unorm
                        // R and G are normalized, so multiply by 255 to get byte values
                        // Then combine: (high_byte * 256 + low_byte) / 65535.0
                        let high_byte = r_val * 255.0;
                        let low_byte = g_val * 255.0;
                        let combined_16bit = high_byte * 256.0 + low_byte;
                        let intensity = combined_16bit / 65535.0; // Normalized 0.0-1.0
                        
                        // Convert normalized intensity to approximate HU value
                        // intensity 0.0 = -32768 HU, intensity 0.5 = 0 HU, intensity 1.0 = +32767 HU
                        let hu_value = (intensity - 0.5) * 65536.0; // Approximate HU
                        
                        // Skip air and very low density materials (fully transparent)
                        // Air is typically around -1000 HU, we'll make everything below -500 HU transparent
                        // This prevents air from contributing to the render (whether it's black or white)
                        // Define our window
                        let hu_window_min = -500.0;
                        let hu_window_max = 3000.0;

                        // Skip samples that are OUTSIDE our window (either too low OR too high)
                        if (hu_value < hu_window_min || hu_value > hu_window_max) {
                            p += dir * dt;
                            continue; // Skip this sample - it's air or garbage
                        }
                        
                        // Map HU range to visible window
                        // We can be sure the value is inside the window, so no clamp is needed
                        var normalized_intensity = (hu_value - hu_window_min) / (hu_window_max - hu_window_min);
                        
                        // Opacity: make tissue and bone visible
                        // Use a window that emphasizes soft tissue and bone
                        // Only apply opacity to values within our window
                        let alpha = smoothstep(0.0, 1.0, normalized_intensity) * 0.4;
                        
                        // Simple grayscale color (replace with transfer function later)
                        // all of 
                        let rgb = vec3f(normalized_intensity);
                        
                        // Step 4.2: Accumulate the color and opacity using the front-to-back
                        // compositing equation
                        let new_rgb = color.rgb + (1.0 - color.a) * alpha * rgb;
                        let new_alpha = color.a + (1.0 - color.a) * alpha;
                        color = vec4f(new_rgb, new_alpha);
                        
                        p += dir * dt;
                        
                        // Early exit if we've left the volume
                        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z < 0.0 || p.z > 1.0) {
                            break;
                        }
                    }
                    
                    return color;
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
                    cullMode: 'none', // Render both sides so we can properly discard fragments
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
                rg8Data,
                {
                    offset: 0,
                    // RG8Unorm: 2 bytes per voxel (R and G channels)
                    bytesPerRow: volumeInfo.dimensions[0] * 2,
                    rowsPerImage: volumeInfo.dimensions[1]
                },
                {
                    width: volumeInfo.dimensions[0],
                    height: volumeInfo.dimensions[1], 
                    depthOrArrayLayers: volumeInfo.dimensions[2]
                }
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
                mat4.translate(viewMatrix, vec3.fromValues(0, 0, -2), viewMatrix);
                // World-space camera position (should match view matrix)
                // View matrix translates world by (0, 0, -4), so camera is at (0, 0, 4)
                const cameraWorldPos = vec3.fromValues(0, 0, 2);

                // 2. Object (Model)
                const modelMatrix = mat4.identity();
                // Apply the animated Y rotation first (left-right spin)
                const now = Date.now() / 1000;
                mat4.rotateY(modelMatrix, now * 0.7, modelMatrix);
                // Then apply initial rotation to orient the volume properly (face the camera)
                // Rotate around X axis to flip upright
                mat4.rotateX(modelMatrix, -Math.PI / 2, modelMatrix);

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
                    clearValue: [0, 0, 0, 1],
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