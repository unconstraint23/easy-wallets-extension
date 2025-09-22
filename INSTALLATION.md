# 钱包扩展安装和使用说明

## 安装步骤

### 1. 构建扩展
```bash
# 开发版本
pnpm dev

# 生产版本
pnpm build
```

### 2. 在 Chrome 中安装扩展

1. 打开 Chrome 浏览器
2. 在地址栏输入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择以下目录之一：
   - **开发版本**: `build/chrome-mv3-dev/`
   - **生产版本**: `build/chrome-mv3-prod/`

### 3. 验证安装

安装成功后，您应该能在 Chrome 工具栏看到钱包扩展图标。

## 使用说明

### 1. 首次使用

1. 点击扩展图标打开钱包界面
2. 设置钱包密码（用于加密存储）
3. 创建新钱包或导入现有钱包

### 2. 创建钱包

1. 在钱包界面点击 "+" 按钮
2. 输入钱包名称（可选）
3. 点击"创建"按钮
4. 新钱包将自动成为当前账户

### 3. 导入钱包

1. 在钱包界面点击下载图标
2. 输入私钥
3. 输入钱包名称（可选）
4. 点击"导入"按钮

### 4. 切换账户

在钱包列表中点击要使用的账户即可切换。

### 5. 切换网络

在"网络"下拉菜单中选择要使用的区块链网络。

## 测试功能

打开 `test-extension.html` 文件可以测试扩展的各项功能：

1. **测试连接**: 检查扩展是否正确注入
2. **获取账户**: 测试 `eth_accounts` 方法
3. **获取链ID**: 测试 `eth_chainId` 方法
4. **请求账户访问**: 测试 `eth_requestAccounts` 方法
5. **签名消息**: 测试 `personal_sign` 方法
6. **添加网络**: 测试 `wallet_addEthereumChain` 方法

## 支持的功能

### RPC 方法
- `eth_accounts` - 获取账户列表
- `eth_chainId` - 获取当前链ID
- `eth_requestAccounts` - 请求账户访问
- `eth_sign` - 签名消息
- `personal_sign` - 个人签名
- `eth_sendTransaction` - 发送交易
- `eth_getBalance` - 获取余额
- `wallet_addEthereumChain` - 添加自定义网络

### 默认网络
- 以太坊主网 (Chain ID: 0x1)
- Polygon 主网 (Chain ID: 0x89)

## 故障排除

### 扩展无法打开
1. 检查 manifest.json 是否包含 `default_popup` 配置
2. 确保 popup.html 和 popup.js 文件存在
3. 检查浏览器控制台是否有错误信息

### 无法连接网页
1. 确保 content script 正确注入
2. 检查 `window.ethereum` 对象是否存在
3. 查看浏览器控制台的错误信息

### 钱包功能异常
1. 检查 background script 是否正常运行
2. 确保密码已正确设置
3. 查看扩展的开发者工具控制台

## 开发说明

### 项目结构
```
src/
├── components/popup.tsx          # 弹窗界面
├── lib/
│   ├── wallet-service.ts        # 钱包服务
│   └── rpc-handler.ts           # RPC 处理器
├── contents/ethereum-inject.ts  # 注入 ethereum 对象
├── background/index.ts          # 后台脚本
└── assets/style.css             # 样式文件
```

### 开发命令
```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 打包扩展
pnpm package
```

### 调试技巧
1. 使用 Chrome 扩展的开发者工具
2. 检查 background script 的控制台
3. 在网页中检查 content script 的注入情况
4. 使用 `test-extension.html` 进行功能测试
