# 项目结构说明

## 目录结构

```
my-extension/
├── src/                          # 源代码目录
│   ├── components/               # React 组件
│   │   └── popup.tsx            # 主弹窗组件
│   ├── lib/                     # 核心库文件
│   │   ├── wallet-service.ts    # 钱包服务
│   │   └── rpc-handler.ts       # RPC 方法处理器
│   ├── contents/                # Content Scripts
│   │   └── ethereum-inject.ts   # 注入 ethereum 对象
│   ├── background/              # Background Scripts
│   │   └── index.ts             # 后台脚本主文件
│   └── assets/                  # 静态资源
│       └── style.css            # 全局样式文件
├── contents/                    # Content Script 入口文件
│   └── ethereum-inject.ts       # 导出 src/contents/ethereum-inject
├── background/                  # Background Script 入口文件
│   └── index.ts                 # 导出 src/background/index
├── popup.tsx                    # Popup 入口文件
├── assets/                      # 扩展图标
│   └── icon.png
├── build/                       # 构建输出目录
│   ├── chrome-mv3-dev/         # 开发版本
│   └── chrome-mv3-prod/        # 生产版本
├── package.json                 # 项目配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # TailwindCSS 配置
└── postcss.config.js           # PostCSS 配置
```

## 功能模块

### 1. 钱包服务 (src/lib/wallet-service.ts)
- 钱包创建和导入
- 密码管理
- 账户管理
- 网络配置
- 消息签名

### 2. RPC 处理器 (src/lib/rpc-handler.ts)
- 实现以太坊 RPC 方法
- 支持的方法：
  - `eth_accounts` - 获取账户列表
  - `eth_chainId` - 获取当前链ID
  - `wallet_addEthereumChain` - 添加自定义网络
  - `eth_requestAccounts` - 请求账户访问
  - `eth_sign` - 签名消息
  - `personal_sign` - 个人签名
  - `eth_sendTransaction` - 发送交易
  - `eth_getBalance` - 获取余额

### 3. Content Script (src/contents/ethereum-inject.ts)
- 注入 `window.ethereum` 对象
- 处理来自网页的 RPC 请求
- 与 background script 通信

### 4. Background Script (src/background/index.ts)
- 处理来自 popup 和 content script 的消息
- 管理钱包状态
- 协调各个组件之间的通信

### 5. Popup UI (src/components/popup.tsx)
- 钱包管理界面
- 账户选择
- 网络切换
- 创建/导入钱包

## 技术栈

- **框架**: Plasmo (Chrome Extension 框架)
- **UI**: React + TailwindCSS
- **图标**: Lucide React
- **加密**: @metamask/browser-passworder
- **区块链**: ethers.js
- **错误处理**: eth-rpc-errors
- **存储**: Chrome Storage API

## 构建和开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 打包扩展
pnpm package
```

## 安装扩展

1. 打开 Chrome 浏览器
2. 进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `build/chrome-mv3-prod` 目录
