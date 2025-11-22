# 설치 가이드

### 1단계: Node.js 설치

Node.js는 Chrome V8 엔진 위에 구축된 JavaScript 런타임으로, 서버 사이드 스크립트 실행과 확장 가능한 네트워크 애플리케이션 개발을 지원합니다.

공식 사이트(https://nodejs.org)에서 설치 프로그램을 다운로드한 뒤, 안내에 따라 설치를 완료하세요.

macOS에서는 Homebrew, Linux에서는 apt와 같은 패키지 관리자를 사용해 설치할 수도 있습니다.

#### macOS(Homebrew)에서 설치

```bash
brew install node
```

#### Linux(apt)에서 설치

```bash
sudo apt install nodejs
sudo apt install npm
```

#### Windows에서 직접 설치

1. [nodejs.org](https://nodejs.org/en)를 방문합니다.
2. LTS(안정 버전) 또는 Current(최신 기능) 중 하나를 선택합니다.
3. 다운로드한 .msi 파일을 실행하고 설치 마법사를 따릅니다.
4. 설치 과정에서 환경 변수가 자동으로 설정되며, npm도 함께 설치됩니다.

설치 후 버전을 확인해 정상적으로 설치되었는지 점검합니다.

```bash
node -v
npm -v
```

### 2단계: OpenAI Codex CLI 설치

`openai-codex`는 OpenAI Codex 모델과 상호작용하기 위한 Node.js 패키지입니다. 다음 명령으로 설치하세요.

```bash
npm install -g @openai/codex
```

버전을 확인해 설치를 검증합니다.

```bash
codex --version
```
