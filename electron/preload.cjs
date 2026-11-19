const { contextBridge, ipcRenderer } = require("electron");

/**
 * 预加载脚本（CommonJS）：把主进程能力安全地暴露给渲染进程（contextIsolation 开启）。
 * 渲染层通过 window.whaleArchive / window.whaleAPI 访问文件系统存档与大模型请求。
 */
contextBridge.exposeInMainWorld("whaleArchive", {
    loadAll: () => ipcRenderer.invoke("archive:loadAll"),
    append: (message) => ipcRenderer.invoke("archive:append", message),
    reset: () => ipcRenderer.invoke("archive:reset"),
    replaceAll: (messages) => ipcRenderer.invoke("archive:replaceAll", messages),
    loadAllMemories: () => ipcRenderer.invoke("memory:loadAll"),
    saveMemories: (memories) => ipcRenderer.invoke("memory:save", memories),
    sealSave: (payload) => ipcRenderer.invoke("archive:seal-save", payload),
    sealLoadAll: () => ipcRenderer.invoke("archive:seal-load-all"),
    sealManifest: () => ipcRenderer.invoke("archive:seal-manifest"),
    hiddenProgressLoad: () => ipcRenderer.invoke("hidden-progress:load"),
    hiddenProgressSave: (progress) => ipcRenderer.invoke("hidden-progress:save", progress),
});

contextBridge.exposeInMainWorld("whaleAPI", {
    chat: (payload) => ipcRenderer.invoke("api:chat", payload),
});