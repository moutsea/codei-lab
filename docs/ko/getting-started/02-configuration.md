# 환경 설정

## 공통 설정 (Windows / macOS / Linux)

### 1. 구성 폴더 만들기

홈 디렉터리에 `.codex` 폴더를 생성합니다.

- macOS / Linux: `~/.codex`
- Windows: `C:\\Users\\<사용자명>\\.codex`

이미 폴더가 있다면 그대로 사용해도 됩니다.

### 2. `config.toml` 생성

`.codex` 폴더에 `config.toml` 파일을 만들고 아래 내용을 붙여 넣습니다.

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

나중에 다른 모델을 사용하고 싶다면 `model` 값을 변경하면 됩니다.

### 3. `auth.json` 생성

같은 위치에 `auth.json` 파일을 만들고 아래 내용을 입력하세요.

```json
{
  "OPENAI_API_KEY": "test"
}
```

구독을 완료하면 여기의 값을 실제 키로 바꿔주면 됩니다.

### 4. Codex CLI 실행

프로젝트 디렉터리로 이동한 뒤 `codex` 명령을 실행합니다.

```bash
cd your-project
codex
```

설정이 올바르면 다음과 같은 화면이 표시되며 서버와 정상적으로 통신하고 있음을 의미합니다.

![](/codex_test.png)

초기 연결 시 아래와 같은 메시지가 보일 수도 있는데, 정상적인 동작입니다.

```
unexpected status 403 Forbidden: {"error":{"message":"Hello! How can I help you with your software engineering tasks today?"}}
```

### 5. 구독 및 API 키 관리

[pricing](/#pricing) 페이지에서 구독을 완료하세요. 구독 후에는 대시보드에서 여러 개의 API 키를 만들고 Key마다 별도의 quota와 만료일을 지정해 팀과 공유할 수 있습니다.

![](/create_api_key.png)

복사 버튼을 눌러 키 값을 클립보드에 저장합니다.

![](/copy_api_key.png)

이제 `auth.json`의 값을 실제 키로 바꾸면 됩니다.

```json
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxx"
}
```

저장 후 다시 `codex`를 실행하면 새로운 키가 자동으로 사용됩니다.

### 6. VS Code 연동

VS Code 마켓플레이스에서 공식 Codex 확장 프로그램을 설치하세요(공식 배지를 확인). 

![](/vscode_codex.png)

확장 프로그램은 `config.toml`과 `auth.json`을 자동으로 읽기 때문에 추가 설정이 필요하지 않습니다. 만약 설정 관련 오류가 나타나면 위 단계를 다시 확인하세요.
