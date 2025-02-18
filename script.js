const fileList = document.getElementById('file-list');
const newFileBtn = document.getElementById('new-file');
const fileNameInput = document.getElementById('file-name');

// 获取按钮和侧边栏元素
const toggleButton = document.getElementById('toggle-sidebar');
const sidebar = document.querySelector('.sidebar');

toggleButton.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
  if (sidebar.classList.contains('hidden')) {
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
  } else {
    toggleButton.innerHTML = '<i class="fas fa-times"></i>';
  }
});
let currentFileId = null; // 当前选中的文件 ID
let currentAiMessageId = null;//对话id



document.addEventListener("DOMContentLoaded", function () {
    // 配置 marked.js
    marked.setOptions({
        highlight: function (code, language) {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        // 禁用 $ 符号的 Markdown 处理
        mangle: false,
        headerIds: false
    });
    // 初始化 highlight.js
    hljs.highlightAll();

    
    // 获取聊天框和输入框
    const chatBox = document.getElementById("chat-box");


    /////////////////////////////////////////////////////////////////////////////////////////////////
 
     	  
    // 加载文件列表
function loadFileList() {
  fileList.innerHTML = '';
  const files = Object.keys(localStorage).filter(key => key.startsWith('file-'));
  files.forEach(fileId => {
    const li = document.createElement('li');
    li.textContent = fileId.replace('file-', '');
    li.dataset.fileId = fileId;
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.classList.add('delete-file');
    
    deleteBtn.dataset.fileId = fileId; // 存储文件 ID
    // 将删除按钮添加到列表项中
    li.appendChild(deleteBtn);
    
    li.addEventListener('click', () => selectFile(fileId));

    fileList.appendChild(li);
  });
}



let conversationHistory = [];

function selectFile(fileId) {
  currentFileId = fileId; // 设置当前选中的文件 ID
  const content = localStorage.getItem(fileId); // 获取文件内容
  const history = document.createElement("div");
  const Rendered = marked.parse(content || ''); // 渲染 Markdown
  conversationHistory = [];
  conversationHistory.push({role:'user',content:content});
  history.innerHTML = Rendered;
  // 新增代码：高亮动态生成的代码块
  history.querySelectorAll('pre code').forEach((block) => {
  // 添加基础高亮类
  block.classList.add('hljs');
  // 执行高亮
  hljs.highlightElement(block);
  });
  chatBox.innerHTML = ''; // 清空预览区
  chatBox.appendChild(history);
  //mathjax
  if (window.MathJax) {
            window.MathJax.typesetPromise([history]);
        }

  // 重置 aiMessageDiv 状态
  currentAiMessageId = null; // 不存在currentAiMessageId
  // 高亮选中的文件
  const items = fileList.querySelectorAll('li');
  items.forEach(item => item.classList.remove('active'));
  const selectedItem = fileList.querySelector(`li[data-file-id="${fileId}"]`);
  if (selectedItem) {
    selectedItem.classList.add('active');
  }
}
    // 初始化：加载文件列表
	  loadFileList();


// 新建文件
newFileBtn.addEventListener('click', () => {
  const fileName = fileNameInput.value.trim(); // 获取文件名
  if (fileName) {
    const fileId = `file-${fileName}`; // 生成文件 ID
    if (!localStorage.getItem(fileId)) { // 检查文件是否已存在
      localStorage.setItem(fileId, ''); // 创建空文件
      currentFileId = fileId; // 设置当前选中的文件 ID
      //input.value = ''; // 清空编辑器
      chatBox.innerHTML = ''; // 清空预览区
      fileNameInput.value = ''; // 清空文件名输入框
      loadFileList(); // 刷新文件列表
      selectFile(fileId); // 自动选中新文件
    } else {
      alert('文件名已存在！');
    }
  } else {
    alert('请输入文件名！');
  }
});

// 监听删除按钮的点击事件
document.addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-file')) { // 检查是否点击了删除按钮
    const fileId = event.target.dataset.fileId; // 获取文件 ID
    if (fileId && confirm('确定要删除此文件吗？')) { // 确认删除操作
      localStorage.removeItem(fileId); // 从 localStorage 中删除文件
      if (currentFileId === fileId) { // 如果删除的是当前选中的文件
        currentFileId = null; // 清空当前选中的文件 ID
        //input.value = ''; // 清空编辑器
        chatBox.innerHTML = ''; // 清空预览区
      }
      loadFileList(); // 刷新文件列表
    }
  }
});


const saveButton = document.getElementById('save-button');

// 保存功能
saveButton.addEventListener('click', () => {
  if (currentFileId){
  // 获取 chatBox 中的 HTML 内容
  const htmlContent = chatBox.innerHTML;
  

  // 将内容保存到 localStorage
  localStorage.setItem(currentFileId, htmlContent);

  // 提示用户保存成功
  alert('内容已保存到 localStorage！');
  loadFileList();
  }
  else{
    alert('文件名不能为空')
  }
});


