# ResoftCodingAgent 安装手册

## 1. 系统要求

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | >= 20.0.0 | 22.x LTS | 运行时环境 |
| npm | >= 10.0.0 | 随 Node.js 22.x 附带 | 包管理器 |
| Python | >= 3.9 | 3.11 / 3.12 | Skill 脚本执行环境 |
| Git | >= 2.30 | 2.40+ | 版本控制与仓库克隆 |
| 磁盘空间 | >= 1 GB | 2 GB+ | 含依赖 & 模型缓存 |
| 内存 | >= 4 GB | 8 GB+ | 运行 LLM 上下文 |

### 操作系统支持

| OS | 支持状态 |
|----|----------|
| macOS 13+ (Ventura/Sonoma/Sequoia) | 完全支持 |
| Ubuntu 22.04+ / Debian 12+ / CentOS 9+ / RHEL 9+ | 完全支持 |
| Windows 10/11 (WSL2 推荐) | 支持（推荐 WSL2） |
| Windows 原生 (PowerShell/cmd) | 有限支持（部分 Skill 脚本需 WSL2） |

---

## 2. 环境准备

### 2.1 安装 Node.js（macOS）

```bash
# 方式一：使用 Homebrew
brew install node@22

# 方式二：使用 nvm（推荐，方便版本切换）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

### 2.2 安装 Node.js（Linux）

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v   # 应输出 v22.x.x
npm -v    # 应输出 10.x.x
```

### 2.3 安装 Node.js（Windows WSL2）

```powershell
# 在 PowerShell（管理员）中安装 WSL2
wsl --install -d Ubuntu-22.04
# 重启后进入 Ubuntu 终端，按 2.2 节操作
```

### 2.4 安装 Git

```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install -y git

# 验证
git --version
```

### 2.5 安装 Python

```bash
# macOS
brew install python@3.12

# Ubuntu/Debian
sudo apt-get install -y python3 python3-pip python3-venv

# 验证
python3 --version   # 应输出 3.9 或更高
pip3 --version
```

### 2.6 配置网络代理（如需要）

```bash
# HTTP/HTTPS 代理
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1,.local

# Git 代理
git config --global http.proxy http://proxy.company.com:8080
git config --global https.proxy http://proxy.company.com:8080

# npm 代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

---

## 3. 安装步骤

### 3.1 克隆仓库

```bash
# 克隆 pi-agent（ResoftCodingAgent 基于 pi agent 扩展）
git clone https://github.com/ResoftCodingAgent/pi-agent.git
cd pi-agent
```

> 若使用公司内部 GitLab，请替换为内部仓库地址。

### 3.2 安装依赖

```bash
npm install

# 编译 TypeScript
npm run build
```

安装与编译过程会自动完成：
- TypeScript 编译
- Skill 脚本依赖检查
- 默认配置文件生成

### 3.3 配置 LLM API Key

ResoftCodingAgent 需要至少配置一个 LLM 提供商的 API Key。

#### 方式一：环境变量（推荐）

```bash
# 在 ~/.bashrc / ~/.zshrc 中添加
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# 或
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 使配置生效
source ~/.zshrc
```

#### 方式二：.env 文件

```bash
# 在 pi-agent 目录下创建 .env
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 多 Key 负载均衡（可选）
# ANTHROPIC_API_KEY_2=sk-ant-api03-yyyyyyyyyyyyyyyyyyyyyyyyyyyy
EOF
```

#### 方式三：pi 配置文件

```bash
# 编辑 ~/.pi/config.yaml
cat > ~/.pi/config.yaml << 'EOF'
apiKey: "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
provider: "anthropic"
EOF
```

### 3.4 支持的模型

| 提供商 | 模型 | 环境变量 | 说明 |
|--------|------|----------|------|
| Anthropic | claude-sonnet-4-20250514 | `ANTHROPIC_API_KEY` | 默认推荐 |
| Anthropic | claude-opus-4-20250514 | `ANTHROPIC_API_KEY` | 高复杂度任务 |
| OpenAI | gpt-4o | `OPENAI_API_KEY` | 备选 |
| OpenAI | gpt-4-turbo | `OPENAI_API_KEY` | 较经济 |
| 自定义 | 兼容 OpenAI API | `OPENAI_BASE_URL` + `OPENAI_API_KEY` | 私有化部署 |

---

## 4. 验证安装

```bash
# 1. 检查 CLI 是否可用
npm run resoft -- --help

