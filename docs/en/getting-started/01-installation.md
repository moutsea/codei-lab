# Installation

### Step 1: Install Node.js

Node.js is a JavaScript runtime built on Chrome's V8 engine that enables server-side scripting and the building of scalable network applications.

To install Node.js, download the installer from the official website (https://nodejs.org
), run the setup file, and follow the installation prompts.

Alternatively, you can use a package manager like brew on macOS or apt on Linux.

#### use brew in MacOS

```bash
# for MacOS, if you already have brew installed
brew install node
```

#### use apt in Linux

```bash
# for Linux, use apt to install Node.js
sudo apt install nodejs
sudo apt install npm
```

#### download and install directly in Windows

Visit the Node.js official website: [nodejs.org](https://nodejs.org/en)

**Select a version to download**:

- LTS version (Long Term Support): Suitable for most users, more stable

- Current version: Includes the latest features

**Installation Steps**:

- Double-click the downloaded .msi installation file

- Follow the installation wizard, usually just click "Next"

- The installer will automatically configure environment variables

- npm (Node Package Manager) will be installed by default

After installation, check the version in your terminal:

```bash
node -v
# You should see something like: v23.11.0

npm -v
# You should see something like: 10.9.2
```

If you see the version numbers, it means Node.js has been successfully installed.


### Step 2: Install OpenAI Codex CLI

`openai-codex` is a Node.js package used to interact with OpenAI's Codex AI model. It provides a simple interface that allows developers to easily communicate with the Codex model, enabling them to integrate its functionality into their applications.

Install `openai-codex` using npm (which you installed earlier):

```bash
npm install -g @openai/codex
```

Once installed, check the version to verify the installation:

```bash
codex --version
# You should see the installed version number
```