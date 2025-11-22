# 配置

## 通用配置（适用于 Windows / macOS / Linux）

### 1. 创建配置目录

在用户主目录下创建 `.codex` 文件夹：

- macOS / Linux：`~/.codex`
- Windows：`C:\\Users\\你的用户名\\.codex`

目录存在即可，无需重复创建。

### 2. 创建 `config.toml`

在 `.codex` 目录中新增 `config.toml`，粘贴以下内容：

```toml
model_provider = "codeilab"
model = "gpt-5.1"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.codeilab]
name = "codeilab"
base_url = "https://www.codeilab.com/api/codex"
wire_api = "responses"
requires_openai_auth = true

[features]
web_search_request = true
```

如需更换模型，只需调整 `model` 字段即可。

### 3. 创建 `auth.json`

仍在 `.codex` 目录下创建 `auth.json`：

```json
{
  "OPENAI_API_KEY": "test"
}
```

后续订阅完成后，把值替换为真实密钥即可。

### 4. 启动 Codex CLI

进入你的项目目录并运行 `codex`：

```bash
cd your-project
codex
```

若看到类似输出，则表示 CLI 已正确读取配置并成功连通服务器：

![](/codex_test.png)

终端可能提示：

```
unexpected status 403 Forbidden: {"error":{"message":"Hello! How can I help you with your software engineering tasks today?"}}
```

这是正常现象，说明请求已抵达服务器。

### 5. 订阅与 API Key

打开 [pricing](/#pricing) 页面完成订阅。订阅后可在控制台创建多个 API Key，并为每个 Key 设置配额及过期时间，方便团队共享。

![](/create_api_key.png)

点击复制按钮：

![](/copy_api_key.png)

将 `auth.json` 中的 `OPENAI_API_KEY` 替换为真实值：

```json
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxx"
}
```

保存后下次运行 `codex` 会自动读取新的密钥。

### 6. 在 VS Code 中使用

在 VS Code 插件市场安装官方 Codex 插件（注意选择带官方标识的版本）：

![](/vscode_codex.png)

VS Code 会自动读取 `config.toml` 和 `auth.json`，无需额外配置。若插件提示缺少配置，请检查上述步骤是否完成。