///////////////////////////////////////////////////////////////////////////////////////


    
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-btn");


    // 添加用户消息到聊天框
    function appendMessage(content, role = "user") {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(role);

        // 在用户消息前添加 'user:' 前缀
        if (role === "user") {
            messageDiv.textContent = `你: ${content}`;
        } else {
            messageDiv.textContent = content; // AI 消息由 updateAIMessage 处理
        }
        currentAiMessageId = null;
        chatBox.appendChild(messageDiv);  // 将新消息添加到聊天框，不清空之前的内容
        chatBox.scrollTop = chatBox.scrollHeight;  // 滚动到最底部
    }

    // 更新 AI 回复内容
    function updateAIMessage(content, reasoningContent = "") {
        let aiMessageDiv = chatBox.querySelector(`#${currentAiMessageId}`); // 根据 id 查找当前活动的 aiMessageDiv
        if (!aiMessageDiv) {
            // 如果没有 AI 消息，则创建一个新的
            aiMessageDiv = document.createElement("div");
            aiMessageDiv.id = `ai-message-${Date.now()}`; // 使用时间戳生成唯一 id
            aiMessageDiv.classList.add("ai");
            currentAiMessageId = aiMessageDiv.id;
            chatBox.appendChild(aiMessageDiv);
        }

        
        // 在 AI 消息前添加 'ai:' 前缀
        let finalContent = `AI: `;

        // 如果有 reasoning 内容，则添加 <reasoning> 标识，并在前后换行
        if (reasoningContent) {
            finalContent += `\n&lt;reasoning&gt;\n${reasoningContent}\n&lt;reasoning&gt;\n`;
        }

        // 添加 content 内容
        finalContent += content;

        // 使用 marked 渲染 Markdown
        const renderedContent = marked.parse(finalContent);

        // 使用 innerHTML 插入渲染后的内容
        aiMessageDiv.innerHTML = renderedContent;

        // 新增代码：高亮动态生成的代码块
        aiMessageDiv.querySelectorAll('pre code').forEach((block) => {
        // 移除可能的旧高亮
        block.classList.remove('hljs');
        // 添加基础高亮类
        block.classList.add('hljs');
        // 执行高亮
        hljs.highlightElement(block);
          
        // 可选：添加语言类名
        const language = block.className.match(/language-(\w+)/)?.[1];
        if (language && hljs.getLanguage(language)) {
              block.classList.add(`language-${language}`);
          }
      });

        // 重新渲染 MathJax 公式
        if (window.MathJax) {
            window.MathJax.typesetPromise([aiMessageDiv]);
        }

        chatBox.scrollTop = chatBox.scrollHeight;  // 滚动到最底部
    }


    // 发送请求并处理流式数据
    function sendMessage() {
        // 在用户点击 sendButton 后读取输入框的值
        const usertoken = document.getElementById("key").value;
        const modelname = document.getElementById("model").value;
        const maxnum = Number(document.getElementById("maxtoken").value); // 获取输入框的值并转换为数字
        const messageContent = userInput.value.trim();
        console.log('token',usertoken)
        console.log('model',modelname)
        console.log('num_tokens',maxnum)

        if (!messageContent) return;

        const url = "https://api.siliconflow.cn/v1/chat/completions";
        const headers = {
            "Authorization": `Bearer ${usertoken}`, // 使用模板字符串
            "Content-Type": "application/json"
        };

        // 添加用户消息到对话历史
        conversationHistory.push({ role: "user", content: messageContent });

        appendMessage(messageContent, "user");
        userInput.value = "";  // 清空输入框

        const payload = {
            model: `${modelname}`,
            messages: conversationHistory, // 发送完整的对话历史
            stream: true,
            max_tokens: maxnum
        };

        fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let aiResponse = "";  // 存储 AI 回复的内容
            let aiReasoning = ""; // 存储 AI 的 reasoning 内容

            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // 流式响应结束，将 AI 回复添加到对话历史
                        conversationHistory.push({ role: "assistant", content: aiResponse });
                        console.log("Stream complete");
                        return;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");
                    lines.forEach(line => {
                        if (line.startsWith("data: ")) {
                            if (line === "data: [DONE]") {
                                reader.cancel();
                                return;
                            }

                            try {
                                const jsonString = line.slice(6); // 去掉 "data: "
                                const data = JSON.parse(jsonString);
                                if (data.choices && data.choices[0].delta.content !== undefined) {
                                    const content = data.choices[0].delta.content;
                                    const reasoning = data.choices[0].delta.reasoning_content;

                                    // 累积 AI 回复的内容
                                    if (reasoning) {
                                        aiReasoning += reasoning;
                                    }
                                    if (content) {
                                        aiResponse += content;
                                    }

                                    // 更新 AI 回复内容
                                    updateAIMessage(aiResponse, aiReasoning);
                                }
                            } catch (error) {
                                console.error("Invalid JSON:", line);
                            }
                        }
                    });

                    readStream();  // 继续读取流
                }).catch(error => {
                    console.error("Error reading stream:", error);
                });
            }

            readStream();  // 开始读取流
        })
        .catch(error => {
            console.error("Fetch error:", error);
        });
    }

    // 监听发送按钮点击事件
    sendButton.addEventListener("click", sendMessage);

    // 监听回车键发送消息
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
});
