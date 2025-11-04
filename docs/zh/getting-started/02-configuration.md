# 配置

## 设置环境参数

#### 如果你使用的是 MacOS 或 Linux

将下列代码添加到你的 `~/.zshrc` 或 `~/.bashrc` 文件中

```bash
export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="test" # 获取订阅后请替换为你的真实 api-key
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

然后运行：`source ~/.zshrc`

或者逐行执行：

```bash
# 如果你使用 bash 终端，请将 ~/.zshrc 替换为 ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="test"' >> ~/.zshrc
echo 'export API_TIMEOUT_MS=600000' >> ~/.zshrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1' >> ~/.zshrc

source ~/.zshrc 
```

#### 如果你使用的是 Windows

你可以参考此页面了解如何设置环境变量： [set (environment variable)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/set_1)

```bash
set ANTHROPIC_BASE_URL=https://www.claudeide.net/api/anthropic
set ANTHROPIC_AUTH_TOKEN=test
set API_TIMEOUT_MS=600000
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

## 启动 Claude 代码环境

进入你的项目路径，并使用 `claude-ide`

```bash
cd your-project
claude
```

你将看到：

![](/claude_test.png)

你也可以在你的 VSCode 或其他 IDE 中使用 claude 插件。如果你遇到类似以下的配置提示：

![](/claude_code_error.png)

这意味着你的配置没有正确设置，请重新检查。

## 订阅

在此页面完成订阅：[pricing](/#pricing)

你可以创建真实的 api-key，还可以设置配额和过期时间以便与团队成员共享。

![](/create_api_key.png)

点击复制按钮：

![](/copy_api_key.png)

将 `ANTHROPIC_AUTH_TOKEN` 的值替换为真实密钥。

```bash
export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"

# 或者

echo 'export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"' >> ~/.zshrc
source ~/.zshrc
```