# 2. 检查 Skill 列表
npm run resoft -- skill list

# 预期输出应包含：
#   spark-etl    enabled   Spark/PySpark ETL 开发
#   flink-etl    enabled   Flink SQL ETL 开发
#   dbt-etl      enabled   dbt 数据转换
#   sql-etl      enabled   SQL 脚本开发

# 3. 运行简单对话测试
npm run resoft -- chat -p "你好，请帮我写一个 Spark WordCount 程序"

# 4. 运行代码审查测试
echo "SELECT * FROM users WHERE id = 1" > /tmp/test.sql
npm run resoft -- review /tmp/test.sql

# 5. 运行 CI 模式测试（v1.0）
npm run resoft -- ci --files /tmp/test.sql --no-fail-on-error

# 6. 查看用量统计（v1.0）
npm run resoft -- stats summary

# 7. 启动 Dashboard（v1.0）
npm run resoft -- dashboard

# 8. 安装 pre-commit 钩子（可选，v1.0）
ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
```

---

## 5. 全局安装（可选）

```bash
# 创建全局命令别名
npm link
# 之后可直接使用：
resoft --help
resoft chat
resoft review
```

---

## 6. 卸载步骤

```bash
# 1. 取消全局链接
npm unlink -g pi-agent

# 2. 删除仓库
cd .. && rm -rf pi-agent

# 3. 删除配置文件（可选）
rm -rf ~/.pi

# 4. 删除环境变量
# 编辑 ~/.zshrc / ~/.bashrc，移除 ANTHROPIC_API_KEY / OPENAI_API_KEY 行
```

---

## 7. 常见安装问题排查

### 7.1 npm install 失败（网络）

```bash
# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或全局配置
npm config set registry https://registry.npmmirror.com
```

### 7.2 Permission denied（Linux/macOS）

```bash
# npm 全局目录权限问题
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### 7.3 Python 版本过低

```bash
# macOS 使用 pyenv
brew install pyenv
pyenv install 3.12.0
pyenv global 3.12.0

# Ubuntu 使用 deadsnakes PPA
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get install python3.12 python3.12-venv
```

### 7.4 node-gyp 编译失败

```bash
# macOS
xcode-select --install

# Ubuntu
sudo apt-get install -y build-essential python3

# Windows
npm install --global windows-build-tools
```

### 7.5 代理导致连接失败

```bash
# 清除 npm 代理
npm config delete proxy
npm config delete https-proxy

# 清除 Git 代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

## 8. 离线安装指南

### 8.1 在联网机器上准备离线包

```bash
# 1. 克隆并安装依赖
git clone https://github.com/ResoftCodingAgent/pi-agent.git
cd pi-agent
npm install

# 2. 打包整个目录
cd ..
tar -czf pi-agent-offline.tar.gz pi-agent/
```

### 8.2 在离线机器上部署

```bash
# 1. 传输并解压
tar -xzf pi-agent-offline.tar.gz
cd pi-agent

# 2. 使用离线缓存
npm install --prefer-offline --no-audit

# 3. 手动配置 API Key
# 参照 3.3 节，需要至少一个可访问的 LLM API 端点
```

### 8.3 离线使用注意事项

- 需要提前在联网环境完成 `npm install`
- LLM API 调用需网络，离线指安装环节可离线
- Skill 脚本所用 Python 包需提前安装（`pip install -r requirements-skill.txt`）

---

## 附录：目录结构

```
pi-agent/
├── docs/                    # 文档
├── skills/                  # Skill 定义
│   ├── spark-etl/
│   ├── flink-etl/
│   ├── dbt-etl/
│   └── sql-etl/
├── src/                     # TypeScript 源码
│   ├── pipeline/            # CI/CD 流水线集成模块（v1.0）
│   ├── stats/               # 用量统计模块（v1.0）
│   └── dashboard/           # 团队 Dashboard 模块（v1.0）
├── scripts/                 # 辅助脚本
│   └── pre-commit.sh        # Git pre-commit 钩子（v1.0）
├── .github/workflows/       # GitHub Actions 工作流（v1.0）
│   └── resoft-review.yml
├── team-config/             # 团队配置模板
├── package.json
├── tsconfig.json
└── .env.example
```
