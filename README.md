# LangChain 监控Agent项目

## 简介

本项目使用 LangChain 和 LangGraph 构建一个监控系统，可以根据用户指令监控指定目标（如加密货币价格），并在达到阈值时发送通知。

## 功能

-   **自然语言指令解析**：使用 LangChain 解析用户输入的自然语言指令，提取监控目标信息。
-   **数据抓取**：从 API 抓取监控目标的数据。
-   **阈值比较**：将当前数据与用户设定的阈值进行比较。
-   **通知**：当数据达到阈值时，通过邮件发送通知。

## 技术栈

-   **LangChain**：用于构建 LLM 应用的框架。
-   **LangGraph**：用于构建基于图的 LLM 应用。
-   **OpenAI**：LLM 模型。
-   **Nodemailer**：用于发送邮件。
-   **Zod**：用于数据验证。
-   **dotenv**：用于管理环境变量。


## 环境变量

需要在 `.env` 文件中配置以下环境变量：

-   `OPENAI_API_KEY`：OpenAI API 密钥。
-   `NINJA_API_KEY`：API-Ninjas API 密钥。
-   `SMTP_USER`：SMTP 用户名（邮箱地址）。
-   `SMTP_PASS`：SMTP 密码或授权码。

## 使用方法

1.  **安装依赖**

    ```bash
    npm install
    ```

2.  **配置环境变量**

    创建 `.env` 文件，并配置所需的环境变量。

3.  **运行监控任务**

    ```bash
    npm run start
    ```

## 流程说明

1.  **解析用户指令**：`planAgent.ts` 使用 LangChain 解析用户输入的自然语言指令，提取监控目标信息。
2.  **数据抓取**：`fetchAgent.ts` 使用 `fetchTool.ts` 从 API 抓取监控目标的数据。
3.  **阈值比较**：`comparatorAgent.ts` 将当前数据与用户设定的阈值进行比较。
4.  **通知**：当数据达到阈值时，`notifyAgent.ts` 使用 `notifyTool.ts` 通过邮件发送通知。
5.  **监控图**：`monitorGraph.ts` 定义了整个监控流程的图结构，使用 LangGraph 进行编排。
6.  **启动任务**：`index.ts` 启动监控任务，并执行监控流程。

## 贡献

欢迎参与项目贡献！

## License

MIT
