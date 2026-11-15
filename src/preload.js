const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bsma', {
  getSession: () => ipcRenderer.invoke('auth:getSession'),
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  switchAccount: (username) => ipcRenderer.invoke('auth:switchAccount', { username }),
  logout: (mode = 'signout') => ipcRenderer.invoke('auth:logout', { mode }),
  forgetAccount: (username) => ipcRenderer.invoke('auth:forgetAccount', { username }),
  fetchAll: () => ipcRenderer.invoke('portal:fetchAll'),
  fetchSubjectDetails: (resultId) => ipcRenderer.invoke('portal:fetchSubjectDetails', resultId),
  getSyllabus: (bookId, forceRefresh = false) =>
    ipcRenderer.invoke('syllabus:getParsed', { bookId, forceRefresh }),
  scanSyllabuses: (bookIds) => ipcRenderer.invoke('syllabus:scanMany', bookIds),
  downloadSyllabus: (bookId, suggestedName) =>
    ipcRenderer.invoke('syllabus:download', { bookId, suggestedName }),
  openSyllabusPdf: (bookId) => ipcRenderer.invoke('syllabus:openPdf', bookId),
  pickBackgroundImage: () => ipcRenderer.invoke('theme:pickBackgroundImage'),
  notify: (title, body) => ipcRenderer.invoke('notify:show', { title, body }),
});
