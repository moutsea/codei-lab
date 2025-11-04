# Configuration


## Setting up Environment Parameters

#### If you're using MacOS or Linux

Add the code below into your `~/.zshrc` or `~/.bashrc`

```bash
export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="test" # replace it with your real api-key after you get subscribed
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

Then run: `source ~/.zshrc`

Or run code below one by one

```bash
# if you're using bash terminal, replace the ~/.zshrc below to ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://www.claudeide.net/api/anthropic"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="test"' >> ~/.zshrc
echo 'export API_TIMEOUT_MS=600000' >> ~/.zshrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1' >> ~/.zshrc

source ~/.zshrc 
```

#### If you're using Windows

You can refer to this page for how to set up environment variables: [set (environment variable)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/set_1)

```bash
set ANTHROPIC_BASE_URL=https://www.claudeide.net/api/anthropic
set ANTHROPIC_AUTH_TOKEN=test
set API_TIMEOUT_MS=600000
set CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```


## Start-up Claude code

Enter your project path, and using `claude-ide`

```bash
cd your-project
claude
```

You will get:

![](/claude_test.png)

You can also use plugin `claude` inside your vscode or other IDE. If you get asked for config like this:

![](/claude_code_error.png)

That means your configuration is not set up correctly, pls check again.

## Subscribe

After you get subscribed here: [pricing](/#pricing)

You can create your real api-key, and you can also set up quota and expire time for sharing it to your team mates.

![](/create_api_key.png)

Click the copy button

![](/copy_api_key.png)

Replace the `ANTHROPIC_AUTH_TOKEN` key with the real value.

```bash
export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"

# or 

echo 'export ANTHROPIC_AUTH_TOKEN="sk-proj-xxxx"' >> ~/.zshrc
source ~/.zshrc
```