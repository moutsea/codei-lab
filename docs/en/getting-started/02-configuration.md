# Configuration

## Universal setup (Windows / macOS / Linux)

### 1. Create the configuration directory

Create a `.codex` folder inside your home directory:

- macOS / Linux: `~/.codex`
- Windows: `C:\\Users\\<YourUserName>\\.codex`

If the folder already exists you can reuse it.

### 2. Create `config.toml`

Inside `.codex`, create a file named `config.toml` and paste the following:

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

You can adjust the `model` field if you want to target a different model later.

### 3. Create `auth.json`

In the same directory create `auth.json`:

```json
{
  "OPENAI_API_KEY": "test"
}
```

After you subscribe, replace the placeholder with your real key.

### 4. Launch the Codex CLI

Change into your project directory and run `codex`:

```bash
cd your-project
codex
```

If the CLI is configured correctly you’ll see an output similar to the screenshot below, which means the request reached our servers:

![](/codex_test.png)

You may also see a message such as:

```
unexpected status 403 Forbidden: {"error":{"message":"Hello! How can I help you with your software engineering tasks today?"}}
```

That is expected during the initial handshake and confirms connectivity.

### 5. Subscribe and manage API keys

Visit the [pricing](/#pricing) page to subscribe. After subscribing you can create multiple API keys in the dashboard, set individual quotas, and define expiration dates for teammates.

![](/create_api_key.png)

Click the copy button:

![](/copy_api_key.png)

Update `auth.json` with your real key value:

```json
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxx"
}
```

Save the file—`codex` will load the new key automatically the next time you run it.

### 6. Use the VS Code extension

Install the official Codex extension from the VS Code marketplace (make sure you pick the one with the official badge):

![](/vscode_codex.png)

The extension automatically reads `config.toml` and `auth.json`, so no extra setup is required. If VS Code prompts you for configuration, double-check the steps above.
