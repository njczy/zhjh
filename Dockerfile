# -------------------------
# ---- 1. 构建阶段 ----
# -------------------------
# 使用官方的 Node.js 20 镜像作为基础构建环境
FROM node:20-slim AS builder

# 设置工作目录
WORKDIR /app

# 禁用 Next.js 的遥测数据收集
ENV NEXT_TELEMETRY_DISABLED 1

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
# 使用 --frozen-lockfile 确保安装的依赖版本与 lock 文件一致
RUN pnpm install --frozen-lockfile

# 复制项目的其余文件
COPY . .

# 执行构建命令
RUN pnpm build

# -------------------------
# ---- 2. 运行阶段 ----
# -------------------------
# 使用另一个轻量的 Node.js 20 镜像作为最终运行环境
FROM node:20-slim AS runner

# 设置工作目录
WORKDIR /app

# 禁用 Next.js 的遥测数据收集
ENV NEXT_TELEMETRY_DISABLED 1

# 设置 Node.js 运行环境为 production
ENV NODE_ENV production

# 从构建阶段复制构建产物
# 1. 复制 standalone 目录 (修正路径：从 .next/standalone 复制)
COPY --from=builder /app/.next/standalone ./
# 2. 复制 public 目录
COPY --from=builder /app/public ./public
# 3. 复制 .next/static 目录 (修正路径：从 .next/static 复制)
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口 3000
EXPOSE 3000

# 设置容器启动时执行的命令
# 启动位于 standalone 目录下的 server.js
CMD ["node", "server.js"] 