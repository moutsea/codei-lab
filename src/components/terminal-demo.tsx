"use client";

export default function TerminalDemo() {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl bg-gray-900">
      {/* Mac Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-gray-400 text-sm font-mono">Terminal</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm text-gray-300 bg-gray-900 h-[28rem] overflow-y-auto lg:h-[32rem]">
        <div className="space-y-2">
          {/* User Input */}
          <div className="flex items-start gap-2">
            <span className="text-green-400">$</span>
            <span className="text-blue-300">I&apos;m new to this codebase. Can you explain it to me?</span>
          </div>

          {/* AI Response */}
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">⏺</span>
            <span className="text-gray-300">I&apos;ll analyze the Excalidraw codebase structure and provide a high-level overview.</span>
          </div>

          {/* Processing */}
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">⏺</span>
            <span className="text-gray-400 italic">Analyze(what: &quot;Excalidraw codebase structure and provide a high-level overview of what it is, its main components, and how they&apos;re organized. Focus on understanding the project&apos;s purpose, architecture, and key features.&quot;)</span>
          </div>

          <div className="h-2"></div>

          {/* Response Content */}
          <div className="text-gray-300 leading-relaxed">
            <p>Excalidraw is an open-source virtual whiteboard application with a hand-drawn style. It&apos;s designed for creating diagrams, wireframes, and collaborative drawings.</p>
          </div>

          <div className="h-3"></div>

          <div className="text-white font-semibold">## Purpose</div>

          <div className="ml-4 space-y-1 text-gray-300">
            <div>• Web-based drawing tool with infinite canvas</div>
            <div>• Hand-drawn aesthetic with support for shapes, arrows, text</div>
            <div>• End-to-end encrypted collaboration</div>
            <div>• Works offline as a PWA (Progressive Web App)</div>
          </div>

          <div className="h-3"></div>

          <div className="text-white font-semibold">## Architecture</div>

          <div className="text-gray-300 mb-2">The project is organized as a monorepo with these main components:</div>

          <div className="ml-4 space-y-2 text-gray-300">
            <div>
              <span className="text-blue-400 font-semibold">1. Core Package (packages/excalidraw)</span>
              <div className="ml-4 text-gray-400">
                • React component library for embedding Excalidraw in any application<br/>
                • Handles drawing, rendering, and core functionality<br/>
                • Uses roughjs for the hand-drawn style<br/>
                • Includes export capabilities (PNG, SVG)
              </div>
            </div>

            <div>
              <span className="text-blue-400 font-semibold">2. Web Application (excalidraw-app/)</span>
              <div className="ml-4 text-gray-400">
                • Full-featured web app at excalidraw.com<br/>
                • Built on top of the core package<br/>
                • Adds collaboration features, local storage, sharing
              </div>
            </div>

            <div>
              <span className="text-blue-400 font-semibold">3. Support Packages</span>
              <div className="ml-4 text-gray-400">
                • common - Shared utilities and constants<br/>
                • element - Element manipulation and type definitions<br/>
                • math - Mathematical functions for drawing<br/>
                • utils - General utility functions
              </div>
            </div>

            <div>
              <span className="text-blue-400 font-semibold">4. Examples</span>
              <div className="ml-4 text-gray-400">
                • Integration examples (Next.js, browser script)<br/>
                • Shows how to embed Excalidraw in different environments
              </div>
            </div>

            <div>
              <span className="text-blue-400 font-semibold">5. Documentation (dev-docs/)</span>
              <div className="ml-4 text-gray-400">
                • API documentation<br/>
                • Integration guides<br/>
                • Component documentation
              </div>
            </div>
          </div>

          <div className="h-3"></div>

          <div className="text-white font-semibold">## Key Features</div>

          <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300 text-sm">
            <div>• Real-time collaboration with end-to-end encryption</div>
            <div>• Export to various formats (PNG, SVG, JSON)</div>
            <div>• Customizable drawing tools</div>
            <div>• Dark mode support</div>
            <div>• Localization</div>
            <div>• Library of shapes and components</div>
            <div>• Arrow bindings and labels</div>
            <div>• Image support</div>
          </div>

          <div className="h-3"></div>

          <div className="text-white font-semibold">## Technology Stack</div>

          <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300 text-sm">
            <div>• React for UI</div>
            <div>• TypeScript for type safety</div>
            <div>• Firebase for collaboration backend</div>
            <div>• Jotai for state management</div>
            <div>• Vite for development and building</div>
            <div>• IndexedDB/LocalStorage for offline storage</div>
          </div>

          <div className="h-3"></div>

          <div className="text-gray-300 leading-relaxed">
            The architecture allows for both using Excalidraw as a component in other applications and as a standalone web application with additional features.
          </div>

          <div className="h-2"></div>

          {/* Cursor blinking effect */}
          <div className="flex items-center gap-2">
            <span className="text-green-400">$</span>
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
}