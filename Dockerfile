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

# 在构建阶段，就将所有必要文件整合到 standalone 目录中
# 这种"先打包，再复制"的方式更健壮，可以避免最终阶段找不到文件的问题
RUN cp -r ./public ./.next/standalone/public
RUN cp -r ./.next/static ./.next/standalone/.next/static

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

# 从构建阶段复制已经准备好的、包含所有产物的 standalone 目录
COPY --from=builder /app/.next/standalone ./

# 暴露端口 3000
EXPOSE 3000

# 设置容器启动时执行的命令
# 启动位于 standalone 目录下的 server.js
CMD ["node", "server.js"] 