# 安装指南

### 第一步：安装 Node.js

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，它支持服务器端脚本执行并能够构建可扩展的网络应用。

要安装 Node.js，可以从官方网站（https://nodejs.org）下载安装程序，运行安装文件并按照提示完成安装。

或者，您也可以在 macOS 上使用 `brew`，在 Linux 上使用 `apt` 包管理器来安装。

#### 在 macOS 上使用 Brew

```bash
# 如果您已经安装了 brew
brew install node
```

#### 在 Linux 上使用 Apt

```bash
# 在 Linux 上使用 apt 安装 Node.js
sudo apt install nodejs
sudo apt install npm
```

#### 在 Windows 上直接下载安装

访问 Node.js 官方网站：[nodejs.org](https://nodejs.org/en)

**选择要下载的版本**：

- LTS 版本（长期支持版）：适合大多数用户，更稳定

- Current 版本：包含最新特性

**安装步骤**：

- 双击下载的 .msi 安装文件

- 按照安装向导操作，通常直接点击"下一步"即可

- 安装程序会自动配置环境变量

- npm（Node 包管理器）将默认安装

安装完成后，您可以在终端中检查版本：

```bash
node -v
# 您应该看到类似：v23.11.0

npm -v
# 您应该看到类似：10.9.2
```

如果您能看到版本号，表示 Node.js 安装成功。

### 第二步：安装 Claude Code

claude-code 是一个 Node.js 包，用于与 Anthropic 的 Claude AI 模型进行交互。它提供了一个简单的接口，使开发者能够轻松地与 Claude 模型通信，并将其功能集成到应用程序中。

使用您刚刚安装的 npm 安装 claude-code：

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后，您可以通过检查版本来验证安装：

```bash
claude --version
# 您应该看到类似：2.0.2 (Claude Code)
```